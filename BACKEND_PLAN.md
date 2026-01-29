# Plan de desarrollo del backend – Control (accompany-app)

## 1. Resumen del análisis

### 1.1 Estado actual del frontend (no se alterará)

- **React + Vite** en `src/`. Persistencia actual:
  - **`control-app-state`** (localStorage): estado global (nivel de energía, `completedActions`, `allActions`, `streak`, `history`, `sounds`, `userPlan`, etc.). Ver `AppContext` + `utils/storage.js`.
  - **`control-app-reminders`** (localStorage): recordatorios. Ver `services/remindersService.js`.
  - **`control-app-premium`** (localStorage): `{ [uid]: boolean }` por usuario. Ver `services/premiumService.ts`.
- Diseño, lógica y UI se mantienen **sin cambios**. Solo se añade el backend.

### 1.2 Objetivo del backend

- **Node + Express** como API REST.
- **MongoDB** como única base de datos (cluster indicado). **Sin Firebase**.
- **Auth**: usuarios en MongoDB (email + contraseña), **JWT** para proteger rutas. El `userId` será el `_id` del usuario en MongoDB (o un identificador estable).
- Exponer endpoints que repliquen la persistencia actual (state, reminders, premium) **por usuario**.
- El frontend sigue usando localStorage; más adelante se podrá conectar a esta API sin tocar diseño ni flujos ya definidos.

---

## 2. Stack y configuración

| Componente | Elección |
|------------|----------|
| Runtime | Node.js |
| Framework | Express |
| Base de datos | MongoDB (cluster indicado) |
| ODM | Mongoose |
| Auth | JWT. Usuarios en MongoDB (email, password hasheado con bcrypt). |
| Variables de entorno | `dotenv`, archivo `.env` (no commitear) |

### 2.1 MongoDB

- **Cluster**: URI en variable `MONGODB_URI` (`.env`). Base de datos p. ej. `control` o `control-app`.
- Nunca hardcodear la URI en el código.

---

## 3. Modelos de datos (MongoDB)

### 3.1 Usuario (`User`)

- **Colección**: `users`.
- **Campos**: `email` (único), `password` (hash bcrypt), `createdAt`, `updatedAt`.
- **Auth**: `POST /api/auth/register`, `POST /api/auth/login` → devuelve JWT. El `userId` en el token será el `_id` del usuario.

### 3.2 Estado de la app (`State`)

- **Colección**: `states` (un documento por usuario).
- **Identificador**: `userId` (referencia a `users._id`).
- **Campos**: `userId`, `currentEnergyLevel`, `completedActions`, `allActions`, `currentAction`, `streak`, `history`, `lastResetDate`, `scheduledEnergyNextDay`, `sessionNotes`, `sounds`, `userPlan`, `updatedAt`.
- **Operaciones**: GET/PUT por `userId`.

### 3.3 Recordatorios (`Reminder`)

- **Colección**: `reminders`. **Campos**: `userId`, `id` (string único), `text`, `date`, `time`, `alarmEnabled`, `createdAt`, `firedAt`.
- **Operaciones**: CRUD + marcar `fired` por `userId`.

### 3.4 Premium

- Usar **`userPlan`** en State (Opción B). Endpoints `/api/premium` leen/escriben sobre el state del usuario.

---

## 4. API REST propuesta

Prefijo base: `/api`. Rutas que persisten datos requieren **Authorization: Bearer <JWT>**.

### 4.1 Auth (públicas)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Body: `{ email, password }`. Crea usuario, devuelve `{ user: { id, email }, token }`. |
| `POST` | `/api/auth/login` | Body: `{ email, password }`. Devuelve `{ user: { id, email }, token }`. |

### 4.2 Middleware de auth

- Verifica JWT en `Authorization: Bearer <token>`, extrae `userId`, lo asigna a `req.userId`.
- Rutas sin token válido → `401 Unauthorized`.

### 4.3 Estado (`/api/state`) – protegidas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/state` | Devuelve el estado del usuario. 404 si no existe. |
| `PUT` | `/api/state` | Crea o reemplaza el estado (body = mismo shape que `control-app-state`). |

### 4.4 Recordatorios (`/api/reminders`) – protegidas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/reminders` | Lista recordatorios del usuario. |
| `POST` | `/api/reminders` | Crea recordatorio. Body: `{ text, date, time, alarmEnabled }`. |
| `PATCH` | `/api/reminders/:id` | Actualiza recordatorio por `id`. |
| `DELETE` | `/api/reminders` | Body: `{ ids: string[] }`. Borra varios. |
| `POST` | `/api/reminders/:id/fired` | Marca `firedAt`. |

### 4.5 Premium (`/api/premium`) – protegidas

- `GET /api/premium` → `{ premium: boolean }` según `userPlan` del state.
- `POST /api/premium/activate` → actualiza `userPlan` a `'premium'` en el state.

### 4.6 Salud y CORS

- `GET /health` o `GET /` → comprobar API y MongoDB. Público.
- CORS configurado para el origen del frontend.

---

## 5. Estructura de carpetas del backend

```
server/
  .env                 # No commitear. MONGODB_URI, JWT_SECRET, etc.
  .env.example         # Plantilla sin secretos
  package.json
  src/
    index.js           # Entrada: Express app, listen
    config/
      db.js            # Conexión MongoDB
    middleware/
      auth.js          # Verificar JWT, asignar req.userId
    models/
      User.js
      State.js
      Reminder.js
    routes/
      auth.js          # /api/auth
      state.js         # /api/state
      reminders.js     # /api/reminders
      premium.js       # /api/premium
    utils/
      errors.js        # Manejo de errores HTTP
```

---

## 6. Tareas TODO (orden sugerido)

| # | Tarea | Descripción |
|---|--------|-------------|
| 1 | **Estructura base** | Crear `server/`, `package.json`, Express mínimo, estructura de carpetas. |
| 2 | **MongoDB** | Conexión al cluster, `MONGODB_URI` en `.env`, health check. |
| 3 | **Modelos** | Schemas Mongoose: `User`, `State`, `Reminder`. Índices. |
| 4 | **Auth middleware** | JWT: verificar Bearer token, asignar `req.userId`. Rutas `/api/auth` (register/login). Sin Firebase. |
| 5 | **Rutas /api/state** | GET/PUT `/api/state`. |
| 6 | **Rutas /api/reminders** | CRUD + `POST .../id/fired`. |
| 7 | **Rutas /api/premium** | GET premium, POST activate. |
| 8 | **CORS, errores y scripts** | CORS, manejo de errores global, `npm run dev` / `npm run start`. |

---

## 7. Seguridad y buenas prácticas

- Nunca commitear `.env`. Usar `JWT_SECRET` y `MONGODB_URI` en env.
- Contraseñas con bcrypt. JWT con expiración razonable.
- `helmet` y buenas prácticas Express en producción.
- Validar body en rutas cuando se implementen.

---

## 8. Próximos pasos

1. Ir tarea por tarea: revisar → confirmar → implementar.
2. Probar endpoints con Postman/Insomnia. Frontend sin modificar hasta que se decida conectar.
