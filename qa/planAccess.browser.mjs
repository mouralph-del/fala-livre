import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Targeted navigation styling harness. Native storage belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4221, strictPort: true }, plugins: [{ name: 'plan-access-qa', configureServer(server) {
  for (const entry of ['/__audit', '/__premium-qa']) server.middlewares.use(entry, async (request, response) => {
    response.setHeader('Content-Type', 'text/html')
    response.end(await server.transformIndexHtml(entry, entry === '/__premium-qa' ? html.replace('/src/main.jsx', '/qa/premiumAccess.fixture.jsx') : html))
  })
} }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-plan-access-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9371', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
  for(let i=0;i<100;i++){try{targets=await(await fetch('http://127.0.0.1:9371/json/list')).json();if(targets.some(t=>t.type==='page'))break}catch{}await pause(100)}
  const A=await connect(targets.find(t=>t.type==='page')),ev=A.evaluate
  await A.cdp('Page.addScriptToEvaluateOnNewDocument',{source:'window.__clock=1791388800000;Date.now=()=>window.__clock'})
  await A.cdp('Page.navigate',{url:'http://127.0.0.1:4221/__audit#/'});await ready(A)
  const route=async hash=>{await ev('location.hash='+JSON.stringify(hash));await pause(100)}
  const click=async selector=>{await ev('(()=>{const e=document.querySelector('+JSON.stringify(selector)+');e.focus();e.click()})()');await pause(60)}
  const key=async name=>{for(const type of ['keyDown','keyUp'])await A.cdp('Input.dispatchKeyEvent',{type,key:name,code:name===' '?'Space':name,windowsVirtualKeyCode:{Enter:13,Escape:27,Tab:9,' ':32}[name],text:type==='keyDown'&&name==='Enter'?'\r':undefined});await pause(60)}
  const advance=async ms=>{await ev(`(async()=>{window.__clock+=${ms};(await import('/src/utils/gameTime.js')).getGameTimeTracker().tick()})()`);await pause(50)}
  const usage=()=>ev('JSON.parse(localStorage.getItem("falaLivre_gameTime_v1")).consumedMs')
  await ev(`(async()=>{const p=(await import('/src/utils/progress.js')).createEmptyProgress('12345678-1234-4234-8234-123456789abc');p.performedActivities.myDayRoutines['escovar-dentes']=['complete'];p.completedLevels.caminho=['sono'];localStorage.setItem('falaLivre_progress_v1',JSON.stringify(p));localStorage.setItem('falaLivre_gameTime_v1',JSON.stringify({day:(await import('/src/utils/gameTimeCore.js')).localDay(Date.now()),consumedMs:12000}));(await import('/src/utils/preferences.js')).updatePreference('gameTimeLimit','15')})()`)
  await A.cdp('Page.reload');await pause(150);await ready(A)
  const preserved=await ev('localStorage.getItem("falaLivre_progress_v1")')
  const preferences=await ev('localStorage.getItem("falalivre.preferences")')
  const session=await ev('localStorage.getItem("falalivre.demo-session.v1")')
  assert.equal(await ev('document.querySelector("#welcome-title").textContent'),'Olá!')
  assert.equal(await ev('document.querySelector(".activity-card--play .premium-badge").textContent'),'Premium')
  await click('.activity-card--play .start-button')
  assert.equal(await ev('location.hash'),'#/');assert.equal(await ev('document.querySelector("dialog").open'),true)
  assert.equal(await ev('document.activeElement.className'),'premium-close')
  await key('Escape');assert.equal(await ev('document.querySelector("dialog")'),null)
  assert.equal(await ev('document.activeElement.className'),'start-button')
  await route('#/aprender')
  for(const id of ['communicate','write'])assert.equal(await ev(`document.querySelector('[data-activity="${id}"] .premium-badge')`),null)
  for(const id of ['words','myDay']) {
    assert.equal(await ev(`document.querySelector('[data-activity="${id}"] .premium-badge').textContent`),'Premium')
    await ev(`document.querySelector('[data-activity="${id}"] button').focus()`);await key('Enter')
    assert.equal(await ev('location.hash'),'#/aprender');assert.equal(await ev('document.querySelector("dialog").open'),true)
    assert.equal(await ev('document.querySelectorAll(".words-page,.myday-page,.sequence-page,.interactive-page").length'),0)
    await key('Tab');assert.equal(await ev('document.activeElement.textContent'),'Ver planos')
    await key('Tab');assert.equal(await ev('document.activeElement.className'),'premium-close')
    await key('Escape');assert.ok(await ev(`document.activeElement===document.querySelector('[data-activity="${id}"] button')`))
    await key(' ');assert.equal(await ev('document.querySelector("dialog").open'),true)
    await click('.premium-close');assert.equal(await ev('document.querySelector("dialog")'),null)
  }
  await click('[data-activity="words"] button');await click('dialog a');assert.equal(await ev('location.hash'),'#/planos')
  await click('.plan-choose');assert.equal(await ev(`(async()=> (await import('/src/services/planAccess.js')).getCurrentPlan())()`),'free')
  const games=await ev(`(async()=> (await import('/src/data/games.js')).games)()`)
  const protectedRoutes=['#/aprender/palavras-frases','#/aprender/meu-dia-a-dia','#/aprender/meu-dia-a-dia/rotinas','#/aprender/meu-dia-a-dia/comunicacao','#/aprender/meu-dia-a-dia/emocoes','#/aprender/situacoes','#/jogar',...games.map(g=>g.route)]
  for(const hash of protectedRoutes) {
    await route(hash);assert.equal(await ev('document.querySelectorAll(".premium-access-panel").length'),1,hash)
    assert.equal(await ev('document.querySelectorAll("main canvas,main .game-card,main .sequence-select,main .interactive-option,main .words-option").length'),0,hash)
    assert.equal(await ev('document.querySelector("main a").getAttribute("href")'),'#/planos')
    await advance(60000);assert.equal(await usage(),12000,'blocked route never consumes time: '+hash)
    assert.equal(await ev('localStorage.getItem("falaLivre_progress_v1")'),preserved)
    await A.cdp('Page.reload');await pause(150);await ready(A);assert.equal(await ev('document.querySelectorAll(".premium-access-panel").length'),1)
  }
  for(const [hash,selector] of [['#/aprender/comunicar','.communication-page'],['#/aprender/escrever','.writing-page'],['#/aprender/escrever/teclado','.writing-page'],['#/aprender/escrever/caderno','canvas'],['#/meu-progresso','.my-progress'],['#/perfil','.profile-page']]) {
    await route(hash);assert.ok(await ev('document.querySelector('+JSON.stringify(selector)+')!==null'),hash)
    assert.equal(await ev('document.querySelector(".premium-access-panel")'),null)
  }
  assert.equal(await ev('localStorage.getItem("falaLivre_progress_v1")'),preserved)
  const shots=path.join(tempRoot,'falalivre-plan-access-review');fs.mkdirSync(shots,{recursive:true})
  for(const width of [320,360,390,430,768,1024,1366])for(const size of ['normal','large']) {
    await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false})
    await ev(`document.documentElement.dataset.elementSize=${JSON.stringify(size)};document.documentElement.dataset.reduceMotion='true'`)
    for(const [name,hash,open] of [['home','#/',false],['learn','#/aprender',false],['notice','#/aprender',true],['games','#/jogar',false],['words','#/aprender/palavras-frases',false],['daily','#/aprender/meu-dia-a-dia/rotinas',false]]) {
      await route(hash);if(open)await click('[data-activity="myDay"] button')
      assert.ok(await ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'),width+size+name)
      assert.deepEqual(await ev('Array.from(document.querySelectorAll("main button,dialog button,main .premium-badge"),e=>({text:e.textContent,clipped:e.scrollWidth>e.clientWidth+1})).filter(e=>e.clipped)'),[])
      if(open){assert.ok(await ev('(()=>{const r=document.querySelector("dialog").getBoundingClientRect();return r.left>=8&&r.right<=innerWidth-8&&r.top>=8&&r.bottom<=innerHeight-8})()'));await key('Tab');assert.equal(await ev('getComputedStyle(document.activeElement).outlineStyle'),'solid')}
      if([390,1366].includes(width)&&size==='normal'){const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:75,captureBeyondViewport:true});fs.writeFileSync(path.join(shots,name+'-'+width+'.jpg'),Buffer.from(shot.data,'base64'))}
      if(open)await key('Escape')
    }
  }
  await route('#/aprender');await ev('document.querySelector("[data-activity=words] button").scrollIntoView({block:"center"})');await pause(60)
  const point=await ev('(()=>{const r=document.querySelector("[data-activity=words] button").getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()')
  await A.cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await A.cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(80)
  assert.equal(await ev('document.querySelector("dialog").open'),true);await click('.premium-close')
  assert.equal(await ev('localStorage.getItem("falalivre.demo-session.v1")'),session)
  assert.equal(await ev('localStorage.getItem("falalivre.preferences")'),preferences)
  // Real public demo login enables only the local demo session.
  await route('#/entrar')
  for(const [name,value] of [['email','teste@falalivre.com'],['password','FalaLivre123']])await ev(`(()=>{const input=document.querySelector('[name="${name}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}))})()`)
  await ev('document.querySelector("form").requestSubmit()');await pause(150)
  await route('#/')
  assert.equal(await ev('document.querySelector("#welcome-title").textContent'),'Olá, Noa!')
  assert.equal(await ev(`(async()=> (await import('/src/services/planAccess.js')).getCurrentPlan())()`),'premium-demo')
  const demoSession=await ev('localStorage.getItem("falalivre.demo-session.v1")')
  assert.deepEqual(JSON.parse(demoSession),{demo:true,responsibleName:'Alex',userName:'Noa'})
  await click('.activity-card--play .start-button');assert.equal(await ev('location.hash'),'#/jogar')
  await route('#/planos')
  assert.ok(await ev('document.querySelector(".plans-intro").textContent.includes("Acesso Premium de demonstração")'))
  const beforeChoose=await ev('JSON.stringify(Object.entries(localStorage))')
  await click('.plan-choose');assert.equal(await ev('JSON.stringify(Object.entries(localStorage))'),beforeChoose)
  await route('#/aprender')
  assert.equal(await ev('document.querySelectorAll(".learning-card .premium-badge").length'),0)
  for(const hash of protectedRoutes) {
    await route(hash);assert.equal(await ev('document.querySelector(".premium-access-panel")'),null,hash)
    assert.ok(await ev('document.querySelector("main h1")!==null'),hash)
  }
  await route('#/aprender/palavras-frases');await A.cdp('Page.reload');await pause(150);await ready(A)
  assert.equal(await ev(`(async()=> (await import('/src/services/planAccess.js')).getCurrentPlan())()`),'premium-demo')
  assert.equal(await ev('document.querySelector(".premium-access-panel")'),null)
  await route('#/jogar/memoria')
  assert.deepEqual(await ev('Array.from(document.querySelectorAll(".memory-level"),b=>b.getAttribute("aria-disabled"))'),['false','true','true'])
  const beforeTime=await usage();await advance(60000);assert.equal(await usage(),beforeTime+60000,'Premium preserves existing daily timer')
  await advance(900000);assert.equal(await usage(),900000);assert.ok(await ev('document.querySelector("main").textContent.includes("O tempo de jogos de hoje terminou.")'))
  assert.equal(await ev('localStorage.getItem("falaLivre_progress_v1")'),preserved)
  assert.equal(await ev('localStorage.getItem("falalivre.demo-session.v1")'),demoSession)
  assert.equal(await ev('localStorage.getItem("falalivre.preferences")'),preferences)
  await ev(`(async()=> (await import('/src/services/accountAccess.js')).signOut())()`);await pause(80)
  assert.ok(await ev('document.querySelector(".premium-access-panel")!==null'),'logout immediately removes Premium on the current route')
  assert.equal(await ev('localStorage.getItem("falalivre.demo-session.v1")'),null)
  await A.cdp('Page.reload');await pause(150);await ready(A)
  assert.ok(await ev('document.querySelector(".premium-access-panel")!==null'),'new visit without session stays free')
  assert.equal(await ev(`(async()=> (await import('/src/services/planAccess.js')).getCurrentPlan())()`),'free')
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
  console.log('PASS plan access: visitor Free, public demo login/Premium routes/refresh, explicit demo label/no payment, logout/revisit Free, preserved history/preferences, level prerequisites/daily cap, seven widths Normal/Grande. Screenshots: '+shots)
} finally {
  for (const socket of sockets) socket.close(); chrome.kill(); await server.close(); await pause(500)
  const resolved = path.resolve(profile)
  if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith('falalivre-plan-access-')) throw Error('unsafe temporary path')
  try { fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { console.log('Temporary Chrome profile remains: ' + resolved) }
}
