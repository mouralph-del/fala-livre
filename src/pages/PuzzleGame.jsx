import { useEffect, useRef, useState } from 'react'
import { puzzleLevels, createPuzzlePieces, shuffledPieceIds } from '../data/puzzleLevels'
import { pictogramCredit } from '../data/communicationOptions'
import { SpeakerIcon } from '../components/CommunicationCard'
import { falar, stopSpeaking } from '../utils/speech'
import puzzleScene from '../assets/scenes/jogo-quebra-cabeca.png'
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
  const full = layout.board.every(Boolean)
  const solved = full && layout.board.every((id, index) => id === layout.pieces[index].id)
  const progress = useGameProgress('quebra-cabeca', level.id, solved, progressService)

  useEffect(() => () => stopSpeaking(), [])
  useEffect(() => { if (solved) successHeading.current?.focus() }, [solved])

  function choose(id) {
    if (solved) return
    setSelected(current => current === id ? null : id)
    setMessage(selected === id ? 'Seleção cancelada.' : `Peça ${layout.pieces.find(piece => piece.id === id).index + 1} selecionada. Escolha um espaço do tabuleiro.`)
  }
  function place(index) {
    if (solved) return
    if (!selected) { if (layout.board[index]) choose(layout.board[index]); else setMessage('Escolha uma peça primeiro.'); return }
    if (layout.board[index] === selected) { choose(selected); return }
    setLayout(current => {
      const board = [...current.board]
      const tray = [...current.tray]
      const source = board.indexOf(selected)
      const traySource = tray.indexOf(selected)
      const replaced = board[index]
      if (source !== -1) board[source] = replaced
      else if (traySource !== -1) tray[traySource] = replaced
      else return current
      board[index] = selected
      return { ...current, board, tray }
    })
    setSelected(null); setHint(null); setMessage('Peça colocada. Você pode selecionar outra peça para continuar.')
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
    setMessage(`Pista: a peça ${index + 1} foi colocada no espaço correto.`)
  }
  function speak() { setAudioMessage(''); falar(level.speechText, setAudioMessage) }
  function restart() {
    stopSpeaking(); setAudioMessage(''); setSelected(null); setHint(null); setMessage('')
    const next = initial(level)
    next.startOrder = shuffledPieceIds(next.pieces, layout.startOrder)
    next.tray = next.startOrder
    setLayout(next)
    requestAnimationFrame(() => firstTrayButton.current?.focus())
  }
  function changeLevel(nextLevel) {
    if (!progress.canEnter(nextLevel.id)) return
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
    <section className="puzzle-activity" aria-labelledby="puzzle-word" style={{ '--columns': level.columns, '--rows': level.rows, '--image-ratio': level.imageAspectRatio, '--piece-ratio': level.imageAspectRatio * level.rows / level.columns }}>
      <div className="puzzle-reference">{level.composition ? <span className="puzzle-reference-composition" aria-label="Gato e cachorro"><img src={level.composition.images[0]} alt="Gato" /><img src={level.composition.images[1]} alt="Cachorro" /></span> : <img src={level.image} alt={`Imagem para montar: ${level.label.toLowerCase()}`} width="300" height="300" />}<div><h2 id="puzzle-word">Monte a {level.label}</h2><div className="puzzle-reference-meta"><span>{layout.pieces.length} peças</span><button type="button" className="puzzle-action" onClick={speak}><SpeakerIcon />Ouvir palavra</button></div></div><div className="puzzle-scene" aria-hidden="true"><img src={puzzleScene} alt="" /></div></div>
      <p className="puzzle-instructions">Selecione uma peça e depois um espaço. Para trocar, selecione duas peças do tabuleiro.</p>
      <div className="puzzle-work">
        <section aria-labelledby="puzzle-board-title"><h2 id="puzzle-board-title">Tabuleiro</h2>
          <div className="puzzle-board" data-solved={solved}>
            {layout.board.map((id, index) => <button type="button" key={index} data-slot={index} className={`puzzle-slot${selected && id === selected ? ' puzzle-piece--selected' : ''}${hintIndex === index ? ' puzzle-slot--hint' : ''}${hint && id === hint ? ' puzzle-piece--hint' : ''}`}
              aria-label={`${selected ? 'Colocar peça no espaço' : id ? 'Selecionar peça no espaço' : 'Espaço vazio:'} ${positionName(level, index)}`}
              aria-pressed={Boolean(id && id === selected)} aria-disabled={solved} onClick={() => place(index)}>
              {id && <PuzzleFragment level={level} piece={layout.pieces.find(piece => piece.id === id)} />}
              {!id && <span className="puzzle-empty">{index + 1}</span>}
              {!solved && id && <span className="puzzle-number">Peça {layout.pieces.find(piece => piece.id === id).index + 1}</span>}
              {!solved && selected && id === selected && <span className="puzzle-badge">Selecionada</span>}
              {hintIndex === index && <span className="puzzle-badge">Pista: espaço</span>}
            </button>)}
          </div>
        </section>
        {!solved && <section aria-labelledby="puzzle-tray-title"><h2 id="puzzle-tray-title">Peças para montar</h2>
          <div className="puzzle-tray">{layout.tray.map((id, index) => id ? <button type="button" key={index} ref={index === 0 ? firstTrayButton : undefined} data-piece={id} className={`puzzle-piece${selected === id ? ' puzzle-piece--selected' : ''}${hint === id ? ' puzzle-piece--hint' : ''}`} aria-label={`Selecionar peça ${layout.pieces.find(piece => piece.id === id).index + 1}`} aria-pressed={selected === id} onClick={() => choose(id)}>
            <PuzzleFragment level={level} piece={layout.pieces.find(piece => piece.id === id)} /><span className="puzzle-number">Peça {layout.pieces.find(piece => piece.id === id).index + 1}</span>
            {(selected === id || hint === id) && <span className="puzzle-badge">{selected === id ? 'Selecionada' : 'Pista: peça'}</span>}
          </button> : <div key={index} className="puzzle-tray-empty" aria-hidden="true" />)}</div>
          {layout.tray.every(id => !id) && <p>Selecione uma peça do tabuleiro para trocar.</p>}
          <div className="puzzle-controls"><button type="button" className="puzzle-action" onClick={help}>Preciso de ajuda</button><button type="button" className="puzzle-action" onClick={restart}>Reiniciar</button></div>
        </section>}
      </div>
      <p className="puzzle-status" role="status">{solved ? '' : message}</p>
      <div className="puzzle-feedback" role="status">{full && !solved && 'Quase! Você pode trocar as peças.'}</div>
      {solved && <section className="puzzle-success" aria-labelledby="puzzle-success-title"><h2 id="puzzle-success-title" ref={successHeading} tabIndex={-1}>Muito bem!</h2><p>Você completou {level.label}.</p>{level.composition ? <span className="puzzle-success-composition"><img src={level.composition.images[0]} alt="Gato" /><img src={level.composition.images[1]} alt="Cachorro" /></span> : <img src={level.image} alt={`${level.label} completa`} width="300" height="300" />}<div className="puzzle-actions"><button type="button" className="puzzle-action" onClick={speak}><SpeakerIcon />Ouvir palavra</button><button type="button" className="puzzle-action" onClick={restart}>Jogar novamente</button></div></section>}
      <p className="puzzle-status" role="status">{audioMessage}</p>
    </section>
    </div>
    </>}
    <footer className="puzzle-credit">Pictogramas: {pictogramCredit.author} · <a href={pictogramCredit.source}>ARASAAC</a> · {pictogramCredit.owner} · <a href={pictogramCredit.licenseUrl}>{pictogramCredit.license}</a></footer>
  </main>
}
