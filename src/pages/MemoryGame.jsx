import { useEffect, useReducer, useRef, useState } from 'react'
import { memoryGameLevels, createMemoryDeck } from '../data/memoryGameLevels'
import { SpeakerIcon } from '../components/CommunicationCard'
import { falar, stopSpeaking } from '../utils/speech'
import './MemoryGame.css'

const initialLevel = memoryGameLevels[0]
const freshState = (level, deck = createMemoryDeck(level)) => ({ level, deck, open: [], found: [], hint: null, lastPair: null, message: '' })

function reducer(state, action) {
  if (action.type === 'restart') return freshState(state.level, action.deck)
  if (action.type === 'select-level') return freshState(action.level)
  if (action.type === 'clear-hint') {
    return state.hint === action.hint ? { ...state, hint: null, message: '' } : state
  }
  if (action.type === 'close') {
    if (state.open.join('|') !== action.turn) return state
    return { ...state, open: [] }
  }
  if (action.type === 'help') {
    if (state.open.length || state.found.length === state.level.pairs.length) return state
    const card = state.deck.find(item => !state.found.includes(item.pairId))
    return { ...state, hint: { cardId: card.id }, message: 'Tente começar pela carta destacada.' }
  }
  if (action.type !== 'open') return state
  const card = state.deck.find(item => item.id === action.id)
  if (!card || state.open.length >= 2 || state.open.includes(card.id) || state.found.includes(card.pairId)) return state
  const open = [...state.open, card.id]
  if (open.length === 1) return { ...state, open, hint: null, message: '', lastPair: null }
  const first = state.deck.find(item => item.id === open[0])
  if (first.pairId === card.pairId) {
    const pair = state.level.pairs.find(item => item.id === card.pairId)
    return { ...state, open: [], found: [...state.found, pair.id], hint: null, lastPair: pair.id, message: `Muito bem! Você encontrou ${pair.word}.` }
  }
  return { ...state, open, hint: null, lastPair: null, message: 'Vamos tentar outro par.' }
}

function CardBack() {
  return <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M15 12h34a9 9 0 0 1 9 9v20a9 9 0 0 1-9 9H29L15 59V50a9 9 0 0 1-9-9V21a9 9 0 0 1 9-9Z" fill="#FFFFFF" /><path d="M25 25c0-10 17-10 17 0 0 7-10 6-10 12M32 42v1" /></svg>
}

