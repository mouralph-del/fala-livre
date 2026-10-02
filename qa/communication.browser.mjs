import assert from 'node:assert/strict'
import http from 'node:http'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { situations, loadData } from './communication.test.mjs'

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
  const route='/aprender/meu-dia-a-dia/comunicacao'
  const saved=()=>evaluate(`JSON.parse(localStorage.getItem('${key}'))`)
  const current=()=>evaluate(`document.querySelector('[data-situation]')?.dataset.situation`)
  const phrase=()=>evaluate(`[...document.querySelectorAll('.interactive-slot strong')].map(el=>el.textContent)`)
  const button=async text=>{await evaluate(`(()=>{const b=[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b||b.disabled)throw Error('Unavailable button: '+${JSON.stringify(text)});b.focus();b.click()})()`);await pause(30)}
  const select=async id=>{
    const s=situations.find(s=>s.id===awaitId)
    await click(`[aria-label="Selecionar ${s.options.find(o=>o.id===id).word}"]`)
  }
  let awaitId
  const seed=async id=>{
    await navigate('/aprender/meu-dia-a-dia')
    await evaluate(`(()=>{const d=JSON.parse(localStorage.getItem('${key}'));d.modules.myDayCommunication={order:${JSON.stringify([id,...situations.filter(s=>s.id!==id).map(s=>s.id)])},currentIndex:0,cycle:1,lastThemeId:null};localStorage.setItem('${key}',JSON.stringify(d))})()`)
    await navigate(route);await wait(`document.querySelector('[data-situation]')?.dataset.situation===${JSON.stringify(id)}`);awaitId=id
  }
  const solve=async tokens=>{for(const id of tokens)await select(id);await button('Conferir frase');assert.ok(await evaluate(`document.querySelector('.interactive-response')`+' !== null'))}
  const instrument=()=>evaluate(`window.__spoken=[];window.__cancels=0;speechSynthesis.speak=u=>{window.__spoken.push({text:u.text,lang:u.lang,voice:u.voice?.name})};speechSynthesis.cancel=()=>window.__cancels++`)
  await cdp('Runtime.enable');await cdp('Page.enable')
  await cdp('Emulation.setDeviceMetricsOverride',{width:1366,height:1600,deviceScaleFactor:1,mobile:false})
  await cdp('Page.navigate',{url:'http://127.0.0.1:4183/#'+route})
  await wait(`document.querySelector('[data-situation]')`)
  await instrument();awaitId=await current()
  const initial=await saved()
  assert.equal(await evaluate(`document.querySelectorAll('.interactive-level-switcher,.interactive-menu-card').length`),0)
  assert.equal(await evaluate(`document.querySelector('[aria-label^="Ouvir frase"]').disabled`),true)
  await button('Preciso de ajuda');const first=await evaluate(`document.querySelector('.interactive-hint-status').textContent`)
  await button('Preciso de ajuda');assert.match(await evaluate(`document.querySelector('.interactive-hint-status').textContent`),/posição 1/)
  assert.ok(first.startsWith('Pense'));assert.deepEqual(await phrase(),[]);assert.deepEqual(await saved(),initial)
  await select('eu');await select('quero');await click('[aria-label^="Ouvir frase"]')
  assert.equal(await evaluate(`window.__spoken.at(-1).text`),'Eu quero.')
  assert.equal(await evaluate(`window.__spoken.at(-1).lang`),'pt-BR')
  await button('Limpar frase')
  await navigate('/aprender/meu-dia-a-dia');await navigate(route);assert.deepEqual(await saved(),initial)
  await cdp('Page.reload');await wait(`document.querySelector('[data-situation]')`);assert.deepEqual(await saved(),initial);assert.deepEqual(await phrase(),[])
  await instrument()
  // Twenty approved variants exercised in the actual UI, including empty optional slots.
  for(const s of situations)for(const variant of s.alternatives){
    await seed(s.id);await solve(variant.tokens)
    await click('[aria-label^="Ouvir frase"]');assert.equal(await evaluate(`window.__spoken.at(-1).text`),variant.speech)
    assert.equal(await evaluate(`document.activeElement.getAttribute('aria-label')?.startsWith('Ouvir frase')`),true)
  }
  await seed('agua');const untouched=await saved()
  await select('eu');await select('quero');await select('comer')
  await click('[aria-label^="Ouvir frase"]');assert.equal(await evaluate(`window.__spoken.at(-1).text`),'Eu quero comer.')
  await button('Conferir frase');assert.match(await evaluate(`document.querySelector('.interactive-retry').textContent`),/Quase/);assert.equal((await phrase()).length,3)
  await click('.interactive-slot:nth-child(1)')
  await press('Escape');assert.equal(await evaluate(`document.querySelectorAll('.interactive-slot[aria-pressed="true"]').length`),0)
  await click('[data-slot="2"] .interactive-slot');await select('agua')
  await click('[data-slot="1"] .interactive-remove');await click('[aria-label^="Ouvir frase"]')
  assert.equal(await evaluate(`window.__spoken.at(-1).text`),'Eu água.')
  await click('[data-slot="1"] .interactive-slot');await select('quero')
  await button('Preciso de ajuda');await button('Preciso de ajuda');assert.match(await evaluate(`document.querySelector('.interactive-hint-status').textContent`),/opcional/)
  assert.deepEqual(await saved(),untouched)
  await button('Limpar frase')
  // Actual mouse drag and Escape while pointer capture is active.
  const mouseDrag=async cancel=>{
    await evaluate(`document.querySelector('[aria-label="Arrastar EU"]').scrollIntoView({block:'center'})`)
    const coords=await evaluate(`(()=>{const a=document.querySelector('[aria-label="Arrastar EU"]').getBoundingClientRect(),b=document.querySelector('[data-slot="0"]').getBoundingClientRect();return{x:a.x+a.width/2,y:a.y+a.height/2,dx:b.x+b.width/2,dy:b.y+b.height/2}})()`)
    await cdp('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,x:coords.x,y:coords.y})
    await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:coords.dx,y:coords.dy})
    if(cancel)await press('Escape')
    await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:coords.dx,y:coords.dy});await pause(40)
  }
  await mouseDrag(true);assert.deepEqual(await phrase(),[])
  await mouseDrag(false);assert.deepEqual(await phrase(),['EU'])
  await button('Limpar frase')
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1})
  await evaluate(`document.querySelector('[aria-label="Selecionar EU"]').scrollIntoView({block:'center'})`)
  const point=await evaluate(`(()=>{const r=document.querySelector('[aria-label="Selecionar EU"]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`)
  await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,radiusX:1,radiusY:1,force:1,id:1}]});await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(40)
  assert.deepEqual(await phrase(),['EU']);await cdp('Emulation.setTouchEmulationEnabled',{enabled:false});await button('Limpar frase')
  await evaluate(`document.querySelector('[aria-label="Selecionar EU"]').focus()`);await press('Enter');assert.deepEqual(await phrase(),['EU'])
  assert.match(await evaluate(`getComputedStyle(document.activeElement).outlineStyle`),/solid/)
  await button('Limpar frase')
  await seed('agua');const cycles=[]
  for(let i=0;i<20;i++){
    awaitId=await current();cycles.push(awaitId)
    const before=await saved();const calls=await evaluate('window.__spoken.length')
    await solve(situations.find(s=>s.id===awaitId).expectedTokens)
    assert.deepEqual(await saved(),before);assert.equal(await evaluate('window.__spoken.length'),calls)
    assert.equal(await evaluate(`document.activeElement.textContent.trim()`),'Próxima situação')
    await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Próxima situação');b.click();b.click()})()`);await pause(40)
    assert.notEqual(await current(),awaitId)
    const after=await saved();assert.equal(after.modules.myDayCommunication.currentIndex,(i+1)%10)
  }
  assert.equal(new Set(cycles.slice(0,10)).size,10);assert.equal(new Set(cycles.slice(10)).size,10);assert.notEqual(cycles[9],cycles[10]);console.log('Two actual UI cycles:',JSON.stringify(cycles))
  // Responsive five-slot refusals and expanded social expressions.
  for(const width of [320,360,390,430,768,1024,1366]){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false})
    await seed('nao-quero-comer')
    for(const id of ['eu','nao','quero','comer','obrigada'])await select(id)
    for(const size of ['normal','large']){
      await evaluate(`document.documentElement.dataset.elementSize=${JSON.stringify(size)}`)
      const metrics=await evaluate(`(()=>{const r=[...document.querySelectorAll('.interactive-slot,.interactive-remove,.interactive-select,.interactive-handle,.interactive-option-audio')].map(e=>e.getBoundingClientRect());return{overflow:document.documentElement.scrollWidth>innerWidth,overlap:r.some((a,i)=>r.slice(i+1).some(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)),images:[...document.querySelectorAll('main img')].every(i=>i.complete&&i.naturalWidth>0)}})()`)
      assert.deepEqual(metrics,{overflow:false,overlap:false,images:true},`${width} ${size}`)
    }
    await navigate('/aprender/comunicar');await click('.communication-social summary')
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false)
    assert.equal(await evaluate(`document.querySelectorAll('.communication-social .communication-select').length`),3)
  }
  console.log('320,360,390,430,768,1024,1366px normal/large: five slots, controls, expanded socials PASS')
  await cdp('Emulation.setDeviceMetricsOverride',{width:1366,height:1600,deviceScaleFactor:1,mobile:false})
  await navigate('/aprender/comunicar');await instrument()
  if(!await evaluate(`document.querySelector('.communication-social').open`))await click('.communication-social summary')
  for(const [label,speech] of [['POR FAVOR','Por favor.'],['OBRIGADO','Obrigado.'],['OBRIGADA','Obrigada.']]){
    await button('Limpar');await click(`.communication-social [aria-label="Selecionar ${label}"]`);await button('Ouvir frase');assert.equal(await evaluate(`window.__spoken.at(-1).text`),speech)
    await click(`.sentence-words [aria-label="Remover ${label}"]`);assert.equal(await evaluate(`document.querySelectorAll('.sentence-words li').length`),0)
  }
  await evaluate(`document.querySelector('.communication-social summary').focus()`);await press('Enter');assert.equal(await evaluate(`document.querySelector('.communication-social').open`),false)
  const {communicationSets}=await loadData('src/data/communicationOptions.js')
  for(const set of communicationSets){
    await navigate('/aprender');await evaluate(`(()=>{const d=JSON.parse(localStorage.getItem('${key}'));d.modules.communication={order:${JSON.stringify([set.id,...communicationSets.filter(s=>s.id!==set.id).map(s=>s.id)])},currentIndex:0,cycle:1,lastThemeId:null};localStorage.setItem('${key}',JSON.stringify(d))})()`);await navigate('/aprender/comunicar')
    assert.equal(await evaluate(`!!document.querySelector('.communication-social')`),true)
    const base=set.tokenIds.slice(0,3)
    if(set.id==='choiceRefusal')continue
    for(const id of base)await click(`.communication-choices [aria-label="Selecionar ${situations[0].options.find(o=>o.id===id).word}"]`)
    assert.equal(await evaluate(`[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()==='Continuar aprendendo').disabled`),false)
    await click('.communication-social summary');await click('.communication-social [aria-label="Selecionar POR FAVOR"]');await button('Ouvir frase');assert.match(await evaluate(`window.__spoken.at(-1).text`),/por favor\.$/)
  }
  // All legacy levels retain original prompts, answers, help and completion.
  const {interactiveSituations}=await loadData('src/data/interactiveSituations.js')
  await navigate('/jogar/situacoes-interativas')
  assert.equal(await evaluate(`document.querySelectorAll('.interactive-level-card').length`),3)
  for(const level of interactiveSituations){
    await evaluate(`(()=>{const b=[...document.querySelectorAll('.interactive-level-card,.interactive-level-button')].find(b=>b.textContent.includes(${JSON.stringify(level.title)}));b.click()})()`);await pause(40)
    for(const s of level.situations){
      assert.equal(await evaluate(`document.querySelector('#interactive-mission').textContent`),s.prompt)
      await button('Preciso de ajuda');assert.match(await evaluate(`document.querySelector('.interactive-hint-status').textContent`),/posição 1/)
      for(const id of s.expectedTokens)await click(`[aria-label="Selecionar ${s.options.find(o=>o.id===id).word}"]`)
      await button('Confirmar frase');assert.ok(await evaluate(`!!document.querySelector('.interactive-response')`))
      await button(s===level.situations.at(-1)?'Concluir nível':'Continuar')
    }
    assert.equal(await evaluate(`document.querySelector('#interactive-complete').textContent`),'Nível concluído!')
  }
  console.log('All 12 legacy activities in three levels PASS')
  const {dailySituations}=await loadData('src/data/dailySituations.js')
  const {learningConcepts}=await loadData('src/data/learningConcepts.js')
  for(const s of dailySituations){
    await navigate('/aprender');await evaluate(`(()=>{const d=JSON.parse(localStorage.getItem('${key}'));d.modules.dailySituations={order:${JSON.stringify([s.id,...dailySituations.filter(x=>x.id!==s.id).map(x=>x.id)])},currentIndex:0,cycle:1,lastThemeId:null};localStorage.setItem('${key}',JSON.stringify(d))})()`);await navigate('/aprender/situacoes')
    assert.equal(await evaluate(`document.querySelector('#situation-title').textContent`),s.situation)
    assert.deepEqual(await evaluate(`[...document.querySelectorAll('.situation-options .communication-select')].map(b=>b.getAttribute('aria-label'))`),s.options.map(id=>'Selecionar '+learningConcepts[id].label))
    await button('Preciso de ajuda');await click(`[aria-label="Selecionar ${learningConcepts[s.correctOptionId].label}"]`);await button('Conferir')
    assert.ok(await evaluate(`!!document.querySelector('.situation-result')`));await button('Próxima situação');assert.equal((await saved()).modules.dailySituations.currentIndex,1)
  }
  const {myDayRoutines}=await loadData('src/data/myDayRoutines.js')
  for(const r of myDayRoutines){
    await navigate('/aprender/meu-dia-a-dia');await evaluate(`(()=>{const d=JSON.parse(localStorage.getItem('${key}'));d.modules.myDayRoutines={order:${JSON.stringify([r.id,...myDayRoutines.filter(x=>x.id!==r.id).map(x=>x.id)])},currentIndex:0,cycle:1,lastThemeId:null};localStorage.setItem('${key}',JSON.stringify(d))})()`);await navigate('/aprender/meu-dia-a-dia/rotinas')
    assert.equal(await evaluate(`document.querySelector('#sequence-title').textContent`),r.title)
    for(let i=0;i<r.steps.length;i++){
      const words=await order(),source=words.indexOf(r.steps[i].word)
      if(source===i)continue
      await click(`.sequence-slot:nth-child(${source+1}) .sequence-select`);await click(`.sequence-slot:nth-child(${i+1}) .sequence-position`)
    }
    await click('.sequence-controls button:first-child');assert.match(await evaluate(`document.querySelector('.sequence-feedback').textContent`),/Muito bem/);await button('Próxima rotina')
  }
  console.log('All nine daily situations: original choices, help, check, advance; all eight routines solved PASS')
  for(const path of ['/aprender/situacoes','/aprender/meu-dia-a-dia/rotinas','/aprender/palavras-frases','/aprender/escrever','/aprender/meu-dia-a-dia/emocoes','/perfil']){await navigate(path);assert.ok(await evaluate(`!!document.querySelector('main')`))}
  const isolation=await saved();await seed('agua');await solve(['eu','quero','agua']);await button('Próxima situação');const after=await saved()
  for(const module of ['communication','wordsAndPhrases','writing','dailySituations','myDayRoutines','myDayEmotions'])assert.deepEqual(after.modules[module],isolation.modules[module])
  await navigate('/aprender');assert.equal(await evaluate(`document.querySelectorAll('.learning-card').length`),4)
  await navigate('/jogar');assert.equal(await evaluate(`document.querySelectorAll('.game-card').length`),6)
  const routes=await evaluate(`[...document.querySelectorAll('.game-start')].map(a=>a.hash.slice(1))`)
  for(const r of routes){await navigate(r);assert.ok(await evaluate(`!!document.querySelector('main button')`))}
  // Test configured voice through instrumented synthesis; no sound is claimed.
  await evaluate(`localStorage.setItem('falalivre.preferences',JSON.stringify({voice:'QA Português',elementSize:'normal'}))`)
  await cdp('Page.addScriptToEvaluateOnNewDocument',{source:`window.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};speechSynthesis.getVoices=()=>[{name:'QA Português',voiceURI:'qa-pt-br',lang:'pt-BR',default:true}];window.__spoken=[];speechSynthesis.speak=u=>window.__spoken.push({text:u.text,lang:u.lang,voice:u.voice?.name});speechSynthesis.cancel=()=>{}`})
  await cdp('Page.navigate',{url:'http://127.0.0.1:4183/#'+route});await cdp('Page.reload');await wait(`speechSynthesis.getVoices()[0]?.name==='QA Português' && document.querySelector('[data-situation]')`)
  assert.equal(await evaluate('window.__spoken.length'),0)
  await click('[aria-label="Ouvir EU"]');assert.deepEqual(await evaluate('window.__spoken.at(-1)'),{text:'Eu',lang:'pt-BR',voice:'QA Português'})
  await evaluate(`window.SpeechSynthesisUtterance=undefined`);await click('[aria-label="Ouvir EU"]');assert.match(await evaluate(`document.querySelector('.interactive-audio-status').textContent`),/indisponível/)
  await seed('nao-quero-comer');for(const id of ['eu','nao','quero','comer','obrigada'])await select(id)
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:false})
  const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync('qa/communication-390.png',Buffer.from(shot.data,'base64'))
  assert.equal(errors.length,0,JSON.stringify(errors))
  console.log('UI variants, faithful speech, help, explicit advance, refresh/return, double click, mouse drag/cancel, emulated touch, keyboard, socials four sets, menus/routes and isolated storage PASS')
} finally {
  socket?.close();chrome.kill();server.close()
}
