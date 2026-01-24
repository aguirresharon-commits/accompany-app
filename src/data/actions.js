// Datos de acciones mínimas organizadas por nivel de energía
// Basado en "Hábitos Atómicos" - Enfoque empático y sin culpa

// Constantes para niveles de energía
export const ENERGY_LEVELS = {
  veryLow: {
    key: 'veryLow',
    label: 'Muy baja',
    emoji: '🔴',
    description: 'Bloqueo / pozo'
  },
  low: {
    key: 'low',
    label: 'Baja-media',
    emoji: '🟡',
    description: 'Un poco más de margen'
  },
  medium: {
    key: 'medium',
    label: 'Media',
    emoji: '🟢',
    description: 'Ya estás en movimiento'
  },
  good: {
    key: 'good',
    label: 'Buena',
    emoji: '🔵',
    description: 'Tienes energía'
  }
}

export const ENERGY_LEVEL_KEYS = Object.keys(ENERGY_LEVELS)

// Estructura de acciones por nivel de energía
export const actionsByEnergyLevel = {
  // 🔴 Energía muy baja - Para días donde cuesta todo
  // Objetivo: mover el cuerpo apenas
  veryLow: [
    {
      id: 'very-low-001',
      text: 'Tomá un vaso de agua',
      level: 'veryLow',
      category: 'movimiento',
      canReduce: false
    },
    {
      id: 'very-low-002',
      text: 'Abrí la ventana',
      level: 'veryLow',
      category: 'movimiento',
      canReduce: false
    },
    {
      id: 'very-low-003',
      text: 'Cambiáte de ropa',
      level: 'veryLow',
      category: 'movimiento',
      canReduce: false
    },
    {
      id: 'very-low-004',
      text: 'Laváte la cara',
      level: 'veryLow',
      category: 'higiene',
      canReduce: false
    },
    {
      id: 'very-low-005',
      text: 'Ordená una sola cosa',
      level: 'veryLow',
      category: 'orden',
      canReduce: true,
      reducedText: 'Tocá un objeto y movelo un poco'
    },
    {
      id: 'very-low-006',
      text: 'Tirate agua en las manos',
      level: 'veryLow',
      category: 'movimiento',
      canReduce: false
    },
    {
      id: 'very-low-007',
      text: 'Parate y sentate de nuevo',
      level: 'veryLow',
      category: 'movimiento',
      canReduce: false
    },
    {
      id: 'very-low-008',
      text: 'Respirar profundo 3 veces',
      level: 'veryLow',
      category: 'bienestar',
      canReduce: true,
      reducedText: 'Respirar profundo 1 vez'
    }
  ],

  // 🟡 Energía baja-media - Para cuando hay un poco más de margen
  // Objetivo: generar sensación de control
  low: [
    {
      id: 'low-001',
      text: 'Ordená la cama',
      level: 'low',
      category: 'orden',
      canReduce: true,
      reducedText: 'Acomodá solo la almohada'
    },
    {
      id: 'low-002',
      text: 'Juntá la ropa del piso',
      level: 'low',
      category: 'orden',
      canReduce: true,
      reducedText: 'Juntá solo una prenda'
    },
    {
      id: 'low-003',
      text: 'Laváte los dientes',
      level: 'low',
      category: 'higiene',
      canReduce: false
    },
    {
      id: 'low-004',
      text: 'Ducha rápida',
      level: 'low',
      category: 'higiene',
      canReduce: true,
      reducedText: 'Laváte solo las manos y la cara'
    },
    {
      id: 'low-005',
      text: 'Sacá la basura',
      level: 'low',
      category: 'orden',
      canReduce: true,
      reducedText: 'Juntá solo un papel o envase'
    },
    {
      id: 'low-006',
      text: 'Caminá 2 minutos',
      level: 'low',
      category: 'movimiento',
      canReduce: true,
      reducedText: 'Parate y caminá hasta la puerta'
    },
    {
      id: 'low-007',
      text: 'Limpiá una superficie chica',
      level: 'low',
      category: 'orden',
      canReduce: true,
      reducedText: 'Pasá un trapo por un lugar pequeño'
    },
    {
      id: 'low-008',
      text: 'Prepará algo simple para comer',
      level: 'low',
      category: 'bienestar',
      canReduce: true,
      reducedText: 'Tomá un vaso de agua o una fruta'
    }
  ],

  // 🟢 Energía media - Cuando la persona ya está en movimiento
  // Objetivo: sostener el ritmo, no exigir
  medium: [
    {
      id: 'medium-001',
      text: 'Ordená una parte del cuarto',
      level: 'medium',
      category: 'orden',
      canReduce: true,
      reducedText: 'Ordená solo el escritorio o la cama'
    },
    {
      id: 'medium-002',
      text: 'Salí a caminar 5 minutos',
      level: 'medium',
      category: 'movimiento',
      canReduce: true,
      reducedText: 'Salí a caminar 2 minutos'
    },
    {
      id: 'medium-003',
      text: 'Dejá lista la ropa de mañana',
      level: 'medium',
      category: 'organización',
      canReduce: true,
      reducedText: 'Pensá qué ropa usarás mañana'
    },
    {
      id: 'medium-004',
      text: 'Lavá algunos platos',
      level: 'medium',
      category: 'orden',
      canReduce: true,
      reducedText: 'Lavá solo un plato o vaso'
    },
    {
      id: 'medium-005',
      text: 'Organizá una mochila o bolso',
      level: 'medium',
      category: 'organización',
      canReduce: true,
      reducedText: 'Revisá qué hay en tu mochila'
    },
    {
      id: 'medium-006',
      text: 'Escribí una lista corta de pendientes',
      level: 'medium',
      category: 'organización',
      canReduce: true,
      reducedText: 'Pensá en una cosa que tenés que hacer'
    }
  ],

  // 🔵 Energía buena - No es el foco principal, pero existe
  // La app nunca asume que este nivel es constante
  good: [
    {
      id: 'good-001',
      text: 'Ordená el cuarto',
      level: 'good',
      category: 'orden',
      canReduce: true,
      reducedText: 'Ordená una parte del cuarto'
    },
    {
      id: 'good-002',
      text: 'Salí a caminar 10-15 minutos',
      level: 'good',
      category: 'movimiento',
      canReduce: true,
      reducedText: 'Salí a caminar 5 minutos'
    },
    {
      id: 'good-003',
      text: 'Avanzá 10 minutos en una tarea pendiente',
      level: 'good',
      category: 'productividad',
      canReduce: true,
      reducedText: 'Avanzá 5 minutos en una tarea'
    },
    {
      id: 'good-004',
      text: 'Organizá el día siguiente',
      level: 'good',
      category: 'organización',
      canReduce: true,
      reducedText: 'Pensá en 2-3 cosas para mañana'
    }
  ]
}

