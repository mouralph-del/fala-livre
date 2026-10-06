import { useCallback, useEffect, useRef, useState } from 'react'
import { puzzleLevels, createPuzzlePieces, shuffledPieceIds } from '../data/puzzleLevels'
import { SpeakerIcon } from '../components/CommunicationCard'
import { falar, stopSpeaking } from '../utils/speech'
import './PuzzleGame.css'
import { useGameProgress } from '../hooks/useGameProgress'
import GameProgressFeedback, { GameLevelStatus } from '../components/GameProgressFeedback'

const initial = level => {
  const pieces = createPuzzlePieces(level)
  const startOrder = shuffledPieceIds(pieces)
  return { pieces, board: pieces.map(() => null), tray: startOrder, startOrder }
}
const positionName = (level, index) => `linha ${Math.floor(index / level.columns) + 1}, coluna ${index % level.columns + 1}`

function PuzzleFragment({ level, piece }) {
  if (level.composition) return <span className="puzzle-fragment puzzle-fragment--composition" style={{ '--piece-left': `${piece.column * 100}%`, '--piece-top': `${piece.row * 100}%`, '--composition-columns': level.columns, '--composition-rows': level.rows }}><span className="puzzle-composition">{level.composition.images.map((image, index) => <img key={index} src={image} alt="" />)}</span></span>
  return <span className="puzzle-fragment" aria-hidden="true" style={{ backgroundImage: `url("${level.image}")`, backgroundSize: `${level.columns * 100}% ${level.rows * 100}%`, backgroundPosition: `${piece.x}% ${piece.y}%` }} />
}

