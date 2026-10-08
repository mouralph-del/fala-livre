import { useState, useSyncExternalStore } from 'react'
import { getInstallation, subscribeInstallation, installApp } from '../services/pwaInstallation'
import './PwaInstallation.css'

const devices = [
  { id: 'android', name: 'Android — Celular ou tablet', steps: ['Abra o Fala Livre no Chrome.', 'Acesse o menu de três pontinhos.', 'Selecione “Instalar app” ou “Adicionar à tela inicial”.', 'Confirme a instalação.'] },
  { id: 'ios', name: 'iPhone / iPad', steps: ['Abra o Fala Livre no Safari.', 'Acesse o menu de compartilhamento ou ações da página.', 'Selecione “Adicionar à Tela de Início”.', 'Confirme.'] },
  { id: 'desktop', name: 'Computador / Notebook', steps: ['Abra o Fala Livre no Chrome ou Edge.', 'Procure o ícone de instalação na barra de endereço ou abra o menu do navegador.', 'Selecione a opção de instalar o aplicativo.', 'Confirme.'] },
]

function isAppleMobile() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export default function PwaInstallation() {
  const [device, setDevice] = useState(() => isAppleMobile() ? 'ios' : /Android/.test(navigator.userAgent) ? 'android' : 'desktop')
  const installation = useSyncExternalStore(subscribeInstallation, getInstallation)
  const selected = devices.find(item => item.id === device)
  const isAppleDevice = isAppleMobile()
  return <section className="pwa-installation" aria-labelledby="guidance-installation">
    <svg className="guidance-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" /></svg>
    <h2 id="guidance-installation">Instalar Fala Livre</h2>
    <p>Instale o Fala Livre no celular, tablet ou computador para acessar as atividades com mais facilidade, inclusive offline quando disponível.</p>
    {installation.standalone ? <p role="status">Você já está utilizando o Fala Livre como aplicativo.</p> : <>
      <div className="installation-devices" role="group" aria-label="Escolha seu dispositivo">
        {devices.map(item => <button key={item.id} type="button" aria-pressed={item.id === device} aria-controls="installation-instructions" onClick={() => setDevice(item.id)}>{item.name}</button>)}
      </div>
      <div id="installation-instructions" className="installation-instructions" aria-live="polite">
        <h3>{selected.name}</h3>
        <ol>{selected.steps.map(step => <li key={step}>{step}</li>)}</ol>
        <p>Os nomes e a localização das opções podem variar conforme o navegador e sua versão.</p>
      </div>
      {device !== 'ios' && !isAppleDevice && installation.available && <button className="installation-now" type="button" onClick={installApp}>Instalar agora</button>}
      <p className="installation-feedback" role="status">{installation.message}</p>
      <p>O uso offline depende do carregamento inicial das atividades. A instalação não sincroniza registros entre dispositivos.</p>
    </>}
  </section>
}
