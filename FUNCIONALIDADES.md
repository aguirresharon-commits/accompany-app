# Control – Detalle de funciones de la app

Documento que describe todas las funciones actuales de la app **Control** (hábitos por nivel de energía, recordatorios, Premium, auth, etc.).

---

## 1. Flujo general de la app

1. **WelcomeScreen** → pantalla de bienvenida (“Menos ruido. Más claridad.”). Al tocar “Entrar” se oculta y se muestra el contenido principal.
2. **Sin nivel de energía** → se muestra **EnergyLevelSelector** (Baja, Media, Alta). El usuario elige uno y queda guardado.
3. **Con nivel elegido** → se muestra **ActionScreen** (pantalla principal con menú inferior y pestañas).

No hay rutas/URLs: todo se maneja con estado (`activeTab`, `premiumViewOpen`, `empezarFlow`, etc.) dentro de **ActionScreen**.

---

## 2. Pantalla principal (ActionScreen)

### 2.1 Menú inferior (BottomMenu)

- **Progreso** (✓): va a la pestaña Progreso. Si ya está en Progreso, al tocar ejecuta “marcar completada” (sin timer).
- **Lista** (≡): abre/cierra el **ListPanel** (lista de tareas filtradas por nivel de energía).
- **Completadas hoy** (calendario): va a la pestaña **Calendario** (vista mensual + detalle de día con Premium).
- **Recordatorios** (campana): va a la pestaña **Recordatorios** (tareas puntuales con fecha/hora y notificaciones).
- **Ajustes** (⋯): va a la pestaña **Ajustes** (ritmo, sonidos, Premium, reiniciar día, cuenta).

Todas las vistas/modales tienen botón **←** (volver) arriba a la izquierda, salvo las que ya tenían otra salida clara.

### 2.2 Pestañas de contenido (main)

Según `activeTab` se muestra una sola vista:

- **progress** → Progreso (tarea actual + Empezar / Hacerlo más chico / marcar completada).
- **today** → **CalendarView** (calendario mensual; ver detalle de un día requiere Premium).
- **reminders** → **RemindersView** (lista de recordatorios, agregar/editar/borrar; free: 2, Premium: ilimitados).
- **settings** → **SettingsView** (ritmo, sonidos, Premium, reiniciar día, cuenta / Iniciar sesión).
- **login** → **LoginScreen** (email/contraseña, Firebase Auth). Se llega desde Ajustes (“Iniciar sesión”) o desde Premium (“Activar Premium” sin usuario).

Vistas full-screen tipo overlay:

- **premiumViewOpen** → **PremiumView** (beneficios + Activar Premium / Cerrar). Se abre desde Ajustes, desde modales de timer (Premium) o desde Recordatorios al superar el límite free.

---

## 3. Progreso (hábitos / tareas por energía)

- **Tarea actual**: una acción aleatoria del nivel de energía elegido (Baja, Media, Alta), sin repetir las ya completadas hoy.
- **Empezar**: abre **TimeSelectModal** (elegir duración) → **TimerView** (cuenta regresiva) → **TimerEndModal** (marcar completada, continuar más, agregar nota [Premium], cerrar).
- **Hacerlo más chico**: reemplaza la tarea por una “reducida” del mismo nivel (si existe en `actions`).
- **Marcar completada** (sin timer): desde el botón ✓ del menú o desde la tarjeta; marca la tarea como hecha y muestra overlay “Hecho.” / “Avanzaste.” etc., y opcionalmente “¿Cómo te sentís?” (Bien, Regular, Me cuesta hoy) para programar el nivel del día siguiente.
- **Tareas instantáneas**: algunas tareas tienen `duration: 0.5` y no usan timer; solo “¿Pudiste hacerlo?” → Sí / No todavía.
- **Completadas hoy**: lista debajo de la tarjeta con las tareas ya completadas hoy (texto, hora, nota si la tiene).

