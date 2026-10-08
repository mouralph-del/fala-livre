import assert from 'node:assert/strict'
import jsQR from 'jsqr'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Targeted navigation styling harness. Native storage belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
// example.com is only a QR decoding fixture, never a production deployment claim.
const publicUrl = process.argv.includes('--public-url') ? 'https://example.com/falalivre/' : ''
const server = await createServer({ define: { 'import.meta.env.VITE_PUBLIC_APP_URL': JSON.stringify(publicUrl) }, server: { host: '127.0.0.1', port: 4230, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-payment-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9380', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const sockets = [], errors = [], warnings = []
async function connect(target, browser = false) {
  const socket = new WebSocket(target.webSocketDebuggerUrl); sockets.push(socket)
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
  let id = 0; const pending = new Map()
  socket.addEventListener('message', event => { const message = JSON.parse(event.data); if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails); if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) (message.params.type === 'error' ? errors : warnings).push(message.params.args.map(arg => arg.value ?? arg.description)); if (message.id) { const task = pending.get(message.id); pending.delete(message.id); message.error ? task.reject(Error(JSON.stringify(message.error))) : task.resolve(message.result) } })
  const cdp = (method, params = {}) => new Promise((resolve, reject) => { const next = ++id; pending.set(next, { resolve, reject }); socket.send(JSON.stringify({ id: next, method, params })) })
  const evaluate = async expression => { const result = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails)); return result.result.value }
  if (!browser) { await cdp('Runtime.enable'); await cdp('Page.enable') }
  return { cdp, evaluate }
}
async function ready(page) { for (let i = 0; i < 200; i++) { if (await page.evaluate('document.querySelector("main h1") !== null')) return; await pause(50) } throw Error('page did not become ready ' + JSON.stringify(errors)) }

