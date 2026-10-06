import { useEffect, useRef, useState } from 'react'
import CommunicationCard, { SpeakerIcon } from '../components/CommunicationCard'
import { communicationWords } from '../data/communicationOptions'
import { learningConcepts } from '../data/learningConcepts'
import { dailySituations, dailySituationIds } from '../data/dailySituations'
import { getCurrentTheme } from '../utils/contentRotation'
import { advanceModuleRotation, getModuleRotation } from '../utils/contentRotationStorage'
import { falar, stopSpeaking } from '../utils/speech'
import './Communication.css'
import './DailySituations.css'

const moduleId = 'dailySituations'
const conceptCatalog = { ...communicationWords, ...learningConcepts }

function resolveConcept(conceptId) {
  const concept = conceptCatalog[conceptId]
  return {
    id: conceptId,
    label: concept.label,
    image: concept.image,
    audioText: concept.speech ?? concept.audioText ?? concept.label,
  }
}

export default function DailySituations() {
  const [rotation, setRotation] = useState(() => getModuleRotation(moduleId, dailySituationIds))
  const [qaSituationId, setQaSituationId] = useState('')
  const currentSituationId = qaSituationId || getCurrentTheme(rotation)
  const situation = dailySituations.find(item => item.id === currentSituationId) ?? dailySituations[0]
  const situationImage = resolveConcept(situation.imageConceptId).image
  const options = situation.options.map(resolveConcept)
  const [choice, setChoice] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [answeredCorrect, setAnsweredCorrect] = useState(false)
  const [hint, setHint] = useState(false)
  const [audioMessage, setAudioMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const situationHeading = useRef(null)
  const hintTimer = useRef(null)
  const advanceLocked = useRef(false)

  useEffect(() => () => {
    stopSpeaking()
    if (hintTimer.current) window.clearTimeout(hintTimer.current)
  }, [])

  useEffect(() => {
    situationHeading.current?.focus({ preventScroll: true })
  }, [situation.id])

  useEffect(() => {
    advanceLocked.current = false
  }, [rotation])

  useEffect(() => {
    if (!hint) return undefined
    hintTimer.current = window.setTimeout(() => setHint(false), 1800)
    return () => window.clearTimeout(hintTimer.current)
  }, [hint])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && hint) {
        event.preventDefault()
        window.clearTimeout(hintTimer.current)
        setHint(false)
        setStatusMessage('Pista fechada.')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hint])

  function speak(text) { setAudioMessage(''); falar(text, setAudioMessage) }

  function resetActivity() {
    stopSpeaking()
    if (hintTimer.current) window.clearTimeout(hintTimer.current)
    setAudioMessage('')
    setStatusMessage('')
    setChoice(null)
    setFeedback('')
    setAnsweredCorrect(false)
    setHint(false)
  }

  function select(id) {
    if (answeredCorrect) return
    setChoice(id)
    setFeedback('')
    if (hintTimer.current) window.clearTimeout(hintTimer.current)
    setHint(false)
    setStatusMessage(`Opção ${resolveConcept(id).label} selecionada.`)
  }

  function checkAnswer() {
    if (!choice || answeredCorrect) return
    if (choice === situation.correctOptionId) {
      setFeedback('Muito bem!')
      setAnsweredCorrect(true)
      setStatusMessage('Resposta correta.')
      return
    }
    setFeedback('Tente novamente.')
    setStatusMessage('Tente novamente.')
  }

  function nextSituation() {
    if (!answeredCorrect) return
    if (qaSituationId) {
      setQaSituationId('')
      resetActivity()
      return
    }
    if (advanceLocked.current) return
    advanceLocked.current = true
    const nextRotation = advanceModuleRotation(moduleId, dailySituationIds)
    if (!nextRotation) {
      advanceLocked.current = false
      return
    }
    setRotation(nextRotation)
    resetActivity()
  }

  function requestHint() {
    if (hint) {
      window.clearTimeout(hintTimer.current)
      setHint(false)
      setStatusMessage('Pista fechada.')
      return
    }
    setHint(true)
    setStatusMessage('Pista ativada.')
  }

  return <main id="conteudo" className="situations-page" tabIndex={-1}>
    <a className="situations-back" href="#/aprender">← Aprender</a>
    <header className="situations-intro"><h1>Situações do dia a dia</h1><p>Vamos aprender o que fazer em diferentes momentos.</p></header>

    {import.meta.env.DEV && (
      <label className="situations-qa-selector">
        Situação para QA
        <select value={qaSituationId} onChange={event => { setQaSituationId(event.target.value); resetActivity() }}>
          <option value="">Rotação normal</option>
          {dailySituations.map(item => <option key={item.id} value={item.id}>{item.situation}</option>)}
        </select>
      </label>
    )}

    <section className="situations-panel" aria-labelledby="situation-title">
      <div className="situation-context">
        <img src={situationImage} alt="" width="300" height="300" />
        <div>
          <h2 id="situation-title" ref={situationHeading} tabIndex={-1}>{situation.situation}</h2>
          <p>{situation.question}</p>
          <button className="situations-action" type="button" aria-label={`Ouvir situação: ${situation.situation}`} onClick={() => speak(`${situation.situation}. ${situation.question}`)}><SpeakerIcon />Ouvir situação</button>
        </div>
      </div>

      {!answeredCorrect && <section className="situation-options" aria-label="Escolha uma opção">
        <div className="situations-grid">{options.map(option => <div key={option.id} className={`situation-option${hint && option.id === situation.correctOptionId ? ' situation-option--hint' : ''}`}>
          {hint && option.id === situation.correctOptionId && <p className="situation-hint-label">Pista: observe esta opção</p>}
          <CommunicationCard {...option} selected={choice === option.id} onSelect={() => select(option.id)} onSpeak={speak} />
        </div>)}</div>
        {feedback && <div className="situation-feedback" role="status" aria-live="polite"><p>{feedback}</p></div>}
        <div className="situations-actions">
          <button type="button" className="situations-action" disabled={!choice} onClick={checkAnswer}>Conferir</button>
          <button type="button" className="situations-action action-help" aria-label="Preciso de ajuda" aria-pressed={hint} onClick={requestHint}>Preciso de ajuda</button>
        </div>
        <p className="situation-help-status" role="status" aria-live="polite">{hint ? `Pista: observe a opção ${resolveConcept(situation.correctOptionId).label}.` : statusMessage}</p>
      </section>}

      {answeredCorrect && <section className="situation-result" aria-label="Resposta correta">
        <div className="situation-feedback" role="status" aria-live="polite"><strong>Muito bem!</strong><p>{situation.naturalPhrase}</p></div>
        <div className="situations-actions">
          <button type="button" className="situations-action" aria-label={`Ouvir frase: ${situation.naturalPhrase}`} onClick={() => speak(situation.naturalPhrase)}><SpeakerIcon />Ouvir frase</button>
          <button type="button" className="situations-action" onClick={nextSituation}>{qaSituationId ? 'Voltar à rotação' : 'Próxima situação'}</button>
        </div>
      </section>}
      <p className="situation-audio-status" role="status" aria-live="polite">{audioMessage}</p>
    </section>

  </main>
}
