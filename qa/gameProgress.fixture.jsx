import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import PathGame from '../src/pages/PathGame.jsx'
import PuzzleGame from '../src/pages/PuzzleGame.jsx'
import WordSearchGame from '../src/pages/WordSearchGame.jsx'
import MemoryGame from '../src/pages/MemoryGame.jsx'
import FindImageGame from '../src/pages/FindImageGame.jsx'
import WhereBelongsGame from '../src/pages/WhereBelongsGame.jsx'
import { pathGameLevels, nextPathStep } from '../src/data/pathGameLevels.js'
import { puzzleLevels } from '../src/data/puzzleLevels.js'
import { wordSearchLevels } from '../src/data/wordSearchLevels.js'
import { memoryGameLevels } from '../src/data/memoryGameLevels.js'
import { findImageLevels } from '../src/data/findImageLevels.js'
import { whereBelongsLevels } from '../src/data/whereBelongsLevels.js'
import { gameCatalog } from '../src/data/progressCatalog.js'
import { createProgressStore } from '../src/utils/progressStorage.js'
import { createEmptyProgress, serializeProgress, validateProgress } from '../src/utils/progress.js'
import { updatePreference, resetPreferences } from '../src/utils/preferences.js'

const games = [
  ['caminho', PathGame, pathGameLevels, 'path'],
  ['quebra-cabeca', PuzzleGame, puzzleLevels, 'puzzle'],
  ['caca-palavras', WordSearchGame, wordSearchLevels, 'wordsearch'],
  ['memoria', MemoryGame, memoryGameLevels, 'memory'],
  ['encontre-imagem', FindImageGame, findImageLevels, 'findimage'],
  ['onde-pertence', WhereBelongsGame, whereBelongsLevels, 'belongs'],
]
const check = (condition, message) => { if (!condition) throw Error(message) }
const pause = (ms = 25) => new Promise(resolve => setTimeout(resolve, ms))
let root, fixture
const tests = []
const reloadSamples = []
function makeFixture(mode = 'normal', data = { raw: null }) {
  const calls = [], results = [], writes = []
  const store = createProgressStore({
    getStorage: () => ({ getItem: () => data.raw, setItem(key, value) { if (mode === 'quota') throw Error('quota'); writes.push([key, value]); data.raw = value } }),
    getLocks: () => mode === 'no-locks' ? null : navigator.locks,
  })
  const service = { ...store, recordLevelCompleted: async (...args) => { calls.push(args); if (mode === 'slow') await pause(150); const result = await store.recordLevelCompleted(...args); results.push(result); return result } }
  return { service, data, calls, results, writes, progress: () => store.getProgressSnapshot().effectiveProgress }
}
async function render(game, nextFixture = fixture) {
  root?.unmount(); await pause(); fixture = nextFixture
  root = createRoot(document.getElementById('root'))
  const Component = game[1]
  root.render(<StrictMode><Component progressService={fixture.service} /></StrictMode>)
  await pause(); await pause()
}
const levelButtons = () => [...document.querySelectorAll('nav button')]
const activeIndex = () => levelButtons().findIndex(button => button.getAttribute('aria-pressed') === 'true')
const message = () => document.querySelector('.game-progress-feedback').textContent
async function click(selector, count = 1) { const element = document.querySelector(selector); check(element, 'missing: ' + selector); for (let i = 0; i < count; i++) element.click(); await pause() }
async function action(text, count = 1) { const button = [...document.querySelectorAll('main button')].find(button => button.textContent.trim() === text && !button.disabled); check(button, 'missing action: ' + text); for (let i = 0; i < count; i++) button.click(); await pause() }
async function level(index) { levelButtons()[index].click(); await pause() }
async function settle() { await pause(); await fixture.service.loadProgress(); await pause() }
function expectCalls(count) { check(fixture.calls.length === count, 'unexpected evidence ' + JSON.stringify(fixture.calls)) }
function availability(expected) { check(JSON.stringify(levelButtons().map(button => button.getAttribute('aria-disabled') === 'true')) === JSON.stringify(expected), 'availability ' + levelButtons().map(button => button.outerHTML).join('')) }
function privacy() {
  const p = fixture.progress(); check(validateProgress(p).valid, 'valid progress')
  check(Object.values(p.exploredActivities).every(ids => !ids.length), 'learning exploration untouched')
  check(Object.values(p.performedActivities).every(value => !Object.keys(value).length), 'learning activities untouched')
  check(Object.keys(p).join() === 'version,generation,revision,exploredActivities,performedActivities,completedLevels', 'closed schema')
  for (const [id, levels] of Object.entries(p.completedLevels)) check(levels.every(level => gameCatalog[id].includes(level)), 'catalog-only evidence')
}

