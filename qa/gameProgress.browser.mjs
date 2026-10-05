import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

const html = '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/src/index.css"></head><body><div id="root"></div><script type="module" src="/qa/gameProgress.fixture.jsx"></script></body></html>'
const server = await createServer({ server: { host: '127.0.0.1', port: 4195, strictPort: true }, plugins: [{ name: 'game-progress-qa', configureServer(server) { server.middlewares.use('/__game-qa', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__game-qa', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-game-qa-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9345', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
let socket
try {
  let target
  for (let i = 0; i < 100; i++) {
    try { target = (await (await fetch('http://127.0.0.1:9345/json/list')).json()).find(item => item.type === 'page'); if (target) break } catch { /* Startup only. */ }
    await pause(100)
  }
  assert.ok(target, 'isolated Chrome started')
  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
  let sequence = 0
  const pending = new Map(), exceptions = [], consoleErrors = []
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails)
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') consoleErrors.push(message.params.args.map(arg => arg.value ?? arg.description))
    if (message.id) { const task = pending.get(message.id); pending.delete(message.id); message.error ? task.reject(Error(JSON.stringify(message.error))) : task.resolve(message.result) }
  })
  const cdp = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })) })
  await cdp('Runtime.enable'); await cdp('Page.enable')
  await cdp('Page.navigate', { url: 'http://127.0.0.1:4195/__game-qa' })
  let result
  for (let i = 0; i < 1800; i++) {
    result = (await cdp('Runtime.evaluate', { expression: 'window.qaResult', returnByValue: true })).result.value
    if (result) break
    await pause(100)
  }
  assert.ok(result, `finished; exceptions: ${JSON.stringify(exceptions)}`)
  assert.equal(result.passed, true, JSON.stringify(result))
  const evaluate = async expression => {
    const response = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    assert.equal(response.exceptionDetails, undefined, JSON.stringify(response.exceptionDetails))
    return response.result.value
  }
  for (const width of [390, 1366]) for (const game of ['caminho', 'quebra-cabeca', 'caca-palavras', 'memoria', 'encontre-imagem', 'onde-pertence']) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width === 390 })
    await evaluate(`window.qaVisual('${game}')`)
    assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), game + ' horizontal overflow ' + width)
    await evaluate('window.qaButton=document.querySelectorAll("nav button")[1];window.qaButton.focus()')
    await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 })
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 })
    assert.ok(await evaluate("getComputedStyle(window.qaButton).outlineStyle !== 'none' && parseFloat(getComputedStyle(window.qaButton).outlineWidth) > 0"), game + ' visible keyboard focus')
    await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', text: '\r', code: 'Enter', windowsVirtualKeyCode: 13 })
    await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', text: '\r', code: 'Enter', windowsVirtualKeyCode: 13, autoRepeat: true })
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
    await pause(100)
    const state = await evaluate('window.qaState()')
    assert.equal(state.active, 0); assert.equal(state.calls.length, 0); assert.equal(state.writes, 0)
    assert.match(state.message, /Nível 2.*Nível 1/)
    assert.ok(await evaluate('document.activeElement === window.qaButton'), 'blocked attempt retains discoverable focus')
    assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), game + ' block feedback overflow ' + width)
  }
  // Actual page reloads receive only the fixture's serialized durable memory
  // value. No application localStorage key is read or written by this harness.
  for (const sample of result.reloadSamples) {
    const script = await cdp('Page.addScriptToEvaluateOnNewDocument', { source: 'window.qaReloadSpec=' + JSON.stringify(sample) })
    await evaluate('window.qaResult=null')
    await cdp('Page.reload', { ignoreCache: true })
    let reloaded
    for (let i = 0; i < 100; i++) {
      reloaded = await evaluate('window.qaResult')
      if (reloaded?.reload || reloaded?.passed === false) break
      await pause(50)
    }
    assert.equal(reloaded?.passed, true, JSON.stringify(reloaded))
    assert.deepEqual(reloaded.blocked, sample.expected, sample.game + ' actual reload ' + sample.mode)
    assert.equal(reloaded.calls, 0); assert.equal(reloaded.writes, 0)
    await cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: script.identifier })
  }
  assert.deepEqual(exceptions, []); assert.deepEqual(consoleErrors, [])
  console.log('PASS: real six game components, all 18 levels. ' + JSON.stringify({ passed: result.passed, tests: result.tests }))
  console.log('PASS: ' + result.reloadSamples.length + ' actual page reloads: all six games after durable N1/N2 and unsaved session N2, injected durable memory values, no mount writes.')
  console.log('PASS: 390/1366px, no overflow, blocked native repeated Enter, visible/retained focus, no console errors or exceptions. Injected memory stores only.')
} finally {
  socket?.close(); chrome.kill(); await server.close(); await pause(500)
  const resolved = path.resolve(profile)
  if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith('falalivre-game-qa-')) throw Error('unsafe temporary path')
  try { fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { console.log('Temporary Chrome profile could not be removed: ' + resolved) }
}
