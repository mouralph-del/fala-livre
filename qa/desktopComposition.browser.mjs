import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Targeted navigation styling harness. Native storage belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4223, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-desktop-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9373', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
  for(let i=0;i<100;i++){try{targets=await(await fetch('http://127.0.0.1:9373/json/list')).json();if(targets.some(t=>t.type==='page'))break}catch{}await pause(100)}
  const A=await connect(targets.find(t=>t.type==='page')),ev=A.evaluate
  await A.cdp('Page.navigate',{url:'http://127.0.0.1:4223/__audit#/'});await ready(A)
  const shots=path.join(tempRoot,'falalivre-desktop-review');fs.mkdirSync(shots,{recursive:true})
  const before=await ev('JSON.stringify(Object.entries(localStorage))')
  for(const [width,height] of [[320,800],[390,844],[430,932],[768,1024],[1024,768],[1366,768],[1440,900],[1920,1080]])for(const size of ['normal','large'])for(const zoom of width < 768 ? [1] : [1,1.25,2])for(const hash of ['#/','#/aprender']) {
    // Reduced CSS viewport models desktop browser zoom and breakpoint reflow.
    await A.cdp('Emulation.setDeviceMetricsOverride',{width:Math.floor(width/zoom),height:Math.floor(height/zoom),deviceScaleFactor:1,mobile:false})
    await ev('document.documentElement.dataset.elementSize='+JSON.stringify(size)+';document.documentElement.dataset.reduceMotion="true";location.hash='+JSON.stringify(hash)+';window.scrollTo(0,0)');await pause(60)
    const context=JSON.stringify({width,height,size,zoom,hash})
    assert.ok(await ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'),context)
    assert.equal(await ev('getComputedStyle(document.querySelector(".app-header")).backgroundColor'),'rgb(254, 254, 254)')
    assert.deepEqual(await ev('Array.from(document.querySelectorAll(".start-button,.learning-start,.header-menu-toggle"),e=>({text:e.textContent,clipped:e.scrollWidth>e.clientWidth+1})).filter(e=>e.clipped)'),[],context)
    if(width/zoom>=1100) {
      assert.ok(await ev('Math.abs(document.querySelector("main").getBoundingClientRect().left-document.querySelector(".header-content").getBoundingClientRect().left)<1'),context)
      if(hash==='#/aprender')assert.equal(await ev('getComputedStyle(document.querySelector(".learning-grid")).gridTemplateColumns.split(" ").length'),2)
    }
    await ev('document.querySelector(".header-menu-toggle").click()');await pause(15)
    assert.equal(await ev('document.querySelector(".header-menu-toggle").getAttribute("aria-expanded")'),'true')
    assert.ok(await ev('(()=>{const r=document.querySelector(".header-popover").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})()'),context)
    await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27})
    await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27})
    assert.equal(await ev('document.querySelector(".header-menu-toggle").getAttribute("aria-expanded")'),'false')
    await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9})
    await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9})
    assert.ok(await ev('document.activeElement.matches(":focus-visible")&&getComputedStyle(document.activeElement).outlineStyle!=="none"'),context)
    if(zoom===1){await ev('document.activeElement.blur()');const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:75,captureBeyondViewport:true});fs.writeFileSync(path.join(shots,(hash==='#/'?'home':'learn')+'-'+width+'-'+size+'.jpg'),Buffer.from(shot.data,'base64'))}
  }
  assert.equal(await ev('JSON.stringify(Object.entries(localStorage))'),before)
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
  console.log('PASS Home/Learn/header: eight viewports, Normal/Grande, 125%/200% zoom reflow, no horizontal overflow/clipped buttons, desktop alignment/2x2 grid, menu/Escape/keyboard focus and unchanged storage; '+shots)

} finally {
  for (const socket of sockets) socket.close(); chrome.kill(); await server.close(); await pause(500)
  const resolved = path.resolve(profile)
  if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith('falalivre-desktop-')) throw Error('unsafe temporary path')
  try { fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { console.log('Temporary Chrome profile remains: ' + resolved) }
}