export default function MemoryGame() {
  const [state, dispatch] = useReducer(reducer, null, () => freshState(initialLevel))
  const [audioMessage, setAudioMessage] = useState('')
  const level = state.level
  const completed = state.found.length === level.pairs.length
  const pending = state.open.length === 2
  const successTitle = useRef(null)
  const firstCard = useRef(null)
  const lastPair = level.pairs.find(pair => pair.id === state.lastPair)

  useEffect(() => {
    if (!pending) return
    const turn = state.open.join('|')
    const timer = window.setTimeout(() => dispatch({ type: 'close', turn }), level.mismatchDelay)
    return () => window.clearTimeout(timer)
  }, [level.mismatchDelay, pending, state.open])
  useEffect(() => () => stopSpeaking(), [])
  useEffect(() => {
    if (!state.hint) return
    const hint = state.hint
    const timer = window.setTimeout(() => dispatch({ type: 'clear-hint', hint }), level.hintDuration)
    return () => window.clearTimeout(timer)
  }, [level.hintDuration, state.hint])
  useEffect(() => { if (completed) successTitle.current?.focus() }, [completed])

  function speak(pair) { setAudioMessage(''); falar(pair.speechText, setAudioMessage) }
  function restart() {
    stopSpeaking(); setAudioMessage('')
    dispatch({ type: 'restart', deck: createMemoryDeck(level, state.deck) })
    requestAnimationFrame(() => firstCard.current?.focus())
  }

  function selectLevel(nextLevel) {
    stopSpeaking(); setAudioMessage('')
    dispatch({ type: 'select-level', level: nextLevel })
  }

  return <main id="conteudo" className="memory-page" tabIndex={-1}>
    <a className="memory-back" href="#/jogar">← Jogos</a>
    <header className="memory-intro"><div><h1>Jogo da Memória</h1><p>Encontre os pares de cada conjunto.</p></div></header>
    <nav className="memory-levels" aria-label="Níveis da Memória">
      {memoryGameLevels.map((item, index) => <button key={item.id} type="button" className={`memory-level${item.id === level.id ? ' memory-level--active' : ''}`} aria-pressed={item.id === level.id} onClick={() => selectLevel(item)}>
        <span>Nível {index + 1}</span><strong>{item.title}</strong><small>{item.pairs.length} pares</small>
      </button>)}
    </nav>
    <section className="memory-play" aria-labelledby="memory-title">
      <div className="memory-heading"><h2 id="memory-title">{level.title}</h2><p role="status">{state.found.length} de {level.pairs.length} pares</p></div>
      <div className="memory-grid">{state.deck.map((card, index) => {
        const pair = level.pairs.find(item => item.id === card.pairId)
        const matched = state.found.includes(pair.id)
        const revealed = matched || state.open.includes(card.id)
        const clue = state.hint?.cardId === card.id
        return <button type="button" key={card.id} ref={index === 0 ? firstCard : undefined} data-card={index}
          className={`memory-card${revealed ? ' memory-card--open' : ''}${matched ? ' memory-card--matched' : ''}${clue ? ' memory-card--hint' : ''}`}
          aria-label={matched ? `${pair.word}, par encontrado, carta ${index + 1}` : revealed ? `Carta ${pair.word} aberta, carta ${index + 1}` : `Carta fechada ${index + 1}${clue ? ', pista: tente começar por esta carta' : ''}`}
          aria-pressed={revealed} aria-disabled={matched || pending || revealed} onClick={() => dispatch({ type: 'open', id: card.id })}>
          <span className="memory-card-inner">
            <span className="memory-card-back" aria-hidden={revealed}><CardBack /><span>Carta {index + 1}</span>{clue && <small>Pista</small>}</span>
            <span className="memory-card-front" aria-hidden={!revealed}><img src={pair.image} alt="" /><strong>{pair.word}</strong>{matched && <span className="memory-match-mark" aria-hidden="true">✓</span>}</span>
          </span>
        </button>
      })}</div>
      {!completed && <div className="memory-controls"><button className="memory-action" type="button" disabled={state.open.length > 0} onClick={() => dispatch({ type: 'help' })}>Preciso de ajuda</button><button className="memory-action memory-restart" type="button" onClick={restart}>Reiniciar</button></div>}
      <p className="memory-feedback" role="status">{completed ? 'Você encontrou todos os pares!' : state.message}</p>
      {!completed && lastPair && <button type="button" className="memory-action" onClick={() => speak(lastPair)}><SpeakerIcon />Ouvir palavra</button>}
    </section>
    {completed && <section className="memory-success" aria-labelledby="memory-success-title">
      <div className="memory-success-heading"><div><h2 id="memory-success-title" ref={successTitle} tabIndex={-1}>Muito bem!</h2><p>Você encontrou todos os pares!</p></div><div className="memory-friends" aria-hidden="true"><img src={level.pairs[0].image} alt="" /><img src={level.pairs[1].image} alt="" /></div></div>
      <ul className="memory-learned">{level.pairs.map(pair => <li key={pair.id}><span><span aria-hidden="true">✓ </span>{pair.speechText}</span><button type="button" className="memory-audio" aria-label={`Ouvir ${pair.word}`} onClick={() => speak(pair)}><SpeakerIcon /></button></li>)}</ul>
      <div className="memory-controls"><button type="button" className="memory-action" onClick={restart}>Jogar novamente</button><a className="memory-action" href="#/jogar">Voltar aos jogos</a></div>
    </section>}
    <p className="memory-feedback" role="status">{audioMessage}</p>
  </main>
}
