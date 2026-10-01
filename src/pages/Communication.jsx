import { useEffect, useMemo, useRef, useState } from 'react'
import CommunicationCard, { SpeakerIcon } from '../components/CommunicationCard'
import { falar, stopSpeaking } from '../utils/speech'
import { communicationWords, pictogramCredit } from '../data/communicationOptions'
import './Communication.css'

const levels = [
  {
    id: 'nivel-1',
    title: 'Nível 1',
    description: 'Eu quero',
    availableTokens: ['eu', 'quero', 'agua', 'comer', 'brincar', 'dormir'],
    quickResponses: [],
  },
  {
    id: 'nivel-2',
    title: 'Nível 2',
    description: 'Eu preciso / Eu estou',
    availableTokens: ['eu', 'quero', 'preciso', 'estou', 'agua', 'comer', 'brincar', 'dormir', 'ajuda', 'banheiro', 'fome', 'dor'],
    quickResponses: [],
  },
  {
    id: 'nivel-3',
    title: 'Nível 3',
    description: 'Minhas escolhas',
    availableTokens: ['eu', 'quero', 'preciso', 'estou', 'nao', 'agua', 'comer', 'brincar', 'dormir', 'ajuda', 'banheiro', 'fome', 'dor'],
    quickResponses: ['sim', 'nao'],
  },
]

const levelById = Object.fromEntries(levels.map(level => [level.id, level]))
const intentionIds = ['quero', 'preciso', 'estou']
const nounIds = ['agua', 'comer', 'brincar', 'dormir', 'ajuda', 'banheiro', 'fome', 'dor']
const tokenCatalog = Object.fromEntries(Object.entries(communicationWords).map(([id, value]) => [id, { ...value, id }]))

function getNaturalPhrase(tokens) {
  const ids = tokens.filter(Boolean)
  if (!ids.length) return ''

  if (ids.length === 1) {
    if (ids[0] === 'sim') return 'Sim.'
    if (ids[0] === 'nao') return 'Não.'
  }

  const map = {
    'eu,quero,agua': 'Eu quero beber água.',
    'eu,quero,comer': 'Eu quero comer.',
    'eu,quero,brincar': 'Eu quero brincar.',
    'eu,quero,dormir': 'Eu quero dormir.',
    'eu,preciso,ajuda': 'Eu preciso de ajuda.',
    'eu,preciso,banheiro': 'Eu preciso ir ao banheiro.',
    'eu,estou,fome': 'Eu estou com fome.',
    'eu,estou,dor': 'Eu estou com dor.',
    'eu,nao,quero,comer': 'Eu não quero comer.',
    'eu,nao,quero,brincar': 'Eu não quero brincar.',
  }

  const key = ids.join(',')
  if (map[key]) return map[key]

  const labels = ids.map(id => tokenCatalog[id]?.label || id)
  let phrase = labels.join(' ')
  phrase = phrase.replace(/\s+/g, ' ').trim()
  if (!phrase) return ''
  return phrase.charAt(0).toUpperCase() + phrase.slice(1)
}

function canAddToken(currentPhrase, item) {
  const ids = currentPhrase.map(entry => entry.id)
  if (!item || ids.includes(item.id)) return false

  if (item.id === 'eu') return !ids.includes('eu')

  if (item.id === 'nao') {
    return ids.includes('eu') && !ids.includes('nao') && !ids.includes('quero') && !ids.includes('preciso') && !ids.includes('estou')
  }

  if (intentionIds.includes(item.id)) {
    return ids.includes('eu') && !ids.some(id => intentionIds.includes(id))
  }

  if (nounIds.includes(item.id)) {
    if (ids.includes('nao') && !ids.includes('quero')) return false
    const currentIntention = ids.find(id => intentionIds.includes(id))
    if (item.id === 'ajuda' || item.id === 'banheiro') return currentIntention === 'preciso'
    if (item.id === 'fome' || item.id === 'dor') return currentIntention === 'estou'
    return Boolean(currentIntention)
  }

  return true
}

