# Detalle de funciones de la app Control

Documento que describe todas las funciones y flujos que tiene la app hasta ahora.

---

## 1. Flujo general de la app

### 1.1 Arranque
- **App** → `AppProvider` (estado global) → `AppWithWelcome`.
- **WelcomeScreen** (pantalla de bienvenida): logo, marca "CONTROL", tagline "Menos ruido. Más claridad.", botón "Tomar el control".
- Al hacer clic en "Tomar el control" se ejecuta una transición de salida y luego se muestra el contenido principal.

### 1.2 Contenido principal (AppContent)
- Si **no hay nivel de energía** elegido:
  - Se muestra **Loader** (logo con animación) durante la carga inicial.
  - Luego **EnergyLevelSelector** ("¿Cómo te sentís hoy?" con niveles Baja, Media, Alta).
- Si **hay nivel de energía**:
  - Se muestra **Loader** durante la carga inicial.
  - Luego **ActionScreen** (pantalla principal con tareas, timer, calendario, ajustes).

---

## 2. Selector de nivel de energía (EnergyLevelSelector)

- **Función:** Elegir el nivel de energía del día (Baja, Media, Alta).
- **Niveles:**
  - **Baja:** "Cansancio, bloqueo, cabeza quemada" → tareas mínimas.
  - **Media:** "Funcional, pero sin épica" → tareas intermedias.
  - **Alta:** "Ganas, foco, impulso" → tareas más exigentes.
- El nivel elegido determina qué tareas se ofrecen (según `data/actions.js`).
- El nivel se persiste en el estado global (localStorage) y se puede cambiar desde Ajustes.

---

## 3. Pantalla principal (ActionScreen)

### 3.1 Navegación por pestañas (BottomMenu)
- **Progreso:** tarea actual, botones "Empezar" / "Hacerlo más chico", lista "Completadas hoy".
- **Lista:** panel lateral con todas las tareas disponibles para elegir una.
- **Completadas hoy / Calendario:** vista de calendario mensual con días con tareas.
- **Ajustes:** ritmo (nivel de energía), sonidos, reiniciar día, Premium, cuenta (login), sobre la app.

### 3.2 Vista Progreso (tab "progress")
- **Tarea actual:** una acción aleatoria según el nivel de energía (sin repetir las ya completadas hoy).
- **Opciones:**
  - **Tareas con tiempo:** "Hacerlo más chico" (versión reducida de la tarea), "Empezar" (abre selector de tiempo → timer).
  - **Tareas instantáneas:** "¿Pudiste hacerlo?" → "Sí" (marca completada, opcionalmente pide nota) o "No todavía".
- **Completadas hoy:** lista de tareas completadas hoy con hora y nota si existe.
- Al completar una tarea se muestra un overlay con mensaje y pregunta "¿Cómo te sentís?" (Bien / Regular / Me cuesta hoy) para ajustar silenciosamente el nivel del día siguiente.

### 3.3 Lista de tareas (ListPanel)
- Panel lateral (lista) con tareas disponibles para el nivel actual.
- Al elegir una tarea se muestra en la vista Progreso y se cierra el panel.
- Las tareas vienen de `data/actions.js` por sección (Mente, Cuerpo, Bienestar, Productividad, Social, Otros) y nivel.

### 3.4 Timer (flujo Empezar)
1. **TimeSelectModal:** elegir duración.
   - **Free:** presets 1, 3, 5, 10 minutos; opción "Otro" deshabilitada con texto "Función Premium".
   - **Premium:** presets 5, 10, 15, 20 min + "Otro" (duración personalizada 10 s–20 min).
2. **TimerView:** cuenta regresiva con la tarea y opción de parar.
3. **TimerEndModal:** "Marcar completada", "Continuar un poco más", "Agregar nota" (Premium) o "Función Premium" (Free), "Cerrar".
- Sonidos al iniciar y al finalizar (si están activados en Ajustes).