try {
 let targets
 for(let i=0;i<100;i++){try{targets=await(await fetch('http://127.0.0.1:9380/json/list')).json();if(targets.some(t=>t.type==='page'))break}catch{}await pause(100)}
 const A=await connect(targets.find(t=>t.type==='page')),ev=A.evaluate
 await A.cdp('Page.navigate',{url:'http://127.0.0.1:4230/__audit#/planos'});await ready(A)
 const route=async hash=>{await ev('location.hash='+JSON.stringify('#/'+hash));await pause(120)}
 const click=async selector=>{await ev('document.querySelector('+JSON.stringify(selector)+').click()');await pause(60)}
 const plan=()=>ev('(async()=> (await import("/src/services/planAccess.js")).getCurrentPlan())()')
 await ev('(async()=>{const p=await import("/src/utils/progress.js");localStorage.setItem("falaLivre_progress_v1",p.serializeProgress(p.applyProgressCommand(p.createEmptyProgress("12345678-1234-4234-8234-123456789abc"),{type:"explored",moduleId:"communication",activityId:"guided-exploration"}).progress));(await import("/src/utils/preferences.js")).updatePreference("reduceMotion",true)})()')
 const protectedState=()=>ev('[localStorage.getItem("falaLivre_progress_v1"),localStorage.getItem("falalivre.preferences")]')
 const before=await protectedState()
 for(const [selector,value] of [['.plan-billing button:first-child','16,90'],['.plan-billing button:last-child','149,90']]){
  await click(selector);await click('.plan-choose');assert.ok(await ev('document.querySelector(".demo-checkout").textContent.includes('+JSON.stringify(value)+')'))
  assert.equal(await plan(),'free')
  if (publicUrl) {
  const qr=await ev('(()=>{const s=document.querySelector(".demo-qr");return{size:Number(s.getAttribute("viewBox").split(" ")[2]),path:s.querySelector("path").getAttribute("d"),url:document.querySelector(".demo-qr-link").href}})()')
  const pixels=qr.size*8,data=new Uint8ClampedArray(pixels*pixels*4).fill(255)
  for(const match of qr.path.matchAll(/M(\d+) (\d+)h1v1h-1z/g)){const x=Number(match[1])*8,y=Number(match[2])*8;for(let dy=0;dy<8;dy++)for(let dx=0;dx<8;dx++){const n=((y+dy)*pixels+x+dx)*4;data[n]=data[n+1]=data[n+2]=0}}
  const decoded=jsQR(data,pixels,pixels);assert.equal(decoded?.data,qr.url);assert.equal(qr.url,publicUrl+'#/pagamento-demo')
  assert.equal(new URL(decoded.data).search,'')
  } else {
    assert.equal(await ev('document.querySelectorAll(".demo-qr,.demo-qr-link").length'),0)
    assert.ok(await ev('document.querySelector(".demo-qr-unavailable").textContent.includes("endereço público HTTPS")'))
  }
  await click('.demo-back');assert.ok(await ev('document.activeElement.matches(".plan-choose")'))
 }
 await route('pagamento-demo?approved=true&plan=annual');assert.equal(await plan(),'free');assert.equal(await ev('!!document.querySelector(".demo-qr")'),false);assert.equal(await ev('!!document.querySelector(".plan-choose")'),false)
 assert.equal(await ev('document.querySelector("main h1").textContent'),'Pagamento simulado com sucesso!')
 assert.equal(await ev('document.querySelector(".demo-confirmation-icon").getAttribute("aria-hidden")'),'true')
 assert.equal(await ev('document.querySelector("main a").textContent'),'Voltar ao Fala Livre')
 assert.deepEqual(await protectedState(),before)
 await click('main a[href="#/planos"]')
 await click('.plan-choose');await click('.demo-checkout .plan-choose');assert.ok(await ev('document.querySelector(".demo-checkout .plan-choose").disabled'))
 await pause(750);assert.equal(await plan(),'premium-demo');assert.ok(await ev('Array.from(document.querySelectorAll(".demo-checkout a")).some(a=>a.getAttribute("href")==="#/aprender")'))
 const browser = await connect(await (await fetch('http://127.0.0.1:9380/json/version')).json(), true)
 const context = await browser.cdp('Target.createBrowserContext')
 const other = await browser.cdp('Target.createTarget',{url:'about:blank',browserContextId:context.browserContextId})
 const otherTarget = (await (await fetch('http://127.0.0.1:9380/json/list')).json()).find(t=>t.id===other.targetId)
 const B = await connect(otherTarget)
 await B.cdp('Page.navigate',{url:'http://127.0.0.1:4230/__audit#/pagamento-demo?approved=true'})
 await ready(B)
 assert.equal(await B.evaluate('localStorage.length'),0,'another browser starts and remains without session/transactions')
 assert.equal(await B.evaluate('document.querySelector("main h1").textContent'),'Pagamento simulado com sucesso!')
 assert.equal(await plan(),'premium-demo','confirmation in another context does not contact original device')
 await B.evaluate('document.querySelector("main a").click()');await pause(100)
 assert.equal(await B.evaluate('location.hash'),'#/planos')
 assert.equal(await B.evaluate('(async()=> (await import("/src/services/planAccess.js")).getCurrentPlan())()'),'free')
 await browser.cdp('Target.disposeBrowserContext',{browserContextId:context.browserContextId})
 assert.deepEqual(await protectedState(),before)
 assert.deepEqual(await ev('JSON.parse(localStorage.getItem("falalivre.demo-session.v1"))'),{demo:true,responsibleName:'Alex',userName:'Noa'})
 assert.equal(await ev('Object.keys(localStorage).some(k=>/payment|transaction|subscription|pix/i.test(k))'),false)
 await A.cdp('Page.reload');await pause(200);await ready(A);assert.equal(await plan(),'premium-demo')
 await click('.plan-choose');await click('.demo-checkout .plan-choose')
 await ev('document.querySelector(".header-menu-toggle").click();document.querySelector(".header-sign-out").click()');await pause(800)
 assert.equal(await plan(),'free','Logout cancels approval in flight')
 await click('.demo-checkout .plan-choose');await pause(750);assert.equal(await plan(),'premium-demo')
 for(const hash of ['aprender/comunicar','aprender/escrever','aprender/palavras-frases','aprender/meu-dia-a-dia','jogar/caminho','jogar/quebra-cabeca','jogar/caca-palavras','jogar/memoria','jogar/encontre-imagem','jogar/onde-pertence']){await route(hash);assert.equal(await ev('!!document.querySelector(".premium-access-panel")'),false)}
 await ev('document.querySelector(".header-menu-toggle").click();document.querySelector(".header-sign-out").click()');await pause(50);assert.equal(await plan(),'free')
 await route('planos');await click('.plan-choose');await click('.demo-checkout .plan-choose');await click('.demo-back');await pause(750);assert.equal(await plan(),'free','Back cancels pending simulation')
 await click('.plan-choose')
 const shots=path.join(tempRoot,'falalivre-payment-review');fs.mkdirSync(shots,{recursive:true})
 for(const width of [320,390,430,768,1024,1366,1440])for(const size of ['normal','large']){
  await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500})
  await ev('document.documentElement.dataset.elementSize='+JSON.stringify(size)+';document.documentElement.dataset.reduceMotion="true"')
  assert.ok(await ev('document.documentElement.scrollWidth<=innerWidth+1'))
  await route('pagamento-demo');assert.ok(await ev('document.documentElement.scrollWidth<=innerWidth+1'))
  assert.ok(await ev('(()=>{const a=document.querySelector("main a");return a.scrollWidth<=a.clientWidth+1})()'))
  if(size==='normal'&&[390,1440].includes(width)){const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:80,captureBeyondViewport:true});fs.writeFileSync(path.join(shots,'confirmation-'+width+'.jpg'),Buffer.from(shot.data,'base64'))}
  await route('planos');await click('.plan-choose')
  if(size==='normal'&&[390,1440].includes(width)){const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:80,captureBeyondViewport:true});fs.writeFileSync(path.join(shots,'payment-'+width+'.jpg'),Buffer.from(shot.data,'base64'))}
 }
 await ev('document.querySelector("#demo-checkout-title").focus()');await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert.ok(await ev('document.activeElement.matches(":focus-visible")'))
 assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
 console.log('PASS '+(publicUrl?'configured public HTTPS QR independently decoded':'no public URL: no inaccessible QR')+', confirmation/back/isolated browser no authorization, prices/local simulation/refresh/logout/storage, seven widths Normal/Grande/reduced motion/keyboard; '+shots)
} finally {
 for(const socket of sockets)socket.close();chrome.kill();await server.close();await pause(500)
 const resolved=path.resolve(profile);if(path.dirname(resolved)!==tempRoot||!path.basename(resolved).startsWith('falalivre-payment-'))throw Error('unsafe temporary path')
 try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:200})}catch{console.log('Temporary Chrome profile remains: '+resolved)}
}
