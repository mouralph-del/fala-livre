import { useEffect, useReducer, useRef, useState } from 'react'
import { bingoLevels, createBingoGame, findBingoLine } from '../data/bingoLevels'
import { SpeakerIcon } from '../components/CommunicationCard'
import { falar, stopSpeaking } from '../utils/speech'
import './BingoGame.css'

const level = bingoLevels[0]
const initial = game => ({ ...game, index: 0, marked: [], winning: [], correct: false, hint: false, retry: false })

function reducer(state, action) {
  if (action.type === 'restart') return initial(action.game)
  if (state.winning.length) return state
  if (action.type === 'next') {
    if (!state.correct || action.index !== state.index || state.index >= state.draws.length - 1) return state
    return { ...state, index: state.index + 1, correct: false, hint: false, retry: false }
  }
  if (state.correct) return state
  if (action.type === 'help') return { ...state, hint: true }
  if (action.type === 'select') {
    if (!state.board.includes(action.id) || state.marked.includes(action.id)) return state
    if (action.id !== state.draws[state.index]) return { ...state, retry: true }
    const marked = [...state.marked, action.id]
    return { ...state, marked, winning: findBingoLine(state.board, marked, level.size), correct: true, hint: false, retry: false }
  }
  return state
}

export default function BingoGame() {
  const [state, dispatch] = useReducer(reducer, null, () => initial(createBingoGame(level)))
  const [audioMessage, setAudioMessage] = useState('')
  const heading = useRef(null)
  const previousStage = useRef('0-false')
  const complete = state.winning.length > 0
  const target = level.concepts.find(concept => concept.id === state.draws[state.index])

  useEffect(() => () => stopSpeaking(), [])
  useEffect(() => {
    const stage = `${state.index}-${complete}`
    if (previousStage.current !== stage) heading.current?.focus({ preventScroll: true })
    previousStage.current = stage
  }, [state.index, complete])

  function speak(concept) { setAudioMessage(''); falar(concept.speechText, setAudioMessage) }
  function next() {
    stopSpeaking(); setAudioMessage('')
    dispatch({ type: 'next', index: state.index })
  }
  function restart() {
    stopSpeaking(); setAudioMessage('')
    dispatch({ type: 'restart', game: createBingoGame(level, state) })
  }

  return <main id="conteudo" className="bingo-page" tabIndex={-1}>
    <a className="bingo-back" href="#/jogar">← Jogos</a>
    <header className="bingo-intro"><h1>Bingo de Palavras</h1><p>Ouça a palavra e encontre na cartela.</p></header>
    <section className="bingo-play" aria-label="Cartela de Bingo">
      {!complete ? <div className="bingo-target">
        <div><p className="bingo-label">PALAVRA SORTEADA</p><h2 id="bingo-target" ref={heading} tabIndex={-1}>{target.word}</h2></div>
        <button type="button" className="bingo-action" aria-label={`Ouvir ${target.word}`} onClick={() => speak(target)}><SpeakerIcon />Ouvir palavra</button>
      </div> : <div className="bingo-summary"><h2 ref={heading} tabIndex={-1}>Bingo!</h2><p><strong>Muito bem!</strong><br />Você completou uma linha.</p></div>}
      <div className="bingo-grid">{state.board.map(id => {
        const concept = level.concepts.find(item => item.id === id)
        const marked = state.marked.includes(id)
        const winner = state.winning.includes(id)
        const clue = state.hint && id === target.id
        const label = winner ? `${concept.word}, marcada, combinação vencedora` : marked ? `${concept.word}, marcada` : clue ? `${concept.word}, pista` : `Selecionar ${concept.word}`
        return <button key={id} type="button" className={`bingo-cell${marked ? ' bingo-cell--marked' : ''}${winner ? ' bingo-cell--winner' : ''}${clue ? ' bingo-cell--hint' : ''}`} aria-label={label} aria-pressed={marked} aria-disabled={marked || state.correct || complete} onClick={() => dispatch({ type: 'select', id })}>
          <img src={concept.image} alt="" width="300" height="300" /><strong>{concept.word}</strong>
          {marked && <span className="bingo-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 4 4L19 6" /></svg>{winner ? 'Bingo!' : 'Marcada'}</span>}
          {clue && <small>Procure por esta opção.</small>}
        </button>
      })}</div>
      {!complete && <>
        <div className="bingo-feedback" role="status">{state.correct ? <><strong>Muito bem!</strong><p>Você encontrou {target.word}.</p></> : state.retry ? 'Procure novamente.' : state.hint ? 'Procure por esta opção. A pista tem contorno tracejado e texto.' : ''}</div>
        {state.correct ? <button type="button" className="bingo-action" onClick={next}>Próxima palavra</button> : <button type="button" className="bingo-action action-help" aria-label="Preciso de ajuda" onClick={() => dispatch({ type: 'help' })}>Preciso de ajuda</button>}
      </>}
    </section>
    {complete && <section className="bingo-success" aria-label="Conceitos da combinação vencedora">
      <h2>Palavras do seu Bingo</h2>
      <ul className="bingo-learned">{state.winning.map(id => {
        const concept = level.concepts.find(item => item.id === id)
        return <li key={id}><img src={concept.image} alt="" width="300" height="300" /><strong>{concept.word}</strong><button type="button" className="bingo-action" aria-label={`Ouvir ${concept.word}`} onClick={() => speak(concept)}><SpeakerIcon />Ouvir palavra</button></li>
      })}</ul>
      <button type="button" className="bingo-action" onClick={restart}>Jogar novamente</button>
    </section>}
    <p className="bingo-audio-status" role="status">{audioMessage}</p>

  </main>
}
