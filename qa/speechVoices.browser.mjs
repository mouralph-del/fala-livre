import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Audit-only harness. Native storage below belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4206, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-speech-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9356', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
  for(let i=0;i<100;i++){try{targets=await(await fetch('http://127.0.0.1:9356/json/list')).json();if(targets.some(t=>t.type==='page'))break}catch{}await pause(100)}
  const A=await connect(targets.find(t=>t.type==='page'))
  const real=process.argv.includes('--real')
  if(!real)await A.cdp('Page.addScriptToEvaluateOnNewDocument',{source:`
    window.__spoken=[];window.__cancel=0;window.__voices=[];window.confirm=()=>true;
    const s=new EventTarget();s.getVoices=()=>window.__voices;s.cancel=()=>window.__cancel++;s.speak=u=>window.__spoken.push({text:u.text,voice:u.voice?.name,lang:u.lang,rate:u.rate,pitch:u.pitch,volume:u.volume});
    Object.defineProperty(window,'speechSynthesis',{value:s});window.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};
  `})
  await A.cdp('Page.navigate',{url:'http://127.0.0.1:4206/__audit#/perfil'});await ready(A)
  const ev=A.evaluate,click=async s=>{await ev('document.querySelector('+JSON.stringify(s)+').click()');await pause(100)}
  const example=()=>ev("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Ouvir exemplo')?.disabled")
  if(!real){
    assert.equal(await example(),true);assert.equal(await ev('__spoken.length'),0)
    await ev(`window.__voices=[{name:'PT other',voiceURI:'pt',lang:'pt-PT',localService:true},{name:'BR remote',voiceURI:'br',lang:'pt-BR',localService:false},{name:'BR local',voiceURI:'local',lang:'pt-BR',localService:true},{name:'English',voiceURI:'en',lang:'en-US',default:true}];speechSynthesis.dispatchEvent(new Event('voiceschanged'))`);await pause(100)
    assert.equal(await example(),false);assert.equal(await ev('__spoken.length'),0)
    assert.deepEqual(await ev('Array.from(document.querySelectorAll(".profile-voice-group h3"),n=>n.textContent)'),['Português (Brasil)','Outras vozes em português'])
    await ev("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Ouvir exemplo').click()");await pause(100)
    assert.equal(await ev('__spoken.at(-1).voice'),'BR local')
    await click('.profile-voice-group input');assert.equal(await ev('__spoken.length'),1)
    await ev("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Ouvir exemplo').click()");await pause(100);assert.equal(await ev('__spoken.at(-1).voice'),'BR remote')
    await A.cdp('Page.reload');await ready(A);await ev(`window.__voices=[{name:'BR remote',voiceURI:'br',lang:'pt-BR'}];speechSynthesis.dispatchEvent(new Event('voiceschanged'))`);await pause(100)
    assert.equal(await ev('document.querySelector(".profile-voice-group input").checked'),true);assert.equal(await ev('__spoken.length'),0)
    await ev(`window.__voices=[{name:'PT fallback',voiceURI:'pt2',lang:'pt-PT'}];speechSynthesis.dispatchEvent(new Event('voiceschanged'))`);await pause(100)
    assert.equal(await ev('document.querySelector("[name=voice]").checked'),true)
    assert.ok(await ev("document.querySelector('main').textContent.includes('Automática está em uso')"))
    await ev("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Ouvir exemplo').click()");await pause(100);assert.equal(await ev('__spoken.at(-1).voice'),'PT fallback')
    await click('.profile-restore button');assert.equal(await ev("JSON.parse(localStorage.getItem('falalivre.preferences')).voice"),null)
  }else{
    for(let i=0;i<50&&await example();i++)await pause(100)
    console.log('REAL device voices: '+JSON.stringify(await ev('speechSynthesis.getVoices().map(v=>({name:v.name,lang:v.lang,local:v.localService,default:v.default}))')))
    console.log('Real example disabled: '+await example())
    await pause(200)
    assert.deepEqual(await ev('Array.from(document.querySelectorAll(".profile-voice-group .profile-option span"),e=>e.firstChild.textContent)'),await ev("(async()=>{const m=await import('/src/utils/speech.js');return m.getCommunicationVoices().map(v=>v.name)})()"))
  }
  const screenshots=path.join(os.tmpdir(),'falalivre-speech-review');fs.mkdirSync(screenshots,{recursive:true})
  for(const width of [390,768,1440]){
    await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await pause(100)
    assert.ok(await ev('document.documentElement.scrollWidth<=innerWidth+1'))
    const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:65,captureBeyondViewport:true});fs.writeFileSync(path.join(screenshots,(real?'real':'mock')+'-'+width+'.jpg'),Buffer.from(shot.data,'base64'))
  }
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
  console.log('PASS '+(real?'real voice list/UI inspection (no physical listening)':'async voices, groups, example, manual selection, persistence, disappeared voice, automatic restoration, no autoplay')+'; Screenshots: '+screenshots)

} finally {
  for(const socket of sockets)socket.close();chrome.kill();await server.close();await pause(500)
  const resolved=path.resolve(profile)
  if(path.dirname(resolved)!==tempRoot||!path.basename(resolved).startsWith('falalivre-speech-'))throw Error('unsafe temporary path')
  try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:200})}catch{console.log('Temporary Chrome profile remains: '+resolved)}
}
