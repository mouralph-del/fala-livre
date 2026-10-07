import './App.css'
import officialLogo from './assets/illustrations/fala-livre-logo.png'

import ActivityIllustration from './components/ActivityIllustration'
import HeaderNavigation from './components/HeaderNavigation'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Learn from './pages/Learn'
import MyProgress from './pages/MyProgress'
import ResponsibleGuidance from './pages/ResponsibleGuidance'
import Communication from './pages/Communication'
import Profile from './pages/Profile'
import AccountAccess from './pages/AccountAccess'
import AvailableGames from './pages/Games'
import { games } from './data/games'
import DailySituations from './pages/DailySituations'
import Writing from './pages/Writing'
import EducationalKeyboard from './pages/EducationalKeyboard'
import Notebook from './pages/Notebook'
import WordsAndPhrases from './pages/WordsAndPhrases'
import MyDay from './pages/MyDay'
import MyDayEmotions from './pages/MyDayEmotions'
import SequenceGame from './pages/SequenceGame'
import InteractiveSituationsGame from './pages/InteractiveSituationsGame'
import './visualIdentity.css'
import './dynamicLayout.css'
import './navigationActions.css'
import './childEntry.css'
import './playfulSurfaces.css'
import './ambientSurfaces.css'
import { getGameTimeTracker, startGameTimeTracking } from './utils/gameTime'

function subscribeToRoute(callback) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

function getRoute() {
  if (window.location.hash === '#/entrar') return 'signIn'
  if (window.location.hash === '#/criar-conta') return 'createAccount'
  const game = games.find(item => item.route === window.location.hash)
  if (game) return 'games/' + game.id
  if (window.location.hash === '#/jogar') return 'games'
  if (window.location.hash === '#/aprender/meu-dia-a-dia') return 'myDay'
  if (window.location.hash === '#/aprender/meu-dia-a-dia/rotinas') return 'myDayRoutines'
  if (window.location.hash === '#/aprender/meu-dia-a-dia/comunicacao') return 'myDayCommunication'
  if (window.location.hash === '#/aprender/meu-dia-a-dia/emocoes') return 'myDayEmotions'
  if (window.location.hash === '#/aprender/situacoes') return 'situations'
  if (window.location.hash === '#/aprender/escrever') return 'writing'
  if (window.location.hash === '#/aprender/escrever/teclado') return 'keyboard'
  if (window.location.hash === '#/aprender/escrever/caderno') return 'notebook'
  if (window.location.hash === '#/aprender/palavras-frases') return 'words'
  if (window.location.hash === '#/meu-progresso') return 'progress'
  if (window.location.hash === '#/responsaveis') return 'responsibleGuidance'
  if (window.location.hash === '#/perfil') return 'profile'
  if (window.location.hash === '#/aprender/comunicar') return 'communication'
  return window.location.hash === '#/aprender' ? 'learn' : 'home'
}

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === 'activities' && <><path d="M3 21h18" /><rect x="4" y="12" width="4" height="9" rx="1" /><rect x="10" y="7" width="4" height="14" rx="1" /><rect x="16" y="3" width="4" height="18" rx="1" /></>}
      {name === 'points' && <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z" />}
      {name === 'award' && <><path d="M7 3h10v6a5 5 0 0 1-10 0Z" fill="#E5C878" /><path d="M7 5H3v3a4 4 0 0 0 4 4M17 5h4v3a4 4 0 0 1-4 4M12 14v5M8 21h8M9 19h6" /></>}
      {name === 'growth' && <><path d="M12 21V11M12 16C5 16 3 12 3 7c6 0 9 3 9 9ZM12 12c0-6 3-9 9-9 0 6-3 9-9 9Z" /></>}
      {name === 'profile' && <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>}
    </svg>
  )
}

function Brand() {
  return (
    <div className="brand">
      <img className="brand-logo" src={officialLogo} alt="Fala Livre — Comunicar, Aprender e Conectar" width="2043" height="770" />
    </div>
  )
}

function ActivityCard({ title, description, variant, action }) {
  return (
    <article className={`activity-card activity-card--${variant}`}>
      <ActivityIllustration variant={variant} />
      <div className="activity-content">
        <h2>{title}</h2>
        <p>{description}</p>
        <button className="start-button" type="button" aria-label={variant === 'learn' ? 'Começar a aprender' : 'Começar a jogar'} onClick={() => { window.location.hash = variant === 'learn' ? '/aprender' : '/jogar' }}>
          {action} <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  )
}

