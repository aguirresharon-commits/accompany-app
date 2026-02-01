# PLAN MVP – Control (accompany-app)

Documento de análisis y plan de acción para llevar la app a un MVP real listo para usuarios. Formato listo para copiar en Notion.

---

## 1. Estado actual del proyecto

### 1.1 Resumen ejecutivo

**Control** es una web app de hábitos por nivel de energía (Baja / Media / Alta), con timer, rachas, recordatorios, calendario y modelo Free/Premium. El frontend (React + Vite) funciona hoy **sin backend**: todo el estado y los recordatorios viven en **localStorage**. El backend (Node + Express + MongoDB) está **implementado** (auth JWT, rutas de state, reminders y premium) pero **no está conectado** al frontend: no hay llamadas a `/api/state` ni `/api/reminders`, y el cliente API no envía el token Bearer en las peticiones autenticadas.

- **Frontend**: React 18, Vite, CSS puro. Estado global en `AppContext` + `localStorage` (`control-app-state`). Recordatorios en `remindersService` (localStorage). Auth y Premium usan servicios que sí llaman al backend (login/register/premium) pero el estado de la app (tareas, racha, notas) nunca se sube ni se baja del servidor.
- **Backend**: Express, MongoDB (Mongoose), JWT, modelos User / State / Reminder, rutas `/api/auth`, `/api/state`, `/api/reminders`, `/api/premium`, middleware de auth, health check, CORS, script de seed.
- **Conclusión**: La app es usable en un solo dispositivo y sin cuenta; si el usuario inicia sesión, sus datos locales **no se sincronizan** con el backend, y el backend no se usa para state ni reminders.

### 1.2 Lo que ya está bien implementado

- [x] **Backend**
  - Auth: registro, login, JWT, bcrypt, middleware que exige Bearer token.
  - Modelos: User (email, password), State (por usuario, shape alineado con el frontend), Reminder (por usuario con `id` string).
  - Rutas: GET/PUT state, CRUD reminders + `fired`, GET premium, POST premium/activate.
  - Health check (`/health`) con estado de DB.
  - CORS configurable por env.
  - Script de seed (usuario de prueba Premium).
- [x] **Frontend**
  - Flujo: Welcome → selector de energía → ActionScreen (Progreso, Lista, Completadas hoy, Recordatorios, Ajustes).
  - Estado rico: nivel de energía, completedActions, allActions, streak, sessionNotes, sounds, userPlan, listPickUsedDate, scheduledEnergyNextDay.
  - Timer: TimeSelect → TimerView → TimerEndModal; notas (Premium); reducción de tarea.
  - Calendario mensual; detalle de día (Premium); recordatorios con alarmas y overlay en pantalla.
  - Login/Register vía backend (authService + apiFetch); CreatePremiumAccountScreen (registro + activar premium).
  - Premium: premiumService (localStorage por uid) + backend; límites free (ej. 2 recordatorios, timer presets).
  - Persistencia local: storage.js (getTodayDate, save/load/clear), migración de nivel de energía en AppContext.
  - PWA: manifest.json, iconos; diseño responsive.
  - Accesibilidad: roles, aria-label, teclado (Escape en modales).
  - Manejo de errores en login: timeout, mapeo de mensajes (conexión, contraseña, etc.).

### 1.3 Lo que falta para un MVP real

- **Sincronización estado y recordatorios con backend**
  - El frontend no llama a GET/PUT `/api/state` ni a GET/POST/PATCH/DELETE `/api/reminders`. Todo sigue en localStorage.
  - Sin esto, un usuario que inicia sesión en otro dispositivo o borra datos no recupera su progreso ni sus recordatorios.
- **Cliente API con token**
  - `apiFetch` no añade `Authorization: Bearer <token>`. Solo auth y createPremiumAccount envían el token manualmente. Cualquier integración de state/reminders debe usar un cliente que inyecte el token (y maneje 401/refresh si se implementa).
- **Consistencia Premium**
  - Tras login o “Crear cuenta Premium”, el backend sabe que el usuario es premium (`userPlan` en State), pero `AppContext.userPlan` no se actualiza desde el backend (no se llama `setUserPlan('premium')` ni se hace GET `/api/premium` para rellenar el estado). Premium “visible” viene de `premiumService.isPremium(uid)` en localStorage; si el usuario limpia datos o usa otro dispositivo, puede perder la condición premium en UI hasta que se sincronice con el backend.
