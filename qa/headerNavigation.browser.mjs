import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Targeted navigation styling harness. Native storage belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4212, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-header-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9362', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
  for (let i=0;i<100;i++) { try { targets=await(await fetch('http://127.0.0.1:9362/json/list')).json(); if(targets.some(t=>t.type==='page'))break } catch {} await pause(100) }
  const A=await connect(targets.find(t=>t.type==='page')), ev=A.evaluate
  await A.cdp('Page.navigate',{url:'http://127.0.0.1:4212/__audit#/'}); await ready(A)
  assert.deepEqual(await ev('(()=>{const style=getComputedStyle(document.querySelector(".app-header"));return [style.backgroundColor,style.backgroundImage]})()'), ['rgb(254, 254, 254)', 'none'])
  const shots = path.join(tempRoot, 'falalivre-header-review'); fs.mkdirSync(shots, { recursive: true })
  const key=async (key,code=key,vk=key==='Tab'?9:key==='Escape'?27:13)=>{await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key,code,text:key==='Enter'?'\r':undefined,windowsVirtualKeyCode:vk});await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:vk});await pause(30)}
  const click=async selector=>{await ev('document.querySelector('+JSON.stringify(selector)+').scrollIntoView({block:"nearest"})');await pause(30);const r=await ev(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await A.cdp('Input.dispatchMouseEvent',{type:'mousePressed',...r,button:'left',clickCount:1});await A.cdp('Input.dispatchMouseEvent',{type:'mouseReleased',...r,button:'left',clickCount:1});await pause(40)}
  const opened=()=>ev('document.querySelector(".header-menu-toggle").getAttribute("aria-expanded")==="true"')
  for(const width of [320,360,390,430,768,1024,1366])for(const size of ['normal','large'])for(const zoom of [1,1.25]) {
    await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:700,deviceScaleFactor:1,mobile:false})
    await ev(`document.documentElement.dataset.elementSize=${JSON.stringify(size)};document.documentElement.style.zoom=${zoom}`)
    await click('.header-menu-toggle');assert.ok(await opened())
    const layout=await ev(`(()=>{const h=document.querySelector('.header-content').getBoundingClientRect(),p=document.querySelector('.header-popover').getBoundingClientRect(),b=document.querySelector('.header-menu-toggle').getBoundingClientRect(),l=document.querySelector('.brand-logo').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth+1,rect:{left:p.left,right:p.right},inside:p.left>=8&&p.right<=innerWidth-8&&p.bottom<=innerHeight-8,buttonInside:b.left>=8&&b.right<=document.documentElement.clientWidth-8,height:b.height,logo:l.width,ratio:l.width/l.height,sameRow:Math.abs((b.top+b.height/2)-(l.top+l.height/2))<2,links:Array.from(document.querySelectorAll('.header-popover a'),a=>a.scrollWidth<=a.clientWidth+1)}})()`)
    assert.equal(layout.overflow,false);assert.ok(layout.inside,JSON.stringify({width,size,zoom,layout}));assert.ok(layout.sameRow);assert.ok(layout.buttonInside,JSON.stringify({width,size,layout}));assert.ok(layout.height>=(size==='large'?56:48));assert.ok(layout.logo>=160);assert.ok(Math.abs(layout.ratio-2043/770)<.01);assert.ok(layout.links.every(Boolean))
    await click('.header-menu-toggle');assert.equal(await opened(),false)
    for(const [href,title] of [['#/meu-progresso','Meu Progresso'],['#/perfil','Configurações'],['#/responsaveis','Responsáveis'],['#/planos','Planos'],['#/entrar','Entrar'],['#/criar-conta','Criar conta']]) {
      await click('.header-menu-toggle');if(!await ev('document.querySelector('+JSON.stringify('.header-popover a[href="'+href+'"]')+').getClientRects().length')){await key('Escape');continue}await click(`.header-popover a[href="${href}"]`);assert.equal(await ev('location.hash'),href);assert.equal(await opened(),false);assert.ok((await ev('document.title')).includes(title))
    }
    await ev('document.querySelector(".header-menu-toggle").focus()');await key('Enter');assert.ok(await opened())
    const visibleLinks=await ev('Array.from(document.querySelectorAll(".header-popover a")).filter(a=>a.getClientRects().length).map(a=>a.getAttribute("href"))')
    for(const href of visibleLinks){await key('Tab');assert.equal(await ev('document.activeElement.getAttribute("href")'),href);assert.equal(await ev('getComputedStyle(document.activeElement).outlineStyle'),'solid')}
    await key('Escape');assert.equal(await opened(),false);assert.equal(await ev('document.activeElement.className'),'header-menu-toggle');assert.equal(await ev('getComputedStyle(document.activeElement).outlineStyle'),'solid')
    await click('.header-menu-toggle');await click('.brand-logo');assert.equal(await opened(),false)
    // Trusted touch on the trigger and outside, with no hover dependency.
    for(const selector of ['.header-menu-toggle','.brand-logo']) {const r=await ev(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await A.cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...r,id:1}]});await A.cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(40);assert.equal(await opened(),selector==='.header-menu-toggle')}
    if (zoom === 1) {
      for (const [hash, label] of [['#/', 'home'], ['#/aprender', 'learn']]) {
        await ev('location.hash=' + JSON.stringify(hash)); await pause(80)
        await ev('window.scrollTo(0,0)'); await pause(30)
        const shot = await A.cdp('Page.captureScreenshot', { format:'jpeg', quality:75 })
        fs.writeFileSync(path.join(shots, label + '-' + width + '-' + size + '.jpg'), Buffer.from(shot.data, 'base64'))
      }
    }
  }
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
  console.log('PASS header: seven widths Normal/Grande; mouse/touch toggle/outside; three preserved routes, plans and two account routes; Tab/Enter/Escape, focus, logo proportions and no overflow.')
} finally {
  for(const socket of sockets)socket.close();chrome.kill();await server.close();await pause(500)
  const resolved=path.resolve(profile)
  if(path.dirname(resolved)!==tempRoot||!path.basename(resolved).startsWith('falalivre-header-'))throw Error('unsafe temporary path')
  try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:200})}catch{console.log('Temporary Chrome profile remains: '+resolved)}
}
