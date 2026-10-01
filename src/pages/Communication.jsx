import { useEffect, useMemo, useRef, useState } from 'react'
import CommunicationCard, { SpeakerIcon } from '../components/CommunicationCard'
import { falar, stopSpeaking } from '../utils/speech'
import {
  communicationNaturalPhrases,
  communicationSetIds,
  communicationSets,
  pictogramCredit,
} from '../data/communicationOptions'
import { learningConcepts } from '../data/learningConcepts'
import { getCurrentTheme } from '../utils/contentRotation'
import { advanceModuleRotation, getModuleRotation } from '../utils/contentRotationStorage'
import './Communication.css'

const tokenCatalog = Object.fromEntries(Object.entries(learningConcepts).map(([id, concept]) => [id, {
  id,
  label: concept.label,
  audioText: concept.speech,
  image: concept.image,
}]))
const functionalPhraseKeys = new Set(Object.keys(communicationNaturalPhrases).filter(key => key !== 'sim' && key !== 'nao'))

function getNaturalPhrase(tokens) {
  const ids = tokens.filter(Boolean)
  if (!ids.length) return ''

  const key = ids.join(',')
  if (communicationNaturalPhrases[key]) return communicationNaturalPhrases[key]

  const words = ids.map(id => (tokenCatalog[id]?.audioText || tokenCatalog[id]?.label || id).toLocaleLowerCase('pt-BR'))
  const phrase = words.join(' ')
  return `${phrase.charAt(0).toLocaleUpperCase('pt-BR')}${phrase.slice(1)}.`
}

