import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { validateCommunication, constructedSpeech, communicationHelp } from '../src/utils/myDayCommunication.js'
import { createInitialRotation, advanceRotation, getCurrentTheme } from '../src/utils/contentRotation.js'

const cache = new Map()
export async function loadData(file) {
  file = path.resolve(file)
  if (cache.has(file)) return cache.get(file)
  let source = fs.readFileSync(file, 'utf8')
  const imports = [...source.matchAll(/import (.+?) from '([^']+)'/g)]
  for (const [statement, binding, target] of imports) {
    const absolute = path.resolve(path.dirname(file), target)
    if (target.endsWith('.png')) source = source.replace(statement, `const ${binding} = ${JSON.stringify(absolute)}`)
    else {
      const data = await loadData(absolute.endsWith('.js') ? absolute : absolute + '.js')
      source = source.replace(statement, Object.keys(data).filter(name => binding.includes(name)).map(name => `const ${name} = ${JSON.stringify(data[name])}`).join('\n'))
    }
  }
  const data = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
  cache.set(file, data)
  return data
}
export const { myDayCommunication: situations } = await loadData('src/data/myDayCommunication.js')
const { learningConcepts } = await loadData('src/data/learningConcepts.js')
const { socialExpressions } = await loadData('src/data/socialExpressions.js')
const vocabulary = { ...learningConcepts, ...socialExpressions }
const natural = Object.fromEntries(situations.flatMap(s => s.alternatives.map(a => [a.tokens.join(','), a.speech])))
const { interactivePhraseSpeech } = await loadData('src/data/interactiveSituations.js')
assert.equal(interactivePhraseSpeech([null, null, null], 'Eu quero beber água.', ['eu', 'quero', 'agua']), '')
assert.equal(interactivePhraseSpeech(['eu', 'quero', 'brincar'], 'Eu quero beber água.', ['eu', 'quero', 'agua']), 'Eu quero brincar.')
assert.equal(interactivePhraseSpeech(['eu', 'quero', 'comer'], 'Eu quero almoçar.', ['eu', 'quero', 'comer']), 'Eu quero almoçar.')
assert.equal(interactivePhraseSpeech(['eu', 'preciso', 'banheiro']), 'Eu preciso ir ao banheiro.')
assert.equal(situations.length, 10)
assert.equal(new Set(situations.map(s => s.id)).size, 10)
assert.deepEqual(situations.map(s => s.arasaacId), [4963,2349,null,8513,12252,2430,7272,2367,5525,5525])
assert.equal(socialExpressions.obrigado.image, socialExpressions.obrigada.image)
assert.deepEqual(Object.values(socialExpressions).map(s => s.arasaacId), [8195,8129,8129])
assert.equal(socialExpressions['de-nada'], undefined)
let accepted = 0
for (const s of situations) {
  assert.ok(fs.existsSync(s.scene))
  for (const option of s.options) { assert.ok(vocabulary[option.id]); assert.ok(fs.existsSync(option.image)) }
  for (const a of s.alternatives) {
    assert.equal(validateCommunication(a.tokens, s), true)
    assert.equal(validateCommunication([...a.tokens, null], s), true)
    assert.equal(constructedSpeech(a.tokens, natural, vocabulary), a.speech)
    accepted++
  }
  for (const invalid of [[], s.expectedTokens.slice(1), [...s.expectedTokens].reverse(), [...s.expectedTokens,'eu'], ['por-favor'], ['obrigado'], ['nao','obrigado'], ['eu','nao-quero','comer'], ['eu',null,...s.expectedTokens.slice(1)], [...s.expectedTokens,'por-favor','por-favor']]) assert.equal(validateCommunication(invalid,s), false)
  for (const id of Object.keys(socialExpressions)) assert.equal(validateCommunication([...s.expectedTokens,id],s), s.complements.includes(id))
  assert.equal(communicationHelp([],s,0).position,null)
  assert.equal(communicationHelp([],s,1).position,0)
  assert.match(communicationHelp(s.expectedTokens,s,1).text,/opcional/)
}
assert.equal(accepted,20)
assert.equal(constructedSpeech([],natural,vocabulary),'')
assert.equal(constructedSpeech(['eu','quero'],natural,vocabulary),'Eu quero.')
assert.equal(constructedSpeech(['eu','quero','comer'],natural,vocabulary),'Eu quero comer.')
assert.equal(constructedSpeech(['eu',null,'agua'],natural,vocabulary),'Eu água.')
for (const s of Object.values(socialExpressions)) assert.equal(constructedSpeech([s.id],natural,vocabulary),s.speech)
for(let run=0;run<100;run++) {
  let rotation=createInitialRotation(situations.map(s=>s.id)); const seen=[]
  for(let i=0;i<20;i++){ seen.push(getCurrentTheme(rotation)); rotation=advanceRotation(rotation,situations.map(s=>s.id)) }
  assert.equal(new Set(seen.slice(0,10)).size,10); assert.equal(new Set(seen.slice(10)).size,10); assert.notEqual(seen[9],seen[10])
}
const { interactiveSituations } = await loadData('src/data/interactiveSituations.js')
assert.deepEqual(interactiveSituations.map(l=>l.situations.length),[3,4,5])
const { dailySituations } = await loadData('src/data/dailySituations.js')
assert.equal(dailySituations.length,9)
console.log('PASS: 10 situations, 20 approved sequences, invalid attempts, faithful speech, help, 100 double cycles, legacy 12/9.')
const ids = situations.map(s=>s.id)
for(const mode of ['absent','corrupt','throws']) {
  globalThis.window = mode==='absent' ? {} : {localStorage:{ getItem(){if(mode==='throws')throw Error('unavailable');return '{invalid'},setItem(){if(mode==='throws')throw Error('unavailable')} }}
  const storage = await import(`../src/utils/contentRotationStorage.js?communication-qa=${mode}`)
  const start = storage.getModuleRotation('myDayCommunication',ids)
  assert.equal(new Set(start.order).size,10)
  const next = storage.advanceModuleRotation('myDayCommunication',ids)
  assert.equal(next.currentIndex,1)
  assert.deepEqual(storage.getModuleRotation('myDayCommunication',ids),next)
}
console.log('PASS: absent, corrupt and throwing localStorage use existing safe memory fallback.')
