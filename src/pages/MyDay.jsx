import './MyDay.css'
import InterfaceIcon from '../components/InterfaceIcon'

const options = [
  {
    id: 'rotinas',
    title: 'Rotinas',
    description: 'Organize ações do dia a dia.',
    route: '/aprender/meu-dia-a-dia/rotinas',
  },
  {
    id: 'comunicacao',
    title: 'Comunicação',
    description: 'Use pictogramas para se comunicar em diferentes situações.',
    route: '/aprender/meu-dia-a-dia/comunicacao',
  },
  {
    id: 'emocoes',
    title: 'Emoções',
    description: 'Explore sentimentos e estados e comunique o que precisa.',
    route: '/aprender/meu-dia-a-dia/emocoes',
  },
]

export default function MyDay() {
  return <main id="conteudo" className="my-day-page" tabIndex={-1}>
    <a className="my-day-back" href="#/aprender">← Aprender</a>
    <header className="my-day-intro">
      <h1>Meu Dia a Dia</h1>
      <p>Aprenda rotinas, comunicação e emoções em situações do cotidiano.</p>
    </header>

    <div className="my-day-options" aria-label="Opções de Meu Dia a Dia">
      {options.map(option => (
        <article className={`my-day-option${option.pending ? ' my-day-option--pending' : ''}`} key={option.id}>
          {option.id === 'rotinas' ? <InterfaceIcon className="learning-menu-icon" name="checklist" /> : <svg className="learning-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            {option.id === 'comunicacao' ? <path d="M5 3h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-6 4V5a2 2 0 0 1 2-2ZM7 8h10M7 12h7" /> : <path d="M12 21C-8 9 4-3 12 5c8-8 20 4 0 16Z" />}
          </svg>}
          <h2>{option.title}</h2>
          <p>{option.description}</p>
          {option.pending ? (
            <a className="my-day-pending" href={`#${option.route}`} aria-label="Emoções — Em preparação">Em preparação</a>
          ) : (
            <button type="button" className="my-day-start" aria-label={`Começar: ${option.title}`} onClick={() => { window.location.hash = option.route }}>
              Começar <span aria-hidden="true">→</span>
            </button>
          )}
        </article>
      ))}
    </div>
  </main>
}
