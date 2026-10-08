import { useState, useSyncExternalStore } from 'react'
import { getCurrentPlan, premiumOffers } from '../services/planAccess'
import { subscribeSession } from '../services/accountAccess'
import './Plans.css'

const money = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Plans() {
  const plan = useSyncExternalStore(subscribeSession, getCurrentPlan)
  const [billing, setBilling] = useState('annual')
  const [message, setMessage] = useState('')
  const offer = premiumOffers[billing]
  return <main id="conteudo" className="plans-page" tabIndex={-1}>
    <a className="navigation-return" href="#/">← Início</a>
    <header className="plans-intro">
      <h1>Planos do Fala Livre</h1>
      <p>Escolha a opção que combina melhor com sua família.</p>
      {plan === 'premium-demo' && <p>Acesso Premium de demonstração — permissão local, sem assinatura ou cobrança.</p>}
    </header>
    <div className="plans-grid">
      <section className="plan-card" aria-labelledby="free-title">
        <h2 id="free-title">Fala Livre Gratuito</h2>
        <p className="plan-price">R$ 0</p>
        <p>Comunicar e Escrever são formas fundamentais de expressão. Use essas áreas sem assinatura.</p>
        <ul>
          <li>Comunicar</li>
          <li>Escrever</li>
          <li>Meu Progresso referente ao conteúdo disponível</li>
          <li>Configurações essenciais e acessibilidade: tamanho Normal/Grande e Reduzir movimentos</li>
          <li>Seleção das vozes disponíveis no dispositivo</li>
        </ul>
        <div className="plan-free-actions">
          <a className="navigation-action" href="#/aprender/comunicar">Comunicar</a>
          <a className="navigation-action" href="#/aprender/escrever">Escrever</a>
        </div>
      </section>
      <section className="plan-card plan-card--premium" aria-labelledby="premium-title">
        <h2 id="premium-title">Fala Livre Premium</h2>
        <p>Amplie a experiência com aprendizagem estruturada, atividades do cotidiano e jogos.</p>
        <div className="plan-billing" role="group" aria-label="Opção de cobrança">
          {['monthly', 'annual'].map(value => <button key={value} type="button" aria-pressed={billing === value}
            onClick={() => setBilling(value)}>
            {value === 'monthly' ? 'Mensal' : 'Anual'}{billing === value && <span aria-hidden="true"> ✓</span>}
          </button>)}
        </div>
        <div className="plan-pricing" aria-live="polite" aria-atomic="true">
          <p className="plan-price">{money(offer.priceCents)}<span>/{offer.period}</span></p>
          {billing === 'annual' && <p className="plan-savings">Equivale a aproximadamente {money(premiumOffers.annual.priceCents / 12)}/mês.<br />Economize {money(premiumOffers.monthly.priceCents * 12 - premiumOffers.annual.priceCents)} no ano, em comparação com 12 mensalidades de {money(premiumOffers.monthly.priceCents)}.</p>}
        </div>
        <ul>
          <li>Tudo do Gratuito</li>
          <li>Palavras e Frases</li>
          <li>Meu Dia a Dia: Rotinas, Comunicação e Emoções</li>
          <li>Todos os 6 jogos e seus 18 níveis</li>
          <li>Acompanhamento dos conteúdos liberados no Meu Progresso</li>
          <li>Recursos Premium adicionais, conforme disponibilizados</li>
        </ul>
        <button className="plan-choose" type="button" onClick={() => setMessage('A contratação online estará disponível em breve.')}>Escolher Premium</button>
        <p className="plan-status" role="status">{message}</p>
      </section>
    </div>
  </main>
}
