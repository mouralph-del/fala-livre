import { useEffect, useState } from 'react'
import { learningWords } from '../data/learningWords'
import { SpeakerIcon } from './CommunicationCard'
import { falar, stopSpeaking } from '../utils/speech'

export default function WritingPractice({ notebook = false, wordId = 'casa' }) {
  const word = learningWords.find(item => item.id === wordId) ?? learningWords[0]
  const [message, setMessage] = useState('')

  useEffect(() => () => stopSpeaking(), [])

  return <section className="writing-practice" aria-label="Palavra para praticar">
    <img src={word.image} alt="" width="300" height="300" />
    <div>
      <p>{notebook ? 'Vamos praticar:' : 'Vamos escrever:'}</p>
      <h2>{word.word}</h2>
      <button type="button" onClick={() => { setMessage(''); falar(word.audioText, setMessage) }}><SpeakerIcon />Ouvir palavra</button>
      <p role="status">{message}</p>

    </div>
  </section>
}
