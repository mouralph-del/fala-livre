import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Audit-only harness. Native storage below belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4205, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-dynamic-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9355', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
  for(let i=0;i<100;i++){try{targets=await(await fetch('http://127.0.0.1:9355/json/list')).json();if(targets.some(t=>t.type==='page'))break}catch{}await pause(100)}
  const A=await connect(targets.find(t=>t.type==='page'))
  await A.cdp('Page.navigate',{url:'http://127.0.0.1:4205/__audit#/'});await ready(A)
  const route=async hash=>{await A.evaluate('location.hash='+JSON.stringify(hash));await pause(50)}
  const screenshots=path.join(os.tmpdir(),'falalivre-dynamic-review');fs.mkdirSync(screenshots,{recursive:true})
  const routes=[['home','/'],['learn','/aprender'],['games','/jogar'],['communication','/aprender/comunicar'],['settings','/perfil'],['guidance','/responsaveis'],['words','/aprender/palavras-frases'],['writing','/aprender/escrever'],['notebook','/aprender/escrever/caderno'],['my-day','/aprender/meu-dia-a-dia'],['routines','/aprender/meu-dia-a-dia/rotinas'],['daily-communication','/aprender/meu-dia-a-dia/comunicacao'],['emotions','/aprender/meu-dia-a-dia/emocoes'],['progress','/meu-progresso'],['scenes','/jogar/situacoes-interativas']]
  for(const width of [320,360,390,430,768,1024,1366,1440]){
    await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false})
    for(const large of [false,true])for(const zoom of [1,1.25]){
      await A.evaluate(`document.documentElement.dataset.elementSize='${large?'large':'normal'}';document.documentElement.dataset.reduceMotion='true';document.documentElement.style.zoom=${zoom}`)
      for(const [name,hash] of routes){
        await route(hash)
        const ornaments=await A.evaluate(`(()=>{const layer=document.querySelector('.home-decoration');return {hidden:layer.getAttribute('aria-hidden'),pointer:getComputedStyle(layer).pointerEvents,focusable:layer.querySelectorAll('a,button,input,select,[tabindex]').length,motifs:Array.from(layer.querySelectorAll('.decor-motif'),e=>({display:getComputedStyle(e).display,pointer:getComputedStyle(e).pointerEvents,animation:getComputedStyle(e).animationName}))}})()`)
        assert.equal(ornaments.hidden,'true');assert.equal(ornaments.pointer,'none');assert.equal(ornaments.focusable,0)
        assert.equal(ornaments.motifs.length,4)
        assert.ok(ornaments.motifs.every(item=>item.pointer==='none'&&item.animation==='none'))
        const visibleMotifs=name==='home'&&width>700?[0,1,2,3]:width>=1024&&['learn','my-day'].includes(name)?[0,2]:width>=1024&&name==='games'?[1]:[]
        ornaments.motifs.forEach((item,index)=>assert.equal(item.display,visibleMotifs.includes(index)?'block':'none'))
        const size=await A.evaluate('({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})')
        assert.ok(size.scroll<=size.client+1,JSON.stringify({name,width,large,zoom,size}))
        assert.deepEqual(await A.evaluate('Array.from(document.images).filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)'),[])
        assert.equal(await A.evaluate('document.querySelectorAll(".header-navigation a").length'),2)
        const logo=await A.evaluate(`(()=>{const image=document.querySelector('.brand-logo'),r=image.getBoundingClientRect(),header=document.querySelector('.header-content').getBoundingClientRect(),nav=document.querySelector('.header-navigation').getBoundingClientRect();return {alt:image.alt,count:document.querySelectorAll('.brand-logo').length,old:document.querySelectorAll('.brand-copy,.brand-mark').length,ratio:r.width/r.height,natural:image.naturalWidth/image.naturalHeight,fit:getComputedStyle(image).objectFit,inside:r.left>=header.left-1&&r.right<=header.right+1&&r.top>=header.top-1&&r.bottom<=header.bottom+1,overlap:r.left<nav.right-1&&r.right>nav.left+1&&r.top<nav.bottom-1&&r.bottom>nav.top+1}})()`)
        assert.equal(logo.alt,'Fala Livre — Comunicar, Aprender e Conectar');assert.equal(logo.count,1);assert.equal(logo.old,0)
        assert.ok(Math.abs(logo.ratio-logo.natural)<.02);assert.equal(logo.fit,'contain');assert.equal(logo.inside,true);assert.equal(logo.overlap,false)
        const overlaps=await A.evaluate(`(()=>{const cards=Array.from(document.querySelectorAll('.activity-card'));return cards.some(c=>{const a=c.querySelector('img').getBoundingClientRect(),b=c.querySelector('.activity-content').getBoundingClientRect();return a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1})})()`)
        assert.equal(overlaps,false,JSON.stringify({name,width,large,zoom}))
        for(const selector of ['.start-button','.learning-start','.game-start','.header-navigation a']){
          const heights=await A.evaluate(`Array.from(document.querySelectorAll(${JSON.stringify(selector)}),e=>e.getBoundingClientRect().height/${zoom})`)
          assert.ok(heights.every(h=>h>=(large?55:47)),JSON.stringify({selector,width,large,zoom,heights}))
        }
        if(zoom===1 && (!large || [320,390,768,1440].includes(width))){
          const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:60,captureBeyondViewport:true});fs.writeFileSync(path.join(screenshots,`${name}-${width}${large?'-large':''}.jpg`),Buffer.from(shot.data,'base64'))
        }
      }
    }
  }
  await A.evaluate("document.documentElement.style.zoom=1;document.documentElement.dataset.elementSize='normal'")
  await route('/');assert.equal(await A.evaluate('document.querySelectorAll(".activity-card").length'),2)
  await A.evaluate('document.querySelector(".start-button").focus()');await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9})
  assert.equal(await A.evaluate('document.activeElement.getAttribute("aria-label")'),'Começar a jogar')
  assert.equal(await A.evaluate('getComputedStyle(document.activeElement).outlineStyle'),'solid')
  assert.equal(await A.evaluate('getComputedStyle(document.activeElement).transitionDuration'),'0s')
  await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await pause(100)
  assert.equal(await A.evaluate('location.hash'),'#/jogar');assert.equal(await A.evaluate('document.querySelectorAll(".game-card").length'),6)
  await route('/aprender');assert.equal(await A.evaluate('document.querySelectorAll(".learning-card").length'),4)
  await A.evaluate('document.querySelector(".learning-start").focus()');await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9})
  assert.equal(await A.evaluate('getComputedStyle(document.activeElement.closest(".learning-card")).outlineStyle'),'solid')
  await route('/jogar/situacoes-interativas')
  await A.evaluate('document.querySelector(".interactive-level-card").click()');await pause(100)
  for(const scene of ['situacao-refeicao.png','situacao-brincar.png','situacao-descanso.png']){
    assert.ok(await A.evaluate(`document.querySelector('.interactive-scene img').src.endsWith(${JSON.stringify(scene)})`),'existing context '+scene)
    assert.equal(await A.evaluate('getComputedStyle(document.querySelector(".interactive-scene img")).objectFit'),'contain')
    for(const width of [390,1440]){
      await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await pause(100)
      assert.ok(await A.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'))
      const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:65,captureBeyondViewport:true});fs.writeFileSync(path.join(screenshots,scene.replace('.png','')+'-'+width+'.jpg'),Buffer.from(shot.data,'base64'))
    }
    const labels=await A.evaluate("(async()=>{const {interactiveSituations}=await import('/src/data/interactiveSituations.js');const id=document.querySelector('.interactive-game').dataset.situation,situation=interactiveSituations[0].situations.find(item=>item.id===id);return situation.expectedTokens.map(token=>situation.options.find(item=>item.id===token).word)})()")
    for(const label of labels){await A.evaluate(`Array.from(document.querySelectorAll('.interactive-select')).find(button=>button.getAttribute('aria-label')===${JSON.stringify('Selecionar '+label)}).click()`);await pause(40)}
    await A.evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Confirmar frase').click()");await pause(50)
    await A.evaluate("document.querySelector('.interactive-response .interactive-controls button').click()");await pause(100)
  }
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
  console.log('PASS 8 widths, Normal/Grande, 125% zoom, '+routes.length+' affected screens, noninteractive aria-hidden decorations hidden on mobile/activity screens, no overflow/image-text overlap, 48/56px targets, keyboard/focus, reduced motion, four learning routes and six games. Screenshots: '+screenshots)

} finally {
  for(const socket of sockets)socket.close();chrome.kill();await server.close();await pause(500)
  const resolved=path.resolve(profile)
  if(path.dirname(resolved)!==tempRoot||!path.basename(resolved).startsWith('falalivre-dynamic-'))throw Error('unsafe temporary path')
  try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:200})}catch{console.log('Temporary Chrome profile remains: '+resolved)}
}
