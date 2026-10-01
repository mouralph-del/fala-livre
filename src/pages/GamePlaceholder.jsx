export default function GamePlaceholder({ game }) {
  return <main id="conteudo" className="games-page" tabIndex={-1}>
    <a className="games-back" href="#/jogar">← Jogos</a>
    <header className="games-intro"><h1>{game.pageTitle}</h1><p>Estamos preparando este jogo.</p></header>
  </main>
}