async function solve(game, index, repeat = false, timedPath = false) {
  const [id, , levels] = game, selected = levels[index], before = fixture.calls.length
  if (id === 'caminho') {
    await action('Preciso de ajuda'); expectCalls(before)
    const unavailable = [...document.querySelectorAll('[data-node]')].find(button => button.disabled && button.dataset.node !== selected.startNode)
    unavailable?.click(); await pause(); expectCalls(before)
    if (!timedPath) {
      const wrong = selected.nodes.find(node => node.type === 'destination')
      const paths = [[selected.startNode]], seen = new Set()
      let route
      while (paths.length) {
        const candidate = paths.shift(), at = candidate.at(-1)
        if (at === wrong.id) { route = candidate; break }
        if (seen.has(at)) continue
        seen.add(at)
        const node = selected.nodes.find(item => item.id === at)
        for (const next of node.connections.filter(next => next !== selected.correctDestination)) paths.push([...candidate, next])
      }
      check(route, 'reachable incorrect destination')
      for (const next of route.slice(1)) { await click(`[data-node="${next}"]`); expectCalls(before) }
      check(!document.querySelector('.path-result'), 'incorrect destination never completes')
      await action('Reiniciar'); expectCalls(before)
    }
    while (document.querySelector('.path-player').dataset.position !== selected.correctDestination) {
      const position = document.querySelector('.path-player').dataset.position
      const next = nextPathStep(selected, position)
      await click(`[data-node="${next}"]`, 2)
      if (timedPath) { expectCalls(before); await pause(430) }
      if (next !== selected.correctDestination) expectCalls(before)
    }
  } else if (id === 'quebra-cabeca') {
    // A real partial placement precedes help; the last helped piece solves the board.
    const piece = document.querySelector('[data-piece]')
    if (piece) { piece.click(); await pause(); await click('[data-slot="0"]'); expectCalls(before) }
    for (let i = 0; i < selected.rows * selected.columns && document.querySelector('.puzzle-board').dataset.solved !== 'true'; i++) {
      await action('Preciso de ajuda')
      if (document.querySelector('.puzzle-board').dataset.solved !== 'true') expectCalls(before)
    }
  } else if (id === 'caca-palavras') {
    await action('Preciso de ajuda'); expectCalls(before)
    await click('[data-cell="0"]')
    await click('[data-cell="2"]'); expectCalls(before)
    check(document.querySelector('.wordsearch-sequence strong').textContent === selected.grid[0], 'jump rejected')
    if (index < 2) { await click(`[data-cell="${selected.columns + 1}"]`); check(document.querySelector('.wordsearch-sequence strong').textContent === selected.grid[0], 'diagonal rejected where disallowed') }
    await action('Limpar seleção')
    for (const [at, word] of selected.words.entries()) {
      for (const [offset, cell] of word.cells.entries()) { await click(`[data-cell="${cell}"]`, offset === word.cells.length - 1 ? 2 : 1); if (at !== selected.words.length - 1 || offset !== word.cells.length - 1) expectCalls(before) }
    }
  } else if (id === 'memoria') {
    await action('Preciso de ajuda'); expectCalls(before)
    // Read the fixture's rendered card faces; do not set React game state.
    const cards = [...document.querySelectorAll('[data-card]')]
    const groups = selected.pairs.map(pair => cards.filter(card => card.querySelector('.memory-card-front strong').textContent === pair.word))
    groups[0][0].click(); await pause(); groups[1][0].click(); await pause(); expectCalls(before)
    await pause(selected.mismatchDelay + 30); expectCalls(before)
    for (const [at, pair] of groups.entries()) {
      pair[0].click(); await pause(); expectCalls(before)
      pair[1].click(); pair[1].click(); await pause()
      if (at !== groups.length - 1) expectCalls(before)
    }
  } else if (id === 'encontre-imagem') {
    for (let i = 0; i < selected.concepts.length; i++) {
      const target = selected.concepts.find(item => item.question === document.querySelector('#findimage-target').textContent)
      const wrong = [...document.querySelectorAll('[data-animal]')].find(button => button.dataset.animal !== target.id)
      wrong.click(); await pause(); expectCalls(before)
      await action('Preciso de ajuda'); expectCalls(before)
      await click(`[data-animal="${target.id}"]`, 2); expectCalls(before)
      await action('Próxima', 2)
      if (i !== selected.concepts.length - 1) expectCalls(before)
    }
  } else {
    for (let i = 0; i < selected.rounds.length; i++) {
      const round = selected.rounds.find(item => item.id === document.querySelector('[data-round]').dataset.round)
      await action('Preciso de ajuda'); expectCalls(before)
      await click('.belongs-object')
      const wrong = [...document.querySelectorAll('[data-destination]')].find(button => button.dataset.destination !== round.correctDestination)
      wrong.click(); await pause(); expectCalls(before)
      await click('.belongs-object'); await click(`[data-destination="${round.correctDestination}"]`, 2); expectCalls(before)
      await action('Próxima', 2)
      if (i !== selected.rounds.length - 1) expectCalls(before)
    }
  }
  await settle()
  expectCalls(before + 1)
  check(JSON.stringify(fixture.calls.at(-1)) === JSON.stringify([id, selected.id]), 'captured correct IDs')
  check(document.querySelector(`.${game[3]}-${id === 'caminho' ? 'result' : 'success'}`), 'educational success preserved')
  check(fixture.results.at(-1).status === (repeat ? 'unchanged' : fixture.data.raw ? 'saved' : 'session-only'), 'real result status')
  privacy()
}

