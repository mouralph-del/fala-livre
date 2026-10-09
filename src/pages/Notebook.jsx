import WritingPractice from '../components/WritingPractice'
import DrawingCanvas from '../components/DrawingCanvas'
import './Writing.css'

export default function Notebook() {
  return <main id="conteudo" className="writing-page" tabIndex={-1}>
    <a className="writing-back" href="#/aprender/escrever">← Escrever</a>
    <header className="writing-intro"><h1>Meu caderno</h1><p>Escreva ou desenhe do seu jeito.</p></header>
    <WritingPractice notebook />
    <section className="writing-work" aria-label="Caderno de prática livre"><DrawingCanvas /></section>
    <a className="writing-action" href="#/aprender/escrever">Voltar a Escrever</a>
  </main>
}