export default function Communication() {
  const [selectedLevelId, setSelectedLevelId] = useState(levels[0].id)
  const [phrase, setPhrase] = useState([])
  const [audioMessage, setAudioMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const stepTitle = useRef(null)

  const selectedLevel = levelById[selectedLevelId] || levels[0]
  const vocabulary = useMemo(() => selectedLevel.availableTokens.map(id => tokenCatalog[id]).filter(Boolean), [selectedLevel])
  const quickAnswers = useMemo(() => selectedLevel.quickResponses.map(id => tokenCatalog[id]).filter(Boolean), [selectedLevel])
  const naturalPhrase = useMemo(() => getNaturalPhrase(phrase.map(item => item.id)), [phrase])

  useEffect(() => { stepTitle.current?.focus({ preventScroll: true }) }, [selectedLevelId])
  useEffect(() => () => stopSpeaking(), [])

  function handleLevelChange(levelId) {
    const nextLevel = levelById[levelId] || levels[0]
    setSelectedLevelId(nextLevel.id)
    setPhrase([])
    setAudioMessage('')
    setStatusMessage('')
    stopSpeaking()
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape' || !phrase.length) return
      event.preventDefault()
      const next = phrase.slice(0, -1)
      setPhrase(next)
      setAudioMessage('')
      setStatusMessage(next.length ? 'Item removido.' : 'Frase limpa.')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phrase])

  function speak(text) {
    if (!text) return
    setAudioMessage('')
    falar(text, setAudioMessage)
  }

  function addItem(item) {
    if (!item || !canAddToken(phrase, item)) {
      setStatusMessage('Essa combinação ainda não está disponível neste nível.')
      return
    }

    const next = [...phrase, item]
    setPhrase(next)
    setAudioMessage('')
    setStatusMessage(`${item.audioText} adicionado.`)
  }

  function addQuickAnswer(item) {
    setPhrase([item])
    setAudioMessage('')
    setStatusMessage(`${item.audioText} selecionado.`)
  }

  function removeItem(index) {
    const next = phrase.filter((_, itemIndex) => itemIndex !== index)
    setPhrase(next)
    setAudioMessage('')
    setStatusMessage(next.length ? 'Item removido.' : 'Frase limpa.')
  }

  function clear() {
    stopSpeaking()
    setPhrase([])
    setAudioMessage('')
    setStatusMessage('Frase limpa.')
  }

  return (
    <main id="conteudo" className="communication-page" tabIndex={-1}>
      <a className="communication-back" href="#/aprender">← Aprender</a>

      <section className="communication-intro" aria-labelledby="communication-title">
        <h1 id="communication-title">O que você quer dizer?</h1>
        <p>Escolha as opções para montar sua frase dentro do vocabulário do nível.</p>
      </section>

      <div className="communication-level-selector" aria-label="Seleção de nível">
        {levels.map(level => (
          <button
            key={level.id}
            type="button"
            className={['communication-level-button', level.id === selectedLevelId ? 'communication-level-button--active' : ''].join(' ')}
            onClick={() => handleLevelChange(level.id)}
          >
            {level.title}
          </button>
        ))}
      </div>

      <section className="sentence-panel" aria-labelledby="sentence-title">
        <h2 id="sentence-title">Sua frase</h2>

        <p className="sentence-level-label">{selectedLevel.description}</p>

        {phrase.length ? (
          <ol className="sentence-words">
            {phrase.map((item, index) => (
              <li key={`${item.id}-${index}`}>
                <CommunicationCard {...item} onSpeak={speak} selected removable onRemove={() => removeItem(index)} />
              </li>
            ))}
          </ol>
        ) : (
          <p className="sentence-empty">Escolha uma opção abaixo.</p>
        )}

        {naturalPhrase && (
          <p className="sentence-natural" aria-live="polite">{naturalPhrase}</p>
        )}

        <div className="sentence-actions">
          <button type="button" disabled={!naturalPhrase} onClick={() => speak(naturalPhrase)}><SpeakerIcon />Ouvir frase</button>
          <button type="button" onClick={clear}>Limpar</button>
        </div>

        <p className="communication-status" role="status" aria-live="polite">{statusMessage}</p>
        <p className="audio-feedback" role="status" aria-live="polite">{audioMessage}</p>
      </section>

      <section className="communication-choices" aria-labelledby="step-title">
        <p className="communication-step">Vocabulário disponível</p>
        <h2 id="step-title" ref={stepTitle} tabIndex={-1}>{selectedLevel.title}</h2>
        <div className="communication-grid">
          {vocabulary.map(item => (
            <CommunicationCard
              key={item.id}
              {...item}
              onSelect={() => addItem(item)}
              onSpeak={speak}
            />
          ))}
        </div>
      </section>

      {quickAnswers.length > 0 && (
        <section className="quick-answers" aria-labelledby="quick-title">
          <h2 id="quick-title">Respostas rápidas</h2>
          <p>Para responder apenas com sim ou não.</p>
          <div className="communication-grid quick-grid">
            {quickAnswers.map(item => (
              <CommunicationCard
                key={item.id}
                {...item}
                onSelect={() => addQuickAnswer(item)}
                onSpeak={speak}
              />
            ))}
          </div>
        </section>
      )}

      <footer className="communication-credit">Pictogramas: {pictogramCredit.author} · <a href={pictogramCredit.source}>ARASAAC</a> · {pictogramCredit.owner} · <a href={pictogramCredit.licenseUrl}>{pictogramCredit.license}</a></footer>
    </main>
  )
}
