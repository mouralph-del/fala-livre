import { useEffect, useReducer, useRef, useState } from 'react'
import { whereBelongsLevels, createAssociationRounds } from '../data/whereBelongsLevels'
import { SpeakerIcon } from '../components/CommunicationCard'
import { falar, stopSpeaking } from '../utils/speech'
import './WhereBelongsGame.css'
import { useGameProgress } from '../hooks/useGameProgress'
import GameProgressFeedback, { GameLevelStatus } from '../components/GameProgressFeedback'

const initial = rounds => ({ rounds, index: 0, selected: false, correct: false, message: '', hint: false })
function reducer(state, action) {
  if (action.type === 'restart') return initial(action.rounds)
  const round = state.rounds[state.index]
  if (!round) return state
  if (action.type === 'next') return state.correct && action.index === state.index
    ? { ...state, index: state.index + 1, correct: false, selected: false, hint: false, message: '' } : state
  if (state.correct) return state
  if (action.type === 'select') return { ...state, selected: !state.selected, message: '' }
  if (action.type === 'drag') return { ...state, selected: true, message: '' }
  if (action.type === 'cancel') return { ...state, selected: false, message: '' }
  if (action.type === 'help') return { ...state, hint: true }
  if (action.type === 'hide-hint') return action.index === state.index ? { ...state, hint: false } : state
  if (action.type === 'attempt' && state.selected && round.destinations.includes(action.id)) {
    const correct = action.id === round.correctDestination
    return { ...state, selected: false, correct, hint: correct ? false : state.hint, message: correct ? 'Muito bem!' : 'Tente novamente.' }
  }
  return state
}

function VisualRepresentation({ item, className = '', alt = '' }) {
  if (item.id === 'pote-materiais' || item.id === 'comida') {
    return <span className={`belongs-visual belongs-visual--unavailable ${className}`} aria-hidden="true">Sem imagem</span>
  }
  if (item.image) return <img className={className} src={item.image} alt={alt} width="246" height="328" draggable="false" />
  return <span className={`belongs-visual belongs-visual--${item.visualType} ${className}`} aria-hidden="true" />
}

