import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { activatePremiumDemonstration, getCurrentSession, subscribeSession } from '../services/accountAccess'
import { getPublicPaymentDemoUrl } from '../utils/publicAppUrl'
import './DemoCheckout.css'

export function PaymentDemoInfo() {
  return <main id="conteudo" className="plans-page payment-demo-page" tabIndex={-1}>
    <section className="demo-checkout demo-confirmation" aria-labelledby="payment-demo-title">
      <svg className="demo-confirmation-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle cx="24" cy="24" r="22" fill="currentColor" /><path d="m13 24 7 7 15-15" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <h1 id="payment-demo-title">Pagamento simulado com sucesso!</h1>
      <p>Esta é uma demonstração acadêmica. Nenhum pagamento real foi realizado.</p>
      <p>Escanear o QR Code não libera Premium automaticamente nem altera a sessão. A liberação acontece somente pelo botão de simulação no dispositivo original.</p>
      <p>Não existe cobrança, transferência Pix ou assinatura real conectada.</p>
      <a className="navigation-action navigation-action--primary" href="#/planos">Voltar ao Fala Livre</a>
    </section>
  </main>
}

function DemoQr({ url }) {
  const { modules } = QRCode.create(url, { errorCorrectionLevel: 'M' })
  const size = modules.size + 8
  const cells = []
  for (let y = 0; y < modules.size; y++) for (let x = 0; x < modules.size; x++) {
    if (modules.get(y, x)) cells.push(`M${x + 4} ${y + 4}h1v1h-1z`)
  }
  return <svg className="demo-qr" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="QR Code: abrir informações da demonstração acadêmica" shapeRendering="crispEdges">
    <rect width={size} height={size} fill="white" /><path d={cells.join('')} fill="black" />
  </svg>
}

export default function DemoCheckout({ billing, offer, onBack }) {
  const [stage, setStage] = useState('ready')
  const heading = useRef(null)
  const timer = useRef(null)
  const pending = useRef(false)
  const url = getPublicPaymentDemoUrl(import.meta.env.VITE_PUBLIC_APP_URL, window.location.origin)
  useEffect(() => { heading.current?.focus(); return () => window.clearTimeout(timer.current) }, [])
  useEffect(() => subscribeSession(() => {
    if (pending.current && !getCurrentSession()) {
      window.clearTimeout(timer.current)
      pending.current = false
      setStage('ready')
    }
  }), [])
  function simulate() {
    if (pending.current) return
    pending.current = true
    setStage('processing')
    timer.current = window.setTimeout(() => {
      activatePremiumDemonstration()
      setStage('approved')
      heading.current?.focus()
    }, 650)
  }
  return <section className="demo-checkout" aria-labelledby="demo-checkout-title">
    <h2 id="demo-checkout-title" ref={heading} tabIndex={-1}>{stage === 'approved' ? 'Pagamento simulado com sucesso!' : 'Contratação demonstrativa'}</h2>
    <p><strong>Premium {billing === 'monthly' ? 'Mensal' : 'Anual'}</strong> — {(offer.priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/{offer.period}</p>
    <p className="plan-demo-note">Demonstração acadêmica: não há cobrança ou assinatura real. Não envie dinheiro.</p>
    {stage === 'approved' ? <>
      <p role="status">Seu acesso Premium de demonstração foi liberado neste navegador.</p>
      <p>Foi utilizada a sessão demonstrativa local. Logout remove esse acesso; não existe assinatura contratada.</p>
      <a className="navigation-action navigation-action--primary" href="#/aprender">Explorar atividades Premium</a>
    </> : <>
      {url ? <>
      <DemoQr url={url} />
      <p><a className="demo-qr-link" href={url} target="_blank" rel="noopener noreferrer">Abrir informações da demonstração</a></p>
      <p className="demo-qr-address">{url}</p>
      <p>O QR Code contém somente esse endereço do Fala Livre. Em outro dispositivo, é preciso acesso ao endereço publicado; ele não altera a sessão deste navegador.</p>
      </> : <p className="plan-demo-note demo-qr-unavailable">O QR Code só poderá ser testado entre dispositivos após disponibilizar um endereço público HTTPS acessível. Nenhum QR Code local foi gerado. A simulação abaixo continua disponível neste navegador.</p>}
      <p>A simulação ativa a conta demonstrativa Alex/Noa quando não houver uma sessão demo aberta. Não solicita dados financeiros nem se comunica com bancos.</p>
      <button className="plan-choose" type="button" disabled={stage === 'processing'} onClick={simulate}>{stage === 'processing' ? 'Processando simulação local…' : 'Simular pagamento aprovado'}</button>
      <p role="status">{stage === 'processing' ? 'Preparando a demonstração local. Nenhuma comunicação com banco.' : ''}</p>
    </>}
    <button className="demo-back" type="button" onClick={onBack}>Voltar aos planos</button>
  </section>
}
