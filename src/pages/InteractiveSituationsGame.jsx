import { useEffect, useReducer, useRef, useState } from 'react'
import { interactiveSituations, interactivePhraseSpeech } from '../data/interactiveSituations'
import { pictogramCredit } from '../data/communicationOptions'
import { SpeakerIcon } from '../components/CommunicationCard'
import { falar, stopSpeaking } from '../utils/speech'
import './InteractiveSituationsGame.css'
import { myDayCommunication, myDayCommunicationIds } from '../data/myDayCommunication'
import { learningConcepts } from '../data/learningConcepts'
import { socialExpressions } from '../data/socialExpressions'
import { communicationHelp, constructedSpeech, validateCommunication } from '../utils/myDayCommunication'
import { getCurrentTheme } from '../utils/contentRotation'
import { advanceModuleRotation, getModuleRotation } from '../utils/contentRotationStorage'
import { useLearningProgress } from '../hooks/useLearningProgress'

const continuousVocabulary = { ...learningConcepts, ...socialExpressions }
const continuousPhrases = Object.fromEntries(myDayCommunication.flatMap(item => item.alternatives.map(variant => [variant.tokens.join(','), variant.speech])))
function continuousInitial(rotation) {
  const situation = myDayCommunication.find(item => item.id === getCurrentTheme(rotation))
  return { ...initial, continuous: true, rotation, phrase: createPhrase(situation.slotCount), helpCount: 0, helpText: '' }
}
function continuousReducer(state, action) {
  if (action.type === 'next-situation') return continuousInitial(action.rotation)
  const situation = myDayCommunication.find(item => item.id === getCurrentTheme(state.rotation))
  if (state.confirmed) return state
  if (action.type === 'hint') {
    const help = communicationHelp(state.phrase, situation, state.helpCount)
    return { ...state, helpCount: Math.min(2, state.helpCount + 1), hint: help.position, helpText: help.text }
  }
  if (action.type === 'confirm') return { ...state, confirmed: validateCommunication(state.phrase, situation), retry: !validateCommunication(state.phrase, situation), editing: null, hint: null, helpText: '' }
  if (action.type === 'edit') return { ...state, editing: state.editing === action.position ? null : action.position }
  if (action.type === 'cancel') return { ...state, editing: null, announcement: 'Seleção cancelada.' }
  if (action.type === 'clear') return { ...state, phrase: createPhrase(situation.slotCount), editing: null, retry: false, hint: null, helpText: '', announcement: 'Frase limpa.' }
  if (action.type === 'place' || action.type === 'remove') {
    if (!Number.isInteger(action.position) || action.position < 0 || action.position >= state.phrase.length) return state
    if (action.type === 'place' && !situation.options.some(item => item.id === action.id)) return state
    const phrase = [...state.phrase]
    phrase[action.position] = action.type === 'remove' ? null : action.id
    return { ...state, phrase, editing: null, retry: false, hint: null, helpText: '', announcement: action.announcement }
  }
  return state
}

const initial = {
  levelId: null,
  situationIndex: 0,
  phrase: [],
  editing: null,
  retry: false,
  confirmed: false,
  finished: false,
  hint: null,
  announcement: '',
}

function createPhrase(length) {
  return Array.from({ length }, () => null)
}

function initialForLevel(levelId) {
  const level = interactiveSituations.find(item => item.id === levelId)
  const situation = level?.situations[0]
  return situation ? { ...initial, levelId: level.id, phrase: createPhrase(situation.expectedTokens.length) } : initial
}