- **Modelo State en backend**
  - Falta el campo `listPickUsedDate` (el frontend lo usa en getInitialState). Si se hace PUT state con ese campo, Mongoose puede ignorarlo o fallar según configuración del schema.
- **Manejo de errores y resiliencia**
  - No hay Error Boundary global; solo uno alrededor de LoginScreen.
  - No hay lógica de reintento ni “modo offline” cuando falla la API.
  - No hay feedback claro cuando falla guardar/cargar state o reminders (ej. “No se pudo sincronizar”).
- **Seguridad y robustez backend**
  - Sin rate limiting en login/register (riesgo de fuerza bruta).
  - Sin helmet ni cabeceras de seguridad.
  - Validación de email (formato) inexistente; validación de body limitada.
- **Experiencia de usuario**
  - Sin onboarding más allá de la pantalla de bienvenida (no explica qué es el nivel de energía ni el flujo).
  - Sin recuperación de contraseña.
  - JWT sin refresh: a los 7 días el usuario pierde sesión sin aviso previo.
- **Documentación**
  - FUNCIONALIDADES.md sigue citando “Firebase Auth”; la app usa backend JWT.

### 1.4 Riesgos técnicos

| Riesgo | Impacto | Mitigación sugerida |
|--------|---------|---------------------|
| Estado local y remoto divergen (ej. usuario edita sin conexión y luego hay conflicto) | Alto | Definir estrategia: “last write wins” por usuario o merge por fecha; evitar sobrescribir sin criterio. |
| Token expirado en medio de una sesión larga | Medio | Mostrar mensaje claro “Sesión expirada” y redirigir a login; o implementar refresh token. |
| localStorage lleno o corrupto | Medio | Validar al cargar; en caso de error, limpiar clave afectada y mostrar mensaje; opcionalmente migrar a backend como fuente de verdad. |
| Backend caído o lento | Alto | Health check en frontend; guardar en local mientras falla y reintentar; mensaje “Guardado localmente, se sincronizará cuando haya conexión”. |
| Doble fuente de verdad Premium (local vs backend) | Medio | Tras login/register, siempre leer premium desde GET `/api/premium` y actualizar AppContext + premiumService. |

### 1.5 Malas prácticas detectadas

- **Duplicación de “origen de verdad”**: Estado y recordatorios existen en frontend (localStorage) y en backend (MongoDB), pero no se sincronizan. Para MVP conviene que, con usuario logueado, el backend sea la fuente de verdad y el frontend cargue/guarde vía API.
- **API client sin auth por defecto**: Cada llamada autenticada tendría que acordarse de pasar el token; es propenso a olvidos. Un único cliente que inyecte el token (y opcionalmente refresque) reduce errores.
- **Premium en dos sitios**: `userPlan` en AppContext (localStorage) y `premiumService` por uid (localStorage); backend tiene `userPlan` en State. Tras login/createAccount no se unifica desde el backend.
- **CreatePremiumAccountScreen**: Formulario de “pago” (tarjeta) sin pasarela real; es simulado. Para MVP real hace falta aclarar que es demo o conectar un pago real (Stripe, etc.).
- **Falta de validación de email**: Backend solo hace trim/lowercase; no valida formato. Aumenta riesgo de datos basura y confusión.

### 1.6 Cuellos de botella

- **AppContext muy cargado**: Un solo contexto con mucho estado y lógica (streak, migraciones, reset por día). Cualquier cambio de reglas puede ser costoso. Para escalar, considerar extraer dominio (ej. streak, reminders) a hooks o módulos.
- **ActionScreen muy grande**: Muchos estados y flujos en un solo componente; dificulta pruebas y mantenimiento. Dividir por vistas/flujos (Progreso, Timer, Ajustes, etc.) mejoraría claridad.
- **Sin caché de API**: Cuando se conecte state/reminders, cada carga será una petición; si se abusa (ej. guardar en cada keystroke), puede saturar. Definir cuándo hacer GET (inicio, vuelta a foco) y PUT (al cambiar estado, con debounce si hace falta).

### 1.7 Seguridad básica

