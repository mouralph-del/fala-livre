import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Targeted navigation styling harness. Native storage belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4213, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-child-entry-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9363', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
const luminance = rgb => { const c=rgb.match(/[\d.]+/g).slice(0,3).map(v=>{v=Number(v)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return .2126*c[0]+.7152*c[1]+.0722*c[2] };
const baseline = process.argv.includes('--baseline'), review=path.join(tempRoot,'falalivre-child-entry-review');fs.mkdirSync(review,{recursive:true});
try {
 let targets;for(let i=0;i<100;i++){try{targets=await(await fetch('http://127.0.0.1:9363/json/list')).json();if(targets.some(t=>t.type==='page'))break}catch{}await pause(100)}
 const A=await connect(targets.find(t=>t.type==='page')),ev=A.evaluate;await A.cdp('Page.navigate',{url:'http://127.0.0.1:4213/__audit#/'});await ready(A)
 const previous=baseline?{}:fs.existsSync(path.join(review,'before.json'))?JSON.parse(fs.readFileSync(path.join(review,'before.json'),'utf8')):null,results={}
 for(const width of [320,360,390,430,768,1024,1366])for(const size of ['normal','large'])for(const zoom of [1,1.25])for(const [route,intro,content] of [['aprender','.learn-intro','.learning-grid'],['jogar','.games-intro','.games-grid'],['aprender/comunicar','.communication-intro','.sentence-panel']]) {
  await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await ev(`document.documentElement.dataset.elementSize=${JSON.stringify(size)};document.documentElement.style.zoom=${zoom};location.hash=${JSON.stringify('/'+route)}`);await pause(65)
  const key=[route,width,size,zoom].join('-'),m=await ev(`(()=>{const intro=document.querySelector('${intro}'),content=document.querySelector('${content}'),back=document.querySelector('main>a'),r=content.getBoundingClientRect();return {top:r.top,height:intro.getBoundingClientRect().height,back:back.getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,clipped:Array.from(document.querySelectorAll('main h1,main h2,main button,main a'),e=>({name:e.textContent.trim(),hidden:!e.getClientRects().length,clipped:e.scrollWidth>e.clientWidth+1})).filter(e=>!e.hidden&&e.clipped)}})()`);results[key]=m
  assert.equal(m.overflow,false,key);assert.deepEqual(m.clipped,[],key);assert.ok(m.back>=(size==='large'?55:47)*zoom,key)
  if(!baseline){assert.ok(m.height<180*zoom,key);if(previous){assert.ok(m.height<previous[key].height,key+' intro not reduced');assert.ok(m.top<previous[key].top-8*zoom,key+' content not earlier')}assert.equal(await ev(`getComputedStyle(document.querySelector('${intro}')).boxShadow`),'none')}
  if(zoom===1){const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:70,captureBeyondViewport:true});fs.writeFileSync(path.join(review,(baseline?'before-':'after-')+key.replaceAll('/','-')+'.jpg'),Buffer.from(shot.data,'base64'))}
 }
 fs.writeFileSync(path.join(review,baseline?'before.json':'after.json'),JSON.stringify(results,null,2))
 if(!baseline){
  for(const route of ['aprender','jogar']){await ev(`document.documentElement.style.zoom=1;location.hash='/${route}'`);await pause(80);const styles=await ev(`Array.from(document.querySelectorAll('.learning-card,.game-card'),e=>({background:getComputedStyle(e).backgroundImage,ink:getComputedStyle(e.querySelector('h2')).color,icon:e.querySelector('svg').getBoundingClientRect().width}))`);assert.ok(new Set(styles.map(e=>e.background)).size>=4);assert.ok(styles.every(e=>e.icon>=64));for(const s of styles){const surface=s.background.match(/rgb\([^)]+\)/)[0];assert.ok((luminance(surface)+.05)/(luminance(s.ink)+.05)>=4.5,s.ink+' contrast')}}
  await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await ev(`document.documentElement.dataset.reduceMotion='true';document.querySelector('.game-start').focus()`);assert.equal(await ev('getComputedStyle(document.activeElement.closest(".game-card")).outlineStyle'),'solid');assert.equal(await ev('getComputedStyle(document.querySelector(".game-card")).transitionDuration'),'0s')
 }
 if(!baseline){
  await A.cdp('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:true});
  for(const [route,selector,destination] of [['aprender','.learning-start','#/aprender/comunicar'],['jogar','.game-start','#/jogar/caminho']]){
   await ev('location.hash='+JSON.stringify('/'+route));await pause(80);await ev('document.querySelector('+JSON.stringify(selector)+').scrollIntoView({block:"center"})');const r=await ev('(()=>{const r=document.querySelector('+JSON.stringify(selector)+').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');await A.cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...r,id:1}]});await A.cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(100);assert.equal(await ev('location.hash'),destination)
  }
 }
 assert.deepEqual(errors,[]);assert.deepEqual(warnings,[]);console.log('PASS '+(baseline?'baseline':'child entries')+': three routes x seven widths x Normal/Grande x zoom 100/125; earlier content, shorter headers, targets, no overflow/clipped text. Review: '+review)
}finally{for(const socket of sockets)socket.close();chrome.kill();await server.close();await pause(500);const resolved=path.resolve(profile);if(path.dirname(resolved)!==tempRoot||!path.basename(resolved).startsWith('falalivre-child-entry-'))throw Error('unsafe temporary path');try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:200})}catch{}}
