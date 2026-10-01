import { useEffect, useRef, useState } from 'react'
import { SpeakerIcon } from '../components/CommunicationCard'
import { pictogramCredit } from '../data/communicationOptions'
import { learningWords } from '../data/learningWords'
import { getCurrentTheme } from '../utils/contentRotation'
import { advanceModuleRotation, getModuleRotation } from '../utils/contentRotationStorage'
import { falar, stopSpeaking } from '../utils/speech'
import './WordsAndPhrases.css'

const moduleId = 'wordsAndPhrases'
const officialWordIds = ['casa', 'cama', 'sofa', 'gato', 'cachorro', 'peixe', 'bola', 'blocos', 'carrinho', 'lapis', 'estojo', 'mochila']
const phaseTitles = { know: 'Conhecer', build: 'Montar', sentence: 'Usar na frase' }

export default function WordsAndPhrases() {
  const [rotation, setRotation] = useState(() => getModuleRotation(moduleId, officialWordIds))
  const [qaWordId, setQaWordId] = useState('')
  const [phase, setPhase] = useState('know')
  const [buildSelection, setBuildSelection] = useState([])
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
  const buildSlots = currentWord.letters.length
  const buildLetters = currentWord.scrambleOrder.map(index => ({
    id: `${currentWord.id}-letter-${index}`,
    value: currentWord.letters[index],
  }))
  const buildMap = Object.fromEntries(buildLetters.map(item => [item.id, item.value]))

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
    setBuildSelection([])
    setBuildFeedback('')
    setBuildSucceeded(false)
    setSentenceFeedback('')
    setSentenceSelection('')
    setSentenceSucceeded(false)
  }

  function addBuildLetter(letterId) {
    if (buildSelection.includes(letterId) || buildSelection.length >= buildSlots) return
    setBuildSelection(current => [...current, letterId])
    setBuildFeedback('')
    setBuildSucceeded(false)
  }

  function removeBuildLetter(position) {
    setBuildSelection(current => current.filter((_, index) => index !== position))
    setBuildFeedback('')
    setBuildSucceeded(false)
  }

  function clearBuildSelection() {
    setBuildSelection([])
    setBuildFeedback('')
    setBuildSucceeded(false)
  }

  function checkBuildWord() {
    const assembled = buildSelection.map(id => buildMap[id]).join('')
    if (assembled === currentWord.word) {
      setBuildFeedback(`Muito bem! Você montou ${currentWord.word}.`)
      setBuildSucceeded(true)
      return
    }
    setBuildFeedback('Quase! Confira a palavra e tente novamente.')
    setBuildSucceeded(false)
  }

  function continueToSentence() {
    setPhase('sentence')
    setSentenceSelection('')
    setSentenceFeedback('')
    setSentenceSucceeded(false)
  }

  function nextWord() {
    if (!sentenceSucceeded || qaWordId || advanceLocked.current) return
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

      {import.meta.env.DEV && (
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
              <button type="button" onClick={() => setPhase('build')}>Continuar</button>
            </div>
          </>
        )}

        {phase === 'build' && (
          <>
            <h2 id="words-heading" ref={headingRef} tabIndex={-1}>{phaseTitles[phase]}</h2>
            <img className="words-picture words-picture--small" src={currentWord.image} alt="" width="300" height="300" />
            <p className="words-name">{currentWord.word}</p>
            <div className="words-slots" aria-label={`Montando a palavra ${currentWord.word}`}>
              {Array.from({ length: buildSlots }, (_, index) => (
                <button
                  key={`slot-${currentWord.id}-${index}`}
                  type="button"
                  className="words-slot"
                  onClick={() => removeBuildLetter(index)}
                  aria-label={buildSelection[index] ? `Remover letra ${buildMap[buildSelection[index]]} da posição ${index + 1}` : `Posição ${index + 1} vazia`}
                >
                  {buildSelection[index] ? buildMap[buildSelection[index]] : '_'}
                </button>
              ))}
            </div>

            <p className="words-hint">Toque nas letras para montar a palavra.</p>

            <div className="words-letters">
              {buildLetters.map(letter => (
                <button
                  key={letter.id}
                  type="button"
                  className="words-letter-button"
                  aria-label={`Selecionar letra ${letter.value}`}
                  onClick={() => addBuildLetter(letter.id)}
                  disabled={buildSelection.includes(letter.id) || buildSelection.length >= buildSlots}
                >
                  {letter.value}
                </button>
              ))}
            </div>

            <div className="words-actions">
              <button type="button" aria-label={`Ouvir ${currentWord.word}`} onClick={() => speak(currentWord.audioText)}><SpeakerIcon />Ouvir palavra</button>
              <button type="button" onClick={clearBuildSelection} disabled={!buildSelection.length}>Reorganizar</button>
              <button type="button" onClick={checkBuildWord} disabled={buildSelection.length !== buildSlots}>Conferir</button>
            </div>

            <div className="words-feedback" role="status" aria-live="polite">
              {buildFeedback ? <p>{buildFeedback}</p> : null}
            </div>

            {buildSucceeded && (
              <div className="words-actions">
                <button type="button" onClick={() => speak(currentWord.audioText)}><SpeakerIcon />Ouvir palavra</button>
                <button type="button" onClick={continueToSentence}>Continuar</button>
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
              <button type="button" onClick={checkSentenceAnswer} disabled={!sentenceSelection}>Conferir</button>
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
      </section>

      <footer className="words-credit">Pictogramas: {pictogramCredit.author} · <a href={pictogramCredit.source}>ARASAAC</a> · {pictogramCredit.owner} · <a href={pictogramCredit.licenseUrl}>{pictogramCredit.license}</a></footer>
    </main>
  )
}
