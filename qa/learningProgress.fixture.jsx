import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Communication from '../src/pages/Communication.jsx'
import WordsAndPhrases from '../src/pages/WordsAndPhrases.jsx'
import Writing from '../src/pages/Writing.jsx'
import SequenceGame from '../src/pages/SequenceGame.jsx'
import InteractiveSituationsGame from '../src/pages/InteractiveSituationsGame.jsx'
import MyDayEmotions from '../src/pages/MyDayEmotions.jsx'
import EducationalKeyboard from '../src/pages/EducationalKeyboard.jsx'
import Notebook from '../src/pages/Notebook.jsx'
import { createProgressStore } from '../src/utils/progressStorage.js'
import { validateProgress } from '../src/utils/progress.js'
import { learningWords } from '../src/data/learningWords.js'
import { myDayRoutines } from '../src/data/myDayRoutines.js'
import { myDayCommunication } from '../src/data/myDayCommunication.js'
import { interactiveSituations } from '../src/data/interactiveSituations.js'
import { sequenceGameLevels } from '../src/data/sequenceGameLevels.js'
import { communicationSets, communicationSetIds } from '../src/data/communicationOptions.js'
import { clearContentRotation, saveModuleRotation, loadContentRotation } from '../src/utils/contentRotationStorage.js'
import { getPreferences, updatePreference, resetPreferences } from '../src/utils/preferences.js'

const check = (condition, message) => { if (!condition) throw Error(message) }
const pause = () => new Promise(resolve => setTimeout(resolve, 20))
const tests = []
let root, fixture
function makeFixture(mode = 'normal') {
  let raw = null
  const calls = [], writes = []
  const store = createProgressStore({
    getStorage: () => ({ getItem: () => raw, setItem(key, value) { if (mode === 'quota') throw Error('quota'); writes.push([key, value]); raw = value } }),
    getLocks: () => mode === 'no-locks' ? null : navigator.locks,
  })
  const service = { ...store }
  for (const method of ['recordActivityExplored', 'recordActivityPerformed', 'recordLevelCompleted']) service[method] = (...args) => { calls.push([method, ...args]); return store[method](...args) }
  return { service, calls, writes, raw: () => raw, progress: () => store.getProgressSnapshot().effectiveProgress }
}
function seed(moduleId, ids, currentId) {
  saveModuleRotation(moduleId, { order: ids, currentIndex: ids.indexOf(currentId), cycle: 1, lastThemeId: null })
}
async function mount(Component, props = {}, mode = 'normal') {
  root?.unmount(); await pause(); fixture = makeFixture(mode)
  root = createRoot(document.getElementById('root'))
  root.render(<StrictMode><Component {...props} qaControls progressService={fixture.service} /></StrictMode>)
  await pause(); await pause()
  check(fixture.calls.length === 0 && fixture.writes.length === 0, 'opening records nothing')
}
const buttons = () => [...document.querySelectorAll('main button')]
async function click(text, count = 1) {
  const button = buttons().find(button => button.textContent.trim() === text && !button.disabled)
  check(button, 'button missing: ' + text)
  for (let i = 0; i < count; i++) button.click()
  await pause()
}
async function selector(selector) { const button = document.querySelector(selector); check(button, 'selector missing: ' + selector); button.click(); await pause() }
async function choose(text) { const button = buttons().find(button => button.getAttribute('aria-label') === 'Selecionar ' + text); check(button, 'choice missing: ' + text); button.click(); await pause() }
async function settle() { await pause(); await fixture.service.loadProgress(); await pause() }
function selectValue(selector, value) { const element = document.querySelector(selector); check(element, 'select missing'); element.value = value; element.dispatchEvent(new Event('change', { bubbles: true })) }
async function virtualInput(value) { for (const letter of value) await selector('[aria-label="Inserir letra ' + letter + '"]') }
function expectCalls(expected) { check(JSON.stringify(fixture.calls) === JSON.stringify(expected), 'unexpected evidence: ' + JSON.stringify(fixture.calls)) }
function privacy() {
  const progress = fixture.progress(); check(progress && validateProgress(progress).valid, 'valid catalog-only progress')
  const raw = JSON.stringify(progress)
  for (const text of ['Eu quero', 'Eu estou', 'tokens', 'phrase', 'drawing', 'canvas', 'attempts', 'helpCount', 'triste', 'feliz', 'por-favor', 'obrigado', 'name', 'audio', 'speed']) check(!raw.includes(text), 'private content: ' + text)
  check(Object.values(progress.completedLevels).every(levels => levels.length === 0), 'games untouched')
}
async function completeWord(word, recording = true) {
  await click('Continuar')
  await click([...document.querySelectorAll('.words-option')].find(button => button.textContent !== word.word).textContent)
  check(fixture.calls.length === (recording ? 1 : 0), 'incorrect build has no evidence')
  await click(word.word, 2); await click('Continuar')
  await click(word.sentenceOptions.find(option => option !== word.sentenceAnswer)); await click('Conferir')
  check(fixture.calls.length === (recording ? 2 : 0), 'incorrect sentence has no evidence')
  await click(word.sentenceAnswer); await click('Conferir', 2); await settle()
}

