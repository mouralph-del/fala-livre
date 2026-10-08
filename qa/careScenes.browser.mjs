import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Targeted navigation styling harness. Native storage belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4227, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-care-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9377', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
 for(let i=0;i<100;i++){try{targets=await(await fetch('http://127.0.0.1:9377/json/list')).json();if(targets.some(t=>t.type==='page'))break}catch{}await pause(100)}
 const A=await connect(targets.find(t=>t.type==='page')),ev=A.evaluate
 await A.cdp('Page.navigate',{url:'http://127.0.0.1:4227/__audit#/planos'});await ready(A)
 const routes=[['plans','planos'],['progress','meu-progresso'],['responsibleGuidance','responsaveis'],['signIn','entrar'],['createAccount','criar-conta'],['profile','perfil']].slice(0,process.argv.includes('--stage1')?2:process.argv.includes('--stage2')?5:6)
 const shots=path.join(tempRoot,'falalivre-care-review');fs.mkdirSync(shots,{recursive:true})
 for(const [activity,route] of routes)for(const width of [320,390,430,768,1024,1366,1440,1920])for(const size of ['normal','large']){
  await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false})
  await ev('document.documentElement.dataset.elementSize='+JSON.stringify(size)+';document.documentElement.dataset.reduceMotion="true";location.hash='+JSON.stringify('#/'+route)+';window.scrollTo(0,0)');await pause(100)
  const context=JSON.stringify({route,width,size})
  assert.equal(await ev('document.querySelector("[data-care-scene]")?.dataset.careScene'),activity,context)
  assert.ok(await ev('document.documentElement.scrollWidth<=innerWidth+1'),context+' overflow')
  assert.equal(await ev('document.querySelector(".learning-landscape img,.care-scene-symbol img")'),null,context)
  assert.ok(await ev('getComputedStyle(document.querySelector(".learning-landscape")).display!=="none"&&document.querySelector(".learning-landscape").getAttribute("aria-hidden")==="true"&&document.querySelector(".learning-landscape").getAnimations({subtree:true}).every(a=>a.playState!=="running")'),context)
  assert.ok(await ev('Array.from(document.querySelectorAll("main input:not([type=radio]):not([type=checkbox]),main select,main button")).every(e=>!e.getClientRects().length||e.getBoundingClientRect().right<=innerWidth+1)'),context+' controls')
  if(activity==='plans')assert.equal(await ev('getComputedStyle(document.querySelector(".plans-grid")).gridTemplateColumns.split(" ").length'),width>700?2:1,context)
  await ev('document.querySelector("main").focus()');await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9})
  assert.ok(await ev('document.activeElement.matches(":focus-visible")&&getComputedStyle(document.activeElement).outlineStyle!=="none"'),context+' keyboard')
  if(size==='normal'&&[390,1440].includes(width)){await ev('document.activeElement.blur();window.scrollTo(0,0)');const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:85,captureBeyondViewport:true});fs.writeFileSync(path.join(shots,route+'-'+width+'.jpg'),Buffer.from(shot.data,'base64'))}
 }
 assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
 console.log('PASS care visual routes: '+routes.map(r=>r[1]).join(', ')+', eight widths Normal/Grande, keyboard/focus, reduced motion, no overflow/decorative characters; '+shots)

} finally {
  for (const socket of sockets) socket.close(); chrome.kill(); await server.close(); await pause(500)
  const resolved = path.resolve(profile)
  if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith('falalivre-care-')) throw Error('unsafe temporary path')
  try { fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { console.log('Temporary Chrome profile remains: ' + resolved) }
}
