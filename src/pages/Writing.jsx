import './Writing.css'

export default function Writing() {
  return <main id="conteudo" className="writing-page" tabIndex={-1}>
    <a className="writing-back" href="#/aprender">← Aprender</a>
    <header className="writing-intro"><h1>Escrever</h1><p>Escolha o jeito de praticar.</p></header>
    <div className="writing-modes">
      <article>
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="10" width="42" height="28" rx="5"/><path d="M10 18h4m6 0h4m6 0h7M10 25h4m6 0h4m6 0h7M13 32h22"/></svg>
        <h2>TECLADO EDUCATIVO</h2>
        <p>Use letras grandes, ouça cada letra e escreva a palavra CASA.</p>
        <a className="writing-action" href="#/aprender/escrever/teclado" aria-label="Abrir teclado educativo">Abrir teclado →</a>
      </article>
      <article>
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 6h26v36H9zM5 13h8M5 23h8M5 33h8M20 30l3-9L38 6l5 5-15 15zM23 21l5 5"/></svg>
        <h2>CADERNO</h2>
        <p>Escreva, desenhe e experimente lápis, marcador, giz e borracha.</p>
        <a className="writing-action" href="#/aprender/escrever/caderno" aria-label="Abrir caderno">Abrir caderno →</a>
      </article>
    </div>
  </main>
}
