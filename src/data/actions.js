// Niveles de energía: Baja, Media, Alta
// Tareas por nivel según objetivo de cada uno

export const ENERGY_LEVELS = {
  baja: {
    key: 'baja',
    label: 'Baja',
    emoji: '🔴',
    description: 'Cansancio, bloqueo, cabeza quemada',
    objective: 'Activar sin exigir',
    messages: ['Solo esto.', 'Nada más.']
  },
  media: {
    key: 'media',
    label: 'Media',
    emoji: '🟡',
    description: 'Funcional, pero sin épica',
    objective: 'Progreso real, corto',
    messages: ['Un paso alcanza.', 'No todo. Esto.', 'Hacelo simple.']
  },
  alta: {
    key: 'alta',
    label: 'Alta',
    emoji: '🟢',
    description: 'Ganas, foco, impulso',
    objective: 'Canalizar sin quemar',
    messages: ['Aprovechá el impulso.', 'Ahora es buen momento.']
  }
}

export const ENERGY_LEVEL_KEYS = Object.keys(ENERGY_LEVELS)

export const actionsByEnergyLevel = {
  baja: [
    { id: 'baja-001', text: 'Respirá profundo una vez', emoji: '🫁', level: 'baja', category: 'activar', canReduce: false },
    { id: 'baja-002', text: 'Sentate derecho 10 segundos', emoji: '🪑', level: 'baja', category: 'activar', canReduce: false },
    { id: 'baja-003', text: 'Tomá un vaso de agua', emoji: '💧', level: 'baja', category: 'activar', canReduce: false },
    { id: 'baja-004', text: 'Abrí una ventana', emoji: '🪟', level: 'baja', category: 'activar', canReduce: false },
    { id: 'baja-005', text: 'Mirá alrededor y nombrá 3 cosas', emoji: '👀', level: 'baja', category: 'activar', canReduce: false },
    { id: 'baja-006', text: 'Ordená solo lo que tenés enfrente', emoji: '📦', level: 'baja', category: 'orden', canReduce: false },
    { id: 'baja-007', text: 'Estirá brazos y cuello', emoji: '🙆', level: 'baja', category: 'activar', canReduce: false },
    { id: 'baja-008', text: 'Borrá una notificación', emoji: '📱', level: 'baja', category: 'digital', canReduce: false },
    { id: 'baja-009', text: 'Cerrá una app', emoji: '✖️', level: 'baja', category: 'digital', canReduce: false },
    { id: 'baja-010', text: 'Cambiá de posición', emoji: '🔄', level: 'baja', category: 'activar', canReduce: false },
    { id: 'baja-011', text: 'Prepará un café o una infusión', emoji: '☕', level: 'baja', category: 'activar', canReduce: false },
    { id: 'baja-012', text: 'Poné una canción que te guste', emoji: '🎵', level: 'baja', category: 'activar', canReduce: false },
    { id: 'baja-013', text: 'Lavate la cara', emoji: '🧼', level: 'baja', category: 'activar', canReduce: false },
    { id: 'baja-014', text: 'Abrí la ventana y dejá entrar aire', emoji: '🪟', level: 'baja', category: 'activar', canReduce: false },
    { id: 'baja-015', text: 'Tocá algo frío o caliente (una taza, agua, una mesa)', emoji: '🖐️', level: 'baja', category: 'activar', canReduce: false }
  ],
  media: [
    { id: 'media-001', text: 'Ordená una parte del cuarto', emoji: '🧹', level: 'media', category: 'orden', canReduce: false },
    { id: 'media-002', text: 'Respondé un mensaje pendiente', emoji: '💬', level: 'media', category: 'comunicación', canReduce: false },
    { id: 'media-003', text: 'Escribí una sola frase', emoji: '✏️', level: 'media', category: 'escritura', canReduce: false },
    { id: 'media-004', text: 'Lavá una taza', emoji: '☕', level: 'media', category: 'higiene', canReduce: false },
    { id: 'media-005', text: 'Armá una lista de 3 cosas', emoji: '📋', level: 'media', category: 'organizar', canReduce: false },
    { id: 'media-006', text: 'Caminá 2 minutos', emoji: '🚶', level: 'media', category: 'movimiento', canReduce: false },
    { id: 'media-007', text: 'Leé una página', emoji: '📖', level: 'media', category: 'lectura', canReduce: false },
    { id: 'media-008', text: 'Abrí ese archivo (solo abrirlo)', emoji: '📂', level: 'media', category: 'digital', canReduce: false },
    { id: 'media-009', text: 'Guardá algo fuera de lugar', emoji: '📦', level: 'media', category: 'orden', canReduce: false },
    { id: 'media-010', text: 'Prepará lo que vas a usar después', emoji: '🎯', level: 'media', category: 'organizar', canReduce: false },
    { id: 'media-011', text: 'Eliminá 5 fotos', emoji: '🖼️', level: 'media', category: 'digital', canReduce: false },
    { id: 'media-012', text: 'Organizá una carpeta', emoji: '📁', level: 'media', category: 'orden', canReduce: false },
    { id: 'media-013', text: 'Tomá una ducha corta', emoji: '🚿', level: 'media', category: 'higiene', canReduce: false },
    { id: 'media-014', text: 'Sacá la basura', emoji: '🗑️', level: 'media', category: 'orden', canReduce: false },
    { id: 'media-015', text: 'Abrí una nota y escribí cómo estás', emoji: '📝', level: 'media', category: 'escritura', canReduce: false },
    { id: 'media-016', text: 'Dejá algo listo para más tarde', emoji: '⏰', level: 'media', category: 'organizar', canReduce: false }
  ],
  alta: [
    { id: 'alta-001', text: 'Terminá una tarea pendiente', emoji: '✅', level: 'alta', category: 'avanzar', canReduce: false },
    { id: 'alta-002', text: 'Ordená un espacio completo', emoji: '🧹', level: 'alta', category: 'orden', canReduce: false },
    { id: 'alta-003', text: 'Avanzá 20 minutos', emoji: '⏱️', level: 'alta', category: 'avanzar', canReduce: false },
    { id: 'alta-004', text: 'Escribí sin parar 5 min', emoji: '✏️', level: 'alta', category: 'escritura', canReduce: false },
    { id: 'alta-005', text: 'Entrená / movete fuerte', emoji: '💪', level: 'alta', category: 'movimiento', canReduce: false },
    { id: 'alta-006', text: 'Limpiá algo que evitabas', emoji: '🧽', level: 'alta', category: 'orden', canReduce: false },
    { id: 'alta-007', text: 'Planificá mañana', emoji: '📅', level: 'alta', category: 'organizar', canReduce: false },
    { id: 'alta-008', text: 'Tomá una decisión pendiente', emoji: '⚖️', level: 'alta', category: 'avanzar', canReduce: false },
    { id: 'alta-009', text: 'Cerrá un tema abierto', emoji: '🔒', level: 'alta', category: 'avanzar', canReduce: false },
    { id: 'alta-010', text: 'Empezá eso que venís postergando', emoji: '🚀', level: 'alta', category: 'avanzar', canReduce: false },
    { id: 'alta-011', text: 'Creá algo (texto, idea, boceto)', emoji: '💡', level: 'alta', category: 'crear', canReduce: false },
    { id: 'alta-012', text: 'Ayudá a alguien', emoji: '🤝', level: 'alta', category: 'social', canReduce: false },
    { id: 'alta-013', text: 'Dejá algo listo para tu yo de mañana', emoji: '🌅', level: 'alta', category: 'organizar', canReduce: false },
    { id: 'alta-014', text: 'Revisá y cerrá pendientes', emoji: '✅', level: 'alta', category: 'avanzar', canReduce: false }
  ]
}

