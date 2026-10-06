import { useState } from 'react'

export default function GameTimeSettings({ preferences, change }) {
  const [draft, setDraft] = useState(String(preferences.customGameMinutes))
  const [error, setError] = useState('')
  function save(event) {
    event.preventDefault()
    const minutes = Number(draft)
    if (!draft.trim() || !Number.isSafeInteger(minutes) || minutes < 1 || minutes > 1440) {
      setError('Informe um número inteiro de minutos entre 1 e 1440.')
      return
    }
    change('customGameMinutes', minutes)
    setError('')
  }
  return <section className="profile-section profile-game-time" aria-labelledby="game-time-title">
    <h2 id="game-time-title">Tempo de jogos</h2>
    <p>Defina quanto tempo os jogos podem ser usados por dia neste navegador. A área Aprender continua disponível quando o tempo terminar.</p>
    <fieldset><legend>Limite diário</legend><div className="profile-options">
      {[['unlimited', 'Sem limite'], ['15', '15 minutos'], ['30', '30 minutos'], ['45', '45 minutos'], ['60', '1 hora'], ['custom', 'Personalizado']].map(([value, label]) => <label className="profile-option" key={value}>
        <input type="radio" name="gameTimeLimit" value={value} checked={preferences.gameTimeLimit === value} onChange={() => { setDraft(String(preferences.customGameMinutes)); setError(''); change('gameTimeLimit', value) }} /><span>{label}</span>
      </label>)}
    </div></fieldset>
    {preferences.gameTimeLimit === 'custom' && <form onSubmit={save} noValidate>
      <label className="profile-field-label" htmlFor="game-time-minutes">Duração diária em minutos (1 a 1440)</label>
      <input id="game-time-minutes" className="profile-time-input" type="number" inputMode="numeric" min="1" max="1440" step="1" value={draft} aria-invalid={!!error} aria-describedby="game-time-current game-time-error" onChange={event => setDraft(event.target.value)} />
      <button className="profile-action" type="submit">Salvar duração</button>
      <p id="game-time-current">Limite ativo: {preferences.customGameMinutes} minutos por dia.</p>
      <p id="game-time-error" role="alert">{error}</p>
    </form>}
  </section>
}
