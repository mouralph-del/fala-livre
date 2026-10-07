import { useEffect, useRef } from 'react'
import './PremiumAccess.css'

export function PremiumBadge() {
  return <span className="premium-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>Premium</span>
}

export default function PremiumAccess({ feature, modal = false, onClose }) {
  const dialog = useRef(null)
  useEffect(() => {
    if (!modal) return
    const origin = document.activeElement
    const element = dialog.current
    element.showModal()
    element.querySelector('.premium-close')?.focus()
    return () => { element.close(); if (origin?.isConnected) origin.focus({ preventScroll: true }) }
  }, [modal])
  const content = <>
    <PremiumBadge />
    <h1 id="premium-access-title">{feature.title} no Fala Livre Premium</h1>
    <p>{feature.title} faz parte do Fala Livre Premium. Você pode conhecer os planos ou continuar nas atividades gratuitas.</p>
    <div className="premium-access-actions">
      <a className="navigation-action navigation-action--primary" href="#/planos" onClick={modal ? onClose : undefined}>Ver planos</a>
      {modal ? <button className="premium-close" type="button" onClick={onClose} autoFocus>Continuar aqui</button> : <a className="navigation-action" href="#/aprender">Voltar para Aprender</a>}
    </div>
  </>
  if (modal) return <dialog className="premium-dialog" ref={dialog} aria-labelledby="premium-access-title" onCancel={event => { event.preventDefault(); onClose() }} onKeyDown={event => {
    if (event.key !== 'Tab') return
    const controls = [...event.currentTarget.querySelectorAll('a[href], button:not(:disabled)')]
    const first = controls[0], last = controls[controls.length - 1]
    if ((!event.shiftKey && document.activeElement === last) || (event.shiftKey && document.activeElement === first)) {
      event.preventDefault(); (event.shiftKey ? last : first)?.focus()
    }
  }}>
    {content}
  </dialog>
  return <main id="conteudo" className="premium-access-page" tabIndex={-1}><section className="premium-access-panel" aria-labelledby="premium-access-title">{content}</section></main>
}