export default function PuzzleGame({ progressService } = {}) {
  const [level, setLevel] = useState(puzzleLevels[0])
  const [layout, setLayout] = useState(() => initial(puzzleLevels[0]))
  const [selected, setSelected] = useState(null)
  const [hint, setHint] = useState(null)
  const [message, setMessage] = useState('')
  const [audioMessage, setAudioMessage] = useState('')
  const successHeading = useRef(null)
  const firstTrayButton = useRef(null)
  const gesture = useRef(null)
  const suppressClick = useRef(false)
  const playArea = useRef(null)
  const [drag, setDrag] = useState(null)
  const full = layout.board.every(Boolean)
  const solved = full && layout.board.every((id, index) => id === layout.pieces[index].id)
  const progress = useGameProgress('quebra-cabeca', level.id, solved, progressService)

  const cancelDrag = useCallback(() => {
    const current = gesture.current
    gesture.current = null
    setDrag(null)
    if (!current) return
    if (current.dragging) { suppressClick.current = true; setSelected(current.previousSelected); setMessage('Movimento cancelado. Você pode selecionar uma peça e um espaço.') }
    if (current.element.hasPointerCapture(current.pointerId)) current.element.releasePointerCapture(current.pointerId)
  }, [])
  useEffect(() => {
    const escape = event => { if (event.key === 'Escape' && gesture.current) { event.preventDefault(); cancelDrag() } }
    window.addEventListener('keydown', escape)
    return () => { window.removeEventListener('keydown', escape); gesture.current = null }
  }, [cancelDrag])

  useEffect(() => () => stopSpeaking(), [])
  useEffect(() => { if (solved) successHeading.current?.focus() }, [solved])

  function choose(id) {
    if (solved) return
    setSelected(current => current === id ? null : id)
    setMessage(selected === id ? 'Seleção cancelada.' : 'Peça selecionada. Escolha um espaço do tabuleiro.')
  }
  function place(index, pieceId = selected) {
    if (solved) return
    if (!pieceId) { if (layout.board[index]) choose(layout.board[index]); else setMessage('Escolha uma peça primeiro.'); return }
    if (layout.board[index] === pieceId) { choose(pieceId); return }
    setLayout(current => {
      const board = [...current.board]
      const tray = [...current.tray]
      const source = board.indexOf(pieceId)
      const traySource = tray.indexOf(pieceId)
      const replaced = board[index]
      if (source !== -1) board[source] = replaced
      else if (traySource !== -1) tray[traySource] = replaced
      else return current
      board[index] = pieceId
      return { ...current, board, tray }
    })
    setSelected(null); setHint(null); setMessage('Peça colocada. Você pode selecionar outra peça para continuar.')
  }
  function dropTarget(x, y) {
    const slot = document.elementFromPoint(x, y)?.closest('.puzzle-slot')
    return slot && playArea.current?.contains(slot) ? Number(slot.dataset.slot) : null
  }
  function pointerDown(event, id) {
    if (!event.isPrimary || event.button !== 0 || gesture.current) return
    suppressClick.current = false
    if (!id || solved) return
    const rect = event.currentTarget.getBoundingClientRect()
    gesture.current = { id, pointerId: event.pointerId, element: event.currentTarget, x: event.clientX, y: event.clientY, width: rect.width, height: rect.height, dragging: false, previousSelected: selected }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function pointerMove(event) {
    const current = gesture.current
    if (!current || current.pointerId !== event.pointerId) return
    if (!current.dragging) {
      if (Math.hypot(event.clientX - current.x, event.clientY - current.y) < 6) return
      current.dragging = true; suppressClick.current = true
      setSelected(current.id); setHint(null); setMessage('Arraste a peça para um espaço do tabuleiro.')
    }
    if (event.clientY < 48) window.scrollBy(0, -16)
    else if (event.clientY > window.innerHeight - 48) window.scrollBy(0, 16)
    const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1
    setDrag({ id: current.id, x: event.clientX / zoom, y: event.clientY / zoom, width: current.width / zoom, height: current.height / zoom, target: dropTarget(event.clientX, event.clientY) })
  }
  function pointerEnd(event) {
    const current = gesture.current
    if (!current || current.pointerId !== event.pointerId) return
    gesture.current = null; setDrag(null)
    if (current.element.hasPointerCapture(event.pointerId)) current.element.releasePointerCapture(event.pointerId)
    if (!current.dragging) return // Stationary mouse/touch keeps the native click.
    suppressClick.current = true
    const target = dropTarget(event.clientX, event.clientY)
    if (target !== null) place(target, current.id)
    else setMessage('Escolha um espaço do tabuleiro para colocar a peça.')
  }
  function click(event, action) {
    if (event.detail > 0 && suppressClick.current) { suppressClick.current = false; return }
    action()
  }
  function help() {
    const index = layout.board.findIndex((id, at) => id !== layout.pieces[at].id)
    if (index < 0) return
    const targetId = layout.pieces[index].id
    const source = layout.board.indexOf(targetId)
    const traySource = layout.tray.indexOf(targetId)
    setLayout(current => {
      const board = [...current.board]
      const tray = [...current.tray]
      if (source !== -1) [board[index], board[source]] = [board[source], board[index]]
      else if (traySource !== -1) {
        const replaced = board[index]
        board[index] = targetId
        tray[traySource] = replaced
      }
      return { ...current, board, tray }
    })
    setHint(targetId)
    setMessage('Uma peça foi encaixada para ajudar. Agora tente outra.')
  }
  function speak() { setAudioMessage(''); falar(level.speechText, setAudioMessage) }
  function restart() {
    cancelDrag()
    stopSpeaking(); setAudioMessage(''); setSelected(null); setHint(null); setMessage('')
    const next = initial(level)
    next.startOrder = shuffledPieceIds(next.pieces, layout.startOrder)
    next.tray = next.startOrder
    setLayout(next)
    requestAnimationFrame(() => firstTrayButton.current?.focus())
  }
  function changeLevel(nextLevel) {
    if (!progress.canEnter(nextLevel.id)) return
    cancelDrag()
    stopSpeaking(); setAudioMessage(''); setSelected(null); setHint(null); setMessage('')
    setLevel(nextLevel); setLayout(initial(nextLevel))
  }
  const hintIndex = layout.pieces.findIndex(piece => piece.id === hint)

  return <main id="conteudo" className="puzzle-page" tabIndex={-1}>
    <a className="puzzle-back" href="#/jogar">← Jogos</a>
    <header className="puzzle-intro"><h1>Quebra-cabeça</h1></header>
    <nav className="puzzle-levels" aria-label="Escolher nível">
      {puzzleLevels.map((item, index) => <button key={item.id} type="button" className={`puzzle-level${item.id === level.id ? ' puzzle-level--active' : ''}`} aria-pressed={item.id === level.id} aria-disabled={progress.availability(item.id).status !== 'available'} onClick={() => changeLevel(item)}>Nível {index + 1}<GameLevelStatus progress={progress} levelId={item.id} /></button>)}
    </nav>
    <GameProgressFeedback progress={progress} firstLevel={puzzleLevels[0]} onChange={changeLevel} />
    {progress.activeAvailable && <>
    <div className="puzzle-adventure">
    <section ref={playArea} className="puzzle-activity" aria-labelledby="puzzle-word" style={{ '--columns': level.columns, '--rows': level.rows, '--image-ratio': level.imageAspectRatio, '--piece-ratio': level.imageAspectRatio * level.rows / level.columns }}>
      <div className="puzzle-reference">{level.composition ? <span className="puzzle-reference-composition" aria-label="Gato e cachorro"><img src={level.composition.images[0]} alt="Gato" /><img src={level.composition.images[1]} alt="Cachorro" /></span> : <img src={level.image} alt={`Imagem para montar: ${level.label.toLowerCase()}`} width="300" height="300" />}<div><h2 id="puzzle-word">Monte a {level.label}</h2><div className="puzzle-reference-meta"><span>{layout.pieces.length} peças</span><button type="button" className="puzzle-action" onClick={speak}><SpeakerIcon />Ouvir palavra</button></div></div></div>
      <p className="puzzle-instructions">Arraste uma peça até um espaço ou selecione a peça e depois o espaço. Para trocar, selecione duas peças do tabuleiro.</p>
      <div className="puzzle-work">
        <section aria-labelledby="puzzle-board-title"><h2 id="puzzle-board-title">Tabuleiro</h2>
          <div className="puzzle-board" data-solved={solved}>
            {layout.board.map((id, index) => <button type="button" key={index} data-slot={index} data-piece={id || undefined} className={`puzzle-slot${selected && id === selected ? ' puzzle-piece--selected' : ''}${hintIndex === index ? ' puzzle-slot--hint' : ''}${hint && id === hint ? ' puzzle-piece--hint' : ''}${drag?.target === index ? ' puzzle-slot--over' : ''}`}
              aria-label={`${selected ? 'Colocar peça no espaço' : id ? 'Selecionar peça no espaço' : 'Espaço vazio:'} ${positionName(level, index)}`}
              aria-pressed={Boolean(id && id === selected)} aria-disabled={solved} onClick={event => click(event, () => place(index))}
              onPointerDown={event => pointerDown(event, id)} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={cancelDrag} onLostPointerCapture={cancelDrag}>
              {id && <PuzzleFragment level={level} piece={layout.pieces.find(piece => piece.id === id)} />}
              {!id && <span className="puzzle-empty" aria-hidden="true" />}
              {!solved && selected && id === selected && <span className="puzzle-badge">Selecionada</span>}
              {hintIndex === index && <span className="puzzle-badge">Dica</span>}
            </button>)}
          </div>
        </section>
        {!solved && <section aria-labelledby="puzzle-tray-title"><h2 id="puzzle-tray-title">Peças para montar</h2>
          <div className="puzzle-tray">{layout.tray.map((id, index) => id ? <button type="button" key={index} ref={index === 0 ? firstTrayButton : undefined} data-piece={id} className={`puzzle-piece${selected === id ? ' puzzle-piece--selected' : ''}${hint === id ? ' puzzle-piece--hint' : ''}`} aria-label={`Selecionar peça ${layout.pieces.find(piece => piece.id === id).index + 1}`} aria-pressed={selected === id} onClick={event => click(event, () => choose(id))}
            onPointerDown={event => pointerDown(event, id)} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={cancelDrag} onLostPointerCapture={cancelDrag}>
            <PuzzleFragment level={level} piece={layout.pieces.find(piece => piece.id === id)} />
            {(selected === id || hint === id) && <span className="puzzle-badge">{selected === id ? 'Selecionada' : 'Dica'}</span>}
          </button> : <div key={index} className="puzzle-tray-empty" aria-hidden="true" />)}</div>
          {layout.tray.every(id => !id) && <p>Selecione uma peça do tabuleiro para trocar.</p>}
          <div className="puzzle-controls"><button type="button" className="puzzle-action action-help" aria-label="Preciso de ajuda" onClick={help}>Preciso de ajuda</button><button type="button" className="puzzle-action" onClick={restart}>Reiniciar</button></div>
        </section>}
      </div>
      <p className="puzzle-status" role="status">{solved ? '' : message}</p>
      <div className="puzzle-feedback" role="status">{full && !solved && 'Quase! Você pode trocar as peças.'}</div>
      {solved && <section className="puzzle-success" aria-labelledby="puzzle-success-title"><h2 id="puzzle-success-title" ref={successHeading} tabIndex={-1}>Muito bem!</h2><p>Você completou {level.label}.</p>{level.composition ? <span className="puzzle-success-composition"><img src={level.composition.images[0]} alt="Gato" /><img src={level.composition.images[1]} alt="Cachorro" /></span> : <img src={level.image} alt={`${level.label} completa`} width="300" height="300" />}<div className="puzzle-actions"><button type="button" className="puzzle-action" onClick={speak}><SpeakerIcon />Ouvir palavra</button><button type="button" className="puzzle-action" onClick={restart}>Jogar novamente</button></div></section>}
      <p className="puzzle-status" role="status">{audioMessage}</p>
      {drag && <div className="puzzle-drag" aria-hidden="true" style={{ left: drag.x, top: drag.y, width: drag.width, height: drag.height }}><PuzzleFragment level={level} piece={layout.pieces.find(piece => piece.id === drag.id)} /></div>}
    </section>
    </div>
    </>}

  </main>
}
