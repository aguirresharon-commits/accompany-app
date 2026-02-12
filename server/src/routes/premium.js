import { Router } from 'express'
import crypto from 'crypto'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { authMiddleware } from '../middleware/auth.js'
import User from '../models/User.js'
import State from '../models/State.js'
import Subscription from '../models/Subscription.js'

const router = Router()

const mpAccessToken = process.env.MP_ACCESS_TOKEN?.trim()
const mpWebhookBaseUrl = process.env.MP_WEBHOOK_BASE_URL?.trim()
const mpWebhookSecret = process.env.MP_WEBHOOK_SECRET?.trim()
const frontendUrl = process.env.FRONTEND_URL?.trim() || 'http://localhost:5173'

const MP_PRICE_WEEKLY_ARS = Number(process.env.MP_PRICE_WEEKLY_ARS) || 299
const MP_PRICE_MONTHLY_ARS = Number(process.env.MP_PRICE_MONTHLY_ARS) || 999
const MP_PRICE_ANNUAL_ARS = Number(process.env.MP_PRICE_ANNUAL_ARS) || 7999

const PLAN_CONFIG = {
  weekly: { frequency: 7, frequency_type: 'days', amount: MP_PRICE_WEEKLY_ARS, reason: 'Control Premium Semanal' },
  monthly: { frequency: 1, frequency_type: 'months', amount: MP_PRICE_MONTHLY_ARS, reason: 'Control Premium Mensual' },
  annual: { frequency: 12, frequency_type: 'months', amount: MP_PRICE_ANNUAL_ARS, reason: 'Control Premium Anual' }
}

const VALID_PLAN_TYPES = ['weekly', 'monthly', 'annual']
const MP_ACTIVE_STATUS = 'authorized'
const MP_BLOCK_STATUS = 'past_due'
const MP_INACTIVE_STATUSES = ['paused', 'cancelled']

let mpClient = null
let preApprovalApi = null
if (mpAccessToken) {
  mpClient = new MercadoPagoConfig({ accessToken: mpAccessToken })
  preApprovalApi = new PreApproval(mpClient)
}

/**
 * GET /api/premium
 * Devuelve { premium, plan, currentPeriodEnd, pastDue }.
 * premium = true solo si status === 'authorized' y currentPeriodEnd > now.
 * pastDue = true si status === 'past_due' (bloquear acceso).
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('userPlan email').lean()
    const sub = await Subscription.findOne({ userId: req.userId }).lean()
    const now = new Date()

    if (!sub) {
      const legacyPremium = user?.userPlan === 'premium'
      return res.json({
        premium: Boolean(legacyPremium),
        plan: null,
        currentPeriodEnd: null,
        pastDue: false,
        cancelAtPeriodEnd: false
      })
    }

    const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null
    const isAuthorized = sub.status === MP_ACTIVE_STATUS
    const isPastDue = sub.status === MP_BLOCK_STATUS
    const premium = isAuthorized && periodEnd && periodEnd > now

    return res.json({
      premium: Boolean(premium),
      plan: sub.planType || null,
      currentPeriodEnd: periodEnd ? periodEnd.toISOString() : null,
      pastDue: Boolean(isPastDue),
      cancelAtPeriodEnd: false
    })
  } catch (err) {
    console.error('GET /api/premium error:', err)
    return res.status(500).json({ error: 'Error al obtener premium' })
  }
})

/**
 * POST /api/premium/create-subscription
 * Body: { email?, planType }
 * Crea la suscripción en Mercado Pago (Preapproval) y devuelve init_point.
 * userId se toma del JWT.
 */
