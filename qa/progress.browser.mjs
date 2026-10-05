import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Real React/StrictMode and native Web Locks. All persistence is injected memory;
// Chrome uses a separate temporary profile and never user localStorage.
const html = `<!doctype html><html><body><div id="root"></div><script type="module">
import React from '/node_modules/.vite/deps/react.js';
import ReactDOMClient from '/node_modules/.vite/deps/react-dom_client.js';
const { StrictMode } = React;
const { createRoot } = ReactDOMClient;
import { useProgress } from '/src/hooks/useProgress.js';
import { createProgressStore } from '/src/utils/progressStorage.js';
const check = (condition, message) => { if (!condition) throw Error(message); };
const pause = () => new Promise(resolve => setTimeout(resolve, 30));
let raw = null, writes = 0, subscriptions = 0, reads = 0, rendering = false;
const storage = { getItem() { check(!rendering, 'read during render'); reads++; return raw; }, setItem(key, value) { check(!rendering, 'write during render'); writes++; raw = value; } };
const store = createProgressStore({ getStorage: () => storage });
const adapter = { ...store, subscribeProgress(listener) { subscriptions++; const unsubscribe = store.subscribeProgress(listener); return () => { subscriptions--; unsubscribe(); }; } };
let latest, renders = 0;
function Probe() {
  rendering = true;
  const value = useProgress(adapter);
  rendering = false;
  latest = value.snapshot; renders++;
  return React.createElement('p', null, value.snapshot.status);
}
try {
  check(navigator.locks && navigator.locks.request, 'native Web Locks unavailable');
  const root = createRoot(document.getElementById('root'));
  root.render(React.createElement(StrictMode, null, React.createElement(Probe)));
  await pause(); await pause();
  check(subscriptions === 1, 'StrictMode leaves exactly one subscription');
  check(writes === 0, 'mount does not initialize or write');
  check(reads > 0 && latest.status === 'absent', 'effect loads after commit');
  const snapshot = store.getProgressSnapshot();
  await store.loadProgress(); check(store.getProgressSnapshot() === snapshot, 'stable snapshot');
  check((await store.initializeProgress()).status === 'saved', 'explicit initialization');
  const second = createProgressStore({ getStorage: () => storage }); await second.loadProgress();
  await Promise.all([store.recordLevelCompleted('caminho', 'sono'), second.recordLevelCompleted('memoria', 'memory-1')]);
  await store.loadProgress(); await pause();
  check(latest !== snapshot && latest.persistedProgress.revision === 2, 'React sees new reference and concurrent native-lock writes');
  check(latest.persistedProgress.completedLevels.caminho.includes('sono') && latest.persistedProgress.completedLevels.memoria.includes('memory-1'), 'no lost native-lock update');
  const writesBefore = writes;
  window.dispatchEvent(new Event('focus')); window.dispatchEvent(new Event('pageshow')); await pause();
  check(writes === writesBefore, 'notifications do not write');
  root.unmount(); await pause(); check(subscriptions === 0, 'unmount cleanup');
  const readsBefore = reads; window.dispatchEvent(new Event('focus')); await pause(); check(reads === readsBefore, 'no listeners after unmount');
  const remount = createRoot(document.getElementById('root')); remount.render(React.createElement(StrictMode, null, React.createElement(Probe))); await pause(); await pause();
  check(subscriptions === 1 && writes === writesBefore, 'remount without write or duplicate subscriptions');
  remount.unmount(); await pause(); check(subscriptions === 0, 'remount cleanup');
  window.qaResult = { passed: true, renders, writes, nativeLocks: true };
} catch (error) { window.qaResult = { passed: false, message: error.message, stack: error.stack }; }
</script></body></html>`

const server = await createServer({ server: { host: '127.0.0.1', port: 4193, strictPort: true }, plugins: [{ name: 'progress-qa', configureServer(server) { server.middlewares.use('/__progress-qa', (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(html) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir())
const profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-progress-qa-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9343', '--remote-allow-origins=http://localhost', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
let socket
try {
  let target
  for (let i = 0; i < 100; i++) {
    try { target = (await (await fetch('http://127.0.0.1:9343/json/list')).json()).find(item => item.type === 'page'); if (target) break } catch { /* Startup only. */ }
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
  await cdp('Page.navigate', { url: 'http://127.0.0.1:4193/__progress-qa' })
  let result
  for (let i = 0; i < 200; i++) {
    const evaluated = await cdp('Runtime.evaluate', { expression: 'window.qaResult', returnByValue: true })
    result = evaluated.result.value
    if (result) break
    await pause(100)
  }
  assert.ok(result, `browser finished; exceptions: ${JSON.stringify(exceptions)}`)
  assert.equal(result.passed, true, JSON.stringify(result))
  assert.deepEqual(exceptions, [])
  console.log('PASS: real React StrictMode mount/unmount/remount, subscription cleanup, stable snapshots, post-commit reads, no render writes, native Web Locks concurrency. ' + JSON.stringify(result))
} finally {
  socket?.close()
  chrome.kill()
  await server.close()
  await pause(500)
  // Verify the absolute target is our own named temporary child before deletion.
  const resolvedProfile = path.resolve(profile)
  if (path.dirname(resolvedProfile) !== tempRoot || !path.basename(resolvedProfile).startsWith('falalivre-progress-qa-')) throw Error('unsafe temporary path')
  try { fs.rmSync(resolvedProfile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) }
  catch { console.log('Temporary Chrome profile could not be removed: ' + resolvedProfile) }
}