export default function Communication() {
  const [rotation, setRotation] = useState(() => getModuleRotation('communication', communicationSetIds))
  const [qaSetId, setQaSetId] = useState('')
  const selectedSetId = qaSetId || getCurrentTheme(rotation)
  const selectedSet = communicationSets.find(set => set.id === selectedSetId) ?? communicationSets[0]
  const [phrase, setPhrase] = useState([])
  const [quickResponse, setQuickResponse] = useState(null)
  const [hasFunctionalCommunication, setHasFunctionalCommunication] = useState(false)
  const [audioMessage, setAudioMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const stepTitle = useRef(null)
  const advanceLocked = useRef(false)

  const vocabulary = useMemo(() => selectedSet.tokenIds.map(id => tokenCatalog[id]).filter(Boolean), [selectedSet])
  const quickAnswers = useMemo(() => selectedSet.quickResponseIds.map(id => tokenCatalog[id]).filter(Boolean), [selectedSet])
  const naturalPhrase = useMemo(() => getNaturalPhrase(phrase.map(item => item.id)), [phrase])

  useEffect(() => { stepTitle.current?.focus({ preventScroll: true }) }, [selectedSetId])
  useEffect(() => { advanceLocked.current = false }, [rotation])
  useEffect(() => () => stopSpeaking(), [])

  function resetSetState() {
    stopSpeaking()
    setPhrase([])
    setQuickResponse(null)
    setHasFunctionalCommunication(false)
    setAudioMessage('')
    setStatusMessage('')
  }

  function handleQaSetChange(setId) {
    setQaSetId(setId)
    resetSetState()
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape' || !phrase.length) return
      event.preventDefault()
      const next = phrase.slice(0, -1)
      setPhrase(next)
      setAudioMessage('')
      setStatusMessage(next.length ? 'Item removido.' : 'Frase limpa.')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phrase])

  function speak(text) {
    if (!text) return
    setAudioMessage('')
    falar(text, setAudioMessage)
  }

  function addItem(item) {
    const next = [...phrase, item]
    setPhrase(next)
    setAudioMessage('')
    setStatusMessage('Pictograma adicionado à frase.')
    if (functionalPhraseKeys.has(next.map(entry => entry.id).join(','))) setHasFunctionalCommunication(true)
  }

  function addQuickAnswer(item) {
    setQuickResponse(item)
    setHasFunctionalCommunication(true)
    setAudioMessage('')
    setStatusMessage('Resposta rápida selecionada.')
  }

  function removeItem(index) {
    const next = phrase.filter((_, itemIndex) => itemIndex !== index)
    setPhrase(next)
    setAudioMessage('')
    setStatusMessage(next.length ? 'Item removido.' : 'Frase limpa.')
  }

  function clear() {
    stopSpeaking()
    setPhrase([])
    setQuickResponse(null)
    setAudioMessage('')
    setStatusMessage('Frase limpa.')
  }

  function continueLearning() {
    if (!hasFunctionalCommunication) return
    if (qaSetId) {
      setQaSetId('')
      resetSetState()
      return
    }
    if (advanceLocked.current) return
    advanceLocked.current = true
    const nextRotation = advanceModuleRotation('communication', communicationSetIds)
    if (!nextRotation) {
      advanceLocked.current = false
      return
    }
    setRotation(nextRotation)
    resetSetState()
  }

  return (
    <main id="conteudo" className="communication-page" tabIndex={-1}>
      <a className="communication-back" href="#/aprender">← Aprender</a>

      <section className="communication-intro" aria-labelledby="communication-title">
        <h1 id="communication-title">O que você quer dizer?</h1>
        <p>Escolha pictogramas para expressar o que você quer comunicar.</p>
      </section>

      {import.meta.env.DEV && (
        <label className="communication-qa-selector">
          Conjunto para QA
          <select value={qaSetId} onChange={event => handleQaSetChange(event.target.value)}>
            <option value="">Rotação normal</option>
            {communicationSets.map(set => <option key={set.id} value={set.id}>{set.label}</option>)}
          </select>
        </label>
      )}

      <section className="sentence-panel" aria-labelledby="sentence-title">
        <h2 id="sentence-title">Sua frase</h2>

        <p className="sentence-set-label">Conjunto: {selectedSet.label}</p>

        {phrase.length ? (
          <ol className="sentence-words">
            {phrase.map((item, index) => (
              <li key={`${item.id}-${index}`}>
                <CommunicationCard {...item} onSpeak={speak} selected removable onRemove={() => removeItem(index)} />
              </li>
            ))}
          </ol>
        ) : (
          <p className="sentence-empty">Escolha uma opção abaixo.</p>
        )}

        {naturalPhrase && (
          <p className="sentence-natural" aria-live="polite">{naturalPhrase}</p>
        )}

        <div className="sentence-actions">
          <button type="button" disabled={!naturalPhrase} onClick={() => speak(naturalPhrase)}><SpeakerIcon />Ouvir frase</button>
          <button type="button" onClick={clear}>Limpar</button>
          <button type="button" disabled={!hasFunctionalCommunication} onClick={continueLearning}>{qaSetId ? 'Voltar à rotação' : 'Continuar aprendendo'}</button>
        </div>

        {quickResponse && (
          <div className="quick-response-natural" role="status" aria-live="polite">
            <p>Resposta rápida: {getNaturalPhrase([quickResponse.id])}</p>
            <button type="button" aria-label={`Ouvir resposta rápida: ${getNaturalPhrase([quickResponse.id])}`} onClick={() => speak(getNaturalPhrase([quickResponse.id]))}><SpeakerIcon />Ouvir resposta</button>
          </div>
        )}

        <p className="communication-status" role="status" aria-live="polite">{statusMessage}</p>
        <p className="audio-feedback" role="status" aria-live="polite">{audioMessage}</p>
      </section>

      <section className="communication-choices" aria-labelledby="step-title">
        <p className="communication-step">Vocabulário disponível</p>
        <h2 id="step-title" ref={stepTitle} tabIndex={-1}>{selectedSet.label}</h2>
        <div className="communication-grid">
          {vocabulary.map(item => (
            <CommunicationCard
              key={item.id}
              {...item}
              selected={phrase.some(phraseItem => phraseItem.id === item.id)}
              onSelect={() => addItem(item)}
              onSpeak={speak}
            />
          ))}
        </div>
      </section>

      {quickAnswers.length > 0 && (
        <section className="quick-answers" aria-labelledby="quick-title">
          <h2 id="quick-title">Respostas rápidas</h2>
          <p>Para responder apenas com sim ou não.</p>
          <div className="communication-grid quick-grid">
            {quickAnswers.map(item => (
              <CommunicationCard
                key={item.id}
                {...item}
                onSelect={() => addQuickAnswer(item)}
                onSpeak={speak}
                selected={quickResponse?.id === item.id}
              />
            ))}
          </div>
        </section>
      )}

      <footer className="communication-credit">Pictogramas: {pictogramCredit.author} · <a href={pictogramCredit.source}>ARASAAC</a> · {pictogramCredit.owner} · <a href={pictogramCredit.licenseUrl}>{pictogramCredit.license}</a></footer>
    </main>
  )
}
