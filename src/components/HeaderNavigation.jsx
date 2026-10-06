import { useEffect, useRef, useState } from 'react'

export default function HeaderNavigation({ route }) {
  const [open, setOpen] = useState(false)
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
        <a href="#/meu-progresso" aria-current={route === 'progress' ? 'page' : undefined} onClick={() => setOpen(false)}>Meu Progresso</a>
        <a href="#/perfil" aria-current={route === 'profile' ? 'page' : undefined} onClick={() => setOpen(false)}>Configurações</a>
        <a href="#/responsaveis" aria-current={route === 'responsibleGuidance' ? 'page' : undefined} onClick={() => setOpen(false)}>Responsáveis / Sobre o Fala Livre</a>
      </nav>
    </div>
  </div>
}