**Datos**: `completedActions`, `allActions`, `currentAction`, `displayedAction` vienen del **AppContext** y se persisten en **localStorage** (`control-app-state`). Las tareas están definidas en **data/actions.js** por sección (Mente, Cuerpo, Bienestar, etc.) y nivel (baja, media, alta).

---

## 4. Timer (Empezar)

- **TimeSelectModal**  
  - **Free**: presets 1, 3, 5, 10 min. Opción “Otro” (duración libre) deshabilitada con texto “Función Premium”.  
  - **Premium**: presets 5, 10, 15, 20 min + “Otro” (10 s–20 min).  
  - Al elegir duración → cierra y pasa a **TimerView**.

- **TimerView**  
  - Cuenta regresiva con la duración elegida.  
  - Al terminar (o al parar) → **TimerEndModal**.

- **TimerEndModal**  
  - Mensaje tipo “Listo.” / “Terminaste.”  
  - **Marcar completada** → marca la tarea como completada y cierra el flujo.  
  - **Continuar un poco más** → vuelve a **TimeSelectModal** (misma tarea, nueva duración).  
  - **Agregar nota**: **Free** → botón deshabilitado “Función Premium”; **Premium** → abre **AddNoteModal** para guardar nota con la sesión (sin marcar completada aún).  
  - **Cerrar** → cierra sin marcar completada.

- **AddNoteModal** (desde TimerEndModal con Premium): texto opcional, “Listo” / “Omitir”. La nota se asocia a la sesión/tarea.

**Nota**: También existe **NotePrompt** (flujo alternativo de “¿Dejás una nota?” al completar). El flujo principal de “agregar nota” en timer es el anterior.

---

## 5. Calendario (Completadas hoy / historial por día)

- **CalendarView**  
  - Calendario mensual con el mes actual.  
  - Días con tareas completadas tienen marca visual.  
  - Navegación ← / → entre meses (siempre permitida).  
  - Al tocar un **día**:  
    - **Free** → no abre detalle; se llama `onRequestPremium()` y se abre **PremiumView**.  
    - **Premium** → abre **DayDetailModal** con la fecha elegida.

- **DayDetailModal**  
  - Muestra la fecha formateada y la lista de tareas completadas ese día (texto, hora, nota si hay).  
  - Si no hay tareas: mensaje “Ese día no completaste ninguna tarea.”  
  - Botón “Cerrar” y ← para volver.

Los datos vienen de `completedActions` (todas las fechas); el calendario filtra por mes y el detalle por día.

---

## 6. Recordatorios

- **RemindersView**  
  - Lista de recordatorios (texto + día + hora).  
  - **Límite free**: 2 recordatorios. Con 2 ya creados, el botón “+” se deshabilita y al tocarlo se abre **PremiumView**.  
  - **Premium**: sin límite.  
  - Hint cuando es free y hay 2: “Límite free: 2 recordatorios. Con Premium podés agregar más.”

- **Botón “+”**  
  - Abre **AddReminderModal** (solo si puede agregar: free con &lt; 2 o Premium).

- **AddReminderModal**  
  - Crear: texto, día (date), hora (time), alarma on/off.  
  - Editar: mismo formulario con datos del recordatorio elegido (botón lápiz en cada ítem).  
  - Al guardar: **authService** no se usa aquí; solo se guarda en **localStorage** (`control-app-reminders`). Si la alarma está on, se puede pedir permiso de **Notification** para notificaciones del sistema.

- **Selección y borrado**  
  - Cada ítem tiene casilla para seleccionar.  
  - Botón tacho (mismo tamaño que “+”) borra los recordatorios seleccionados (vía **remindersService.deleteReminders(ids)**).

