import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import { exploredCatalog, performedCatalog, gameCatalog, wordIds, MAX_PROGRESS_BYTES } from '../src/data/progressCatalog.js'
import { createEmptyProgress, validateProgress, applyProgressCommand, mergeProgress, getLevelAvailability, parseProgress, serializeProgress, utf8Bytes, hasActivityExplored, hasActivityPerformed } from '../src/utils/progress.js'

const generation = '00000000-0000-4000-8000-000000000001'
const empty = () => createEmptyProgress(generation)
const copy = () => JSON.parse(serializeProgress(empty()))
const explored = (id = 'casa') => ({ type: 'explored', moduleId: 'wordsAndPhrases', activityId: id })
const performed = (steps, moduleId = 'wordsAndPhrases', activityId = 'casa') => ({ type: 'performed', moduleId, activityId, steps })
function apply(state, command) { const outcome = applyProgressCommand(state, command); assert.equal(outcome.valid, true); return outcome.progress }

test('closed catalog: 12 words, 8 routines, 10 educational scenarios, 6 games and 18 levels; no asset imports', () => {
  assert.equal(wordIds.length, 12)
  assert.equal(performedCatalog.myDayRoutines.ids.length, 8)
  assert.equal(performedCatalog.myDayCommunication.ids.length, 10)
  assert.equal(Object.keys(gameCatalog).length, 6)
  assert.equal(Object.values(gameCatalog).flat().length, 18)
  assert.deepEqual(exploredCatalog.communication, ['guided-exploration'])
  assert.deepEqual(exploredCatalog.myDayEmotions, ['educational-exploration'])
  assert.equal(Object.isFrozen(performedCatalog.writing.steps), true)
  assert.doesNotMatch(fs.readFileSync('src/data/progressCatalog.js', 'utf8'), /import /)
  const words = [...fs.readFileSync('src/data/learningWords.js', 'utf8').matchAll(/createLearningWord\('([^']+)'/g)].map(match => match[1])
  assert.deepEqual(wordIds, words)
  for (const [gameId, file] of Object.entries({ caminho: 'pathGame', 'quebra-cabeca': 'puzzle', 'caca-palavras': 'wordSearch', memoria: 'memoryGame', 'encontre-imagem': 'findImage', 'onde-pertence': 'whereBelongs' })) {
    const source = fs.readFileSync(`src/data/${file}Levels.js`, 'utf8')
    for (const id of gameCatalog[gameId]) assert.ok(source.includes(`id: '${id}'`))
  }
})

test('empty immutable schema, UUID, revision, version and byte limit', () => {
  assert.equal(validateProgress(empty()).valid, true)
  assert.ok(Object.isFrozen(empty().performedActivities.writing))
  assert.throws(() => createEmptyProgress('person-name'))
  for (const generation of ['', 4, null, 'not-uuid']) { const data = copy(); data.generation = generation; assert.equal(validateProgress(data).valid, false) }
  for (const revision of [-1, 0.1, Number.MAX_SAFE_INTEGER + 1, '0']) { const data = copy(); data.revision = revision; assert.equal(validateProgress(data).valid, false) }
  const future = copy(); future.version = 2; assert.equal(validateProgress(future).reason, 'incompatible-version')
  assert.equal(parseProgress('{').valid, false)
  assert.equal(parseProgress(' '.repeat(MAX_PROGRESS_BYTES + 1)).valid, false)
  assert.equal(utf8Bytes('á'), 2)
  assert.equal(parseProgress(serializeProgress(empty())).valid, true)
})

test('reject additional fields, wrong types, unknown IDs, duplicates, noncanonical arrays and accessors', () => {
  const changes = [
    data => { data.name = 'private' }, data => { data.exploredActivities.unknown = [] },
    data => { data.exploredActivities.communication = ['state'] },
    data => { data.exploredActivities.myDayEmotions = ['triste'] },
    data => { data.exploredActivities.wordsAndPhrases = ['casa', 'casa'] },
    data => { data.exploredActivities.wordsAndPhrases = ['cama', 'casa'] },
    data => { data.performedActivities.writing.casa = ['wrong'] },
    data => { data.performedActivities.writing.casa = [] },
    data => { data.completedLevels.memoria = ['sono'] },
    data => { data.completedLevels.memoria = ['memory-2'] },
    data => { data.exploredActivities = [] }, data => { data.performedActivities = null },
    data => { data.performedActivities.writing.casa = { typing: true } },
  ]
  for (const change of changes) { const data = copy(); change(data); assert.equal(validateProgress(data).valid, false) }
  const accessor = copy(); Object.defineProperty(accessor, 'name', { enumerable: true, get() { throw Error('must not execute') } })
  assert.equal(validateProgress(accessor).valid, false)
  const array = copy(); array.exploredActivities.communication.extra = 'private'; assert.equal(validateProgress(array).valid, false)
})

test('privacy and prototype pollution inputs are rejected without echo', () => {
  for (const key of ['__proto__', 'constructor', 'prototype', 'message', 'feeling', 'need', 'audio', 'drawing', 'name', 'clinical', 'tokens', 'errors', 'attempts', 'speed']) {
    const data = copy(); Object.defineProperty(data.performedActivities.writing, key, { value: ['typing'], enumerable: true })
    const outcome = validateProgress(data); assert.equal(outcome.valid, false); assert.equal(JSON.stringify(outcome).includes('private'), false)
    assert.equal(applyProgressCommand(empty(), { ...explored(), [key]: 'private' }).valid, false)
  }
  assert.equal(parseProgress('{"__proto__":{"polluted":true}}').valid, false)
  assert.equal({}.polluted, undefined)
  assert.equal(validateProgress(Object.create({ version: 1 })).valid, false)
  assert.equal(applyProgressCommand(empty(), new Proxy({}, { getPrototypeOf() { throw Error('hostile') } })).reason, 'invalid-argument')
  for (const command of [{ ...explored(), moduleId: '__proto__' }, { ...explored(), activityId: { message: 'private' } }, performed(['typing']), performed(['sentence', 'build']), performed(['build', 'build'])]) assert.equal(applyProgressCommand(empty(), command).valid, false)
})

test('partial evidence is retained without inventing antecedents; terminal batches are atomic', () => {
  const partial = apply(empty(), performed(['sentence']))
  assert.deepEqual(partial.performedActivities.wordsAndPhrases.casa, ['sentence'])
  assert.equal(applyProgressCommand(partial, performed(['complete'])).reason, 'missing-prerequisite')
  assert.equal(applyProgressCommand(empty(), performed(['sentence', 'complete'])).reason, 'missing-prerequisite')
  let words = apply(empty(), explored()); words = apply(words, performed(['build']))
  words = apply(words, performed(['sentence', 'complete']))
  assert.equal(hasActivityExplored(words, 'wordsAndPhrases', 'casa'), true)
  assert.equal(hasActivityPerformed(words, 'wordsAndPhrases', 'casa', 'complete'), true)
  assert.equal(hasActivityPerformed(words, '__proto__', 'casa', 'complete'), false)
  let writing = apply(empty(), performed(['typing'], 'writing'))
  writing = apply(writing, performed(['notebook', 'complete'], 'writing'))
  assert.deepEqual(writing.performedActivities.writing.casa, ['typing', 'notebook', 'complete'])
  assert.equal(writing.revision, 0, 'pure operations do not claim persistence')
  assert.deepEqual(empty().performedActivities.writing, {})
})

test('idempotent, commutative, associative same-generation unions; distinct generations rejected', () => {
  const a = apply(empty(), explored('casa')), b = apply(empty(), explored('cama')), c = apply(empty(), performed(['typing'], 'writing'))
  const merge = (a, b) => { const result = mergeProgress(a, b); assert.ok(result.valid); return result.progress }
  assert.deepEqual(merge(a, a), a)
  assert.deepEqual(merge(a, b), merge(b, a))
  assert.deepEqual(merge(merge(a, b), c), merge(a, merge(b, c)))
  assert.equal(applyProgressCommand(a, explored()).changed, false)
  assert.equal(mergeProgress(a, createEmptyProgress('00000000-0000-4000-8000-000000000002')).reason, 'stale-generation')
})

test('all 18 levels: sequential prerequisites, duplicates and isolation', () => {
  for (const [gameId, levels] of Object.entries(gameCatalog)) {
    let progress = empty()
    assert.deepEqual(levels.map(id => getLevelAvailability(progress, gameId, id).status), ['available', 'blocked', 'blocked'])
    assert.equal(applyProgressCommand(progress, { type: 'completed', gameId, levelId: levels[1] }).reason, 'missing-prerequisite')
    for (const [index, levelId] of levels.entries()) {
      assert.equal(getLevelAvailability(progress, gameId, levelId).status, 'available')
      progress = apply(progress, { type: 'completed', gameId, levelId })
      assert.equal(applyProgressCommand(progress, { type: 'completed', gameId, levelId }).changed, false)
      if (index === 0) assert.equal(getLevelAvailability(progress, gameId, levels[2]).status, 'blocked')
    }
    for (const other of Object.keys(gameCatalog).filter(id => id !== gameId)) assert.equal(getLevelAvailability(progress, other, gameCatalog[other][1]).status, 'blocked')
  }
  assert.equal(getLevelAvailability(empty(), '__proto__', 'sono').status, 'unknown')
  assert.equal(getLevelAvailability(empty(), 'caminho', 'unknown').status, 'unknown')
})

test('fully populated catalog remains bounded at 122 associations', () => {
  let progress = empty(), associations = 0
  for (const [moduleId, ids] of Object.entries(exploredCatalog)) for (const activityId of ids) { progress = apply(progress, { type: 'explored', moduleId, activityId }); associations++ }
  for (const [moduleId, spec] of Object.entries(performedCatalog)) for (const activityId of spec.ids) { progress = apply(progress, performed(spec.steps, moduleId, activityId)); associations += spec.steps.length }
  for (const [gameId, levels] of Object.entries(gameCatalog)) for (const levelId of levels) { progress = apply(progress, { type: 'completed', gameId, levelId }); associations++ }
  assert.equal(associations, 122)
  assert.ok(utf8Bytes(serializeProgress(progress)) < MAX_PROGRESS_BYTES)
})
