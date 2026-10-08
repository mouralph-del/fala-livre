import './Learn.css'
import ActivityIllustration from '../components/ActivityIllustration'
import { PremiumBadge } from '../components/PremiumAccess'
import { planAccess } from '../services/planAccess'
import book from '../assets/pictograms/arasaac/livro.png'
import notebook from '../assets/memory/caderno.png'
import backpack from '../assets/memory/mochila.png'
import help from '../assets/pictograms/arasaac/ajuda.png'

const contextualImages = { communicate: help, words: book, write: notebook, myDay: backpack }

function LearningScenery() {
  return <div className="learn-scenery" aria-hidden="true">
    <svg viewBox="0 0 1440 900" preserveAspectRatio="none" focusable="false">
      <path fill="#83D6F7" d="M0 0H1440V900H0Z" />
      <g fill="#FFF" opacity=".8"><path d="M0 100Q35 40 75 100Q140 65 160 140H0Z" /><path d="M1180 110Q1210 40 1250 100Q1320 65 1360 140H1180Z" /></g>
      <path fill="#A1D4BD" d="M0 340Q190 220 400 365T840 330T1440 350V900H0Z" />
      <path fill="#ABD67D" d="M0 450Q180 310 340 490T850 520Q1170 320 1440 460V900H0Z" />
      <path fill="#FFF0CA" d="M600 480Q1150 500 1040 670T700 900H230Q740 760 720 650T600 480Z" />
      <g fill="#6DB497"><path d="M0 900V690Q35 590 65 710Q135 630 125 755Q210 740 160 815L220 900Z" /><path d="M1440 900V670Q1400 570 1370 700Q1300 635 1300 755Q1220 725 1260 825L1220 900Z" /></g>
    </svg>
    <span className="learn-scenery-books"><LearningIllustration activity="words" /></span>
    <span className="learn-scenery-character"><ActivityIllustration variant="learn" /></span>
  </div>
}

const activityRoutes = { communicate: '/aprender/comunicar', words: '/aprender/palavras-frases', write: '/aprender/escrever', myDay: '/aprender/meu-dia-a-dia' }

const activities = [
  { id: 'communicate', feature: 'communication', title: 'COMUNICAR', description: 'Expresse desejos, necessidades e ideias.', tone: 'blue' },
  { id: 'words', feature: 'words', title: 'PALAVRAS E FRASES', description: 'Aprenda palavras e construa pequenas frases.', tone: 'green' },
  { id: 'write', feature: 'writing', title: 'ESCREVER', description: 'Pratique a escrita do seu jeito.', detail: 'Teclado ou caderno', tone: 'green' },
  { id: 'myDay', feature: 'myDay', title: 'MEU DIA A DIA', description: 'Aprenda rotinas, comunicação e emoções em situações do cotidiano.', tone: 'green' },
]

function LearningIllustration({ activity }) {
  return (
    <svg className="learning-illustration" viewBox="0 0 100 90" fill="none" aria-hidden="true" focusable="false">
      <path d="M10 49C6 23 28 8 52 10c30 1 45 20 38 46-7 25-35 30-57 21C19 72 12 61 10 49Z" fill="currentColor" opacity=".09" />
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {activity === 'communicate' && <><path d="M35 38h37q9 0 9 9v24l-12-7H45q-10 0-10-10Z" fill="#FFFFFF" /><path d="M20 20h39q10 0 10 10v21q0 10-10 10H37L23 72V60q-9-2-9-11V30q0-10 6-10Z" fill="#FFFFFF" /><path d="M29 36h24M29 46h16" /></>}
        {activity === 'words' && <><rect x="17" y="19" width="42" height="49" rx="9" fill="#FFFFFF" transform="rotate(-8 38 44)" /><rect x="47" y="38" width="36" height="36" rx="8" fill="#FFFFFF" /><path d="m27 52 9-22 9 22m-15-7h12M58 49h12m-12 8h15m-15 8h9" /></>}
        {activity === 'write' && <><path d="M18 28q15-6 31 2 16-8 32-2v43q-17-4-32 3-15-7-31-3Z" fill="#FFFFFF" /><path d="M49 32v39M26 43h13m-13 9h13m-13 9h13" /><path d="m54 52 17-35q3-5 8-2l3 2q4 2 1 7L66 59l-13 8Z" fill="#DDEAE5" /><path d="m69 22 11 6M54 52l12 7" /></>}
        {(activity === 'routine' || activity === 'myDay') && <><path d="m14 44 36-28 36 28M23 39v34h54V39" fill="#FFFFFF" /><path d="M42 73V52h17v21" /><rect x="31" y="39" width="9" height="9" rx="2" /><path d="M63 21v-7h11v15" /></>}
      </g>
    </svg>
  )
}

export default function Learn({ access = planAccess, onPremiumRequest }) {
  return (
    <main id="conteudo" className="learn-page learn-reference" tabIndex={-1}>
      <LearningScenery />
      <a className="learn-back" href="#/">← Início</a>
      <section className="learn-intro" aria-labelledby="learn-title">
        <h1 id="learn-title">O que vamos aprender hoje?</h1>
        <p>Escolha uma atividade para começar.</p>
      </section>
      <div className="learning-grid">
        {activities.map(({ id, feature, title, description, detail, tone }) => (
          <article className={`learning-card learning-card--${tone}`} data-activity={id} key={id}>
            {contextualImages[id] && <img className="learning-context-image" src={contextualImages[id]} alt="" width="160" height="160" decoding="async" />}
            <div className="learning-content">
              <LearningIllustration activity={id} />
              <h2><span className="learning-title-desktop">{title}</span><span className="learning-title-mobile">{title === 'PALAVRAS E FRASES' ? <>PALAVRAS<span className="learning-title-line"> E FRASES</span></> : title === 'SITUAÇÕES DO DIA A DIA' ? <>SITUAÇÕES<span className="learning-title-line"> DO DIA A DIA</span></> : title === 'MEU DIA A DIA' ? <>MEU<span className="learning-title-line"> DIA A DIA</span></> : title}</span></h2>
              {!access.canAccess(feature) && <PremiumBadge />}
              <p>{description}</p>
              {detail && <span className="learning-detail">{detail}</span>}
              <button className="learning-start" type="button" aria-label={"Começar: " + title.toLowerCase() + (!access.canAccess(feature) ? ' — Premium' : '')} onClick={() => {
                if (!access.canAccess(feature)) { onPremiumRequest?.(feature); return }
                window.location.hash = activityRoutes[id]
              }}>
                Começar <span aria-hidden="true">→</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}