### 3.5 Notas
- **Al completar tarea instantánea:** modal (NotePrompt) para agregar nota opcional.
- **Al finalizar timer (Premium):** opción "Agregar nota" que abre AddNoteModal.
- Las notas se guardan en el estado (sessionNotes / en la acción completada) y se muestran en "Completadas hoy".

### 3.6 Vista Calendario (tab "today")
- Calendario mensual con días que tienen tareas completadas.
- **Free:** solo se puede ver/clickear hoy; al tocar día pasado o navegar mes anterior se abre el modal Premium.
- **Premium:** se puede navegar meses y abrir detalle de cualquier día.
- Al tocar un día (si está permitido) se abre **DayDetailModal** con las tareas de ese día.

### 3.7 Vista Ajustes (tab "settings")
- **Cuenta:** botón "Iniciar sesión" (abre LoginScreen en la misma pantalla).
- **Premium:** texto explicativo; si es Premium "Premium activo" + "Ver beneficios"; si no "Hacerse Premium" (abre PremiumView).
- **Ritmo:** cambiar nivel de energía (Baja, Media, Alta).
- **Sonidos:** activar/desactivar feedback sonoro.
- **Reiniciar día:** marcar todas las tareas del día como no completadas (con confirmación).
- **Sobre Control:** texto de filosofía de la app.

### 3.8 Login (tab "login")
- **LoginScreen** (carga diferida para no romper la app si Firebase falla): email, contraseña, "Iniciar sesión".
- Al iniciar sesión correctamente se vuelve a la pestaña anterior (normalmente Ajustes).
- Se puede salir del login tocando otra pestaña del menú.

### 3.9 Premium (PremiumView)
- Se abre desde Ajustes ("Hacerse Premium") o al intentar usar una función Premium (ej. duración libre, nota al finalizar, calendario pasado).
- Muestra beneficios y botón "Activar Premium" (si hay usuario logueado activa con `premiumService.activatePremium(uid)`) o "Iniciar sesión para activar".
- Si ya es Premium: "Premium activo" y "Cerrar".

---

## 4. Autenticación

### 4.1 Servicio (authService.ts)
- **login(email, password):** inicia sesión con Firebase Auth (email/contraseña).
- **logout():** cierra sesión.
- **getCurrentUser():** devuelve `{ uid, email }` o `null`.
- **onAuthChange(callback):** suscripción a cambios de sesión; devuelve función para cancelar.

### 4.2 Uso en la app
- **ActionScreen** carga auth de forma diferida (para no dejar pantalla en blanco si Firebase falla).
- Si hay usuario → se usa para Premium (`premiumService.isPremium(uid)`).
- LoginScreen usa Firebase `signInWithEmailAndPassword`; al éxito llama `onSuccess` y se vuelve atrás.

---

## 5. Premium (bloqueo real)

### 5.1 Servicio (premiumService.ts)
- **isPremium(uid):** indica si el usuario tiene Premium (persistido por uid en localStorage).
- **activatePremium(uid):** activa Premium para ese usuario (sin pagos).
- **deactivatePremium(uid):** desactiva Premium.

### 5.2 Cómo se decide si es Premium
- Se obtiene el usuario con `authService.getCurrentUser()`.
- Si **no hay usuario** → se trata como **no Premium**.
- Si hay usuario → `premiumService.isPremium(uid)`.

### 5.3 Funciones Premium (siempre visibles, bloqueadas si no es Premium)
- **Duración libre del timer:** en TimeSelectModal, opción "Otro" / duración personalizada. Free: botón deshabilitado "Función Premium".
- **Agregar nota al finalizar timer:** en TimerEndModal. Free: botón deshabilitado "Función Premium" + enlace a Premium.
- **Calendario:** ver días pasados y navegar mes anterior. Free: al tocar día pasado o "anterior" se abre PremiumView.
- **Pausar racha:** en StreakDisplay (si se usa). Free: se muestra "Función Premium" en lugar del botón pausar.

