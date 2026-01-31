// Niveles de energía: Baja, Media, Alta
// Tareas por sección (Mente, Cuerpo, Bienestar, Productividad, Social, Otros) y por nivel
// Cada tarea pertenece a una sola sección y un solo nivel

export const ENERGY_LEVELS = {
  baja: {
    key: 'baja',
    label: 'Baja',
    description: 'Cansancio, bloqueo, cabeza quemada',
    objective: 'Activar sin exigir',
    messages: ['Solo esto.', 'Nada más.']
  },
  media: {
    key: 'media',
    label: 'Media',
    description: 'Funcional, pero sin épica',
    objective: 'Progreso real, corto',
    messages: ['Un paso alcanza.', 'No todo. Esto.', 'Hacelo simple.']
  },
  alta: {
    key: 'alta',
    label: 'Alta',
    description: 'Ganas, foco, impulso',
    objective: 'Canalizar sin quemar',
    messages: ['Aprovechá el impulso.', 'Ahora es buen momento.']
  }
}

export const ENERGY_LEVEL_KEYS = Object.keys(ENERGY_LEVELS)

export const SECTIONS = {
  mente: { key: 'mente', label: 'Mente' },
  cuerpo: { key: 'cuerpo', label: 'Cuerpo' },
  bienestar: { key: 'bienestar', label: 'Bienestar' },
  productividad: { key: 'productividad', label: 'Productividad' },
  social: { key: 'social', label: 'Social' },
  otros: { key: 'otros', label: 'Otros' }
}

export const getSectionLabel = (sectionKey) => {
  return (SECTIONS[sectionKey] && SECTIONS[sectionKey].label) || ''
}

