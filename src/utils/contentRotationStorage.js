import {
  advanceRotation,
  createInitialRotation,
  normalizeThemeIds,
  reconcileRotation,
} from './contentRotation.js'

export const CONTENT_ROTATION_STORAGE_KEY = 'falaLivre_contentRotation_v1'
export const CONTENT_ROTATION_MODULES = Object.freeze([
  'communication',
  'wordsAndPhrases',
  'writing',
  'writingNotebook',
  'dailySituations',
  'myDayRoutines',
  'myDayCommunication',
  'myDayEmotions',
])

const validModules = new Set(CONTENT_ROTATION_MODULES)

function emptyContentRotation() {
  return { version: 1, modules: {} }
}

function copyContentRotation(data) {
  return {
    version: 1,
    modules: Object.fromEntries(Object.entries(data.modules).map(([moduleId, state]) => [
      moduleId,
      { ...state, order: [...state.order] },
    ])),
  }
}

function sanitizeRotationState(state) {
  const order = normalizeThemeIds(state?.order)
  const currentIndex = Number.isInteger(state?.currentIndex)
    && state.currentIndex >= 0
    && state.currentIndex < order.length
    ? state.currentIndex
    : 0
  const cycle = Number.isInteger(state?.cycle) && state.cycle > 0 ? state.cycle : 1

  return {
    order,
    currentIndex,
    cycle,
    lastThemeId: typeof state?.lastThemeId === 'string' ? state.lastThemeId : null,
  }
}

function sanitizeContentRotation(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.version !== 1) {
    return emptyContentRotation()
  }

  const modules = data.modules && typeof data.modules === 'object' && !Array.isArray(data.modules)
    ? data.modules
    : {}

  return {
    version: 1,
    modules: Object.fromEntries(CONTENT_ROTATION_MODULES
      .filter(moduleId => Object.hasOwn(modules, moduleId))
      .map(moduleId => [moduleId, sanitizeRotationState(modules[moduleId])])),
  }
}

let memoryState = emptyContentRotation()
let memoryIsAuthoritative = false

function getStorage() {
  try {
    return globalThis.window?.localStorage ?? null
  } catch {
    return null
  }
}

export function loadContentRotation() {
  if (memoryIsAuthoritative) return copyContentRotation(memoryState)

  const storage = getStorage()
  if (!storage) {
    memoryIsAuthoritative = true
    return copyContentRotation(memoryState)
  }

  try {
    const serialized = storage.getItem(CONTENT_ROTATION_STORAGE_KEY)
    if (serialized === null) return copyContentRotation(memoryState)

    memoryState = sanitizeContentRotation(JSON.parse(serialized))
    return copyContentRotation(memoryState)
  } catch {
    memoryIsAuthoritative = true
    return copyContentRotation(memoryState)
  }
}

export function saveContentRotation(data) {
  memoryState = sanitizeContentRotation(data)
  const storage = getStorage()
  if (!storage) {
    memoryIsAuthoritative = true
    return false
  }

  try {
    storage.setItem(CONTENT_ROTATION_STORAGE_KEY, JSON.stringify(memoryState))
    memoryIsAuthoritative = false
    return true
  } catch {
    memoryIsAuthoritative = true
    return false
  }
}

function isValidModule(moduleId) {
  return typeof moduleId === 'string' && validModules.has(moduleId)
}

export function getModuleRotation(moduleId, contentIds) {
  if (!isValidModule(moduleId)) return null

  const contentRotation = loadContentRotation()
  // Preserve the old shared position when first splitting the notebook sequence.
  const savedState = contentRotation.modules[moduleId]
    ?? (moduleId === 'writingNotebook' ? contentRotation.modules.writing : undefined)
  const state = savedState
    ? reconcileRotation(savedState, contentIds)
    : createInitialRotation(contentIds)

  if (!contentRotation.modules[moduleId] || JSON.stringify(savedState) !== JSON.stringify(state)) {
    contentRotation.modules[moduleId] = state
    saveContentRotation(contentRotation)
  }

  return { ...state, order: [...state.order] }
}

export function saveModuleRotation(moduleId, state) {
  if (!isValidModule(moduleId)) return false

  const contentRotation = loadContentRotation()
  contentRotation.modules[moduleId] = sanitizeRotationState(state)
  return saveContentRotation(contentRotation)
}

export function advanceModuleRotation(moduleId, contentIds) {
  if (!isValidModule(moduleId)) return null

  const currentState = getModuleRotation(moduleId, contentIds)
  const nextState = advanceRotation(currentState, contentIds)
  saveModuleRotation(moduleId, nextState)
  return { ...nextState, order: [...nextState.order] }
}

export function clearContentRotation() {
  memoryState = emptyContentRotation()
  memoryIsAuthoritative = true
  const storage = getStorage()
  if (!storage) return false

  try {
    storage.removeItem(CONTENT_ROTATION_STORAGE_KEY)
    memoryIsAuthoritative = false
    return true
  } catch {
    return false
  }
}
