import { useEffect, useReducer, useRef, useState } from 'react'
import { findImageLevels, createFindImageRounds } from '../data/findImageLevels'
import { SpeakerIcon } from '../components/CommunicationCard'
import { falar, stopSpeaking } from '../utils/speech'
import './FindImageGame.css'

const initial = rounds => ({ rounds, index: 0, correct: false, hint: false, retry: false })
function reducer(state, action) {
  if (action.type === 'restart') return initial(action.rounds)
  if (state.index >= state.rounds.length) return state
  if (action.type === 'next') {
    if (!state.correct || action.index !== state.index) return state
    return { ...state, index: state.index + 1, correct: false, hint: false, retry: false }
  }
  if (state.correct) return state
  if (action.type === 'help') return { ...state, hint: true, retry: false }
  if (action.type === 'hide-hint') return action.index === state.index ? { ...state, hint: false } : state
  if (action.type === 'select') {
    if (!state.rounds[state.index].options.includes(action.id)) return state
    const correct = action.id === state.rounds[state.index].target
    return { ...state, correct, retry: !correct, hint: correct ? false : state.hint }
  }
  return state
}

export default function FindImageGame() {
  const [level, setLevel] = useState(findImageLevels[0])
  const [state, dispatch] = useReducer(reducer, findImageLevels[0], selectedLevel => initial(createFindImageRounds(selectedLevel)))
  const [audioMessage, setAudioMessage] = useState('')
  const heading = useRef(null)
  const hintTimer = useRef(null)
  const previousIndex = useRef(state.index)
  const complete = state.index === state.rounds.length
  const round = state.rounds[state.index]
  const target = level.concepts.find(concept => concept.id === round?.target)

  useEffect(() => () => { clearTimeout(hintTimer.current); stopSpeaking() }, [])
  useEffect(() => {
    if (previousIndex.current !== state.index) {
      heading.current?.focus({ preventScroll: true })
      heading.current?.scrollIntoView({ behavior: 'instant', block: 'nearest' })
    }
    previousIndex.current = state.index
  }, [state.index])

  function speak() {
    setAudioMessage('')
    falar(target.question, () => setAudioMessage('Áudio indisponível no momento. Você pode continuar escolhendo uma imagem.'))
  }
  function help() {
    if (state.correct) return
    clearTimeout(hintTimer.current)
    dispatch({ type: 'help' })
    hintTimer.current = setTimeout(() => dispatch({ type: 'hide-hint', index: state.index }), level.hintDuration)
  }
  function select(id) {
    if (state.correct) return
    if (id === target.id) clearTimeout(hintTimer.current)
    dispatch({ type: 'select', id })
  }
  function next() {
    clearTimeout(hintTimer.current)
    stopSpeaking(); setAudioMessage('')
    dispatch({ type: 'next', index: state.index })
  }
  function restart() {
    clearTimeout(hintTimer.current)
    stopSpeaking(); setAudioMessage('')
    dispatch({ type: 'restart', rounds: createFindImageRounds(level, state.rounds) })
  }

  function changeLevel(nextLevel) {
    clearTimeout(hintTimer.current)
    stopSpeaking(); setAudioMessage('')
    setLevel(nextLevel)
    dispatch({ type: 'restart', rounds: createFindImageRounds(nextLevel) })
  }

  return <main id="conteudo" className="findimage-page" tabIndex={-1}>
    <header className="findimage-intro">
      <a className="findimage-back" href="#/jogar">← Jogos</a>
      <h1>Encontre a Imagem</h1>
    </header>
    <nav className="findimage-levels" aria-label="Escolher nível">
      {findImageLevels.map((item, index) => <button key={item.id} type="button" className={`findimage-level${item.id === level.id ? ' findimage-level--active' : ''}`} aria-pressed={item.id === level.id} onClick={() => changeLevel(item)}>Nível {index + 1}</button>)}
    </nav>
    {!complete ? <section className="findimage-play" aria-labelledby="findimage-target">
      <div className="findimage-target">
        <h2 id="findimage-target" ref={heading} tabIndex={-1}>{target.question}</h2>
        <button type="button" className="findimage-action findimage-audio" aria-label="Ouvir pergunta" onClick={speak}><SpeakerIcon /></button>
      </div>
      <div className="findimage-grid">{round.options.map(id => {
        const concept = level.concepts.find(item => item.id === id)
        const found = state.correct && id === target.id
        const clue = state.hint && id === target.id
        return <button key={id} type="button" data-animal={id} className={`findimage-option${found ? ' findimage-option--found' : ''}${clue ? ' findimage-option--hint' : ''}`} aria-label={concept.word} aria-pressed={found} aria-disabled={state.correct} tabIndex={state.correct ? -1 : 0} onClick={() => select(id)}>
          <img src={concept.image} alt="" width="512" height="512" />
          {found && <span className="findimage-badge" aria-hidden="true">✓</span>}
          {clue && <span className="findimage-badge" aria-hidden="true">Pista</span>}
        </button>
      })}</div>
      <div className="findimage-feedback" role="status">{state.correct ? 'Muito bem!' : state.retry ? 'Tente novamente.' : state.hint ? 'Observe a imagem com contorno tracejado.' : ''}</div>
      <div className="findimage-controls">
        <p className="findimage-round">{state.index + 1} de {state.rounds.length}</p>
        {state.correct
          ? <button type="button" className="findimage-action" onClick={next}>Próxima</button>
          : <button type="button" className="findimage-action" onClick={help}>Preciso de ajuda</button>}
      </div>
    </section> : <section className="findimage-success" aria-labelledby="findimage-complete">
      <h2 id="findimage-complete" ref={heading} tabIndex={-1}>Muito bem!</h2>
      <p>Você completou o nível de {level.completionLabel}.</p>
      <button type="button" className="findimage-action" onClick={restart}>Jogar novamente</button>
    </section>}
    <p className="findimage-audio-status" role="status">{audioMessage}</p>
  </main>
}
