import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { preview } from 'vite'
import { createEmptyProgress, applyProgressCommand, serializeProgress } from '../src/utils/progress.js'


let nextVersion = false
const server = await preview({preview:{host:'127.0.0.1',port:4228,strictPort:true}})
server.middlewares.stack.unshift({route:'/sw.js',handle:(req,res,next)=>{
 if(!nextVersion)return next()
 res.setHeader('Content-Type','text/javascript');res.setHeader('Cache-Control','no-cache')
 res.end(fs.readFileSync('dist/sw.js','utf8').replace(/url:"index\.html",revision:"[^"]+"/, 'url:"index.html",revision:"pwa-regression-version-2"'))
}})
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-pwa-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9378', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
 for(let i=0;i<100;i++){try{targets=await(await fetch('http://127.0.0.1:9378/json/list')).json();if(targets.some(t=>t.type==='page'))break}catch{}await pause(100)}
 const A=await connect(targets.find(t=>t.type==='page')),ev=A.evaluate
 const waitFor=async(expression)=>{for(let i=0;i<300;i++){if(await ev(expression))return;await pause(100)}throw Error('Timed out: '+expression)}
 const route=async(hash)=>{await ev('location.hash='+JSON.stringify('#/'+hash));await pause(150);await ready(A)}
 const reload=async()=>{await A.cdp('Page.reload');await pause(200);await ready(A)}
 const storage=()=>ev('JSON.stringify(Object.fromEntries(Object.entries(localStorage).sort()))')
 await A.cdp('Network.enable')
 await A.cdp('Page.navigate',{url:'http://127.0.0.1:4228/#/'});await ready(A)
 await waitFor('(async()=>!!(await navigator.serviceWorker.getRegistration())?.active)()')
 await reload();await waitFor('!!navigator.serviceWorker.controller')
 const manifest=await(await fetch('http://127.0.0.1:4228/manifest.webmanifest')).json()
 assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'/#/');assert.equal(manifest.lang,'pt-BR')
 const pngSize=buffer=>[buffer.readUInt32BE(16),buffer.readUInt32BE(20)]
 for(const icon of manifest.icons){const bytes=Buffer.from(await(await fetch('http://127.0.0.1:4228'+icon.src)).arrayBuffer());assert.equal(pngSize(bytes).join('x'),icon.sizes)}
 assert.deepEqual(pngSize(fs.readFileSync('public/pwa/apple-touch-icon.png')),[180,180])
 const install=await A.cdp('Page.getInstallabilityErrors');assert.deepEqual(install.installabilityErrors,[])
 try {
  await A.cdp('PWA.install',{manifestId:'http://127.0.0.1:4228/',installUrl:'http://127.0.0.1:4228/'})
  const launched=await A.cdp('PWA.launch',{manifestId:'http://127.0.0.1:4228/'})
  console.log('Native desktop install/launch: '+JSON.stringify(launched))
 } catch(error) { console.log('Native desktop installation unavailable in headless environment: '+error.message) }
 await A.cdp('Emulation.setEmulatedMedia',{features:[{name:'display-mode',value:'standalone'}]})
 const standalone=await ev('matchMedia("(display-mode: standalone)").matches')
 console.log('Standalone media emulation: '+standalone+'; native installed window requires a real device/browser.')
 const cachePaths=await ev('(async()=>{const result=[];for(const name of await caches.keys()){for(const request of await(await caches.open(name)).keys())result.push(new URL(request.url).pathname)}return result})()')
 assert.ok(cachePaths.every(p=>p==='/'||p==='/index.html'||p==='/manifest.webmanifest'||p.startsWith('/assets/')||p.startsWith('/pwa/')),'Only static build resources are cached')
 for(const file of fs.readdirSync('dist/assets'))assert.ok(cachePaths.includes('/assets/'+encodeURI(file)),file+' must be offline')
 console.log('PASS manifest/icons, SW active and Chrome installability criteria')
 await A.cdp('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0})
 await reload()
 for(const hash of ['', 'aprender','aprender/comunicar','aprender/escrever','aprender/escrever/teclado','aprender/escrever/caderno','meu-progresso','perfil','planos']){await route(hash);assert.ok(await ev('document.querySelector("main").textContent.length>20'));assert.ok(await ev('Array.from(document.images).filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth>0)'))}
 for(const hash of ['jogar','aprender/palavras-frases','aprender/meu-dia-a-dia','jogar/memoria']){await route(hash);assert.ok(await ev('!!document.querySelector(".premium-access-panel")'))}
 await route('entrar')
 await route('pagamento-demo?approved=true&plan=annual')
 assert.equal(await ev('!!document.querySelector(".payment-demo-page")'),true)
 assert.equal(await ev('localStorage.getItem("falalivre.demo-session.v1")'),null)
 await route('planos')
 await ev('document.querySelector(".plan-billing button:first-child").click()');await pause(50)
 await ev('document.querySelector(".plan-choose").click()');await pause(50)
 assert.equal(await ev('document.querySelector(".demo-qr-link").href'),'http://127.0.0.1:4228/#/pagamento-demo')
 await ev('document.querySelector(".demo-checkout .plan-choose").click()');await pause(800)
 assert.equal(await ev('JSON.parse(localStorage.getItem("falalivre.demo-session.v1")).demo'),true)
 await route('jogar');assert.equal(await ev('!!document.querySelector(".premium-access-panel")'),false)
 await ev('document.querySelector(".header-menu-toggle").click();document.querySelector(".header-sign-out").click()');await pause(50)
 await route('jogar');assert.equal(await ev('!!document.querySelector(".premium-access-panel")'),true)
 await route('entrar')
 for(const [name,value] of [['email','teste@falalivre.com'],['password','FalaLivre123']])await ev('(()=>{const i=document.querySelector("[name='+name+']");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(i,'+JSON.stringify(value)+');i.dispatchEvent(new Event("input",{bubbles:true}))})()')
 await ev('document.querySelector("form").requestSubmit()');await pause(250)
 assert.ok(await ev('JSON.parse(localStorage.getItem("falalivre.demo-session.v1")).demo'))
 const demoRoutes=['jogar','aprender/palavras-frases','aprender/meu-dia-a-dia','aprender/meu-dia-a-dia/rotinas','aprender/meu-dia-a-dia/comunicacao','aprender/meu-dia-a-dia/emocoes','jogar/caminho','jogar/quebra-cabeca','jogar/caca-palavras','jogar/memoria','jogar/encontre-imagem','jogar/onde-pertence']
 for(const hash of demoRoutes){await route(hash);assert.equal(await ev('!!document.querySelector(".premium-access-panel")'),false);assert.ok(await ev('Array.from(document.images).filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth>0)'))}
 await reload();assert.equal(await ev('!!document.querySelector(".premium-access-panel")'),false)
 await ev('document.querySelector(".header-menu-toggle").click();document.querySelector(\'.header-navigation a[href="#/responsaveis"]\').click()')
 await pause(150)
 assert.equal(await ev('location.hash'),'#/responsaveis')
 assert.equal(await ev('document.querySelectorAll(".pwa-installation").length'),1,'Offline installation guidance in Responsible')
 for(const index of [0,1,2]){await ev('document.querySelectorAll(".installation-devices button")['+index+'].click()');await pause(30);assert.equal(await ev('document.querySelectorAll("#installation-instructions ol li").length'),4)}
 assert.equal(await ev('document.querySelectorAll("input[name=gameTimeLimit]").length'),6)
 for(const value of ['15','unlimited','30','45','60','custom']){
  await ev('document.querySelector(\'input[name=gameTimeLimit][value="'+value+'"]\').click()');await pause(50)
  assert.equal(await ev('JSON.parse(localStorage.getItem("falalivre.preferences")).gameTimeLimit'),value)
 }
 await ev('(()=>{const i=document.querySelector("#game-time-minutes");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(i,"25");i.dispatchEvent(new Event("input",{bubbles:true}))})()')
 await pause(50);await ev('document.querySelector(".profile-game-time form").requestSubmit()');await pause(50)
 await reload()
 assert.equal(await ev('document.querySelector("#game-time-minutes").value'),'25')
 assert.equal(await ev('document.querySelector("input[name=gameTimeLimit]:checked").value'),'custom')
 await ev('document.querySelector("input[name=gameTimeLimit][value=unlimited]").click()')
 await route('perfil');assert.equal(await ev('document.querySelectorAll("input[name=gameTimeLimit],.profile-game-time,.pwa-installation").length'),0)
 await route('aprender/escrever/caderno')
 await ev('document.querySelector("canvas").scrollIntoView({block:"center"})')
 const canvas=await ev('(()=>{const r=document.querySelector("canvas").getBoundingClientRect();return {x:r.x+40,y:r.y+40}})()')
 await A.cdp('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,...canvas})
 await A.cdp('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:canvas.x+40,y:canvas.y+15})
 await A.cdp('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:canvas.x+40,y:canvas.y+15})
 await pause(100)
 assert.ok(await ev('(()=>{const c=document.querySelector("canvas");const d=c.getContext("2d").getImageData(0,0,c.width,c.height).data;return d.some((value,index)=>index%4===3&&value>0)})()'),'Offline notebook actually draws')
 const progress=serializeProgress(applyProgressCommand(createEmptyProgress('12345678-1234-4234-8234-123456789abc'),{type:'explored',moduleId:'communication',activityId:'guided-exploration'}).progress)
 await ev('localStorage.setItem("falaLivre_progress_v1",'+JSON.stringify(progress)+')')
 await route('perfil');await ev('document.querySelector("input[name=elementSize]:not(:checked)").click()');await pause(100)
 const stored=await storage()
 await reload();assert.equal(await storage(),stored)
 await A.cdp('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1})
 await route('aprender/escrever/caderno')
 await ev('window.__pwaSentinel=123')
 const secondTarget=await(await fetch('http://127.0.0.1:9378/json/new?http://127.0.0.1:4228/%23/aprender/escrever/caderno',{method:'PUT'})).json()
 const B=await connect(secondTarget)
 await B.cdp('Page.navigate',{url:'http://127.0.0.1:4228/#/aprender/escrever/caderno'});await ready(B)
 await B.evaluate('window.__pwaOtherTab=456')
 nextVersion=true
 await ev('(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update()})()')
 await waitFor('document.querySelector(".pwa-controls button")?.textContent==="Atualizar aplicativo"')
 await waitFor('(async()=>!!(await navigator.serviceWorker.getRegistration()).waiting)()')
 assert.equal(await ev('window.__pwaSentinel'),123,'No unsolicited reload')
 const waiting=await ev('(async()=>!!(await navigator.serviceWorker.getRegistration()).waiting)()');assert.ok(waiting)
 for(const width of [320,390,430,768,1024,1366,1440])for(const size of ['normal','large']){
  await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500})
  await ev('document.documentElement.dataset.elementSize='+JSON.stringify(size)+';document.documentElement.dataset.reduceMotion="true"')
  assert.ok(await ev('document.documentElement.scrollWidth<=innerWidth+1'),'PWA prompt overflow '+width+size)
 }
 await ev('document.querySelector(".pwa-controls button").focus()')
 await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9})
 await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9})
 assert.ok(await ev('document.activeElement.matches(":focus-visible")'))
 await ev('document.querySelector(".pwa-controls button").click()')
 await waitFor('window.__pwaSentinel===undefined&&!!document.querySelector("main h1")')
 assert.equal(await storage(),stored,'Update preserves all local storage')
 assert.equal(await B.evaluate('window.__pwaOtherTab'),456,'Other tab must not reload unexpectedly')
 assert.ok(await ev('(async()=>!(await navigator.serviceWorker.getRegistration()).waiting)()'))
 assert.ok(await ev('(async()=>{const names=await caches.keys();return names.filter(n=>n.includes("precache")).length===1})()'))
 assert.equal(await ev('(async()=>{let count=0;for(const name of await caches.keys())for(const req of await(await caches.open(name)).keys())if(new URL(req.url).pathname==="/index.html")count++;return count})()'),1,'Obsolete HTML revision removed')
 await A.cdp('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0})
 await reload();assert.equal(await storage(),stored)
 await ev('document.querySelector(".header-menu-toggle").click();document.querySelector(".header-sign-out").click()')
 await route('jogar');assert.ok(await ev('!!document.querySelector(".premium-access-panel")'))
 await reload();assert.ok(await ev('!!document.querySelector(".premium-access-panel")'))
 assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
 console.log('PASS production offline shell, visitor/demo/direct routes/six games, Responsible game time presets/custom/refresh and absent from Settings, notebook mouse, update/storage preserved, logout/free, seven widths Normal/Grande/reduced motion/focus, no JS errors')
} finally {
 for(const socket of sockets)socket.close();chrome.kill();await new Promise(resolve=>server.httpServer.close(resolve));await pause(500)
 const resolved=path.resolve(profile);if(path.dirname(resolved)!==tempRoot||!path.basename(resolved).startsWith('falalivre-pwa-'))throw Error('unsafe temporary path')
 try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:200})}catch{console.log('Temporary isolated Chrome profile remains: '+resolved)}
}
