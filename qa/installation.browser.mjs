import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Targeted navigation styling harness. Native storage belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4229, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-install-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9379', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
 for(let i=0;i<100;i++){try{targets=await(await fetch('http://127.0.0.1:9379/json/list')).json();if(targets.some(t=>t.type==='page'))break}catch{}await pause(100)}
 const A=await connect(targets.find(t=>t.type==='page')),ev=A.evaluate
 await A.cdp('Page.navigate',{url:'http://127.0.0.1:4229/__audit#/responsaveis'});await pause(250);await ready(A)
 const route=async hash=>{await ev('location.hash='+JSON.stringify('#/'+hash));await pause(120)}
 const card='.pwa-installation'
 assert.equal(await ev('document.querySelectorAll(".installation-devices button").length'),3)
 assert.equal(await ev('!!document.querySelector(".installation-now")'),false,'No fake install action')
 for(const [index,pattern] of [[0,'Chrome'],[1,'Safari'],[2,'Edge']]){
  await ev('document.querySelectorAll(".installation-devices button")['+index+'].click()');await pause(30)
  assert.equal(await ev('document.querySelectorAll(".installation-devices button[aria-pressed=true]").length'),1)
  assert.ok(await ev('document.querySelector("#installation-instructions").textContent.includes('+JSON.stringify(pattern)+')'))
  assert.equal(await ev('document.querySelectorAll("#installation-instructions ol li").length'),4)
 }
 await route('');assert.equal(await ev('!!document.querySelector(".pwa-installation")'),false)
 // Simulate the browser-owned event only in this isolated QA profile.
 const offer=async outcome=>{await ev('(()=>{const event=new Event("beforeinstallprompt",{cancelable:true});event.prompt=async()=>{window.__installCalls=(window.__installCalls||0)+1};event.userChoice=Promise.resolve({outcome:'+JSON.stringify(outcome)+'});window.dispatchEvent(event)})()');await pause(50)}
 await offer('accepted');assert.equal(await ev('window.__installCalls||0'),0)
 await route('responsaveis');assert.equal(await ev('!!document.querySelector(".installation-now")'),true,'Offer survives navigation')
 await ev('document.querySelectorAll(".installation-devices button")[1].click()');await pause(50)
 assert.equal(await ev('!!document.querySelector(".installation-now")'),false,'No automatic installation for iOS selection')
 await ev('document.querySelectorAll(".installation-devices button")[2].click()');await pause(50)
 await ev('document.querySelector(".installation-now").click()');await pause(80)
 assert.equal(await ev('window.__installCalls'),1);assert.equal(await ev('!!document.querySelector(".installation-now")'),false,'Event consumed once')
 await offer('dismissed');await ev('document.querySelector(".installation-now").click()');await pause(80)
 assert.equal(await ev('window.__installCalls'),2);assert.ok(await ev('document.querySelector(".installation-feedback").textContent.length>0'))
 await offer('accepted');await ev('window.dispatchEvent(new Event("appinstalled"))');await pause(50)
 assert.equal(await ev('!!document.querySelector(".installation-now")'),false)
 await ev('document.querySelectorAll(".installation-devices button")[0].focus()')
 await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9})
 assert.ok(await ev('document.activeElement.matches(":focus-visible")'))
 await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32})
 assert.equal(await ev('document.querySelectorAll(".installation-devices button")[1].getAttribute("aria-pressed")'),'true')
 const shots=path.join(tempRoot,'falalivre-install-review');fs.mkdirSync(shots,{recursive:true})
 for(const width of [320,390,430,768,1024,1366,1440])for(const size of ['normal','large']){
  await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500})
  await ev('document.documentElement.dataset.elementSize='+JSON.stringify(size)+';document.documentElement.dataset.reduceMotion="true"')
  assert.ok(await ev('document.documentElement.scrollWidth<=innerWidth+1'))
  assert.ok(await ev('Array.from(document.querySelectorAll(".installation-devices button")).every(b=>b.getBoundingClientRect().height>=44&&b.getBoundingClientRect().right<=innerWidth+1)'))
  if(size==='normal'&&[390,1440].includes(width)){await ev('document.querySelector(".pwa-installation").scrollIntoView({block:"start"})');const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:80});fs.writeFileSync(path.join(shots,'installation-'+width+'.jpg'),Buffer.from(shot.data,'base64'))}
 }
 await route('perfil');assert.equal(await ev('!!document.querySelector(".pwa-installation")'),false)
 // Apple navigator.standalone is a fixture, not evidence of a native install.
 await A.cdp('Page.addScriptToEvaluateOnNewDocument',{source:'Object.defineProperty(navigator,"standalone",{get:()=>true})'})
 await route('responsaveis');await A.cdp('Page.reload');await pause(250);await ready(A)
 assert.ok(await ev('document.querySelector(".pwa-installation [role=status]").textContent.length>0'))
 assert.equal(await ev('document.querySelectorAll(".pwa-installation button").length'),0)
 assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
 console.log('PASS installation devices/manual guidance, retained browser event, accepted/dismissed/consumed once/appinstalled, iOS no automatic action, standalone fixture, exclusive Responsible card, keyboard/focus, seven widths Normal/Grande/reduced motion; '+shots)
} finally {
 for(const socket of sockets)socket.close();chrome.kill();await server.close();await pause(500)
 const resolved=path.resolve(profile);if(path.dirname(resolved)!==tempRoot||!path.basename(resolved).startsWith('falalivre-install-'))throw Error('unsafe temporary path')
 try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:200})}catch{console.log('Temporary Chrome profile remains: '+resolved)}
}