function reducer(state, action) {
  if (state.continuous) return continuousReducer(state, action)
  if (action.type === 'menu') return initial

  if (action.type === 'select-level') {
    const level = interactiveSituations.find(item => item.id === action.levelId)
    if (!level) return state
    const firstSituation = level.situations[0]
    return {
      ...initial,
      levelId: level.id,
      situationIndex: 0,
      phrase: createPhrase(firstSituation.expectedTokens.length),
    }
  }

  if (action.type === 'reset-level') {
    const level = interactiveSituations.find(item => item.id === state.levelId)
    if (!level) return state
    const firstSituation = level.situations[0]
    return {
      ...initial,
      levelId: level.id,
      situationIndex: 0,
      phrase: createPhrase(firstSituation.expectedTokens.length),
    }
  }

  if (!state.levelId) return state
  const level = interactiveSituations.find(item => item.id === state.levelId)
  if (!level) return state
  const currentSituation = level.situations[state.situationIndex]
  if (!currentSituation) return state

  if (!state.confirmed) {
    if (action.type === 'edit' && action.position >= 0 && action.position < state.phrase.length) {
      return { ...state, editing: state.editing === action.position ? null : action.position }
    }

    if (action.type === 'cancel') {
      return { ...state, editing: null, announcement: 'Seleção cancelada.' }
    }

    if (action.type === 'hint') {
      const position = state.phrase.findIndex((id, index) => id !== currentSituation.expectedTokens[index])
      return {
        ...state,
        hint: position >= 0 ? position : null,
        announcement: position < 0 ? 'Frase organizada. Você pode confirmar.' : '',
      }
    }

    if (action.type === 'hide-hint') return { ...state, hint: null }

    if (action.type === 'place' && currentSituation.options.some(item => item.id === action.id)) {
      const position = Number(action.position)
      if (!Number.isInteger(position) || position < 0 || position >= state.phrase.length) return state
      const phrase = [...state.phrase]
      phrase[position] = action.id
      return { ...state, phrase, editing: null, retry: false, hint: null, announcement: action.announcement }
    }

    if (action.type === 'remove' && action.position >= 0 && action.position < state.phrase.length) {
      const phrase = [...state.phrase]
      phrase[action.position] = null
      return { ...state, phrase, editing: null, retry: false, hint: null, announcement: action.announcement }
    }

    if (action.type === 'clear') {
      return { ...state, phrase: createPhrase(currentSituation.expectedTokens.length), editing: null, retry: false, hint: null, announcement: 'Frase limpa.' }
    }

    if (action.type === 'confirm' && state.phrase.every(Boolean)) {
      const matches = currentSituation.expectedTokens.every((id, index) => id === state.phrase[index])
      if (!matches) {
        return { ...state, retry: true, hint: null, announcement: 'Quase! Tente novamente.' }
      }

      return { ...state, confirmed: true, retry: false, editing: null, hint: null, announcement: 'Resposta correta.' }
    }
  }

  if (action.type === 'continue' && state.confirmed) {
    const nextIndex = state.situationIndex + 1
    if (nextIndex < level.situations.length) {
      const nextSituation = level.situations[nextIndex]
      return {
        ...state,
        situationIndex: nextIndex,
        phrase: createPhrase(nextSituation.expectedTokens.length),
        editing: null,
        retry: false,
        confirmed: false,
        hint: null,
        announcement: '',
        finished: false,
      }
    }

    return { ...state, finished: true, announcement: 'Nível concluído.' }
  }

  return state
}

