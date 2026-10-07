import assert from 'node:assert/strict'
import fs from 'node:fs'
import { isRoutineComplete, hasAllCards, hasDuplicateCards, findViolatedDependency, shuffleRoutine } from '../src/utils/routineSequence.js'
import { createInitialRotation, advanceRotation, getCurrentTheme } from '../src/utils/contentRotation.js'

export async function loadCatalog(file, exportName) {
  const source = fs.readFileSync(file, 'utf8').replace(/^import (\w+) from '([^']+)'$/gm, (_, name, asset) => `const ${name} = ${JSON.stringify(asset)}`)
  return (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`))[exportName]
}
export const routines = await loadCatalog('src/data/myDayRoutines.js', 'myDayRoutines')
const ids = routines.map(r => r.id)
assert.equal(ids.length, 8)
assert.equal(new Set(ids).size, 8)
const expected = [1,1,1,2,6,1,2,6]
function permutations(items) {
  return items.length ? items.flatMap((item,i) => permutations(items.filter((_,j)=>i!==j)).map(rest=>[item,...rest])) : [[]]
}
for (const [index,routine] of routines.entries()) {
  const order = routine.steps.map(s=>s.id)
  assert.equal(new Set(order).size, order.length)
  for (const step of routine.steps) {
    assert.equal(step.speechText, step.word)
    if (step.id === 'colocar-pijama') {
      assert.equal(step.word, 'COLOCAR PIJAMA')
      assert.equal(step.image, null)
      assert.equal(step.arasaacId, undefined)
    } else assert.ok(fs.existsSync(new URL(step.image, new URL('../src/data/myDayRoutines.js', import.meta.url))))
  }
  let accepted = 0
  for (const candidate of permutations(order)) {
    const valid = routine.dependencies.every(([a,b])=>candidate.indexOf(a)<candidate.indexOf(b))
    assert.equal(isRoutineComplete(candidate, routine), valid)
    assert.equal(findViolatedDependency(candidate,routine) === null, valid)
    if (valid) accepted++
  }
  assert.equal(accepted, expected[index])
  assert.equal(isRoutineComplete([...order.slice(1),order[1]],routine),false)
  assert.equal(hasDuplicateCards([order[0],order[0]]),true)
  assert.equal(hasAllCards(order.slice(1),routine),false)
  assert.equal(isRoutineComplete([...order,'unknown'],routine),false)
  for (let i=0;i<1000;i++) {
    const shuffled = shuffleRoutine(routine, i<5 ? ()=>[0,1,NaN,Infinity,-1][i] : Math.random)
    assert.equal(isRoutineComplete(shuffled,routine),false)
    assert.equal(hasAllCards(shuffled,routine),true)
    assert.equal(hasDuplicateCards(shuffled),false)
    assert.ok(shuffled.every(Boolean))
  }
  console.log(`${routine.id}: ${accepted} valid orders; 1000 invalid starts PASS`)
}
let rotation = createInitialRotation(ids)
for (let cycle=1;cycle<=2;cycle++) {
  const seen = []
  for(let i=0;i<8;i++) {
    assert.equal(rotation.cycle,cycle)
    seen.push(getCurrentTheme(rotation))
    const previous = getCurrentTheme(rotation)
    rotation = advanceRotation(rotation,ids)
    assert.notEqual(getCurrentTheme(rotation),previous)
  }
  assert.equal(new Set(seen).size,8)
}
assert.equal(rotation.cycle,3)
const values = new Map()
globalThis.window = { localStorage: {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)} }
const storage = await import('../src/utils/contentRotationStorage.js?qa=normal')
for (const module of ['communication','wordsAndPhrases','writing','dailySituations']) storage.getModuleRotation(module,['old-a','old-b'])
const old = structuredClone(storage.loadContentRotation().modules)
const current = storage.getModuleRotation('myDayRoutines',ids)
assert.deepEqual(storage.getModuleRotation('myDayRoutines',ids),current)
const reloaded = await import('../src/utils/contentRotationStorage.js?qa=reload')
assert.deepEqual(reloaded.getModuleRotation('myDayRoutines',ids),current)
storage.advanceModuleRotation('myDayRoutines',ids)
const after = storage.loadContentRotation().modules
for (const module of Object.keys(old)) assert.deepEqual(after[module],old[module])
assert.equal(after.myDayCommunication,undefined)
assert.equal(after.myDayEmotions,undefined)
values.set(storage.CONTENT_ROTATION_STORAGE_KEY,'{bad json')
const corrupt = await import('../src/utils/contentRotationStorage.js?qa=corrupt')
assert.ok(ids.includes(getCurrentTheme(corrupt.getModuleRotation('myDayRoutines',ids))))
globalThis.window = {get localStorage(){throw Error('unavailable')}}
const absent = await import('../src/utils/contentRotationStorage.js?qa=absent')
const fallback = absent.getModuleRotation('myDayRoutines',ids)
assert.deepEqual(absent.getModuleRotation('myDayRoutines',ids),fallback)
assert.notEqual(getCurrentTheme(absent.advanceModuleRotation('myDayRoutines',ids)),getCurrentTheme(fallback))
const legacy = await loadCatalog('src/data/sequenceGameLevels.js','sequenceGameLevels')
assert.equal(legacy.length,3)
assert.equal(legacy.flatMap(level=>level.activities).length,9)
const legacyCards = legacy.flatMap(level=>level.activities.flatMap(activity=>activity.steps))
for (const [id, file] of Object.entries({ 'colocar-pasta': 'colocar-pasta-escova', 'calcar-sapato': 'calcar-sapato', 'abrir-porta': 'abrir-porta', 'sair-de-casa': 'sair', 'chegar-casa': 'chegar-casa', 'tirar-sapato': 'tirar-sapato', 'limpar-mesa': 'limpar-superficie' })) {
  const card = legacyCards.find(step=>step.id===id)
  assert.ok(card.image.endsWith(`/arasaac/${file}.png`), id)
  assert.equal(card.visualType, undefined)
}
console.log('Catalog, exhaustive orders, shuffles, two cycles, storage, legacy structure PASS')
