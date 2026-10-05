import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createProgressStore, PROGRESS_STORAGE_KEY as KEY, PROGRESS_LOCK_NAME, PROGRESS_LOCK_TIMEOUT_MS } from '../src/utils/progressStorage.js'
import { createEmptyProgress, serializeProgress, getLevelAvailability } from '../src/utils/progress.js'

const g1 = '00000000-0000-4000-8000-000000000001', g2 = '00000000-0000-4000-8000-000000000002'
class MemoryStorage {
  value = null; writes = 0; failRead = false; failWrite = false; divergent = false; afterWrite = false
  getItem(key) { assert.equal(key, KEY); if (this.failRead || (this.afterWrite && this.writes)) throw Error('read'); return this.value }
  setItem(key, value) { assert.equal(key, KEY); if (this.failWrite) throw Error('quota'); this.writes++; this.value = this.divergent ? serializeProgress(createEmptyProgress(g2)) : value }
}
class Locks {
  queue = Promise.resolve(); calls = 0
  request(name, options, callback) {
    assert.equal(name, PROGRESS_LOCK_NAME); assert.equal(options.mode, 'exclusive'); this.calls++
    const operation = this.queue.then(() => { if (options.signal.aborted) throw Error('aborted'); return callback() })
    this.queue = operation.catch(() => {})
    return operation
  }
}
class Events {
  listeners = new Map(); visibilityState = 'visible'
  addEventListener(name, listener) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(listener) }
  removeEventListener(name, listener) { this.listeners.get(name)?.delete(listener) }
  fire(name, event = {}) { for (const listener of this.listeners.get(name) || []) listener(event) }
  count() { return [...this.listeners.values()].reduce((n, set) => n + set.size, 0) }
}
function fixture(options = {}) {
  const storage = options.storage || new MemoryStorage(), locks = options.locks === undefined ? new Locks() : options.locks
  const events = new Events(), document = new Events()
  const store = createProgressStore({ getStorage: () => storage, getLocks: () => locks, createGeneration: () => g1, getEventTarget: () => events, getDocument: () => document, ...options })
  return { store, storage, locks, events, document }
}

test('lazy import, read-only absent load, explicit initialization, confirmed persistence and refresh', async () => {
  const { store, storage } = fixture()
  assert.equal(storage.writes, 0)
  const first = store.getProgressSnapshot(); assert.equal(first, store.getProgressSnapshot())
  assert.equal((await store.loadProgress()).status, 'absent'); assert.equal(storage.writes, 0)
  assert.equal((await store.initializeProgress()).status, 'saved')
  assert.equal(store.getProgressSnapshot().persistedProgress.revision, 0)
  const saved = await store.recordLevelCompleted('caminho', 'sono'); assert.deepEqual(saved, { status: 'saved', changed: true, persisted: true, reason: null })
  assert.equal(store.getProgressSnapshot().persistedProgress.revision, 1)
  const snapshot = store.getProgressSnapshot()
  assert.equal((await store.recordLevelCompleted('caminho', 'sono')).status, 'unchanged')
  assert.equal(store.getProgressSnapshot(), snapshot); assert.equal(storage.writes, 2)
  const refresh = fixture({ storage }).store; await refresh.loadProgress()
  assert.equal(getLevelAvailability(refresh.getProgressSnapshot().effectiveProgress, 'caminho', 'sede').status, 'available')
})

test('two stores share initialization and serialize simultaneous distinct updates', async () => {
  const { storage, locks, store: a } = fixture(), b = fixture({ storage, locks, createGeneration: () => g2 }).store
  await Promise.all([a.initializeProgress(), b.initializeProgress()])
  assert.equal(storage.writes, 1)
  assert.equal(a.getProgressSnapshot().effectiveProgress.generation, b.getProgressSnapshot().effectiveProgress.generation)
  await Promise.all([a.recordLevelCompleted('caminho', 'sono'), b.recordLevelCompleted('memoria', 'memory-1')])
  await a.loadProgress()
  const data = a.getProgressSnapshot().persistedProgress
  assert.deepEqual(data.completedLevels.caminho, ['sono']); assert.deepEqual(data.completedLevels.memoria, ['memory-1']); assert.equal(data.revision, 2)
})

test('unavailable, corrupt, incompatible and oversize reads never overwrite originals', async () => {
  for (const raw of ['{', JSON.stringify({ version: 2 }), JSON.stringify({ version: 1, name: 'private' }), 'á'.repeat(9000)]) {
    const { store, storage } = fixture(); storage.value = raw
    const reading = await store.loadProgress(); assert.ok(['corrupt', 'incompatible'].includes(reading.status))
    assert.equal(reading.persistedProgress, null)
    assert.equal((await store.initializeProgress()).status, 'rejected')
    const record = await store.recordActivityExplored('communication', 'guided-exploration')
    assert.equal(record.status, 'session-only'); assert.equal(record.persisted, false)
    assert.equal(storage.writes, 0); assert.equal(storage.value, raw)
    assert.equal(JSON.stringify(store.getProgressSnapshot()).includes('private'), false)
  }
  const { store, storage } = fixture(); storage.failRead = true
  assert.equal((await store.loadProgress()).status, 'unavailable')
  assert.equal((await store.recordLevelCompleted('caminho', 'sono')).reason, 'read-unavailable')
  assert.equal(storage.writes, 0)
  const absentStorage = fixture({ getStorage: () => { throw Error('security') } }).store
  assert.equal((await absentStorage.loadProgress()).status, 'unavailable')
})

