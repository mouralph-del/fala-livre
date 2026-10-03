import { useEffect, useRef, useState } from 'react'
import CommunicationCard, { SpeakerIcon } from '../components/CommunicationCard'
import { myDayEmotions, myDayEmotionIds, emotionVocabulary, emotionNaturalPhrases, restExplanation } from '../data/myDayEmotions'
import { pictogramCredit } from '../data/communicationOptions'
import { constructedSpeech } from '../utils/myDayCommunication'
import { getCurrentTheme } from '../utils/contentRotation'
import { getModuleRotation, advanceModuleRotation } from '../utils/contentRotationStorage'
import { falar, stopSpeaking } from '../utils/speech'
import './MyDayEmotions.css'

const functions = [
  { id: 'explore', title: 'Conhecer emoções', description: 'Explore sentimentos e estados.' },
  { id: 'state', title: 'Como estou', description: 'Escolha o que quer comunicar.' },
  { id: 'need', title: 'O que preciso', description: 'Peça ajuda ou descanso.' },
]
export default function MyDayEmotions() {
  const [view, setView] = useState('menu')
  const [rotation, setRotation] = useState(null)
  const [phrase, setPhrase] = useState([null, null, null])
  const [forms, setForms] = useState({ calmo: 'calmo', confuso: 'confuso' })
  const [status, setStatus] = useState('')
  const [audioStatus, setAudioStatus] = useState('')
  const title = useRef(null)
  const origins = useRef({})
  const origin = useRef(null)
  const advanceLock = useRef(false)
  const removalFocus = useRef(null)
  const concept = rotation ? myDayEmotions.find(item => item.id === getCurrentTheme(rotation)) : null
  const displayId = id => forms[id] || id
  const message = constructedSpeech(phrase, emotionNaturalPhrases, emotionVocabulary)

  useEffect(() => {
    if (view === 'menu') origin.current && origins.current[origin.current]?.focus()
    else title.current?.focus({ preventScroll: true })
    advanceLock.current = false
  }, [view, rotation])
  useEffect(() => () => stopSpeaking(), [])
  useEffect(() => {
    if (!removalFocus.current) return
    const label = removalFocus.current
    removalFocus.current = null
    const control = [...document.querySelectorAll('.emotions-choices button')].find(button => button.getAttribute('aria-label') === `Selecionar ${label}`)
    control?.focus({ preventScroll: true })
  }, [phrase])

  function resetPersonal() {
    stopSpeaking()
    setPhrase([null, null, null])
    setForms({ calmo: 'calmo', confuso: 'confuso' })
    setStatus('')
    setAudioStatus('')
  }
  function open(id) {
    resetPersonal()
    origin.current = id
    if (id === 'explore') setRotation(getModuleRotation('myDayEmotions', myDayEmotionIds))
    setView(id)
  }
  function back() { resetPersonal(); setView('menu') }
  function speak(text) {
    if (!text) return
    setAudioStatus('')
    falar(text, setAudioStatus)
  }
  function advance() {
    if (advanceLock.current) return
    advanceLock.current = true
    stopSpeaking()
    setAudioStatus('')
    const next = advanceModuleRotation('myDayEmotions', myDayEmotionIds)
    if (next) setRotation(next)
    else advanceLock.current = false
  }
  function choose(id) {
    stopSpeaking()
    const position = id === 'eu' ? 0 : ['estou', 'preciso', 'quero'].includes(id) ? 1 : 2
    setPhrase(current => current.map((token, index) => index === position ? id : token))
    setStatus('Cartão adicionado.')
    setAudioStatus('')
  }
  function remove(position) {
    stopSpeaking()
    removalFocus.current = emotionVocabulary[phrase[position]]?.label || null
    setPhrase(current => current.map((token, index) => index === position ? null : token))
    setStatus('Cartão removido.')
    setAudioStatus('')
  }
  function clear() { stopSpeaking(); setPhrase([null, null, null]); setStatus('Mensagem limpa.'); setAudioStatus('') }
  function variant(base, id) {
    stopSpeaking()
    setForms(current => ({ ...current, [base]: id }))
    setPhrase(current => current.map(token => emotionVocabulary[base].variants.includes(token) ? id : token))
    setStatus('Forma da palavra alterada.')
    setAudioStatus('')
  }
  function escape(event) {
    if (event.key !== 'Escape' || !phrase.some(Boolean)) return
    event.preventDefault()
    remove(phrase.findLastIndex(Boolean))
  }
  function variants(base) {
    return <fieldset className="emotions-variants"><legend>Forma da palavra</legend>{emotionVocabulary[base].variants.map(id => <button key={id} type="button" aria-pressed={forms[base] === id} onClick={() => variant(base, id)}>{emotionVocabulary[id].label}</button>)}</fieldset>
  }
  const choices = view === 'state' ? ['eu', 'estou', ...myDayEmotionIds.map(displayId)] : ['eu', 'preciso', 'quero', 'ajuda', 'descansar']
  return <main id="conteudo" className="emotions-page" tabIndex={-1} onKeyDown={escape} data-emotions-view={view}>
    {view === 'menu' ? <a className="emotions-back" href="#/aprender/meu-dia-a-dia">← Meu Dia a Dia</a> : <button className="emotions-back" type="button" onClick={back}>← Emoções</button>}
    <header className="emotions-intro"><h1 ref={title} tabIndex={-1}>{view === 'menu' ? 'Emoções' : functions.find(item => item.id === view).title}</h1><p>{view === 'menu' ? 'Explore sentimentos e estados ou escolha o que quer comunicar.' : view === 'explore' ? 'Sentimentos e estados' : 'Você pode escolher, trocar ou não responder.'}</p></header>
    {view === 'menu' ? <div className="emotions-functions">{functions.map(item => <section key={item.id}><h2>{item.title}</h2><p>{item.description}</p><button type="button" ref={element => { origins.current[item.id] = element }} onClick={() => open(item.id)} aria-label={`Abrir ${item.title}`}>Começar →</button></section>)}</div> : view === 'explore' && concept ? <section className="emotions-explore" key={concept.id} data-concept={concept.id}>
      <img src={concept.image} alt={concept.description} width="300" height="300" />
      <h2>{emotionVocabulary[displayId(concept.id)].label}</h2>
      <p>{concept.explanation}</p>
      <p className="emotions-classification">{concept.classification}</p>
      {concept.variants && variants(concept.id)}
      <div className="emotions-actions"><button type="button" onClick={() => speak(emotionVocabulary[displayId(concept.id)].speech)}><SpeakerIcon />Ouvir nome</button><button type="button" onClick={() => speak(concept.explanation)}><SpeakerIcon />Ouvir explicação</button></div>
      <details><summary>Exemplo fictício</summary><p>{concept.example}</p></details>
      <div className="emotions-actions"><button type="button" onClick={advance}>Próximo conceito</button><button type="button" onClick={advance}>Pular</button></div>
    </section> : view !== 'menu' && view !== 'explore' ? <>
      <section className="emotions-builder" aria-labelledby="emotions-message-title"><h2 id="emotions-message-title">Sua mensagem</h2><p>Escolha os cartões abaixo. Você pode ouvir uma mensagem incompleta.</p>
        <ol className="emotions-slots">{phrase.map((id, position) => <li key={position}>{id ? <><img src={emotionVocabulary[id].image} alt="" width="300" height="300" /><strong>{emotionVocabulary[id].label}</strong><button type="button" aria-label={`Remover ${emotionVocabulary[id].label}`} onClick={() => remove(position)}>Remover</button></> : <span>Posição {position + 1}: vazia</span>}</li>)}</ol>
        {message && <p className="emotions-message">{message}</p>}
        <div className="emotions-actions"><button type="button" disabled={!message} onClick={() => speak(message)}><SpeakerIcon />Ouvir mensagem</button><button type="button" onClick={clear}>Limpar</button><button type="button" onClick={back}>Não quero responder</button></div>
      </section>
      <section aria-labelledby="emotions-choices-title"><h2 id="emotions-choices-title">Cartões disponíveis</h2><div className="emotions-choices">{choices.map(id => { const item = emotionVocabulary[id]; return <div className="emotions-choice" key={item.variants ? item.variants[0] : id}><CommunicationCard label={item.label} image={item.image} audioText={item.speech} onSelect={() => choose(id)} onSpeak={speak} selected={phrase.includes(id)} />{item.variants && variants(item.variants[0])}</div> })}</div>
      {view === 'need' && <p className="emotions-rest">{restExplanation}</p>}</section>
    </> : null}
    <p role="status" className="emotions-status">{status}</p><p role="status" className="emotions-status">{audioStatus}</p>
    <footer>Pictogramas: {pictogramCredit.author} · <a href={pictogramCredit.source}>ARASAAC</a> · {pictogramCredit.owner} · <a href={pictogramCredit.licenseUrl}>{pictogramCredit.license}</a></footer>
  </main>
}
