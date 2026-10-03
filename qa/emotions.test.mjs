import assert from 'node:assert/strict'
import fs from 'node:fs'
import { loadData } from './communication.test.mjs'
import { constructedSpeech } from '../src/utils/myDayCommunication.js'
import { createInitialRotation, advanceRotation, getCurrentTheme } from '../src/utils/contentRotation.js'
export const { myDayEmotions: concepts, myDayEmotionIds: ids, emotionVocabulary: vocabulary, emotionNaturalPhrases: phrases } = await loadData('src/data/myDayEmotions.js')
assert.deepEqual(ids, ['feliz', 'triste', 'com-raiva', 'com-medo', 'calmo', 'confuso'])
assert.equal(new Set(concepts.map(item => item.image)).size, 6)
assert.deepEqual(concepts.map(item => item.arasaacId), [9907,2606,2374,39668,31310,2352])
assert.deepEqual(concepts.map(item => item.classification), ['emoção','emoção','emoção','emoção','estado emocional','estado de compreensão ou percepção'])
const credits = fs.readFileSync('src/assets/pictograms/arasaac/CREDITS.md', 'utf8')
for (const item of [...concepts, vocabulary.descansar]) {
  const bytes = fs.readFileSync(item.image)
  assert.equal(bytes.subarray(0,8).toString('hex'), '89504e470d0a1a0a')
  assert.ok(bytes.readUInt32BE(16) > 0)
  assert.ok(credits.includes(`https://static.arasaac.org/pictograms/${item.arasaacId}/${item.arasaacId}_300.png`))
}
assert.equal(vocabulary.calma.image, vocabulary.calmo.image)
assert.equal(vocabulary.confusa.image, vocabulary.confuso.image)
for (const [key, speech] of Object.entries(phrases)) assert.equal(constructedSpeech(key.split(','), phrases, vocabulary), speech)
for (const [tokens, speech] of [[[], ''], [[null,null,null], ''], [['eu','estou',null], 'Eu estou.'], [['eu',null,'triste'], 'Eu triste.'], [[null,null,'calma'], 'Calma.'], [['eu','preciso','descansar'], 'Eu preciso descansar.'], [['eu','quero','ajuda'], 'Eu quero ajuda.']]) assert.equal(constructedSpeech(tokens, phrases, vocabulary), speech)
let rotation = createInitialRotation(ids), last = null
for (let cycle = 0; cycle < 100; cycle++) {
  const seen = []
  for (let i = 0; i < 6; i++) { const id = getCurrentTheme(rotation); assert.notEqual(id,last); seen.push(id); last=id; rotation=advanceRotation(rotation,ids) }
  assert.equal(new Set(seen).size,6)
}
console.log('Emotions: catalog, seven PNGs/credits, variants, ten natural phrases, partial/unconventional speech and 100 cycles PASS')