test('missing prerequisites reject without writing; terminal batch and exact public arguments', async () => {
  const { store, storage } = fixture(); await store.initializeProgress()
  assert.equal((await store.recordActivityPerformed('wordsAndPhrases', 'casa', ['sentence', 'complete'])).reason, 'missing-prerequisite')
  assert.equal(storage.writes, 1)
  await store.recordActivityExplored('wordsAndPhrases', 'casa')
  await store.recordActivityPerformed('wordsAndPhrases', 'casa', ['build'])
  assert.equal((await store.recordActivityPerformed('wordsAndPhrases', 'casa', ['sentence', 'complete'])).status, 'saved')
  await store.recordActivityPerformed('writing', 'cama', ['typing'])
  assert.equal((await store.recordActivityPerformed('writing', 'cama', ['notebook', 'complete'])).status, 'saved')
  for (const args of [['communication', 'state'], ['__proto__', 'guided-exploration'], ['communication', { message: 'private' }], ['communication', 'guided-exploration', { name: 'private' }]]) assert.equal((await store.recordActivityExplored(...args)).status, 'rejected')
  assert.equal((await store.recordActivityPerformed('writing', 'casa', ['drawing'])).reason, 'invalid-step')
})

test('write/quota failure preserves session continuity, revision and no automatic retry', async () => {
  const { store, storage } = fixture(); await store.initializeProgress(); storage.failWrite = true
  assert.deepEqual(await store.recordLevelCompleted('caminho', 'sono'), { status: 'session-only', changed: true, persisted: false, reason: 'write-failed' })
  assert.equal(store.getProgressSnapshot().persistedProgress.revision, 0)
  assert.equal(getLevelAvailability(store.getProgressSnapshot().effectiveProgress, 'caminho', 'sede').status, 'available')
  storage.failWrite = false; await store.loadProgress()
  assert.deepEqual(JSON.parse(storage.value).completedLevels.caminho, [])
  assert.equal(storage.writes, 1)
  const restarted = fixture({ storage }).store; await restarted.loadProgress()
  assert.equal(getLevelAvailability(restarted.getProgressSnapshot().effectiveProgress, 'caminho', 'sede').status, 'blocked')
})

test('no Web Locks: only session records, duplicate idempotency and temporary unlocks', async () => {
  const { store, storage } = fixture({ locks: null })
  assert.equal((await store.initializeProgress()).reason, 'coordination-unavailable')
  assert.equal((await store.recordLevelCompleted('caminho', 'sono')).status, 'session-only')
  assert.equal((await store.recordLevelCompleted('caminho', 'sono')).changed, false)
  assert.equal((await store.recordLevelCompleted('caminho', 'sede')).status, 'session-only')
  assert.equal(getLevelAvailability(store.getProgressSnapshot().effectiveProgress, 'caminho', 'brincar').status, 'available')
  assert.equal(storage.writes, 0)
})

test('finite lock timeout aborts pending operation and never performs late writes', async () => {
  assert.equal(PROGRESS_LOCK_TIMEOUT_MS, 5000)
  let callback, signal
  const locks = { request(name, options, work) { callback = work; signal = options.signal; return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(Error('aborted')), { once: true })) } }
  const { store, storage } = fixture({ locks, timeoutMs: 10 })
  const outcome = await store.recordLevelCompleted('caminho', 'sono')
  assert.equal(outcome.reason, 'lock-timeout'); assert.equal(outcome.status, 'session-only'); assert.equal(signal.aborted, true)
  callback(); assert.equal(storage.writes, 0)
})

test('post-write divergent value and failed confirmation never claim persistence', async () => {
  const divergent = fixture(); await divergent.store.initializeProgress(); divergent.storage.divergent = true
  assert.equal((await divergent.store.recordLevelCompleted('caminho', 'sono')).reason, 'conflict')
  assert.equal(divergent.store.getProgressSnapshot().status, 'conflict')
  const failed = fixture(); await failed.store.initializeProgress(); failed.storage.afterWrite = true
  const outcome = await failed.store.recordLevelCompleted('caminho', 'sono')
  assert.equal(outcome.persisted, false); assert.equal(outcome.reason, 'read-unavailable')
})

