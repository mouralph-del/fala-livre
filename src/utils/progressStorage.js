import {
  applyProgressCommand, createEmptyProgress, deepFreeze, mergeProgress,
  parseProgress, serializeProgress, validateProgressCommand, isGeneration,
} from './progress.js'

export const PROGRESS_STORAGE_KEY = 'falaLivre_progress_v1'
export const PROGRESS_LOCK_NAME = 'falaLivre:progress'
export const PROGRESS_LOCK_TIMEOUT_MS = 5000

const result = (status, changed, reason = null) => Object.freeze({ status, changed, persisted: status === 'saved' || status === 'unchanged', reason })
const issueFor = status => ({ unavailable: 'read-unavailable', corrupt: 'corrupt-data', incompatible: 'incompatible-version', conflict: 'conflict' })[status] || null

// Dependencies are lazy and injectable. Importing this module never reads or
// writes storage, generates identities, or attaches browser listeners.
export function createProgressStore({
  getStorage = () => globalThis.window?.localStorage,
  getLocks = () => globalThis.navigator?.locks,
  createGeneration = () => globalThis.crypto.randomUUID(),
  getEventTarget = () => globalThis.window,
  getDocument = () => globalThis.document,
  timeoutMs = PROGRESS_LOCK_TIMEOUT_MS,
} = {}) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new TypeError('invalid-timeout')
  // sessionProgress is a cumulative temporary view including its known
  // prerequisites, not a list to flush. persistedProgress is the last current
  // validated durable read; effectiveProgress is the view for pure queries.
  // persistenceStatus='not-loaded' distinguishes the initial placeholder from
  // a confirmed absent read. No storage is touched to produce this snapshot.
  let snapshot = deepFreeze({ status: 'absent', persistedProgress: null, sessionProgress: null, effectiveProgress: null, persistenceStatus: 'not-loaded', issueCode: null })
  let known = null
  let invalidated = false
  let queue = Promise.resolve()
  const listeners = new Set()
  let detach = null

  function publish(next) {
    if (JSON.stringify(next) === JSON.stringify(snapshot)) return
    snapshot = deepFreeze(next)
    for (const listener of listeners) {
      // Subscriber failures cannot change a confirmed persistence result.
      try { listener() } catch { /* Do not log callback data. */ }
    }
  }

  function read() {
    try {
      const storage = getStorage()
      if (!storage) return { status: 'unavailable', progress: null }
      const raw = storage.getItem(PROGRESS_STORAGE_KEY)
      if (raw === null) return { status: 'absent', progress: null }
      const parsed = parseProgress(raw)
      return parsed.valid ? { status: 'ready', progress: parsed.progress }
        : { status: parsed.reason === 'incompatible-version' ? 'incompatible' : 'corrupt', progress: null }
    } catch { return { status: 'unavailable', progress: null } }
  }

  function reconcile(reading) {
    let { status, progress } = reading
    let session = snapshot.sessionProgress
    if (status === 'ready') {
      if (known && progress.generation === known.generation) {
        const merged = mergeProgress(known, progress)
        const regression = progress.revision < known.revision
          || (progress.revision === known.revision && serializeProgress(progress) !== serializeProgress(known))
          || serializeProgress(merged.progress) !== serializeProgress(progress)
        if (regression) { status = 'conflict'; progress = null; invalidated = true; session = null }
      } else if ((known && progress.generation !== known.generation) || (session && progress.generation !== session.generation)) {
        session = null
      }
      if (status === 'ready') { known = progress; invalidated = false }
    } else if (status === 'absent' && known) {
      status = 'conflict'; invalidated = true; session = null
    }
    const effective = progress ? (session ? mergeProgress(progress, session).progress : progress) : session
    publish({ status, persistedProgress: progress, sessionProgress: session, effectiveProgress: effective,
      persistenceStatus: session ? 'session-only' : status === 'ready' ? 'persisted' : 'unavailable', issueCode: issueFor(status) })
    return snapshot
  }

  function enqueue(operation) {
    const task = queue.then(operation)
    queue = task.catch(() => {})
    return task
  }

  async function coordinated(operation) {
    let locks
    try { locks = getLocks() } catch { return { failure: 'coordination-unavailable' } }
    if (!locks || typeof locks.request !== 'function') return { failure: 'coordination-unavailable' }
    const controller = new AbortController()
    let entered = false
    let expired = false
    const timer = setTimeout(() => { if (!entered) { expired = true; controller.abort() } }, timeoutMs)
    try {
      return await locks.request(PROGRESS_LOCK_NAME, { mode: 'exclusive', signal: controller.signal }, () => {
        if (expired || controller.signal.aborted) return { failure: 'lock-timeout' }
        entered = true
        clearTimeout(timer)
        // No awaits inside the critical section: validate/read/write/verify only.
        return operation()
      })
    } catch { return { failure: expired ? 'lock-timeout' : 'coordination-unavailable' } }
    finally { clearTimeout(timer) }
  }

  function fresh() {
    const generation = createGeneration()
    if (!isGeneration(generation)) throw new TypeError('invalid-generation')
    return createEmptyProgress(generation)
  }

  function persist(candidate) {
    try {
      getStorage().setItem(PROGRESS_STORAGE_KEY, serializeProgress(candidate))
    } catch { return { failure: 'write-failed' } }
    const after = read()
    if (after.status !== 'ready') {
      reconcile(after)
      return { failure: issueFor(after.status) || 'conflict' }
    }
    if (serializeProgress(after.progress) !== serializeProgress(candidate)) {
      invalidated = true
      publish({ ...snapshot, status: 'conflict', persistedProgress: null, sessionProgress: null, effectiveProgress: null, persistenceStatus: 'unavailable', issueCode: 'conflict' })
      return { failure: 'conflict' }
    }
    reconcile(after)
    return { progress: after.progress }
  }

  function sessionRecord(command, reason, generation) {
    if (invalidated || (generation && snapshot.effectiveProgress && generation !== snapshot.effectiveProgress.generation)) return result('rejected', false, 'stale-generation')
    // A read failure must not reinterpret previously validated evidence as an
    // empty state or assign it a new generation. Cached evidence is temporary.
    let base = snapshot.effectiveProgress || known
    if (!base) {
      try { base = fresh() } catch { return result('rejected', false, 'invalid-argument') }
    }
    const applied = applyProgressCommand(base, command)
    if (!applied.valid) return result('rejected', false, applied.reason)
    publish({ ...snapshot, sessionProgress: applied.progress, effectiveProgress: applied.progress, persistenceStatus: 'session-only', issueCode: reason })
    return result('session-only', applied.changed, reason)
  }

  function submit(command, argumentCount, expectedCount) {
    const failure = argumentCount !== expectedCount ? 'invalid-argument' : validateProgressCommand(command)
    if (failure) return Promise.resolve(result('rejected', false, failure))
    // Immutable, validated command and generation are captured before waiting.
    const captured = deepFreeze({ ...command, ...(command.steps ? { steps: [...command.steps] } : {}) })
    const generation = snapshot.effectiveProgress?.generation || known?.generation || null
    return enqueue(async () => {
      if (invalidated) return result('rejected', false, 'stale-generation')
      if (generation && snapshot.effectiveProgress && snapshot.effectiveProgress.generation !== generation) return result('rejected', false, 'stale-generation')
      const outcome = await coordinated(() => {
        const reading = read()
        reconcile(reading)
        if (invalidated) return { failure: 'stale-generation' }
        if (reading.status !== 'ready') return { failure: issueFor(reading.status) || 'read-unavailable' }
        // Explicit initialization is required before durable commands.
        if (!generation || generation !== reading.progress.generation) return { failure: 'stale-generation' }
        const applied = applyProgressCommand(reading.progress, captured)
        if (!applied.valid) return { failure: applied.reason }
        if (!applied.changed) return { response: result('unchanged', false) }
        if (reading.progress.revision === Number.MAX_SAFE_INTEGER) return { failure: 'conflict' }
        const candidate = deepFreeze({ ...applied.progress, revision: reading.progress.revision + 1 })
        const saved = persist(candidate)
        return saved.failure ? saved : { response: result('saved', true) }
      })
      if (outcome.response) return outcome.response
      if (['stale-generation', 'conflict'].includes(outcome.failure)) return result('rejected', false, outcome.failure)
      // Even without locks, refresh the generation before accepting temporary
      // evidence. This is a read only, never an unsafe persistence fallback.
      if (['coordination-unavailable', 'lock-timeout'].includes(outcome.failure)) reconcile(read())
      // Do not flush the session cache when persistence returns. A current
      // command can remain session-only when its prerequisites exist only there.
      return sessionRecord(captured, outcome.failure, generation)
    })
  }

  function loadProgress() { return enqueue(() => reconcile(read())) }

  function initializeProgress() {
    return enqueue(async () => {
      if (invalidated) return result('rejected', false, 'stale-generation')
      const outcome = await coordinated(() => {
        const reading = read()
        reconcile(reading)
        if (invalidated) return { failure: 'stale-generation' }
        if (reading.status === 'ready') return { response: result('unchanged', false) }
        if (reading.status !== 'absent') return { failure: issueFor(reading.status) }
        let empty
        try { empty = fresh() } catch { return { failure: 'invalid-argument' } }
        const saved = persist(empty)
        return saved.failure ? saved : { response: result('saved', true) }
      })
      if (outcome.response) return outcome.response
      if (!['coordination-unavailable', 'lock-timeout', 'write-failed', 'read-unavailable'].includes(outcome.failure)) return result('rejected', false, outcome.failure)
      const current = reconcile(read())
      if (invalidated || ['corrupt', 'incompatible', 'conflict'].includes(current.status)) return result('rejected', false, issueFor(current.status) || 'stale-generation')
      if (!snapshot.effectiveProgress) {
        let empty
        try { empty = fresh() } catch { return result('rejected', false, 'invalid-argument') }
        publish({ ...snapshot, sessionProgress: empty, effectiveProgress: empty, persistenceStatus: 'session-only', issueCode: outcome.failure })
      } else publish({ ...snapshot, persistenceStatus: 'session-only', issueCode: outcome.failure })
      return result('session-only', false, outcome.failure)
    })
  }

  function attachListeners() {
    const target = getEventTarget()
    const document = getDocument()
    const refresh = () => { void loadProgress() }
    const storage = event => {
      if (event.key === PROGRESS_STORAGE_KEY || event.key === null) {
        // Validate the current value, never trust or persist event.newValue.
        refresh()
      }
    }
    const visible = () => { if (document?.visibilityState === 'visible') refresh() }
    target?.addEventListener('storage', storage)
    target?.addEventListener('pageshow', refresh)
    target?.addEventListener('focus', refresh)
    document?.addEventListener('visibilitychange', visible)
    detach = () => {
      target?.removeEventListener('storage', storage)
      target?.removeEventListener('pageshow', refresh)
      target?.removeEventListener('focus', refresh)
      document?.removeEventListener('visibilitychange', visible)
    }
  }

  function subscribeProgress(listener) {
    if (typeof listener !== 'function') throw new TypeError('invalid-listener')
    // Each subscription owns its callback, including repeated subscribers.
    const callback = () => listener()
    listeners.add(callback)
    if (listeners.size === 1) attachListeners()
    return () => {
      listeners.delete(callback)
      if (!listeners.size && detach) { detach(); detach = null }
    }
  }

  return Object.freeze({
    loadProgress, initializeProgress,
    recordActivityExplored(...args) { return submit({ type: 'explored', moduleId: args[0], activityId: args[1] }, args.length, 2) },
    recordActivityPerformed(...args) { return submit({ type: 'performed', moduleId: args[0], activityId: args[1], steps: args[2] }, args.length, 3) },
    recordLevelCompleted(...args) { return submit({ type: 'completed', gameId: args[0], levelId: args[1] }, args.length, 2) },
    getProgressSnapshot: () => snapshot,
    subscribeProgress,
  })
}

export const progressStore = createProgressStore()
export const { loadProgress, initializeProgress, recordActivityExplored, recordActivityPerformed, recordLevelCompleted, getProgressSnapshot, subscribeProgress } = progressStore
