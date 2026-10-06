import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Audit-only harness. Native storage below belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4202, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-audit-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9352', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
  for(let i=0;i<100;i++){try{targets=await(await fetch('http://127.0.0.1:9352/json/list')).json();if(targets.some(t=>t.type==='page'))break}catch{}await pause(100)}
  const A=await connect(targets.find(t=>t.type==='page'))
  await A.cdp('Page.navigate',{url:'http://127.0.0.1:4202/__audit#/jogar/onde-pertence'});await ready(A)
  await A.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:false})
  const click=async selector=>{assert.ok(await A.evaluate('!!document.querySelector('+JSON.stringify(selector)+')'),'selector exists: '+selector);await A.evaluate('document.querySelector('+JSON.stringify(selector)+').click()');await pause(100)}
  const levels=await A.evaluate("(async()=>{const m=await import('/src/data/whereBelongsLevels.js');return m.whereBelongsLevels})()")
  const screenshots=path.join(os.tmpdir(),'falalivre-arasaac-review');fs.mkdirSync(screenshots,{recursive:true})
  const capture=async name=>{await A.evaluate('document.querySelector("main").scrollIntoView()');const s=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:65});fs.writeFileSync(path.join(screenshots,name+'.jpg'),Buffer.from(s.data,'base64'))}
  const checkAbsence=async selector=>{
    assert.equal(await A.evaluate(`document.querySelector(${JSON.stringify(selector)}).textContent.trim()`),'Sem imagem')
    assert.equal(await A.evaluate(`document.querySelector(${JSON.stringify(selector)}).querySelectorAll('img').length`),0)
    for(const width of [320,390,768,1366])for(const large of [false,true])for(const zoom of [1,1.25]){
      await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false})
      await A.evaluate(`document.documentElement.dataset.elementSize='${large?'large':'normal'}';document.documentElement.style.zoom=${zoom}`)
      assert.ok(await A.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'))
      assert.ok(await A.evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});return e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1})()`),'absence label fits '+selector)
    }
    await A.evaluate("document.documentElement.dataset.elementSize='normal';document.documentElement.style.zoom=1")
    await A.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:false})
  }
  const seen=[]
  for(let level=0;level<3;level++){
    await A.evaluate('document.querySelectorAll(".belongs-level")['+level+'].click()');await pause(100)
    for(let count=0;count<levels[level].rounds.length;count++){
      const id=await A.evaluate('document.querySelector(".belongs-play").dataset.round')
      const round=levels[level].rounds.find(r=>r.id===id)
      if(id==='comida'){await checkAbsence('.belongs-object .belongs-visual--unavailable');await capture('comida-sem-imagem')}
      if(level===2&&round.correctDestination==='pote-materiais'){await checkAbsence('[data-destination="pote-materiais"] .belongs-visual--unavailable');await capture('pote-sem-imagem')}
      if(level===2){
        for(const [selector,item] of [['.belongs-object',round],...levels[level].destinations.filter(d=>[2386,3233,3286].includes(d.arasaacId)).map(d=>['[data-destination="'+d.id+'"]',d])]){
          if(item.arasaacId && await A.evaluate('!!document.querySelector('+JSON.stringify(selector)+')')){
            const actual=await A.evaluate('document.querySelector('+JSON.stringify(selector)+').querySelector("img").getAttribute("src")')
            assert.equal(actual,item.image);seen.push(item.arasaacId)
          }
        }
        if(['livro-escola','papel','mochila'].includes(id))await capture(id)
      }
      await click('.belongs-object');await click('[data-destination="'+round.correctDestination+'"]')
      assert.equal(await A.evaluate('document.querySelector(".belongs-object").dataset.placed'),'true')
      await click('.belongs-controls button')
    }
    assert.ok(await A.evaluate('!!document.querySelector(".belongs-success")'))
  }
  assert.deepEqual([...new Set(seen)].sort((a,b)=>a-b),[2386,2450,3233,3286,8349])
  await A.evaluate("location.hash='/jogar/sequencias'");await pause(100)
  const sequenceLevels=await A.evaluate("(async()=>{const m=await import('/src/data/sequenceGameLevels.js');return m.sequenceGameLevels})()")
  const sequenceSeen=[]
  for(const [level, catalog] of sequenceLevels.entries()){
  await A.evaluate('document.querySelectorAll(".sequence-level")['+level+'].click()');await pause(100)
  const activities=catalog.activities
  for(const activity of activities){
    for(const step of activity.steps.filter(item=>['molhar-maos','enxaguar','colocar-pijama','se-arrumar','chegar-escola'].includes(item.id))){
      const selector=await A.evaluate('Array.from(document.querySelectorAll(".sequence-select")).findIndex(b=>b.querySelector("strong").textContent==='+JSON.stringify(step.word)+')')
      await checkAbsence('.sequence-slot:nth-child('+(selector+1)+') .sequence-visual--unavailable');await capture(step.id+'-sem-imagem')
    }
    for(const [position,step] of activity.steps.entries()){
      if(step.arasaacId){
        const actual=await A.evaluate('Array.from(document.querySelectorAll(".sequence-select")).find(b=>b.querySelector("strong").textContent==='+JSON.stringify(step.word)+').querySelector("img").getAttribute("src")')
        assert.equal(actual,step.image);sequenceSeen.push(step.arasaacId)
      }
      await A.evaluate('Array.from(document.querySelectorAll(".sequence-select")).find(b=>b.querySelector("strong").textContent==='+JSON.stringify(step.word)+').click()');await pause(50)
      await A.evaluate('document.querySelectorAll(".sequence-position")['+position+'].click()');await pause(50)
    }
    if(activity.id==='preparar-dormir-escola'){
      const image=await A.evaluate('Array.from(document.querySelectorAll(".sequence-select")).find(b=>b.textContent.includes("GUARDAR BRINQUEDOS")).querySelector("img").getAttribute("src")')
      assert.ok(image.endsWith('/guardar-brinquedos.png'));await capture('guardar-brinquedos')
    }
    if(['calcar-sapato','hora-comer','voltando-casa'].includes(activity.id))await capture(activity.id)
    await click('.sequence-controls button');assert.ok(await A.evaluate('!!document.querySelector(".sequence-play--complete")'))
    await click('.sequence-controls button')
  }
  assert.ok(await A.evaluate('!!document.querySelector(".sequence-success")'))
  }
  assert.deepEqual([...new Set(sequenceSeen)].sort((a,b)=>a-b),[2371,8680,36628,37896,37934,38944])
  await A.evaluate("location.hash='/jogar/quebra-cabeca'");await pause(100)
  for(let level=0;level<3;level++){
    await click('.puzzle-levels button:nth-child('+(level+1)+')')
    await A.evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Preciso de ajuda').click()");await pause(50)
    assert.equal(await A.evaluate("getComputedStyle(document.querySelector('.puzzle-slot--hint'),'::after').pointerEvents"),'none')
    const count=await A.evaluate('document.querySelectorAll(".puzzle-board [data-slot]").length')
    // Help already places the first piece; the remaining pieces stay in the tray.
    for(let piece=1;piece<count;piece++){await click('[aria-label="Selecionar peça '+(piece+1)+'"]');await click('[data-slot="'+piece+'"]')}
    assert.ok(await A.evaluate('!!document.querySelector(".puzzle-success")'))
    assert.ok(await A.evaluate("Array.from(document.querySelectorAll('.puzzle-board .puzzle-badge')).every(e=>getComputedStyle(e).display==='none')"))
    await capture('puzzle-'+level+'-concluido')
  }
  assert.deepEqual(await A.evaluate('Array.from(document.images).filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)'),[])
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
  console.log('PASS: eleven approved PNGs rendered, six school associations and affected legacy sequences selected/completed; no console errors/warnings. Screenshots: '+screenshots)
} finally {
  for(const socket of sockets)socket.close();chrome.kill();await server.close();await pause(500)
  const resolved=path.resolve(profile)
  if(path.dirname(resolved)!==tempRoot||!path.basename(resolved).startsWith('falalivre-audit-'))throw Error('unsafe temporary path')
  try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:200})}catch{console.log('Temporary Chrome profile remains: '+resolved)}
}
