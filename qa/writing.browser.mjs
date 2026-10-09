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
  assert.equal(await ev('document.activeElement.id'),'writing-notebook-panel')
  assert.ok(await ev('(()=>{const r=document.querySelector("#writing-notebook-panel .writing-practice").getBoundingClientRect();return r.top>=0&&r.bottom<innerHeight})()'),'selecting Caderno keeps the reference visible')
  assert.equal(await ev('Array.from(document.querySelectorAll("button")).find(b=>b.textContent==="Concluir prática").disabled'),false)
  assert.equal(await ev('localStorage.getItem("falaLivre_progress_v1")'),initialProgress,'selecting Caderno never awards completion')
  await click('#writing-typing-mode')
  assert.ok(await ev('document.querySelector(".writing-slot-panel").textContent.includes("A")'),'typed draft preserved across mode changes')
  await button('Limpar')
  await click('[aria-label="Inserir letra Z"]');await button('Conferir');assert.ok(await ev('document.querySelector(".writing-feedback").textContent.includes("Quase")'));await button('Apagar')
  // Direct notebook practice is self-confirmed, never invents typing, and advances once.
  await click('#writing-notebook-mode')
  const directName = await ev('document.querySelector("#writing-notebook-panel .writing-practice h2").textContent')
  const directWord = words.find(w => w.word === directName)
  const beforeRotation = await ev('JSON.parse(localStorage.getItem("falaLivre_contentRotation_v1")).modules.writingNotebook')
  const keyboardBefore = await ev('JSON.parse(localStorage.getItem("falaLivre_contentRotation_v1")).modules.writing')
  await ev('document.querySelector("canvas").scrollIntoView({block:"center"})')
  const directPoint = await ev('(()=>{const r=document.querySelector("canvas").getBoundingClientRect();return{x:r.x+40,y:r.y+40}})()')
  for(const [type,offset,buttons] of [['mousePressed',0,1],['mouseMoved',45,1],['mouseReleased',45,0]]) await A.cdp('Input.dispatchMouseEvent',{type,x:directPoint.x+offset,y:directPoint.y+offset/2,button:'left',buttons,clickCount:1})
  await pause(60)
  assert.ok(await ev('(()=>{const c=document.querySelector("canvas");return c.getContext("2d").getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0)})()'))
  await ev('(()=>{const b=document.querySelector("#writing-notebook-panel .writing-actions button");b.click();b.click()})()')
  await wait('document.querySelector("#writing-notebook-panel .writing-practice h2").textContent!=='+JSON.stringify(directName))
  await wait('JSON.parse(localStorage.getItem("falaLivre_progress_v1"))?.performedActivities.writing['+JSON.stringify(directWord.id)+']?.includes("notebook")')
  assert.deepEqual(await ev('JSON.parse(localStorage.getItem("falaLivre_progress_v1")).performedActivities.writing['+JSON.stringify(directWord.id)+']'),['notebook'])
  assert.equal(await ev('JSON.parse(localStorage.getItem("falaLivre_contentRotation_v1")).modules.writingNotebook.currentIndex'),beforeRotation.currentIndex+1)
  assert.deepEqual(await ev('JSON.parse(localStorage.getItem("falaLivre_contentRotation_v1")).modules.writing'),keyboardBefore)
  // Start the full-cycle scenario at its boundary in this isolated test profile.
  await ev('localStorage.removeItem("falaLivre_contentRotation_v1");location.reload()')
  await wait('document.querySelector(".writing-letter")!==null')
  // All twelve targets are completed using only public virtual-letter controls.
  const seen=new Set()
  for(let i=0;i<12;i++) {
    const word=await ev('document.querySelector("#writing-typing-panel .writing-practice h2").textContent')
    const target=words.find(w=>w.word===word);assert.ok(target,word);assert.ok(!seen.has(target.id));seen.add(target.id)
    assert.equal(await ev('document.querySelectorAll(\'[aria-label="Letras com acento"]\').length'),target.letters.includes('Á')?1:0,word)
    if(target.letters.includes('Á')){await click('[aria-label="Ouvir letra Á"]');assert.equal(await ev('window.__spoken.at(-1)'),'á')}
    for(const letter of target.letters)await click('[aria-label='+JSON.stringify('Inserir letra '+letter)+']')
    await button('Conferir');await wait('document.querySelector(".writing-feedback").textContent.includes("Muito bem")')
    await wait('JSON.parse(localStorage.getItem("falaLivre_progress_v1"))?.performedActivities.writing['+JSON.stringify(target.id)+']?.includes("typing")')
    const notebookBefore=await ev('JSON.parse(localStorage.getItem("falaLivre_contentRotation_v1")).modules.writingNotebook')
    await ev('(()=>{const b=[...document.querySelectorAll("#writing-typing-panel button")].find(b=>b.textContent==="Próxima palavra");b.click();b.click()})()');await pause(50)
    assert.deepEqual(await ev('JSON.parse(localStorage.getItem("falaLivre_contentRotation_v1")).modules.writingNotebook'),notebookBefore)
  }
  await click('#writing-notebook-mode')
  const notebookSeen=new Set()
  for(let i=0;i<12;i++) {
    const name=await ev('document.querySelector("#writing-notebook-panel .writing-practice h2").textContent')
    const target=words.find(w=>w.word===name);assert.ok(!notebookSeen.has(target.id));notebookSeen.add(target.id)
    const typingBefore=await ev('JSON.parse(localStorage.getItem("falaLivre_contentRotation_v1")).modules.writing')
    await button('Concluir prática');await pause(50)
    await wait('JSON.parse(localStorage.getItem("falaLivre_progress_v1"))?.performedActivities.writing['+JSON.stringify(target.id)+']?.includes("complete")')
    assert.deepEqual(await ev('JSON.parse(localStorage.getItem("falaLivre_contentRotation_v1")).modules.writing'),typingBefore)
  }
  const savedPositions=await ev('localStorage.getItem("falaLivre_contentRotation_v1")')
  await ev('location.reload()');await wait('document.querySelector(".writing-letter")!==null')
  assert.equal(await ev('localStorage.getItem("falaLivre_contentRotation_v1")'),savedPositions,'both cycles persist after refresh')
  const shots=path.join(tempRoot,'falalivre-writing-review');fs.mkdirSync(shots,{recursive:true})
  for(const phase of ['typing','notebook']) {
    if(phase==='notebook'){
      await click('#writing-notebook-mode')
    }
    for(const width of [320,360,390,430,768,1024,1366,1440,1920])for(const size of ['normal','large']) {
      await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<=430})
      await ev('document.documentElement.dataset.elementSize='+JSON.stringify(size)+';document.documentElement.dataset.reduceMotion="true";window.scrollTo(0,0)');await pause(50)
      await physicalAbsent();assert.ok(await ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'),phase+width+size)
      assert.ok(await ev('document.querySelector(".learning-landscape[data-learning-kind=writing]")!==null'))
      assert.ok(await ev('getComputedStyle(document.querySelector(".home-surround")).backgroundColor!=="rgba(0, 0, 0, 0)"'))
      assert.equal(await ev('document.querySelector(".learning-scene-character")'),null)
      assert.equal(await ev('document.querySelectorAll(".writing-color-swatch").length'),12)
      assert.equal(await ev('document.querySelectorAll(".writing-color-swatch[aria-pressed=true] .writing-color-check").length'),1)
      if(phase==='notebook')assert.ok(await ev('Array.from(document.querySelectorAll(".writing-color-swatch")).every(e=>{const r=e.getBoundingClientRect();return r.width>=(document.documentElement.dataset.elementSize==="large"?56:44)&&r.height>=44})'))
      if(phase==='notebook') {
        assert.ok(await ev('(()=>{const sheet=document.querySelector(".writing-sheet"),tools=document.querySelector(".writing-notebook-toolbar"),reference=document.querySelector("#writing-notebook-panel .writing-practice");return reference.getBoundingClientRect().bottom<sheet.getBoundingClientRect().top&&sheet.compareDocumentPosition(tools)&Node.DOCUMENT_POSITION_FOLLOWING})()'))
        if(width<=430)assert.ok(await ev('(()=>{const b=[...document.querySelectorAll(".writing-tool-button")],r=b.map(e=>e.getBoundingClientRect());return r[0].top===r[1].top&&r[2].top===r[3].top&&r[2].top>r[0].top&&b.every(e=>{return e.scrollWidth<=e.clientWidth+1&&e.getBoundingClientRect().height<=80&&getComputedStyle(e).overflowWrap==="normal"})})()'),'compact 2x2 tools '+width+size)
      }
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
  const drawnPixels=await pixels()
  await click('[aria-label="Selecionar ferramenta Borracha"]')
  for(const size of ['Fino','Médio','Grosso']) {
    await click('[aria-label='+JSON.stringify('Espessura '+size)+']')
    assert.equal(await ev('document.querySelectorAll(".writing-thickness[aria-pressed=true]").length'),1)
  }
  p=await point()
  for(const [type,x,y,buttons]of [['mousePressed',p.x,p.y,1],['mouseMoved',p.x+70,p.y+30,1],['mouseReleased',p.x+70,p.y+30,0]])await A.cdp('Input.dispatchMouseEvent',{type,x,y,button:'left',buttons,clickCount:1})
  await pause(80);assert.ok(await pixels()<drawnPixels,'eraser removes existing strokes')
  await button('Desfazer');assert.equal(await pixels(),drawnPixels,'undo restores erased drawing')
  await click('[aria-label="Selecionar ferramenta Lápis"]')
  await click('#writing-typing-mode');await click('#writing-notebook-mode');await pause(100);assert.ok(await pixels()>0,'drawing preserved across mode changes')
  const draftPixels=await pixels(), draftWord=await ev('document.querySelector("#writing-notebook-panel .writing-practice h2").textContent')
  await click('#writing-typing-mode')
  const nextTypingWord=await ev('document.querySelector("#writing-typing-panel .writing-practice h2").textContent')
  for(const letter of words.find(w=>w.word===nextTypingWord).letters)await click('[aria-label='+JSON.stringify('Inserir letra '+letter)+']')
  await button('Conferir');await button('Próxima palavra');await click('#writing-notebook-mode')
  assert.equal(await pixels(),draftPixels,'typing advance never clears the notebook draft')
  assert.equal(await ev('document.querySelector("#writing-notebook-panel .writing-practice h2").textContent'),draftWord)
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
  for(const entry of await ev("(async()=> (await import('/src/data/alphabet.js')).alphabet)()")) {
    await click('[aria-label='+JSON.stringify('Ouvir letra '+entry.letter)+']');assert.equal(await ev('window.__spoken.at(-1)'),entry.audioText)
  }
  await click('[aria-label="Ouvir letra A"]');assert.equal(await ev('window.__spoken.at(-1)'),'a');await ev(`document.querySelector('[aria-label="Inserir letra A"]').focus()`)
  for(const type of ['keyDown','keyUp'])await A.cdp('Input.dispatchKeyEvent',{type,key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:type==='keyDown'?'\r':undefined})
  await pause(60);assert.ok(await ev('document.querySelector(".writing-slot-panel").textContent.includes("A")'));assert.equal(await ev('getComputedStyle(document.activeElement).outlineStyle'),'solid')
  await button('Limpar');assert.ok(await ev('!document.querySelector(".writing-slot-panel").textContent.includes("A")'))
  await ev(`document.querySelector('[aria-label="Inserir letra A"]').scrollIntoView({block:"center"})`)
  const key=await ev(`(()=>{const r=document.querySelector('[aria-label="Inserir letra A"]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`)
  await A.cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[key]});await A.cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(80);assert.ok(await ev('document.querySelector(".writing-slot-panel").textContent.includes("A")'))
  await ev('location.hash="#/aprender/escrever/caderno"');await wait('document.querySelector("canvas")!==null&&document.querySelector(".writing-mode-selector")===null')
  assert.ok(await ev('Array.from(document.querySelectorAll("main a")).some(a=>a.textContent==="Voltar a Escrever"&&a.getAttribute("href")==="#/aprender/escrever")'),'free notebook has a real return action')
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
  console.log('PASS Escrever: independent typing/notebook sequences, 12-word cycles, refresh, duplicate guards, combined real evidence, draft preserved during typing advance; all 26 letter names; keyboard/touch/focus, palette and drawing tools, mouse/touch/pen/undo/clear/resize, nine widths Normal/Grande. Screenshots: '+shots)
} finally {
  for (const socket of sockets) socket.close(); chrome.kill(); await server.close(); await pause(500)
  const resolved = path.resolve(profile)
  if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith('falalivre-writing-')) throw Error('unsafe temporary path')
  try { fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { console.log('Temporary Chrome profile remains: ' + resolved) }
}
