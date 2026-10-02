import { useEffect, useReducer, useRef, useState } from 'react'
import { sequenceGameLevels, shuffleSequence, isSequenceCorrect } from '../data/sequenceGameLevels'
import { pictogramCredit } from '../data/communicationOptions'
import { SpeakerIcon } from '../components/CommunicationCard'
import { falar, stopSpeaking } from '../utils/speech'
import './SequenceGame.css'

const initial = starts => ({ starts, activityIndex: 0, order: starts[0], selected: null, hint: null, feedback: '', complete: false, announcement: '' })
function reducer(state, action) {
  if (action.type === 'restart') return initial(action.starts)
  if (state.activityIndex >= action.activitiesLength && action.type !== 'restart') return state
  if (action.type === 'next') {
    if (!state.complete || action.index !== state.activityIndex) return state
    return { ...state, activityIndex: state.activityIndex + 1, order: state.starts[state.activityIndex + 1] || [], selected: null, hint: null, feedback: '', complete: false, announcement: '' }
  }
  if (state.complete) return state
  if (action.type === 'select' && state.order.includes(action.id)) {
    return { ...state, selected: state.selected === action.id ? null : action.id }
  }
  if (action.type === 'cancel') return { ...state, selected: null, announcement: 'Seleção cancelada.' }
  if (action.type === 'hide-hint') return action.index === state.activityIndex ? { ...state, hint: null } : state
  if (action.type === 'swap') {
    const { source, destination } = action
    if (![source, destination].every(index => Number.isInteger(index) && index >= 0 && index < state.order.length)) return state
    const order = [...state.order]
    ;[order[source], order[destination]] = [order[destination], order[source]]
    return { ...state, order, selected: null, hint: null, feedback: '', announcement: action.announcement }
  }
  if (action.type === 'verify') {
    const complete = isSequenceCorrect(state.order, action.activity)
    return { ...state, complete, selected: null, hint: null, announcement: '', feedback: complete ? 'correct' : 'retry' }
  }
  if (action.type === 'help') {
    const position = action.activity.steps.findIndex((step, index) => step.id !== state.order[index])
    return { ...state, hint: position < 0 ? null : position, feedback: position < 0 ? 'verify' : '' }
  }
  return state
}

function SequenceVisual({ step }) {
  const images = step.images || [step.image].filter(Boolean)
  return <span className={`sequence-visual sequence-visual--${step.visualType || 'asset'}${step.visualVariant ? ` sequence-visual--${step.visualVariant}` : ''}`} aria-hidden="true">
    {images.map((image, index) => <img key={index} src={image} alt="" draggable="false" />)}
    {step.secondaryImage && <img src={step.secondaryImage} alt="" draggable="false" />}
  </span>
}

