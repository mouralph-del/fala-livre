import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

const html = '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/src/index.css"></head><body><div id="root"></div><script type="module" src="/qa/learningProgress.fixture.jsx"></script></body></html>'
const server = await createServer({ server: { host: '127.0.0.1', port: 4194, strictPort: true }, plugins: [{ name: 'learning-progress-qa', configureServer(server) { server.middlewares.use('/__learning-qa', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__learning-qa', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-learning-qa-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9344', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
let socket
try {
  let target
  for (let i = 0; i < 100; i++) {
    try { target = (await (await fetch('http://127.0.0.1:9344/json/list')).json()).find(item => item.type === 'page'); if (target) break } catch { /* Startup only. */ }
    await pause(100)
  }
  assert.ok(target, 'isolated Chrome started')
  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
  let sequence = 0
  const pending = new Map(), exceptions = []
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails)
    if (message.id) { const task = pending.get(message.id); pending.delete(message.id); message.error ? task.reject(Error(JSON.stringify(message.error))) : task.resolve(message.result) }
  })
  const cdp = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })) })
  await cdp('Runtime.enable'); await cdp('Page.enable')
  await cdp('Page.navigate', { url: 'http://127.0.0.1:4194/__learning-qa' })
  let result
  for (let i = 0; i < 1800; i++) {
    result = (await cdp('Runtime.evaluate', { expression: 'window.qaResult', returnByValue: true })).result.value
    if (result) break
    await pause(100)
  }
  assert.ok(result, `finished; exceptions: ${JSON.stringify(exceptions)}`)
  assert.equal(result.passed, true, JSON.stringify(result)); assert.deepEqual(exceptions, [])
  const evaluate = async expression => {
    const response = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    assert.equal(response.exceptionDetails, undefined, JSON.stringify(response.exceptionDetails))
    return response.result.value
  }
  for (const width of [390, 1366]) for (const kind of ['communication', 'emotions']) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width === 390 })
    await evaluate(`window.qaVisual('${kind}')`)
    assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), kind + ' horizontal overflow ' + width)
    const label = kind === 'communication' ? 'Concluir exploração' : 'Próximo conceito'
    await evaluate(`window.qaButton=[...document.querySelectorAll('main button')].find(button=>button.textContent.trim()==='${label}');window.qaButton.focus()`)
    await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 })
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 })
    assert.ok(await evaluate("getComputedStyle(window.qaButton).outlineStyle !== 'none' && parseFloat(getComputedStyle(window.qaButton).outlineWidth) > 0"), kind + ' visible keyboard focus')
    await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', text: '\r', code: 'Enter', windowsVirtualKeyCode: 13 })
    await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', text: '\r', code: 'Enter', windowsVirtualKeyCode: 13, autoRepeat: true })
    await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
    await pause(150)
    const state = await evaluate('window.qaState()')
    assert.equal(state.calls.length, 1, kind + ' repeated Enter')
    assert.match(state.message, /pode não ficar salvo/)
    assert.ok(await evaluate("document.activeElement?.tagName === 'H1' || document.activeElement?.tagName === 'H2'"), kind + ' focus after advancing')
  }
  assert.deepEqual(exceptions, [])
  console.log('PASS: learning progress real components / StrictMode / injected memory store. ' + JSON.stringify(result))
  console.log('PASS: 390/1366px new controls, no overflow, repeated Enter, post-advance focus, nonblocking session-only messages.')
} finally {
  socket?.close(); chrome.kill(); await server.close(); await pause(500)
  const resolved = path.resolve(profile)
  if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith('falalivre-learning-qa-')) throw Error('unsafe temporary path')
  try { fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { console.log('Temporary Chrome profile could not be removed: ' + resolved) }
}