test('new generation rejects already queued old command, discards session and does not resurrect evidence', async () => {
  const { store, storage, locks } = fixture(); await store.initializeProgress()
  storage.failWrite = true; await store.recordLevelCompleted('caminho', 'sono'); storage.failWrite = false
  let release; locks.queue = new Promise(resolve => { release = resolve })
  const pending = store.recordLevelCompleted('memoria', 'memory-1')
  await Promise.resolve(); storage.value = serializeProgress(createEmptyProgress(g2)); release()
  assert.equal((await pending).reason, 'stale-generation')
  assert.equal(store.getProgressSnapshot().sessionProgress, null)
  assert.deepEqual(JSON.parse(storage.value).completedLevels.caminho, [])
  assert.equal(storage.writes, 1)
  assert.equal((await store.recordLevelCompleted('memoria', 'memory-1')).status, 'saved')
})

test('external removal and same-generation regression suspend writes and never restore cache', async () => {
  for (const replacement of [null, serializeProgress(createEmptyProgress(g1))]) {
    const { store, storage } = fixture(); await store.initializeProgress(); await store.recordLevelCompleted('caminho', 'sono')
    storage.value = replacement; assert.equal((await store.loadProgress()).status, 'conflict')
    assert.equal((await store.recordLevelCompleted('memoria', 'memory-1')).status, 'rejected')
    assert.equal((await store.initializeProgress()).status, 'rejected')
    assert.equal(storage.value, replacement); assert.equal(storage.writes, 2)
  }
})

test('revision exhaustion never persists invalid revision', async () => {
  const { store, storage } = fixture(); storage.value = serializeProgress({ ...createEmptyProgress(g1), revision: Number.MAX_SAFE_INTEGER }); await store.loadProgress()
  assert.equal((await store.recordLevelCompleted('caminho', 'sono')).reason, 'conflict'); assert.equal(storage.writes, 0)
})

test('temporary read failure preserves known generation and can recover without flushing session', async () => {
  const { store, storage } = fixture({ createGeneration: () => g2 })
  storage.value = serializeProgress(createEmptyProgress(g1)); await store.loadProgress()
  storage.failRead = true
  assert.equal((await store.recordLevelCompleted('caminho', 'sono')).status, 'session-only')
  assert.equal(store.getProgressSnapshot().sessionProgress.generation, g1)
  storage.failRead = false; await store.loadProgress()
  assert.equal(store.getProgressSnapshot().effectiveProgress.generation, g1)
  assert.equal(store.getProgressSnapshot().effectiveProgress.completedLevels.caminho.includes('sono'), true)
  assert.deepEqual(JSON.parse(storage.value).completedLevels.caminho, [])
})

test('fallback mutation rereads generation even without locks; obsolete session is discarded', async () => {
  const { store, storage } = fixture({ locks: null })
  storage.value = serializeProgress(createEmptyProgress(g1)); await store.loadProgress()
  await store.recordLevelCompleted('caminho', 'sono')
  storage.value = serializeProgress(createEmptyProgress(g2))
  assert.equal((await store.recordLevelCompleted('memoria', 'memory-1')).reason, 'stale-generation')
  assert.equal(store.getProgressSnapshot().sessionProgress, null)
  assert.equal(store.getProgressSnapshot().effectiveProgress.generation, g2)
  assert.equal(storage.writes, 0)
})

test('listener errors cannot turn confirmed writes into failures', async () => {
  const { store } = fixture(); await store.initializeProgress()
  const unsubscribe = store.subscribeProgress(() => { throw Error('subscriber') })
  assert.equal((await store.recordLevelCompleted('caminho', 'sono')).status, 'saved')
  unsubscribe()
})

test('notifications are read-only, subscriptions stable, shared listeners and complete cleanup', async () => {
  const { store, storage, events, document } = fixture(); await store.initializeProgress()
  let notifications = 0
  const callback = () => notifications++
  const a = store.subscribeProgress(callback), b = store.subscribeProgress(callback)
  assert.equal(events.count(), 3); assert.equal(document.count(), 1)
  await store.recordLevelCompleted('caminho', 'sono'); assert.equal(notifications, 2)
  const next = { ...JSON.parse(storage.value), revision: 2 }; next.completedLevels.memoria = ['memory-1']; storage.value = JSON.stringify(next)
  for (const name of ['storage', 'pageshow', 'focus']) events.fire(name, { key: KEY, newValue: 'private' })
  document.fire('visibilitychange'); await store.loadProgress()
  assert.equal(notifications, 4); assert.equal(storage.writes, 2)
  const snapshot = store.getProgressSnapshot(); await store.loadProgress(); assert.equal(snapshot, store.getProgressSnapshot())
  a(); assert.equal(events.count(), 3); b(); assert.equal(events.count(), 0); assert.equal(document.count(), 0)
  const strictMount = store.subscribeProgress(callback); strictMount(); const remount = store.subscribeProgress(callback); remount(); assert.equal(events.count(), 0)
})
