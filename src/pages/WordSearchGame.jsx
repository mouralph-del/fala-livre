import { useEffect, useRef, useState } from 'react'
import { wordSearchLevels, canExtendSelection, matchesWord } from '../data/wordSearchLevels'
import { SpeakerIcon } from '../components/CommunicationCard'
import { falar, stopSpeaking } from '../utils/speech'
import girl from '../assets/illustrations/aprender-personagem.png'
import boy from '../assets/illustrations/jogar-personagem.png'
import './WordSearchGame.css'
import { useGameProgress } from '../hooks/useGameProgress'
import GameProgressFeedback, { GameLevelStatus } from '../components/GameProgressFeedback'

const normalize = value => value.normalize('NFC')

export default function WordSearchGame({ progressService } = {}) {
  const [level, setLevel] = useState(wordSearchLevels[0])
  const [selection, setSelection] = useState([])
  const [found, setFound] = useState([])
  const [hint, setHint] = useState(null)
  const [message, setMessage] = useState('')
  const [audioMessage, setAudioMessage] = useState('')
  const completion = useRef(null)
  const firstCell = useRef(null)
  const gesture = useRef(null)
  const hintTimer = useRef(null)
  const suppressClick = useRef(false)
  const letters = level.grid
  const complete = new Set(found).size === level.words.length && level.words.every(word => found.includes(word.id))
  const progress = useGameProgress('caca-palavras', level.id, complete, progressService)
  const sequence = selection.map(index => letters[index]).join('')
  const marked = new Map()
  level.words.forEach((word, index) => {
    if (found.includes(word.id)) word.cells.forEach(cell => marked.set(cell, [...(marked.get(cell) ?? []), index % 4]))
  })
  const possible = !selection.length || level.words.some(word => !found.includes(word.id)
    && selection.length <= word.cells.length
    && (normalize(word.word).startsWith(normalize(sequence)) || normalize(Array.from(word.word).reverse().join('')).startsWith(normalize(sequence)))
    && selection.every((index, at) => at === 0 || canExtendSelection(level, selection.slice(0, at), index)))

  useEffect(() => () => { clearTimeout(hintTimer.current); stopSpeaking() }, [])
  useEffect(() => { if (complete) completion.current?.focus() }, [complete])

  function verify(next) {
    const match = level.words.find(word => !found.includes(word.id) && matchesWord(level, next, word))
    setHint(null)
    if (match) {
      setFound(current => current.includes(match.id) ? current : [...current, match.id]); setSelection([])
      setMessage(`${match.word} encontrada! Você pode procurar a próxima palavra.`)
    } else if (next.length && level.words.some(word => !found.includes(word.id)
      && next.length < word.cells.length
      && (normalize(word.word).startsWith(normalize(next.map(index => letters[index]).join(''))) || normalize(Array.from(word.word).reverse().join('')).startsWith(normalize(next.map(index => letters[index]).join('')))))) {
      setSelection(next); setMessage('')
    } else { setSelection([]); setMessage(next.length ? 'Tente outra linha.' : '') }
  }
  function select(index) {
    if (complete || !canExtendSelection(level, selection, index)) return
    verify([...selection, index])
  }
  function pointerDown(event) {
    if (complete || !event.isPrimary || event.button !== 0 || gesture.current) return
    const cell = event.target.closest('[data-cell]')
    if (!cell) return
    suppressClick.current = false
    gesture.current = { id: event.pointerId, start: Number(cell.dataset.cell), x: event.clientX, y: event.clientY, dragging: false, path: [] }
    cell.setPointerCapture(event.pointerId)
  }
  function pointerMove(event) {
    const current = gesture.current
    if (!current || current.id !== event.pointerId) return
    if (!current.dragging) {
      if (Math.hypot(event.clientX - current.x, event.clientY - current.y) < 6) return
      current.dragging = true
      current.path = [current.start]
      suppressClick.current = true
      setHint(null); setMessage('')
    }
    // Capture keeps receiving events outside the board; hit testing finds the
    // actual cell beneath the pointer instead of the captured element.
    const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-cell]')
    if (cell && event.currentTarget.contains(cell)) {
      const index = Number(cell.dataset.cell)
      const previous = current.path.indexOf(index)
      if (previous !== -1) current.path = current.path.slice(0, previous + 1)
      else if (canExtendSelection(level, current.path, index)) current.path = [...current.path, index]
    }
    setSelection(current.path)
  }
  function pointerEnd(event, cancelled = false) {
    const current = gesture.current
    if (!current || current.id !== event.pointerId) return
    gesture.current = null
    if (event.target.hasPointerCapture(event.pointerId)) event.target.releasePointerCapture(event.pointerId)
    if (current.dragging && !cancelled) verify(current.path)
    // A stationary tap uses the original button click. A drag never triggers
    // that click a second time, while keyboard clicks (detail 0) stay enabled.
  }
  function speak(word) { setAudioMessage(''); falar(word.speechText, setAudioMessage) }
  function help() {
    const word = level.words.find(item => !found.includes(item.id))
    if (word) {
      clearTimeout(hintTimer.current)
      setHint(word.cells[0]); setMessage(`Pista: comece na linha ${Math.floor(word.cells[0] / level.columns) + 1}, coluna ${word.cells[0] % level.columns + 1}.`)
      hintTimer.current = setTimeout(() => setHint(null), 1800)
    }
  }
  function reset() {
    clearTimeout(hintTimer.current)
    gesture.current = null; suppressClick.current = false
    stopSpeaking(); setSelection([]); setFound([]); setHint(null); setMessage(''); setAudioMessage('')
    requestAnimationFrame(() => firstCell.current?.focus())
  }
  function changeLevel(nextLevel) {
    if (!progress.canEnter(nextLevel.id)) return
    clearTimeout(hintTimer.current)
    gesture.current = null; suppressClick.current = false
    stopSpeaking(); setLevel(nextLevel); setSelection([]); setFound([]); setHint(null); setMessage(''); setAudioMessage('')
  }

  return <main id="conteudo" className="wordsearch-page" tabIndex={-1}>
    <a className="wordsearch-back" href="#/jogar">← Jogos</a>
    <header className="wordsearch-intro"><div><h1>Caça-palavras</h1><p>Encontre {level.words.map(word => word.word).join(' e ')}</p></div><div className="wordsearch-friends" aria-hidden="true"><img src={girl} alt="" /><img src={boy} alt="" /></div></header>
    <nav className="wordsearch-levels" aria-label="Escolher nível">
      {wordSearchLevels.map((item, index) => <button key={item.id} type="button" className={`wordsearch-level${item.id === level.id ? ' wordsearch-level--active' : ''}`} aria-pressed={item.id === level.id} aria-disabled={progress.availability(item.id).status !== 'available'} onClick={() => changeLevel(item)}>Nível {index + 1}<GameLevelStatus progress={progress} levelId={item.id} /></button>)}
    </nav>
    <GameProgressFeedback progress={progress} firstLevel={wordSearchLevels[0]} onChange={changeLevel} />
    {progress.activeAvailable && <>
    <div className="wordsearch-activity game-surface game-surface--notebook">
    <section className="wordsearch-vocabulary" aria-labelledby="wordsearch-words-title">
      <h2 id="wordsearch-words-title">{level.title.toUpperCase()}</h2>
      <ul>{level.words.map((word, index) => <li key={word.id} data-found-color={found.includes(word.id) ? index % 4 : undefined}><div><strong>{word.word}</strong>{found.includes(word.id) && <span className="wordsearch-found-label">Encontrada</span>}</div><button type="button" className="wordsearch-audio" aria-label={`Ouvir ${word.word}`} onClick={() => speak(word)}><SpeakerIcon /></button></li>)}</ul>
      <p className="wordsearch-progress" role="status">{found.length} de {level.words.length} palavras encontradas</p>
      <progress value={found.length} max={level.words.length} aria-label="Palavras encontradas" />
      <p className="wordsearch-status" role="status">{audioMessage}</p>
    </section>
    <section className="wordsearch-play" aria-label="Grade de caça-palavras">
      <div className="wordsearch-grid" style={{ '--columns': level.columns }} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={event => pointerEnd(event, true)} onLostPointerCapture={event => pointerEnd(event, true)}>
        {letters.map((letter, index) => {
          const selected = selection.includes(index)
          const foundCell = marked.has(index)
          const clue = hint === index
          return <button type="button" key={index} ref={index === 0 ? firstCell : undefined} data-cell={index}
            data-found-color={foundCell ? marked.get(index).join(' ') : undefined}
            style={foundCell && marked.get(index).length > 1 ? { backgroundImage: `linear-gradient(135deg, ${marked.get(index).flatMap((color, at, colors) => [`var(--word-color-${color}) ${at / colors.length * 100}%`, `var(--word-color-${color}) ${(at + 1) / colors.length * 100}%`]).join(', ')})` } : undefined}
            className={`wordsearch-cell${selected ? ' wordsearch-cell--selected' : ''}${foundCell ? ' wordsearch-cell--found' : ''}${clue ? ' wordsearch-cell--hint' : ''}`}
            aria-label={`Letra ${letter}, linha ${Math.floor(index / level.columns) + 1}, coluna ${index % level.columns + 1}${foundCell ? ', palavra encontrada' : ''}${clue ? ', pista: comece por aqui' : ''}`}
            aria-pressed={selected} aria-disabled={complete || !canExtendSelection(level, selection, index)} onClick={event => { if (event.detail > 0 && suppressClick.current) { suppressClick.current = false; return }; select(index) }}>
            {letter}{clue && <svg className="wordsearch-hint-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M2 8h11M8 3l5 5-5 5" /></svg>}
          </button>
        })}
      </div>
      <p className="wordsearch-legend">Letras sublinhadas pertencem a palavras encontradas.</p>
    </section>
    <section className="wordsearch-tools" aria-label="Seleção e controles">
      {!complete && <><p className="wordsearch-instructions">Arraste ou toque letra por letra: da esquerda para a direita ou de cima para baixo.</p>
      <p className="wordsearch-sequence" aria-live="polite">Sua sequência: <strong>{sequence || '—'}</strong></p></>}
      {!complete && <div className="wordsearch-controls">
        <button type="button" className="wordsearch-action" disabled={!selection.length} onClick={() => { setSelection(current => current.slice(0, -1)); setMessage('') }}>Desfazer</button>
        <button type="button" className="wordsearch-action" disabled={!selection.length} onClick={() => { setSelection([]); setMessage('') }}>Limpar seleção</button>
        <button type="button" className="wordsearch-action action-help" aria-label="Preciso de ajuda" onClick={help}>Preciso de ajuda</button>
        <button type="button" className="wordsearch-action wordsearch-restart" onClick={reset}>Reiniciar</button>
      </div>}
      <p className="wordsearch-status" role="status">{complete ? '' : !possible ? 'Tente outra sequência.' : message}</p>
    </section>
    </div>
    {complete && <section className="wordsearch-success" aria-labelledby="wordsearch-success-title">
      <img className="wordsearch-success-friend" src={girl} alt="" />
      <div><h2 id="wordsearch-success-title" ref={completion} tabIndex={-1}>Muito bem!</h2><p>Você encontrou todas as palavras.</p>
      <ul>{level.words.map(word => <li key={word.id}><span aria-hidden="true">✓ </span>{word.word} — Concluída</li>)}</ul>
      <div className="wordsearch-controls"><button type="button" className="wordsearch-action" onClick={reset}>Jogar novamente</button><a className="wordsearch-action" href="#/jogar">Voltar aos jogos</a></div></div>
      <img className="wordsearch-success-friend" src={boy} alt="" />
    </section>}
    </>}
  </main>
}
