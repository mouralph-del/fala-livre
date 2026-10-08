import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'
import './PwaControls.css'
import { trackInstallation } from '../services/pwaInstallation'

export default function PwaControls() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState(null)
  const [error, setError] = useState('')
  const reloadApproved = useRef(false)
  useEffect(trackInstallation, [])
  useEffect(() => {
    if (!import.meta.env.PROD) return
    let swRegistration
    const check = () => {
      if (navigator.onLine && document.visibilityState === 'visible') swRegistration?.update().catch(() => {})
    }
    const update = registerSW({
      immediate: true,
      onNeedRefresh: () => setUpdateAvailable(true),
      onRegisteredSW: (_url, sw) => {
        swRegistration = sw
        setRegistration(() => () => update(true))
      },
      onNeedReload: () => {
        if (reloadApproved.current) window.location.reload()
        else {
          setUpdateAvailable(true)
          setRegistration(() => () => window.location.reload())
        }
      },
      onRegisterError: () => setError('Não foi possível preparar o uso offline. Tente novamente com conexão.'),
    })
    window.addEventListener('online', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      window.removeEventListener('online', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])
  if (!updateAvailable && !error) return null
  return <aside className="pwa-controls" aria-label="Aplicativo Fala Livre">
    {updateAvailable ? <>
      <p role="status">Uma nova versão está disponível. Termine sua atividade antes de atualizar.</p>
      <button type="button" onClick={async () => {
        reloadApproved.current = true
        try { await registration?.() } catch { reloadApproved.current = false; setError('Não foi possível atualizar. Tente novamente com conexão.') }
      }}>Atualizar aplicativo</button>
    </> : null}
    {error && <p role="status">{error}</p>}
    <button className="pwa-dismiss" type="button" onClick={() => {
      setUpdateAvailable(false); setError('')
    }}>Agora não</button>
  </aside>
}
