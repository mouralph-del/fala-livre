import './MyDay.css'

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
    description: 'Reconheça emoções e conheça formas de lidar com elas.',
    route: '/aprender/meu-dia-a-dia/emocoes',
    pending: true,
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

export function MyDayEmotions() {
  return <main id="conteudo" className="my-day-page" tabIndex={-1}>
    <a className="my-day-back" href="#/aprender/meu-dia-a-dia">← Meu Dia a Dia</a>
    <section className="my-day-emotions" aria-labelledby="my-day-emotions-title">
      <h1 id="my-day-emotions-title">Emoções</h1>
      <p>Reconheça emoções e conheça formas de lidar com elas.</p>
      <span className="my-day-pending" role="status">Em preparação</span>
    </section>
  </main>
}
