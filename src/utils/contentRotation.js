function normalizeThemeIds(themeIds) {
  if (!Array.isArray(themeIds)) return []

  return [...new Set(themeIds.filter(themeId => typeof themeId === 'string' && themeId.trim()))]
}

function safeRandom(randomFn) {
  const value = Number(randomFn())
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(value, 0), 0.999999999)
}

function shuffleThemeIds(themeIds, randomFn) {
  const order = [...themeIds]

  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(safeRandom(randomFn) * (index + 1))
    ;[order[index], order[swapIndex]] = [order[swapIndex], order[index]]
  }

  return order
}

function validCycleNumber(value) {
  return Number.isInteger(value) && value > 0 ? value : 1
}

function emptyRotation(cycle = 1) {
  return {
    order: [],
    currentIndex: 0,
    cycle,
    lastThemeId: null,
  }
}

export function createRotationCycle(themeIds, previousThemeId = null, randomFn = Math.random) {
  const ids = normalizeThemeIds(themeIds)
  if (!ids.length) return emptyRotation()

  const order = shuffleThemeIds(ids, randomFn)
  if (ids.length > 1 && order[0] === previousThemeId) {
    const swapIndex = order.findIndex(themeId => themeId !== previousThemeId)
    ;[order[0], order[swapIndex]] = [order[swapIndex], order[0]]
  }

  return {
    order,
    currentIndex: 0,
    cycle: 1,
    lastThemeId: null,
  }
}

export function createInitialRotation(themeIds, randomFn = Math.random) {
  return createRotationCycle(themeIds, null, randomFn)
}

export function getCurrentTheme(rotationState) {
  if (!rotationState || !Array.isArray(rotationState.order)) return null
  if (!Number.isInteger(rotationState.currentIndex)) return null
  return rotationState.order[rotationState.currentIndex] || null
}

export function normalizeRotationState(rotationState, themeIds, randomFn = Math.random) {
  const ids = normalizeThemeIds(themeIds)
  const cycle = validCycleNumber(rotationState?.cycle)
  if (!ids.length) return emptyRotation(cycle)

  if (!rotationState || !Array.isArray(rotationState.order)) {
    const initial = createRotationCycle(ids, null, randomFn)
    return { ...initial, cycle }
  }

  const availableOrder = normalizeThemeIds(rotationState.order).filter(themeId => ids.includes(themeId))
  const currentTheme = getCurrentTheme(rotationState)
  const currentThemeStillAvailable = ids.includes(currentTheme)
  const missingThemeIds = ids.filter(themeId => !availableOrder.includes(themeId))

  if (!availableOrder.length || (currentTheme && !currentThemeStillAvailable)) {
    const fallback = createRotationCycle(ids, ids.includes(rotationState.lastThemeId) ? rotationState.lastThemeId : null, randomFn)
    return { ...fallback, cycle }
  }

  const order = [...availableOrder, ...missingThemeIds]
  const currentIndex = order.indexOf(currentTheme)
  if (currentIndex < 0) {
    const fallback = createRotationCycle(ids, ids.includes(rotationState.lastThemeId) ? rotationState.lastThemeId : null, randomFn)
    return { ...fallback, cycle }
  }

  return {
    order,
    currentIndex,
    cycle,
    lastThemeId: ids.includes(rotationState.lastThemeId) ? rotationState.lastThemeId : null,
  }
}

export function advanceRotation(rotationState, themeIds, randomFn = Math.random) {
  const normalized = normalizeRotationState(rotationState, themeIds, randomFn)
  if (!normalized.order.length) return normalized

  const currentTheme = getCurrentTheme(normalized)
  if (normalized.currentIndex < normalized.order.length - 1) {
    return {
      ...normalized,
      currentIndex: normalized.currentIndex + 1,
      lastThemeId: currentTheme,
    }
  }

  const nextCycle = createRotationCycle(normalized.order, currentTheme, randomFn)
  return {
    ...nextCycle,
    cycle: normalized.cycle + 1,
    lastThemeId: currentTheme,
  }
}
