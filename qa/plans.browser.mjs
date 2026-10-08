import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Targeted navigation styling harness. Native storage belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4220, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-plans-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9370', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
  for (let i=0;i<100;i++) { try { targets=await(await fetch('http://127.0.0.1:9370/json/list')).json();if(targets.some(t=>t.type==='page'))break } catch {} await pause(100) }
  const A=await connect(targets.find(t=>t.type==='page')),ev=A.evaluate
  await A.cdp('Page.navigate',{url:'http://127.0.0.1:4220/__audit#/'});await ready(A)
  const click=async selector=>{await ev('document.querySelector('+JSON.stringify(selector)+').click()');await pause(60)}
  const storage=()=>ev('JSON.stringify({local:Object.entries(localStorage),session:Object.entries(sessionStorage)})')
  await ev(`(async()=>{localStorage.setItem('falaLivre_progress_v1',JSON.stringify((await import('/src/utils/progress.js')).createEmptyProgress('12345678-1234-4234-8234-123456789abc')));await(await import('/src/services/accountAccess.js')).requestAccountAccess('sign-in',{email:'teste@falalivre.com',password:'FalaLivre123'})})()`)
  const initial=await storage()
  assert.equal(await ev('document.querySelector("#welcome-title").textContent'),'Olá, Noa!')
  await click('.header-menu-toggle')
  assert.equal(await ev('document.querySelector(".header-account-name").textContent'),'Alex')
  await ev(`document.querySelector('.header-popover a[href="#/planos"]').focus()`)
  for(const type of ['keyDown','keyUp'])await A.cdp('Input.dispatchKeyEvent',{type,key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:type==='keyDown'?'\r':undefined})
  await pause(100)
  assert.equal(await ev('location.hash'),'#/planos')
  assert.equal(await ev('document.querySelector(".header-menu-toggle").getAttribute("aria-expanded")'),'false')
  assert.equal(await ev('document.title'),'Planos | Fala Livre')
  assert.equal(await ev('document.querySelector(".home-surround").dataset.scene'),'care')
  assert.equal(await ev('document.querySelector("#free-title").textContent'),'Fala Livre Gratuito')
  assert.equal(await ev('document.querySelector(".plan-card .plan-price").textContent'),'R$ 0')
  const price=()=>ev('document.querySelector(".plan-card--premium .plan-price").textContent.replaceAll("\\u00a0"," ")')
  assert.equal(await price(),'R$ 149,90/ano')
  assert.ok(await ev('document.querySelector(".plan-savings").textContent.replaceAll("\\u00a0"," ").includes("R$ 12,49/mês")'))
  assert.ok(await ev('document.querySelector(".plan-savings").textContent.replaceAll("\\u00a0"," ").includes("R$ 52,90")'))
  await click('.plan-billing button:first-child');assert.equal(await price(),'R$ 16,90/mês')
  assert.equal(await ev('document.querySelector(".plan-billing button:first-child").getAttribute("aria-pressed")'),'true')
  assert.equal(await ev('document.querySelector(".plan-savings")'),null)
  await click('.plan-billing button:last-child');assert.equal(await price(),'R$ 149,90/ano')
  await click('.plan-choose')
  assert.equal(await ev('document.querySelector("#demo-checkout-title").textContent'),'Contratação demonstrativa')
  await click('.demo-back')
  assert.equal(await storage(),initial,'pricing and selection never change account or educational storage')
  assert.equal(await ev(`(async()=> (await import('/src/services/planAccess.js')).getCurrentPlan())()`),'premium-demo')
  await A.cdp('Page.reload');await ready(A);assert.equal(await price(),'R$ 149,90/ano');assert.equal(await storage(),initial)
  const shots=path.join(tempRoot,'falalivre-plans-review');fs.mkdirSync(shots,{recursive:true})
  for(const width of [320,360,390,430,768,1024,1366])for(const size of ['normal','large'])for(const zoom of [1,1.25]) {
    await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false})
    await ev(`document.documentElement.dataset.elementSize=${JSON.stringify(size)};document.documentElement.dataset.reduceMotion='true';document.documentElement.style.zoom=${zoom};window.scrollTo(0,0)`);await pause(40)
    assert.ok(await ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'),width+size+zoom)
    assert.deepEqual(await ev('Array.from(document.querySelectorAll("main button,main a"),e=>({text:e.textContent,clipped:e.scrollWidth>e.clientWidth+1})).filter(e=>e.clipped)'),[])
    assert.equal(await ev('getComputedStyle(document.querySelector(".plans-grid")).gridTemplateColumns.split(" ").length'),width>700?2:1)
    for(const height of await ev('Array.from(document.querySelectorAll("main button"),e=>e.getBoundingClientRect().height)'))assert.ok(height>=(size==='large'?55:47)*zoom)
    if(zoom===1&&[390,1366].includes(width)){const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:75,captureBeyondViewport:true});fs.writeFileSync(path.join(shots,width+'-'+size+'.jpg'),Buffer.from(shot.data,'base64'))}
  }
  await ev('document.documentElement.style.zoom=1;document.querySelector(".plan-billing button:first-child").focus()')
  for(const type of ['keyDown','keyUp'])await A.cdp('Input.dispatchKeyEvent',{type,key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:type==='keyDown'?'\r':undefined})
  await pause(60);assert.equal(await price(),'R$ 16,90/mês');assert.equal(await ev('getComputedStyle(document.activeElement).outlineStyle'),'solid')
  await A.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:false})
  await ev('document.querySelector(".plan-billing button:last-child").scrollIntoView({block:"center"})');await pause(60)
  const point=await ev('(()=>{const r=document.querySelector(".plan-billing button:last-child").getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()')
  await A.cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await A.cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(80);assert.equal(await price(),'R$ 149,90/ano')
  // Only entry routes: pricing never changes the existing demo entitlement.
  for(const [hash,title] of [['/aprender/palavras-frases','Palavras'],['/aprender/meu-dia-a-dia','Meu Dia'],['/jogar','Vamos jogar!'],['/meu-progresso','Meu Progresso'],['/perfil','Configurações']]) {
    await ev('location.hash='+JSON.stringify(hash));await pause(100)
    if (['/aprender/palavras-frases','/aprender/meu-dia-a-dia','/jogar'].includes(hash)) assert.ok(await ev('document.querySelector(".premium-access-panel")===null'),hash)
    else assert.ok(await ev('document.querySelector("main h1").textContent.includes('+JSON.stringify(title)+')'),hash)
  }
  await ev('location.hash="#/"');await pause(80);assert.equal(await ev('document.querySelector("#welcome-title").textContent'),'Olá, Noa!')
  await click('.header-menu-toggle')
  await ev(`document.querySelector('.header-popover a[href="#/planos"]').scrollIntoView({block:'nearest'})`);await pause(60)
  const menuPoint=await ev(`(()=>{const r=document.querySelector('.header-popover a[href="#/planos"]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`)
  await A.cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[menuPoint]});await A.cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(80)
  assert.equal(await ev('location.hash'),'#/planos')
  assert.equal(await ev('document.querySelector(".header-menu-toggle").getAttribute("aria-expanded")'),'false')
  assert.equal(await ev('localStorage.getItem("falaLivre_progress_v1")'),JSON.parse(initial).local.find(([key])=>key==='falaLivre_progress_v1')[1])
  assert.deepEqual(await ev('JSON.parse(localStorage.getItem("falalivre.demo-session.v1"))'),{demo:true,responsibleName:'Alex',userName:'Noa'})
  assert.equal(await ev(`(async()=> (await import('/src/services/planAccess.js')).getCurrentPlan())()`),'premium-demo')
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
  console.log('PASS plans: prices/savings/toggle/status/menu keyboard/touch/focus, seven widths Normal/Grande 125%, unchanged demo access, no subscription/storage changes. Screenshots: '+shots)
} finally {
  for (const socket of sockets) socket.close(); chrome.kill(); await server.close(); await pause(500)
  const resolved = path.resolve(profile)
  if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith('falalivre-plans-')) throw Error('unsafe temporary path')
  try { fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { console.log('Temporary Chrome profile remains: ' + resolved) }
}
