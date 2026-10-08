import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Audit-only harness. Native storage below belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/qa/myProgress.fixture.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4197, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-audit-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9347', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
async function ready(page) { for (let i = 0; i < 200; i++) { if (await page.evaluate('window.auditReady')) return; await pause(50) } throw Error('page did not become ready ' + JSON.stringify(errors)) }
const act = (page, body) => page.evaluate('(async()=>{const a=window.audit;' + body + '})()')
try {
  let targets
  for (let i = 0; i < 100; i++) { try { targets = await (await fetch('http://127.0.0.1:9347/json/list')).json(); if (targets.some(t => t.type === 'page')) break } catch { /* Startup. */ } await pause(100) }
  const A = await connect(targets.find(t => t.type === 'page'))
  const tab = await (await fetch('http://127.0.0.1:9347/json/new?about:blank', { method: 'PUT' })).json()
  const B = await connect(tab)
  for (const page of [A, B]) { await page.cdp('Page.navigate', { url: 'http://127.0.0.1:4197/__audit' }); await ready(page) }
  const text = () => A.evaluate('document.querySelector("main").textContent')
  await act(A, "await a.mount('loading')")
  assert.match(await text(), /Carregando os registros/)
  assert.doesNotMatch(await text(), /Seus registros de atividades|0 de 12/)
  await act(A, "await a.mount('empty')")
  assert.match(await text(), /Seus registros de atividades/)
  assert.match(await text(), /começou nesta atualização/)
  assert.doesNotMatch(await text(), /0 de 12|0 de 18/)
  assert.equal(await A.evaluate(`document.querySelector('a[href="#/aprender"]') !== null && document.querySelector('a[href="#/jogar"]') !== null`), true)
  await act(A, "document.querySelector('main button').click();await a.pause()")
  assert.equal(await A.evaluate("document.querySelector('.records-empty aside') === null"), true)
  for (const [kind, pattern] of [['unavailable', /Não foi possível acessar/], ['corrupt', /mantidos sem alterações/], ['incompatible', /versão que esta aplicação/], ['conflict', /Não foi possível confirmar/]]) {
    await act(A, `await a.mount('${kind}')`)
    assert.match(await text(), pattern)
    assert.doesNotMatch(await text(), /Seus registros de atividades|0 de 12|corrupt-data|revision/)
    const before = await act(A, 'return a.counts()')
    await act(A, "document.querySelector('main button').click();await a.pause()")
    const after = await act(A, 'return a.counts()')
    assert.equal(after.loads, before.loads + 1); assert.equal(after.writes, 0)
  }
  await act(A, "await a.mount('partial')")
  assert.match(await text(), /0 de 12 atividades de Palavras/)
  assert.doesNotMatch(await text(), /Atividade concluída/)
  await act(A, "await a.mount('session')")
  assert.equal(await A.evaluate('document.querySelectorAll("em").length'), 1)
  assert.match(await text(), /apenas nesta sessão/)
  assert.equal(await A.evaluate('document.querySelector(".record-list li").textContent.includes("Reconhecer: Realizado — Nesta sessão")'), true)
  assert.equal(await A.evaluate('document.querySelector(".record-list li").textContent.includes("Conhecer: Realizado — Nesta sessão")'), false)
  await act(A, "a.set(a.states.full);await a.pause()")
  assert.match(await text(), /18 de 18 níveis/)
  assert.equal(await A.evaluate('document.querySelectorAll("em").length'), 0)
  assert.doesNotMatch(await text(), /Esta é a minha casa|Eu quero|feliz|triste|score|tentativa|Pedro|tokens|melhor tempo/i)
  assert.match(await text(), /Exercício: expressar fome/)
  assert.match(await text(), /Exercício: expressar dor/)
  for (const gameId of ['caminho', 'quebra-cabeca', 'caca-palavras', 'memoria', 'encontre-imagem', 'onde-pertence']) for (let completed = 0; completed <= 3; completed++) {
    await act(A, `let p=a.empty;for(const id of a.gameCatalog['${gameId}'].slice(0,${completed}))p=a.apply(p,{type:'completed',gameId:'${gameId}',levelId:id});if(!${completed})p=a.persisted;a.set({...a.states.full,effectiveProgress:p,persistedProgress:p});await a.pause()`)
    const labels = await A.evaluate(`Array.from(document.querySelector('a[href="#/jogar/${gameId}"]').closest('section').querySelectorAll('li'),li=>li.textContent)`)
    for (let index = 0; index < 3; index++) assert.match(labels[index], index < completed ? /Concluído — pode jogar novamente/ : index === completed ? /Disponível para jogar/ : /Conclua o nível anterior/)
  }
  for (const width of [320, 360, 390, 430, 768, 1024, 1366]) for (const kind of ['empty', 'partial', 'full', 'session', 'unavailable', 'failureSession']) {
    await A.cdp('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 500 })
    await act(A, `await a.mount('${kind}');document.querySelectorAll('details').forEach(d=>d.open=true)`)
    for (const size of ['normal', 'large']) {
      await A.evaluate(`document.documentElement.dataset.elementSize='${size}';document.documentElement.dataset.reduceMotion='true'`)
      assert.equal(await A.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), true, `${kind} ${width} ${size}`)
      await A.evaluate('document.documentElement.style.zoom="1.25"')
      assert.equal(await A.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), true, `${kind} ${width} zoom 125%`)
      await A.evaluate('document.documentElement.style.zoom=""')
    }
  }
  await A.cdp('Page.bringToFront')
  await act(A, "await a.mount('full');document.querySelector('summary').focus()")
  for (const [key, code, keyCode] of [['Enter', 'Enter', 13], [' ', 'Space', 32]]) {
    const open = await A.evaluate('document.querySelector("details").open')
    await A.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key, code, text: key === 'Enter' ? '\r' : ' ', windowsVirtualKeyCode: keyCode })
    await A.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode })
    await pause(80)
    assert.equal(await A.evaluate('document.querySelector("details").open'), !open, `native ${code}; focus: ${await A.evaluate('document.activeElement.outerHTML')}`)
  }
  assert.equal(await A.evaluate('parseFloat(getComputedStyle(document.activeElement).outlineWidth)>0'), true)
  // Native persistent storage, real subscription, StrictMode and a second tab.
  await act(A, 'a.seed(a.persisted);await a.mount("real")')
  const raw = await A.evaluate('localStorage.getItem(window.audit.key)')
  await act(A, "document.querySelector('summary').click();await a.pause()")
  assert.equal(await act(A, 'return a.counts().writes'), 0)
  assert.equal(await act(A, 'return a.counts().subscriptions'), 1)
  await act(B, 'await a.store.loadProgress();await a.store.recordActivityExplored("communication","guided-exploration")')
  for (let i = 0; i < 100 && !(await text()).includes('Exploração de comunicação: Realizado'); i++) await pause(30)
  assert.match(await text(), /Exploração de comunicação: Realizado/)
  assert.notEqual(await A.evaluate('localStorage.getItem(window.audit.key)'), raw)
  const afterRecord = await A.evaluate('localStorage.getItem(window.audit.key)')
  await A.cdp('Page.reload'); await pause(300); await ready(A); await act(A, 'await a.mount("real")')
  assert.match(await text(), /Exploração de comunicação: Realizado/)
  assert.equal(await A.evaluate('localStorage.getItem(window.audit.key)'), afterRecord)
  assert.equal(await A.evaluate('document.querySelectorAll("em").length'), 0)
  for (let i = 0; i < 5; i++) { await act(A, 'await a.unmount()'); assert.equal(await act(A, 'return a.counts().subscriptions'), 0); await act(A, 'await a.mount("real")'); assert.equal(await act(A, 'return a.counts().subscriptions'), 1) }
  await act(A, 'await a.mount("realSession");await a.sessionStore.recordActivityPerformed("wordsAndPhrases","casa",["build"]);await a.pause()')
  assert.match(await text(), /Reconhecer: Realizado — Nesta sessão/)
  assert.doesNotMatch(await text(), /Conhecer: Realizado — Nesta sessão/)
  assert.equal(await A.evaluate('localStorage.getItem(window.audit.key)'), afterRecord)
  await A.cdp('Page.reload'); await pause(300); await ready(A); await act(A, 'await a.mount("real")')
  assert.doesNotMatch(await text(), /Reconhecer: Realizado|Nesta sessão/)
  assert.equal(await A.evaluate('localStorage.getItem(window.audit.key)'), afterRecord)
  if (!process.argv.includes("--records-only")) {
  // App routes and session dismissal across navigation.
  await A.evaluate('localStorage.removeItem(window.audit.key);location.hash="/"')
  await act(A, 'await a.mount("app")')
  assert.match(await text(), /Olá!/); assert.doesNotMatch(await text(), /Pedro|Pontos|Atividades3|Conquistas2|120/)
  for (const [label, expected] of [['Começar a aprender', '#/aprender'], ['Começar a jogar', '#/jogar']]) {
    await A.evaluate(`document.querySelector('[aria-label="${label}"]').click()`); await pause(100)
    assert.equal(await A.evaluate('location.hash'), expected)
    await A.evaluate('location.hash="/"'); await pause(100)
  }
  await A.evaluate('document.querySelector(".header-menu-toggle").click()'); await pause(100)
  await A.evaluate('document.querySelector(".header-navigation a").focus()')
  await A.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', windowsVirtualKeyCode: 13 })
  await A.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }); await pause(100)
  assert.equal(await A.evaluate('location.hash'), '#/meu-progresso')
  assert.equal(await A.evaluate('document.activeElement.id'), 'conteudo')
  for (const width of [320, 360, 390, 430, 768, 1024, 1366]) {
    await A.cdp('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 500 })
    for (const route of ['/', '/meu-progresso', '/perfil']) {
      await A.evaluate(`location.hash='${route}'`); await pause(100)
      assert.equal(await A.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), true, `App ${route} ${width}`)
      assert.equal(await A.evaluate('document.querySelectorAll(".header-navigation a").length'), 5)
    }
  }
  await A.evaluate('location.hash="/meu-progresso"'); await pause(100)
  assert.equal(await A.evaluate('document.title'), 'Meu Progresso | Fala Livre')
  await act(A, "document.querySelector('.records-empty button').click();await a.pause()")
  await A.evaluate('location.hash="/"'); await pause(100); await A.evaluate('location.hash="/meu-progresso"'); await pause(100)
  assert.equal(await A.evaluate('document.querySelector(".records-empty aside") === null'), true)
  await A.cdp('Page.reload'); await pause(300); await ready(A); await act(A, 'await a.mount("app")')
  assert.match(await text(), /Meu Progresso/)
  assert.equal(await A.evaluate('document.querySelector(".records-empty aside") !== null'), true)
  for (const [route, selector] of [['/aprender', '.learn-page'], ['/jogar', '.games-page'], ['/unknown', '.home']]) {
    await A.evaluate(`location.hash='${route}'`); await pause(100)
    assert.equal(await A.evaluate(`document.querySelector('${selector}') !== null`), true, route)
  }
  }
  assert.deepEqual(errors, []); assert.deepEqual(warnings, [])
  console.log(process.argv.includes('--records-only') ? 'PASS records: read states, retry, partial/complete/session provenance, subscriptions, responsive layout, native keys, two-tab storage and refresh' : 'PASS: all read states, read-only retry, partial/complete/session provenance, subscriptions, six games x four chains, seven widths normal/large, native Enter/Space/focus, StrictMode, real two-tab storage, refresh, Home/header/routes, transition dismissal and privacy; no console errors/warnings.')
} finally {
  for (const socket of sockets) socket.close(); chrome.kill(); await server.close(); await pause(500)
  const resolved = path.resolve(profile)
  if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith('falalivre-audit-')) throw Error('unsafe temporary path')
  try { fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { console.log('Temporary Chrome profile remains: ' + resolved) }
}
