// Mapeo de IDs de tareas a nombres de iconos SVG
export const taskIconMap = {
  // Baja
  'baja-001': 'breath',      // Respirá profundo
  'baja-002': 'chair',       // Sentate derecho
  'baja-003': 'water',       // Tomá un vaso de agua
  'baja-004': 'window',      // Abrí una ventana
  'baja-005': 'eye',         // Mirá alrededor
  'baja-006': 'box',         // Ordená solo lo que tenés enfrente
  'baja-007': 'stretch',     // Estirá brazos y cuello
  'baja-008': 'phone',       // Borrá una notificación
  'baja-009': 'close',       // Cerrá una app
  'baja-010': 'refresh',     // Cambiá de posición
  'baja-011': 'coffee',      // Prepará un café
  'baja-012': 'music',       // Poné una canción
  'baja-013': 'soap',        // Lavate la cara
  'baja-014': 'window',      // Abrí la ventana y dejá entrar aire
  'baja-015': 'hand',        // Tocá algo frío o caliente

  // Media
  'media-001': 'broom',      // Ordená una parte del cuarto
  'media-002': 'message',    // Respondé un mensaje
  'media-003': 'pencil',     // Escribí una sola frase
  'media-004': 'coffee',     // Lavá una taza
  'media-005': 'clipboard',  // Armá una lista
  'media-006': 'walk',       // Caminá 2 minutos
  'media-007': 'book',       // Leé una página
  'media-008': 'folder',     // Abrí ese archivo
  'media-009': 'box',        // Guardá algo fuera de lugar
  'media-010': 'target',     // Prepará lo que vas a usar
  'media-011': 'image',      // Eliminá 5 fotos
  'media-012': 'folder',     // Organizá una carpeta
  'media-013': 'shower',     // Tomá una ducha corta
  'media-014': 'trash',      // Sacá la basura
  'media-015': 'note',       // Abrí una nota y escribí
  'media-016': 'clock',      // Dejá algo listo para más tarde

  // Alta
  'alta-001': 'check',       // Terminá una tarea pendiente
  'alta-002': 'broom',       // Ordená un espacio completo
  'alta-003': 'timer',       // Avanzá 20 minutos
  'alta-004': 'pencil',      // Escribí sin parar
  'alta-005': 'exercise',   // Entrená / movete fuerte
  'alta-006': 'sponge',      // Limpiá algo que evitabas
  'alta-007': 'calendar',    // Planificá mañana
  'alta-008': 'scale',       // Tomá una decisión pendiente
  'alta-009': 'lock',        // Cerrá un tema abierto
  'alta-010': 'rocket',      // Empezá eso que venís postergando
  'alta-011': 'lightbulb',   // Creá algo
  'alta-012': 'handshake',   // Ayudá a alguien
  'alta-013': 'sunrise',     // Dejá algo listo para tu yo de mañana
  'alta-014': 'check',        // Revisá y cerrá pendientes
}

// Función helper para obtener el icono de una tarea
export const getTaskIcon = (actionId) => {
  return taskIconMap[actionId] || null
}