- Contraseñas: hasheadas con bcrypt (SALT_ROUNDS 10). Aceptable para MVP.
- JWT: expiración 7d; secreto desde env. Falta: refresh token, invalidación en logout (lista negra opcional).
- CORS: configurado por env; en producción fijar orígenes concretos.
- No hay rate limiting: login/register son vulnerables a fuerza bruta. Añadir límite por IP o por email.
- No hay helmet: cabeceras de seguridad no endurecidas.
- Body sin límite explícito: Express por defecto limita; documentar o fijar `express.json({ limit: '...' })` para evitar payloads enormes.

### 1.8 Experiencia de usuario

- **Positivo**: Bienvenida clara, selector de energía, flujo de una tarea a la vez, mensajes empáticos, racha “humana”, recordatorios con overlay y notificaciones.
- **A mejorar**: Si el usuario borra datos o cambia de dispositivo, pierde todo (hasta que exista sync). No hay mensaje tipo “Conectá tu cuenta para no perder tu progreso”. Tras login no se indica que los datos se están sincronizando. No hay recuperación de contraseña ni aviso de sesión próxima a expirar.

### 1.9 Performance general

- Frontend: React 18, lazy de LoginScreen y CreatePremiumAccountScreen; estado en un solo contexto. No hay virtualización en listas (completadas hoy, recordatorios); con pocos ítems es aceptable para MVP.
- Backend: una conexión MongoDB; sin índices adicionales más allá de los definidos en Reminder (userId, userId+id). Para MVP suficiente; si crece el uso, revisar índices y consultas.
- No hay métricas ni logging estructurado; para MVP se puede mantener `console` y luego añadir un logger y métricas básicas.

---

## 2. Qué falta para llegar al MVP

Resumen de bloques a resolver antes de considerar el MVP “listo para usuarios”:

1. **Conectar frontend con backend para estado y recordatorios**  
   Cliente API con token; al iniciar sesión (o al cargar con token válido), GET state y GET reminders; al cambiar estado o recordatorios, PUT/POST/PATCH/DELETE según corresponda. Definir política cuando no hay red (guardar local y reintentar, o mostrar error).

2. **Unificar Premium con el backend**  
   Tras login o crear cuenta Premium, llamar GET `/api/premium` y actualizar `setUserPlan` y premiumService según la respuesta. Así Premium es “una sola verdad” desde el servidor.

3. **Alinear modelo State en backend**  
   Añadir `listPickUsedDate` al schema de State para no perder ese dato al hacer PUT desde el frontend.

4. **Manejo de errores y resiliencia**  
   Error Boundary global; mensajes claros cuando falla la API (conexión, 401, 500); opcionalmente guardar en local y reintentar.

5. **Seguridad mínima en producción**  
   Rate limiting en auth; helmet; validación de email; JWT_SECRET y MONGODB_URI seguros; CORS restrictivo.

6. **Flujos rotos y consistencia**  
   Logout: limpiar o no estado local (decidir si al cerrar sesión se mantiene una copia local “anónima” o se borra). CreatePremiumAccountScreen: aclarar que el pago es simulado o integrar pago real.

7. **Documentación**  
   Actualizar FUNCIONALIDADES.md (quitar Firebase, describir backend JWT y sync).

8. **Preparación para usuarios reales**  
   Variables de entorno de producción (VITE_API_URL, CORS, etc.); build y deploy; al menos un flujo de “sesión expirada” o refresh.

---

## 3. Plan de acción por fases

### Fase 1 — Crítico (sin esto la app no debería lanzarse)

