import { pictogramCredit } from '../data/communicationOptions.js'
import './ResponsibleGuidance.css'

export default function ResponsibleGuidance() {
  return <main id="conteudo" className="responsible-guidance" tabIndex={-1}>
    <a className="navigation-return" href="#/">Voltar ao início</a>
    <h1>Responsáveis</h1>
    <p>Orientações para pais, responsáveis e cuidadores que acompanham o uso do Fala Livre, e para professores durante demonstrações do MVP.</p>

    <section aria-labelledby="guidance-about">
      <h2 id="guidance-about">Sobre o Fala Livre</h2>
      <p>O Fala Livre é uma aplicação educativa voltada ao apoio à comunicação e às atividades de aprendizagem. Explore as atividades em conjunto, respeitando as escolhas e o ritmo de quem participa.</p>
      <ul>
        <li><strong>Aprender:</strong> atividades de comunicação, palavras e frases e prática de escrita.</li>
        <li><strong>Meu Dia a Dia:</strong> atividades educativas de rotinas, comunicação e exploração de emoções.</li>
        <li><strong>Jogos:</strong> atividades lúdicas organizadas em níveis, com acesso pelo seletor de cada jogo.</li>
      </ul>
    </section>

    <section aria-labelledby="guidance-progress">
      <h2 id="guidance-progress">Acompanhar atividades</h2>
      <p>Meu Progresso mostra explorações, etapas e atividades registradas no aplicativo. Esses registros podem reunir atividades de diferentes pessoas neste navegador. Não medem domínio, não indicam diagnóstico ou evolução clínica e não registram emoções ou necessidades pessoais.</p>
      <a href="#/meu-progresso">Ver Meu Progresso</a>
    </section>

    <section aria-labelledby="guidance-preferences">
      <h2 id="guidance-preferences">Preferências e acessibilidade</h2>
      <p>Em Configurações, você encontra as preferências de voz, tamanho dos elementos, redução de movimentos e personagens da Home, conforme as opções disponíveis. Essas preferências são deste navegador.</p>
      <a href="#/perfil">Abrir Configurações</a>
    </section>

    <section aria-labelledby="guidance-game-time">
      <h2 id="guidance-game-time">Tempo de jogos</h2>
      <p>O limite diário de jogos é definido em Configurações. Quando o tempo termina, Aprender continua disponível. A configuração e o consumo do dia ficam somente neste navegador/dispositivo.</p>
    </section>

    <section aria-labelledby="guidance-privacy">
      <h2 id="guidance-privacy">Privacidade no MVP</h2>
      <p>Neste navegador, o Fala Livre pode guardar registros educativos, preferências e a organização da sequência de conteúdos. Alguns registros podem ficar disponíveis apenas durante a sessão. Frases produzidas, sentimentos escolhidos, necessidades pessoais, desenhos, áudio, erros, tentativas e tempo não são salvos como progresso. Os registros não são vinculados a uma pessoa ou conta.</p>
    </section>

    <section aria-labelledby="guidance-pictograms">
      <h2 id="guidance-pictograms">Sobre os pictogramas</h2>
      <p>Os pictogramas apoiam visualmente as atividades educativas e de comunicação.</p>
      <p>Pictogramas: {pictogramCredit.author} · {pictogramCredit.owner} · Fonte: <a href={pictogramCredit.source}>ARASAAC</a> · Licença: <a href={pictogramCredit.licenseUrl}>{pictogramCredit.license}</a>.</p>
    </section>
  </main>
}
