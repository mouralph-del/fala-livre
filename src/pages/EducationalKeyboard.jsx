import { useCallback, useEffect, useRef, useState } from 'react'
import { alphabet } from '../data/alphabet'
import { learningWords } from '../data/learningWords'
import WritingPractice from '../components/WritingPractice'
import { SpeakerIcon } from '../components/CommunicationCard'
import { falar, stopSpeaking } from '../utils/speech'
import './Writing.css'

export default function EducationalKeyboard({
  mode = 'practice',
  targetWordId = 'casa',
  embedded = false,
  onComplete,
  onAdvance,
  advanceLabel = 'Praticar no caderno',
}) {
  const target = learningWords.find(item => item.id === targetWordId) ?? learningWords[0]
  // Accented forms are writing aids, not additional letters of the alphabet.
  const accentedLetters = [...new Set(target.letters.filter(letter => /^[ÁÉÍÓÚÀÂÊÔÜÇ]$/.test(letter)))]
  const limit = mode === 'practice' ? target.letters.length : 12
  const [letters, setLetters] = useState([])
  const [message, setMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [finishMessage, setFinishMessage] = useState('')
  const headingRef = useRef(null)

  const full = letters.length === limit
  const assembled = letters.join('')
  const correct = mode === 'practice' && assembled === target.word && finishMessage === `Muito bem! Você escreveu ${target.word}.`

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [mode, targetWordId])

  useEffect(() => () => stopSpeaking(), [])

  const speakText = useCallback((text) => {
    setMessage('')
    falar(text, setMessage)
  }, [])

  const insertLetter = useCallback((letter) => {
    setLetters(current => {
      if (current.length >= limit) return current
      const nextLetters = [...current, letter]
      setStatusMessage(`Letra ${letter} adicionada.`)
      setFinishMessage('')
      return nextLetters
    })
  }, [limit])

  const removeLastLetter = useCallback(() => {
    setLetters(current => current.slice(0, -1))
    setFinishMessage('')
    setStatusMessage('Última letra apagada.')
  }, [])

  const clearLetters = useCallback(() => {
    setLetters([])
    setFinishMessage('')
    setStatusMessage('Tudo foi apagado.')
  }, [])

  const confirmWord = useCallback(() => {
    if (mode !== 'practice') return
    if (assembled === target.word) {
      setFinishMessage(`Muito bem! Você escreveu ${target.word}.`)
      onComplete?.(target.id)
      return
    }
    setFinishMessage('Quase! Confira a palavra e tente novamente.')
  }, [assembled, mode, onComplete, target.id, target.word])

  const Page = embedded ? 'section' : 'main'

  return <Page id={embedded ? undefined : 'conteudo'} className={embedded ? 'writing-embedded' : 'writing-page'} tabIndex={embedded ? undefined : -1}>
    {!embedded && <a className="writing-back" href="#/aprender/escrever">← Escrever</a>}
    {!embedded && <header className="writing-intro">
      <h1 ref={headingRef} tabIndex={-1}>{mode === 'explore' ? 'Conhecer as letras' : 'Teclado educativo'}</h1>
      <p>{mode === 'explore' ? 'Explore o alfabeto e ouça cada letra com atenção.' : `Use letras para escrever ${target.word}.`}</p>
    </header>}

    {mode === 'practice' && <WritingPractice wordId={target.id} />}

    <section className="writing-work" aria-labelledby="your-writing">
      {mode === 'practice' ? <h2 id="your-writing">Sua escrita</h2> : <h2 id="your-writing">Exploração do alfabeto</h2>}

      <div className="writing-slot-panel" aria-label={mode === 'practice' ? `Sua escrita da palavra ${target.word}` : 'Letras exploradas'}>
        {mode === 'practice' ? (
          Array.from({ length: target.letters.length }, (_, index) => (
            <span key={`${target.id}-slot-${index}`} className="writing-slot" aria-label={`Posição ${index + 1}: ${letters[index] || 'vazia'}`}>
              {letters[index] || '_'}
            </span>
          ))
        ) : (
          Array.from({ length: Math.min(letters.length || 1, 12) }, (_, index) => (
            <span key={`explore-slot-${index}`} className="writing-slot writing-slot--explore" aria-label={`Letra ${letters[index] || 'vazia'}`}>
              {letters[index] || '_'}
            </span>
          ))
        )}
      </div>

      <div className="writing-controls">
        <button type="button" disabled={!letters.length} onClick={removeLastLetter}>Apagar</button>
        <button type="button" disabled={!letters.length} onClick={clearLetters}>Limpar</button>
        {mode === 'practice' && <button className="action-primary" type="button" disabled={!letters.length} onClick={confirmWord}>Conferir</button>}
        {mode === 'explore' && <button type="button" onClick={() => setFinishMessage('Exploração concluída.')}>Concluir exploração</button>}
      </div>

      <div className={finishMessage ? 'writing-feedback' : undefined} role="status" aria-live="polite">
        {finishMessage ? <p>{finishMessage}</p> : null}
      </div>

      {mode === 'practice' && correct && (
        <div className="writing-actions">
          <button type="button" onClick={() => speakText(target.audioText)}><SpeakerIcon />Ouvir palavra</button>
          <button type="button" onClick={onAdvance}>{advanceLabel}</button>
        </div>
      )}

      <div className="writing-keyboard" aria-label="Letras do alfabeto">
        {alphabet.map(({ letter, audioText }) => (
          <div className="writing-key" key={letter}>
            <button type="button" className="writing-letter" aria-label={`Inserir letra ${letter}`} aria-disabled={mode === 'practice' && full} onClick={() => insertLetter(letter)}>{letter}</button>
            <button type="button" aria-label={`Ouvir letra ${letter}`} onClick={() => speakText(audioText)}><SpeakerIcon /></button>
          </div>
        ))}
      </div>

      {accentedLetters.length > 0 && <>
      <h3>Letras com acento</h3>
      <div className="writing-keyboard" aria-label="Letras com acento">
        {accentedLetters.map(letter => <div className="writing-key" key={letter}>
          <button type="button" className="writing-letter" aria-label={`Inserir letra ${letter}`} aria-disabled={mode === 'practice' && full} onClick={() => insertLetter(letter)}>{letter}</button>
          <button type="button" aria-label={`Ouvir letra ${letter}`} onClick={() => speakText(letter.toLocaleLowerCase('pt-BR'))}><SpeakerIcon /></button>
        </div>)}
      </div>
      </>}

      <p role="status" aria-live="polite" className="writing-audio-message">{message || statusMessage}</p>
    </section>
  </Page>
}
