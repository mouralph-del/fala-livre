import { useEffect, useMemo, useRef, useState } from 'react'
import { SpeakerIcon } from '../components/CommunicationCard'
import { learningWords } from '../data/learningWords'
import { getCurrentTheme } from '../utils/contentRotation'
import { advanceModuleRotation, getModuleRotation } from '../utils/contentRotationStorage'
import { falar, stopSpeaking } from '../utils/speech'
import './WordsAndPhrases.css'
import { recognitionOptions } from '../utils/wordRecognition'
import { useLearningProgress } from '../hooks/useLearningProgress'

const moduleId = 'wordsAndPhrases'
const officialWordIds = ['casa', 'cama', 'sofa', 'gato', 'cachorro', 'peixe', 'bola', 'blocos', 'carrinho', 'lapis', 'estojo', 'mochila']
const phaseTitles = { know: 'Conhecer', build: 'Reconhecer', sentence: 'Usar na frase' }

export default function WordsAndPhrases({ progressService, qaControls = false } = {}) {
  const [rotation, setRotation] = useState(() => getModuleRotation(moduleId, officialWordIds))
  const [qaWordId, setQaWordId] = useState('')
  const progress = useLearningProgress(!qaWordId, progressService)
  const [phase, setPhase] = useState('know')
  const [recognitionSelection, setRecognitionSelection] = useState('')
  const [buildFeedback, setBuildFeedback] = useState('')
  const [buildSucceeded, setBuildSucceeded] = useState(false)
  const [sentenceSelection, setSentenceSelection] = useState('')
  const [sentenceFeedback, setSentenceFeedback] = useState('')
  const [sentenceSucceeded, setSentenceSucceeded] = useState(false)
  const [audioMessage, setAudioMessage] = useState('')
  const headingRef = useRef(null)
  const advanceLocked = useRef(false)

  const currentWordId = qaWordId || getCurrentTheme(rotation)
  const currentWord = learningWords.find(word => word.id === currentWordId) ?? learningWords[0]
  const choices = useMemo(() => recognitionOptions(currentWord.id, learningWords), [currentWord.id])

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [phase, currentWord.id])

  useEffect(() => {
    advanceLocked.current = false
  }, [rotation])

  useEffect(() => () => stopSpeaking(), [])

  function speak(text) {
    stopSpeaking()
    setAudioMessage('')
    falar(text, setAudioMessage)
  }

  function resetActivity() {
    stopSpeaking()
    setAudioMessage('')
    setPhase('know')
    setRecognitionSelection('')
    setBuildFeedback('')
    setBuildSucceeded(false)
    setSentenceFeedback('')
    setSentenceSelection('')
    setSentenceSucceeded(false)
  }

  function recognize(wordId) {
    setRecognitionSelection(wordId)
    if (wordId === currentWord.id) {
      if (!buildSucceeded) progress.recordActivityPerformed(moduleId, currentWord.id, ['build'])
      setBuildFeedback('Muito bem!')
      setBuildSucceeded(true)
    } else {
      setBuildFeedback('Tente novamente.')
      setBuildSucceeded(false)
    }
  }

  function continueToSentence() {
    setPhase('sentence')
    setSentenceSelection('')
    setSentenceFeedback('')
    setSentenceSucceeded(false)
  }

  function nextWord(event) {
    if (event.detail > 1 || !sentenceSucceeded || qaWordId || advanceLocked.current) return
    advanceLocked.current = true
    const nextRotation = advanceModuleRotation(moduleId, officialWordIds)
    if (!nextRotation) {
      advanceLocked.current = false
      return
    }
    setRotation(nextRotation)
    resetActivity()
  }

  function checkSentenceAnswer() {
    if (sentenceSelection === currentWord.sentenceAnswer) {
      if (!sentenceSucceeded) progress.recordActivityPerformed(moduleId, currentWord.id, ['sentence', 'complete'])
      setSentenceFeedback('Muito bem!')
      setSentenceSucceeded(true)
      return
    }
    setSentenceFeedback('Tente novamente.')
    setSentenceSucceeded(false)
  }

  return (
    <main id="conteudo" className="words-page" tabIndex={-1}>
      <a className="words-back" href="#/aprender">← Aprender</a>
      <header className="words-intro"><h1>Palavras e frases</h1><p>Aprenda palavras e use-as nas frases.</p></header>

      {import.meta.env.DEV && qaControls && (
        <label className="words-qa-selector">
          Palavra para QA
          <select
            value={qaWordId}
            onChange={event => {
              setQaWordId(event.target.value)
              resetActivity()
            }}
          >
            <option value="">Rotação normal</option>
            {officialWordIds.map(id => <option key={id} value={id}>{learningWords.find(word => word.id === id).word}</option>)}
          </select>
        </label>
      )}

      <section className="words-activity" aria-labelledby="words-heading">
        {phase === 'know' && (
          <>
            <h2 id="words-heading" ref={headingRef} tabIndex={-1}>{phaseTitles[phase]}</h2>
            <img className="words-picture" src={currentWord.image} alt="" width="300" height="300" />
            <p className="words-name">{currentWord.word}</p>
            <div className="words-actions">
              <button type="button" aria-label={`Ouvir ${currentWord.word}`} onClick={() => speak(currentWord.audioText)}><SpeakerIcon />Ouvir palavra</button>
              <button className="action-primary" type="button" onClick={() => {
                progress.recordActivityExplored(moduleId, currentWord.id)
                setPhase('build')
              }}>Continuar</button>
            </div>
          </>
        )}

        {phase === 'build' && (
          <>
            <h2 id="words-heading" ref={headingRef} tabIndex={-1}>{phaseTitles[phase]}</h2>
            <img className="words-picture words-picture--small" src={currentWord.image} alt={`Pictograma de ${currentWord.word.toLocaleLowerCase('pt-BR')}`} width="300" height="300" />
            <p className="words-sentence-prompt">Qual palavra combina com esta imagem?</p>
            <div className="words-options" aria-label="Palavras para reconhecer">
              {choices.map(option => <button key={option.id} type="button"
                className={`words-option${recognitionSelection === option.id ? ' words-option--selected' : ''}`}
                aria-pressed={recognitionSelection === option.id}
                onClick={() => recognize(option.id)}>{option.word}</button>)}
            </div>
            <div className="words-actions">
              <button type="button" aria-label={`Ouvir ${currentWord.word}`} onClick={() => speak(currentWord.audioText)}><SpeakerIcon />Ouvir palavra</button>
            </div>

            <div className="words-feedback" role="status" aria-live="polite">
              {buildFeedback ? <p>{buildFeedback}</p> : null}
            </div>

            {buildSucceeded && (
              <div className="words-actions">
                <button type="button" onClick={() => speak(currentWord.audioText)}><SpeakerIcon />Ouvir palavra</button>
                <button className="action-primary" type="button" onClick={continueToSentence}>Continuar</button>
              </div>
            )}
          </>
        )}

        {phase === 'sentence' && (
          <>
            <h2 id="words-heading" ref={headingRef} tabIndex={-1}>{phaseTitles[phase]}</h2>
            <img className="words-picture words-picture--small" src={currentWord.image} alt="" width="300" height="300" />
            <p className="words-name">{currentWord.word}</p>
            <p className="words-sentence-prompt">{currentWord.sentencePrompt}</p>
            <div className="words-options" aria-label="Opções para completar a frase">
              {currentWord.sentenceOptions.map(option => (
                <button
                  key={`${currentWord.id}-${option}`}
                  type="button"
                  className={`words-option${sentenceSelection === option ? ' words-option--selected' : ''}`}
                  aria-pressed={sentenceSelection === option}
                  onClick={() => {
                    setSentenceSelection(option)
                    setSentenceFeedback('')
                    setSentenceSucceeded(false)
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="words-actions">
              <button className="action-primary" type="button" onClick={checkSentenceAnswer} disabled={!sentenceSelection}>Conferir</button>
              {sentenceSucceeded && (
                <button type="button" aria-label="Ouvir frase correta" onClick={() => speak(currentWord.sentenceText)}><SpeakerIcon />Ouvir frase</button>
              )}
            </div>

            <div className="words-feedback" role="status" aria-live="polite">
              {sentenceFeedback ? <p>{sentenceFeedback}</p> : null}
              {sentenceSucceeded && <p>{currentWord.sentenceText}</p>}
            </div>

            {sentenceSucceeded && (
              <div className="words-actions">
                {qaWordId ? (
                  <button type="button" onClick={() => {
                    setQaWordId('')
                    resetActivity()
                  }}>Voltar à rotação</button>
                ) : (
                  <button type="button" onClick={nextWord}>Próxima palavra</button>
                )}
              </div>
            )}
          </>
        )}

        <p className="words-audio-feedback" role="status" aria-live="polite">{audioMessage}</p>
        <p role="status" aria-live="polite">{progress.message}</p>
      </section>

    </main>
  )
}
