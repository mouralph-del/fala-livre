import { useEffect, useRef, useState } from 'react'
import DrawingCanvas from '../components/DrawingCanvas'
import WritingPractice from '../components/WritingPractice'
import { learningWords, learningWordIds } from '../data/learningWords'
import EducationalKeyboard from './EducationalKeyboard'
import { getCurrentTheme } from '../utils/contentRotation'
import { advanceModuleRotation, getModuleRotation } from '../utils/contentRotationStorage'
import './Writing.css'
import { useLearningProgress } from '../hooks/useLearningProgress'

export default function Writing({ progressService, qaControls = false } = {}) {
  const [rotation, setRotation] = useState(() => getModuleRotation('writing', learningWordIds))
  const [phase, setPhase] = useState('typing')
  const [completedWordId, setCompletedWordId] = useState(null)
  const [qaWordId, setQaWordId] = useState('')
  const progress = useLearningProgress(!qaWordId, progressService)
  const advanceLock = useRef(false)
  const typedWord = useRef(null)
  const previousPhase = useRef(phase)
  useEffect(() => {
    if (previousPhase.current === phase) return
    previousPhase.current = phase
    const panel = document.getElementById(phase === 'typing' ? 'writing-typing-panel' : 'writing-notebook-panel')
    const target = phase === 'notebook' ? panel?.querySelector('canvas') : panel
    target?.focus({ preventScroll: true })
    target?.scrollIntoView({ block: phase === 'notebook' ? 'center' : 'start' })
  }, [phase])
  useEffect(() => { advanceLock.current = false; typedWord.current = null }, [rotation, qaWordId])
  const currentWordId = qaWordId || getCurrentTheme(rotation)
  const currentWord = learningWords.find(word => word.id === currentWordId) ?? learningWords[0]
  const canFinishPractice = completedWordId === currentWord.id

  function completePractice(event) {
    if (event.detail > 1 || advanceLock.current || typedWord.current !== currentWord.id) return
    advanceLock.current = true
    setCompletedWordId(null)
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
    </header>

    {import.meta.env.DEV && qaControls && (
      <label className="writing-qa-selector">
        Palavra para QA
        <select value={qaWordId} onChange={event => { setQaWordId(event.target.value); setCompletedWordId(null); setPhase('typing') }}>
          <option value="">Rotação normal</option>
          {learningWords.map(word => <option key={word.id} value={word.id}>{word.word}</option>)}
        </select>
      </label>
    )}

    <div className="writing-mode-selector" role="group" aria-label="Modo de escrita">
      <button id="writing-typing-mode" type="button" aria-pressed={phase === 'typing'} aria-controls="writing-typing-panel" onClick={() => setPhase('typing')}>
        <strong>Teclado</strong><span>Use as letras para escrever a palavra.</span>
      </button>
      <button id="writing-notebook-mode" type="button" aria-pressed={phase === 'notebook'} aria-controls="writing-notebook-panel" onClick={() => setPhase('notebook')}>
        <strong>Caderno</strong><span>Escreva ou desenhe do seu jeito.</span>
      </button>
    </div>

    <div id="writing-typing-panel" className="writing-mode-panel" role="region" aria-labelledby="writing-typing-mode" tabIndex={-1} hidden={phase !== 'typing'}>
      <EducationalKeyboard key={currentWord.id} embedded targetWordId={currentWord.id} onComplete={id => {
        if (id !== currentWord.id || typedWord.current === id) return
        typedWord.current = id
        setCompletedWordId(id)
        progress.recordActivityPerformed('writing', id, ['typing'])
      }} onAdvance={() => setPhase('notebook')} />
    </div>
      <div id="writing-notebook-panel" className="writing-mode-panel writing-notebook-flow" role="region" aria-labelledby="writing-notebook-mode" tabIndex={-1} hidden={phase !== 'notebook'}>
        <h2 id="writing-notebook-title">Praticar no caderno</h2>
        <WritingPractice key={currentWord.id} notebook wordId={currentWord.id} />
        <section className="writing-work" aria-label="Caderno de prática">
          <DrawingCanvas key={currentWord.id} showKeyboardLink={false} />
          <div className="writing-actions">
            <button className="action-primary" type="button" disabled={!canFinishPractice} onClick={completePractice}>Concluir prática</button>
          </div>
          {!canFinishPractice && <p>Para concluir a prática desta palavra, escreva-a e confira no Teclado.</p>}
        </section>
      </div>
    <p role="status" aria-live="polite">{progress.message}</p>
  </main>
}
