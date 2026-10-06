import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Audit-only harness. Native storage below belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4208, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-final-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9358', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
  for(let i=0;i<100;i++){try{targets=await(await fetch('http://127.0.0.1:9358/json/list')).json();if(targets.some(t=>t.type==='page'))break}catch{}await pause(100)}
  const A=await connect(targets.find(t=>t.type==='page'))
  await A.cdp('Page.addScriptToEvaluateOnNewDocument',{source:"window.__spoken=[];window.confirm=()=>true;const s=new EventTarget();s.getVoices=()=>[{name:'QA BR',voiceURI:'qa',lang:'pt-BR',localService:true}];s.cancel=()=>{};s.speak=u=>__spoken.push(u.text);Object.defineProperty(window,'speechSynthesis',{value:s});window.SpeechSynthesisUtterance=class{constructor(t){this.text=t}}"})
  await A.cdp('Network.enable');await A.cdp('Network.setCacheDisabled',{cacheDisabled:true})
  await A.cdp('Page.navigate',{url:'http://127.0.0.1:4208/'});await ready(A)
  const ev=A.evaluate,route=async hash=>{await ev('location.hash='+JSON.stringify(hash));await pause(45)}
  const games=['caminho','quebra-cabeca','caca-palavras','memoria','encontre-imagem','onde-pertence','bingo','sequencias','situacoes-interativas']
  const routes=['/','/aprender','/aprender/comunicar','/aprender/palavras-frases','/aprender/escrever','/aprender/escrever/teclado','/aprender/escrever/caderno','/aprender/meu-dia-a-dia','/aprender/meu-dia-a-dia/rotinas','/aprender/meu-dia-a-dia/comunicacao','/aprender/meu-dia-a-dia/emocoes','/jogar',...games.map(g=>'/jogar/'+g),'/meu-progresso','/perfil','/responsaveis']
  for(const hash of routes){await route(hash);await A.cdp('Page.reload',{ignoreCache:true});await pause(150);await ready(A);assert.ok(await ev('!!document.querySelector("main h1")'),hash);assert.equal(await ev('__spoken.length'),0,'no mount autoplay '+hash)}
  await route('/route-that-does-not-exist');assert.equal(await ev('document.querySelector("main").className'),'home')
  await route('/aprender');await route('/perfil');await ev('history.back()');await pause(100);assert.equal(await ev('location.hash'),'#/aprender');await ev('history.forward()');await pause(100);assert.equal(await ev('location.hash'),'#/perfil')
  const shots=path.join(os.tmpdir(),'falalivre-final-validation','screenshots');fs.mkdirSync(shots,{recursive:true})
  for(const width of [320,360,390,430,768,1024,1366,1440]){
    await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false})
    for(const large of [false,true])for(const zoom of [1,1.25]){
      await ev(`document.documentElement.dataset.elementSize='${large?'large':'normal'}';document.documentElement.dataset.reduceMotion='true';document.documentElement.style.zoom=${zoom}`)
      for(const hash of routes){
        await route(hash)
        const size=await ev('({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})')
        assert.ok(size.scroll<=size.client+1,JSON.stringify({hash,width,large,zoom,size}))
        assert.deepEqual(await ev('Array.from(document.images).filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)'),[])
        assert.deepEqual(await ev('Array.from(document.querySelectorAll("button,a,select,input")).filter(e=>!e.getAttribute("aria-label")&&!e.getAttribute("aria-labelledby")&&!e.textContent.trim()&&!e.labels?.length&&!e.querySelector("img[alt]")).map(e=>e.outerHTML)'),[],'unnamed control '+hash)
        if(!large&&zoom===1&&[390,1440].includes(width)&&['/','/aprender/escrever/caderno','/jogar/memoria','/meu-progresso','/perfil'].includes(hash)){
          const image=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:65,captureBeyondViewport:true});fs.writeFileSync(path.join(shots,hash.replaceAll('/','_')+'-'+width+'.jpg'),Buffer.from(image.data,'base64'))
        }
      }
    }
  }
  await ev('document.documentElement.style.zoom=1');await route('/aprender/escrever/caderno')
  const pixels=()=>ev("(()=>{const c=document.querySelector('canvas'),data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<data.length;i+=4)if(data[i])n++;return n})()")
  assert.equal(await pixels(),0)
  await ev('document.querySelector("canvas").scrollIntoView({block:"center"})');await pause(100)
  let rect=await ev('(()=>{const r=document.querySelector("canvas").getBoundingClientRect();return {x:r.x+30,y:r.y+30}})()')
  for(const [type,x,y,button,buttons] of [['mousePressed',rect.x,rect.y,'left',1],['mouseMoved',rect.x+45,rect.y+25,'left',1],['mouseReleased',rect.x+45,rect.y+25,'left',0]])await A.cdp('Input.dispatchMouseEvent',{type,x,y,button,buttons,clickCount:1})
  await pause(100);assert.ok(await pixels()>0,'native mouse draw')
  await A.cdp('Emulation.setDeviceMetricsOverride',{width:768,height:1000,deviceScaleFactor:1,mobile:false});await pause(150);assert.ok(await pixels()>0,'resize preserves strokes')
  await ev("Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Desfazer').click()");await pause(100);assert.equal(await pixels(),0)
  await ev('document.querySelector("canvas").scrollIntoView({block:"center"})');await pause(100);rect=await ev('(()=>{const r=document.querySelector("canvas").getBoundingClientRect();return {x:r.x+30,y:r.y+30}})()')
  await A.cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rect.x,y:rect.y}]});await A.cdp('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:rect.x+40,y:rect.y+20}]});await A.cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(100);assert.ok(await pixels()>0,'emulated touch draw')
  await ev("Array.from(document.querySelectorAll('.writing-notebook-toolbar button')).find(b=>b.textContent.trim()==='Limpar').click()");await pause(100);assert.equal(await pixels(),0)
  const favicon=await ev("(async()=>{const l=document.querySelector('link[rel=icon]'),image=new Image();image.src=l.href;await image.decode();return {href:l.href,width:image.naturalWidth,height:image.naturalHeight}})()")
  assert.ok(favicon.href.endsWith('/fala-livre-icon.png'));assert.equal(favicon.width,favicon.height)
  assert.ok(await ev('document.querySelector(".brand-logo").src.endsWith("/fala-livre-logo.png")'))
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
  console.log('PASS '+routes.length+' routes public/legacy reload, unknown route/Home, back/forward, all routes x 8 widths x Normal/Grande x 100/125% zoom, accessible control names, no image/runtime issues; native mouse and emulated touch canvas/undo/clear/resize; actual PNG favicon/header. Screenshots: '+shots)

} finally {
  for(const socket of sockets)socket.close();chrome.kill();await server.close();await pause(500)
  const resolved=path.resolve(profile)
  if(path.dirname(resolved)!==tempRoot||!path.basename(resolved).startsWith('falalivre-final-'))throw Error('unsafe temporary path')
  try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:200})}catch{console.log('Temporary Chrome profile remains: '+resolved)}
}
