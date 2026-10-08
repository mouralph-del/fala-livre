import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Targeted navigation styling harness. Native storage belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4226, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-play-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9376', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
 for(let i=0;i<100;i++){try{targets=await(await fetch('http://127.0.0.1:9376/json/list')).json();if(targets.some(t=>t.type==='page'))break}catch{}await pause(100)}
 const A=await connect(targets.find(t=>t.type==='page')),ev=A.evaluate
 await A.cdp('Page.addScriptToEvaluateOnNewDocument',{source:'localStorage.setItem("falalivre.demo-session.v1",JSON.stringify({demo:true,responsibleName:"Alex",userName:"Noa"}))'})
 await A.cdp('Page.navigate',{url:'http://127.0.0.1:4226/__audit#/jogar'});await ready(A)
 const games=['caminho','quebra-cabeca','caca-palavras','memoria','encontre-imagem','onde-pertence']
 const shots=path.join(tempRoot,'falalivre-play-review');fs.mkdirSync(shots,{recursive:true})
 for(const route of ['',...games])for(const width of [320,390,430,768,1024,1366,1440,1920])for(const size of ['normal','large']){
  await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false})
  await ev('document.documentElement.dataset.elementSize='+JSON.stringify(size)+';document.documentElement.dataset.reduceMotion="true";location.hash='+JSON.stringify('#/jogar'+(route?'/'+route:''))+';window.scrollTo(0,0)');await pause(100)
  const context=JSON.stringify({route,width,size})
  assert.ok(await ev('document.documentElement.scrollWidth<=innerWidth+1'),context+' overflow')
  assert.equal(await ev('document.querySelector(".learning-landscape")?.dataset.learningScene'),'play',context)
  assert.equal(await ev('document.querySelector(".learning-landscape img,.games-intro img,.wordsearch-intro img")'),null,context+' decorative character')
  assert.ok(await ev('(()=>{const e=document.querySelector(".learning-landscape");return getComputedStyle(e).display!=="none"&&e.getAttribute("aria-hidden")==="true"&&getComputedStyle(e).pointerEvents==="none"&&e.getAnimations({subtree:true}).every(a=>a.playState!=="running")})()'),context)
  if(!route){assert.ok(await ev('Array.from(document.querySelectorAll(".game-card")).every(c=>{const r=c.querySelector(".game-icon").getBoundingClientRect();return Array.from(c.querySelectorAll("h2,p,a")).every(e=>{const t=e.getBoundingClientRect();return r.bottom<=t.top||r.top>=t.bottom||r.right<=t.left||r.left>=t.right})})'),context+' icon overlaps text');assert.deepEqual(await ev('Array.from(document.querySelectorAll(".game-card"),e=>e.dataset.game)'),games);assert.equal(await ev('getComputedStyle(document.querySelector(".games-grid")).gridTemplateColumns.split(" ").length'),width>=1024?3:width>600?2:1,context)}
  else {assert.equal(await ev('document.querySelectorAll("main nav button").length'),3,context);assert.ok(await ev('document.querySelector(".game-surface")!==null'),context+' available N1')}
  assert.deepEqual(await ev('Array.from(document.querySelectorAll("main button,main .game-start")).filter(e=>e.getClientRects().length&&e.scrollWidth>e.clientWidth+1).map(e=>e.textContent)'),[],context+' clipped controls')
  await ev('document.querySelector("main").focus()');await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9})
  assert.ok(await ev('document.activeElement.matches(":focus-visible")&&getComputedStyle(document.activeElement).outlineStyle!=="none"'),context+' keyboard')
  if(size==='normal'&&[390,1440].includes(width)){await ev('document.activeElement.blur();window.scrollTo(0,0)');const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:85,captureBeyondViewport:true});fs.writeFileSync(path.join(shots,(route||'menu')+'-'+width+'.jpg'),Buffer.from(shot.data,'base64'))}
 }
 for(const game of games){await ev('location.hash="#/jogar"');await pause(60);await ev('document.querySelector('+JSON.stringify('[data-game="'+game+'"] a')+').click()');await pause(80);assert.equal(await ev('location.hash'),'#/jogar/'+game)}
 assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
 console.log('PASS six game menu/routes, eight widths Normal/Grande, visible landscape/no decorative characters, keyboard/focus, controls/no overflow; '+shots)

} finally {
  for (const socket of sockets) socket.close(); chrome.kill(); await server.close(); await pause(500)
  const resolved = path.resolve(profile)
  if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith('falalivre-play-')) throw Error('unsafe temporary path')
  try { fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { console.log('Temporary Chrome profile remains: ' + resolved) }
}
