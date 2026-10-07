import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Audit-only harness. Native storage below belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4206, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__speech-premium', async (request,response)=>{response.setHeader('Content-Type','text/html');response.end(await server.transformIndexHtml('/__speech-premium',html.replace('/src/main.jsx','/qa/premiumAccess.fixture.jsx')))}); server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
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
    const s=new EventTarget();s.getVoices=()=>window.__voices;s.cancel=()=>window.__cancel++;s.speak=u=>window.__spoken.push({text:u.text,voice:u.voice?.name,sameReference:u.voice===window.__selectedRef,lang:u.lang,rate:u.rate,pitch:u.pitch,volume:u.volume});
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
    assert.equal(await ev('document.querySelector(".profile-voice-group summary").textContent'),'Outros idiomas')
    assert.equal(await ev('document.querySelector("details.profile-voice-group").open'),false)
    await ev("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Ouvir exemplo').click()");await pause(100)
    assert.equal(await ev('__spoken.at(-1).voice'),'BR local')
    assert.equal(await ev('__spoken.at(-1).text'),'Olá! Vamos aprender juntos.')
    await ev(`window.__voices=[{name:'BR newer',voiceURI:'new',lang:'pt-BR',default:true,localService:true},...window.__voices.reverse()];speechSynthesis.dispatchEvent(new Event('voiceschanged'))`);await pause(80)
    await ev("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Ouvir exemplo').click()");await pause(60)
    assert.equal(await ev('__spoken.at(-1).voice'),'BR local','automatic stays pinned when a new higher-score voice arrives')
    await click('.profile-voice-group summary')
    await ev(`Array.from(document.querySelectorAll('.profile-voice-group label')).find(e=>e.textContent.startsWith('English')).querySelector('input').click()`);await pause(60)
    await ev("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Ouvir exemplo').click()");await pause(60)
    assert.equal(await ev('__spoken.at(-1).voice'),'English','manual voice in another language is actually used')
    await ev(`Array.from(document.querySelectorAll('.profile-voice-group label')).find(e=>e.textContent.startsWith('BR remote')).querySelector('input').click()`);await pause(60)
    await ev("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Ouvir exemplo').click()");await pause(100);assert.equal(await ev('__spoken.at(-1).voice'),'BR remote')
    await ev(`window.__selectedRef=window.__voices.find(v=>v.voiceURI==='br')`)
    const unrelated=await ev(`(()=>{const p=JSON.parse(localStorage.getItem('falalivre.preferences'));delete p.voice;return JSON.stringify(p)})()`)
    await ev(`(async()=>{localStorage.setItem('falaLivre_progress_v1',JSON.stringify((await import('/src/utils/progress.js')).createEmptyProgress('12345678-1234-4234-8234-123456789abc')))})()`)
    const progressBefore=await ev(`localStorage.getItem('falaLivre_progress_v1')`)
    const route=async hash=>{await ev('location.hash='+JSON.stringify(hash));await pause(120)}
    await route('#/');assert.equal(await ev('document.querySelector("#welcome-title").textContent'),'Olá!')
    await route('#/aprender/escrever')
    await ev(`Array.from(document.querySelectorAll('main button')).find(e=>e.textContent.trim()==='Ouvir palavra').click()`);await pause(60)
    assert.equal(await ev('__spoken.at(-1).sameReference'),true)
    await click('[aria-label="Ouvir letra A"]');assert.equal(await ev('__spoken.at(-1).sameReference'),true)
    await ev(`(async()=>{const ids=(await import('/src/data/communicationOptions.js')).communicationSetIds;(await import('/src/utils/contentRotationStorage.js')).saveModuleRotation('communication',{order:['want',...ids.filter(id=>id!=='want')],currentIndex:0,cycle:1,lastThemeId:null})})()`)
    await route('#/aprender/comunicar')
    await click('.communication-choices .communication-audio');assert.equal(await ev('__spoken.at(-1).sameReference'),true)
    for(const label of ['EU','QUERO','ÁGUA'])await click('[aria-label='+JSON.stringify('Selecionar '+label)+']')
    await ev(`Array.from(document.querySelectorAll('main button')).find(e=>e.textContent.trim()==='Ouvir frase').click()`);await pause(60)
    assert.equal(await ev('__spoken.at(-1).sameReference'),true);assert.equal(await ev('__spoken.at(-1).text'),'Eu quero beber água.')
    await route('#/perfil')
    await ev("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Ouvir exemplo').click()");await pause(60)
    assert.equal(await ev('__spoken.at(-1).sameReference'),true)
    assert.equal(await ev(`(()=>{const p=JSON.parse(localStorage.getItem('falalivre.preferences'));delete p.voice;return JSON.stringify(p)})()`),unrelated)
    assert.equal(await ev(`localStorage.getItem('falaLivre_progress_v1')`),progressBefore)
    // Existing QA-only Premium injection exercises speech consumers without changing access rules.
    await A.cdp('Page.navigate',{url:'http://127.0.0.1:4206/__speech-premium#/aprender/palavras-frases'});await pause(200);await ready(A)
    await ev(`window.__voices=[{name:'BR remote',voiceURI:'br',lang:'pt-BR'}];window.__selectedRef=window.__voices[0];speechSynthesis.dispatchEvent(new Event('voiceschanged'))`);await pause(80)
    await click('[aria-label^="Ouvir "]');assert.equal(await ev('__spoken.at(-1).sameReference'),true)
    await route('#/aprender/meu-dia-a-dia/rotinas');await click('.sequence-audio');assert.equal(await ev('__spoken.at(-1).sameReference'),true)
    await route('#/aprender/meu-dia-a-dia/comunicacao');await click('[aria-label="Ouvir missão"]');assert.equal(await ev('__spoken.at(-1).sameReference'),true)
    await route('#/aprender/meu-dia-a-dia/emocoes');await click('[aria-label="Abrir Conhecer emoções"]')
    await ev(`Array.from(document.querySelectorAll('main button')).find(e=>e.textContent.trim()==='Ouvir nome').click()`);await pause(60);assert.equal(await ev('__spoken.at(-1).sameReference'),true)
    await route('#/jogar/caminho');await click('.path-action');assert.equal(await ev('__spoken.at(-1).sameReference'),true)
    assert.equal(await ev(`localStorage.getItem('falaLivre_progress_v1')`),progressBefore)
    assert.equal(await ev(`(async()=> (await import('/src/services/planAccess.js')).getCurrentPlan())()`),'free')
    await A.cdp('Page.navigate',{url:'http://127.0.0.1:4206/__audit#/perfil'});await pause(200);await ready(A)
    await A.cdp('Page.reload');await pause(150);await ready(A);await ev(`window.__voices=[{name:'BR remote',voiceURI:'br',lang:'pt-BR'}];speechSynthesis.dispatchEvent(new Event('voiceschanged'))`);await pause(100)
    assert.equal(await ev('document.querySelector(".profile-voice-group input").checked'),true);assert.equal(await ev('__spoken.length'),0)
    await ev(`window.__voices=[{name:'PT fallback',voiceURI:'pt2',lang:'pt-PT'}];speechSynthesis.dispatchEvent(new Event('voiceschanged'))`);await pause(100)
    assert.equal(await ev('document.querySelector("[name=voice]").checked'),true)
    assert.ok(await ev("document.querySelector('main').textContent.includes('Automática está em uso')"))
    await ev("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Ouvir exemplo').click()");await pause(100);assert.equal(await ev('__spoken.at(-1).voice'),'PT fallback')
    await click('.profile-restore button');assert.equal(await ev("JSON.parse(localStorage.getItem('falalivre.preferences')).voice"),null)
    await ev('document.querySelector(".profile-voice-group input").focus()')
    for(const type of ['keyDown','keyUp'])await A.cdp('Input.dispatchKeyEvent',{type,key:' ',code:'Space',windowsVirtualKeyCode:32,text:type==='keyDown'?' ':undefined});await pause(60)
    assert.equal(await ev('document.querySelector(".profile-voice-group input").checked'),true)
    assert.equal(await ev('getComputedStyle(document.querySelector(".profile-voice-group label")).outlineStyle'),'solid')
    await A.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:false})
    await ev('document.querySelector("[name=voice]").scrollIntoView({block:"center"})');await pause(60)
    const touchPoint=await ev('(()=>{const r=document.querySelector("[name=voice]").getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()')
    await A.cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touchPoint]});await A.cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(60)
    assert.equal(await ev('JSON.parse(localStorage.getItem("falalivre.preferences")).voice'),null)
  }else{
    for(let i=0;i<50&&await example();i++)await pause(100)
    console.log('REAL device voices: '+JSON.stringify(await ev('speechSynthesis.getVoices().map(v=>({name:v.name,lang:v.lang,local:v.localService,default:v.default}))')))
    console.log('Real example disabled: '+await example())
    await pause(200)
    assert.deepEqual(await ev('Array.from(document.querySelectorAll(".profile-voice-group .profile-option span"),e=>e.firstChild.textContent)'),await ev("(async()=>{const m=await import('/src/utils/speech.js');return m.getAvailableSpeechVoices().map(v=>v.name)})()"))
  }
  const screenshots=path.join(os.tmpdir(),'falalivre-speech-review');fs.mkdirSync(screenshots,{recursive:true})
  for(const width of [320,360,390,430,768,1024,1366])for(const size of ['normal','large']){
    await ev(`document.documentElement.dataset.elementSize=${JSON.stringify(size)};document.documentElement.dataset.reduceMotion='true'`)
    await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await pause(100)
    assert.ok(await ev('document.documentElement.scrollWidth<=innerWidth+1'))
    const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:65,captureBeyondViewport:true});fs.writeFileSync(path.join(screenshots,(real?'real':'mock')+'-'+width+'-'+size+'.jpg'),Buffer.from(shot.data,'base64'))
  }
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
  console.log('PASS '+(real?'real voice list/UI inspection (no physical listening)':'stable automatic/manual references in example/letters/words/phrases and main consumers; async voices/groups/reorder/persistence/fallback, unchanged preferences/progress/free plan, keyboard/touch/focus, seven widths Normal/Grande, no autoplay')+'; Screenshots: '+screenshots)

} finally {
  for(const socket of sockets)socket.close();chrome.kill();await server.close();await pause(500)
  const resolved=path.resolve(profile)
  if(path.dirname(resolved)!==tempRoot||!path.basename(resolved).startsWith('falalivre-speech-'))throw Error('unsafe temporary path')
  try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:200})}catch{console.log('Temporary Chrome profile remains: '+resolved)}
}
