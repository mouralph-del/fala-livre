import { exploredCatalog, performedCatalog, gameCatalog, PROGRESS_VERSION, MAX_PROGRESS_BYTES } from '../data/progressCatalog.js'

export function deepFreeze(value) {
  Object.values(value).forEach(item => { if (item && typeof item === 'object' && !Object.isFrozen(item)) deepFreeze(item) })
  return Object.freeze(value)
}

export function isGeneration(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function createEmptyProgress(generation) {
  if (!isGeneration(generation)) throw new TypeError('invalid-generation')
  return deepFreeze({
    version: PROGRESS_VERSION, generation, revision: 0,
    exploredActivities: Object.fromEntries(Object.keys(exploredCatalog).map(id => [id, []])),
    performedActivities: Object.fromEntries(Object.keys(performedCatalog).map(id => [id, {}])),
    completedLevels: Object.fromEntries(Object.keys(gameCatalog).map(id => [id, []])),
  })
}

// Descriptors are checked before reading values: accessors and unusual prototypes
// are not part of the JSON contract, even when passed directly by JavaScript.
function record(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return (prototype === Object.prototype || prototype === null)
    && Reflect.ownKeys(value).every(key => typeof key === 'string'
      && !['__proto__', 'constructor', 'prototype'].includes(key)
      && Object.hasOwn(Object.getOwnPropertyDescriptor(value, key), 'value')
      && Object.getOwnPropertyDescriptor(value, key).enumerable)
}

function exactKeys(value, keys) {
  return record(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key))
}

function canonicalArray(value, catalog) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > catalog.length) return false
  if (Reflect.ownKeys(value).length !== value.length + 1) return false
  const descriptors = Object.getOwnPropertyDescriptors(value)
  for (let index = 0; index < value.length; index++) {
    if (!Object.hasOwn(descriptors[index] || {}, 'value') || typeof descriptors[index].value !== 'string') return false
  }
  const expected = catalog.filter(id => value.includes(id))
  return value.length === expected.length && value.every((id, index) => id === expected[index])
}

function prerequisitesMet(progress, moduleId, activityId) {
  const spec = performedCatalog[moduleId]
  const steps = progress.performedActivities[moduleId][activityId] || []
  return spec.prerequisites.every(step => steps.includes(step))
    && (!spec.exploredPrerequisite || progress.exploredActivities[moduleId].includes(activityId))
}

export function validateProgress(value) {
  const fail = reason => ({ valid: false, reason })
  try {
    if (!record(value)) return fail('corrupt-data')
    if (Object.hasOwn(value, 'version') && value.version !== PROGRESS_VERSION) return fail('incompatible-version')
    if (!exactKeys(value, ['version', 'generation', 'revision', 'exploredActivities', 'performedActivities', 'completedLevels'])
      || !isGeneration(value.generation) || !Number.isSafeInteger(value.revision) || value.revision < 0) return fail('corrupt-data')
    if (!exactKeys(value.exploredActivities, Object.keys(exploredCatalog))
      || !exactKeys(value.performedActivities, Object.keys(performedCatalog))
      || !exactKeys(value.completedLevels, Object.keys(gameCatalog))) return fail('corrupt-data')
    for (const [moduleId, ids] of Object.entries(exploredCatalog)) {
      if (!canonicalArray(value.exploredActivities[moduleId], ids)) return fail('corrupt-data')
    }
    for (const [moduleId, spec] of Object.entries(performedCatalog)) {
      const activities = value.performedActivities[moduleId]
      if (!record(activities) || Object.keys(activities).some(id => !spec.ids.includes(id))) return fail('corrupt-data')
      for (const [id, steps] of Object.entries(activities)) {
        if (!steps.length || !canonicalArray(steps, spec.steps)) return fail('corrupt-data')
        if (steps.includes('complete') && !prerequisitesMet(value, moduleId, id)) return fail('missing-prerequisite')
      }
    }
    for (const [gameId, levels] of Object.entries(gameCatalog)) {
      const completed = value.completedLevels[gameId]
      if (!canonicalArray(completed, levels)) return fail('corrupt-data')
      if (completed.some((id, index) => id !== levels[index])) return fail('missing-prerequisite')
    }
    if (utf8Bytes(JSON.stringify(value)) > MAX_PROGRESS_BYTES) return fail('corrupt-data')
    return { valid: true, reason: null }
  } catch { return fail('corrupt-data') }
}

export function utf8Bytes(value) { return new TextEncoder().encode(value).byteLength }

export function parseProgress(serialized) {
  if (typeof serialized !== 'string' || utf8Bytes(serialized) > MAX_PROGRESS_BYTES) return { valid: false, reason: 'corrupt-data' }
  try {
    const progress = JSON.parse(serialized)
    const validation = validateProgress(progress)
    return validation.valid ? { ...validation, progress: deepFreeze(progress) } : validation
  } catch { return { valid: false, reason: 'corrupt-data' } }
}

function canonicalCopy(progress) {
  return {
    version: PROGRESS_VERSION, generation: progress.generation, revision: progress.revision,
    exploredActivities: Object.fromEntries(Object.keys(exploredCatalog).map(id => [id, [...progress.exploredActivities[id]]])),
    performedActivities: Object.fromEntries(Object.entries(performedCatalog).map(([id, spec]) => [id,
      Object.fromEntries(spec.ids.filter(activity => Object.hasOwn(progress.performedActivities[id], activity))
        .map(activity => [activity, [...progress.performedActivities[id][activity]]])),
    ])),
    completedLevels: Object.fromEntries(Object.keys(gameCatalog).map(id => [id, [...progress.completedLevels[id]]])),
  }
}

