import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer, preview } from 'vite'

// Targeted navigation styling harness. Native storage belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4214, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-public-qa-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9364', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
// Public App never opts in; only isolated test fixtures may request QA controls.
import { createEmptyProgress, validateProgress } from '../src/utils/progress.js'
import { gameCatalog } from '../src/data/progressCatalog.js'
const pages=['Communication','WordsAndPhrases','Writing','DailySituations']
for(const name of pages){const source=fs.readFileSync('src/pages/'+name+'.jsx','utf8');assert.ok(source.includes('qaControls = false'));assert.ok(source.includes('import.meta.env.DEV && qaControls &&'))}
assert.equal(/qaControls/.test(fs.readFileSync('src/App.jsx','utf8')),false)
const production=await preview({preview:{host:'127.0.0.1',port:4215,strictPort:true}})
const seed=JSON.parse(JSON.stringify(createEmptyProgress('00000000-0000-4000-8000-000000000001')))
for(const [id,levels] of Object.entries(gameCatalog))seed.completedLevels[id]=[...levels]
assert.ok(validateProgress(seed).valid)
try{
 let targets;for(let i=0;i<100;i++){try{targets=await(await fetch('http://127.0.0.1:9364/json/list')).json();if(targets.some(t=>t.type==='page'))break}catch{}await pause(100)}
 const A=await connect(targets.find(t=>t.type==='page')),ev=A.evaluate
 const shots=path.join(tempRoot,'falalivre-ambient-review');fs.mkdirSync(shots,{recursive:true})
 const shot=async name=>{const result=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:75,captureBeyondViewport:true});fs.writeFileSync(path.join(shots,name+'.jpg'),Buffer.from(result.data,'base64'))}
 const responsive=async label=>{
  for(const width of [320,360,390,430,768,1024,1366])for(const large of [false,true])for(const zoom of [1,1.25]){
   await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:false})
   await ev('document.documentElement.dataset.elementSize='+JSON.stringify(large?'large':'normal')+';document.documentElement.style.zoom='+zoom)
   assert.ok(await ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'),label+' '+width+' overflow')
   assert.equal(await ev('document.querySelector(".home-decoration").getAttribute("aria-hidden")'),'true')
   assert.equal(await ev('getComputedStyle(document.querySelector(".home-decoration")).pointerEvents'),'none')
   assert.equal(await ev('getComputedStyle(document.querySelector(".home-decoration")).display'),'block')
   if(!large&&zoom===1&&[320,1366].includes(width))await shot(label+'-'+width)
  }
  await ev('document.documentElement.style.zoom="";document.documentElement.dataset.elementSize="normal"')
 }
 await A.cdp('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('falaLivre_progress_v1',${JSON.stringify(JSON.stringify(seed))});localStorage.setItem('falalivre.preferences',JSON.stringify({reduceMotion:true}));speechSynthesis.speak=()=>{};speechSynthesis.cancel=()=>{}`})
 const routes=['/','/aprender','/aprender/comunicar','/aprender/palavras-frases','/aprender/escrever','/aprender/escrever/teclado','/aprender/escrever/caderno','/aprender/meu-dia-a-dia','/aprender/meu-dia-a-dia/rotinas','/aprender/meu-dia-a-dia/comunicacao','/aprender/meu-dia-a-dia/emocoes','/aprender/situacoes','/jogar',...Object.keys(gameCatalog).map(id=>'/jogar/'+id),'/jogar/bingo','/jogar/sequencias','/jogar/situacoes-interativas','/meu-progresso','/perfil','/responsaveis','/entrar','/criar-conta']
 const check=async label=>{
  assert.equal(await ev('document.querySelectorAll('+JSON.stringify('[class*="-qa-"],[data-debug],[data-fixture]')+').length'),0,label+' technical DOM')
  assert.equal(await ev('/\\bQA\\b|\\bdebug\\b|fixture|\\bMVP\\b|prot[oó]tipo|demonstra[çc][ãa]o|demonstra[çc][õo]es|rota..o normal|voltar . rota..o|for.ar (conte.do|conclus.o|desbloqueio)/i.test(document.body.textContent)'),false,label+' technical text')
 }
 for(const base of ['http://127.0.0.1:4214/__audit','http://127.0.0.1:4215/']){
  await A.cdp('Page.navigate',{url:base+'#/'});await ready(A)
  for(const route of routes){await ev('location.hash='+JSON.stringify(route));await pause(90);await check(base+route)
   const gameId=route.startsWith('/jogar/')?route.slice(7):null
   if(gameCatalog[gameId]){const selector={caminho:'.path-level','quebra-cabeca':'.puzzle-level','caca-palavras':'.wordsearch-level',memoria:'.memory-level','encontre-imagem':'.findimage-level','onde-pertence':'.belongs-level'}[gameId];assert.equal(await ev('document.querySelectorAll('+JSON.stringify(selector)+').length'),3);for(let index=0;index<3;index++){await ev('document.querySelectorAll('+JSON.stringify(selector)+')['+index+'].click()');await pause(60);await check(gameId+' N'+(index+1));if(base.includes('4215'))await responsive(gameId+'-n'+(index+1))}}
   if(base.includes('4215')&&!gameCatalog[gameId])await responsive(route==='/'?'home':route.slice(1).replaceAll('/','-'))
   if(route==='/perfil')assert.ok(await ev('document.querySelectorAll('+JSON.stringify('main input[name="voice"]')+').length')>0,'real voice selector preserved')
  }
 }
 assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
 console.log('PASS public QA cleanup: static defaults, 27 public/legacy routes and all 18 game levels in DEV and production; no technical controls/text/DOM; real levels/settings preserved.')
 console.log('PASS ambient surfaces: production routes and all 18 levels, seven widths, Normal/Grande, 100/125% zoom, reduced motion, no overflow, aria-hidden noninteractive decoration. Screenshots: '+shots)
}finally{for(const socket of sockets)socket.close();chrome.kill();await server.close();await new Promise(resolve=>production.httpServer.close(resolve));await pause(500);const resolved=path.resolve(profile);if(path.dirname(resolved)!==tempRoot||!path.basename(resolved).startsWith('falalivre-public-qa-'))throw Error('unsafe temporary path');try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:200})}catch{}}
