import { useState } from 'react'
import { useProgress } from '../hooks/useProgress.js'
import { getProgressSummary } from '../utils/progressSummary.js'
import { learningWords } from '../data/learningWords.js'
import { myDayRoutines } from '../data/myDayRoutines.js'
import { games } from '../data/games.js'
import './MyProgress.css'
import InterfaceIcon from '../components/InterfaceIcon'

const exerciseLabels = ['pedir água', 'pedir comida', 'pedir para brincar', 'pedir para dormir', 'pedir ajuda', 'pedir banheiro', 'expressar fome', 'expressar dor', 'recusar comida', 'recusar brincadeira']
const failures = {
  unavailable: 'Não foi possível acessar os registros salvos agora.',
  corrupt: 'Não foi possível ler os registros salvos. Eles foram mantidos sem alterações.',
  incompatible: 'Os registros salvos usam uma versão que esta aplicação não consegue ler.',
  conflict: 'Não foi possível confirmar os registros salvos agora.',
}
const transition = 'O acompanhamento de atividades começou nesta atualização. As atividades anteriores não foram registradas.'
const levelLabels = { completed: 'Concluído — pode jogar novamente', available: 'Disponível para jogar', blocked: 'Conclua o nível anterior deste jogo', unknown: 'Disponibilidade não confirmada' }

function Evidence({ value, label, completed = false }) {
  return <span className="record-fact">{label && `${label}: `}{value.recorded ? (completed ? 'Concluído' : 'Realizado') : 'Ainda sem registro'}{value.sessionOnly && <em> — Nesta sessão</em>}</span>
}
function Completion({ value }) {
  return value.recorded && <p className="record-completion">Atividade concluída{value.sessionOnly && <em> — Nesta sessão</em>}</p>
}

export default function MyProgress({ progressService, transitionDismissed = false, onDismissTransition }) {
  const { snapshot, actions } = useProgress(progressService)
  const [dismissed, setDismissed] = useState(false)
  const summary = getProgressSummary(snapshot.effectiveProgress, snapshot.persistedProgress)
  const loading = snapshot.persistenceStatus === 'not-loaded'
  const failure = failures[snapshot.status] || (!loading && snapshot.effectiveProgress && !summary.valid ? failures.corrupt : null)
  const empty = !loading && !failure && (snapshot.status === 'absent' && !snapshot.effectiveProgress || summary.valid && !summary.hasEvidence)
  const showRecords = !loading && summary.valid && summary.hasEvidence
  const c = summary.counts
  return <main id="conteudo" className="my-progress" tabIndex={-1}>
    <a className="navigation-return" href="#/">Voltar ao início</a>
    <header className="records-intro"><h1>Meu Progresso</h1>
    <p className="records-subtitle">Registros deste navegador</p>
    <p>Estes registros ficam neste navegador. Eles podem reunir atividades de mais de uma pessoa que usa este dispositivo.</p>
    </header>
    <div role="status" className="records-status">
      {loading && <p>Carregando os registros deste navegador…</p>}
      {failure && <><p>{failure}</p><button type="button" onClick={() => { void actions.loadProgress() }}>Tentar ler novamente</button></>}
      {showRecords && summary.hasSessionOnly && <p>Alguns registros estão disponíveis apenas nesta sessão e podem desaparecer ao fechar ou recarregar o navegador.</p>}
    </div>
    {empty && <section className="records-empty">
      <InterfaceIcon name="chart" className="records-empty-icon" />
      <p>Seus registros de atividades vão aparecer aqui conforme você explorar o Fala Livre.</p>
      <div className="records-links"><a className="navigation-action navigation-action--secondary" href="#/aprender">Explorar Aprender</a><a className="navigation-action navigation-action--secondary" href="#/jogar">Ver jogos</a></div>
      {!dismissed && !transitionDismissed && <aside><p>{transition}</p><button className="navigation-action navigation-action--secondary" type="button" onClick={() => { setDismissed(true); onDismissTransition?.() }}>Entendi</button></aside>}
    </section>}
    {showRecords && <>
      <section aria-labelledby="records-summary"><h2 id="records-summary">Atividades registradas</h2>
        <ul className="records-overview">
          <li>{c.wordsCompleted} de 12 atividades de Palavras e Frases concluídas</li>
          <li>{c.wordsExplored} de 12 palavras exploradas</li>
          <li>{c.writingCompleted} de 12 práticas de escrita concluídas</li>
          <li>{c.routinesCompleted} de 8 atividades de rotinas concluídas</li>
          <li>{c.communicationCompleted} de 10 exercícios de comunicação concluídos</li>
          <li>{c.levelsCompleted} de 18 níveis de jogos concluídos</li>
        </ul>
      </section>
      <details><summary>Aprender</summary>
        <h2>Comunicar</h2><Evidence value={summary.communication} label="Exploração de comunicação" /><a href="#/aprender/comunicar">Abrir Comunicar</a>
        <h2>Palavras e Frases</h2><a href="#/aprender/palavras-frases">Abrir Palavras e Frases</a>
        <ul className="record-list">{summary.words.map(item => <li key={item.id}><h3>{learningWords.find(word => word.id === item.id).word}</h3><Evidence value={item.explored} label="Conhecer" /><Evidence value={item.build} label="Reconhecer" /><Evidence value={item.sentence} label="Usar na frase" /><Completion value={item.complete} /></li>)}</ul>
        <h2>Escrever</h2><p>O registro do caderno indica que a prática foi encerrada.</p><a href="#/aprender/escrever">Abrir Escrever</a>
        <ul className="record-list">{summary.writing.map(item => <li key={item.id}><h3>{learningWords.find(word => word.id === item.id).word}</h3><Evidence value={item.typing} label="Digitar" /><Evidence value={item.notebook} label="Prática no caderno encerrada" /><Completion value={item.complete} /></li>)}</ul>
      </details>
      <details><summary>Meu Dia a Dia</summary>
        <h2>Rotinas</h2><a href="#/aprender/meu-dia-a-dia/rotinas">Abrir Rotinas</a>
        <ul className="record-list">{summary.routines.map(item => <li key={item.id}><h3>{myDayRoutines.find(routine => routine.id === item.id).title}</h3><Evidence value={item.complete} completed /></li>)}</ul>
        <h2>Exercícios de comunicação</h2><p>Estes registros são de exercícios, não de necessidades pessoais.</p><a href="#/aprender/meu-dia-a-dia/comunicacao">Abrir exercícios de comunicação</a>
        <ul className="record-list">{summary.communicationExercises.map((item, index) => <li key={item.id}><h3>Exercício: {exerciseLabels[index]}</h3><Evidence value={item.complete} completed /></li>)}</ul>
        <h2>Emoções</h2><Evidence value={summary.emotions} label="Exploração de emoções" /><a href="#/aprender/meu-dia-a-dia/emocoes">Abrir Emoções</a>
      </details>
      <details><summary>Jogos</summary>{summary.games.map(game => {
        const catalog = games.find(item => item.id === game.id)
        return <section key={game.id}><h2>{catalog.pageTitle}</h2><ul className="record-list">{game.levels.map(level => <li key={level.id}>Nível {level.number}: {levelLabels[level.status]}{level.complete.sessionOnly && <em> — Nesta sessão</em>}</li>)}</ul><a href={catalog.route}>Abrir {catalog.pageTitle}</a></section>
      })}</details>
    </>}
    <details><summary>Sobre estes registros</summary><p>Estes são registros educativos de explorações, etapas realizadas, atividades e níveis concluídos. Eles não são uma avaliação da aprendizagem nem da criança.</p><p>{transition}</p></details>
  </main>
}
