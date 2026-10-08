import { pictogramCredit } from '../data/communicationOptions.js'
import pictogramCredits from '../assets/pictograms/arasaac/CREDITS.md?url'
import './ResponsibleGuidance.css'
import InterfaceIcon from '../components/InterfaceIcon'
import { useState, useSyncExternalStore } from 'react'
import GameTimeSettings from '../components/GameTimeSettings'
import PwaInstallation from '../components/PwaInstallation'
import { getPreferences, subscribePreferences, updatePreference } from '../utils/preferences'

export default function ResponsibleGuidance() {
  const preferences = useSyncExternalStore(subscribePreferences, getPreferences)
  const [message, setMessage] = useState('')
  function change(key, value) {
    const saved = updatePreference(key, value)
    setMessage(saved ? 'Preferência salva.' : 'Preferência aplicada nesta sessão. Não foi possível salvar neste navegador.')
  }
  return <main id="conteudo" className="responsible-guidance" tabIndex={-1}>
    <a className="navigation-return" href="#/">Voltar ao início</a>
    <header className="guidance-intro"><h1>Responsáveis</h1>
    <p>Orientações para pais, responsáveis e cuidadores que acompanham o uso do Fala Livre.</p>
    </header>

    <section aria-labelledby="guidance-about">
      <InterfaceIcon name="book" className="guidance-icon" />
      <h2 id="guidance-about">Sobre o Fala Livre</h2>
      <p>O Fala Livre é uma aplicação educativa voltada ao apoio à comunicação e às atividades de aprendizagem. Explore as atividades em conjunto, respeitando as escolhas e o ritmo de quem participa.</p>
      <ul>
        <li><strong>Aprender:</strong> atividades de comunicação, palavras e frases e prática de escrita.</li>
        <li><strong>Meu Dia a Dia:</strong> atividades educativas de rotinas, comunicação e exploração de emoções.</li>
        <li><strong>Jogos:</strong> atividades lúdicas organizadas em níveis, com acesso pelo seletor de cada jogo.</li>
      </ul>
    </section>

    <GameTimeSettings preferences={preferences} change={change} title="Controle de atividades" feedback={message} />

    <section aria-labelledby="guidance-progress">
      <InterfaceIcon name="chart" className="guidance-icon" />
      <h2 id="guidance-progress">Acompanhar atividades</h2>
      <p>Meu Progresso mostra explorações, etapas e atividades registradas no aplicativo. Esses registros podem reunir atividades de diferentes pessoas neste navegador. Não medem domínio, não indicam diagnóstico ou evolução clínica e não registram emoções ou necessidades pessoais.</p>
      <a href="#/meu-progresso">Ver Meu Progresso</a>
    </section>

    <section aria-labelledby="guidance-preferences">
      <InterfaceIcon name="checklist" className="guidance-icon" />
      <h2 id="guidance-preferences">Preferências e acessibilidade</h2>
      <p>Em Configurações, você encontra as preferências de voz, tamanho dos elementos, redução de movimentos e personagens da Home, conforme as opções disponíveis. Essas preferências são deste navegador.</p>
      <a href="#/perfil">Abrir Configurações</a>
    </section>

    <PwaInstallation />

    <section aria-labelledby="guidance-privacy">
      <h2 id="guidance-privacy">Privacidade e dados</h2>
      <p>A configuração do limite diário e o consumo do dia ficam somente neste navegador/dispositivo. O controle de atividades está disponível nesta página, sem senha ou PIN.</p>
      <p>Neste navegador, o Fala Livre pode guardar registros educativos, preferências e a organização da sequência de conteúdos. Alguns registros podem ficar disponíveis apenas durante a sessão. Frases produzidas, sentimentos escolhidos, necessidades pessoais, desenhos, áudio, erros, tentativas e tempo não são salvos como progresso. Os registros não são vinculados a uma pessoa ou conta.</p>
    </section>

    <section aria-labelledby="guidance-pictograms">
      <h2 id="guidance-pictograms">Sobre os pictogramas</h2>
      <p>Os pictogramas apoiam visualmente as atividades educativas e de comunicação.</p>
      <p>Pictogramas: {pictogramCredit.author} · {pictogramCredit.owner} · Fonte: <a href={pictogramCredit.source}>ARASAAC</a> · Licença: <a href={pictogramCredit.licenseUrl}>{pictogramCredit.license}</a>.</p>
      <p><a href={pictogramCredits} target="_blank" rel="noopener noreferrer">Créditos detalhados dos pictogramas (arquivo de texto)</a></p>
    </section>
  </main>
}
