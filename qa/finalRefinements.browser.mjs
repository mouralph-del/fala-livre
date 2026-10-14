import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Targeted navigation styling harness. Native storage belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4219, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-writing-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9369', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
  for(let i=0;i<100;i++){try{targets=await(await fetch('http://127.0.0.1:9369/json/list')).json();if(targets.some(t=>t.type==='page'))break}catch{}await pause(100)}
  const A=await connect(targets.find(t=>t.type==='page')),ev=A.evaluate
  await A.cdp('Page.addScriptToEvaluateOnNewDocument',{source:`window.__spoken=[];const synth=new EventTarget();synth.getVoices=()=>[{name:'Test Brazilian',voiceURI:'test-br',lang:'pt-BR'}];synth.cancel=()=>{};synth.speak=u=>window.__spoken.push(u.text);Object.defineProperty(window,'speechSynthesis',{value:synth,configurable:true});window.SpeechSynthesisUtterance=class{constructor(text){this.text=text}}`})
  await A.cdp('Page.navigate',{url:'http://127.0.0.1:4219/__audit#/aprender/escrever'});await ready(A)
  const wait=async expression=>{for(let i=0;i<150;i++){if(await ev(expression))return;await pause(40)}throw Error('not ready: '+expression)}
  const click=async selector=>{await ev('document.querySelector('+JSON.stringify(selector)+').click()');await pause(40)}
  const button=async text=>{await ev('Array.from(document.querySelectorAll("main button")).find(b=>b.getClientRects().length&&b.textContent.trim()==='+JSON.stringify(text)+').click()');await pause(40)}
  const words=await ev("(async()=> (await import('/src/data/learningWords.js')).learningWords)()")
  assert.equal(words.length,12)
  await wait('document.querySelector(".writing-letter")!==null')
  const physicalAbsent=async()=>{assert.equal(await ev('document.querySelectorAll("main input").length'),0);assert.equal(await ev('document.querySelectorAll(".writing-physical-entry").length'),0)}
  await physicalAbsent()
  assert.equal(await ev(`document.querySelectorAll('[aria-label="Letras do alfabeto"] .writing-letter').length`),26)

  const current = () => ev('document.querySelector("#writing-typing-panel .writing-practice h2").textContent')
  const name = await current(), target = words.find(w => w.word === name)
  assert.ok(target)
  const hidden = () => ev('document.querySelector("#writing-typing-panel .writing-practice h2").textContent === "Observe a imagem"')
  const remaining = () => ev('document.querySelector("#writing-typing-panel .writing-help span").textContent')
  await click('[aria-label="Inserir letra A"]');assert.ok(await hidden())
  await button('Apagar');assert.ok(await hidden())
  await click('[aria-label="Inserir letra A"]');await button('Limpar');assert.ok(await hidden())
  await click('#writing-notebook-mode');await click('#writing-typing-mode');assert.ok(await hidden())
  await ev('location.reload()');await wait('document.querySelector(".writing-letter")!==null');assert.ok(await hidden())
  await ev('location.hash="#/aprender"');await wait('document.querySelector(".writing-letter")===null');await ev('location.hash="#/aprender/escrever"');await wait('document.querySelector(".writing-letter")!==null');assert.ok(await hidden())
  assert.ok(await ev('document.querySelector("#writing-typing-panel .writing-practice img").naturalWidth>0'))
  await button('Ajuda');assert.equal(await current(),name);assert.equal(await remaining(),'Ajudas restantes: 2')
  for(let i=0;i<5;i++) await button('Ajuda')
  assert.equal(await remaining(),'Ajudas restantes: 2')
  await ev('location.reload()');await wait('document.querySelector(".writing-letter")!==null');assert.equal(await current(),name);assert.equal(await remaining(),'Ajudas restantes: 2')
  await click('#writing-notebook-mode');await click('#writing-typing-mode');assert.equal(await remaining(),'Ajudas restantes: 2')
  await ev('(()=>{const key="falaLivre_writingHints_v1",data=JSON.parse(localStorage.getItem(key));for(const value of Object.values(data)){value.remaining=0;value.revealed=false}localStorage.setItem(key,JSON.stringify(data));location.reload()})()')
  await wait('document.querySelector(".writing-letter")!==null')
  assert.ok(await hidden())
  assert.ok(await ev('document.querySelector(".writing-help button").disabled'))
  assert.equal(await remaining(),'Ajudas restantes: 0')
  assert.equal(await ev('document.querySelector(".completion-celebration")'),null)
  for(const letter of target.letters) await click('[aria-label='+JSON.stringify('Inserir letra '+letter)+']')
  await button('Conferir');await wait('document.querySelector(".completion-celebration")!==null')
  await ev('document.documentElement.dataset.reduceMotion="true"')
  assert.equal(await ev('getComputedStyle(document.querySelector(".completion-star")).animationName'),'none')
  const record=await ev('localStorage.getItem("falaLivre_progress_v1")')
  await button('Conferir');assert.equal(await ev('localStorage.getItem("falaLivre_progress_v1")'),record)
  await click('.completion-celebration button');await button('Conferir');assert.equal(await ev('document.querySelector(".completion-celebration")'),null)
  await button('Próxima palavra');assert.notEqual(await current(),name);assert.equal(await remaining(),'Ajudas restantes: 3')
  for(const width of [320,360,375,390,430,768,1024,1366]) for(const size of ['normal','large']) {
    await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:740,deviceScaleFactor:1,mobile:width<=430})
    await ev('document.documentElement.dataset.elementSize='+JSON.stringify(size)+';document.documentElement.dataset.reduceMotion="true"')
    for(const selector of ['#writing-typing-panel .writing-letter:first-child','#writing-typing-panel .writing-key:last-child button']) {
      await ev('document.querySelector('+JSON.stringify(selector)+').scrollIntoView({block:"center"})');await pause(40)
      const layout=await ev('(()=>{const r=document.querySelector("#writing-typing-panel .writing-practice").getBoundingClientRect(),b=document.querySelector('+JSON.stringify(selector)+').getBoundingClientRect(),i=document.querySelector("#writing-typing-panel .writing-practice img").getBoundingClientRect();return{sticky:r.top>=0&&r.top<30,image:i.top>=0&&i.bottom<innerHeight,clear:b.top>=r.bottom,overflow:document.documentElement.scrollWidth>innerWidth+1,height:r.height}})()')
      assert.ok(layout.sticky&&layout.image&&layout.clear&&!layout.overflow,JSON.stringify({width,size,layout}))
      assert.ok(layout.height<260)
    }
    await ev('window.scrollTo(0,0)');await click('.header-menu-toggle')
    for(const href of ['#/entrar','#/criar-conta']) assert.ok(await ev('(()=>{const r=document.querySelector('+JSON.stringify('.header-popover a[href="'+href+'"]')+').getBoundingClientRect();return r.height>=44&&r.bottom<innerHeight})()'))
    await click('.header-popover a[href="#/entrar"]');assert.equal(await ev('document.querySelector(".header-menu-toggle").getAttribute("aria-expanded")'),'false')
    await ev('location.hash="#/aprender/escrever"');await wait('document.querySelector(".writing-letter")!==null')
  }
  await ev('location.hash="#/meu-progresso"');await wait('document.querySelector(".achievement-summary")!==null')
  assert.ok(await ev('document.querySelector(".achievement-summary h2").textContent.includes("1 estrelas")'))
  await ev('location.reload()');await wait('document.querySelector(".achievement-summary")!==null')
  assert.ok(await ev('document.querySelector(".achievement-summary h2").textContent.includes("1 estrelas")'))
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
  console.log('PASS final refinements: hiding/delete/clear/reload/routes/modes; help/repeated help/persistence/new word; true completion/idempotency/continue; stars/reload; sticky real scrolling and clear controls; auth links and menu closing; eight widths Normal/Grande.')
} finally {
  for (const socket of sockets) socket.close(); chrome.kill(); await server.close(); await pause(500)
  const resolved = path.resolve(profile)
  if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith('falalivre-writing-')) throw Error('unsafe temporary path')
  try { fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { console.log('Temporary Chrome profile remains: ' + resolved) }
}