| # | Tarea | Prioridad | Dificultad | Impacto |
|---|--------|------------|------------|---------|
| 1.1 | **Cliente API con token** – Crear (o extender) el cliente para que, si existe token en localStorage (mismo que authService), lo envíe en `Authorization: Bearer` en todas las peticiones a la API. Centralizar base URL y manejo de 401 (ej. redirigir a login o mostrar “Sesión expirada”). | Alta | Baja | Sin esto no se puede usar state/reminders autenticados. |
| 1.2 | **Sincronización de estado al login** – Tras login exitoso (y al cargar la app con token válido), llamar GET `/api/state`. Si hay datos, rehidratar AppContext con ese estado (respetando migraciones y getTodayDate). Si 404, mantener estado local o inicial. Asegurar que no se pise el estado actual con datos vacíos sin criterio. | Alta | Media | El usuario recupera su progreso al iniciar sesión en otro dispositivo o tras borrar caché. |
| 1.3 | **Guardar estado en backend** – Cada vez que el estado global cambie (o con debounce de unos segundos), si hay usuario logueado, hacer PUT `/api/state` con el payload actual. Manejar errores (red, 401) sin bloquear la UI; opcionalmente guardar en local y reintentar. | Alta | Media | Evita pérdida de datos y mantiene coherencia con el backend. |
| 1.4 | **Sincronización de recordatorios** – Sustituir (o complementar) el uso exclusivo de `remindersService` (localStorage) por llamadas al backend cuando el usuario esté logueado: al abrir la app o la pestaña Recordatorios, GET `/api/reminders` y mostrar esa lista; al crear/editar/borrar/marcar fired, llamar POST/PATCH/DELETE/POST :id/fired. Mantener localStorage como fallback o caché solo si se define estrategia clara (ej. “con usuario logueado, backend es la verdad”). | Alta | Media | Recordatorios disponibles en cualquier dispositivo. |
| 1.5 | **Premium desde backend** – Tras login y tras “Crear cuenta Premium”, llamar GET `/api/premium` y, según `premium`, llamar `setUserPlan('premium')` o `setUserPlan('free')` y actualizar `premiumService` (activate/deactivate). Así la condición Premium viene del servidor y no solo del localStorage. | Alta | Baja | Evita que Premium se pierda o desincronice entre dispositivos. |
| 1.6 | **Campo listPickUsedDate en State (backend)** – Añadir `listPickUsedDate` al schema de State en el backend (tipo String o Date, mismo uso que en frontend) para que PUT state no pierda ni rechace ese campo. | Alta | Baja | Evita errores de validación o pérdida de dato al sincronizar. |
| 1.7 | **Manejo de 401 en el cliente** – Si cualquier petición autenticada devuelve 401, limpiar token y usuario (logout), y mostrar mensaje “Sesión expirada” o redirigir a login. Evitar bucles de reintento. | Alta | Baja | Experiencia clara cuando el token deja de ser válido. |
| 1.8 | **Variables de entorno de producción** – Documentar y usar en build/deploy: `VITE_API_URL` (frontend), `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`, `PORT`. No subir secretos al repo. | Alta | Baja | Necesario para desplegar y que front y back se comuniquen en producción. |

### Fase 2 — Necesario para una buena experiencia

| # | Tarea | Prioridad | Dificultad | Impacto |
|---|--------|------------|------------|---------|
| 2.1 | **Error Boundary global** – Añadir un Error Boundary en la raíz (ej. en `main.jsx`) que capture errores no controlados, muestre un mensaje amigable y un botón “Reintentar” o “Volver al inicio”, y opcionalmente envíe el error a un log. | Alta | Baja | Evita pantalla en blanco o crashes sin explicación. |
| 2.2 | **Mensajes de error de red/sync** – Cuando falle GET o PUT state/reminders, mostrar un aviso breve (“No se pudo sincronizar. Revisá tu conexión.”) y no sobrescribir estado local con vacío. Si se implementa “guardar local y reintentar”, indicarlo al usuario. | Alta | Media | El usuario entiende por qué algo no se guardó o no se cargó. |
| 2.3 | **Rate limiting en auth** – En el backend, limitar intentos de login/register por IP (ej. 10 por minuto) o por email. Usar middleware (ej. express-rate-limit). | Alta | Baja | Reduce riesgo de fuerza bruta y abuso. |
| 2.4 | **Validación de email en backend** – Validar formato de email en register y login (regex o librería). Devolver 400 con mensaje claro si el formato es inválido. | Media | Baja | Menos datos incorrectos y mejor UX. |
| 2.5 | **Helmet en backend** – Añadir `helmet()` al Express en producción para cabeceras de seguridad (X-Content-Type-Options, etc.). | Media | Baja | Mejora postura de seguridad. |
| 2.6 | **CreatePremiumAccountScreen: aclarar pago** – Si el pago es simulado, dejar claro en UI (“Modo demo” / “Pago no real”) o quitar campos de tarjeta y dejar solo “Crear cuenta Premium” sin pago. Si el MVP requiere pago real, integrar pasarela (ej. Stripe) y no guardar datos de tarjeta. | Media | Media | Evita confusión o expectativas incorrectas. |
| 2.7 | **Onboarding breve** – Tras “Entrar” en Welcome, opcionalmente una pantalla o tooltip que explique en una frase el selector de energía (“Elegí cómo te sentís hoy”) y que la app sugiere una acción a la vez. No bloquear; permitir saltar. | Media | Baja | Mejora comprensión del producto. |
| 2.8 | **Logout y estado local** – Definir: al cerrar sesión, ¿se borra el estado local (y se muestra estado vacío) o se mantiene una copia “anónima” para que pueda seguir usando la app sin cuenta? Implementar la opción elegida y asegurar que el token y la sesión se limpien correctamente. | Media | Baja | Comportamiento predecible y sin datos residuales confusos. |