router.post('/create-subscription', authMiddleware, async (req, res) => {
  try {
    if (!preApprovalApi) {
      return res.status(503).json({ error: 'El pago no está configurado. Contactá soporte.' })
    }

    const planType = req.body?.planType
    if (!planType || !VALID_PLAN_TYPES.includes(planType)) {
      return res.status(400).json({ error: 'Plan inválido. Elegí semanal, mensual o anual.' })
    }

    const config = PLAN_CONFIG[planType]
    if (!config || config.amount <= 0) {
      return res.status(503).json({ error: 'Plan no configurado en el servidor.' })
    }

    let email = req.body?.email
    if (!email || typeof email !== 'string') {
      const user = await User.findById(req.userId).select('email').lean()
      email = user?.email
    }
    email = String(email).trim().toLowerCase()
    if (!email) {
      return res.status(400).json({ error: 'Falta el email. Enviá email en el body o asegurate de tenerlo en tu cuenta.' })
    }

    const existing = await Subscription.findOne({ userId: req.userId })
    const now = new Date()
    if (existing && existing.currentPeriodEnd && new Date(existing.currentPeriodEnd) > now && existing.status === MP_ACTIVE_STATUS) {
      return res.status(400).json({ error: 'Ya tenés Premium activo. No podés iniciar otra suscripción.' })
    }

    const baseUrl = frontendUrl.replace(/\/$/, '')
    const backUrl = `${baseUrl}/?premium=success`
    const notificationUrl = mpWebhookBaseUrl
      ? `${mpWebhookBaseUrl.replace(/\/$/, '')}/api/premium/webhook`
      : undefined

    const startDate = new Date()
    startDate.setMinutes(startDate.getMinutes() - startDate.getTimezoneOffset())
    const body = {
      reason: config.reason,
      external_reference: req.userId.toString(),
      payer_email: email,
      auto_recurring: {
        frequency: config.frequency,
        frequency_type: config.frequency_type,
        transaction_amount: config.amount,
        currency_id: 'ARS',
        start_date: startDate.toISOString(),
        free_trial: { frequency: 2, frequency_type: 'days' }
      },
      back_url: backUrl
    }
    if (notificationUrl) body.notification_url = notificationUrl

    const response = await preApprovalApi.create({ body })

    if (!response || !response.id) {
      const message = response?.message || response?.error || 'Mercado Pago no devolvió suscripción.'
      console.error('[premium] create-subscription MP error:', response)
      return res.status(502).json({ error: message })
    }

    const initPoint = response.init_point
    if (!initPoint) {
      console.error('[premium] create-subscription sin init_point:', response)
      return res.status(502).json({ error: 'No se pudo generar el link de pago.' })
    }

    const nextPayment = response.next_payment_date || response.auto_recurring?.start_date
    const currentPeriodEnd = nextPayment ? new Date(nextPayment) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)

    await Subscription.findOneAndUpdate(
      { userId: req.userId },
      {
        $set: {
          userId: req.userId,
          mpSubscriptionId: response.id,
          planType,
          status: (response.status || 'pending').toLowerCase(),
          currentPeriodEnd
        }
      },
      { upsert: true, new: true }
    )

    return res.json({ init_point: initPoint })
  } catch (err) {
    console.error('POST /api/premium/create-subscription error:', err)
    const message = err?.message || err?.cause?.message || 'Error al crear suscripción.'
    return res.status(500).json({ error: message })
  }
})

/**
 * POST /api/premium/webhook
 * Webhook de Mercado Pago (type=preapproval). NO usa authMiddleware.
 * Debe montarse con body raw para validar firma (x-signature).
 */
