import { useEffect, useRef, useState } from 'react'
import DrawingCanvas from '../components/DrawingCanvas'
import WritingPractice from '../components/WritingPractice'
import { learningWords, learningWordIds } from '../data/learningWords'
import EducationalKeyboard from './EducationalKeyboard'
import { getCurrentTheme } from '../utils/contentRotation'
import { advanceModuleRotation, getModuleRotation } from '../utils/contentRotationStorage'
import './Writing.css'
import { useLearningProgress } from '../hooks/useLearningProgress'

export default function Writing({ progressService } = {}) {
  const [rotation, setRotation] = useState(() => getModuleRotation('writing', learningWordIds))
  const [phase, setPhase] = useState('typing')
  const [qaWordId, setQaWordId] = useState('')
  const progress = useLearningProgress(!qaWordId, progressService)
  const advanceLock = useRef(false)
  const typedWord = useRef(null)
  useEffect(() => { advanceLock.current = false; typedWord.current = null }, [rotation, qaWordId])
  const currentWordId = qaWordId || getCurrentTheme(rotation)
  const currentWord = learningWords.find(word => word.id === currentWordId) ?? learningWords[0]

  function completePractice(event) {
    if (event.detail > 1 || advanceLock.current) return
    advanceLock.current = true
    if (qaWordId) {
      setQaWordId('')
      setPhase('typing')
      return
    }

    progress.recordActivityPerformed('writing', currentWord.id, ['notebook', 'complete'])
    const nextRotation = advanceModuleRotation('writing', learningWordIds)
    if (!nextRotation) { advanceLock.current = false; return }
    setRotation(nextRotation)
    setPhase('typing')
  }

  return <main id="conteudo" className="writing-page" tabIndex={-1}>
    <a className="writing-back" href="#/aprender">← Aprender</a>
    <header className="writing-intro">
      <h1>Escrever</h1>
      <p>{phase === 'typing' ? 'Digite a palavra e depois pratique no caderno.' : 'Pratique a palavra no caderno.'}</p>
    </header>

    {import.meta.env.DEV && (
      <label className="writing-qa-selector">
        Palavra para QA
        <select value={qaWordId} onChange={event => { setQaWordId(event.target.value); setPhase('typing') }}>
          <option value="">Rotação normal</option>
          {learningWords.map(word => <option key={word.id} value={word.id}>{word.word}</option>)}
        </select>
      </label>
    )}

    <p className="writing-phase-label" aria-live="polite">{phase === 'typing' ? 'Digitar' : 'Praticar no caderno'}</p>

    {phase === 'typing' ? (
      <EducationalKeyboard key={currentWord.id} embedded targetWordId={currentWord.id} onComplete={id => {
        if (id !== currentWord.id || typedWord.current === id) return
        typedWord.current = id
        progress.recordActivityPerformed('writing', id, ['typing'])
      }} onAdvance={() => setPhase('notebook')} />
    ) : (
      <div className="writing-notebook-flow">
        <h2 id="writing-notebook-title">Praticar no caderno</h2>
        <WritingPractice key={currentWord.id} notebook wordId={currentWord.id} />
        <section className="writing-work" aria-label="Caderno de prática">
          <DrawingCanvas key={currentWord.id} showKeyboardLink={false} />
          <div className="writing-actions">
            <button className="action-primary" type="button" onClick={completePractice}>Concluir prática</button>
          </div>
        </section>
      </div>
    )}
    <p role="status" aria-live="polite">{progress.message}</p>
  </main>
}
