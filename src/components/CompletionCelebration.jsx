import { useEffect, useState } from 'react'
import './CompletionCelebration.css'

export default function CompletionCelebration() {
  const [completion, setCompletion] = useState(null)
  useEffect(() => {
    const show = event => setCompletion(event.detail)
    const dismiss = () => setCompletion(null)
    window.addEventListener('falaLivre:completion', show)
    window.addEventListener('hashchange', dismiss)
    return () => {
      window.removeEventListener('falaLivre:completion', show)
      window.removeEventListener('hashchange', dismiss)
    }
  }, [])
  return completion && <aside className="completion-celebration" aria-label="Atividade concluída">
    <div role="status"><span className="completion-star" aria-hidden="true">★</span><strong>Parabéns!</strong><p>Você concluiu a atividade!</p></div>
    <button type="button" onClick={() => setCompletion(null)}>Continuar</button>
  </aside>
}
