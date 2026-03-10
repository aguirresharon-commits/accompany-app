/**
 * Límites para usuarios no premium.
 * TEMPORAL: valores elevados para la fase early de la app (sin sistema de pagos aún).
 * Para volver al comportamiento premium: bajar FREE_TASKS_LIMIT (ej. 2) y FREE_REMINDERS_LIMIT (ej. 2).
 */

/** Máximo de elecciones desde la lista de tareas por día para usuarios free. Premium = ilimitado. */
export const FREE_TASKS_LIMIT = 15

/** Máximo de recordatorios para usuarios free. Premium = ilimitado. */
export const FREE_REMINDERS_LIMIT = 10