export default function InteractiveSituationsGame({ embedded = false, initialLevelId = null, continuous = false, progressService }) {
  const progress = useLearningProgress(embedded && continuous, progressService)
  const recordScenario = progress.recordActivityPerformed
  const recordedSituation = useRef(null)
  const [state, dispatch] = useReducer(reducer, null, () => continuous ? continuousInitial(getModuleRotation('myDayCommunication', myDayCommunicationIds)) : initialForLevel(initialLevelId))
  const advanceLocked = useRef(false)
  const [audioMessage, setAudioMessage] = useState('')
  const heading = useRef(null)
  const board = useRef(null)
  const nextButton = useRef(null)
  const gesture = useRef(null)
  const suppressClick = useRef(false)
  const hintTimer = useRef(null)
  const scrollFrame = useRef(null)
  const focusSlot = useRef(null)
  const [drag, setDrag] = useState(null)

  const currentLevel = continuous ? { title: 'Comunicação', situations: myDayCommunication } : interactiveSituations.find(item => item.id === state.levelId) || null
  const currentSituation = continuous ? myDayCommunication.find(item => item.id === getCurrentTheme(state.rotation)) : currentLevel?.situations[state.situationIndex] || null
  const currentLevelLabel = embedded ? 'Comunicação' : currentLevel?.title
  const phraseSpeech = continuous ? constructedSpeech(state.phrase, continuousPhrases, continuousVocabulary) : interactivePhraseSpeech(state.phrase, currentSituation?.naturalPhrase, currentSituation?.expectedTokens)
  const full = state.phrase.every(Boolean)
  const canCheck = continuous ? state.phrase.slice(0, currentSituation.expectedTokens.length).every(Boolean) : full
  const stage = `${continuous ? currentSituation.id : state.levelId}/${state.situationIndex}/${state.confirmed}/${state.finished}`
  const previousStage = useRef(stage)

  useEffect(() => {
    if (!state.confirmed) { recordedSituation.current = null; return }
    if (!embedded || !continuous || recordedSituation.current === currentSituation.id) return
    recordedSituation.current = currentSituation.id
    recordScenario('myDayCommunication', currentSituation.id, ['complete'])
  }, [embedded, continuous, state.confirmed, currentSituation?.id, recordScenario])

  useEffect(() => () => {
    clearTimeout(hintTimer.current)
    cancelAnimationFrame(scrollFrame.current)
    gesture.current = null
    stopSpeaking()
  }, [])

  useEffect(() => {
    advanceLocked.current = false
  }, [state.rotation])

  useEffect(() => {
    if (stage !== previousStage.current) {
      if (state.confirmed && !state.finished) nextButton.current?.focus()
      else heading.current?.focus()
    }
    previousStage.current = stage
  }, [stage, state.confirmed, state.finished])

  useEffect(() => {
    if (focusSlot.current !== null) {
      board.current?.querySelectorAll('.interactive-slot')[focusSlot.current]?.focus()
      focusSlot.current = null
    }
  }, [state.phrase])

  function cancelGesture() {
    cancelAnimationFrame(scrollFrame.current)
    const current = gesture.current
    gesture.current = null
    const pointerId = continuous ? current?.pointerId : current?.id
    if (current?.element.hasPointerCapture(pointerId)) current.element.releasePointerCapture(pointerId)
    setDrag(null)
  }

  function change(action) {
    if (continuous && action.type === 'continue') {
      if (!state.confirmed || advanceLocked.current) return
      advanceLocked.current = true
      action = { type: 'next-situation', rotation: advanceModuleRotation('myDayCommunication', myDayCommunicationIds) }
    }
    clearTimeout(hintTimer.current)
    cancelGesture()
    suppressClick.current = false
    stopSpeaking()
    setAudioMessage('')
    dispatch(action)
  }

  function speak(text) {
    if (!text) return
    setAudioMessage('')
    falar(text, setAudioMessage)
  }

  function placePictogram(position, id) {
    if (!currentSituation || state.confirmed || state.finished || position < 0 || position >= state.phrase.length) return
    const word = currentSituation.options.find(item => item.id === id)
    if (!word) return
    if (continuous) stopSpeaking()
    clearTimeout(hintTimer.current)
    focusSlot.current = position
    dispatch({ type: 'place', position, id, announcement: `${word.word} colocado na posição ${position + 1}.` })
  }

  function removePictogram(position) {
    if (!currentSituation || state.confirmed || position < 0 || position >= state.phrase.length) return
    clearTimeout(hintTimer.current)
    const word = currentSituation.options.find(item => item.id === state.phrase[position])
    if (continuous) stopSpeaking()
    focusSlot.current = position
    dispatch({ type: 'remove', position, announcement: `${word ? word.word : 'Item'} removido da posição ${position + 1}.` })
  }

  function help() {
    clearTimeout(hintTimer.current)
    dispatch({ type: 'hint' })
    if (!continuous) hintTimer.current = setTimeout(() => dispatch({ type: 'hide-hint' }), 1800)
  }

  function slotAt(x, y) {
    const el = document.elementFromPoint(x, y)?.closest('[data-slot]')
    return el && board.current?.contains(el) ? Number(el.dataset.slot) : null
  }

  function pointerDown(event, id) {
    if (state.confirmed || gesture.current || !event.isPrimary || event.button !== 0 || !currentSituation) return
    suppressClick.current = false
    gesture.current = { pointerId: event.pointerId, id, x: event.clientX, y: event.clientY, dragging: false, element: event.currentTarget }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function pointerMove(event) {
    const current = gesture.current
    if (!current || current.pointerId !== event.pointerId) return
    if (!current.dragging && Math.hypot(event.clientX - current.x, event.clientY - current.y) < 6) return
    const started = !current.dragging
    current.dragging = true
    current.clientX = event.clientX
    current.clientY = event.clientY
    suppressClick.current = true
    setDrag({
      id: current.id,
      x: Math.max(40, Math.min(window.innerWidth - 40, event.clientX)),
      y: Math.max(44, Math.min(window.innerHeight - 44, event.clientY)),
      over: slotAt(event.clientX, event.clientY),
    })
    if (started) scrollFrame.current = requestAnimationFrame(scrollDuringDrag)
  }

  function scrollDuringDrag() {
    const current = gesture.current
    if (!current?.dragging) return
    const direction = current.clientY < 64 ? -1 : current.clientY > window.innerHeight - 64 ? 1 : 0
    if (direction) {
      window.scrollBy({ top: direction * 8, behavior: 'instant' })
      setDrag(previous => previous ? { ...previous, over: slotAt(current.clientX, current.clientY) } : null)
    }
    scrollFrame.current = requestAnimationFrame(scrollDuringDrag)
  }

  function pointerEnd(event, cancelled = false) {
    const current = gesture.current
    if (!current || current.pointerId !== event.pointerId) return
    if (current.dragging) {
      const position = cancelled ? null : slotAt(event.clientX, event.clientY)
      if (position !== null) placePictogram(position, current.id)
    }
    cancelGesture()
  }

  function selectPictogram(event, id) {
    if (!currentSituation) return
    if (event.detail > 0 && suppressClick.current) {
      suppressClick.current = false
      return
    }
    if (!gesture.current) {
      const targetPosition = state.editing ?? state.phrase.indexOf(null)
      placePictogram(targetPosition, id)
    }
  }

  function escape(event) {
    if (event.key !== 'Escape') return
    const source = gesture.current?.element
    cancelGesture()
    dispatch({ type: 'cancel' })
    source?.focus()
  }

  const disablePhraseAudio = !phraseSpeech || !currentSituation || state.finished

  if (!currentLevel || !currentSituation) {
    return <main id="conteudo" className="interactive-page" tabIndex={-1} onKeyDown={escape}>
      <header className="interactive-intro"><a className="interactive-back" href={embedded ? '#/aprender/meu-dia-a-dia' : '#/jogar'}>{embedded ? '← Meu Dia a Dia' : '← Jogos'}</a><h1>{embedded ? 'Comunicação' : 'Situações Interativas'}</h1></header>
      {embedded ? <p role="status">Esta atividade ainda não está disponível.</p> : <>
      <section className="interactive-menu" aria-labelledby="interactive-menu-title">
        <h2 id="interactive-menu-title" ref={heading} tabIndex={-1}>Escolha um nível</h2>
        <div className="interactive-menu-grid">
          {interactiveSituations.map(level => (
            <button type="button" className="interactive-menu-card interactive-level-card" key={level.id} onClick={() => change({ type: 'select-level', levelId: level.id })}>
              <div className="interactive-level-header">
                <strong>{level.title}</strong>
                <span>{level.description}</span>
              </div>
              <span className="interactive-level-count">{level.situations.length} situações</span>
              <span className="interactive-start">Abrir nível →</span>
            </button>
          ))}
        </div>
      </section>
      </>}
      <footer className="interactive-credit">Pictogramas: {pictogramCredit.author} · <a href={pictogramCredit.source}>ARASAAC</a> · {pictogramCredit.owner} · <a href={pictogramCredit.licenseUrl}>{pictogramCredit.license}</a></footer>
    </main>
  }

  return <main id="conteudo" className="interactive-page" tabIndex={-1} onKeyDown={escape}>
    <header className="interactive-intro">
      <a className="interactive-back" href={embedded ? '#/aprender/meu-dia-a-dia' : '#/jogar'}>{embedded ? '← Meu Dia a Dia' : '← Jogos'}</a>
      <h1>{embedded ? 'Comunicação' : 'Situações Interativas'}</h1>
    </header>

    {!embedded && <div className="interactive-level-switcher" aria-label="Seleção de nível">
      {interactiveSituations.map(level => (
        <button
          type="button"
          key={level.id}
          className={['interactive-level-button', level.id === currentLevel.id ? 'interactive-level-button--active' : ''].join(' ')}
          onClick={() => change({ type: 'select-level', levelId: level.id })}
        >
          {level.title}
        </button>
      ))}
    </div>}

    {state.finished ? (
      <section className="interactive-panel interactive-summary" aria-labelledby="interactive-complete">
        <p className="interactive-context">{currentLevelLabel}</p>
        <h2 id="interactive-complete" ref={heading} tabIndex={-1}>{embedded ? 'Muito bem!' : 'Nível concluído!'}</h2>
        <p className="interactive-summary-text">{embedded ? 'Você terminou estas situações de comunicação.' : `Você terminou as ${currentLevel.situations.length} situações deste nível com sucesso.`}</p>
        <div className="interactive-controls">
          <button type="button" className="interactive-action" onClick={() => change({ type: 'reset-level' })}>{embedded ? 'Repetir situações' : 'Repetir nível'}</button>
          {embedded ? <a className="interactive-action" href="#/aprender/meu-dia-a-dia">Voltar ao Meu Dia a Dia</a> : <button type="button" className="interactive-action" onClick={() => change({ type: 'menu' })}>Escolher outro nível</button>}
        </div>
      </section>
    ) : (
      <section className="interactive-panel interactive-game" aria-labelledby="interactive-mission" data-situation={currentSituation.id}>
        <div className="interactive-scene">
          <img src={currentSituation.scene} alt={currentSituation.sceneAlt} style={{ objectPosition: currentSituation.imagePosition }} />
        </div>

        <div className="interactive-mission">
          <p className="interactive-context">{continuous ? currentSituation.title : <>{currentLevelLabel} · Situação {state.situationIndex + 1} de {currentLevel.situations.length}</>}</p>
          <h2 id="interactive-mission" ref={!state.confirmed ? heading : undefined} tabIndex={-1}>{currentSituation.prompt}</h2>
          {currentSituation.context && <p className="interactive-narrative">{currentSituation.context}</p>}
          <button type="button" className="interactive-action interactive-question-audio" aria-label="Ouvir missão" onClick={() => speak(currentSituation.prompt)}>
            <SpeakerIcon />Ouvir missão
          </button>
        </div>

        <div className="interactive-builder">
          {!state.confirmed && (
            <p className="interactive-instructions">Toque para preencher ou arraste pela alça. Para substituir, selecione um espaço e um pictograma.</p>
          )}
          {continuous && currentSituation.complements.length > 0 && <p className="interactive-instructions">O último espaço é opcional. Sua mensagem também está completa sem uma expressão social.</p>}

          <ol className="interactive-phrase" ref={board} aria-label="Frase construída">
            {state.phrase.map((id, position) => {
              const word = currentSituation.options.find(option => option.id === id)
              const selected = state.editing === position
              const hinted = state.hint === position
              const over = drag?.over === position

              return (
                <li key={position} data-slot={position} className={['interactive-slot-item', selected ? 'interactive-slot--editing' : '', hinted ? 'interactive-slot--hint' : '', over ? 'interactive-slot--over' : ''].join(' ')}>
                  <button
                    type="button"
                    className="interactive-slot"
                    aria-label={`Posição ${position + 1}${continuous && position >= currentSituation.expectedTokens.length ? ', complemento opcional' : ''}${word ? ': ' + word.word : ': vazia'}`}
                    aria-pressed={selected}
                    disabled={state.confirmed}
                    onClick={() => continuous ? change({ type: 'edit', position }) : dispatch({ type: 'edit', position })}
                  >
                    <span className="interactive-position">{position + 1}</span>
                    {word ? (
                      <>
                        <img src={word.image} alt="" width="300" height="300" />
                        <strong>{word.word}</strong>
                      </>
                    ) : (
                      <span className="interactive-empty">{continuous && position >= currentSituation.expectedTokens.length ? 'Opcional' : 'Escolha'}</span>
                    )}
                  </button>
                  {!state.confirmed && (
                    <button
                      type="button"
                      className="interactive-remove"
                      disabled={!word}
                      aria-label={word ? `Remover ${word.word} da posição ${position + 1}` : `Posição ${position + 1} vazia`}
                      onClick={() => removePictogram(position)}
                    >
                      Remover
                    </button>
                  )}
                </li>
              )
            })}
          </ol>

          <div className="interactive-controls">
            <button type="button" className="interactive-action" disabled={disablePhraseAudio} aria-label={`Ouvir frase${phraseSpeech ? ' ' + phraseSpeech : ''}`} onClick={() => speak(phraseSpeech)}>
              <SpeakerIcon />Ouvir frase
            </button>
            {!state.confirmed && (
              <button type="button" className="interactive-action" disabled={!state.phrase.some(Boolean)} onClick={() => change({ type: 'clear' })}>
                Limpar frase
              </button>
            )}
          </div>

          {!state.confirmed && (
            <>
              <p className="interactive-edit-status" role="status">
                {state.editing !== null ? `Escolha um pictograma para a posição ${state.editing + 1}.` : state.announcement}
              </p>

              <div className="interactive-options">
                {currentSituation.options.map(option => {
                  const optionIsHint = !continuous && state.hint !== null && currentSituation.expectedTokens[state.hint] === option.id
                  return (
                    <div key={option.id} className={['interactive-option', optionIsHint ? 'interactive-option--hint' : ''].join(' ')}>
                      <button
                        type="button"
                        className="interactive-select"
                        aria-label={`Selecionar ${option.word}`}
                        disabled={full && state.editing === null}
                        onClick={event => selectPictogram(event, option.id)}
                      >
                        <img src={option.image} alt="" width="300" height="300" draggable="false" />
                        <strong>{option.word}</strong>
                      </button>
                      <div className="interactive-option-tools">
                        <button
                          type="button"
                          className="interactive-handle"
                          aria-label={`Arrastar ${option.word}`}
                          onPointerDown={event => pointerDown(event, option.id)}
                          onPointerMove={pointerMove}
                          onPointerUp={pointerEnd}
                          onPointerCancel={event => pointerEnd(event, true)}
                          onLostPointerCapture={event => pointerEnd(event, true)}
                          onClick={event => selectPictogram(event, option.id)}
                        >
                          <span aria-hidden="true">≡</span>
                        </button>
                        <button type="button" className="interactive-action interactive-option-audio" aria-label={`Ouvir ${option.word}`} onClick={() => speak(option.speechText)}>
                          <SpeakerIcon /><span>Ouvir</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <p className="interactive-retry" role="status">
                {state.retry && <>Quase!<br />Veja a missão e tente outra combinação.</>}
              </p>
              <p className="interactive-hint-status" role="status">
                {continuous ? state.helpText : state.hint !== null && `${currentSituation.options.find(item => item.id === currentSituation.expectedTokens[state.hint])?.word ?? 'Item'} na posição ${state.hint + 1}.`}
              </p>

              <div className="interactive-controls">
                <button type="button" className="interactive-action" onClick={help}>Preciso de ajuda</button>
                <button type="button" className="interactive-action" disabled={!canCheck} onClick={() => change({ type: 'confirm' })}>{continuous ? 'Conferir frase' : 'Confirmar frase'}</button>
              </div>
            </>
          )}

          {state.confirmed && (
            <section className="interactive-response" aria-labelledby="interactive-response-title">
              <h3 id="interactive-response-title" ref={heading} tabIndex={-1}>Muito bem!</h3>
              <p className="interactive-response-text">{currentSituation.success}</p>
              <button type="button" className="interactive-action" aria-label="Ouvir feedback" onClick={() => speak(`Muito bem! ${currentSituation.success}`)}>
                <SpeakerIcon />Ouvir feedback
              </button>
              <div className="interactive-controls">
                <button type="button" className="interactive-action" ref={nextButton} onClick={event => { if (!continuous || event.detail <= 1) change({ type: 'continue' }) }}>
                  {continuous ? 'Próxima situação' : state.situationIndex < currentLevel.situations.length - 1 ? 'Continuar' : embedded ? 'Concluir' : 'Concluir nível'}
                </button>
              </div>
            </section>
          )}
        </div>
      </section>
    )}

    {drag && currentSituation && (
      <div className="interactive-drag" aria-hidden="true" style={{ left: drag.x, top: drag.y }}>
        <img src={currentSituation.options.find(item => item.id === drag.id)?.image} alt="" draggable="false" />
      </div>
    )}

    {!embedded && <button type="button" className="interactive-action interactive-menu-back" onClick={() => change({ type: 'menu' })}>Escolher outro nível</button>}

    <p className="interactive-audio-status" role="status">{audioMessage}</p>
    {embedded && continuous && <p role="status" aria-live="polite">{progress.message}</p>}
    <footer className="interactive-credit">Pictogramas: {pictogramCredit.author} · <a href={pictogramCredit.source}>ARASAAC</a> · {pictogramCredit.owner} · <a href={pictogramCredit.licenseUrl}>{pictogramCredit.license}</a></footer>
  </main>
}