// Tareas por sección y nivel. Id único: section-level-n
const taskList = [
  // MENTE
  { id: 'mente-baja-1', text: 'Respirar profundo 3 veces', level: 'baja', section: 'mente', duration: 0.5, canReduce: false },
  { id: 'mente-baja-2', text: 'Cerrar los ojos 30 segundos', level: 'baja', section: 'mente', duration: 0.5, canReduce: false },
  { id: 'mente-baja-3', text: 'Nombrar una sensación actual', level: 'baja', section: 'mente', duration: 0.5, canReduce: false },
  { id: 'mente-media-1', text: 'Pensar una intención', level: 'media', section: 'mente', duration: 2, canReduce: false },
  { id: 'mente-media-2', text: 'Escribir una frase corta', level: 'media', section: 'mente', duration: 3, canReduce: false },
  { id: 'mente-media-3', text: 'Leer una página', level: 'media', section: 'mente', duration: 5, canReduce: false },
  { id: 'mente-alta-1', text: 'Ordenar una idea pendiente', level: 'alta', section: 'mente', duration: 10, canReduce: false },
  { id: 'mente-alta-2', text: 'Planear algo simple', level: 'alta', section: 'mente', duration: 10, canReduce: false },
  { id: 'mente-alta-3', text: 'Escribir y soltar una preocupación', level: 'alta', section: 'mente', duration: 10, canReduce: false },
  // CUERPO
  { id: 'cuerpo-baja-1', text: 'Estirarse 30 segundos', level: 'baja', section: 'cuerpo', duration: 0.5, canReduce: false },
  { id: 'cuerpo-baja-2', text: 'Abrir una ventana', level: 'baja', section: 'cuerpo', duration: 0.5, canReduce: false },
  { id: 'cuerpo-baja-3', text: 'Tomar agua', level: 'baja', section: 'cuerpo', duration: 1, canReduce: false },
  { id: 'cuerpo-media-1', text: 'Caminar 3 minutos', level: 'media', section: 'cuerpo', duration: 3, canReduce: false },
  { id: 'cuerpo-media-2', text: 'Hacer 5 sentadillas', level: 'media', section: 'cuerpo', duration: 2, canReduce: false },
  { id: 'cuerpo-media-3', text: 'Estirar cuello y espalda', level: 'media', section: 'cuerpo', duration: 3, canReduce: false },
  { id: 'cuerpo-alta-1', text: 'Caminar 10 minutos', level: 'alta', section: 'cuerpo', duration: 10, canReduce: false },
  { id: 'cuerpo-alta-2', text: 'Salta la soga o hacé cardio durante 5–10 min', level: 'alta', section: 'cuerpo', duration: 8, canReduce: false },
  { id: 'cuerpo-alta-3', text: 'Ordenar algo físico', level: 'alta', section: 'cuerpo', duration: 10, canReduce: false },
  // BIENESTAR
  { id: 'bienestar-baja-1', text: 'Cambiar de posición', level: 'baja', section: 'bienestar', duration: 0.5, canReduce: false },
  { id: 'bienestar-baja-2', text: 'Mirar algo que calme', level: 'baja', section: 'bienestar', duration: 1, canReduce: false },
  { id: 'bienestar-baja-3', text: 'Encender luz natural', level: 'baja', section: 'bienestar', duration: 0.5, canReduce: false },
  { id: 'bienestar-media-1', text: 'Preparar algo caliente', level: 'media', section: 'bienestar', duration: 5, canReduce: false },
  { id: 'bienestar-media-2', text: 'Ducha corta', level: 'media', section: 'bienestar', duration: 10, canReduce: false },
  { id: 'bienestar-media-3', text: 'Ordenar un espacio pequeño', level: 'media', section: 'bienestar', duration: 5, canReduce: false },
  { id: 'bienestar-alta-1', text: 'Mejorar un espacio', level: 'alta', section: 'bienestar', duration: 15, canReduce: false },
  { id: 'bienestar-alta-2', text: 'Preparar algo simple para mí', level: 'alta', section: 'bienestar', duration: 10, canReduce: false },
  { id: 'bienestar-alta-3', text: 'Crear un ritual', level: 'alta', section: 'bienestar', duration: 10, canReduce: false },
  // PRODUCTIVIDAD
  { id: 'productividad-baja-1', text: 'Abrir una app o archivo', level: 'baja', section: 'productividad', duration: 0.5, canReduce: false },
  { id: 'productividad-baja-2', text: 'Leer un mensaje pendiente', level: 'baja', section: 'productividad', duration: 1, canReduce: false },
  { id: 'productividad-baja-3', text: 'Anotar una tarea', level: 'baja', section: 'productividad', duration: 1, canReduce: false },
  { id: 'productividad-media-1', text: 'Responder un mensaje', level: 'media', section: 'productividad', duration: 3, canReduce: false },
  { id: 'productividad-media-2', text: 'Completar una tarea corta', level: 'media', section: 'productividad', duration: 5, canReduce: false },
  { id: 'productividad-media-3', text: 'Organizar una lista', level: 'media', section: 'productividad', duration: 5, canReduce: false },
  { id: 'productividad-alta-1', text: 'Avanzar 15 minutos', level: 'alta', section: 'productividad', duration: 15, canReduce: false },
  { id: 'productividad-alta-2', text: 'Resolver un pendiente', level: 'alta', section: 'productividad', duration: 15, canReduce: false },
  { id: 'productividad-alta-3', text: 'Planificar el día siguiente', level: 'alta', section: 'productividad', duration: 10, canReduce: false },
  // SOCIAL
  { id: 'social-baja-1', text: 'Pensar en alguien', level: 'baja', section: 'social', duration: 0.5, canReduce: false },
  { id: 'social-baja-2', text: 'Leer un mensaje sin responder', level: 'baja', section: 'social', duration: 1, canReduce: false },
  { id: 'social-baja-3', text: 'Reaccionar a algo', level: 'baja', section: 'social', duration: 0.5, canReduce: false },
  { id: 'social-media-1', text: 'Mandar un "hola"', level: 'media', section: 'social', duration: 1, canReduce: false },
  { id: 'social-media-2', text: 'Responder con calma', level: 'media', section: 'social', duration: 3, canReduce: false },
  { id: 'social-media-3', text: 'Agradecer algo', level: 'media', section: 'social', duration: 1, canReduce: false },
  { id: 'social-alta-1', text: 'Iniciar una charla', level: 'alta', section: 'social', duration: 10, canReduce: false },
  { id: 'social-alta-2', text: 'Proponer un plan simple', level: 'alta', section: 'social', duration: 5, canReduce: false },
  { id: 'social-alta-3', text: 'Llamar a alguien', level: 'alta', section: 'social', duration: 10, canReduce: false },
  // OTROS
  { id: 'otros-baja-1', text: 'Detenerse 10 segundos', level: 'baja', section: 'otros', duration: 0.25, canReduce: false },
  { id: 'otros-baja-2', text: 'Observar alrededor', level: 'baja', section: 'otros', duration: 0.5, canReduce: false },
  { id: 'otros-baja-3', text: 'No hacer nada un momento', level: 'baja', section: 'otros', duration: 0.5, canReduce: false },
  { id: 'otros-media-1', text: 'Elegir una cosa y hacerla', level: 'media', section: 'otros', duration: 5, canReduce: false },
  { id: 'otros-media-2', text: 'Terminar algo mínimo', level: 'media', section: 'otros', duration: 5, canReduce: false },
  { id: 'otros-media-3', text: 'Preparar lo próximo', level: 'media', section: 'otros', duration: 5, canReduce: false },
  { id: 'otros-alta-1', text: 'Resolver algo postergado', level: 'alta', section: 'otros', duration: 15, canReduce: false },
  { id: 'otros-alta-2', text: 'Tomar una decisión chica', level: 'alta', section: 'otros', duration: 10, canReduce: false },
  { id: 'otros-alta-3', text: 'Cerrar un ciclo', level: 'alta', section: 'otros', duration: 10, canReduce: false }
]

