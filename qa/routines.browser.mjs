import assert from 'node:assert/strict'
import http from 'node:http'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { routines, loadCatalog } from './routines.test.mjs'
const routinesOnly = process.argv.includes('--routines-only')

const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'}
const root = path.resolve('dist')
const server = http.createServer((req,res)=>{
  const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]))
  if (!file.startsWith(root+path.sep) || !fs.existsSync(file)) { res.writeHead(404).end(); return }
  res.setHeader('Content-Type',mime[path.extname(file)]??'application/octet-stream')
  res.end(fs.readFileSync(file))
})
await new Promise(resolve=>server.listen(4183,'127.0.0.1',resolve))
const profile = fs.mkdtempSync(path.join(os.tmpdir(),'falalivre-routines-qa-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',[
  '--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',
  '--remote-debugging-port=9333',`--user-data-dir=${profile}`,'about:blank',
],{stdio:'ignore',windowsHide:true})
const pause = ms=>new Promise(resolve=>setTimeout(resolve,ms))
let socket
try {
  let targets
  for(let i=0;i<100;i++) {
    try { targets=await (await fetch('http://127.0.0.1:9333/json/list')).json(); break } catch {await pause(100)}
  }
  assert.ok(targets,'Chrome debugging endpoint')
  socket = new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl)
  await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}))
  let seq=0
  const pending = new Map()
  const errors = []
  socket.addEventListener('message',event=>{
    const message=JSON.parse(event.data)
    if(message.method==='Runtime.exceptionThrown') errors.push(message.params.exceptionDetails)
    if(message.id) {
      const job=pending.get(message.id)
      pending.delete(message.id)
      if(message.error) job.reject(Error(JSON.stringify(message.error)))
      else job.resolve(message.result)
    }
  })
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++seq; pending.set(id,{resolve,reject}); socket.send(JSON.stringify({id,method,params}))
  })
  const evaluate=async expression=>{
    const result=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true})
    if(result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  const wait=async expression=>{
    for(let i=0;i<100;i++){if(await evaluate(`Boolean(${expression})`))return; await pause(30)}
    throw Error('Timeout: '+expression)
  }
  const navigate=async route=>{
    await evaluate(`location.hash=${JSON.stringify(route)}`)
    await pause(80)
  }
  const order=()=>evaluate(`[...document.querySelectorAll('.sequence-select strong')].map(el=>el.textContent)`)
  const click=async selector=>{await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.focus();el.click()})()`); await pause(30)}
  const press=async key=>{
    await cdp('Input.dispatchKeyEvent',{type:'keyDown',key,text:key==='Enter'?'\r':key===' '?' ':undefined,code:key===' '?'Space':key,windowsVirtualKeyCode:key==='Enter'?13:key==='Escape'?27:32})
    await cdp('Input.dispatchKeyEvent',{type:'keyUp',key,code:key===' '?'Space':key,windowsVirtualKeyCode:key==='Enter'?13:key==='Escape'?27:32})
    await pause(30)
  }
  const key='falaLivre_contentRotation_v1'
  await cdp('Runtime.enable'); await cdp('Page.enable')
  await cdp('Emulation.setDeviceMetricsOverride',{width:1366,height:1000,deviceScaleFactor:1,mobile:false})
  await cdp('Page.navigate',{url:'http://127.0.0.1:4183/#/aprender/meu-dia-a-dia/rotinas'})
  await wait(`document.querySelector('.sequence-grid')`)
  await evaluate(`window.__audioCalls=0; speechSynthesis.speak=()=>{window.__audioCalls++}`)
  const saved=()=>evaluate(`JSON.parse(localStorage.getItem('${key}'))`)
  const initial=await saved()
  const currentId=initial.modules.myDayRoutines.order[0]
  assert.equal(initial.modules.myDayCommunication,undefined)
  assert.equal(initial.modules.myDayEmotions,undefined)
  assert.equal(await evaluate(`document.querySelectorAll('.sequence-level').length`),0)
  assert.equal(await evaluate(`!!document.querySelector('.sequence-round')`),false)
  const initialOrder=await order()
  await click('.sequence-controls button:nth-child(2)')
  assert.deepEqual(await order(),initialOrder)
  assert.match(await evaluate(`document.querySelector('#sequence-hint').textContent`),/vem antes de/)
  await click('.sequence-controls button:nth-child(1)')
  assert.deepEqual(await order(),initialOrder)
  assert.match(await evaluate(`document.querySelector('.sequence-feedback').textContent`),/Quase/)
  assert.deepEqual(await saved(),initial)
  await click('.sequence-audio')
  assert.equal(await evaluate('window.__audioCalls'),1)
  assert.deepEqual(await saved(),initial)
  await click('.sequence-select')
  await press('Escape')
  assert.equal(await evaluate(`document.querySelectorAll('.sequence-select[aria-pressed="true"]').length`),0)
  assert.equal(await evaluate(`document.activeElement.className`),'sequence-select')
  await navigate('/aprender/meu-dia-a-dia')
  assert.equal(await evaluate(`document.querySelectorAll('.my-day-option').length`),3)
  await navigate('/aprender/meu-dia-a-dia/rotinas')
  assert.deepEqual(await saved(),initial)
  await cdp('Page.reload')
  await wait(`document.querySelector('.sequence-grid')`)
  assert.deepEqual(await saved(),initial)
  await evaluate(`window.__audioCalls=0; speechSynthesis.speak=()=>{window.__audioCalls++}`)

  // Public routine cards use selection + position, with no drag handle in the DOM.
  const mouseClick=async selector=>{
    const coords=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}})()`)
    await cdp('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...coords})
    await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...coords}); await pause(40)
  }
  assert.equal(await evaluate(`document.querySelectorAll('.sequence-handle').length`),0)
  assert.equal(await evaluate(`document.querySelector('.sequence-grid').textContent.includes('≡')`),false)
  const before=await order()
  await mouseClick('.sequence-select'); await press('Escape')
  assert.deepEqual(await order(),before)
  await mouseClick('.sequence-select'); await mouseClick('[data-position="1"] .sequence-position')
  const swapped=[...before]; [swapped[0],swapped[1]]=[swapped[1],swapped[0]]
  assert.deepEqual(await order(),swapped)
  assert.equal(await evaluate(`!!document.querySelector('.sequence-drag')`),false)

  // Touch is browser emulation, not a physical touch/stylus test.
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1})
  const point=await evaluate(`(()=>{const r=document.querySelector('.sequence-select').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`)
  await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,radiusX:1,radiusY:1,force:1,id:1}]})
  await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
  await pause(40)
  assert.equal(await evaluate(`document.querySelector('.sequence-select').getAttribute('aria-pressed')`),'true')
  await evaluate(`document.querySelector('.sequence-select').focus()`)
  await press('Escape')
  assert.equal(await evaluate(`document.querySelectorAll('.sequence-select[aria-pressed="true"]').length`),0)
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:false})

  const solve=async routine=>{
    const target=routine.steps.map(s=>s.word)
    for(let i=0;i<target.length;i++) {
      const current=await order()
      const source=current.indexOf(target[i])
      if(source===i)continue
      await evaluate(`document.querySelectorAll('.sequence-select')[${source}].focus()`)
      await pause(80)
      assert.equal(await evaluate(`document.activeElement.querySelector('strong')?.textContent`),target[i],`keyboard focus ${routine.id} ${i}`)
      await press('Enter')
      assert.equal(await evaluate(`document.querySelector('.sequence-select[aria-pressed="true"] strong')?.textContent`),target[i],`keyboard selection ${routine.id} ${i}`)
      await evaluate(`document.querySelectorAll('.sequence-position')[${i}].focus()`)
      await press('Enter')
      assert.equal((await order())[i],target[i],`keyboard swap ${routine.id} ${i}`)
    }
    assert.deepEqual(await order(),target)
    await click('.sequence-controls button:first-child')
    assert.match(await evaluate(`document.querySelector('.sequence-feedback').textContent`),/Muito bem/)
    assert.equal(await evaluate(`document.activeElement.textContent`),'Próxima rotina')
  }
  const cycles=[[],[]]
  for(let i=0;i<16;i++) {
    const state=(await saved()).modules.myDayRoutines
    const id=state.order[state.currentIndex]
    cycles[Math.floor(i/8)].push(id)
    await solve(routines.find(r=>r.id===id))
    const snapshot=await saved()
    assert.equal(snapshot.modules.myDayRoutines.currentIndex,i%8)
    // Two calls in the same turn must advance once.
    await evaluate(`(()=>{const button=document.querySelector('.sequence-controls button');button.click();button.click()})()`)
    await pause(40)
    const next=(await saved()).modules.myDayRoutines
    assert.equal(next.currentIndex,(i+1)%8)
    assert.equal(next.cycle,1+Math.floor((i+1)/8))
    assert.notEqual(next.order[next.currentIndex],id)
    assert.equal(await evaluate(`document.activeElement.id`),'sequence-title')
    assert.equal(await evaluate(`document.querySelectorAll('.sequence-select:disabled').length`),0)
  }
  for(const cycle of cycles)assert.equal(new Set(cycle).size,8)
  assert.equal(cycles[0][0],currentId)
  assert.equal(await evaluate('window.__audioCalls'),0)
  console.log('Browser routines: no handles, help, retry, audio, Escape, mouse/touch selection, keyboard ordering, focus, refresh, double advance, two cycles PASS')

  // Seed each routine for layout checks without disturbing previous module states.
  const layout=[]
  for(const width of [320,360,390,430,768,1024,1366]) {
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false})
    for(const routine of routines) {
      await navigate('/aprender/meu-dia-a-dia')
      await evaluate(`(()=>{const data=JSON.parse(localStorage.getItem('${key}')); data.modules.myDayRoutines={order:${JSON.stringify([routine.id,...routines.filter(r=>r.id!==routine.id).map(r=>r.id)])},currentIndex:0,cycle:1,lastThemeId:null};localStorage.setItem('${key}',JSON.stringify(data))})()`)
      await navigate('/aprender/meu-dia-a-dia/rotinas')
      await wait(`document.querySelector('#sequence-title')?.textContent===${JSON.stringify(routine.title)}`)
      assert.equal(await evaluate(`document.querySelectorAll('.sequence-handle').length`),0)
      if (routine.id === 'preparar-dormir') {
        assert.ok(await evaluate(`(()=>{const card=[...document.querySelectorAll('.sequence-card')].find(c=>c.textContent.includes('COLOCAR PIJAMA'));return !!card&&!card.textContent.includes('Sem imagem')&&!!card.querySelector('img')})()`))
        assert.equal(await evaluate(`document.querySelector('.sequence-grid').textContent.includes('VESTIR CAMISETA')`),false)
        assert.equal(await evaluate(`document.querySelectorAll('.sequence-position').length`),4)
      }
      for(const size of ['normal','large']) {
        await evaluate(`document.documentElement.dataset.elementSize='${size}'`)
        const metrics=await evaluate(`(()=>{const buttons=[...document.querySelectorAll('.sequence-grid button')];const rects=buttons.map(b=>b.getBoundingClientRect());const overlap=rects.some((a,i)=>rects.slice(i+1).some(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1));return {overflow:document.documentElement.scrollWidth>innerWidth,overlap,images:[...document.querySelectorAll('.sequence-grid img')].every(i=>i.complete&&i.naturalWidth>0),text:[...document.querySelectorAll('.sequence-select strong')].every(el=>el.scrollWidth<=el.clientWidth+1)}})()`)
        assert.deepEqual(metrics,{overflow:false,overlap:false,images:true,text:true},`${width}px ${routine.id} ${size}`)
      }
    }
    layout.push(`${width}px: eight routines, Normal/Grande PASS`)
  }
  console.log(layout.join('\n'))
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:false})
  await navigate('/aprender/meu-dia-a-dia')
  await evaluate(`(()=>{const data=JSON.parse(localStorage.getItem('${key}'));data.modules.myDayRoutines={order:${JSON.stringify(['preparar-dormir',...routines.filter(r=>r.id!=='preparar-dormir').map(r=>r.id)])},currentIndex:0,cycle:1,lastThemeId:null};localStorage.setItem('${key}',JSON.stringify(data))})()`)
  await evaluate(`document.documentElement.dataset.elementSize='normal'`)
  await navigate('/aprender/meu-dia-a-dia/rotinas')
  await wait(`document.querySelector('#sequence-title')?.textContent==='Preparar-se para dormir.'`)
  await evaluate(`speechSynthesis.speak=utterance=>{window.__routineSpeech=utterance.text}`)
  await click('.sequence-audio[aria-label="Ouvir COLOCAR PIJAMA"]')
  assert.equal(await evaluate('window.__routineSpeech'), 'Colocar pijama')
  await evaluate('window.scrollTo(0,0)')
  const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true})
  fs.writeFileSync(path.join(os.tmpdir(),'falalivre-routines-390.png'),Buffer.from(shot.data,'base64'))
  if (!routinesOnly) {
  await navigate('/aprender')
  assert.equal(await evaluate(`document.querySelectorAll('.learning-card').length`),4)
  await navigate('/jogar')
  assert.equal(await evaluate(`document.querySelectorAll('.game-card').length`),6)
  const games=await evaluate(`[...document.querySelectorAll('button,a')].map(b=>b.textContent).join(' ')`)
  assert.ok(!games.includes('Sequências'))
  assert.ok(!games.includes('Bingo'))
  await navigate('/jogar/sequencias')
  assert.equal(await evaluate(`document.querySelectorAll('.sequence-level').length`),3)
  const legacy=await loadCatalog('src/data/sequenceGameLevels.js','sequenceGameLevels')
  for(let index=0;index<3;index++) {
    await click(`.sequence-level:nth-child(${index+1})`)
    for(const activity of legacy[index].activities) {
      assert.equal(await evaluate(`document.querySelector('#sequence-title').textContent`),activity.title)
      await solveLegacy(activity)
      await click('.sequence-controls button')
    }
    assert.ok(await evaluate(`!!document.querySelector('.sequence-success')`))
  }
  async function solveLegacy(activity) {
    for(let i=0;i<activity.steps.length;i++) {
      const words=await order(); const source=words.indexOf(activity.steps[i].word)
      if(source===i)continue
      await click(`.sequence-slot:nth-child(${source+1}) .sequence-select`)
      await click(`.sequence-slot:nth-child(${i+1}) .sequence-position`)
    }
    await click('.sequence-controls button:first-child')
    assert.match(await evaluate(`document.querySelector('.sequence-feedback').textContent`),/Muito bem/)
    assert.equal(await evaluate(`document.activeElement.textContent`),'Próxima sequência')
  }
  const oldModules = ['communication','wordsAndPhrases','writing','dailySituations']
  for(const route of ['/aprender/comunicar','/aprender/palavras-frases','/aprender/escrever','/aprender/situacoes']) {
    await navigate(route)
    assert.ok(await evaluate(`document.querySelector('main button')`+' !== null'))
  }
  const beforeModules=await saved()
  for(const module of oldModules) assert.ok(beforeModules.modules[module])
  await navigate('/aprender/meu-dia-a-dia/comunicacao')
  assert.ok(await evaluate(`document.querySelector('[data-situation]') !== null`))
  const communicationModules=await saved()
  assert.equal(communicationModules.modules.myDayCommunication.order.length,10)
  assert.equal(communicationModules.modules.myDayCommunication.currentIndex,0)
  assert.equal(communicationModules.modules.myDayCommunication.cycle,1)
  for(const module of Object.keys(beforeModules.modules)) assert.deepEqual(communicationModules.modules[module],beforeModules.modules[module])
  await navigate('/aprender/meu-dia-a-dia/emocoes')
  assert.ok(await evaluate(`document.querySelector('[aria-label="Abrir Conhecer emoções"]') !== null`))
  assert.deepEqual(await saved(),communicationModules,'Emotions menu does not initialize exploration rotation')
  await click('[aria-label="Abrir Conhecer emoções"]')
  const allModules=await saved()
  assert.equal(allModules.modules.myDayEmotions.order.length,6)
  assert.equal(allModules.modules.myDayEmotions.currentIndex,0)
  assert.equal(allModules.modules.myDayEmotions.cycle,1)
  for(const module of Object.keys(communicationModules.modules)) assert.deepEqual(allModules.modules[module],communicationModules.modules[module])
  await navigate('/aprender/meu-dia-a-dia/comunicacao')
  assert.deepEqual(await saved(),allModules,'Returning to communication does not advance rotation')
  await navigate('/aprender/meu-dia-a-dia/rotinas')
  const active=(await saved()).modules.myDayRoutines
  await solve(routines.find(r=>r.id===active.order[active.currentIndex]))
  await click('.sequence-controls button')
  const afterModules=await saved()
  for(const module of Object.keys(allModules.modules).filter(module=>module!=='myDayRoutines')) assert.deepEqual(afterModules.modules[module],allModules.modules[module])
  assert.equal(errors.length,0,JSON.stringify(errors))
  console.log('Menus, all nine legacy activities, seven independent module rotations, current My Day communication/emotions initialization, no browser runtime errors PASS')
  }
  assert.equal(errors.length,0,JSON.stringify(errors))
} finally {
  socket?.close()
  chrome.kill()
  server.close()
}
