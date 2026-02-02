/**
 * Envío de emails (restablecimiento de contraseña, etc.).
 * Si no hay SMTP configurado, las funciones no envían y no fallan.
 */
import nodemailer from 'nodemailer'

const RESET_LINK_BASE = (process.env.RESET_PASSWORD_LINK_BASE || '').trim()
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587
const SMTP_SECURE = process.env.SMTP_SECURE === 'true'
const SMTP_USER = process.env.SMTP_USER
// Gmail app passwords suelen pegarse con espacios; quitar para evitar fallos de auth
const SMTP_PASS = typeof process.env.SMTP_PASS === 'string' ? process.env.SMTP_PASS.replace(/\s/g, '') : process.env.SMTP_PASS

let transporter = null

function getTransporter() {
  if (transporter) {
    return transporter
  }
  const missing = []
  if (!SMTP_HOST) missing.push('SMTP_HOST')
  if (!SMTP_USER) missing.push('SMTP_USER')
  if (!SMTP_PASS) missing.push('SMTP_PASS')
  if (missing.length > 0) {
    console.warn('[email] Transporter no creado: faltan variables de entorno:', missing.join(', '))
    return null
  }
  console.log('[email] SMTP config al crear transporter: host=%s port=%s user=%s linkBase=%s', SMTP_HOST, SMTP_PORT, SMTP_USER, (RESET_LINK_BASE || '').trim() || '(vacío)')
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  })
  return transporter
}

/**
 * Envía el email con el link para restablecer contraseña.
 * @param {string} to - Email del usuario
 * @param {string} token - Token de restablecimiento
 * @returns {Promise<boolean>} true si se envió, false si no hay SMTP o falló
 */
export async function sendPasswordResetEmail(to, token) {
  console.log('[email] sendPasswordResetEmail llamado: to=%s', to)
  const trans = getTransporter()
  if (!trans) {
    console.warn('[email] Envío omitido: no hay transporter (SMTP no configurado o variables faltantes)')
    return false
  }
  const linkBase = (RESET_LINK_BASE || '').trim()
  const resetLink = linkBase ? `${linkBase.replace(/\/$/, '')}?token=${encodeURIComponent(token)}` : null
  if (resetLink) {
    console.log('[email] Link de restablecimiento generado: %s', resetLink.replace(token, '<token>'))
  } else {
    console.log('[email] RESET_PASSWORD_LINK_BASE vacío: se enviará solo el token en el cuerpo del correo')
  }
  const linkLine = resetLink ? `Abrí este enlace para elegir una nueva contraseña (válido 1 hora):\n${resetLink}` : `Tu código para restablecer la contraseña (válido 1 hora):\n${token}\n\nSi la app tiene URL configurada, también podés usar el enlace que te enviamos.`
  try {
    console.log('[email] Enviando correo a %s...', to)
    await trans.sendMail({
      from: process.env.SMTP_FROM || SMTP_USER,
      to,
      subject: 'Control – Restablecer contraseña',
      text: `Hola,\n\nPediste restablecer la contraseña de tu cuenta en Control.\n\n${linkLine}\n\nSi no pediste esto, ignorá este correo.\n\n— Control`
    })
    console.log('[email] Correo enviado correctamente a %s', to)
    return true
  } catch (err) {
    console.error('[email] Error al enviar correo:', err.message || err)
    return false
  }
}
