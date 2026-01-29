/**
 * Crear cuenta Premium vía backend (solo si el pago es exitoso).
 * Usa VITE_API_URL o http://localhost:4000 por defecto.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function getJSON(res) {
  return res.json().catch(() => ({}))
}

/**
 * Registra usuario y activa Premium.
 * Solo llamar cuando el pago haya sido exitoso.
 * @param {{ email: string, password: string }} params
 * @returns {Promise<{ user: { id: string, email: string }, token: string }>}
 */
export async function createPremiumAccount({ email, password }) {
  const trimEmail = String(email || '').trim().toLowerCase()
  if (!trimEmail || !password) {
    throw new Error('Email y contraseña son requeridos.')
  }
  if (password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.')
  }

  const registerRes = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: trimEmail, password })
  })
  const registerData = await getJSON(registerRes)
  if (!registerRes.ok) {
    throw new Error(registerData?.error || 'Error al crear la cuenta.')
  }
  const token = registerData?.token
  if (!token) {
    throw new Error('Error al crear la cuenta.')
  }

  const premiumRes = await fetch(`${API_BASE}/api/premium/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
  const premiumData = await getJSON(premiumRes)
  if (!premiumRes.ok) {
    throw new Error(premiumData?.error || 'Error al activar Premium.')
  }

  return { user: registerData.user, token }
}
