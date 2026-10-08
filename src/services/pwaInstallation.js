const listeners = new Set()
const displayMode = window.matchMedia('(display-mode: standalone)')
let promptEvent = null
let snapshot = { available: false, standalone: displayMode.matches || navigator.standalone === true, message: '' }
let tracking = 0

function publish(next) {
  snapshot = { ...snapshot, ...next }
  listeners.forEach(listener => listener())
}
function offer(event) {
  event.preventDefault()
  promptEvent = event
  publish({ available: !snapshot.standalone, message: '' })
}
function installed() {
  promptEvent = null
  publish({ available: false, message: 'Instalação concluída. Você pode abrir o Fala Livre pelo ícone do aplicativo.' })
}
function modeChanged() {
  const standalone = displayMode.matches || navigator.standalone === true
  publish({ standalone, available: !standalone && !!promptEvent })
}
export function trackInstallation() {
  if (tracking++ === 0) {
    window.addEventListener('beforeinstallprompt', offer)
    window.addEventListener('appinstalled', installed)
    displayMode.addEventListener('change', modeChanged)
  }
  return () => {
    if (--tracking === 0) {
      window.removeEventListener('beforeinstallprompt', offer)
      window.removeEventListener('appinstalled', installed)
      displayMode.removeEventListener('change', modeChanged)
    }
  }
}
export function subscribeInstallation(listener) {
  listeners.add(listener)
  const stop = trackInstallation()
  return () => { listeners.delete(listener); stop() }
}
export function getInstallation() { return snapshot }
export async function installApp() {
  if (!promptEvent || snapshot.standalone) return
  const event = promptEvent
  promptEvent = null
  publish({ available: false, message: '' })
  try {
    await event.prompt()
    const choice = await event.userChoice
    publish({ message: choice.outcome === 'accepted'
      ? 'Instalação solicitada. Confirme as próximas etapas no navegador.'
      : 'Instalação cancelada. Você pode seguir as instruções manuais quando desejar.' })
  } catch {
    publish({ message: 'A instalação não foi concluída. Use as instruções manuais do navegador.' })
  }
}