function App() {
  const route = useSyncExternalStore(subscribeToRoute, getRoute)
  const timer = getGameTimeTracker()
  const gameTime = useSyncExternalStore(timer.subscribe, timer.getSnapshot)
  useEffect(startGameTimeTracking, [])
  useEffect(() => {
    if (gameTime.exhausted && (route === 'games' || route.startsWith('games/'))) document.getElementById('conteudo')?.focus({ preventScroll: true })
  }, [gameTime.exhausted, route])
  const previousRoute = useRef(route)
  const [transitionDismissed, setTransitionDismissed] = useState(false)

  useEffect(() => {
    document.title = route === 'signIn' ? 'Entrar | Fala Livre' : route === 'createAccount' ? 'Criar conta | Fala Livre' : route === 'responsibleGuidance' ? 'Responsáveis | Fala Livre' : route === 'progress' ? 'Meu Progresso | Fala Livre' : route === 'games' ? 'Jogar | Fala Livre' : route.startsWith('games/') ? games.find(item => item.id === route.slice(6)).pageTitle + ' | Fala Livre' : route === 'situations' ? 'Situações do dia a dia | Fala Livre' : route === 'writing' ? 'Escrever | Fala Livre' : route === 'keyboard' ? 'Teclado educativo | Fala Livre' : route === 'notebook' ? 'Meu caderno | Fala Livre' : route === 'words' ? 'Palavras e frases | Fala Livre' : route === 'profile' ? 'Configurações | Fala Livre' : route === 'communication' ? 'Comunicar | Fala Livre' : route === 'learn' ? 'Aprender | Fala Livre' : route === 'myDay' ? 'Meu Dia a Dia | Fala Livre' : route === 'myDayRoutines' ? 'Rotinas | Fala Livre' : route === 'myDayCommunication' ? 'Comunicação | Fala Livre' : route === 'myDayEmotions' ? 'Emoções | Fala Livre' : 'Fala Livre'
    if (route !== previousRoute.current) {
      window.scrollTo(0, 0)
      document.getElementById('conteudo')?.focus({ preventScroll: true })
    }
    previousRoute.current = route
  }, [route])

  return (
    <>
      <a className="skip-link" href="#conteudo" onClick={(event) => { event.preventDefault(); document.getElementById('conteudo')?.focus() }}>Pular para o conteúdo</a>
      <header className="app-header">
        <div className="header-content">
          <Brand />
          <HeaderNavigation route={route} />
        </div>
      </header>
      <div className="home-surround">
        <div className="home-decoration" aria-hidden="true">
          <div className="page-sprinkles" />
          <span />
          <i className="decor-motif decor-book" />
          <i className="decor-motif decor-puzzle" />
          <i className="decor-motif decor-bubble" />
          <i className="decor-motif decor-plant" />
        </div>
        {route === 'signIn' || route === 'createAccount' ? <AccountAccess key={route} mode={route === 'signIn' ? 'sign-in' : 'create'} /> : route === 'responsibleGuidance' ? <ResponsibleGuidance /> : route === 'progress' ? <MyProgress transitionDismissed={transitionDismissed} onDismissTransition={() => setTransitionDismissed(true)} /> : route === 'games' || route.startsWith('games/') ? <Games gameId={route.slice(6)} /> : route === 'situations' ? <DailySituations /> : route === 'writing' ? <Writing /> : route === 'keyboard' ? <EducationalKeyboard /> : route === 'notebook' ? <Notebook /> : route === 'words' ? <WordsAndPhrases /> : route === 'profile' ? <Profile /> : route === 'communication' ? <Communication /> : route === 'learn' ? <Learn /> : route === 'myDay' ? <MyDay /> : route === 'myDayRoutines' ? <SequenceGame embedded /> : route === 'myDayCommunication' ? <InteractiveSituationsGame embedded continuous /> : route === 'myDayEmotions' ? <MyDayEmotions /> : <main id="conteudo" className="home" tabIndex={-1}>
          <section className="welcome" aria-labelledby="welcome-title">
            <h1 id="welcome-title">Olá!</h1>
            <p>O que você gostaria de fazer hoje?</p>
          </section>
          <div className="activity-grid">
            <ActivityCard title="APRENDER" description={<>Comunicação, palavras<br />e escrita para o dia a dia.</>} variant="learn" action="Começar" />
            <ActivityCard title="JOGAR" description={<>Jogos e atividades<br />divertidas para aprender.</>} variant="play" action="Jogar" />
          </div>

          <section className="progress" aria-labelledby="progress-title">
            <div className="section-heading">
              <h2 id="progress-title"><Icon name="activities" />Meu Progresso</h2>
            </div>
            <div className="progress-entry"><p>Veja as atividades registradas neste navegador.</p><a className="navigation-action navigation-action--primary" href="#/meu-progresso">Ver meu progresso</a></div>
          </section>
          <p className="positive-message"><Icon name="growth" /><span>Cada pequeno passo é uma grande conquista!</span></p>
        </main>}
      </div>
    </>
  )
}

function Games({ gameId }) {
  const tracker = getGameTimeTracker()
  const { exhausted } = useSyncExternalStore(tracker.subscribe, tracker.getSnapshot)
  if (!exhausted) return <AvailableGames gameId={gameId} />
  return <main id="conteudo" className="profile-page" tabIndex={-1}>
    <section className="profile-section game-time-ended">
      <h1>Tempo de jogos</h1>
      <p role="status">O tempo de jogos de hoje terminou. Você ainda pode usar a área Aprender.</p>
      <a className="profile-action" href="#/aprender">Ir para Aprender</a>
    </section>
  </main>
}

export default App



