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
  const initialProgress=await ev('localStorage.getItem("falaLivre_progress_v1")')
  await click('[aria-label="Inserir letra A"]')
  await click('#writing-notebook-mode')
  assert.equal(await ev('document.querySelector("#writing-notebook-panel").hidden'),false)
  assert.equal(await ev('document.querySelector("#writing-typing-panel").hidden'),true)
  assert.ok(await ev('document.querySelector("canvas").getBoundingClientRect().width>0'))
  assert.equal(await ev('document.activeElement.tagName'),'CANVAS')
  assert.ok(await ev('(()=>{const r=document.querySelector("canvas").getBoundingClientRect();return r.top<innerHeight&&r.bottom>0})()'),'selecting Caderno brings the drawing area into view')
  assert.equal(await ev('Array.from(document.querySelectorAll("button")).find(b=>b.textContent==="Concluir prática").disabled'),true)
  assert.equal(await ev('localStorage.getItem("falaLivre_progress_v1")'),initialProgress,'selecting Caderno never awards completion')
  await click('#writing-typing-mode')
  assert.ok(await ev('document.querySelector(".writing-slot-panel").textContent.includes("A")'),'typed draft preserved across mode changes')
  await button('Limpar')
  await click('[aria-label="Inserir letra Z"]');await button('Conferir');assert.ok(await ev('document.querySelector(".writing-feedback").textContent.includes("Quase")'));await button('Apagar')
  // All twelve targets are completed using only public virtual-letter controls.
  const seen=new Set()
  for(let i=0;i<12;i++) {
    const word=await ev('document.querySelector(".writing-practice h2").textContent')
    const target=words.find(w=>w.word===word);assert.ok(target,word);assert.ok(!seen.has(target.id));seen.add(target.id)
    assert.equal(await ev('document.querySelectorAll(\'[aria-label="Letras com acento"]\').length'),target.letters.includes('Á')?1:0,word)
    if(target.letters.includes('Á')){await click('[aria-label="Ouvir letra Á"]');assert.equal(await ev('window.__spoken.at(-1)'),'Á')}
    for(const letter of target.letters)await click('[aria-label='+JSON.stringify('Inserir letra '+letter)+']')
    await button('Conferir');await wait('document.querySelector(".writing-feedback").textContent.includes("Muito bem")')
    await wait('JSON.parse(localStorage.getItem("falaLivre_progress_v1"))?.performedActivities.writing['+JSON.stringify(target.id)+']?.includes("typing")')
    await button('Praticar no caderno');await wait('document.querySelector("canvas")!==null')
    await button('Concluir pr\u00e1tica');await wait('document.querySelector(".writing-letter")!==null')
    await wait('JSON.parse(localStorage.getItem("falaLivre_progress_v1"))?.performedActivities.writing['+JSON.stringify(target.id)+']?.includes("complete")')
  }
  const shots=path.join(tempRoot,'falalivre-writing-review');fs.mkdirSync(shots,{recursive:true})
  for(const phase of ['typing','notebook']) {
    if(phase==='notebook'){
      const word=await ev('document.querySelector(".writing-practice h2").textContent')
      for(const letter of words.find(w=>w.word===word).letters)await click('[aria-label='+JSON.stringify('Inserir letra '+letter)+']')
      await button('Conferir');await button('Praticar no caderno')
    }
    for(const width of [320,390,430,768,1024,1366,1440,1920])for(const size of ['normal','large']) {
      await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false})
      await ev('document.documentElement.dataset.elementSize='+JSON.stringify(size)+';document.documentElement.dataset.reduceMotion="true";window.scrollTo(0,0)');await pause(50)
      await physicalAbsent();assert.ok(await ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'),phase+width+size)
      assert.ok(await ev('document.querySelector(".learning-landscape[data-learning-kind=writing]")!==null'))
      assert.ok(await ev('getComputedStyle(document.querySelector(".home-surround")).backgroundColor!=="rgba(0, 0, 0, 0)"'))
      assert.equal(await ev('document.querySelector(".learning-scene-character")'),null)
      assert.equal(await ev('document.querySelectorAll(".writing-color-swatch").length'),12)
      assert.equal(await ev('document.querySelectorAll(".writing-color-swatch[aria-pressed=true] .writing-color-check").length'),1)
      if(phase==='notebook')assert.ok(await ev('Array.from(document.querySelectorAll(".writing-color-swatch")).every(e=>{const r=e.getBoundingClientRect();return r.width>=(document.documentElement.dataset.elementSize==="large"?56:44)&&r.height>=44})'))
      await ev('window.scrollTo(0,document.documentElement.scrollHeight)');await pause(30)
      assert.ok(await ev('document.querySelector(".home-surround").getBoundingClientRect().bottom>=document.querySelector("main").getBoundingClientRect().bottom'))
      if(phase==='notebook'&&[390,1366,1920].includes(width)&&size==='normal'){const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:75});fs.writeFileSync(path.join(shots,'bottom-'+width+'.jpg'),Buffer.from(shot.data,'base64'))}
      await ev('window.scrollTo(0,0)')
      assert.deepEqual(await ev('Array.from(document.querySelectorAll("main button")).filter(e=>e.getClientRects().length).map(e=>({text:e.textContent,clipped:e.scrollWidth>e.clientWidth+1})).filter(e=>e.clipped)'),[])
      if([390,1366].includes(width)&&size==='normal'){const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:75,captureBeyondViewport:true});fs.writeFileSync(path.join(shots,phase+'-'+width+'.jpg'),Buffer.from(shot.data,'base64'))}
    }
  }
  const pixels=()=>ev('(()=>{const c=document.querySelector("canvas"),d=c.getContext("2d").getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i])n++;return n})()')
  const point=async()=>{await ev('document.querySelector("canvas").scrollIntoView({block:"center"})');await pause(80);return ev('(()=>{const r=document.querySelector("canvas").getBoundingClientRect();return{x:r.x+30,y:r.y+30}})()')}
  let p=await point();assert.equal(await pixels(),0)
  for(const [type,x,y,buttons]of [['mousePressed',p.x,p.y,1],['mouseMoved',p.x+70,p.y+30,1],['mouseReleased',p.x+70,p.y+30,0]])await A.cdp('Input.dispatchMouseEvent',{type,x,y,button:'left',buttons,clickCount:1})
  await pause(100);assert.ok(await pixels()>0)
  await click('#writing-typing-mode');await click('#writing-notebook-mode');await pause(100);assert.ok(await pixels()>0,'drawing preserved across mode changes')
  await A.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:false});await pause(150);assert.ok(await pixels()>0)
  await button('Desfazer');assert.equal(await pixels(),0)
  p=await point();await A.cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await A.cdp('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x+45,y:p.y+25}]});await A.cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(100);assert.ok(await pixels()>0)
  await click('.writing-notebook-toolbar .writing-action-button:last-child');assert.equal(await pixels(),0)
  p=await point();for(const [type,x,y,buttons]of [['mousePressed',p.x,p.y,1],['mouseMoved',p.x+60,p.y+20,1],['mouseReleased',p.x+60,p.y+20,0]])await A.cdp('Input.dispatchMouseEvent',{type,x,y,button:'left',buttons,pointerType:'pen',force:buttons?0.5:0,clickCount:1})
  await pause(100);assert.ok(await pixels()>0,'pen pointer');await button('Desfazer');assert.equal(await pixels(),0)
  for(const name of ['Rosa','Laranja','Marrom','Preto intenso','Cinza','Verde-claro'])for(const tool of ['Lápis','Marcador','Giz de cera']) {
    await click('[aria-label='+JSON.stringify('Selecionar ferramenta '+tool)+']');await click('[aria-label='+JSON.stringify('Cor '+name)+']')
    assert.equal(await ev('document.querySelectorAll(".writing-color-swatch[aria-pressed=true]").length'),1)
    const expected=await ev('getComputedStyle(document.querySelector('+JSON.stringify('[aria-label="Cor '+name+'"]')+')).backgroundColor.match(/\\d+/g).slice(0,3).map(Number)')
    p=await point();for(const [type,x,y,buttons]of [['mousePressed',p.x,p.y,1],['mouseMoved',p.x+70,p.y+30,1],['mouseReleased',p.x+70,p.y+30,0]])await A.cdp('Input.dispatchMouseEvent',{type,x,y,button:'left',buttons,clickCount:1})
    await pause(40)
    const actual=await ev('(()=>{const c=document.querySelector("canvas"),d=c.getContext("2d").getImageData(0,0,c.width,c.height).data;let best=[0,0,0,0];for(let i=0;i<d.length;i+=4)if(d[i+3]>best[3])best=Array.from(d.slice(i,i+4));return best})()')
    assert.ok(actual[3]>0&&expected.every((value,i)=>Math.abs(value-actual[i])<=3),JSON.stringify({name,tool,expected,actual}))
    await click('.writing-notebook-toolbar .writing-action-button:last-child');assert.equal(await pixels(),0)
  }
  await ev('location.hash="#/aprender"');await pause(80);assert.ok(await ev('document.querySelector(".learning-landscape[data-learning-kind=school]")!==null'))
  await ev('location.hash="#/aprender"');await pause(80);await ev('location.hash="#/aprender/escrever"');await wait('document.querySelector(".writing-letter")!==null')
  await ev(`document.querySelector('[aria-label="Inserir letra A"]').focus()`)
  await click('[aria-label="Ouvir letra A"]');assert.equal(await ev('window.__spoken.at(-1)'),'A');await ev(`document.querySelector('[aria-label="Inserir letra A"]').focus()`)
  for(const type of ['keyDown','keyUp'])await A.cdp('Input.dispatchKeyEvent',{type,key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:type==='keyDown'?'\r':undefined})
  await pause(60);assert.ok(await ev('document.querySelector(".writing-slot-panel").textContent.includes("A")'));assert.equal(await ev('getComputedStyle(document.activeElement).outlineStyle'),'solid')
  await button('Limpar');assert.ok(await ev('!document.querySelector(".writing-slot-panel").textContent.includes("A")'))
  await ev(`document.querySelector('[aria-label="Inserir letra A"]').scrollIntoView({block:"center"})`)
  const key=await ev(`(()=>{const r=document.querySelector('[aria-label="Inserir letra A"]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`)
  await A.cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[key]});await A.cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(80);assert.ok(await ev('document.querySelector(".writing-slot-panel").textContent.includes("A")'))
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
  console.log('PASS Escrever: 12 virtual-key completions/progress, no physical input, separate accents, keyboard/touch/focus, expanded palette with all drawing tools, canvas mouse/touch/pen/undo/clear/resize, continuous background, eight widths Normal/Grande. Screenshots: '+shots)
} finally {
  for (const socket of sockets) socket.close(); chrome.kill(); await server.close(); await pause(500)
  const resolved = path.resolve(profile)
  if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith('falalivre-writing-')) throw Error('unsafe temporary path')
  try { fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { console.log('Temporary Chrome profile remains: ' + resolved) }
}