---

## 6. Estado global (AppContext)

### 6.1 Estado persistido (localStorage)
- **currentEnergyLevel:** 'baja' | 'media' | 'alta'.
- **completedActions:** array de acciones completadas (todas las fechas).
- **allActions:** historial de acciones mostradas/completadas por fecha.
- **history:** mapa fecha → ids de acciones (para racha y calendario).
- **streak:** { current, lastDate, paused }.
- **lastResetDate**, **scheduledEnergyNextDay** (nivel programado para mañana).
- **sessionNotes:** notas de sesión (timer sin completar).
- **sounds:** { enabled, volume }.
- **userPlan:** 'free' | 'premium' (legacy; el bloqueo real usa premiumService + uid).

### 6.2 Acciones del contexto
- **setEnergyLevel(level)**
- **completeAction(action, note?)**
- **setCurrentAction(action)**
- **scheduleEnergyForNextDay(choice)** (Bien / Regular / Me cuesta hoy)
- **updateStreak({ paused?, ... })**
- **resetState**
- **getTodayActions**
- **resetTodayActions**
- **resetAllActions**
- **addSessionNote(action, note)**
- **setSoundsEnabled(enabled)**
- **setSoundsVolume(volume)**
- **setUserPlan(plan)**

---

## 7. Racha (streak)

- **useStreak:** hook que calcula mensaje y estado (current, paused, hasActionToday, etc.).
- **Lógica:** racha "humana": no se rompe por 1–6 días sin actividad; a partir de 7 días se reinicia suavemente.
- **Pausar/reanudar:** solo si el usuario es Premium (`premiumService.isPremium(uid)`); si no, se muestra "Función Premium".

---

## 8. Sonidos

- **utils/sounds:** initAudioContext, playStartSound, playTapSound (para menú).
- Activación en el primer toque/clic (compatibilidad móvil).
- Encendido/apagado y volumen desde Ajustes.

---

## 9. Persistencia y utilidades

- **utils/storage:** saveState, loadState, clearState, getTodayDate, formatTime, etc. Clave principal: `control-app-state`.
- **firebaseConfig.ts:** inicialización de Firebase (env VITE_FIREBASE_*).
- **Premium:** clave `control-app-premium` (mapa uid → boolean).

---

## 10. Pantallas / componentes que no están en el flujo principal

- **PremiumInfoScreen:** pantalla informativa de Premium (qué es, funciones, "Activar Premium"); lista tareas inteligentes, notas con recordatorios, desbloqueo de límites. No está conectada a la navegación.
- **UpgradeModal:** modal para activar Premium; no se usa en el flujo actual (se usa PremiumView).
- **StreakDisplay:** muestra racha y botón pausar (Premium); no está montado en ActionScreen en el listado actual, pero está preparado para usar auth + premiumService.

---

## Resumen rápido

| Área            | Funciones principales                                                                 |
|-----------------|----------------------------------------------------------------------------------------|
| Entrada         | Bienvenida → Selector de energía → ActionScreen                                       |
| Tareas          | Una tarea por vez, aleatoria por nivel; "Hacerlo más chico" o "Empezar" (timer)       |
| Timer           | Elegir duración (Free: 1–10 min; Premium: libre) → cuenta regresiva → Marcar/Nota/Cerrar |
| Completadas     | Lista "Completadas hoy" + notas; overlay "¿Cómo te sentís?"                            |
| Calendario      | Mes actual; Premium: meses pasados y detalle por día                                  |
| Ajustes         | Cuenta (login), Premium, ritmo, sonidos, reiniciar día                                 |
| Auth            | Login/Logout con Firebase; uid usado para Premium                                     |
| Premium         | Por usuario (uid); activar sin pago; bloqueo real en timer, nota, calendario, racha     |
