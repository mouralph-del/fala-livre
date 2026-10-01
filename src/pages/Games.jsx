import { games } from '../data/games'
import GamePlaceholder from './GamePlaceholder'
import PathGame from './PathGame'
import PuzzleGame from './PuzzleGame'
import WordSearchGame from './WordSearchGame'
import MemoryGame from './MemoryGame'
import FindImageGame from './FindImageGame'
import BingoGame from './BingoGame'
import WhereBelongsGame from './WhereBelongsGame'
import SequenceGame from './SequenceGame'
import InteractiveSituationsGame from './InteractiveSituationsGame'
import './Games.css'

function GameIcon({ name }) {
  return <svg className="game-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'association' && <><circle cx="16" cy="15" r="9" fill="white" /><path d="M29 15h15v16m-6-6 6 6 6-6" /><rect x="24" y="38" width="32" height="20" rx="4" fill="#E7F3EC" /><path d="M24 44h32M36 50h8" /></>}
    {name === 'conversation' && <><path d="M8 7h30a6 6 0 0 1 6 6v15a6 6 0 0 1-6 6H20L8 43V13a6 6 0 0 1 0-6Z" fill="white" /><path d="M30 37v7a6 6 0 0 0 6 6h10l10 8V29a6 6 0 0 0-6-6M17 17h18M17 24h12" /></>}
    {name === 'sequence' && <><rect x="5" y="7" width="22" height="18" rx="4" fill="white" /><rect x="37" y="39" width="22" height="18" rx="4" fill="#E7F3EC" /><path d="M33 16h15v16m-5-5 5 5 5-5M11 16h10M43 48h10" /></>}
    {name === 'bingo' && <><rect x="7" y="7" width="50" height="50" rx="7" fill="white" /><path d="M24 7v50M40 7v50M7 24h50M7 40h50" /><path d="m12 15 4 4 6-8m5 20 4 4 6-8m6 20 4 4 6-8" stroke="#166562" /></>}
    {name === 'path' && <><path d="M12 52h26a9 9 0 0 0 0-18H24a9 9 0 0 1 0-18h13" strokeDasharray="4 5" /><circle cx="12" cy="52" r="5" fill="white" /><path d="M48 31S37 20 37 14a11 11 0 0 1 22 0c0 6-11 17-11 17Z" fill="white" /><circle cx="48" cy="14" r="3" /></>}
    {name === 'puzzle' && <><path d="M10 12h17V9a6 6 0 0 1 12 0v3h15v17h-3a6 6 0 0 0 0 12h3v13H39v-3a6 6 0 0 0-12 0v3H10V39h3a6 6 0 0 0 0-12h-3Z" fill="white" /></>}
    {name === 'letters' && <><rect x="5" y="6" width="42" height="47" rx="7" fill="white" /><path d="m13 25 5-11 5 11m-8-4h6M30 15h8m-8 8h8M13 34h9m-9 9h9" /><circle cx="43" cy="39" r="12" fill="#E7F3EC" /><path d="m52 48 8 10M39 39h8" /></>}
    {name === 'memory' && <><rect x="7" y="8" width="32" height="42" rx="7" fill="white" /><rect x="25" y="16" width="32" height="42" rx="7" fill="#E7F3EC" /><path d="m41 27 8 10-8 10-8-10Z" /></>}
    {name === 'find-image' && <><rect x="6" y="8" width="42" height="40" rx="6" fill="white" /><circle cx="18" cy="20" r="4" /><path d="m10 40 12-12 8 8" /><circle cx="43" cy="40" r="12" fill="#E7F3EC" /><path d="m52 49 8 9" /></>}
  </svg>
}

// All game routes enter here; a future games-only limit can wrap this area.
export default function Games({ gameId }) {
  if (gameId === 'caminho') return <PathGame />
  if (gameId === 'quebra-cabeca') return <PuzzleGame />
  if (gameId === 'caca-palavras') return <WordSearchGame />
  if (gameId === 'memoria') return <MemoryGame />
  if (gameId === 'encontre-imagem') return <FindImageGame />
  if (gameId === 'bingo') return <BingoGame />
  if (gameId === 'onde-pertence') return <WhereBelongsGame />
  if (gameId === 'sequencias') return <SequenceGame />
  if (gameId === 'situacoes-interativas') return <InteractiveSituationsGame />
  const game = games.find(item => item.id === gameId)
  if (game) return <GamePlaceholder game={game} />
  return <main id="conteudo" className="games-page" tabIndex={-1}>
    <a className="games-back" href="#/">← Início</a>
    <header className="games-intro"><h1>Vamos jogar!</h1><p>Escolha uma atividade para começar.</p></header>
    <div className="games-grid">{games.filter(item => item.visible !== false).map(item => <article className={`game-card game-card--${item.tone}`} key={item.id}>
      <GameIcon name={item.icon} />
      <h2>{item.title}</h2><p>{item.description}</p>
      <a className="game-start" href={item.route} aria-label={`Jogar: ${item.pageTitle}`}>Jogar <span aria-hidden="true">→</span></a>
    </article>)}</div>
  </main>
}