// Índice por nivel para la selección aleatoria
export const actionsByEnergyLevel = ENERGY_LEVEL_KEYS.reduce((acc, level) => {
  acc[level] = taskList.filter((t) => t.level === level)
  return acc
}, {})

export const getActionsByLevel = (level) => {
  if (!ENERGY_LEVEL_KEYS.includes(level)) return []
  return actionsByEnergyLevel[level] || []
}

export const getRandomAction = (level, excludeCompletedIds = []) => {
  const actions = getActionsByLevel(level)
  const available = actions.filter((a) => !excludeCompletedIds.includes(a.id))
  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
}

export const getRandomMessageForLevel = (level) => {
  const info = ENERGY_LEVELS[level]
  if (!info?.messages?.length) return 'Dale.'
  return info.messages[Math.floor(Math.random() * info.messages.length)]
}

export const getReducedAction = (action) => {
  if (!action) return null
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
  const sameSection = available.find(
    (a) => a.section === currentAction.section && a.id !== currentAction.id
  )
  return sameSection || getRandomAction(targetLevel, excludeCompletedIds)
}

export const getNextEnergyLevel = (currentLevel) => {
  const i = ENERGY_LEVEL_KEYS.indexOf(currentLevel)
  return i < ENERGY_LEVEL_KEYS.length - 1 ? ENERGY_LEVEL_KEYS[i + 1] : currentLevel
}

export const getPreviousEnergyLevel = (currentLevel) => {
  const i = ENERGY_LEVEL_KEYS.indexOf(currentLevel)
  return i > 0 ? ENERGY_LEVEL_KEYS[i - 1] : currentLevel
}

export const getEnergyLevelInfo = (level) => ENERGY_LEVELS[level] || null

export const isInstantTask = (action) => {
  if (!action) return false
  return (action.duration ?? 10) <= 1
}
