import assert from 'node:assert/strict'
import { createEmptyProgress, applyProgressCommand, getLevelAvailability } from '../src/utils/progress.js'
import { wordIds, performedCatalog, gameCatalog } from '../src/data/progressCatalog.js'
import { getProgressSummary } from '../src/utils/progressSummary.js'

const empty = createEmptyProgress('12345678-1234-4234-8234-123456789abc')
const apply = (p, command) => { const result = applyProgressCommand(p, command); assert.equal(result.valid, true); return result.progress }
const explore = (p, moduleId, activityId) => apply(p, { type: 'explored', moduleId, activityId })
const perform = (p, moduleId, activityId, steps) => apply(p, { type: 'performed', moduleId, activityId, steps })
const completeLevel = (p, gameId, levelId) => apply(p, { type: 'completed', gameId, levelId })
const before = JSON.stringify(empty)
assert.equal(getProgressSummary(empty).hasEvidence, false)
for (const bad of [null, {}, { ...empty, version: 99 }, { ...empty, revision: -1 }]) assert.equal(getProgressSummary(bad).valid, false)
let partial = explore(empty, 'wordsAndPhrases', 'casa')
partial = perform(partial, 'wordsAndPhrases', 'casa', ['build', 'sentence'])
let summary = getProgressSummary(partial, empty)
assert.equal(summary.counts.wordsCompleted, 0)
assert.equal(summary.words[0].build.recorded, true)
assert.equal(summary.words[0].sentence.sessionOnly, true)
const persisted = explore(empty, 'wordsAndPhrases', 'casa')
summary = getProgressSummary(partial, persisted)
assert.equal(summary.words[0].explored.sessionOnly, false)
assert.equal(summary.words[0].build.sessionOnly, true)
assert.equal(summary.words.length, 12)
assert.equal(getProgressSummary(partial, partial).hasSessionOnly, false)
assert.equal(getProgressSummary(partial).hasSessionOnly, true)
assert.deepEqual(summary.words.map(item => item.id), wordIds)
let full = explore(empty, 'communication', 'guided-exploration')
full = explore(full, 'myDayEmotions', 'educational-exploration')
for (const id of wordIds) {
  full = explore(full, 'wordsAndPhrases', id)
  full = perform(full, 'wordsAndPhrases', id, ['build', 'sentence', 'complete'])
  full = perform(full, 'writing', id, ['typing', 'notebook', 'complete'])
}
for (const module of ['myDayRoutines', 'myDayCommunication']) for (const id of performedCatalog[module].ids) full = perform(full, module, id, ['complete'])
for (const [gameId, levels] of Object.entries(gameCatalog)) {
  let p = empty
  for (let completed = 0; completed <= 3; completed++) {
    const s = getProgressSummary(p, p)
    const game = s.games.find(game => game.id === gameId)
    for (let index = 0; index < 3; index++) assert.equal(game.levels[index].status, index < completed ? 'completed' : getLevelAvailability(p, gameId, levels[index]).status)
    assert.equal(s.games.filter(game => game.id !== gameId).every(game => game.levels[0].status === 'available' && game.levels[1].status === 'blocked'), true)
    if (completed < 3) p = completeLevel(p, gameId, levels[completed])
  }
  for (const level of levels) full = completeLevel(full, gameId, level)
}
summary = getProgressSummary(full, full)
assert.deepEqual(summary.counts, { wordsExplored: 12, wordsCompleted: 12, writingCompleted: 12, routinesCompleted: 8, communicationCompleted: 10, levelsCompleted: 18 })
assert.equal(summary.games.length, 6)
assert.equal(summary.routines.length, 8)
assert.equal(summary.communicationExercises.length, 10)
assert.equal(summary.hasSessionOnly, false)
assert.equal(JSON.stringify(empty), before)
assert.equal(/score|mastery|performance|attempt|duration|owner|profile|percent|points|ranking/i.test(JSON.stringify(summary)), false)
console.log('PASS: summary validation, canonical catalogs, explicit completion, partial facts, provenance, six isolated N1/N2/N3 chains, immutability and privacy.')