export const getActionsByLevel = (level) => {
  if (!ENERGY_LEVEL_KEYS.includes(level)) {
    console.warn(`Nivel de energía inválido: ${level}`)
    return []
  }
  return actionsByEnergyLevel[level] || []
}

export const getRandomAction = (level, excludeCompletedIds = []) => {
  const actions = getActionsByLevel(level)
  const availableActions = actions.filter(
    (action) => !excludeCompletedIds.includes(action.id)
  )
  if (availableActions.length === 0) return null
  const i = Math.floor(Math.random() * availableActions.length)
  return availableActions[i]
}

export const getRandomMessageForLevel = (level) => {
  const info = ENERGY_LEVELS[level]
  if (!info || !info.messages || info.messages.length === 0) return 'Dale.'
  const i = Math.floor(Math.random() * info.messages.length)
  return info.messages[i]
}

export const getReducedAction = (action) => {
  if (!action) return null
  if (action.canReduce && action.reducedText) {
    return {
      ...action,
      text: action.reducedText,
      isReduced: true,
      emoji: action.emoji,
      parentId: action.id,
      originalId: action.originalId || action.id
    }
  }
  const idx = ENERGY_LEVEL_KEYS.indexOf(action.level)
  if (idx > 0) {
    const lower = ENERGY_LEVEL_KEYS[idx - 1]
    const lowerActions = getActionsByLevel(lower)
    if (lowerActions.length > 0) return getRandomAction(lower)
  }
  return action
}

export const getSimilarAction = (currentAction, level = null, excludeCompletedIds = []) => {
  if (!currentAction) return null
  const targetLevel = level || currentAction.level
  const actions = getActionsByLevel(targetLevel)
  const available = actions.filter((a) => !excludeCompletedIds.includes(a.id))
  const sameCategory = available.find(
    (a) => a.category === currentAction.category && a.id !== currentAction.id
  )
  if (sameCategory) return sameCategory
  return getRandomAction(targetLevel, excludeCompletedIds)
}

export const getNextEnergyLevel = (currentLevel) => {
  const i = ENERGY_LEVEL_KEYS.indexOf(currentLevel)
  if (i < ENERGY_LEVEL_KEYS.length - 1) return ENERGY_LEVEL_KEYS[i + 1]
  return currentLevel
}

export const getPreviousEnergyLevel = (currentLevel) => {
  const i = ENERGY_LEVEL_KEYS.indexOf(currentLevel)
  if (i > 0) return ENERGY_LEVEL_KEYS[i - 1]
  return currentLevel
}

export const getEnergyLevelInfo = (level) => ENERGY_LEVELS[level] || null
