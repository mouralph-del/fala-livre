import { useEffect, useState } from 'react'
import { learningWords } from '../data/learningWords'
import { SpeakerIcon } from './CommunicationCard'
import { falar, stopSpeaking } from '../utils/speech'

export default function WritingPractice({ notebook = false, wordId = 'casa', hiddenWord = false, hint, onHelp }) {
  const word = learningWords.find(item => item.id === wordId) ?? learningWords[0]
  const [message, setMessage] = useState('')

  useEffect(() => () => stopSpeaking(), [])

  return <section className="writing-practice" aria-label="Palavra para praticar">
    <img src={word.image} alt="Imagem da palavra para praticar. Use Ouvir palavra para escutar." width="300" height="300" />
    <div>
      <p>{notebook ? 'Vamos praticar:' : 'Vamos escrever:'}</p>
      <h2>{hiddenWord ? "Observe a imagem" : word.word}</h2>
      <button type="button" onClick={() => { setMessage(''); falar(word.audioText, setMessage) }}><SpeakerIcon />Ouvir palavra</button>
      {hint && <div className="writing-help"><button type="button" disabled={!hiddenWord || hint.remaining === 0} onClick={onHelp}>Ajuda</button><span role="status">Ajudas restantes: {hint.remaining}</span></div>}
      <p role="status">{message}</p>

    </div>
  </section>
}
