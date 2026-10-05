import assert from 'node:assert/strict'
import { test } from 'node:test'
import { gameCatalog } from '../src/data/progressCatalog.js'
import { createEmptyProgress, serializeProgress, validateProgress } from '../src/utils/progress.js'
import { createProgressStore } from '../src/utils/progressStorage.js'
import { getLearningProgressRecorder } from '../src/utils/learningProgress.js'
import { gameLevelAvailability, blockedLevelMessage, gameProgressMessage } from '../src/utils/gameProgress.js'
import { wordSearchLevels, canExtendSelection } from '../src/data/wordSearchLevels.js'

const generation = '00000000-0000-4000-8000-000000000001'
function fixture(mode = 'normal', data = { raw: null }) {
  const writes = []
  const store = createProgressStore({
    getStorage: () => ({ getItem: () => data.raw, setItem(key, value) { if (mode === 'quota') throw Error('quota'); data.raw = value; writes.push(value) } }),
    getLocks: () => mode === 'no-locks' ? null : { request: (name, options, callback) => Promise.resolve().then(callback) },
    createGeneration: () => generation, getEventTarget: () => null, getDocument: () => null,
  })
  return { store, recorder: getLearningProgressRecorder(store), data, writes }
}
function states(store, gameId) { return gameCatalog[gameId].map(id => gameLevelAvailability(store.getProgressSnapshot(), gameId, id).status) }

for (const [gameId, levels] of Object.entries(gameCatalog)) {
  test(`${gameId}: three sequential levels, isolation, duplicate revisions and refresh`, async () => {
    const f = fixture()
    await f.store.loadProgress()
    assert.deepEqual(states(f.store, gameId), ['available', 'blocked', 'blocked'])
    assert.equal(f.writes.length, 0)
    for (const [index, levelId] of levels.entries()) {
      const result = await f.recorder.recordLevelCompleted(gameId, levelId)
      assert.equal(result.status, 'saved')
      const snapshot = f.store.getProgressSnapshot()
      assert.deepEqual(snapshot.effectiveProgress.completedLevels[gameId], levels.slice(0, index + 1))
      assert.deepEqual(states(f.store, gameId), index === 0 ? ['available', 'available', 'blocked'] : ['available', 'available', 'available'])
      for (const other of Object.keys(gameCatalog).filter(id => id !== gameId)) assert.deepEqual(states(f.store, other), ['available', 'blocked', 'blocked'])
      const revision = snapshot.effectiveProgress.revision
      assert.equal((await f.recorder.recordLevelCompleted(gameId, levelId)).status, 'unchanged')
      assert.equal(f.store.getProgressSnapshot().effectiveProgress.revision, revision)
      const refreshed = fixture('normal', f.data); await refreshed.store.loadProgress()
      assert.deepEqual(states(refreshed.store, gameId), states(f.store, gameId))
      assert.equal(validateProgress(JSON.parse(f.data.raw)).valid, true)
      assert.deepEqual(Object.keys(JSON.parse(f.data.raw)), ['version', 'generation', 'revision', 'exploredActivities', 'performedActivities', 'completedLevels'])
    }
  })
  for (const mode of ['no-locks', 'quota']) test(`${gameId}: ${mode} unlocks in session only without inventing evidence`, async () => {
    const f = fixture(mode)
    for (const [index, levelId] of levels.entries()) {
      assert.equal((await f.recorder.recordLevelCompleted(gameId, levelId)).status, 'session-only')
      assert.deepEqual(f.store.getProgressSnapshot().effectiveProgress.completedLevels[gameId], levels.slice(0, index + 1))
      assert.match(gameProgressMessage(f.store.getProgressSnapshot()), /apenas nesta sessão/)
    }
    assert.equal(f.data.raw, null)
    const refreshed = fixture(mode, f.data); await refreshed.store.loadProgress()
    assert.deepEqual(states(refreshed.store, gameId), ['available', 'blocked', 'blocked'])
  })
}

test('unknown IDs fail closed, blocked messages identify the actual prerequisite, no silent corrupt recovery', async () => {
  const f = fixture(); const snapshot = f.store.getProgressSnapshot()
  assert.equal(gameLevelAvailability(snapshot, 'unknown', 'unknown').status, 'unknown')
  assert.equal(gameLevelAvailability(snapshot, 'caminho', 'unknown').status, 'unknown')
  assert.match(blockedLevelMessage(snapshot, 'caminho', 'sede'), /Nível 2.*Nível 1/)
  assert.match(blockedLevelMessage(snapshot, 'caminho', 'brincar'), /Nível 3.*Nível 2/)
  assert.equal((await f.recorder.recordLevelCompleted('caminho', 'brincar')).status, 'rejected')
  assert.deepEqual(f.store.getProgressSnapshot().effectiveProgress.completedLevels.caminho, [])
  const corrupt = fixture('normal', { raw: '{broken' }); await corrupt.store.loadProgress()
  assert.match(gameProgressMessage(corrupt.store.getProgressSnapshot()), /não foi possível confirmar/)
  await corrupt.recorder.recordLevelCompleted('caminho', 'sono')
  assert.equal(corrupt.data.raw, '{broken')
  assert.equal(gameProgressMessage(snapshot, { status: 'saved' }), '')
  assert.equal(gameProgressMessage(snapshot, { status: 'unchanged' }), '')
  assert.doesNotMatch(gameProgressMessage(snapshot, { status: 'rejected', reason: 'internal-code' }), /internal-code/)
})

test('queued game evidence captures IDs, shares repeated submission, rejects a changed generation', async () => {
  const f = fixture(); await f.store.initializeProgress()
  let snapshot = f.store.getProgressSnapshot(), finish
  const calls = []
  const adapter = { ...f.store, getProgressSnapshot: () => snapshot, recordLevelCompleted: (...args) => { calls.push(args); return new Promise(resolve => { finish = resolve }) } }
  const recorder = getLearningProgressRecorder(adapter)
  const first = recorder.recordLevelCompleted('caminho', 'sono')
  assert.equal(first, recorder.recordLevelCompleted('caminho', 'sono'))
  const pending = recorder.recordLevelCompleted('quebra-cabeca', 'casa')
  await Promise.resolve()
  snapshot = { ...snapshot, effectiveProgress: createEmptyProgress('00000000-0000-4000-8000-000000000002') }
  finish({ status: 'saved' }); await first
  assert.equal((await pending).reason, 'stale-generation')
  assert.deepEqual(calls, [['caminho', 'sono']])
  assert.equal(serializeProgress(snapshot.effectiveProgress).includes('unlockedLevels'), false)
})

test('word search retains per-level directions, no jumps or zigzags; N3 diagonal preserved by user decision', () => {
  for (const level of wordSearchLevels) {
    for (const word of level.words) for (let i = 1; i < word.cells.length; i++) assert.equal(canExtendSelection(level, word.cells.slice(0, i), word.cells[i]), true)
    assert.equal(canExtendSelection(level, [0], 2), false)
    assert.equal(canExtendSelection(level, [0, 1], level.columns + 1), false)
    assert.equal(canExtendSelection(level, [0], level.columns + 1), level.id === 'minha-rotina')
  }
})
