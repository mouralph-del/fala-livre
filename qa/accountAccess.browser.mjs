import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Targeted navigation styling harness. Native storage belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4216, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-account-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9366', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const sockets = [], errors = [], warnings = []
async function connect(target) {
  const socket = new WebSocket(target.webSocketDebuggerUrl); sockets.push(socket)
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
  let id = 0; const pending = new Map()
  socket.addEventListener('message', event => { const message = JSON.parse(event.data); if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails); if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) (message.params.type === 'error' ? errors : warnings).push(message.params.args.map(arg => arg.value ?? arg.description)); if (message.id) { const task = pending.get(message.id); pending.delete(message.id); message.error ? task.reject(Error(JSON.stringify(message.error))) : task.resolve(message.result) } })
  const cdp = (method, params = {}) => new Promise((resolve, reject) => { const next = ++id; pending.set(next, { resolve, reject }); socket.send(JSON.stringify({ id: next, method, params })) })
  const evaluate = async expression => { const result = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails)); return result.result.value }
  await cdp('Runtime.enable'); await cdp('Page.enable')
  return { cdp, evaluate }
}
async function ready(page) { for (let i = 0; i < 200; i++) { if (await page.evaluate('document.querySelector("main h1") !== null')) return; await pause(50) } throw Error('page did not become ready ' + JSON.stringify(errors)) }

