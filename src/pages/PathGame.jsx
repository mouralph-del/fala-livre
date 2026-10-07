import { useEffect, useRef, useState } from 'react'
import { pathGameLevels, nextPathStep } from '../data/pathGameLevels'
import { SpeakerIcon } from '../components/CommunicationCard'
import { falar, stopSpeaking } from '../utils/speech'
import { getPreferences } from '../utils/preferences'
import './PathGame.css'
import { useGameProgress } from '../hooks/useGameProgress'
import GameProgressFeedback, { GameLevelStatus } from '../components/GameProgressFeedback'

const edgeKey = (from, to) => [from, to].sort().join(':')

function VisualDestination({ destination, className = '' }) {
  if (destination.image) return <span className={`path-destination-visual ${className}`} aria-hidden="true"><img src={destination.image} alt="" width="300" height="300" />{destination.secondaryImage && <img src={destination.secondaryImage} alt="" width="300" height="300" />}</span>
  return <span className={`path-visual path-visual--${destination.visualType} ${className}`} aria-hidden="true" />
}

export default function PathGame({ progressService } = {}) {
  const [level, setLevel] = useState(pathGameLevels[0])
  const [history, setHistory] = useState([level.startNode])
  const [moving, setMoving] = useState(false)
  const [hint, setHint] = useState(null)
  const [audioMessage, setAudioMessage] = useState('')
  const board = useRef(null)
  const result = useRef(null)
  const lock = useRef(false)
  const timer = useRef(null)
  const hintTimer = useRef(null)
  const previous = useRef(level.startNode)
  const edges = level.nodes.flatMap(node => node.connections.filter(id => node.id < id).map(id => [node, level.nodes.find(next => next.id === id)]))
  const characters = level.characters
  const position = history.at(-1)
  const node = level.nodes.find(item => item.id === position)
  const success = position === level.correctDestination
  const progress = useGameProgress('caminho', level.id, success && !moving, progressService)
  const available = success || moving ? [] : node.connections
  const visited = new Set(history)
  const traversed = new Set(history.slice(1).map((id, index) => edgeKey(history[index], id)))

  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(hintTimer.current); stopSpeaking() }, [])
  useEffect(() => {
    if (moving || previous.current === position) return
    if (success) result.current?.focus()
    else board.current?.querySelector('button:not(:disabled)')?.focus({ preventScroll: true })
    previous.current = position
  }, [position, moving, success])

  function speak(text) { setAudioMessage(''); falar(text, setAudioMessage) }
  function travel(nextHistory) {
    if (lock.current) return
    clearTimeout(hintTimer.current)
    stopSpeaking(); setAudioMessage(''); setHint(null)
    const reduce = getPreferences().reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduce) {
      lock.current = true
      setMoving(true)
      timer.current = setTimeout(() => { lock.current = false; setMoving(false) }, 400)
    }
    setHistory(nextHistory)
  }
  function move(id) {
    if (lock.current || !available.includes(id)) return
    travel([...history, id])
  }
  function back() {
    if (history.length > 1 && !lock.current) travel(history.slice(0, -1))
  }
  function help() {
    clearTimeout(hintTimer.current)
    const next = nextPathStep(level, position)
    setHint(next)
    if (next) hintTimer.current = setTimeout(() => setHint(null), level.hintDuration || 1800)
  }
  function restart() {
    clearTimeout(timer.current)
    clearTimeout(hintTimer.current)
    lock.current = false
    setMoving(false)
    stopSpeaking(); setAudioMessage(''); setHint(null); setHistory([level.startNode])
  }
  function changeLevel(nextLevel) {
    if (!progress.canEnter(nextLevel.id)) return
    clearTimeout(timer.current)
    clearTimeout(hintTimer.current)
    lock.current = false
    setMoving(false)
    stopSpeaking(); setAudioMessage(''); setHint(null)
    previous.current = nextLevel.startNode
    setLevel(nextLevel)
    setHistory([nextLevel.startNode])
  }

  return <main id="conteudo" className="path-page" tabIndex={-1}>
    <a className="path-back" href="#/jogar">← Jogos</a>
    <header className="path-intro"><h1>Encontre o caminho</h1></header>
    <nav className="path-levels" aria-label="Escolher nível">
      {pathGameLevels.map((item, index) => <button key={item.id} type="button" className={`path-level${item.id === level.id ? ' path-level--active' : ''}`} aria-pressed={item.id === level.id} aria-disabled={progress.availability(item.id).status !== 'available'} onClick={() => changeLevel(item)}>Nível {index + 1}<GameLevelStatus progress={progress} levelId={item.id} /></button>)}
    </nav>
    <GameProgressFeedback progress={progress} firstLevel={pathGameLevels[0]} onChange={changeLevel} />
    {progress.activeAvailable && <>
    <div className="path-adventure game-surface game-surface--trail">
      <section className="path-situation" aria-labelledby="path-situation-title">
        <div className="path-mission-label"><img src={level.image} alt="" width="60" height="60" /><span>Sua missão</span></div>
        <h2 id="path-situation-title">{level.situation}</h2>
        <button type="button" className="path-action" onClick={() => speak(level.speechPrompt)}><SpeakerIcon />Ouvir situação</button>
        <p className="path-position path-sr-only" role="status">{moving ? 'Indo para' : 'Você está em'}: {node.label}.</p>
        <p className="path-progress"><strong>Seu progresso</strong>{history.length - 1} {history.length === 2 ? 'passo no percurso' : 'passos no percurso'}</p>
        {!success && level.destinations[position] && node.type !== 'obstacle' && <p className="path-exploration">Você chegou a {node.label.toLowerCase()}. Pode voltar um passo e explorar outra rota.</p>}
      </section>
      <section className="path-play" aria-label="Tabuleiro">
        <div className="path-board" ref={board} data-moving={moving} style={{ '--columns': level.columns, '--rows': level.rows }}>
          <svg className="path-connections" viewBox={'0 0 ' + level.columns * 100 + ' ' + level.rows * 100} preserveAspectRatio="none" aria-hidden="true">
            {edges.map(([from, to]) => <line key={edgeKey(from.id, to.id)} data-edge={edgeKey(from.id, to.id)} className={traversed.has(edgeKey(from.id, to.id)) ? 'path-edge--visited' : ''} x1={from.x * 100 + 50} y1={from.y * 100 + 50} x2={to.x * 100 + 50} y2={to.y * 100 + 50} />)}
          </svg>
          {level.nodes.map(item => {
            const current = item.id === position
            const enabled = available.includes(item.id)
            const destination = level.destinations[item.id]
            const isDestination = destination && item.type !== 'obstacle'
            const clue = hint === item.id
            return <button key={item.id} type="button" data-node={item.id} disabled={!enabled} aria-current={current ? 'location' : undefined}
              className={'path-node' + (isDestination ? ' path-node--destination' : '') + (item.type === 'obstacle' ? ' path-node--obstacle' : '') + (current ? ' path-node--current' : '') + (enabled ? ' path-node--available' : '') + (clue ? ' path-node--hint' : '') + (visited.has(item.id) ? ' path-node--visited' : '')}
              style={{ left: isDestination ? `clamp(var(--destination-half), ${(item.x + .5) / level.columns * 100}%, calc(100% - var(--destination-half)))` : ((item.x + .5) / level.columns * 100) + '%', top: ((item.y + .5) / level.rows * 100) + '%' }}
              aria-label={current ? 'Você está em ' + item.label : 'Ir para ' + item.label + (clue ? ' — pista: próximo passo' : '')} onClick={() => move(item.id)}>
              {destination && item.type !== 'obstacle' && <span className="path-destinations">{Array.from({ length: destination.copies || 1 }, (_, index) => <VisualDestination key={index} destination={destination} className="path-destination" />)}</span>}
              <span>{isDestination || item.type === 'start' ? item.label : clue ? '?' : current ? '' : visited.has(item.id) ? '✓' : item.type === 'obstacle' ? '×' : '·'}</span><small>{current ? 'Aqui' : clue ? 'Pista' : enabled ? 'Pode ir' : visited.has(item.id) ? 'Visitado' : isDestination ? 'Destino' : item.type === 'obstacle' ? 'Obstáculo' : ''}</small>
            </button>
          })}
          <div className="path-player" data-position={position} style={{ left: ((node.x + .5) / level.columns * 100) + '%', top: ((node.y + .5) / level.rows * 100) + '%' }}>
            {characters.map(character => <img key={character.label} src={character.image} alt={character.label} width="300" height="300" />)}
          </div>
        </div>
          <p className="path-legend">Borda tracejada: pode ir · ✓ e linha contínua: percurso feito.</p>
      </section>
      <section className="path-controls" aria-label="Controles do percurso">
        <button type="button" className="path-action action-help" aria-label="Preciso de ajuda" disabled={moving || success} onClick={help}>Preciso de ajuda</button>
        <button type="button" className="path-action" disabled={moving || history.length === 1} onClick={back}>Voltar um passo</button>
        <button type="button" className="path-action" onClick={restart}>Reiniciar</button>
        <p className="path-hint-text" role="status">{hint && 'Pista: vá para ' + level.nodes.find(item => item.id === hint).label + '. Você escolhe quando avançar.'}</p>
      </section>
    </div>
    {success && !moving && <section className="path-result" aria-labelledby="path-result-title">
      <h2 id="path-result-title" ref={result} tabIndex={-1}>Muito bem!</h2>
      <p>{level.successMessage}</p>
      <h3>Você pode dizer:</h3>
      <ol className="path-phrase">{level.communicationPhrase.map(word => <li key={word.id}><img src={word.image} alt="" width="300" height="300" /><span>{word.label}</span></li>)}</ol>
      <button type="button" className="path-action" onClick={() => speak(level.communicationSpeech)}><SpeakerIcon />Ouvir frase</button>
      <button type="button" className="path-action" onClick={restart}>Jogar novamente</button>
    </section>}
    </>}
    <p className="path-audio-status" role="status">{audioMessage}</p>

  </main>
}

