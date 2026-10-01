import { useEffect, useRef, useState } from 'react'
import CommunicationCard, { SpeakerIcon } from '../components/CommunicationCard'
import { dailySituations } from '../data/dailySituations'
import { pictogramCredit } from '../data/communicationOptions'
import { falar, stopSpeaking } from '../utils/speech'
import './Communication.css'
import './DailySituations.css'

const stages = ['Situação', 'Escolha', 'Comunicar']

export default function DailySituations() {
  const situation = dailySituations[0]
  const [step, setStep] = useState(0)
  const [choice, setChoice] = useState(null)
  const [hint, setHint] = useState(false)
  const [audioMessage, setAudioMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const stageHeading = useRef(null)
  const previousStep = useRef(step)
  const hintTimer = useRef(null)
  const correct = choice === situation.correctOption

  useEffect(() => () => {
    stopSpeaking()
    if (hintTimer.current) window.clearTimeout(hintTimer.current)
  }, [])

  useEffect(() => {
    if (step !== previousStep.current) stageHeading.current?.focus({ preventScroll: true })
    previousStep.current = step
  }, [step])

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

  function select(id) {
    setChoice(id)
    if (hintTimer.current) window.clearTimeout(hintTimer.current)
    setHint(false)
    setStatusMessage(id === situation.correctOption ? 'Resposta correta.' : 'Vamos tentar de novo.')
    if (id === situation.correctOption) {
      stopSpeaking()
      setAudioMessage('')
      setStep(2)
    }
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

  function restart() {
    stopSpeaking()
    if (hintTimer.current) window.clearTimeout(hintTimer.current)
    setAudioMessage('')
    setStatusMessage('')
    setChoice(null)
    setHint(false)
    setStep(0)
  }

  return <main id="conteudo" className="situations-page" tabIndex={-1}>
    <a className="situations-back" href="#/aprender">← Aprender</a>
    <header className="situations-intro"><h1>Situações do dia a dia</h1><p>Vamos aprender o que fazer em diferentes momentos.</p></header>
    <ol className="situations-stages" aria-label="Etapas da atividade">{stages.map((title, index) => <li key={title} aria-current={step === index ? 'step' : undefined}><span>{index + 1}</span>{title}</li>)}</ol>
    <section className="situations-panel" aria-labelledby="situation-title">
      <div className="situation-context"><img src={situation.image} alt="" width="300" height="300" /><div><h2 id="situation-title" ref={step === 0 ? stageHeading : undefined} tabIndex={-1}>{situation.title}</h2><p>{situation.prompt}</p><button className="situations-action" type="button" onClick={() => speak(situation.speechPrompt)}><SpeakerIcon />Ouvir situação</button></div></div>
      {step === 0 && <button className="situations-action" type="button" onClick={() => { stopSpeaking(); setStep(1) }}>Escolher uma opção <span aria-hidden="true">→</span></button>}
      {step === 1 && <section className="situation-options" aria-labelledby="situation-options-title">
        <h2 id="situation-options-title" ref={stageHeading} tabIndex={-1}>Escolha uma opção</h2>
        <div className="situations-grid">{situation.options.map(option => <div key={option.id} className={`situation-option${hint && option.id === situation.correctOption ? ' situation-option--hint' : ''}`}>
          {hint && option.id === situation.correctOption && <p className="situation-hint-label">Pista: pense nesta opção</p>}
          <CommunicationCard {...option} selected={choice === option.id} onSelect={() => select(option.id)} onSpeak={speak} />
        </div>)}</div>
        <div className="situation-feedback" role="status" aria-live="polite">{choice && !correct && <><strong>{situation.retryTitle}</strong><p>{situation.retryMessage}</p></>}</div>
        <button type="button" className="situations-action" aria-pressed={hint} onClick={requestHint}>Preciso de ajuda</button>
        <p className="situation-help-status" role="status" aria-live="polite">{hint ? 'Pista: observe a opção ÁGUA.' : statusMessage}</p>
      </section>}
      {step === 2 && <section className="situation-result" aria-labelledby="situation-result-title">
        <div className="situation-feedback" role="status" aria-live="polite"><strong>{situation.successTitle}</strong><p>{situation.successMessage}</p></div>
        <h2 id="situation-result-title" ref={stageHeading} tabIndex={-1}>Você pode dizer:</h2>
        <ol className="situation-phrase" aria-label="Frase de exemplo">{situation.communicationPhrase.map(word => <li key={word.id}><img src={word.image} alt="" width="300" height="300" /><span>{word.label}</span></li>)}</ol>
        <div className="situations-actions"><button type="button" className="situations-action" onClick={() => speak(situation.communicationSpeech)}><SpeakerIcon />Ouvir frase</button><button type="button" className="situations-action" onClick={restart}>Praticar novamente</button></div>
      </section>}
      <p className="situation-audio-status" role="status" aria-live="polite">{audioMessage}</p>
    </section>
    <footer className="situations-credit">Pictogramas: {pictogramCredit.author} · <a href={pictogramCredit.source}>ARASAAC</a> · {pictogramCredit.owner} · <a href={pictogramCredit.licenseUrl}>{pictogramCredit.license}</a></footer>
  </main>
}
