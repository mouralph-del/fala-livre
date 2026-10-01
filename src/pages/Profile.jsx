import { useEffect, useState, useSyncExternalStore } from 'react'
import { homeCharacters } from '../data/homeCharacters'
import { getPreferences, subscribePreferences, updatePreference, resetPreferences } from '../utils/preferences'
import { falar, stopSpeaking, getCommunicationVoices, subscribeVoices, voiceIdentifier } from '../utils/speech'
import './Profile.css'

export default function Profile() {
  const preferences = useSyncExternalStore(subscribePreferences, getPreferences)
  const [voices, setVoices] = useState(getCommunicationVoices)
  const [message, setMessage] = useState('')
  const [audioMessage, setAudioMessage] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeVoices(() => setVoices(getCommunicationVoices()))
    return () => { unsubscribe(); stopSpeaking() }
  }, [])

  function change(key, value) {
    const saved = updatePreference(key, value)
    setMessage(saved ? 'Preferência salva.' : 'Preferência aplicada nesta sessão. Não foi possível salvar neste navegador.')
    if (key === 'voice') { stopSpeaking(); setAudioMessage('') }
  }

  function restore() {
    if (!window.confirm('Restaurar todas as configurações padrão do Fala Livre?')) return
    stopSpeaking()
    setAudioMessage('')
    setMessage(resetPreferences() ? 'Configurações padrão restauradas.' : 'Padrões aplicados nesta sessão. Não foi possível salvar neste navegador.')
  }

  const selectedVoiceAvailable = voices.some(voice => voiceIdentifier(voice) === preferences.voice || voice.name === preferences.voice)

  return (
    <main id="conteudo" className="profile-page" tabIndex={-1}>
      <a className="profile-back" href="#/">← Início</a>
      <div className="profile-intro"><h1>Meu perfil</h1><p>Deixe o Fala Livre do seu jeito.</p></div>
      <div className="profile-sections">
        <section className="profile-section profile-characters" aria-labelledby="characters-title">
          <h2 id="characters-title">PERSONAGENS DA HOME</h2>
          <p>Escolha quem aparece em cada atividade.</p>
          <div className="profile-character-grid">
            {[['learnCharacter', 'APRENDER'], ['gameCharacter', 'JOGAR']].map(([key, title]) => (
              <fieldset key={key}>
                <legend>{title}</legend>
                <img className="profile-character-preview" src={homeCharacters[key][preferences[key]]} alt="" width="120" height="120" />
                <div className="profile-options">
                  {[['girl', 'Menina'], ['boy', 'Menino']].map(([value, label]) => (
                    <label key={value} className="profile-option">
                      <input type="radio" name={key} value={value} checked={preferences[key] === value} disabled={!homeCharacters[key][value]} onChange={() => change(key, value)} />
                      <span>{label}{!homeCharacters[key][value] && <small>Indisponível</small>}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <p className="profile-note">As outras opções estarão disponíveis quando houver personagens equivalentes para cada atividade.</p>
        </section>
        <section className="profile-section" aria-labelledby="voice-title">
          <h2 id="voice-title">VOZ DA COMUNICAÇÃO</h2>
          <p>Escolha a voz que você prefere ouvir.</p>
          <fieldset className="profile-voice-options">
            <legend className="profile-field-label">Voz para palavras e frases</legend>
            <label className="profile-option"><input type="radio" name="voice" checked={!preferences.voice} onChange={() => change('voice', null)} /><span>Seleção automática</span></label>
            {voices.map(voice => <label className="profile-option" key={voiceIdentifier(voice)}>
              <input type="radio" name="voice" checked={voiceIdentifier(voice) === preferences.voice || voice.name === preferences.voice} onChange={() => change('voice', voiceIdentifier(voice))} />
              <span>{voice.name}<small>{voice.lang}</small></span>
            </label>)}
          </fieldset>
          {!voices.length && <p className="profile-note">Nenhuma voz em português foi disponibilizada pelo navegador. A seleção automática será usada quando possível.</p>}
          {preferences.voice && !selectedVoiceAvailable && <p className="profile-note">A voz salva não está disponível nesta lista. Uma voz compatível será usada automaticamente se ela não estiver disponível no dispositivo.</p>}
          <button className="profile-action" type="button" onClick={() => { setAudioMessage(''); falar('Olá! Eu sou a voz do Fala Livre.', setAudioMessage) }}>Ouvir exemplo</button>
          <p className="profile-feedback" role="status">{audioMessage}</p>
        </section>
        <section className="profile-section profile-accessibility" aria-labelledby="accessibility-title">
          <h2 id="accessibility-title">ACESSIBILIDADE</h2>
          <fieldset>
            <legend>Tamanho dos elementos</legend>
            <div className="profile-options">
              {[['normal', 'Normal'], ['large', 'Grande']].map(([value, label]) => <label className="profile-option" key={value}>
                <input type="radio" name="elementSize" checked={preferences.elementSize === value} onChange={() => change('elementSize', value)} /><span>{label}</span>
              </label>)}
            </div>
          </fieldset>
          <fieldset><legend>Movimentos</legend><label className="profile-option">
            <input type="checkbox" checked={preferences.reduceMotion} onChange={event => change('reduceMotion', event.target.checked)} /><span>Reduzir movimentos</span>
          </label></fieldset>
        </section>
      </div>
      <div className="profile-restore"><button className="profile-action" type="button" onClick={restore}>Restaurar configurações padrão</button><p className="profile-feedback" role="status">{message}</p></div>
    </main>
  )
}
