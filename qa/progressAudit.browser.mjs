import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Audit-only harness. Native storage below belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/src/index.css"></head><body><div id="root"></div><script type="module">
import React from '/node_modules/.vite/deps/react.js';
import ReactDOMClient from '/node_modules/.vite/deps/react-dom_client.js';
const { createRoot } = ReactDOMClient;
import Communication from '/src/pages/Communication.jsx';
import Words from '/src/pages/WordsAndPhrases.jsx';
import Writing from '/src/pages/Writing.jsx';
import Routines from '/src/pages/SequenceGame.jsx';
import Scenarios from '/src/pages/InteractiveSituationsGame.jsx';
import Emotions from '/src/pages/MyDayEmotions.jsx';
import Path from '/src/pages/PathGame.jsx';
import Puzzle from '/src/pages/PuzzleGame.jsx';
import WordSearch from '/src/pages/WordSearchGame.jsx';
import Memory from '/src/pages/MemoryGame.jsx';
import Find from '/src/pages/FindImageGame.jsx';
import Belongs from '/src/pages/WhereBelongsGame.jsx';
import App from '/src/App.jsx';
import { createProgressStore, PROGRESS_STORAGE_KEY } from '/src/utils/progressStorage.js';
import { getLearningProgressRecorder } from '/src/utils/learningProgress.js';
import { createEmptyProgress, serializeProgress, validateProgress, applyProgressCommand, getLevelAvailability } from '/src/utils/progress.js';
import { learningWords } from '/src/data/learningWords.js';
import { myDayRoutines } from '/src/data/myDayRoutines.js';
import { myDayCommunication } from '/src/data/myDayCommunication.js';
import { saveModuleRotation, loadContentRotation } from '/src/utils/contentRotationStorage.js';
import { updatePreference, resetPreferences, getPreferences } from '/src/utils/preferences.js';
let writes=0, subscriptions=0, root;
const active=new Set();
function target(base) { return { get visibilityState(){return document.visibilityState},addEventListener(type,callback){active.add({base,type,callback});base.addEventListener(type,callback)},removeEventListener(type,callback){for(const entry of active)if(entry.base===base&&entry.type===type&&entry.callback===callback)active.delete(entry);base.removeEventListener(type,callback)} } }
const eventTarget=target(window),docTarget=target(document);
const store=createProgressStore({getStorage:()=>({getItem:key=>localStorage.getItem(key),setItem(key,value){writes++;localStorage.setItem(key,value)}}),getEventTarget:()=>eventTarget,getDocument:()=>docTarget});
const service={...store,subscribeProgress(callback){subscriptions++;const stop=store.subscribeProgress(callback);return()=>{subscriptions--;stop()}}};
const components={communication:Communication,words:Words,writing:Writing,routines:Routines,scenarios:Scenarios,emotions:Emotions,path:Path,puzzle:Puzzle,wordsearch:WordSearch,memory:Memory,find:Find,belongs:Belongs,app:App};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms??30));
function seed(module,ids,id){saveModuleRotation(module,{order:ids,currentIndex:ids.indexOf(id),cycle:1,lastThemeId:null})}
async function mount(kind,session=false){root?.unmount();await pause();root=createRoot(document.getElementById('root'));let source=service;if(session)source=createProgressStore({getStorage:()=>({getItem:()=>null,setItem(){throw Error('quota')}}),getLocks:()=>null});root.render(React.createElement(React.StrictMode,null,React.createElement(components[kind],{progressService:source,embedded:kind==='routines'||kind==='scenarios',continuous:kind==='scenarios'})));await pause();await pause();return {listeners:active.size,subscriptions,writes};}
async function click(text){const button=[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()===text&&!b.disabled);if(!button)throw Error('missing '+text);button.click();await pause();}
async function select(selector){const button=document.querySelector(selector);if(!button)throw Error('missing '+selector);button.click();await pause();}
window.audit={store,recorder:getLearningProgressRecorder(service),mount,click,select,pause,seed,learningWords,myDayRoutines,myDayCommunication,loadContentRotation,updatePreference,resetPreferences,getPreferences,createEmptyProgress,serializeProgress,validateProgress,applyProgressCommand,getLevelAvailability,
snapshot:()=>store.getProgressSnapshot(),counts:()=>({writes,subscriptions,listeners:active.size,types:[...active].map(entry=>entry.type).sort()}),raw:()=>localStorage.getItem(PROGRESS_STORAGE_KEY),key:PROGRESS_STORAGE_KEY,
unmount:async()=>{root?.unmount();root=null;await pause();return {listeners:active.size,subscriptions,writes}}};
await store.loadProgress();window.auditReady=true;
</script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4196, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-audit-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9346', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const sockets = [], errors = [], warnings = [], observations = []
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
  for (let i = 0; i < 100; i++) { try { targets = await (await fetch('http://127.0.0.1:9346/json/list')).json(); if (targets.some(t => t.type === 'page')) break } catch { /* Startup. */ } await pause(100) }
  const A = await connect(targets.find(t => t.type === 'page'))
  const tab = await (await fetch('http://127.0.0.1:9346/json/new?about:blank', { method: 'PUT' })).json()
  const B = await connect(tab)
  for (const page of [A, B]) { await page.cdp('Page.navigate', { url: 'http://127.0.0.1:4196/__audit' }); await ready(page) }
  for (const page of [A, B]) { await act(page, "await a.mount('communication');return a.counts()"); assert.equal((await act(page, 'return a.counts()')).subscriptions, 1) }
  assert.equal(await act(A, 'return a.raw()'), null)
  // Full educational flow on one real shared store, through actual UI controls.
  await act(A, "await a.click('Concluir exploração');await a.pause(80)")
  for (let i = 0; i < 100 && !(await act(B, "return a.snapshot().effectiveProgress?.exploredActivities.communication.includes('guided-exploration')")); i++) await pause(30)
  assert.equal(await act(B, "return a.snapshot().effectiveProgress.exploredActivities.communication.includes('guided-exploration')"), true)
  await act(A, "a.seed('wordsAndPhrases',a.learningWords.map(w=>w.id),'casa');await a.mount('words');await a.click('Continuar');await a.click(a.learningWords[0].word);await a.click('Continuar');await a.click(a.learningWords[0].sentenceAnswer);await a.click('Conferir');await a.pause(80)")
  await act(A, "a.seed('writing',a.learningWords.map(w=>w.id),'casa');await a.mount('writing');const e=document.querySelector('.writing-physical-entry input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'CASA');e.dispatchEvent(new Event('input',{bubbles:true}));await a.pause();await a.click('Conferir');await a.click('Praticar no caderno');await a.click('Concluir prática');await a.pause(80)")
  await act(A, "const r=a.myDayRoutines[0];a.seed('myDayRoutines',a.myDayRoutines.map(r=>r.id),r.id);await a.mount('routines');for(let i=0;i<r.steps.length;i++){if([...document.querySelectorAll('.sequence-select strong')][i].textContent===r.steps[i].word)continue;await a.select('[aria-label=\"Selecionar '+r.steps[i].word+'\"]');await a.select('.sequence-position[aria-label=\"Posição '+(i+1)+'\"]')}await a.click('Conferir');await a.pause(80)")
  await act(A, "const s=a.myDayCommunication[0];a.seed('myDayCommunication',a.myDayCommunication.map(s=>s.id),s.id);await a.mount('scenarios');for(const token of s.expectedTokens)await a.select('[aria-label=\"Selecionar '+s.options.find(o=>o.id===token).word+'\"]');await a.click('Conferir frase');await a.pause(80)")
  await act(A, "await a.mount('emotions');await a.select('[aria-label=\"Abrir Conhecer emoções\"]');await a.click('Próximo conceito');await a.pause(80);await a.mount('puzzle');for(let i=0;i<4;i++)await a.click('Preciso de ajuda');await a.pause(80)")
  assert.equal(await act(A, 'return document.querySelectorAll("nav button")[1].getAttribute("aria-disabled")'), 'false')
  await act(A, 'document.querySelectorAll("nav button")[1].click();await a.pause();for(let i=0;i<6;i++)await a.click("Preciso de ajuda");await a.pause(80)')
  assert.equal(await act(A, 'return document.querySelectorAll("nav button")[2].getAttribute("aria-disabled")'), 'false')
  const integrated = await act(A, 'return a.snapshot().persistedProgress')
  assert.equal(await act(A, 'return a.validateProgress(a.snapshot().persistedProgress).valid'), true)
  assert.equal(integrated.revision, 11)
  assert.deepEqual(integrated.performedActivities.writing.casa, ['typing', 'notebook', 'complete'])
  assert.deepEqual(integrated.completedLevels['quebra-cabeca'], ['casa', 'gato'])
  const raw = await act(A, 'return a.raw()'), rotation = await act(A, 'return JSON.stringify(a.loadContentRotation())')
  await act(A, "a.updatePreference('voice','QA Português');a.updatePreference('elementSize','large');a.updatePreference('reduceMotion',true);return true")
  assert.equal(await act(A, 'return a.raw()'), raw); assert.equal(await act(A, 'return JSON.stringify(a.loadContentRotation())'), rotation)
  await act(A, 'a.resetPreferences();return true')
  assert.equal(await act(A, 'return a.raw()'), raw); assert.equal(await act(A, 'return JSON.stringify(a.loadContentRotation())'), rotation)
  await A.evaluate('window.auditReady=false'); await A.cdp('Page.reload', { ignoreCache: true }); await ready(A)
  assert.equal(await act(A, 'return a.raw()'), raw); assert.equal(await act(A, 'return JSON.stringify(a.loadContentRotation())'), rotation)
  assert.equal((await act(A, 'return a.counts()')).writes, 0)
  await act(A, "await a.mount('puzzle')"); assert.equal(await act(A, 'return document.querySelectorAll("nav button")[2].getAttribute("aria-disabled")'), 'false')
  console.log('PASS: integrated real UI flow, all six learning modules + Puzzle N1/N2, native durable refresh, revision 11, shared tab notification. Snapshot: ' + JSON.stringify(integrated))
  // Separate actual pages perform near-simultaneous commands under native locks.
  const beforeDomains = await act(A, 'return {rotation:JSON.stringify(a.loadContentRotation()),preferences:JSON.stringify(a.getPreferences())}')
  const concurrent = await Promise.all([act(A, "return a.recorder.recordLevelCompleted('caminho','sono')"), act(B, "return a.recorder.recordLevelCompleted('memoria','memory-1')")])
  assert.deepEqual(concurrent.map(r => r.status), ['saved', 'saved'])
  await act(A, 'await a.store.loadProgress()'); await act(B, 'await a.store.loadProgress()')
  const shared = await act(A, 'return a.snapshot().persistedProgress'); assert.equal(shared.revision, 13)
  assert.deepEqual(shared.completedLevels.caminho, ['sono']); assert.deepEqual(shared.completedLevels.memoria, ['memory-1'])
  assert.deepEqual(await act(B, 'return a.snapshot().persistedProgress'), shared)
  assert.deepEqual(await act(A, 'return {rotation:JSON.stringify(a.loadContentRotation()),preferences:JSON.stringify(a.getPreferences())}'), beforeDomains)
  // Force an obsolete captured command to wait for the lock while tab A replaces generation.
  await act(A, "window.lockEntered=false;window.hold=navigator.locks.request('falaLivre:progress',async()=>{window.lockEntered=true;await new Promise(resolve=>window.releaseLock=resolve)});return true")
  for (let i = 0; i < 100 && !(await A.evaluate('window.lockEntered')); i++) await pause(10)
  await act(B, "window.pendingOld=a.store.recordLevelCompleted('memoria','memory-2');return true")
  await act(A, 'const p=a.createEmptyProgress(crypto.randomUUID());localStorage.setItem(a.key,a.serializeProgress(p));window.releaseLock();await window.hold;return true')
  const stale = await B.evaluate('window.pendingOld'); assert.equal(stale.status, 'rejected'); assert.equal(stale.reason, 'stale-generation')
  await act(A, 'await a.store.loadProgress()'); await act(B, 'await a.store.loadProgress()')
  assert.equal((await act(A, "return a.recorder.recordLevelCompleted('caminho','sono')")).status, 'saved')
  await act(B, 'await a.store.loadProgress()')
  await act(A, 'localStorage.removeItem(a.key);await a.store.loadProgress()')
  await pause(100); assert.equal(await act(B, 'return a.raw()'), null)
  assert.equal((await act(B, "return a.recorder.recordLevelCompleted('memoria','memory-1')")).status, 'rejected')
  assert.equal(await act(A, 'return a.raw()'), null)
  console.log('PASS: two actual same-origin Chrome pages: storage notifications, simultaneous independent writes, old queued generation rejected, external removal never restores cache.')
  // Each private payload is rejected without ever reaching localStorage.
  const privacy = await act(A, "const fields=['message','feeling','need','answer','attempt','score','time','audio','drawing','name'];const before=a.counts().writes;for(const field of fields){const p=a.createEmptyProgress(crypto.randomUUID());if(a.applyProgressCommand(p,{type:'completed',gameId:'caminho',levelId:'sono',[field]:'fixture-only'}).valid)throw Error('private command accepted');if((await a.store.recordLevelCompleted('caminho','sono',{[field]:'fixture-only'})).status!=='rejected')throw Error('extra payload accepted')}return a.counts().writes===before")
  assert.equal(privacy, true)
  // Responsiveness: isolate each mounted view from invalidated durable state.
  await act(A, 'await a.unmount()'); assert.equal((await act(A, 'return a.counts()')).listeners, 0)
  const kinds = ['communication', 'words', 'writing', 'routines', 'scenarios', 'emotions', 'path', 'puzzle', 'wordsearch', 'memory', 'find', 'belongs']
  for (const width of [320, 360, 390, 430, 768, 1024, 1366]) for (const kind of kinds) {
    await A.cdp('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 })
    await act(A, `await a.mount('${kind}',true);if('${kind}'==='emotions')await a.select('[aria-label="Abrir Conhecer emoções"]');a.updatePreference('elementSize','normal');return true`)
    if (['path', 'puzzle', 'wordsearch', 'memory', 'find', 'belongs'].includes(kind)) {
      await act(A, 'document.querySelectorAll("nav button")[1].click();await a.pause()')
      assert.match(await A.evaluate('document.querySelector(".game-progress-feedback").textContent'), /Nível 2.*Nível 1/)
    }
    const metrics = await A.evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth,main:document.querySelector("main").getBoundingClientRect().toJSON()})')
    if (metrics.scroll > width + 1) observations.push({ width, kind, overflow: metrics.scroll - width, introducedControl: await A.evaluate('[...document.querySelectorAll(".game-progress-feedback,nav button")].some(e=>e.getBoundingClientRect().right>innerWidth+1||e.getBoundingClientRect().left<0)') })
    const selector = kind === 'communication' ? [...['Concluir exploração']][0] : kind === 'emotions' ? 'Próximo conceito' : null
    if (selector) await act(A, `window.focused=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='${selector}');window.focused.focus()`)
    else await A.evaluate('window.focused=document.querySelector("nav button[aria-disabled=true]")||document.querySelector("main button:not(:disabled)");window.focused.focus()')
    await A.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 }); await A.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 })
    assert.equal(await A.evaluate('getComputedStyle(window.focused).outlineStyle!=="none"&&parseFloat(getComputedStyle(window.focused).outlineWidth)>0'), true, kind + ' focus ' + width)
    if (kind === 'communication' || kind === 'emotions') {
      await A.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 }); await A.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 }); await pause(80)
      assert.equal(await A.evaluate('document.querySelector("main").textContent.includes("pode não ficar salvo")'), true, kind + ' Space activation')
    }
    await act(A, "a.updatePreference('elementSize','large');return true")
    const large = await A.evaluate('document.documentElement.scrollWidth')
    if (large > width + 1) observations.push({ width, kind, largeTextOverflow: large - width, introducedControl: await A.evaluate('[...document.querySelectorAll(".game-progress-feedback,nav button")].some(e=>e.getBoundingClientRect().right>innerWidth+1||e.getBoundingClientRect().left<0)') })
  }
  // Exercise the completion controls and resulting session messages as well as
  // the entry views, at every requested width. These stores are injected memory.
  for (const width of [320, 360, 390, 430, 768, 1024, 1366]) for (const kind of ['words', 'writing', 'routines', 'scenarios']) {
    await A.cdp('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 })
    await act(A, "a.seed('wordsAndPhrases',a.learningWords.map(w=>w.id),'casa');a.seed('writing',a.learningWords.map(w=>w.id),'casa');a.seed('myDayRoutines',a.myDayRoutines.map(r=>r.id),a.myDayRoutines[0].id);a.seed('myDayCommunication',a.myDayCommunication.map(s=>s.id),a.myDayCommunication[0].id);return true")
    await act(A, `await a.mount('${kind}',true);a.updatePreference('elementSize','normal');return true`)
    if (kind === 'words') await act(A, "await a.click('Continuar');await a.click(a.learningWords[0].word);await a.click('Continuar');await a.click(a.learningWords[0].sentenceAnswer);await a.click('Conferir');await a.pause(80)")
    if (kind === 'writing') {
      await act(A, "const e=document.querySelector('.writing-physical-entry input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'CASA');e.dispatchEvent(new Event('input',{bubbles:true}));await a.pause();await a.click('Conferir');await a.click('Praticar no caderno')")
      assert.equal(await A.evaluate('document.documentElement.scrollWidth<=innerWidth+1'), true, 'notebook control ' + width)
      await act(A, "await a.click('Concluir prática');await a.pause(80)")
    }
    if (kind === 'routines') await act(A, "const r=a.myDayRoutines[0];for(let i=0;i<r.steps.length;i++){if([...document.querySelectorAll('.sequence-select strong')][i].textContent===r.steps[i].word)continue;await a.select('[aria-label=\"Selecionar '+r.steps[i].word+'\"]');await a.select('.sequence-position[aria-label=\"Posição '+(i+1)+'\"]')}await a.click('Conferir');await a.pause(80)")
    if (kind === 'scenarios') await act(A, "const s=a.myDayCommunication[0];for(const token of s.expectedTokens)await a.select('[aria-label=\"Selecionar '+s.options.find(o=>o.id===token).word+'\"]');await a.click('Conferir frase');await a.pause(80)")
    assert.equal(await A.evaluate('document.querySelector("main").textContent.includes("pode não ficar salvo")'), true, kind + ' actual completion warning')
    assert.equal(await A.evaluate('document.documentElement.scrollWidth<=innerWidth+1'), true, kind + ' terminal width ' + width)
    await act(A, "a.updatePreference('elementSize','large');return true")
    assert.equal(await A.evaluate('document.documentElement.scrollWidth<=innerWidth+1'), true, kind + ' terminal large text ' + width)
  }
  console.log('PASS: 28 additional real learning completion flows across all seven widths; notebook completion control and session feedback, normal/large text.')
  // Repeated mounting leaves no injected progress listeners or subscriptions.
  for (let i = 0; i < 10; i++) { await act(A, "await a.mount('communication');return true"); assert.deepEqual((await act(A, 'return a.counts()')).types, ['focus', 'pageshow', 'storage', 'visibilitychange']); await act(A, 'await a.unmount()'); assert.equal((await act(A, 'return a.counts()')).subscriptions, 0); assert.equal((await act(A, 'return a.counts()')).listeners, 0) }
  await act(A, 'a.resetPreferences();await a.mount("app");return true'); assert.equal(await act(A, 'return a.raw()'), null)
  assert.equal(await A.evaluate('document.querySelector(".progress-entry a").getAttribute("href")'), '#/meu-progresso')
  console.log('RESPONSIVE OBSERVATIONS: ' + JSON.stringify(observations))
  assert.equal(observations.some(item => item.introducedControl), false, 'progress control overflow')
  assert.deepEqual(errors, []); assert.deepEqual(warnings, [])
  console.log('PASS: 84 mounted view/width combinations, normal/large text, focus and native Space; 10 StrictMode mount cycles listener cleanup; Home no progress. No React/console warnings or exceptions. Privacy negatives rejected.')
} finally {
  for (const socket of sockets) socket.close(); chrome.kill(); await server.close(); await pause(500)
  const resolved = path.resolve(profile)
  if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith('falalivre-audit-')) throw Error('unsafe temporary path')
  try { fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { console.log('Temporary Chrome profile remains: ' + resolved) }
}
