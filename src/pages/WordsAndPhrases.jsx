import { useEffect, useRef, useState } from 'react'
import { SpeakerIcon } from '../components/CommunicationCard'
import { pictogramCredit } from '../data/communicationOptions'
import { learningWords } from '../data/learningWords'
import { falar, stopSpeaking } from '../utils/speech'
import './WordsAndPhrases.css'

const levels = [
  { id: 'know', label: 'Nível 1', title: 'Conhecer' },
  { id: 'build', label: 'Nível 2', title: 'Montar' },
  { id: 'sentence', label: 'Nível 3', title: 'Usar na frase' },
]

export default function WordsAndPhrases() {
  const [selectedLevel, setSelectedLevel] = useState('know')
  const [knowIndex, setKnowIndex] = useState(0)
  const [buildIndex, setBuildIndex] = useState(0)
  const [buildSelection, setBuildSelection] = useState([])
  const [buildFeedback, setBuildFeedback] = useState('')
  const [sentenceIndex, setSentenceIndex] = useState(0)
  const [sentenceSelection, setSentenceSelection] = useState('')
  const [sentenceFeedback, setSentenceFeedback] = useState('')
  const [audioMessage, setAudioMessage] = useState('')
  const headingRef = useRef(null)

  const currentKnowWord = learningWords[knowIndex]
  const currentBuildWord = learningWords[buildIndex]
  const currentSentence = learningWords[sentenceIndex]
  const buildSlots = currentBuildWord.letters.length
  const buildLetters = currentBuildWord.scrambleOrder.map(index => ({
    id: `${currentBuildWord.id}-letter-${index}-${currentBuildWord.letters[index]}`,
    value: currentBuildWord.letters[index],
  }))
  const buildMap = Object.fromEntries(buildLetters.map(item => [item.id, item.value]))
  const buildWord = buildSelection.map(id => buildMap[id]).join('')
  const buildCompleted = buildSelection.length === buildSlots
  const buildCorrect = buildCompleted && buildWord === currentBuildWord.word

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [selectedLevel, knowIndex, buildIndex, sentenceIndex])

  useEffect(() => () => stopSpeaking(), [])

  function speak(text) {
    stopSpeaking()
    setAudioMessage('')
    falar(text, setAudioMessage)
  }

  function resetAllState(levelId) {
    stopSpeaking()
    setAudioMessage('')
    setBuildFeedback('')
    setSentenceFeedback('')
    setSentenceSelection('')
    setBuildSelection([])
    setSelectedLevel(levelId)
    setKnowIndex(0)
    setBuildIndex(0)
    setSentenceIndex(0)
  }

  function addBuildLetter(letterId) {
    if (buildSelection.includes(letterId) || buildSelection.length >= buildSlots) return
    setBuildSelection(current => [...current, letterId])
  }

  function removeBuildLetter(position) {
    setBuildSelection(current => current.filter((_, index) => index !== position))
  }

  function checkBuildWord() {
    const assembled = buildSelection.map(id => buildMap[id]).join('')
    if (assembled === currentBuildWord.word) {
      setBuildFeedback(`Muito bem! Você montou a palavra ${currentBuildWord.word}.`)
      return
    }
    setBuildFeedback('Quase! Tente novamente.')
  }

  function nextBuildWord() {
    setBuildFeedback('')
    setBuildSelection([])
    if (buildIndex < learningWords.length - 1) {
      setBuildIndex(index => index + 1)
      return
    }
    setSelectedLevel('sentence')
    setBuildIndex(0)
    setSentenceIndex(0)
    setSentenceSelection('')
    setSentenceFeedback('')
  }

  function nextSentence() {
    setSentenceSelection('')
    setSentenceFeedback('')
    if (sentenceIndex < learningWords.length - 1) {
      setSentenceIndex(index => index + 1)
      return
    }
    setSentenceIndex(learningWords.length - 1)
  }

  function checkSentenceAnswer() {
    if (!sentenceSelection) {
      setSentenceFeedback('Selecione uma opção antes de conferir.')
      return
    }
    if (sentenceSelection === currentSentence.sentenceAnswer) {
      setSentenceFeedback(`Muito bem! ${currentSentence.sentenceText}`)
      return
    }
    setSentenceFeedback('Quase! Tente novamente.')
  }

  return (
    <main id="conteudo" className="words-page" tabIndex={-1}>
      <a className="words-back" href="#/aprender">← Aprender</a>
      <header className="words-intro"><h1>Palavras e frases</h1><p>Aprenda palavras e use-as nas frases.</p></header>

      <div className="words-level-selector" aria-label="Seleção de nível">
        {levels.map(level => (
          <button
            key={level.id}
            type="button"
            className={`words-level-button${selectedLevel === level.id ? ' words-level-button--active' : ''}`}
            aria-pressed={selectedLevel === level.id}
            onClick={() => resetAllState(level.id)}
          >
            <span>{level.label}</span>
            <strong>{level.title}</strong>
          </button>
        ))}
      </div>

      <section className="words-activity" aria-labelledby="words-heading">
        {selectedLevel === 'know' && (
          <>
            <h2 id="words-heading" ref={headingRef} tabIndex={-1}>Nível 1 · Conhecer</h2>
            <p className="words-counter">Palavra {knowIndex + 1} de {learningWords.length}</p>
            <img className="words-picture" src={currentKnowWord.image} alt="" width="300" height="300" />
            <p className="words-name">{currentKnowWord.word}</p>
            <div className="words-actions">
              <button type="button" onClick={() => speak(currentKnowWord.audioText)}><SpeakerIcon />Ouvir palavra</button>
              <button type="button" onClick={() => setKnowIndex(index => Math.max(0, index - 1))} disabled={knowIndex === 0}>Anterior</button>
              {knowIndex < learningWords.length - 1 ? (
                <button type="button" onClick={() => setKnowIndex(index => index + 1)}>Próxima</button>
              ) : (
                <button type="button" onClick={() => setSelectedLevel('build')}>Concluir nível</button>
              )}
            </div>
          </>
        )}

        {selectedLevel === 'build' && (
          <>
            <h2 id="words-heading" ref={headingRef} tabIndex={-1}>Nível 2 · Montar</h2>
            <p className="words-counter">Palavra {buildIndex + 1} de {learningWords.length}</p>
            <img className="words-picture words-picture--small" src={currentBuildWord.image} alt="" width="300" height="300" />
            <div className="words-slots" aria-label={`Montando a palavra ${currentBuildWord.word}`}>
              {Array.from({ length: buildSlots }, (_, index) => (
                <button
                  key={`slot-${currentBuildWord.id}-${index}`}
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
              <button type="button" onClick={() => speak(currentBuildWord.audioText)}><SpeakerIcon />Ouvir palavra</button>
              <button type="button" onClick={() => setBuildSelection([])} disabled={!buildSelection.length}>Reorganizar</button>
              <button type="button" onClick={checkBuildWord} disabled={!buildCompleted}>Conferir</button>
            </div>

            <div className="words-feedback" role="status" aria-live="polite">
              {buildFeedback ? <p>{buildFeedback}</p> : null}
            </div>

            {buildCorrect && (
              <div className="words-actions">
                <button type="button" onClick={() => speak(currentBuildWord.audioText)}><SpeakerIcon />Ouvir palavra</button>
                {buildIndex < learningWords.length - 1 ? (
                  <button type="button" onClick={nextBuildWord}>Próxima palavra</button>
                ) : (
                  <button type="button" onClick={() => setSelectedLevel('sentence')}>Ir para frases</button>
                )}
              </div>
            )}
          </>
        )}

        {selectedLevel === 'sentence' && (
          <>
            <h2 id="words-heading" ref={headingRef} tabIndex={-1}>Nível 3 · Usar na frase</h2>
            <p className="words-counter">Atividade {sentenceIndex + 1} de {learningWords.length}</p>
            <p className="words-sentence-prompt">{currentSentence.sentencePrompt}</p>
            <div className="words-options" aria-label="Opções para completar a frase">
              {currentSentence.sentenceOptions.map(option => (
                <button
                  key={`${currentSentence.id}-${option}`}
                  type="button"
                  className={`words-option${sentenceSelection === option ? ' words-option--selected' : ''}`}
                  aria-pressed={sentenceSelection === option}
                  onClick={() => setSentenceSelection(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="words-actions">
              <button type="button" onClick={checkSentenceAnswer} disabled={!sentenceSelection}>Conferir</button>
              {sentenceSelection === currentSentence.sentenceAnswer && (
                <button type="button" onClick={() => speak(currentSentence.sentenceText)}><SpeakerIcon />Ouvir frase</button>
              )}
            </div>

            <div className="words-feedback" role="status" aria-live="polite">
              {sentenceFeedback ? <p>{sentenceFeedback}</p> : null}
            </div>

            {sentenceSelection === currentSentence.sentenceAnswer && sentenceFeedback.startsWith('Muito bem!') && (
              <div className="words-actions">
                {sentenceIndex < learningWords.length - 1 ? (
                  <button type="button" onClick={nextSentence}>Próxima frase</button>
                ) : (
                  <button type="button" onClick={() => resetAllState('know')}>Concluir nível</button>
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
