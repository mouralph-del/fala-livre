import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Audit-only harness. Native storage below belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4198, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-audit-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9348', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
// Focused App/Configurações/Responsáveis checks, using the actual application.
try {
  let targets
  for (let i = 0; i < 100; i++) { try { targets = await (await fetch('http://127.0.0.1:9348/json/list')).json(); if (targets.some(t => t.type === 'page')) break } catch { /* Startup. */ } await pause(100) }
  const A = await connect(targets.find(t => t.type === 'page'))
  const tab = await (await fetch('http://127.0.0.1:9348/json/new?about:blank', { method: 'PUT' })).json()
  const B = await connect(tab)
  const instrumentation = `
    window.__qaWrites=[];window.__qaSpoken=[];window.__qaConfirm=true;
    window.confirm=()=>window.__qaConfirm;
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){if(window.__qaFailPrefs&&key==='falalivre.preferences')throw Error('quota');window.__qaWrites.push(key);return original.call(this,key,value)};
    const voices=[{name:'Voz A',voiceURI:'qa-a',lang:'pt-BR',default:true},{name:'Voz B',voiceURI:'qa-b',lang:'pt-BR',default:false}];
    const synth=new EventTarget();synth.getVoices=()=>voices;synth.cancel=()=>{};synth.speak=u=>window.__qaSpoken.push({text:u.text,voice:u.voice?.name});
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth});
    window.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
  `
  for (const page of [A, B]) {
    await page.cdp('Page.addScriptToEvaluateOnNewDocument', { source: instrumentation })
    await page.cdp('Page.navigate', { url: 'http://127.0.0.1:4198/__audit#/perfil' }); await ready(page)
  }
  const text = () => A.evaluate('document.querySelector("main").textContent')
  const route = async hash => { await A.evaluate(`location.hash=${JSON.stringify(hash)}`); await pause(100) }
  const click = async selector => { await A.evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await pause(80) }
  assert.equal(await A.evaluate('document.querySelector("h1").textContent'), 'Configurações')
  assert.equal(await A.evaluate('document.title'), 'Configurações | Fala Livre')
  assert.deepEqual(await A.evaluate('Array.from(document.querySelectorAll(".header-navigation a"),a=>a.textContent)'), ['Meu Progresso', 'Configurações', 'Responsáveis / Sobre o Fala Livre', 'Entrar', 'Criar conta'])
  assert.equal(await A.evaluate('document.querySelectorAll(".header-navigation a").length'), 5)
  assert.equal(await A.evaluate(`document.querySelector('.header-navigation a[href="#/responsaveis"]') !== null`), true)
  assert.deepEqual(await A.evaluate('Array.from(document.querySelectorAll("input[name=learnCharacter],input[name=gameCharacter]"),i=>({value:i.value,disabled:i.disabled,checked:i.checked}))'), [
    {value:'girl',disabled:false,checked:true},{value:'boy',disabled:false,checked:false},{value:'girl',disabled:false,checked:false},{value:'boy',disabled:false,checked:true},
  ])
  // All four combinations use existing Home illustrations and survive refresh.
  for (const learn of ['girl', 'boy']) for (const game of ['girl', 'boy']) {
    await click(`input[name="learnCharacter"][value="${learn}"]`)
    await click(`input[name="gameCharacter"][value="${game}"]`)
    const previews = await A.evaluate('Array.from(document.querySelectorAll(".profile-character-preview"),i=>i.src)')
    await route('/')
    assert.deepEqual(await A.evaluate('Array.from(document.querySelectorAll("img.activity-illustration"),i=>i.src)'), previews)
    await route('/perfil')
    await A.cdp('Page.reload'); await pause(200); await ready(A)
    assert.deepEqual(await A.evaluate('Array.from(document.querySelectorAll("input[name=learnCharacter]:checked,input[name=gameCharacter]:checked"),i=>i.value)'), [learn, game])
  }
  await click('input[name="learnCharacter"][value="girl"]')
  await click('input[name="gameCharacter"][value="boy"]')
  // Seed only an isolated browser profile; then verify the actual restore UI.
  const originals = await A.evaluate(`(async()=>{
    const p=await import('/src/utils/progress.js');const s=await import('/src/utils/progressStorage.js');const r=await import('/src/utils/contentRotationStorage.js');
    const empty=p.createEmptyProgress('12345678-1234-4234-8234-123456789abc');
    const recorded=p.applyProgressCommand(empty,{type:'explored',moduleId:'communication',activityId:'guided-exploration'}).progress;
    localStorage.setItem(s.PROGRESS_STORAGE_KEY,p.serializeProgress(recorded));
    r.saveModuleRotation('communication',{order:['one','two'],currentIndex:1,cycle:1,lastThemeId:'one'});
    window.__qaKeys={progress:s.PROGRESS_STORAGE_KEY,rotation:r.CONTENT_ROTATION_STORAGE_KEY};
    return {progress:localStorage.getItem(s.PROGRESS_STORAGE_KEY),rotation:localStorage.getItem(r.CONTENT_ROTATION_STORAGE_KEY)};
  })()`)
  await click('input[name="elementSize"]:not(:checked)')
  await click('input[type="checkbox"]')
  // Each radio is in its own label: choose explicitly the second mock voice.
  await A.evaluate(`Array.from(document.querySelectorAll('input[name="voice"]'))[2].click()`); await pause(80)
  await A.evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Ouvir exemplo').click()`)
  assert.deepEqual(await A.evaluate('window.__qaSpoken.at(-1)'), {text:'Olá! Eu sou a voz do Fala Livre.',voice:'Voz B'})
  assert.equal(await A.evaluate('document.documentElement.dataset.elementSize'), 'large')
  assert.equal(await A.evaluate('document.documentElement.dataset.reduceMotion'), 'true')
  for (let i=0;i<50 && !(await B.evaluate('document.querySelector("input[name=elementSize]:checked").parentElement.textContent.includes("Grande")'));i++) await pause(30)
  assert.equal(await B.evaluate('document.documentElement.dataset.elementSize'), 'large')
  assert.equal(await B.evaluate('document.documentElement.dataset.reduceMotion'), 'true')
  await A.cdp('Page.reload'); await pause(200); await ready(A)
  assert.equal(await A.evaluate('document.querySelector("input[name=elementSize]:checked").parentElement.textContent'), 'Grande')
  assert.equal(await A.evaluate('document.querySelector("input[type=checkbox]").checked'), true)
  assert.match(await A.evaluate('document.querySelector("input[name=voice]:checked").parentElement.textContent'), /Voz B/)
  await A.evaluate('window.__qaConfirm=false')
  const prefs = await A.evaluate('localStorage.getItem("falalivre.preferences")')
  await click('.profile-restore button')
  assert.equal(await A.evaluate('localStorage.getItem("falalivre.preferences")'), prefs)
  await A.evaluate('window.__qaConfirm=true;window.__qaWrites=[]')
  await click('.profile-restore button')
  assert.deepEqual(await A.evaluate('JSON.parse(localStorage.getItem("falalivre.preferences"))'), {learnCharacter:'girl',gameCharacter:'boy',voice:null,elementSize:'normal',reduceMotion:false,gameTimeLimit:'unlimited',customGameMinutes:20})
  assert.deepEqual(await A.evaluate('window.__qaWrites'), ['falalivre.preferences'])
  const actualStored = await A.evaluate(`(async()=>{const s=await import('/src/utils/progressStorage.js');const r=await import('/src/utils/contentRotationStorage.js');return {progress:localStorage.getItem(s.PROGRESS_STORAGE_KEY),rotation:localStorage.getItem(r.CONTENT_ROTATION_STORAGE_KEY)}})()`)
  assert.deepEqual(actualStored, originals)
  await A.evaluate('window.__qaFailPrefs=true')
  await click('input[name="elementSize"]:not(:checked)')
  assert.match(await text(), /Preferência aplicada nesta sessão/)
  assert.equal(await A.evaluate('document.documentElement.dataset.elementSize'), 'large')
  assert.equal(await A.evaluate('JSON.parse(localStorage.getItem("falalivre.preferences")).elementSize'), 'normal')
  await A.cdp('Page.reload'); await pause(200); await ready(A)
  assert.equal(await A.evaluate('document.documentElement.dataset.elementSize'), 'normal')
  await click('.profile-guidance a')
  assert.equal(await A.evaluate('location.hash'), '#/responsaveis')
  assert.equal(await A.evaluate('document.title'), 'Responsáveis | Fala Livre')
  assert.equal(await A.evaluate('document.querySelector("h1").textContent'), 'Responsáveis')
  assert.deepEqual(await A.evaluate('Array.from(document.querySelectorAll("main h2"),h=>h.textContent)'), ['Sobre o Fala Livre','Acompanhar atividades','Preferências e acessibilidade','Tempo de jogos','Privacidade e dados','Sobre os pictogramas'])
  for (const pattern of [/aplicação educativa/, /Não medem domínio/, /diferentes pessoas neste navegador/, /não registram emoções ou necessidades pessoais/, /não são salvos como progresso/, /não são vinculados a uma pessoa ou conta/, /Sergio Palao/, /Governo de Aragão/]) assert.match(await text(), pattern)
  assert.equal(await A.evaluate(`document.querySelector('main a[href="https://arasaac.org"]').textContent`), 'ARASAAC')
  assert.equal(await A.evaluate(`document.querySelector('main a[href="https://creativecommons.org/licenses/by-nc-sa/4.0/"]').textContent`), 'CC BY-NC-SA 4.0')
  assert.equal(await A.evaluate('document.querySelectorAll("main button,main input,main form").length'), 0)
  assert.doesNotMatch(await text(), /PIN|senha|login|área protegida|limite de tempo|offline|\d+ de \d+/i)
  await A.cdp('Page.reload'); await pause(200); await ready(A)
  assert.equal(await A.evaluate('document.querySelector("h1").textContent'), 'Responsáveis')
  await click('main a[href="#/meu-progresso"]')
  assert.equal(await A.evaluate('document.querySelector("h1").textContent'), 'Meu Progresso')
  assert.match(await text(), /Exploração de comunicação: Realizado/)
  await route('/responsaveis'); await click('main a[href="#/perfil"]')
  assert.equal(await A.evaluate('document.querySelector("h1").textContent'), 'Configurações')
  await route('/responsaveis'); await click('main a[href="#/"]')
  assert.equal(await A.evaluate('document.querySelectorAll(".activity-card").length'), 2)
  assert.equal(await A.evaluate(`document.querySelectorAll('.home a[href="#/responsaveis"]').length`), 0)
  await route('/unknown'); assert.equal(await A.evaluate('document.querySelector(".home") !== null'), true)
  for (const width of [320,360,390,430,768,1024,1366]) {
    await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<500})
    for (const hash of ['/perfil','/responsaveis']) {
      await route(hash)
      for (const size of ['normal','large']) {
        await A.evaluate(`(async()=>{const p=await import('/src/utils/preferences.js');p.updatePreference('elementSize','${size}');p.updatePreference('reduceMotion',true)})()`)
        for (const zoom of ['1','1.25']) {
          await A.evaluate(`document.documentElement.style.zoom='${zoom}'`)
          assert.equal(await A.evaluate('document.documentElement.scrollWidth<=innerWidth+1'), true, `${hash} ${width} ${size} zoom ${zoom}`)
          assert.equal(await A.evaluate('Array.from(document.querySelectorAll(".header-navigation a,main a")).filter(a=>a.getClientRects().length).map(a=>a.getBoundingClientRect()).every(r=>r.width>0&&r.left>=-1&&r.right<=innerWidth+1)'), true, `links ${hash} ${width} ${size} ${zoom}`)
        }
        await A.evaluate('document.documentElement.style.zoom=""')
      }
    }
  }
  await A.cdp('Page.bringToFront'); await route('/perfil')
  await A.evaluate('document.querySelector(".profile-guidance a").focus()')
  await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9})
  await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9})
  assert.equal(await A.evaluate('document.activeElement.textContent'), 'Restaurar configurações padrão')
  await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8})
  await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8})
  assert.equal(await A.evaluate('parseFloat(getComputedStyle(document.activeElement).outlineWidth)>0'), true)
  await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13})
  await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13}); await pause(100)
  assert.equal(await A.evaluate('location.hash'), '#/responsaveis')
  assert.equal(await A.evaluate('document.activeElement.id'), 'conteudo')
  await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9})
  await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9})
  assert.equal(await A.evaluate('document.activeElement.textContent'), 'Voltar ao início')
  assert.equal(await A.evaluate('parseFloat(getComputedStyle(document.activeElement).outlineWidth)>0'), true)
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
  console.log('PASS: focused Configurações/Responsáveis/App flows, real preferences refresh/session/two tabs, restore isolation, voice mock, direct routes/links/refresh, Meu Progresso smoke, seven widths normal/Grande and zoom 125%, keyboard/focus, credits/privacy; no console errors or warnings.')
} finally {
  for (const socket of sockets) socket.close(); chrome.kill(); await server.close(); await pause(500)
  const resolved = path.resolve(profile)
  if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith('falalivre-audit-')) throw Error('unsafe temporary path')
  try { fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { console.log('Temporary Chrome profile remains: ' + resolved) }
}
