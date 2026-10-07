import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { getCurrentSession, signOut, subscribeSession } from '../services/accountAccess'

export default function HeaderNavigation({ route }) {
  const [open, setOpen] = useState(false)
  const session = useSyncExternalStore(subscribeSession, getCurrentSession)
  const container = useRef(null)
  const trigger = useRef(null)
  useEffect(() => {
    if (!open) return
    const outside = event => { if (!container.current?.contains(event.target)) setOpen(false) }
    const escape = event => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current?.focus() }
    }
    const navigate = () => setOpen(false)
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    window.addEventListener('hashchange', navigate)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
      window.removeEventListener('hashchange', navigate)
    }
  }, [open])
  return <div className="header-actions">
    <div className="header-menu" ref={container} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
    }}>
      <button ref={trigger} type="button" className="header-menu-toggle" aria-label="Menu de navegação"
        aria-expanded={open} aria-controls="header-navigation" onClick={() => setOpen(value => !value)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <nav id="header-navigation" className="header-navigation header-popover" aria-label="Navegação principal" hidden={!open}>
        <span className="header-menu-label">Explorar</span>
        <a href="#/meu-progresso" aria-current={route === 'progress' ? 'page' : undefined} onClick={() => setOpen(false)}>Meu Progresso</a>
        <a href="#/perfil" aria-current={route === 'profile' ? 'page' : undefined} onClick={() => setOpen(false)}>Configurações</a>
        <a href="#/responsaveis" aria-current={route === 'responsibleGuidance' ? 'page' : undefined} onClick={() => setOpen(false)}>Responsáveis / Sobre o Fala Livre</a>
        <a href="#/planos" aria-current={route === 'plans' ? 'page' : undefined} onClick={() => setOpen(false)}>Planos</a>
        <div className="header-account-section">
          <span className="header-menu-label">{session ? 'Responsável' : 'Conta do responsável'}</span>
          {session && <span className="header-account-name">{session.responsibleName}</span>}
          {session ? <button type="button" className="header-sign-out" onClick={() => {
            signOut(); setOpen(false); trigger.current?.focus()
          }}>Sair</button> : <>
          <a href="#/entrar" aria-current={route === 'signIn' ? 'page' : undefined} onClick={() => setOpen(false)}>Entrar</a>
          <a href="#/criar-conta" aria-current={route === 'createAccount' ? 'page' : undefined} onClick={() => setOpen(false)}>Criar conta</a>
          </>}
        </div>
      </nav>
    </div>
  </div>
}
