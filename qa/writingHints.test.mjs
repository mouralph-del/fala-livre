import assert from 'node:assert/strict'
import { readHint, updateHint, WRITING_HINTS_KEY } from '../src/utils/writingHints.js'
import { createEmptyProgress, applyProgressCommand, serializeProgress, parseProgress } from '../src/utils/progress.js'
import { getProgressSummary } from '../src/utils/progressSummary.js'
import { createProgressStore } from '../src/utils/progressStorage.js'
import { getLearningProgressRecorder } from '../src/utils/learningProgress.js'

let raw = null
globalThis.window = { localStorage: { getItem: () => raw, setItem(key, value) { assert.equal(key, WRITING_HINTS_KEY); raw = value } } }
const key = JSON.stringify(['typing', 'casa', '1'])
assert.deepEqual(readHint(key), { started: false, revealed: false, remaining: 3 })
assert.equal(updateHint(key, 'help').remaining, 3, 'visible word does not consume help')
assert.equal(updateHint(key, 'start').started, true)
const saved = raw
assert.equal(readHint(key).started, true, 'a fresh read preserves hiding')
assert.equal(updateHint(key, 'clear').started, true, 'clearing cannot reset hiding')
assert.equal(updateHint(key, 'delete').started, true)
assert.equal(raw, saved)
assert.deepEqual(updateHint(key, 'help'), { started: true, revealed: true, remaining: 2 })
for (let i = 0; i < 10; i++) assert.equal(updateHint(key, 'help').remaining, 2)
assert.equal(updateHint(key, 'start').revealed, true)
assert.equal(readHint(key).remaining, 2)
assert.equal(readHint(JSON.stringify(['typing', 'cama', '1'])).remaining, 3)
assert.equal(readHint(JSON.stringify(['typing', 'casa', '2'])).remaining, 3)
raw = JSON.stringify({ exhausted: { started: true, revealed: false, remaining: 0 } })
assert.equal(updateHint('exhausted', 'help').remaining, 0)
assert.equal(readHint('exhausted').revealed, false)

let progress = createEmptyProgress('12345678-1234-4234-8234-123456789abc')
const apply = command => {
  const result = applyProgressCommand(progress, command)
  assert.equal(result.valid, true)
  progress = result.progress
}
assert.equal(getProgressSummary(progress).stars.total, 0)
apply({ type: 'explored', moduleId: 'communication', activityId: 'guided-exploration' })
assert.equal(getProgressSummary(progress).stars.total, 0)
apply({ type: 'performed', moduleId: 'writing', activityId: 'casa', steps: ['typing'] })
assert.equal(getProgressSummary(progress).stars.escrever, 1)
apply({ type: 'performed', moduleId: 'writing', activityId: 'casa', steps: ['notebook', 'complete'] })
assert.equal(getProgressSummary(progress).stars.escrever, 2, 'combined flag is not a third star')
const history = serializeProgress(progress)
apply({ type: 'performed', moduleId: 'writing', activityId: 'casa', steps: ['typing'] })
assert.equal(serializeProgress(progress), history)
assert.equal(getProgressSummary(parseProgress(history).progress).stars.total, 2)
assert.equal(serializeProgress(progress), history, 'deriving stars never migrates or rewrites history')
let progressRaw = null
const events = []
globalThis.window.dispatchEvent = event => events.push(event)
const store = createProgressStore({
  getStorage: () => ({ getItem: () => progressRaw, setItem: (key, value) => { progressRaw = value } }),
  getLocks: () => ({ request: (name, options, callback) => Promise.resolve().then(callback) }),
  createGeneration: () => '12345678-1234-4234-8234-123456789abc',
})
const recorder = getLearningProgressRecorder(store)
await recorder.recordActivityExplored('communication', 'guided-exploration')
assert.equal(events.length, 0, 'exploration has no celebration')
await recorder.recordActivityPerformed('wordsAndPhrases', 'casa', ['complete'])
assert.equal(events.length, 0, 'rejected completion has no celebration')
await recorder.recordActivityPerformed('writing', 'casa', ['typing'])
assert.equal(events.length, 1)
await recorder.recordActivityPerformed('writing', 'casa', ['typing'])
assert.equal(events.length, 1, 'same evidence never celebrates twice')
await recorder.recordActivityPerformed('writing', 'casa', ['notebook'])
assert.equal(events.length, 2)
console.log('PASS hints: initial visibility, permanent hiding, persistence, valid help, repeated help, exhaustion, independent words/cycles; stars: real evidence, independent writing, no duplicate, preserved history.')