- **Notificaciones**  
  - **useRemindersScheduler** (hook en ActionScreen): lee recordatorios con alarma on y sin `firedAt`, calcula la fecha/hora en hora local y programa un `setTimeout` hasta ese momento.  
  - Al llegar la hora:  
    1. Dispara evento `reminder-due` (siempre).  
    2. Si hay permiso, muestra **Notification** del navegador.  
    3. Marca el recordatorio con `firedAt`.  
  - **ActionScreen** escucha `reminder-due` y muestra un **overlay en pantalla** con el texto del recordatorio + mensaje motivacional aleatorio y botones “Más tarde” / “Ver recordatorios”.  
  - Si el usuario agregó/editó recordatorios en la misma pestaña, el scheduler se reprograma vía evento `reminders-updated` (porque `storage` solo se dispara en otras pestañas).  
  - Recordatorios vencidos hace hasta 24 h se disparan al abrir la app (overlay + opcional Notification).  
  - Al hacer clic en la notificación del sistema se guarda `control-open-tab = 'reminders'` y al volver a foco la app cambia a la pestaña Recordatorios.

**Persistencia**: `remindersService` (listReminders, addReminder, updateReminder, deleteReminders, markReminderFired) en **localStorage** con clave `control-app-reminders`.

---

## 7. Ajustes (SettingsView)

- **Cuenta**  
  - Botón “Iniciar sesión” → `onOpenLogin()` → `activeTab = 'login'` (LoginScreen).

- **Premium**  
  - Descripción de beneficios.  
  - Si **Premium activo** → “Ver beneficios” (abre PremiumView).  
  - Si **free** → “Hacerse Premium” (abre PremiumView).  
  - En **PremiumView**, “Activar Premium” usa **authService.getCurrentUser()** y **premiumService.activatePremium(uid)**; si no hay usuario, redirige a LoginScreen.

- **Ritmo**  
  - Selector de nivel de energía: Baja, Media, Alta. Actualiza `currentEnergyLevel` en el contexto.

- **Sonidos**  
  - Toggle para activar/desactivar sonidos al completar y en el menú (persistido en contexto).

- **Reiniciar día**  
  - Confirmación y luego `resetAllActions()`: marca todas las tareas del día como no completadas y resetea estado relacionado.

- **Sobre Control**  
  - Texto fijo sobre la filosofía de la app.

---

## 8. Login y Premium

- **LoginScreen**  
  - Email + contraseña.  
  - Al enviar se usa **authService** (login con Firebase Auth). Carga diferida para no bloquear si Firebase falla.  
  - Timeout de carga de auth; si falla, se muestra error (ej. “Demasiado lento. Probá de nuevo.”).  
  - `onSuccess` → vuelve a la pestaña anterior (`setActiveTab(previousTab)`).  
  - Botón ← para volver sin iniciar sesión.

- **Premium (estado)**  
  - **premiumService**: `isPremium(uid)`, `activatePremium(uid)`, `deactivatePremium(uid)`. Persistencia en **localStorage** (`control-app-premium`) por `uid`.  
  - **authService**: `getCurrentUser()`, `onAuthChange()`, `login()`, `logout()`. Usa Firebase Auth.  
  - En **ActionScreen**, `currentUser` viene de `onAuthChange` (carga diferida) y `isPremiumUser = currentUser ? checkIsPremium(currentUser.uid) : false`.  
  - Ese `isPremiumUser` se pasa a: PremiumView, SettingsView, CalendarView, TimeSelectModal, TimerEndModal, RemindersView, StreakDisplay (donde aplica).

- **PremiumView**  
  - Lista de beneficios.  
  - “Activar Premium” → si no hay usuario, cierra y va a Login; si hay usuario, activa Premium para ese uid, cierra la vista y refresca estado.  
  - “Cerrar” / “Más tarde” → cierra la vista.

---

## 9. Racha (streak)

- **StreakDisplay**  
  - Muestra mensaje de racha (días seguidos con al menos una tarea completada).  
  - **Premium**: botón para pausar/reanudar la racha (`updateStreak({ paused })`).  
  - **Free**: solo lectura, sin botón de pausar.

Lógica de racha en **useStreak** y estado en **AppContext** (`streak.current`, `streak.lastDate`, `streak.paused`), persistido en `control-app-state`.

---

## 10. Lista de tareas (ListPanel)

