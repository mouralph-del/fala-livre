import './GameProgressFeedback.css'

export function GameLevelStatus({ progress, levelId }) {
  const { status } = progress.availability(levelId)
  return status !== 'available' && <small className="game-level-status">{status === 'unknown' ? 'Indisponível no momento' : 'Conclua o nível anterior'}</small>
}

export default function GameProgressFeedback({ progress, firstLevel, onChange }) {
  return <div className="game-progress-feedback">
    <div role="status" aria-live="polite" aria-atomic="true">
      {progress.blockedMessage && <p>{progress.blockedMessage}</p>}
      {progress.message && <p>{progress.message}</p>}
    </div>
    {progress.blockedMessage && <button type="button" onClick={() => onChange(firstLevel)}>Jogar Nível 1</button>}
    {!progress.activeAvailable && <a href="#/jogar">Voltar aos jogos</a>}
  </div>
}