async function initialBlocking(game) {
  availability([false, true, true]); expectCalls(0); check(fixture.writes.length === 0, 'opening does not initialize')
  for (const index of [1, 2]) {
    await level(index); check(activeIndex() === 0, 'blocked handler does not enter')
    check(message().includes(`Conclua o Nível ${index}`), 'textual prerequisite')
    await action('Jogar Nível 1'); check(activeIndex() === 0, 'explicit route to available level')
  }
  await action('Preciso de ajuda'); expectCalls(0)
  const restart = [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Reiniciar')
  restart?.click(); await pause(); expectCalls(0)
  check(game, 'game fixture')
}

try {
  if (window.qaReloadSpec) {
    const spec = window.qaReloadSpec
    await render(games.find(game => game[0] === spec.game), makeFixture(spec.mode, { raw: spec.raw }))
    window.qaResult = { passed: true, reload: true, blocked: levelButtons().map(button => button.getAttribute('aria-disabled') === 'true'), calls: fixture.calls.length, writes: fixture.writes.length }
  } else {
  updatePreference('reduceMotion', true)
  for (const game of games) {
    await render(game, makeFixture()); await initialBlocking(game)
    for (let index = 0; index < 3; index++) {
      await level(index); check(activeIndex() === index, 'available handler enters')
      await solve(game, index)
      if (index < 2) reloadSamples.push({ game: game[0], mode: 'normal', raw: fixture.data.raw, expected: index === 0 ? [false, false, true] : [false, false, false] })
      availability(index === 0 ? [false, false, true] : [false, false, false])
      if (index === 0) { await level(2); check(activeIndex() === 0, 'N3 still blocked after N1'); await level(0) }
      for (const other of games.filter(item => item !== game)) check(fixture.progress().completedLevels[other[0]].length === 0, 'game isolation')
      const data = fixture.data
      await render(game, makeFixture('normal', data))
      availability(index === 0 ? [false, false, true] : [false, false, false]); expectCalls(0)
    }
    await level(0); const revision = fixture.progress().revision
    await solve(game, 0, true); check(fixture.progress().revision === revision, 'duplicate does not bump revision')
    await action('Jogar novamente'); availability([false, false, false]); check(fixture.progress().revision === revision, 'restart preserves progress')
    // Remount with the same service retains evidence without mount writes.
    const callCount = fixture.calls.length; await render(game); expectCalls(callCount); availability([false, false, false])
    tests.push(game[0] + ': 3 real completions, blocked handlers, partial/error/help, repeat/restart, durable fresh-store reload, StrictMode/remount')
  }
  for (const mode of ['no-locks', 'quota']) for (const game of games) {
    await render(game, makeFixture(mode))
    for (let index = 0; index < 2; index++) { await level(index); await solve(game, index); availability(index === 0 ? [false, false, true] : [false, false, false]); check(message().includes('apenas nesta sessão'), 'session warning') }
    check(fixture.data.raw === null, 'session has no durable evidence')
    if (mode === 'no-locks') reloadSamples.push({ game: game[0], mode, raw: null, expected: [false, true, true] })
    await render(game, makeFixture(mode, fixture.data)); availability([false, true, true])
  }
  tests.push('All six games: no-locks and quota, N1→N2→N3 temporary availability, session notice, fresh-store reload loses unsaved unlocks')
  updatePreference('reduceMotion', false)
  await render(games[0], makeFixture()); await solve(games[0], 0, false, true)
  tests.push('Path: 400ms movement does not emit before final committed stop; reduced-motion equivalent covered for all levels')
  // Invalidate the active higher level through a new external generation.
  const retained = makeFixture(); await render(games[1], retained); await solve(games[1], 0); await level(1)
  retained.data.raw = serializeProgress(createEmptyProgress(crypto.randomUUID())); await settle()
  check(!document.querySelector('.puzzle-adventure'), 'active newly unavailable level cannot be played')
  check(message().includes('Conclua o Nível 1'), 'active invalidation explained')
  await action('Jogar Nível 1'); check(document.querySelector('.puzzle-adventure'), 'explicit available entry after invalidation')
  tests.push('Active N2 invalidated by external generation is removed from play until explicit available-level choice')
  // Delay only the injected service to expose committed completion races.
  updatePreference('reduceMotion', true)
  const slow = makeFixture('slow'); await render(games[1], slow)
  for (let i = 0; i < puzzleLevels[0].rows * puzzleLevels[0].columns; i++) await action('Preciso de ajuda')
  expectCalls(1); await action('Jogar novamente'); expectCalls(1)
  check(!document.querySelector('.puzzle-success'), 'quick reset preserves fresh educational state')
  await pause(180); await settle()
  check(JSON.stringify(slow.progress().completedLevels['quebra-cabeca']) === JSON.stringify(['casa']), 'reset cannot relabel committed event')
  await level(1)
  for (let i = 0; i < puzzleLevels[1].rows * puzzleLevels[1].columns; i++) await action('Preciso de ajuda')
  expectCalls(2); await level(0); check(activeIndex() === 0, 'quick level change allowed')
  await render(games[0], slow); await pause(180); await settle()
  expectCalls(2)
  check(JSON.stringify(slow.progress().completedLevels['quebra-cabeca']) === JSON.stringify(['casa', 'gato']), 'level change/unmount cannot relabel committed event')
  check(slow.progress().completedLevels.caminho.length === 0, 'remount another game never emits old terminal state')
  tests.push('Delayed persistence: committed completion + immediate reset/level change/unmount/remount captures original IDs, preserves new play state')
  window.qaVisual = async gameId => { updatePreference('reduceMotion', true); await render(games.find(item => item[0] === gameId), makeFixture('no-locks')) }
  window.qaState = () => ({ calls: fixture.calls, active: activeIndex(), message: message(), writes: fixture.writes.length })
  resetPreferences()
  window.qaResult = { passed: true, tests, reloadSamples }
  }
} catch (error) { window.qaResult = { passed: false, error: error.stack, tests, calls: fixture?.calls, body: document.body.innerText.slice(0, 3000) } }