// Función para obtener todas las acciones de un nivel específico
export const getActionsByLevel = (level) => {
  if (!ENERGY_LEVEL_KEYS.includes(level)) {
    console.warn(`Nivel de energía inválido: ${level}`)
    return []
  }
  return actionsByEnergyLevel[level] || []
}

// Función para obtener una acción aleatoria de un nivel
export const getRandomAction = (level) => {
  const actions = getActionsByLevel(level)
  if (actions.length === 0) {
    return null
  }
  const randomIndex = Math.floor(Math.random() * actions.length)
  return actions[randomIndex]
}

// Función para obtener la versión reducida de una acción
export const getReducedAction = (action) => {
  if (!action) return null
  
  if (action.canReduce && action.reducedText) {
    return {
      ...action,
      text: action.reducedText,
      isReduced: true
    }
  }
  
  // Si no tiene versión reducida, buscar una acción del nivel anterior
  const currentLevelIndex = ENERGY_LEVEL_KEYS.indexOf(action.level)
  if (currentLevelIndex > 0) {
    const lowerLevel = ENERGY_LEVEL_KEYS[currentLevelIndex - 1]
    const lowerLevelActions = getActionsByLevel(lowerLevel)
    if (lowerLevelActions.length > 0) {
      return getRandomAction(lowerLevel)
    }
  }
  
  // Si no hay nivel anterior, retornar la misma acción
  return action
}

// Función para obtener una acción similar (misma categoría o nivel cercano)
export const getSimilarAction = (currentAction, level = null) => {
  if (!currentAction) return null
  
  const targetLevel = level || currentAction.level
  const actions = getActionsByLevel(targetLevel)
  
  // Intentar encontrar una acción de la misma categoría
  const sameCategory = actions.find(
    action => action.category === currentAction.category && action.id !== currentAction.id
  )
  
  if (sameCategory) {
    return sameCategory
  }
  
  // Si no hay de la misma categoría, retornar una aleatoria del mismo nivel
  return getRandomAction(targetLevel)
}

// Función para obtener el siguiente nivel de energía (para escalado progresivo)
export const getNextEnergyLevel = (currentLevel) => {
  const currentIndex = ENERGY_LEVEL_KEYS.indexOf(currentLevel)
  if (currentIndex < ENERGY_LEVEL_KEYS.length - 1) {
    return ENERGY_LEVEL_KEYS[currentIndex + 1]
  }
  return currentLevel // Ya está en el nivel más alto
}

// Función para obtener el nivel anterior de energía
export const getPreviousEnergyLevel = (currentLevel) => {
  const currentIndex = ENERGY_LEVEL_KEYS.indexOf(currentLevel)
  if (currentIndex > 0) {
    return ENERGY_LEVEL_KEYS[currentIndex - 1]
  }
  return currentLevel // Ya está en el nivel más bajo
}

// Función para obtener información completa de un nivel
export const getEnergyLevelInfo = (level) => {
  return ENERGY_LEVELS[level] || null
}
