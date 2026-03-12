/**
 * Estado global del overlay de recordatorio.
 * Usado por el scheduler para evitar disparar reminder-due cuando ya hay un overlay visible.
 * Solo lectura/escritura de un booleano; la UI (ActionScreen) lo actualiza al mostrar/ocultar.
 */
let overlayVisible = false

export function setReminderOverlayVisible(visible) {
  overlayVisible = Boolean(visible)
}

export function isReminderOverlayVisible() {
  return overlayVisible
}
