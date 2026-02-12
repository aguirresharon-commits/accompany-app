# Guía de deploy – Control

Checklist para dejar la app lista para producción.

---

## 1. Variables de entorno

### Frontend (raíz del proyecto)

Crear `.env` en la raíz (o configurar en Vercel/Netlify):

| Variable | Descripción | Ejemplo producción |
|----------|-------------|---------------------|
| `VITE_API_URL` | URL base del backend | `https://api.tuapp.com` |

Sin `VITE_API_URL` en desarrollo se usa `http://localhost:4000`.

### Backend (carpeta `server/`)

Copiar `server/.env.example` a `server/.env` y completar:

| Variable | Obligatorio | Descripción |
|----------|-------------|-------------|
| `MONGODB_URI` | Sí | URI de MongoDB (ej. Atlas) |
| `JWT_SECRET` | Sí | Cadena aleatoria larga (no la de ejemplo) |
| `PORT` | No | Puerto (default 4000) |
| `CORS_ORIGIN` | Sí en prod | URL del frontend, ej. `https://tuapp.com` |
| `FRONTEND_URL` | Sí en prod | Misma URL del frontend (redirects, Stripe, etc.) |
| `STRIPE_SECRET_KEY` | Sí para Premium | `sk_live_xxx` en producción |
| `STRIPE_PRICE_WEEKLY` | Sí para Premium | ID del precio recurrente semanal |
| `STRIPE_PRICE_MONTHLY` | Sí para Premium | ID del precio recurrente mensual |
| `STRIPE_WEBHOOK_SECRET` | Sí para Premium | `whsec_xxx` del webhook de producción |

**Email (recuperar contraseña):**

| Variable | Descripción |
|----------|-------------|
| `RESET_PASSWORD_LINK_BASE` | URL pública del frontend (ej. `https://tuapp.com`) |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, … | Ver `server/.env.example` |

**Google OAuth (opcional):**

| Variable | Descripción |
|----------|-------------|
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Credenciales de la consola de Google |
| `GOOGLE_REDIRECT_URI` | `https://api.tuapp.com/api/auth/google/callback` |
| `FRONTEND_URL` | URL del frontend |

---

## 2. Backend

1. **Hosting**: Railway, Render, Fly.io, etc.
2. **Base de datos**: MongoDB Atlas (o otro).
3. **Variables**: Configurar todas las de la tabla anterior en el panel del hosting.
4. **Webhook Stripe**: En producción, en [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks) agregar:
   - URL: `https://api.tuapp.com/api/premium/webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copiar el “Signing secret” a `STRIPE_WEBHOOK_SECRET`.

---

## 3. Frontend

1. **Hosting**: Vercel o Netlify (recomendado para Vite).
2. **Build**: `npm run build`; directorio de salida: `dist`.
3. **Variable**: `VITE_API_URL` = URL del backend (ej. `https://api.tuapp.com`).

---

## 4. Comprobaciones antes de lanzar

- [ ] Backend responde en `GET /health` (y reporta DB conectada).
- [ ] Frontend en producción carga y llama al backend (sin CORS).
- [ ] Registro e inicio de sesión funcionan.
- [ ] Recuperar contraseña: email llega y el link abre la app.
- [ ] Premium: checkout Stripe redirige bien; tras pagar, el usuario queda Premium.
- [ ] Webhook de Stripe en producción recibe eventos (y no hay errores 500).
- [ ] Cerrar sesión no borra el progreso local (el usuario sigue viendo sus datos hasta que inicie sesión con otra cuenta).

---

## 5. Stripe en producción

1. Crear productos y precios recurrentes (semanal y mensual) en [Stripe Dashboard](https://dashboard.stripe.com/products).
2. Usar claves **live** (`sk_live_...`, `price_...` de modo live).
3. Configurar el webhook de producción (ver punto 2).
4. Probar un pago real con una tarjeta de test en modo live (o con un monto bajo).