export function serializeProgress(progress) {
  if (!validateProgress(progress).valid) throw new TypeError('invalid-progress')
  return JSON.stringify(canonicalCopy(progress))
}

const union = (a, b, catalog) => catalog.filter(id => a.includes(id) || b.includes(id))
const rejected = reason => ({ valid: false, changed: false, reason })

// Internal command shape is closed and never exported as a storage API.
function checkCommand(command) {
  if (!record(command) || typeof command.type !== 'string') return 'invalid-argument'
  const performed = command.type === 'performed'
  if (!['explored', 'performed', 'completed'].includes(command.type)
    || !exactKeys(command, performed ? ['type', 'moduleId', 'activityId', 'steps'] : command.type === 'completed' ? ['type', 'gameId', 'levelId'] : ['type', 'moduleId', 'activityId'])) return 'invalid-argument'
  const moduleId = command.type === 'completed' ? command.gameId : command.moduleId
  const activityId = command.type === 'completed' ? command.levelId : command.activityId
  if (typeof moduleId !== 'string' || typeof activityId !== 'string') return 'invalid-argument'
  const catalog = performed ? performedCatalog : command.type === 'completed' ? gameCatalog : exploredCatalog
  if (!Object.hasOwn(catalog, moduleId)) return 'unknown-id'
  const ids = performed ? catalog[moduleId].ids : catalog[moduleId]
  if (!ids.includes(activityId)) return 'unknown-id'
  if (performed) {
    if (!Array.isArray(command.steps) || !command.steps.length || !canonicalArray(command.steps, catalog[moduleId].steps)) return 'invalid-step'
  }
  return null
}

export function validateProgressCommand(command) {
  try { return checkCommand(command) } catch { return 'invalid-argument' }
}

export function applyProgressCommand(progress, command) {
  const validation = validateProgress(progress)
  if (!validation.valid) return rejected(validation.reason)
  const reason = validateProgressCommand(command)
  if (reason) return rejected(reason)
  const next = canonicalCopy(progress)
  if (command.type === 'explored') {
    next.exploredActivities[command.moduleId] = union(next.exploredActivities[command.moduleId], [command.activityId], exploredCatalog[command.moduleId])
  } else if (command.type === 'performed') {
    const activities = next.performedActivities[command.moduleId]
    activities[command.activityId] = union(activities[command.activityId] || [], command.steps, performedCatalog[command.moduleId].steps)
  } else {
    next.completedLevels[command.gameId] = union(next.completedLevels[command.gameId], [command.levelId], gameCatalog[command.gameId])
  }
  const candidate = validateProgress(next)
  if (!candidate.valid) return rejected(candidate.reason)
  const changed = JSON.stringify(next) !== serializeProgress(progress)
  return { valid: true, changed, reason: null, progress: changed ? deepFreeze(next) : progress }
}

export function mergeProgress(a, b) {
  for (const item of [a, b]) { const validation = validateProgress(item); if (!validation.valid) return rejected(validation.reason) }
  if (a.generation !== b.generation) return rejected('stale-generation')
  const next = canonicalCopy(a)
  next.revision = Math.max(a.revision, b.revision)
  for (const [id, ids] of Object.entries(exploredCatalog)) next.exploredActivities[id] = union(a.exploredActivities[id], b.exploredActivities[id], ids)
  for (const [id, spec] of Object.entries(performedCatalog)) {
    next.performedActivities[id] = Object.fromEntries(spec.ids.filter(activity => a.performedActivities[id][activity] || b.performedActivities[id][activity])
      .map(activity => [activity, union(a.performedActivities[id][activity] || [], b.performedActivities[id][activity] || [], spec.steps)]))
  }
  for (const [id, levels] of Object.entries(gameCatalog)) next.completedLevels[id] = union(a.completedLevels[id], b.completedLevels[id], levels)
  return { valid: true, changed: serializeProgress(a) !== JSON.stringify(next), reason: null, progress: deepFreeze(next) }
}

export function getLevelAvailability(progress, gameId, levelId) {
  if (!validateProgress(progress).valid || typeof gameId !== 'string' || !Object.hasOwn(gameCatalog, gameId)) return { status: 'unknown', prerequisiteLevelId: null }
  const index = gameCatalog[gameId].indexOf(levelId)
  if (index < 0) return { status: 'unknown', prerequisiteLevelId: null }
  const prerequisiteLevelId = index === 0 ? null : gameCatalog[gameId][index - 1]
  return { status: prerequisiteLevelId === null || progress.completedLevels[gameId].includes(prerequisiteLevelId) ? 'available' : 'blocked', prerequisiteLevelId }
}

export function hasActivityExplored(progress, moduleId, activityId) {
  return validateProgress(progress).valid && typeof moduleId === 'string' && Object.hasOwn(exploredCatalog, moduleId) && progress.exploredActivities[moduleId].includes(activityId)
}

export function hasActivityPerformed(progress, moduleId, activityId, step) {
  return validateProgress(progress).valid && typeof moduleId === 'string' && Object.hasOwn(performedCatalog, moduleId)
    && Object.hasOwn(progress.performedActivities[moduleId], activityId) && progress.performedActivities[moduleId][activityId].includes(step)
}
