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
    assert.equal(await ev('document.querySelector(".home-decoration").getAnimations({subtree:true}).filter(a=>a.playState==="running").length'),0,'reduced-motion scenery is static')
    assert.equal(await ev('getComputedStyle(document.querySelector(".header-content")).backgroundColor'),'rgb(254, 254, 254)')
    const desktop=width/zoom>=1200
    assert.equal(await ev('document.querySelector(".header-desktop-navigation").getClientRects().length>0'),desktop,context)
    if(desktop) {
      assert.equal(await ev('document.querySelector(".header-desktop-navigation [aria-current=page]").getAttribute("href")'),hash)
      assert.deepEqual(await ev('Array.from(document.querySelectorAll(".header-desktop-navigation a"),a=>a.getAttribute("href"))'),['#/','#/aprender','#/meu-progresso','#/planos'])
    }
    assert.deepEqual(await ev('Array.from(document.querySelectorAll(".start-button,.learning-start,.header-menu-toggle"),e=>({text:e.textContent,clipped:e.scrollWidth>e.clientWidth+1})).filter(e=>e.clipped)'),[],context)
    if(width/zoom>=1100) {
      assert.ok(await ev('(()=>{const m=document.querySelector("main").getBoundingClientRect(),h=document.querySelector(".header-content").getBoundingClientRect();return Math.abs((m.left+m.right-h.left-h.right)/2)<1})()'),context)
      if(hash==='#/aprender')assert.equal(await ev('getComputedStyle(document.querySelector(".learning-grid")).gridTemplateColumns.split(" ").length'),2)
      else {
        assert.equal(await ev('getComputedStyle(document.querySelector(".activity-grid")).gridTemplateColumns.split(" ").length'),2,context)
        const exterior=width/zoom>=1366
        const characters=await ev(`(()=>{
          return Array.from(document.querySelectorAll(${JSON.stringify(exterior ? '.home-scenery-character .activity-illustration' : '.home .activity-card .activity-illustration')})).map(e=>{
            const r=e.getBoundingClientRect(),card=(e.closest('.activity-card')||document.querySelector('.activity-grid')).getBoundingClientRect(),text=(e.closest('.activity-card')||document.querySelector('.activity-card')).querySelector('.activity-content').getBoundingClientRect();
            return {visible:r.width>0,loaded:e.complete&&e.naturalWidth>0,
              inside:r.left>=card.left&&r.right<=card.right&&r.top>=card.top&&r.bottom<=card.bottom,
              beforeText:r.right<=text.left,outside:r.right<=card.left||r.left>=card.right,ratio:r.width/r.height,naturalRatio:e.naturalWidth/e.naturalHeight,src:e.getAttribute('src')}
          })
        })()`)
        assert.equal(characters.length,2)
        for(const c of characters){assert.ok(c.visible&&c.loaded&&(exterior?c.outside:c.inside&&c.beforeText),context+JSON.stringify(c));assert.ok(Math.abs(c.ratio-c.naturalRatio)<.01,context)}
        assert.ok(characters[0].src.includes('aprender-personagem')&&characters[1].src.includes('jogar-personagem'))
      }
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
  await A.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
  assert.equal(await ev('JSON.stringify(Object.entries(localStorage))'),before)
  await ev('location.hash="#/aprender/comunicar"');await pause(100)
  const afterCommunicationInit=await ev('JSON.stringify(Object.entries(localStorage))')
  for(const width of [320,390,430,768,1024,1366,1440,1920])for(const size of ['normal','large']) {
    await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false})
    await ev('document.documentElement.dataset.elementSize='+JSON.stringify(size)+';location.hash="#/aprender/comunicar"');await pause(80)
    assert.ok(await ev('document.querySelector(".communication-page")!==null'))
    assert.ok(await ev('document.documentElement.scrollWidth<=innerWidth+1'))
    assert.ok(await ev('getComputedStyle(document.querySelector(".home-surround")).backgroundImage.includes("linear-gradient")'))
    assert.equal(await ev('document.querySelector(".writing-scene-character")'),null)
    if(size==='normal'&&[390,1366].includes(width)){const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:75,captureBeyondViewport:true});fs.writeFileSync(path.join(shots,'communicate-'+width+'.jpg'),Buffer.from(shot.data,'base64'))}
  }
  await A.cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
  for(const hash of ['#/meu-progresso','#/planos','#/aprender','#/']) {
    await ev('document.querySelector('+JSON.stringify('.header-desktop-navigation a[href="'+hash+'"]')+').click()');await pause(80)
    assert.equal(await ev('location.hash'),hash)
    assert.equal(await ev('document.querySelector(".header-desktop-navigation [aria-current=page]").getAttribute("href")'),hash)
  }
  assert.equal(await ev('JSON.stringify(Object.entries(localStorage))'),afterCommunicationInit)
  await ev(`(async()=> (await import('/src/services/accountAccess.js')).requestAccountAccess('sign-in',{email:'teste@falalivre.com',password:'FalaLivre123'}))()`);await pause(80)
  for(const width of [390,1366,1440,1920]) {
    await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:width===1920?1080:900,deviceScaleFactor:1,mobile:false})
    await ev('document.documentElement.dataset.elementSize="normal";location.hash="#/"');await pause(80)
    assert.equal(await ev('document.querySelector("#welcome-title").textContent'),'Olá, Noa!')
    assert.equal(await ev('document.querySelector(".activity-card--play .premium-badge")'),null)
    await ev('document.activeElement.blur()')
    const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:85,captureBeyondViewport:true});fs.writeFileSync(path.join(shots,'home-demo-'+width+'.jpg'),Buffer.from(shot.data,'base64'))
    for(const [selector,hash] of [['.activity-card--learn .start-button','#/aprender'],['.activity-card--play .start-button','#/jogar'],['.progress-entry a','#/meu-progresso']]) {
      await ev('location.hash="#/"');await pause(60)
      await ev('document.querySelector('+JSON.stringify(selector)+').click()');await pause(80)
      assert.equal(await ev('location.hash'),hash)
      assert.equal(await ev('document.querySelector(".premium-access-panel")'),null)
    }
  }
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
  console.log('PASS Home/Learn/header: eight viewports, Normal/Grande, 125%/200% zoom reflow, no horizontal overflow/clipped buttons, desktop alignment/2x2 grid, menu/Escape/keyboard focus and unchanged storage; '+shots)

} finally {
  for (const socket of sockets) socket.close(); chrome.kill(); await server.close(); await pause(500)
  const resolved = path.resolve(profile)
  if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith('falalivre-desktop-')) throw Error('unsafe temporary path')
  try { fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { console.log('Temporary Chrome profile remains: ' + resolved) }
}