- Panel tipo drawer desde abajo con título “Tareas de energía [nivel]”.
- **TaskListView** muestra tareas del nivel actual que no están completadas hoy (o todas, según implementación).
- Al elegir una tarea → se pone como tarea actual, se cierra el panel y se va a Progreso.
- Botón ← arriba para cerrar.
- Escape y clic en backdrop también cierran.

---

## 11. Persistencia y datos

- **localStorage**  
  - `control-app-state`: estado global (nivel de energía, completedActions, allActions, streak, sounds, userPlan, etc.).  
  - `control-app-reminders`: array de recordatorios.  
  - `control-app-premium`: mapa `{ [uid]: boolean }` para Premium por usuario.  
  - `control-open-tab`: usado por notificaciones para abrir la pestaña Recordatorios al volver a la app.

- **Firebase**  
  - Solo Auth (email/contraseña). No hay Firestore ni Realtime DB en este detalle.

---

## 12. Resumen por función

| Función | Dónde | Free | Premium |
|--------|--------|------|--------|
| Elegir nivel de energía (Baja/Media/Alta) | EnergyLevelSelector, Ajustes | ✓ | ✓ |
| Ver una tarea al azar por nivel | Progreso | ✓ | ✓ |
| Lista de tareas del nivel | ListPanel | ✓ | ✓ |
| Timer con presets 1–10 min | TimeSelectModal | ✓ (1,3,5,10 min) | ✓ (5,10,15,20 + Otro) |
| Duración libre (10 s–20 min) | TimeSelectModal | ✗ (bloqueado) | ✓ |
| Marcar completada con/sin timer | Progreso, TimerEndModal | ✓ | ✓ |
| Agregar nota al finalizar timer | TimerEndModal → AddNoteModal | ✗ (bloqueado) | ✓ |
| Calendario mensual | CalendarView | ✓ | ✓ |
| Ver detalle de un día (tareas + notas) | DayDetailModal | ✗ (abre Premium) | ✓ |
| Recordatorios (crear/editar/borrar) | RemindersView, AddReminderModal | ✓ (máx. 2) | ✓ (ilimitados) |
| Notificaciones de recordatorios | useRemindersScheduler + overlay | ✓ (overlay siempre; Notification si hay permiso) | ✓ |
| Iniciar sesión / Cerrar sesión | LoginScreen, Ajustes | ✓ | ✓ |
| Activar Premium por usuario | PremiumView | ✓ (requiere login) | ✓ |
| Pausar/reanudar racha | StreakDisplay | ✗ (solo ver) | ✓ |
| Sonidos on/off | Ajustes | ✓ | ✓ |
| Reiniciar día | Ajustes | ✓ | ✓ |

---

## 13. Archivos clave

- **App**: `App.jsx`, `main.jsx`
- **Estado global**: `context/AppContext.jsx`, `hooks/useAppState.js`
- **Pantallas principales**: `ActionScreen.jsx`, `EnergyLevelSelector.jsx`, `WelcomeScreen.jsx`
- **Menú y vistas**: `BottomMenu.jsx`, `ListPanel.jsx`, `SettingsView.jsx`, `CalendarView.jsx`, `RemindersView.jsx`
- **Timer**: `TimeSelectModal.jsx`, `TimerView.jsx`, `TimerEndModal.jsx`, `AddNoteModal.jsx`, `NotePrompt.jsx`
- **Premium y login**: `PremiumView.jsx`, `LoginScreen.jsx`, `services/premiumService.ts`, `services/authService.ts`
- **Recordatorios**: `RemindersView.jsx`, `AddReminderModal.jsx`, `services/remindersService.js`, `hooks/useRemindersScheduler.js`
- **Datos**: `data/actions.js`, `data/iconMap.js`, `utils/storage.js`
- **Racha**: `StreakDisplay.jsx`, `hooks/useStreak.js`

Si querés, puedo bajar esto a un README más corto “Funciones de la app” o dejarlo solo en este archivo.