### Fase 3 — Mejora post-MVP

| # | Tarea | Prioridad | Dificultad | Impacto |
|---|--------|------------|------------|---------|
| 3.1 | **Recuperación de contraseña** – Flujo “Olvidé mi contraseña”: pantalla que pida email, endpoint que envíe link o código por email (con servicio de email), pantalla de restablecer contraseña. | Media | Alta | Reduce soporte y frustración. |
| 3.2 | **Refresh token** – Implementar refresh token (o ampliar vida del JWT y avisar antes de expirar) para no cortar sesión a los 7 días sin aviso. | Media | Media | Mejor retención y menos “me deslogueó solo”. |
| 3.3 | **Rutas/URLs** – Introducir react-router (o similar) para pantallas principales (ej. /progreso, /calendario, /recordatorios, /ajustes) para deep links y compartir. | Baja | Media | Mejor navegación y compartibilidad. |
| 3.4 | **Refactor de ActionScreen** – Dividir en subcomponentes o vistas por flujo (Progreso, Timer, Calendario, Recordatorios, Ajustes) para reducir complejidad y facilitar pruebas. | Baja | Media | Mantenibilidad y testing. |
| 3.5 | **Modo offline explícito** – Detección de conectividad; cola de escrituras pendientes; indicador “Sin conexión – se guardará cuando vuelva” y reintento automático. | Baja | Alta | Mejor experiencia en redes inestables. |
| 3.6 | **Logging y monitoreo** – Logger estructurado en backend; registro de errores 5xx y fallos de auth; opcionalmente integración con servicio de monitoreo (ej. Sentry). | Baja | Media | Diagnóstico y detección de problemas. |

### Fase 4 — Escalabilidad futura

| # | Tarea | Prioridad | Dificultad | Impacto |
|---|--------|------------|------------|---------|
| 4.1 | **Límite de tamaño de body** – Configurar `express.json({ limit: '256kb' })` (o el valor que corresponda) y validar tamaño de payload en state/reminders para evitar abusos. | Media | Baja | Protección ante payloads enormes. |
| 4.2 | **Índices y consultas** – Revisar consultas por usuario (state, reminders); añadir índices si hace falta (ej. por fecha en reminders). | Baja | Baja | Escala mejor con muchos usuarios y datos. |
| 4.3 | **Tests** – Tests unitarios para lógica crítica (streak, migraciones, formato de fecha); tests de integración para auth y state (y recordatorios) contra API. | Media | Alta | Menos regresiones y más confianza al cambiar código. |
| 4.4 | **CI/CD** – Pipeline que ejecute lint, tests y build; despliegue automático en staging/producción según rama o tag. | Baja | Media | Releases repetibles y menos errores manuales. |
| 4.5 | **Documentación API** – OpenAPI/Swagger o documento con endpoints, body y respuestas para que frontend y otros consumidores tengan referencia. | Baja | Media | Onboarding y contratos claros. |

---

## 4. Quick Wins

Mejoras de alto impacto con poco esfuerzo:

| # | Mejora | Esfuerzo | Impacto |
|---|--------|----------|---------|
| QW1 | **Añadir `listPickUsedDate` al schema State en backend** – Un solo campo en el modelo; evita fallos al sincronizar. | Muy bajo | Evita errores al conectar state. |
| QW2 | **Cliente API que inyecte Bearer token** – Función wrapper de `apiFetch` que lea token de localStorage (misma clave que authService) y lo ponga en `Authorization`. Usarla en todas las llamadas autenticadas. | Bajo | Base para state y reminders. |
| QW3 | **Tras login, llamar GET `/api/premium` y actualizar `setUserPlan` y premiumService** – Una llamada después de login y de createPremiumAccount; unifica Premium con el backend. | Bajo | Premium consistente entre dispositivos. |
| QW4 | **Manejo de 401 en el cliente** – En el wrapper de apiFetch, si `res.status === 401`, llamar logout y mostrar “Sesión expirada” (o redirigir a login). | Bajo | Comportamiento claro al expirar token. |
| QW5 | **Rate limiting en `/api/auth`** – `express-rate-limit` solo en router de auth (ej. 10 req/min por IP). | Bajo | Seguridad básica con poco código. |
| QW6 | **Error Boundary en la raíz** – Componente que capture error, muestre mensaje y botón “Reintentar”. Envolver `<App />` en main.jsx. | Bajo | Evita pantalla en blanco. |
| QW7 | **Actualizar FUNCIONALIDADES.md** – Quitar referencias a Firebase; indicar auth vía backend JWT y que state/reminders están (o estarán) sincronizados con el backend. | Muy bajo | Documentación alineada con la realidad. |
| QW8 | **Validación de email en backend** – Regex simple o librería (validator) en register y login; 400 si formato inválido. | Muy bajo | Menos datos basura. |