try {
  let targets
  for (let i = 0; i < 100; i++) { try { targets = await (await fetch('http://127.0.0.1:9366/json/list')).json(); if (targets.some(t => t.type === 'page')) break } catch {} await pause(100) }
  const A = await connect(targets.find(t => t.type === 'page')), ev = A.evaluate
  await A.cdp('Page.navigate', { url: 'http://127.0.0.1:4216/__audit#/entrar' }); await ready(A)
  const route = async hash => { await ev('location.hash=' + JSON.stringify(hash)); await pause(80) }
  const fill = async (name, value) => {
    await ev(`(()=>{const e=document.querySelector('[name="${name}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}))})()`); await pause(20)
  }
  const submit = async () => { await ev('document.querySelector("form").requestSubmit()'); await pause(60) }
  const storage = () => ev('JSON.stringify({local:Object.entries(localStorage),session:Object.entries(sessionStorage)})')
  for (const hash of ['/entrar', '/criar-conta']) {
    await route(hash)
    const before = await storage()
    await ev('window.__accountRequests=[];window.__originalFetch=window.fetch;window.fetch=(...args)=>{window.__accountRequests.push(args[0]);return window.__originalFetch(...args)}')
    await submit()
    assert.equal(await ev('document.querySelectorAll("[aria-invalid=true]").length'), hash === '/entrar' ? 2 : 5)
    assert.equal(await ev('document.activeElement.name'), hash === '/entrar' ? 'email' : 'responsibleName')
    if (hash === '/criar-conta') await fill('responsibleName', 'Responsável de teste')
    if (hash === '/criar-conta') await fill('userName', 'Noa de teste')
    await fill('email', 'invalid'); await fill('password', 'short'); await submit()
    assert.ok(await ev('document.querySelector("#account-email").getAttribute("aria-describedby").startsWith("account-error")'))
    await fill('email', 'adult@example.test')
    if (hash === '/criar-conta') {
      await fill('confirmation', 'different'); await submit()
      assert.equal(await ev('document.querySelector("#account-password").getAttribute("aria-invalid")'), 'true')
      await fill('password', 'OnlyInMemory#123'); await submit()
      assert.equal(await ev('document.querySelector("#account-confirmation").getAttribute("aria-invalid")'), 'true')
      await fill('confirmation', 'OnlyInMemory#123')
    } else await fill('password', 'OnlyInMemory#123')
    await ev('document.querySelector(".account-show-password input").click()')
    assert.equal(await ev('document.querySelector("#account-password").type'), 'text')
    await ev('document.querySelector(".account-show-password input").click()')
    assert.equal(await ev('document.querySelector("#account-password").type'), 'password')
    await submit()
    assert.ok(await ev(hash === '/entrar'
      ? 'document.querySelector(".account-status").textContent === "E-mail ou senha incorretos."'
      : 'document.querySelector(".account-status").textContent.includes("ainda não está disponível")'))
    assert.equal(await ev('document.querySelector("#account-password").value'), '')
    assert.deepEqual(await ev('window.__accountRequests'), [])
    assert.equal(await storage(), before, 'account flow writes no credentials or other local state')
    await ev('window.fetch=window.__originalFetch')
    const transition = hash === '/entrar' ? '/criar-conta' : '/entrar'
    await fill('password', 'OnlyInMemory#123'); await route(transition)
    assert.equal(await ev('document.querySelector("#account-password").value'), '', 'route transition clears the form')
  }
  // Demo access changes only its own session key, including across a reload.
  await route('/entrar')
  await ev(`(async()=>{localStorage.setItem('falalivre.preferences', JSON.stringify({elementSize:'normal',reduceMotion:true,gameTimeLimit:'30'}));
    localStorage.setItem('falaLivre_gameTime_v1', JSON.stringify({day:(await import('/src/utils/gameTimeCore.js')).localDay(Date.now()),consumedMs:12345}));
    localStorage.setItem('falaLivre_contentRotation_v1', JSON.stringify({preserved:true}));
    localStorage.setItem('falaLivre_progress_v1', JSON.stringify((await import('/src/utils/progress.js')).createEmptyProgress('12345678-1234-4234-8234-123456789abc')))})()`)
  const preserved = await storage()
  await ev(`localStorage.setItem('falalivre.demo-session.v1',JSON.stringify({demo:true,name:'Responsável'}))`)
  await A.cdp('Page.reload'); await ready(A)
  assert.deepEqual(await ev('JSON.parse(localStorage.getItem("falalivre.demo-session.v1"))'), { demo: true, responsibleName: 'Alex', userName: 'Noa' })
  await ev(`(async()=> (await import('/src/services/accountAccess.js')).signOut())()`)
  assert.equal(await storage(), preserved, 'legacy migration preserves unrelated data')
  await fill('email', 'teste@falalivre.com'); await fill('password', 'wrong-password'); await submit()
  assert.equal(await ev('document.querySelector(".account-status").textContent'), 'E-mail ou senha incorretos.')
  assert.equal(await storage(), preserved)
  await fill('password', 'FalaLivre123'); await submit()
  assert.equal(await ev('location.hash'), '#/')
  assert.equal(await ev('document.querySelector("#welcome-title").textContent'), 'Olá, Noa!')
  const demoSession = await ev('JSON.parse(localStorage.getItem("falalivre.demo-session.v1"))')
  assert.deepEqual(demoSession, { demo: true, responsibleName: 'Alex', userName: 'Noa' })
  const withoutDemo = () => ev('JSON.stringify({local:Object.entries(localStorage).filter(([key])=>key!=="falalivre.demo-session.v1"),session:Object.entries(sessionStorage)})')
  assert.equal(await withoutDemo(), preserved)
  assert.equal((await storage()).includes('FalaLivre123'), false)
  await ev('document.querySelector(".header-menu-toggle").click()')
  assert.equal(await ev('document.querySelectorAll(".header-account-section a").length'), 0)
  assert.equal(await ev('document.querySelector(".header-account-section .header-menu-label").textContent'), 'Responsável')
  assert.equal(await ev('document.querySelector(".header-account-name").textContent'), 'Alex')
  assert.equal(await ev('document.querySelector(".header-sign-out").textContent'), 'Sair')
  await A.cdp('Page.reload'); await ready(A)
  assert.equal(await ev('document.querySelector("#welcome-title").textContent'), 'Olá, Noa!')
  assert.equal(await withoutDemo(), preserved)
  await ev('document.querySelector(".header-menu-toggle").click()')
  assert.equal(await ev('document.querySelectorAll(".header-account-section a").length'), 0)
  await A.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 1000, deviceScaleFactor: 1, mobile: false })
  const homeShot = await A.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 75, captureBeyondViewport: true })
  fs.writeFileSync(path.join(tempRoot, 'falalivre-account-home-menu.jpg'), Buffer.from(homeShot.data, 'base64'))
  await ev(`localStorage.setItem('falalivre.demo-session.v1',JSON.stringify({demo:true,responsibleName:'Alex'.repeat(40),userName:'Noa'.repeat(40)}));window.dispatchEvent(new StorageEvent('storage',{key:'falalivre.demo-session.v1'}))`); await pause(60)
  assert.equal(await ev('document.querySelector(".header-account-name").textContent'), 'Alex'.repeat(40))
  assert.equal(await ev('document.querySelector("#welcome-title").textContent'), 'Olá, ' + 'Noa'.repeat(40) + '!')
  for (const width of [320, 768, 1366]) for (const size of ['normal', 'large']) {
    await A.cdp('Emulation.setDeviceMetricsOverride', { width, height: 700, deviceScaleFactor: 1, mobile: false })
    await ev(`document.documentElement.dataset.elementSize=${JSON.stringify(size)}`)
    const layout = await ev(`(()=>{const menu=document.querySelector('.header-popover').getBoundingClientRect(),button=document.querySelector('.header-sign-out');return {inside:menu.left>=8&&menu.right<=innerWidth-8&&menu.bottom<=innerHeight-8,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,clipped:button.scrollWidth>button.clientWidth+1,height:button.getBoundingClientRect().height}})()`)
    assert.ok(layout.inside, JSON.stringify({width,size,layout})); assert.equal(layout.overflow, false); assert.equal(layout.clipped, false)
    assert.ok(layout.height >= (size === 'large' ? 56 : 48))
  }
  await ev(`(async()=> (await import('/src/services/accountAccess.js')).requestAccountAccess('sign-in',{email:'teste@falalivre.com',password:'FalaLivre123'}))()`); await pause(60)
  // Native keyboard activation and visible focus on the real logout button.
  await ev('document.querySelector(".header-menu-toggle").focus()')
  for (let i = 0; i < 4; i++) {
    await A.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
    await A.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
  }
  assert.equal(await ev('document.activeElement.className'), 'header-sign-out')
  assert.equal(await ev('getComputedStyle(document.activeElement).outlineStyle'), 'solid')
  await A.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', windowsVirtualKeyCode: 13 })
  await A.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }); await pause(60)
  assert.equal(await ev('localStorage.getItem("falalivre.demo-session.v1")'), null)
  assert.equal(await storage(), preserved)
  assert.equal(await ev('document.querySelector("#welcome-title").textContent'), 'Olá!')
  assert.equal(await ev('document.querySelector(".header-menu-toggle").getAttribute("aria-expanded")'), 'false')
  await ev('document.querySelector(".header-menu-toggle").click()')
  assert.deepEqual(await ev('Array.from(document.querySelectorAll(".header-account-section a"),a=>a.getAttribute("href"))'), ['#/entrar', '#/criar-conta'])
  await ev('document.querySelector(".header-menu-toggle").click()')
  await ev(`(async()=> (await import('/src/services/accountAccess.js')).requestAccountAccess('sign-in',{email:'teste@falalivre.com',password:'FalaLivre123'}))()`); await pause(60)
  await ev('document.querySelector(".header-menu-toggle").click()')
  const logoutPoint = await ev(`(()=>{const r=document.querySelector('.header-sign-out').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`)
  await A.cdp('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [logoutPoint] }); await A.cdp('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await pause(80)
  assert.equal(await ev('document.querySelector("#welcome-title").textContent'), 'Olá!')
  assert.equal(await storage(), preserved, 'touch logout preserves other state')
  const shots = path.join(tempRoot, 'falalivre-account-review'); fs.mkdirSync(shots, { recursive: true })
  for (const width of [320, 360, 390, 430, 768, 1024, 1366]) for (const size of ['normal', 'large']) for (const zoom of [1, 1.25]) for (const hash of ['/entrar', '/criar-conta']) {
    await A.cdp('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false })
    await ev(`document.documentElement.dataset.elementSize=${JSON.stringify(size)};document.documentElement.style.zoom=${zoom}`); await route(hash)
    assert.ok(await ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'), JSON.stringify({ width, size, zoom, hash }))
    assert.deepEqual(await ev('Array.from(document.querySelectorAll("main input,main button,main a"),e=>({text:e.name||e.textContent.trim(),clipped:e.scrollWidth>e.clientWidth+1})).filter(e=>e.clipped)'), [])
    for (const height of await ev('Array.from(document.querySelectorAll(".account-field input,.account-submit,.account-show-password"),e=>e.getBoundingClientRect().height)')) assert.ok(height >= (size === 'large' ? 55 : 47) * zoom)
    if (zoom === 1) { const shot = await A.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 65, captureBeyondViewport: true }); fs.writeFileSync(path.join(shots, hash.slice(1) + '-' + width + '-' + size + '.jpg'), Buffer.from(shot.data, 'base64')) }
  }
  await ev('document.documentElement.style.zoom=1;document.documentElement.dataset.reduceMotion="true"')
  await A.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); await A.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
  for (const name of ['responsibleName', 'email', 'password', 'confirmation', 'userName']) { await ev(`document.querySelector('[name="${name}"]').focus()`); assert.equal(await ev('getComputedStyle(document.activeElement).outlineStyle'), 'solid') }
  assert.deepEqual(errors, []); assert.deepEqual(warnings, [])
  console.log('PASS accounts: accessible validation/show password; correct/incorrect demo login, immediate menu, reload, keyboard logout, password never persisted, other storage preserved; signup unavailable; seven widths Normal/Grande 125%. Screenshots: ' + shots)
} finally {
  for (const socket of sockets) socket.close(); chrome.kill(); await server.close(); await pause(500)
  const resolved = path.resolve(profile)
  if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith('falalivre-account-')) throw Error('unsafe temporary path')
  try { fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { console.log('Temporary Chrome profile remains: ' + resolved) }
}