try {
  clearContentRotation()
  for (const set of communicationSets) {
    seed('communication', communicationSetIds, set.id); await mount(Communication)
    const firstChoice = document.querySelector('.communication-choices [aria-label^="Selecionar"]'); firstChoice.click(); await pause()
    await click('Limpar')
    for (const button of document.querySelectorAll('.communication-social [aria-label^="Selecionar"], .quick-answers [aria-label^="Selecionar"]')) { button.click(); await pause() }
    const audio = buttons().find(button => button.textContent.includes('Ouvir') && !button.disabled); audio?.click(); await pause()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await click('Limpar')
    check(fixture.calls.length === 0, 'communication personal actions never record')
    const index = loadContentRotation().modules.communication.currentIndex
    await click('Concluir exploração', 2); await settle()
    expectCalls([['recordActivityExplored', 'communication', 'guided-exploration']])
    check(loadContentRotation().modules.communication.currentIndex === (index + 1) % 4, 'single rotation')
    privacy()
  }
  tests.push('Comunicar: quatro conjuntos, ações pessoais/áudio sem registro, conclusão vazia, acionamento repetido')
  await mount(Communication); selectValue('.communication-qa-selector select', 'state'); await pause(); await click('Voltar à rotação'); await settle(); expectCalls([])
  tests.push('Comunicar QA não registra')

  for (const word of learningWords) {
    seed('wordsAndPhrases', learningWords.map(word => word.id), word.id); await mount(WordsAndPhrases)
    await completeWord(word)
    expectCalls([['recordActivityExplored', 'wordsAndPhrases', word.id], ['recordActivityPerformed', 'wordsAndPhrases', word.id, ['build']], ['recordActivityPerformed', 'wordsAndPhrases', word.id, ['sentence', 'complete']]])
    const previous = JSON.stringify(fixture.progress()); await click('Próxima palavra', 2); await settle()
    check(JSON.stringify(fixture.progress()) === previous, 'next word is navigation only'); privacy()
  }
  tests.push('Palavras: 12 IDs, erros, antecedentes, lotes, repetição de Conferir e avanço com ID capturado')
  await mount(WordsAndPhrases); selectValue('.words-qa-selector select', 'casa'); await pause(); await completeWord(learningWords[0], false)
  expectCalls([])
  tests.push('Palavras QA: fluxo completo sem registro')

  for (const word of learningWords) {
    seed('writing', learningWords.map(word => word.id), word.id); await mount(Writing)
    await virtualInput('Z'); await pause(); await click('Conferir'); check(fixture.calls.length === 0, 'typing error has no evidence')
    await click('Limpar'); await virtualInput(word.word); await pause(); await click('Conferir', 2); await click('Praticar no caderno')
    const canvas = document.querySelector('canvas')
    // Synthetic pointers cannot acquire native capture; mock capture only,
    // preserving the actual drawing handlers and canvas state.
    canvas.setPointerCapture = () => {}; canvas.hasPointerCapture = () => false
    canvas.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, isPrimary: true, button: 0, clientX: 100, clientY: 150 })); canvas.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, isPrimary: true, clientX: 120, clientY: 160 })); canvas.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, isPrimary: true, clientX: 120, clientY: 160 })); await pause()
    check(fixture.calls.length === 1, 'canvas has no evidence')
    await click('Concluir prática', 2); await settle()
    expectCalls([['recordActivityPerformed', 'writing', word.id, ['typing']], ['recordActivityPerformed', 'writing', word.id, ['notebook', 'complete']]])
    check(document.querySelector('#writing-typing-panel').hidden === false, 'practice advances even before persistence'); privacy()
  }
  tests.push('Escrever: 12 IDs, erros/teclas sem registro, callback typing, canvas, lote final, duplo avanço')
  await mount(Writing); selectValue('.writing-qa-selector select', 'casa'); await pause(); await virtualInput('CASA'); await pause(); await click('Conferir'); await click('Praticar no caderno'); await click('Concluir prática'); await settle(); expectCalls([])
  tests.push('Escrever QA: fluxo completo sem registro')

  for (const routine of myDayRoutines) {
    seed('myDayRoutines', myDayRoutines.map(item => item.id), routine.id); await mount(SequenceGame, { embedded: true })
    await click('Conferir'); await click('Preciso de ajuda'); check(fixture.calls.length === 0, 'routine partial/help has no evidence')
    for (let index = 0; index < routine.steps.length; index++) {
      const id = routine.steps[index].id
      const word = routine.steps.find(step => step.id === id).word
      const slots = [...document.querySelectorAll('.sequence-select')]
      if (slots[index].querySelector('strong').textContent === word) continue
      await choose(word); await selector('.sequence-position[aria-label="Posição ' + (index + 1) + '"]')
    }
    await click('Conferir', 2); await settle()
    expectCalls([['recordActivityPerformed', 'myDayRoutines', routine.id, ['complete']]])
    await click('Próxima rotina', 2); await settle(); check(fixture.calls.length === 1, 'routine next has no extra event'); privacy()
  }
  tests.push('Rotinas: oito IDs, ajuda, erros, conclusão pós-commit e StrictMode')

  for (const scenario of myDayCommunication) {
    seed('myDayCommunication', myDayCommunication.map(item => item.id), scenario.id); await mount(InteractiveSituationsGame, { embedded: true, continuous: true })
    await click('Preciso de ajuda'); check(fixture.calls.length === 0, 'scenario help has no evidence')
    for (const token of [...scenario.expectedTokens].reverse()) await choose(scenario.options.find(option => option.id === token).word)
    await click('Conferir frase'); check(fixture.calls.length === 0, 'wrong scenario does not complete'); await click('Limpar frase')
    for (const token of scenario.expectedTokens) await choose(scenario.options.find(option => option.id === token).word)
    await click('Conferir frase', 2); await settle()
    expectCalls([['recordActivityPerformed', 'myDayCommunication', scenario.id, ['complete']]])
    await click('Próxima situação', 2); await settle(); privacy()
  }
  tests.push('Comunicação educativa: dez IDs, cortesia opcional, recusas fictícias, fome/dor e privacidade')

  await mount(MyDayEmotions); await selector('[aria-label="Abrir Conhecer emoções"]'); await click('Ouvir nome'); await click('Pular', 2); await settle(); expectCalls([])
  await click('Próximo conceito', 2); await settle(); expectCalls([['recordActivityExplored', 'myDayEmotions', 'educational-exploration']]); privacy()
  await mount(MyDayEmotions)
  for (const view of ['Como estou', 'O que preciso']) {
    await selector('[aria-label="Abrir ' + view + '"]')
    for (const button of document.querySelectorAll('.emotions-choices [aria-label^="Selecionar"]')) { button.click(); await pause() }
    const audio = buttons().find(button => button.textContent === 'Ouvir mensagem' && !button.disabled); audio?.click(); await pause()
    await click('Limpar'); await click('Não quero responder')
  }
  await settle(); expectCalls([]); check(fixture.writes.length === 0, 'personal emotions never initialize progress')
  tests.push('Emoções: continuar genérico, pular/áudio/funções pessoais/não responder sem registros')

  for (const mode of ['quota', 'no-locks']) {
    seed('wordsAndPhrases', learningWords.map(word => word.id), 'casa'); await mount(WordsAndPhrases, {}, mode); await completeWord(learningWords[0]); await click('Próxima palavra'); await settle()
    check(fixture.service.getProgressSnapshot().persistenceStatus === 'session-only', 'fallback session')
    check(document.querySelector('main').textContent.includes('pode não ficar salvo'), 'neutral fallback message'); privacy()
    seed('writing', learningWords.map(word => word.id), 'casa'); await mount(Writing, {}, mode); await virtualInput('CASA'); await pause(); await click('Conferir'); await click('Praticar no caderno'); await click('Concluir prática'); await settle(); check(document.querySelector('#writing-typing-panel').hidden === false, 'failed storage never blocks notebook'); privacy()
    await mount(Communication, {}, mode); await click('Concluir exploração'); await settle(); privacy()
    await mount(MyDayEmotions, {}, mode); await selector('[aria-label="Abrir Conhecer emoções"]'); await click('Próximo conceito'); await settle(); privacy()
    const routine = myDayRoutines[0]
    seed('myDayRoutines', myDayRoutines.map(item => item.id), routine.id); await mount(SequenceGame, { embedded: true }, mode)
    for (let index = 0; index < routine.steps.length; index++) {
      if ([...document.querySelectorAll('.sequence-select strong')][index].textContent === routine.steps[index].word) continue
      await choose(routine.steps[index].word); await selector('.sequence-position[aria-label="Posição ' + (index + 1) + '"]')
    }
    await click('Conferir'); await click('Próxima rotina'); await settle(); privacy()
    const scenario = myDayCommunication[0]
    seed('myDayCommunication', myDayCommunication.map(item => item.id), scenario.id); await mount(InteractiveSituationsGame, { embedded: true, continuous: true }, mode)
    for (const token of scenario.expectedTokens) await choose(scenario.options.find(option => option.id === token).word)
    await click('Conferir frase'); await click('Próxima situação'); await settle(); privacy()
  }
  tests.push('Quota e sem Web Locks: fluxo educativo continua, mensagens neutras, antecedentes de sessão')

  await mount(SequenceGame); await click('Preciso de ajuda'); await click('Conferir')
  const legacyRoutine = sequenceGameLevels[0].activities[0]
  for (let index = 0; index < legacyRoutine.steps.length; index++) {
    if ([...document.querySelectorAll('.sequence-select strong')][index].textContent === legacyRoutine.steps[index].word) continue
    await choose(legacyRoutine.steps[index].word); await selector('.sequence-position[aria-label="Posição ' + (index + 1) + '"]')
  }
  await click('Conferir'); await click('Próxima sequência'); await settle(); expectCalls([])
  await mount(InteractiveSituationsGame, { initialLevelId: interactiveSituations[0].id })
  for (const token of interactiveSituations[0].situations[0].expectedTokens) await choose(interactiveSituations[0].situations[0].options.find(option => option.id === token).word)
  await click('Confirmar frase'); await click('Continuar'); await settle(); expectCalls([])
  await mount(EducationalKeyboard); await virtualInput('CASA'); await pause(); await click('Conferir'); await settle(); expectCalls([])
  await mount(Notebook); await settle(); expectCalls([])
  tests.push('Legado e rotas auxiliares sem eventos novos')

  await mount(Communication); await click('Concluir exploração'); await settle()
  const saved = fixture.raw(); const rotation = JSON.stringify(loadContentRotation())
  const preferences = getPreferences(); updatePreference('elementSize', 'large'); resetPreferences()
  check(fixture.raw() === saved && JSON.stringify(loadContentRotation()) === rotation, 'preferences isolated')
  updatePreference('elementSize', preferences.elementSize)
  tests.push('Preferências, progresso e sete rotações separados')
  root.unmount(); root = null
  window.qaVisual = async kind => {
    if (kind === 'communication') { seed('communication', communicationSetIds, communicationSetIds[0]); await mount(Communication, {}, 'quota') }
    else { await mount(MyDayEmotions, {}, 'quota'); await selector('[aria-label="Abrir Conhecer emoções"]') }
  }
  window.qaState = () => ({ calls: fixture.calls, rotation: loadContentRotation(), message: document.querySelector('main').textContent })
  window.qaResult = { passed: true, tests }
} catch (error) { window.qaResult = { passed: false, message: error.message, stack: error.stack, tests } }
