import assert from 'node:assert/strict'
import { loadData } from './communication.test.mjs'
import { communicationPhrase } from '../src/utils/communicationPhrase.js'
import { recognitionOptions } from '../src/utils/wordRecognition.js'
import { alphabet } from '../src/data/alphabet.js'

const { communicationNaturalPhrases, communicationSets } = await loadData('src/data/communicationOptions.js')
const { emotionNaturalPhrases, emotionVocabulary } = await loadData('src/data/myDayEmotions.js')
const { socialExpressions } = await loadData('src/data/socialExpressions.js')
const { learningWords } = await loadData('src/data/learningWords.js')
const phrases = { ...communicationNaturalPhrases, ...emotionNaturalPhrases }
for (const [key, text] of Object.entries(phrases)) {
  assert.equal(communicationPhrase(key.split(','), phrases, socialExpressions), text)
}
assert.equal(communicationPhrase(['eu','preciso','ajuda','banheiro'], phrases), 'Eu preciso de ajuda para ir ao banheiro.')
assert.equal(communicationPhrase(['eu','preciso','ajuda','banheiro','por-favor'], phrases, socialExpressions), 'Eu preciso de ajuda para ir ao banheiro, por favor.')
for (const tokens of [[], ['eu'], ['eu','preciso'], ['eu','quero','comer','dormir'], ['eu','eu','quero','comer'], ['ajuda','banheiro'], ['eu','estou','feliz','triste'], ['eu','preciso','banheiro','ajuda']]) {
  assert.equal(communicationPhrase(tokens, phrases, socialExpressions), '')
}
const states = communicationSets.find(set => set.id === 'state').tokenIds
for (const id of ['feliz','triste','com-raiva','com-medo','calmo','calma','confuso','confusa']) {
  assert.ok(states.includes(id)); assert.ok(emotionVocabulary[id].image)
  assert.equal(communicationPhrase(['eu','estou',id], phrases), emotionNaturalPhrases['eu,estou,' + id])
}
assert.equal(learningWords.length, 12)
const positions = new Set()
for (const word of learningWords) {
  for (const random of [()=>0, ()=>0.5, ()=>0.99999]) {
    const options = recognitionOptions(word.id, learningWords, random)
    assert.equal(options.length, 3)
    assert.equal(new Set(options.map(item=>item.id)).size, 3)
    assert.equal(options.filter(item=>item.id === word.id).length, 1)
    assert.ok(options.every(item=>learningWords.includes(item)))
    assert.equal(options.some(item=>item.id==='casa') && options.some(item=>item.id==='cama'), false, 'avoid one-letter spelling distractors')
    positions.add(options.findIndex(item=>item.id === word.id))
  }
  assert.equal(word.sentenceText, word.sentenceAnswer)
  assert.equal(word.sentenceOptions.filter(text=>text===word.sentenceAnswer).length, 1)
}
assert.ok(positions.size > 1, 'correct choice does not remain in one position')
assert.equal(alphabet.length, 26)
assert.equal(alphabet.some(item=>item.letter==='Á'), false)
console.log('PASS core learning: catalogued natural sentences, help + bathroom, eight state variants, ambiguous selections suppressed; twelve recognition vocabularies, shuffled answers, unchanged sentence contexts; 26 alphabet letters.')