---

## 5. Riesgos técnicos (resumen)

- **Desincronización estado local vs remoto**: Definir política (backend como verdad con usuario logueado; al logout decidir si se borra o se mantiene copia local).
- **Token expirado**: Manejar 401 de forma centralizada (logout + mensaje) para no dejar al usuario en estado inconsistente.
- **Backend caído o lento**: No sobrescribir estado local con error; mostrar mensaje y opcionalmente reintentar o guardar en cola.
- **Premium en dos sitios**: Resolver con “siempre leer desde GET /api/premium tras login/createAccount y actualizar context + premiumService”.

---

## 6. Recomendaciones de arquitectura

- **Fuente de verdad con usuario logueado**: Que el backend sea la fuente de verdad para state y reminders cuando hay token válido; el frontend carga al inicio (y al volver a foco si se desea) y guarda con PUT/POST/PATCH/DELETE. localStorage puede usarse como caché o para modo offline si más adelante se implementa.
- **Cliente API único**: Un módulo que exporte `apiFetch` (o `api`) que siempre envíe el token cuando exista, maneje 401 (logout + mensaje) y opcionalmente reintentos o timeout. Todas las llamadas autenticadas pasar por este cliente.
- **Premium desde backend**: Un único flujo: tras login o crear cuenta Premium, GET `/api/premium` y actualizar `userPlan` en contexto y premiumService. No depender solo de localStorage para decidir si el usuario es premium.
- **Estado y recordatorios**: Evitar guardar en cada keystroke; usar debounce para PUT state (ej. 1–2 s) y guardar recordatorios al confirmar (crear/editar/borrar). Carga inicial al montar app (y al cambiar de pestaña Recordatorios si se quiere).
- **Desacoplar lógica de UI**: A largo plazo, extraer lógica de racha, migraciones y reglas de negocio a hooks o servicios para facilitar tests y cambios.

---

## 7. Checklist final antes de lanzar

- [ ] Cliente API envía `Authorization: Bearer` en todas las peticiones autenticadas.
- [ ] Al iniciar sesión (y al cargar con token), se hace GET state y GET reminders y se actualiza la UI.
- [ ] Los cambios de estado y recordatorios se persisten en el backend (PUT state, CRUD reminders) cuando el usuario está logueado.
- [ ] GET `/api/premium` se usa tras login y tras crear cuenta Premium; `userPlan` y premiumService se actualizan según la respuesta.
- [ ] El modelo State en backend incluye `listPickUsedDate`.
- [ ] Las respuestas 401 cierran sesión y muestran mensaje “Sesión expirada” (o redirigen a login).
- [ ] Error Boundary global captura errores no controlados y muestra mensaje + opción de reintentar.
- [ ] Rate limiting activo en rutas de auth.
- [ ] Validación de email en register/login en el backend.
- [ ] Variables de entorno de producción documentadas y configuradas (VITE_API_URL, MONGODB_URI, JWT_SECRET, CORS_ORIGIN).
- [ ] CreatePremiumAccountScreen: mensaje claro si el pago es demo, o integración real de pago.
- [ ] FUNCIONALIDADES.md (y README si aplica) actualizados (sin Firebase; backend JWT y sync).
- [ ] Comportamiento de logout definido e implementado (limpiar token y, si aplica, estado local o mantener copia anónima).
- [ ] Pruebas manuales: registro, login, completar tareas, crear recordatorios, cambiar dispositivo o borrar caché y volver a login; verificar que state y reminders se recuperan y que Premium se refleja correctamente.

---

*Documento generado como plan de MVP para Control (accompany-app). Listo para copiar en Notion.*
