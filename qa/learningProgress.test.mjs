import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createProgressStore } from '../src/utils/progressStorage.js'
import { getLearningProgressRecorder, progressResultMessage } from '../src/utils/learningProgress.js'

const generation = '00000000-0000-4000-8000-000000000001'
test('independent writing modes join real evidence in either order without double completion', async () => {
  for (const order of [['typing', 'notebook'], ['notebook', 'typing']]) {
    const f = fixture()
    await f.recorder.recordActivityPerformed('writing', 'casa', [order[0]])
    assert.deepEqual(JSON.parse(f.raw()).performedActivities.writing.casa, [order[0]])
    await f.recorder.recordActivityPerformed('writing', 'cama', [order[1]])
    assert.ok(!JSON.parse(f.raw()).performedActivities.writing.casa.includes('complete'))
    await f.recorder.recordActivityPerformed('writing', 'casa', [order[1]])
    assert.deepEqual(JSON.parse(f.raw()).performedActivities.writing.casa, ['typing', 'notebook', 'complete'])
    const revision = JSON.parse(f.raw()).revision
    await f.recorder.recordActivityPerformed('writing', 'casa', [order[1]])
    assert.equal(JSON.parse(f.raw()).revision, revision)
  }
})
function fixture(fail = false) {
  let raw = null, writes = 0
  const store = createProgressStore({
    getStorage: () => ({ getItem: () => raw, setItem(key, value) { if (fail) throw Error('quota'); writes++; raw = value } }),
    getLocks: () => ({ request: (name, options, callback) => Promise.resolve().then(callback) }),
    createGeneration: () => generation, getEventTarget: () => null, getDocument: () => null,
  })
  return { store, recorder: getLearningProgressRecorder(store), raw: () => raw, writes: () => writes }
}

test('recorder is lazy, shared across mounts and orders captured evidence before terminal batch', async () => {
  const f = fixture(); assert.equal(f.writes(), 0); assert.equal(getLearningProgressRecorder(f.store), f.recorder)
  const steps = ['build']
  const tasks = [f.recorder.recordActivityExplored('wordsAndPhrases', 'casa'), f.recorder.recordActivityPerformed('wordsAndPhrases', 'casa', steps), f.recorder.recordActivityPerformed('wordsAndPhrases', 'casa', ['sentence', 'complete'])]
  steps[0] = 'unknown'
  assert.deepEqual((await Promise.all(tasks)).map(result => result.status), ['saved', 'saved', 'saved'])
  assert.deepEqual(JSON.parse(f.raw()).performedActivities.wordsAndPhrases.casa, ['build', 'sentence', 'complete'])
  assert.equal(JSON.parse(f.raw()).revision, 3)
  assert.equal((await f.recorder.recordActivityPerformed('wordsAndPhrases', 'casa', ['sentence', 'complete'])).status, 'unchanged')
})

test('failed initialization and writing remain session-only with valid actual prerequisites', async () => {
  const f = fixture(true)
  await f.recorder.recordActivityPerformed('writing', 'cama', ['typing'])
  const result = await f.recorder.recordActivityPerformed('writing', 'cama', ['notebook', 'complete'])
  assert.equal(result.status, 'session-only'); assert.equal(f.writes(), 0)
  assert.deepEqual(f.store.getProgressSnapshot().effectiveProgress.performedActivities.writing.cama, ['typing', 'notebook', 'complete'])
})

test('does not invent prerequisites and provides neutral messages for every result', async () => {
  const f = fixture()
  const result = await f.recorder.recordActivityPerformed('wordsAndPhrases', 'casa', ['sentence', 'complete'])
  assert.equal(result.status, 'rejected'); assert.equal(result.reason, 'missing-prerequisite')
  assert.deepEqual(JSON.parse(f.raw()).performedActivities.wordsAndPhrases, {})
  assert.equal(progressResultMessage({ status: 'saved' }), '')
  assert.equal(progressResultMessage({ status: 'unchanged' }), '')
  assert.match(progressResultMessage({ status: 'session-only' }), /pode não ficar salvo/)
  assert.match(progressResultMessage(result), /atividade continua normalmente/)
  assert.doesNotMatch(progressResultMessage(result), /missing-prerequisite/)
})

test('commands awaiting an earlier record cannot cross a generation change', async () => {
  const f = fixture(); await f.store.initializeProgress()
  let finish
  const original = f.store
  let snapshot = original.getProgressSnapshot()
  const adapter = { ...original, getProgressSnapshot: () => snapshot, recordActivityExplored: () => new Promise(resolve => { finish = resolve }) }
  const recorder = getLearningProgressRecorder(adapter)
  const first = recorder.recordActivityExplored('communication', 'guided-exploration')
  const old = recorder.recordActivityPerformed('writing', 'casa', ['typing'])
  await Promise.resolve(); snapshot = { ...snapshot, effectiveProgress: { ...snapshot.effectiveProgress, generation: '00000000-0000-4000-8000-000000000002' } }
  finish({ status: 'unchanged' }); await first
  assert.equal((await old).reason, 'stale-generation')
})

test('unexpected adapter exceptions become technical results, not uncaught educational errors', async () => {
  const f = fixture(); await f.store.initializeProgress()
  const adapter = { ...f.store, recordActivityExplored() { throw Error('technical') } }
  assert.equal((await getLearningProgressRecorder(adapter).recordActivityExplored('communication', 'guided-exploration')).status, 'rejected')
})

test('repeated activation before settlement shares one submission', async () => {
  const f = fixture()
  const first = f.recorder.recordActivityExplored('communication', 'guided-exploration')
  const second = f.recorder.recordActivityExplored('communication', 'guided-exploration')
  assert.equal(first, second); await first
  assert.equal(JSON.parse(f.raw()).revision, 1)
  assert.equal((await f.recorder.recordActivityExplored('communication', 'guided-exploration')).status, 'unchanged')
})

test('first queued events bind to the initialized generation, even when submitted before initialization', async () => {
  const f = fixture()
  let snapshot = f.store.getProgressSnapshot(), finish
  const adapter = { ...f.store, getProgressSnapshot: () => snapshot,
    loadProgress: async () => { snapshot = await f.store.loadProgress() },
    initializeProgress: async () => { await f.store.initializeProgress(); snapshot = f.store.getProgressSnapshot() },
    recordActivityExplored: () => new Promise(resolve => { finish = resolve }),
  }
  const recorder = getLearningProgressRecorder(adapter)
  const first = recorder.recordActivityExplored('communication', 'guided-exploration')
  const queued = recorder.recordActivityPerformed('writing', 'casa', ['typing'])
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(typeof finish, 'function')
  snapshot = { ...snapshot, effectiveProgress: { ...snapshot.effectiveProgress, generation: '00000000-0000-4000-8000-000000000002' } }
  finish({ status: 'unchanged' }); await first
  assert.equal((await queued).reason, 'stale-generation')
})