export default function SequenceGame({ embedded = false }) {
  const [level, setLevel] = useState(sequenceGameLevels[0])
  const [state, dispatch] = useReducer(reducer, sequenceGameLevels[0], selectedLevel => initial(selectedLevel.activities.map(activity => shuffleSequence(activity))))
  const [audioMessage, setAudioMessage] = useState('')
  const heading = useRef(null)
  const board = useRef(null)
  const nextButton = useRef(null)
  const gesture = useRef(null)
  const hintTimer = useRef(null)
  const suppressClick = useRef(false)
  const pendingFocus = useRef(null)
  const [drag, setDrag] = useState(null)
  const previousIndex = useRef(0)
  const finished = state.activityIndex === level.activities.length
  const activity = level.activities[state.activityIndex]
  const hintStep = state.hint === null || !activity ? null : activity.steps[state.hint]
  const selectedStep = activity?.steps.find(step => step.id === state.selected)

  useEffect(() => () => { clearTimeout(hintTimer.current); gesture.current = null; stopSpeaking() }, [])
  useEffect(() => {
    if (previousIndex.current !== state.activityIndex) heading.current?.focus()
    previousIndex.current = state.activityIndex
  }, [state.activityIndex])
  useEffect(() => {
    if (pendingFocus.current !== null) {
      board.current?.querySelectorAll('.sequence-select')[pendingFocus.current]?.focus()
      pendingFocus.current = null
    }
  }, [state.order])
  useEffect(() => { if (state.complete) nextButton.current?.focus() }, [state.complete])
  function cancelGesture() {
    const current = gesture.current
    gesture.current = null
    if (current?.element.hasPointerCapture(current.id)) current.element.releasePointerCapture(current.id)
    setDrag(null)
  }
  function swapCards(source, destination) {
    if (state.complete) return
    const step = activity.steps.find(item => item.id === state.order[source])
    if (!step) return
    clearTimeout(hintTimer.current)
    pendingFocus.current = destination
    dispatch({ type: 'swap', source, destination, announcement: step.word + ' na posição ' + (destination + 1) + '.' })
  }
  function destinationAt(x, y) {
    const el = document.elementFromPoint(x, y)?.closest('[data-position]')
    return el && board.current?.contains(el) ? Number(el.dataset.position) : null
  }
  function pointerDown(event, position) {
    if (state.complete || gesture.current || !event.isPrimary || event.button !== 0) return
    suppressClick.current = false
    gesture.current = { id: event.pointerId, source: position, x: event.clientX, y: event.clientY, dragging: false, element: event.currentTarget }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function pointerMove(event) {
    const current = gesture.current
    if (!current || current.id !== event.pointerId) return
    if (!current.dragging && Math.hypot(event.clientX - current.x, event.clientY - current.y) < 6) return
    current.dragging = true
    suppressClick.current = true
    setDrag({ source: current.source, x: Math.max(44, Math.min(innerWidth - 44, event.clientX)), y: Math.max(48, Math.min(innerHeight - 48, event.clientY)), over: destinationAt(event.clientX, event.clientY) })
  }
  function pointerEnd(event, cancelled = false) {
    const current = gesture.current
    if (!current || current.id !== event.pointerId) return
    if (current.dragging) {
      const destination = cancelled ? null : destinationAt(event.clientX, event.clientY)
      if (destination !== null && destination !== current.source) swapCards(current.source, destination)
      else board.current?.querySelectorAll('.sequence-select')[current.source]?.focus({ preventScroll: true })
    }
    cancelGesture()
  }
  function guardedClick(event, callback) {
    if (event.detail > 0 && suppressClick.current) { suppressClick.current = false; return }
    if (!gesture.current) callback()
  }
  function escape(event) {
    if (event.key !== 'Escape') return
    const position = gesture.current?.source ?? state.order.indexOf(state.selected)
    cancelGesture(); dispatch({ type: 'cancel' })
    if (position >= 0) board.current?.querySelectorAll('.sequence-select')[position]?.focus()
  }
  function help() {
    clearTimeout(hintTimer.current); dispatch({ type: 'help', activity })
    hintTimer.current = setTimeout(() => dispatch({ type: 'hide-hint', index: state.activityIndex }), 1800)
  }
  function verify() { clearTimeout(hintTimer.current); cancelGesture(); dispatch({ type: 'verify', activity }) }
  function speak(step) {
    setAudioMessage('')
    falar(step.speechText, () => setAudioMessage('Áudio indisponível no momento. Você pode continuar organizando as ações.'))
  }
  function clearTransient() { clearTimeout(hintTimer.current); cancelGesture(); suppressClick.current = false; stopSpeaking(); setAudioMessage('') }
  function next() { clearTransient(); dispatch({ type: 'next', index: state.activityIndex, activitiesLength: level.activities.length }) }
  function restart() {
    clearTransient()
    dispatch({ type: 'restart', starts: level.activities.map((item, index) => shuffleSequence(item, state.starts[index])) })
  }
  function changeLevel(nextLevel) {
    clearTransient()
    setLevel(nextLevel)
    dispatch({ type: 'restart', starts: nextLevel.activities.map(activity => shuffleSequence(activity)) })
  }

  return <main id="conteudo" className="sequence-page" tabIndex={-1} onKeyDown={escape}>
    <header className="sequence-intro"><a className="sequence-back" href={embedded ? '#/aprender/meu-dia-a-dia' : '#/jogar'}>{embedded ? '← Meu Dia a Dia' : '← Jogos'}</a><h1>{embedded ? 'Rotinas' : 'Sequências'}</h1></header>
    {!embedded && <nav className="sequence-levels" aria-label="Escolher nível">
      {sequenceGameLevels.map((item, index) => <button key={item.id} type="button" className={`sequence-level${item.id === level.id ? ' sequence-level--active' : ''}`} aria-pressed={item.id === level.id} onClick={() => changeLevel(item)}>Nível {index + 1}</button>)}
    </nav>}
    {!finished ? <section className={`sequence-play${state.complete ? ' sequence-play--complete' : ''}`} aria-labelledby="sequence-title">
      <p className="sequence-round">Atividade {state.activityIndex + 1} de {level.activities.length}</p>
      <h2 id="sequence-title" ref={heading} tabIndex={-1}>{activity.title}</h2>
      <p className="sequence-context">{activity.context}</p>
      <p className="sequence-instruction">Arraste pela alça ou selecione um cartão e depois uma posição.</p>
      <ol className="sequence-grid" ref={board}>{state.order.map((id, position) => {
        const currentStep = activity.steps.find(item => item.id === id)
        const selected = state.selected === id
        const clue = hintStep?.id === id
        return <li key={position} data-position={position} className={"sequence-slot" + (drag?.over === position ? " sequence-slot--over" : "")}>
          <button type="button" className={`sequence-position${state.hint === position ? ' sequence-position--hint' : ''}`} aria-label={`Posição ${position + 1}`} disabled={!state.selected || state.complete} aria-describedby={state.hint === position ? 'sequence-hint' : undefined} onClick={event => guardedClick(event, () => swapCards(state.order.indexOf(state.selected), position))}><span className="sequence-position-label">Posição </span>{position + 1}</button>
          <div className={`sequence-card${selected ? ' sequence-card--selected' : ''}${clue ? ' sequence-card--hint' : ''}`}>
            <button type="button" className="sequence-select" aria-label={`Selecionar ${currentStep.word}`} aria-pressed={selected} disabled={state.complete} aria-describedby={clue ? 'sequence-hint' : undefined} onClick={event => guardedClick(event, () => dispatch({ type: 'select', id }))}>
              <SequenceVisual step={currentStep} /><strong>{currentStep.word}</strong>
            </button>
            <div className="sequence-tools">
              <button type="button" className="sequence-handle" aria-label={'Arrastar ou selecionar ' + currentStep.word} disabled={state.complete}
                onPointerDown={event => pointerDown(event, position)} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={event => pointerEnd(event, true)} onLostPointerCapture={event => pointerEnd(event, true)}
                onClick={event => guardedClick(event, () => dispatch({ type: 'select', id }))}><span aria-hidden="true">≡</span></button>
            <button type="button" className="sequence-action sequence-audio" aria-label={`Ouvir ${currentStep.word}`} onClick={() => speak(currentStep)}><SpeakerIcon /><span>Ouvir</span></button></div>
          </div>
        </li>
      })}</ol>
      <div className="sequence-selection" role="status">{selectedStep ? `${selectedStep.word} selecionado. Escolha uma posição entre 1 e ${activity.steps.length}.` : state.announcement}</div>
      <div className="sequence-feedback" role="status">
        {hintStep && <p id="sequence-hint">{hintStep.word} {state.hint === 0 ? 'vem primeiro.' : `vem na posição ${state.hint + 1}.`}</p>}
        {state.feedback === 'correct' && <><strong>Muito bem!</strong><p>Você colocou as ações na ordem.</p></>}
        {state.feedback === 'retry' && <><strong>Quase!</strong><p>Tente trocar a ordem das ações.</p></>}
        {state.feedback === 'verify' && <p>As ações já estão organizadas. Toque em Conferir.</p>}
      </div>
      <div className="sequence-controls">{state.complete ? <button type="button" className="sequence-action" ref={nextButton} onClick={next}>Próxima sequência</button> : <>
        <button type="button" className="sequence-action" onClick={verify}>Conferir</button>
        <button type="button" className="sequence-action" onClick={help}>Preciso de ajuda</button>
      </>}</div>
      {drag && <div className="sequence-drag" aria-hidden="true" style={{ left: drag.x, top: drag.y }}><SequenceVisual step={activity.steps.find(step => step.id === state.order[drag.source])} /></div>}
    </section> : <section className="sequence-success" aria-labelledby="sequence-complete">
      <h2 id="sequence-complete" ref={heading} tabIndex={-1}>Muito bem!</h2><p>{embedded ? 'Você completou estas rotinas.' : `Você completou ${level.label.toLowerCase()}.`}</p>
      <button type="button" className="sequence-action" onClick={restart}>{embedded ? 'Repetir rotinas' : 'Jogar novamente'}</button>
    </section>}
    <p className="sequence-audio-status" role="status">{audioMessage}</p>
    <footer className="sequence-credit">Pictogramas: {pictogramCredit.author} · <a href={pictogramCredit.source}>ARASAAC</a> · {pictogramCredit.owner} · <a href={pictogramCredit.licenseUrl}>{pictogramCredit.license}</a></footer>
  </main>
}