export default function WhereBelongsGame({ progressService } = {}) {
  const [level, setLevel] = useState(whereBelongsLevels[0])
  const [state, dispatch] = useReducer(reducer, whereBelongsLevels[0], selectedLevel => initial(createAssociationRounds(selectedLevel)))
  const [drag, setDrag] = useState(null)
  const [audioMessage, setAudioMessage] = useState('')
  const source = useRef(null)
  const board = useRef(null)
  const heading = useRef(null)
  const nextButton = useRef(null)
  const gesture = useRef(null)
  const suppressClick = useRef(false)
  const hintTimer = useRef(null)
  const previousIndex = useRef(0)
  const round = state.rounds[state.index]
  const complete = state.rounds.length > 0 && state.index === state.rounds.length
  const progress = useGameProgress('onde-pertence', level.id, complete, progressService)

  useEffect(() => () => { clearTimeout(hintTimer.current); gesture.current = null; stopSpeaking() }, [])
  useEffect(() => {
    if (previousIndex.current !== state.index) {
      heading.current?.focus({ preventScroll: true })
      heading.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
    }
    previousIndex.current = state.index
  }, [state.index])
  useEffect(() => { if (state.correct) nextButton.current?.focus({ preventScroll: true }) }, [state.correct])

  function cancelGesture() {
    const current = gesture.current
    gesture.current = null
    if (current && source.current?.hasPointerCapture(current.id)) source.current.releasePointerCapture(current.id)
    setDrag(null)
  }
  function attemptAssociation(id) {
    if (state.correct || !round.destinations.includes(id)) return
    if (!state.selected && !gesture.current?.dragging) return
    if (id === round.correctDestination) clearTimeout(hintTimer.current)
    dispatch({ type: 'attempt', id })
  }
  function destinationAt(x, y) {
    const el = document.elementFromPoint(x, y)?.closest('[data-destination]')
    return el && board.current?.contains(el) ? el.dataset.destination : null
  }
  function pointerDown(event) {
    if (state.correct || gesture.current || !event.isPrimary || event.button !== 0) return
    suppressClick.current = false
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, dragging: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function pointerMove(event) {
    const current = gesture.current
    if (!current || current.id !== event.pointerId) return
    if (!current.dragging) {
      if (Math.hypot(event.clientX - current.x, event.clientY - current.y) < 6) return
      current.dragging = true
      suppressClick.current = true
      dispatch({ type: 'drag' })
    }
    setDrag({ x: Math.max(40, Math.min(innerWidth - 40, event.clientX)), y: Math.max(48, Math.min(innerHeight - 48, event.clientY)), over: destinationAt(event.clientX, event.clientY) })
  }
  function pointerEnd(event, cancelled = false) {
    const current = gesture.current
    if (!current || current.id !== event.pointerId) return
    if (current.dragging) {
      const destination = cancelled ? null : destinationAt(event.clientX, event.clientY)
      if (destination) attemptAssociation(destination)
      else dispatch({ type: 'cancel' })
    }
    cancelGesture()
  }
  function clickObject(event) {
    if (event.detail > 0 && suppressClick.current) { suppressClick.current = false; return }
    dispatch({ type: 'select' })
  }
  function help() {
    clearTimeout(hintTimer.current)
    dispatch({ type: 'help' })
    hintTimer.current = setTimeout(() => dispatch({ type: 'hide-hint', index: state.index }), level.hintDuration)
  }
  function clearTransient() {
    clearTimeout(hintTimer.current); cancelGesture(); suppressClick.current = false
    stopSpeaking(); setAudioMessage('')
  }
  function next() { clearTransient(); dispatch({ type: 'next', index: state.index }) }
  function restart() { clearTransient(); dispatch({ type: 'restart', rounds: createAssociationRounds(level, state.rounds) }) }
  function changeLevel(nextLevel) {
    if (!progress.canEnter(nextLevel.id)) return
    clearTransient()
    setLevel(nextLevel)
    dispatch({ type: 'restart', rounds: createAssociationRounds(nextLevel) })
  }
  function escape(event) {
    if (event.key !== 'Escape') return
    cancelGesture(); dispatch({ type: 'cancel' }); source.current?.focus({ preventScroll: true })
  }
  function speak() {
    setAudioMessage('')
    falar(round.prompt, () => setAudioMessage('Áudio indisponível no momento. Você pode continuar a atividade.'))
  }

  return <main id="conteudo" className="belongs-page" tabIndex={-1} onKeyDown={escape}>
    <header className="belongs-intro"><a className="belongs-back" href="#/jogar">← Jogos</a><h1>Onde pertence?</h1></header>
    <nav className="belongs-levels" aria-label="Escolher nível">
      {whereBelongsLevels.map((item, index) => <button key={item.id} type="button" className={`belongs-level${item.id === level.id ? ' belongs-level--active' : ''}`} aria-pressed={item.id === level.id} aria-disabled={progress.availability(item.id).status !== 'available'} onClick={() => changeLevel(item)}>Nível {index + 1}<GameLevelStatus progress={progress} levelId={item.id} /></button>)}
    </nav>
    <GameProgressFeedback progress={progress} firstLevel={whereBelongsLevels[0]} onChange={changeLevel} />
    {progress.activeAvailable && <>
    {complete ? <section className="belongs-success">
      <h2 ref={heading} tabIndex={-1}>Muito bem!</h2><p>Você completou {level.label.toLowerCase()}.</p>
      <button type="button" className="belongs-action" onClick={restart}>Jogar novamente</button>
    </section> : <section className="belongs-play" aria-labelledby="belongs-question" data-round={round.id}>
      <div className="belongs-question"><h2 id="belongs-question" ref={heading} tabIndex={-1}>{round.prompt}</h2><button type="button" className="belongs-action belongs-audio" aria-label="Ouvir pergunta" onClick={speak}><SpeakerIcon /></button></div>
      <div className="belongs-origin">
        <button ref={source} type="button" className={'belongs-object' + (state.selected ? ' belongs-object--selected' : '') + (state.hint ? ' belongs-object--hint' : '')} aria-label={`Selecionar ${round.object}`} aria-describedby="belongs-instruction" aria-pressed={state.selected} aria-disabled={state.correct} tabIndex={state.correct ? -1 : 0} data-moving={Boolean(drag)} data-placed={state.correct}
          onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={event => pointerEnd(event, true)} onLostPointerCapture={event => pointerEnd(event, true)} onClick={clickObject}>
          <VisualRepresentation item={round} />
        </button>
        <p id="belongs-instruction">Arraste ou selecione o objeto e depois o destino.</p>
        <p className="belongs-selection" role="status">{state.selected ? 'Objeto selecionado' : state.correct ? 'Objeto associado' : ''}</p>
      </div>
      <div className="belongs-destinations" ref={board}>{round.destinations.map(id => {
        const destination = level.destinations.find(item => item.id === id)
        const found = state.correct && id === round.correctDestination
        const clue = state.hint && id === round.correctDestination
        return <button type="button" key={id} data-destination={id} className={'belongs-destination' + (state.selected ? ' belongs-destination--available' : '') + (drag?.over === id ? ' belongs-destination--over' : '') + (clue ? ' belongs-destination--hint' : '') + (found ? ' belongs-destination--found' : '')}
          aria-label={destination.label + (found ? ', objeto associado' : '') + (clue ? ', pista' : '')} aria-disabled={!state.selected || state.correct} tabIndex={state.correct ? -1 : 0} onClick={event => { if (event.detail > 0 && suppressClick.current) { suppressClick.current = false; return }; attemptAssociation(id) }}>
          <VisualRepresentation item={destination} className="belongs-place-image" />
          <strong>{destination.label}</strong>
          <span className="belongs-association">{found ? <><VisualRepresentation item={round} alt={round.object} /><span aria-hidden="true">✓</span></> : clue ? 'Pista' : drag?.over === id ? 'Solte aqui' : state.selected ? 'Colocar aqui' : ''}</span>
        </button>
      })}</div>
      <p className="belongs-feedback" role="status">{state.message}</p>
      <div className="belongs-controls"><span>{state.index + 1} de {state.rounds.length}</span>{state.correct ? <button ref={nextButton} type="button" className="belongs-action action-primary" onClick={next}>Próxima</button> : <button type="button" className="belongs-action" onClick={help}>Preciso de ajuda</button>}</div>
      {drag && <div className="belongs-drag" aria-hidden="true" style={{ left: drag.x, top: drag.y }}><VisualRepresentation item={round} /></div>}
    </section>}
    </>}
    <p className="belongs-audio-status" role="status">{audioMessage}</p>
  </main>
}
