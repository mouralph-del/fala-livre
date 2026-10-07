import { useRef, useState } from 'react'
import { AccountServiceUnavailable, InvalidAccountCredentials, requestAccountAccess } from '../services/accountAccess'
import './AccountAccess.css'

export default function AccountAccess({ mode, submitAccount = requestAccountAccess }) {
  const create = mode === 'create'
  const [values, setValues] = useState({ responsibleName: '', userName: '', email: '', password: '', confirmation: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const inputs = useRef({})
  const lock = useRef(false)
  const fields = [
    ...(create ? [{ id: 'responsibleName', label: 'Nome do responsável', autocomplete: 'name' }] : []),
    { id: 'email', label: 'E-mail', type: 'email', autocomplete: 'email' },
    { id: 'password', label: 'Senha', type: showPassword ? 'text' : 'password', autocomplete: create ? 'new-password' : 'current-password' },
    ...(create ? [{ id: 'confirmation', label: 'Confirmar senha', type: showPassword ? 'text' : 'password', autocomplete: 'new-password' }] : []),
    ...(create ? [{ id: 'userName', label: 'Nome de quem vai utilizar', autocomplete: 'off' }] : []),
  ]
  async function submit(event) {
    event.preventDefault()
    if (lock.current) return
    const next = {}
    if (create && !values.responsibleName.trim()) next.responsibleName = 'Informe o nome do responsável.'
    if (!values.email.trim()) next.email = 'Informe seu e-mail.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = 'Informe um e-mail válido.'
    if (!values.password) next.password = 'Informe sua senha.'
    else if (create && values.password.length < 8) next.password = 'Use uma senha com pelo menos 8 caracteres.'
    if (create && !values.confirmation) next.confirmation = 'Confirme sua senha.'
    else if (create && values.confirmation !== values.password) next.confirmation = 'As senhas precisam ser iguais.'
    if (create && !values.userName.trim()) next.userName = 'Informe o nome de quem vai utilizar.'
    setErrors(next); setMessage('')
    if (Object.keys(next).length) { inputs.current[Object.keys(next)[0]]?.focus(); return }
    lock.current = true; setPending(true)
    let signedIn = false
    try {
      await submitAccount(mode, { ...(create ? { responsibleName: values.responsibleName.trim(), userName: values.userName.trim() } : {}), email: values.email.trim(), password: values.password })
      signedIn = !create
    } catch (error) {
      setMessage(error instanceof InvalidAccountCredentials ? 'E-mail ou senha incorretos.' : error instanceof AccountServiceUnavailable
        ? 'O acesso à conta ainda não está disponível. Você pode continuar usando as atividades neste navegador.'
        : 'Não foi possível enviar sua solicitação. Tente novamente mais tarde.')
    } finally {
      setValues(current => ({ ...current, password: '', confirmation: '' }))
      setPending(false); lock.current = false
    }
    if (signedIn) window.location.hash = '#/'
  }
  return <main id="conteudo" className="account-page" tabIndex={-1}>
    <a className="navigation-return" href="#/">← Início</a>
    <header className="account-intro"><h1>{create ? 'Criar conta' : 'Entrar'}</h1><p>Um espaço para quem acompanha o uso do Fala Livre.</p></header>
    <section className="account-panel" aria-labelledby="account-form-title">
      <h2 id="account-form-title">{create ? 'Dados do responsável' : 'Acesso à conta'}</h2>
      <p className="account-availability">{create ? 'O serviço de contas ainda não está conectado. As atividades continuam disponíveis neste navegador.' : 'Use a conta de demonstração.'}</p>
      <form noValidate onSubmit={submit}>
        {fields.map(field => <div className="account-field" key={field.id}>
          {field.id === 'userName' && <h3>Quem vai utilizar o Fala Livre?</h3>}
          <label htmlFor={'account-' + field.id}>{field.label}</label>
          <input id={'account-' + field.id} ref={element => { inputs.current[field.id] = element }}
            name={field.id} type={field.type || 'text'} autoComplete={field.autocomplete} required disabled={pending}
            value={values[field.id]} aria-invalid={errors[field.id] ? true : undefined}
            aria-describedby={errors[field.id] ? 'account-error-' + field.id : create && field.id === 'userName' ? 'account-user-help' : create && field.id === 'password' ? 'account-password-help' : undefined}
            onChange={event => { setValues(current => ({ ...current, [field.id]: event.target.value })); setErrors(current => ({ ...current, [field.id]: undefined })); setMessage('') }} />
          {create && field.id === 'userName' && <small id="account-user-help">Esse nome será usado na experiência do Fala Livre.</small>}
          {create && field.id === 'password' && <small id="account-password-help">Pelo menos 8 caracteres.</small>}
          {errors[field.id] && <p className="account-error" id={'account-error-' + field.id}>{errors[field.id]}</p>}
        </div>)}
        <label className="account-show-password"><input type="checkbox" checked={showPassword} onChange={event => setShowPassword(event.target.checked)} />Mostrar senha</label>
        <button className="account-submit" type="submit" disabled={pending}>{pending ? 'Aguarde…' : create ? 'Criar conta' : 'Entrar'}</button>
        <p className="account-status" role="status">{message}</p>
      </form>
      <a className="navigation-action" href={create ? '#/entrar' : '#/criar-conta'}>{create ? 'Já tenho uma conta' : 'Criar conta'}</a>
    </section>
  </main>
}