export async function mercadopagoWebhookHandler(req, res) {
  const body = req.body
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Body inválido' })
  }

  const type = body.type
  if (type !== 'preapproval') {
    return res.status(200).json({ received: true })
  }

  const dataId = body.data?.id ?? req.query?.['data.id']
  if (!dataId) {
    console.warn('[premium] Webhook preapproval sin data.id')
    return res.status(400).json({ error: 'Falta data.id' })
  }

  if (mpWebhookSecret) {
    const xSignature = req.headers['x-signature']
    const xRequestId = req.headers['x-request-id'] || ''
    if (!xSignature) {
      console.warn('[premium] Webhook sin x-signature')
      return res.status(401).json({ error: 'Falta firma' })
    }
    const parts = xSignature.split(',')
    let ts = ''
    let hash = ''
    for (const part of parts) {
      const [key, value] = part.split('=').map(s => s?.trim())
      if (key === 'ts') ts = value || ''
      if (key === 'v1') hash = value || ''
    }
    const manifest = `id:${String(dataId).toLowerCase()};request-id:${xRequestId};ts:${ts};`
    const hmac = crypto.createHmac('sha256', mpWebhookSecret)
    hmac.update(manifest)
    const computed = hmac.digest('hex')
    if (computed !== hash) {
      console.warn('[premium] Webhook firma inválida')
      return res.status(401).json({ error: 'Firma inválida' })
    }
  }

  try {
    if (!preApprovalApi) {
      console.warn('[premium] Webhook: MP no configurado')
      return res.status(503).json({ error: 'Webhook no configurado' })
    }

    const mpSub = await preApprovalApi.get({ id: dataId })
    if (!mpSub || !mpSub.id) {
      console.warn('[premium] Webhook: no se encontró preapproval', dataId)
      return res.status(200).json({ received: true })
    }

    const status = (mpSub.status || '').toLowerCase()
    const allowedStatuses = ['pending', 'authorized', 'paused', 'cancelled', 'past_due']
    const statusToSave = allowedStatuses.includes(status) ? status : 'pending'

    const nextPayment = mpSub.next_payment_date
    const currentPeriodEnd = nextPayment ? new Date(nextPayment) : new Date()

    const externalRef = mpSub.external_reference || ''
    const userId = externalRef.toString()

    if (!userId) {
      console.warn('[premium] Webhook: preapproval sin external_reference')
      return res.status(200).json({ received: true })
    }

    const existing = await Subscription.findOne({ mpSubscriptionId: mpSub.id }).lean()
    const planType = existing?.planType || 'monthly'

    await Subscription.findOneAndUpdate(
      { mpSubscriptionId: mpSub.id },
      {
        $set: {
          userId: existing?.userId || userId,
          mpSubscriptionId: mpSub.id,
          planType,
          status: statusToSave,
          currentPeriodEnd
        }
      },
      { upsert: true, new: true }
    )

    if (statusToSave === MP_ACTIVE_STATUS) {
      await setUserPremium(userId, true)
      console.log('[premium] Usuario', userId, 'Premium activado (authorized)')
    } else if (MP_INACTIVE_STATUSES.includes(statusToSave) || statusToSave === MP_BLOCK_STATUS) {
      await setUserPremium(userId, false)
      console.log('[premium] Usuario', userId, 'Premium desactivado (', statusToSave, ')')
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('[premium] Webhook error:', err)
    return res.status(500).json({ error: 'Error interno' })
  }
}

/**
 * POST /api/premium/cancel
 * Cancela la suscripción en Mercado Pago (status cancelled).
 */
router.post('/cancel', authMiddleware, async (req, res) => {
  try {
    if (!preApprovalApi) {
      return res.status(503).json({ error: 'Sistema de pago no configurado.' })
    }

    const sub = await Subscription.findOne({ userId: req.userId })
    if (!sub || !sub.mpSubscriptionId) {
      return res.status(400).json({ error: 'No tenés una suscripción activa para cancelar.' })
    }

    const now = new Date()
    if (new Date(sub.currentPeriodEnd) <= now) {
      return res.status(400).json({ error: 'Tu suscripción ya venció.' })
    }

    await preApprovalApi.update({
      id: sub.mpSubscriptionId,
      body: { status: 'cancelled' }
    })

    await Subscription.updateOne(
      { userId: req.userId },
      { $set: { status: 'cancelled' } }
    )
    await setUserPremium(req.userId.toString(), false)

    return res.json({
      ok: true,
      message: 'Suscripción cancelada.',
      currentPeriodEnd: sub.currentPeriodEnd
    })
  } catch (err) {
    console.error('POST /api/premium/cancel error:', err)
    return res.status(500).json({ error: 'Error al cancelar' })
  }
})

async function setUserPremium(userId, premium) {
  const userPlan = premium ? 'premium' : 'free'
  await User.findByIdAndUpdate(userId, { $set: { userPlan } })
  await State.findOneAndUpdate(
    { userId },
    { $set: { userPlan, userId } },
    { upsert: true, new: true }
  )
}

export default router
