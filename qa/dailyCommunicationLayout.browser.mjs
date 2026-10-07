import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Targeted navigation styling harness. Native storage belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4218, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-daily-layout-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9368', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
  for(let i=0;i<100;i++){try{targets=await(await fetch('http://127.0.0.1:9368/json/list')).json();if(targets.some(t=>t.type==='page'))break}catch{}await pause(100)}
  const A=await connect(targets.find(t=>t.type==='page')), ev=A.evaluate
  const before=process.argv.includes('--before')
  await A.cdp('Page.navigate',{url:'http://127.0.0.1:4218/__audit#/aprender/meu-dia-a-dia/comunicacao'});await ready(A)
  const cases=await ev(`(async()=> (await import('/src/data/myDayCommunication.js')).myDayCommunication)()`)
  const wait=async expression=>{for(let i=0;i<150;i++){if(await ev(expression))return;await pause(40)}throw Error('not ready: '+expression)}
  const seed=async id=>{
    await ev('location.hash="#/aprender/meu-dia-a-dia"');await pause(70)
    await ev(`(()=>{const d=JSON.parse(localStorage.getItem('falaLivre_contentRotation_v1'));d.modules.myDayCommunication={order:${JSON.stringify([id,...cases.filter(s=>s.id!==id).map(s=>s.id)])},currentIndex:0,cycle:1,lastThemeId:null};localStorage.setItem('falaLivre_contentRotation_v1',JSON.stringify(d))})()`)
    await A.cdp('Page.reload');await pause(150);await ready(A)
    await ev('location.hash="#/aprender/meu-dia-a-dia/comunicacao"');await wait('document.querySelector("[data-situation]")?.dataset.situation==='+JSON.stringify(id))
  }
  const click=async selector=>{await ev('document.querySelector('+JSON.stringify(selector)+').click()');await pause(40)}
  const select=(s,id)=>click('[aria-label='+JSON.stringify('Selecionar '+s.options.find(o=>o.id===id).word)+']')
  const shots=path.join(tempRoot,'falalivre-daily-layout-review');fs.mkdirSync(shots,{recursive:true})
  for(const width of before?[320,1366]:[320,360,390,430,768,1024,1366])for(const size of before?['normal']:['normal','large'])for(const zoom of before?[1]:[1,1.25]) {
    await seed('dormir')
    await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false})
    await ev(`document.documentElement.dataset.elementSize=${JSON.stringify(size)};document.documentElement.dataset.reduceMotion='true';document.documentElement.style.zoom=${zoom};window.scrollTo(0,0)`)
    assert.ok(await ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'),width+size+zoom)
    if(!before) {
      assert.equal(await ev('document.querySelectorAll(".interactive-handle").length'),0)
      assert.equal(await ev('document.querySelectorAll("main select").length'),0)
      const metrics=await ev(`(()=>{const rect=e=>e.getBoundingClientRect(),scene=rect(document.querySelector('.interactive-scene')),slots=rect(document.querySelector('.interactive-phrase')),mission=rect(document.querySelector('.interactive-mission')),options=rect(document.querySelector('.interactive-options'));return{twoColumns:mission.left>scene.left+10,slotsBelow:slots.top>=scene.bottom-1,aligned:Math.abs(scene.left-slots.left)<2,contextEarly:mission.top<scene.top,wide:options.width>=document.querySelector('.interactive-game').clientWidth-40,columns:getComputedStyle(document.querySelector('.interactive-options')).gridTemplateColumns.split(' ').length}})()`)
      if(width>=900){assert.ok(metrics.twoColumns,JSON.stringify({width,size,zoom,metrics}));assert.ok(metrics.slotsBelow);assert.ok(metrics.aligned);assert.ok(metrics.columns>=4)}else assert.ok(metrics.contextEarly,JSON.stringify({width,size,zoom,metrics}))
      assert.ok(metrics.wide)
      assert.deepEqual(await ev(`Array.from(document.querySelectorAll('main button'),e=>({text:e.textContent,clipped:e.scrollWidth>e.clientWidth+1})).filter(e=>e.clipped)`),[])
      const rectangles=await ev(`Array.from(document.querySelectorAll('.interactive-slot,.interactive-remove,.interactive-select,.interactive-option-audio'),e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom}})`)
      assert.equal(rectangles.some((a,i)=>rectangles.slice(i+1).some(b=>Math.min(a.right,b.right)-Math.max(a.x,b.x)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1)),false)
    }
    if(zoom===1&&[320,1366].includes(width)){const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:75,captureBeyondViewport:true});fs.writeFileSync(path.join(shots,(before?'before':'after')+'-'+width+'-'+size+'.jpg'),Buffer.from(shot.data,'base64'))}
  }
  if(!before) {
    await A.cdp('Emulation.setDeviceMetricsOverride',{width:1366,height:1000,deviceScaleFactor:1,mobile:false})
    for(const s of cases) {
      await seed(s.id)
      assert.equal(await ev('document.querySelector(".interactive-narrative").textContent'),s.context)
      assert.equal(await ev('document.querySelector("#interactive-mission").textContent'),s.prompt)
      assert.equal(await ev('document.querySelectorAll(".interactive-slot").length'),s.slotCount)
      await ev('window.__speech=[];speechSynthesis.speak=u=>window.__speech.push(u.text)')
      await click('[aria-label="Ouvir missão"]');assert.equal(await ev('window.__speech.at(-1)'),s.prompt)
      for(const id of s.expectedTokens)await select(s,id)
      await click('.interactive-remove')
      assert.equal(await ev('document.querySelector(".interactive-slot img")!==null'),true)
      await click('.interactive-slot');await select(s,s.expectedTokens[0])
      await click('[aria-label^="Ouvir frase"]');assert.equal(await ev('window.__speech.at(-1)'),s.naturalPhrase)
      await ev(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Limpar frase').click()`);await pause(40)
      assert.equal(await ev('document.querySelectorAll(".interactive-phrase img").length'),0)
      for(const id of s.expectedTokens)await select(s,id)
      await ev(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Conferir frase').click()`);await wait('document.querySelector(".interactive-response")!==null')
      await wait(`JSON.parse(localStorage.getItem('falaLivre_progress_v1'))?.performedActivities.myDayCommunication[${JSON.stringify(s.id)}]?.includes('complete')`)
      await ev(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Próxima situação').click()`);await pause(50)
      assert.notEqual(await ev('document.querySelector("[data-situation]").dataset.situation'),s.id)
    }
    await seed('dormir')
    await ev(`document.querySelector('[aria-label="Selecionar EU"]').focus()`)
    for(const type of ['keyDown','keyUp'])await A.cdp('Input.dispatchKeyEvent',{type,key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:type==='keyDown'?'\r':undefined})
    await pause(40);assert.ok(await ev('document.querySelector(".interactive-phrase").textContent.includes("EU")'))
    assert.equal(await ev('getComputedStyle(document.activeElement).outlineStyle'),'solid')
    await ev(`document.querySelector('[aria-label="Selecionar QUERO"]').scrollIntoView({block:'center'})`)
    const point=await ev(`(()=>{const r=document.querySelector('[aria-label="Selecionar QUERO"]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`)
    await A.cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,id:1}]});await A.cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(60)
    assert.ok(await ev('document.querySelector(".interactive-phrase").textContent.includes("QUERO")'))
  }
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
  console.log('PASS daily communication '+(before?'before screenshots':'layout seven widths Normal/Grande 125%, ten unchanged missions/slots/audio/completions, select/remove/clear, keyboard/touch/focus, no public handles or QA')+'. Screenshots: '+shots)

} finally {
  for (const socket of sockets) socket.close(); chrome.kill(); await server.close(); await pause(500)
  const resolved = path.resolve(profile)
  if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith('falalivre-daily-layout-')) throw Error('unsafe temporary path')
  try { fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { console.log('Temporary Chrome profile remains: ' + resolved) }
}
