import assert from 'node:assert/strict'
import http from 'node:http'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { loadData } from './communication.test.mjs'

const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'}
const root = path.resolve('dist')
const server = http.createServer((req,res)=>{
  const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]))
  if (!file.startsWith(root+path.sep) || !fs.existsSync(file)) { res.writeHead(404).end(); return }
  res.setHeader('Content-Type',mime[path.extname(file)]??'application/octet-stream')
  res.end(fs.readFileSync(file))
})
await new Promise(resolve=>server.listen(4184,'127.0.0.1',resolve))
const profile = fs.mkdtempSync(path.join(os.tmpdir(),'falalivre-routines-qa-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',[
  '--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',
  '--remote-debugging-port=9334',`--user-data-dir=${profile}`,'about:blank',
],{stdio:'ignore',windowsHide:true})
const pause = ms=>new Promise(resolve=>setTimeout(resolve,ms))
let socket
try {
  let targets
  for(let i=0;i<100;i++) {
    try { targets=await (await fetch('http://127.0.0.1:9334/json/list')).json(); break } catch {await pause(100)}
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
  const route='/aprender/meu-dia-a-dia/emocoes'
  const key='falaLivre_contentRotation_v1'
  const saved=()=>evaluate(`JSON.parse(localStorage.getItem('${key}'))`)
  const button=async text=>{await evaluate(`(()=>{const b=[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b||b.disabled)throw Error('Unavailable button: '+${JSON.stringify(text)});b.focus();b.click()})()`);await pause(35)}
  const open=async name=>click(`[aria-label="Abrir ${name}"]`)
  const select=async label=>click(`[aria-label="Selecionar ${label}"]`)
  const instrument=()=>evaluate(`window.__spoken=[];window.__cancels=0;speechSynthesis.speak=u=>window.__spoken.push({text:u.text,lang:u.lang,voice:u.voice?.name});speechSynthesis.cancel=()=>window.__cancels++`)
  const say=async expected=>{await button('Ouvir mensagem');assert.equal(await evaluate('window.__spoken.at(-1).text'),expected)}
  await cdp('Runtime.enable');await cdp('Page.enable')
  await cdp('Emulation.setDeviceMetricsOverride',{width:1366,height:1100,deviceScaleFactor:1,mobile:false})
  await cdp('Page.addScriptToEvaluateOnNewDocument',{source:`window.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};speechSynthesis.getVoices=()=>[{name:'QA Português',voiceURI:'qa',lang:'pt-BR',default:true}];window.__spoken=[];window.__cancels=0;speechSynthesis.speak=u=>window.__spoken.push({text:u.text,lang:u.lang,voice:u.voice?.name});speechSynthesis.cancel=()=>window.__cancels++`})
  await cdp('Page.navigate',{url:'http://127.0.0.1:4184/#'+route});await wait(`document.querySelector('[data-emotions-view="menu"]')`)
  await navigate('/');await click('[aria-label="Começar a aprender"]');await click('[aria-label="Começar: meu dia a dia"]');await click('[aria-label="Começar: Emoções"]')
  assert.equal(await evaluate('location.hash'),'#'+route)
  await evaluate('history.back()');await wait(`document.querySelector('.my-day-options')`)
  await evaluate('history.forward()');await wait(`document.querySelector('[data-emotions-view="menu"]')`)
  const moduleIds=['communication','wordsAndPhrases','writing','dailySituations','myDayRoutines','myDayCommunication']
  await evaluate(`localStorage.setItem('${key}',JSON.stringify({version:1,modules:Object.fromEntries(${JSON.stringify(moduleIds)}.map(id=>[id,{order:['sentinel'],currentIndex:0,cycle:7,lastThemeId:null}]))}));localStorage.setItem('falalivre.preferences',JSON.stringify({voice:'QA Português',elementSize:'normal',reduceMotion:false}))`)
  const initial=await saved()
  assert.equal(await evaluate(`document.querySelectorAll('.emotions-functions section').length`),3)
  await open('O que preciso');assert.deepEqual(await saved(),initial)
  assert.equal(await evaluate(`document.querySelectorAll('.emotions-slots img').length`),0)
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Ouvir mensagem')).disabled`),true)
  await select('EU');await select('PRECISO');await select('AJUDA');await say('Eu preciso de ajuda.')
  await select('QUERO');await select('DESCANSAR');await say('Eu quero descansar.')
  await select('PRECISO');await say('Eu preciso descansar.')
  await click('[aria-label="Remover PRECISO"]')
  assert.equal(await evaluate(`document.activeElement.getAttribute('aria-label')`),'Selecionar PRECISO')
  await say('Eu descansar.')
  await button('Limpar');assert.equal(await evaluate(`document.querySelectorAll('.emotions-slots img').length`),0)
  await button('Não quero responder');assert.equal(await evaluate(`document.activeElement.getAttribute('aria-label')`),'Abrir O que preciso')
  await open('Como estou')
  const labels=['FELIZ','TRISTE','COM RAIVA','COM MEDO','CALMO','CALMA','CONFUSO','CONFUSA']
  for(const label of labels){
    await button('Limpar')
    const countBefore=await evaluate('window.__spoken.length')
    if(label==='CALMA'||label==='CONFUSA')await button(label)
    await select('EU');await select('ESTOU');await select(label)
    assert.equal(await evaluate('window.__spoken.length'),countBefore)
    const individual=label.charAt(0)+label.slice(1).toLocaleLowerCase('pt-BR')+'.'
    await click(`[aria-label="Ouvir palavra ${individual}"]`);assert.equal(await evaluate('window.__spoken.at(-1).text'),individual)
    await say('Eu estou '+label.toLocaleLowerCase('pt-BR')+'.')
  }
  await button('Limpar');await select('EU');await select('ESTOU');await say('Eu estou.')
  await select('TRISTE');await click('[aria-label="Remover ESTOU"]');await say('Eu triste.')
  await select('ESTOU');await select('FELIZ');await say('Eu estou feliz.')
  await select('CALMA');const cancels=await evaluate('window.__cancels');await button('CALMO');assert.ok(await evaluate('window.__cancels')>cancels);await say('Eu estou calmo.')
  await press('Escape');assert.equal(await evaluate(`document.querySelectorAll('.emotions-slots img').length`),2)
  await button('← Emoções');await open('Como estou');assert.equal(await evaluate(`document.querySelectorAll('.emotions-slots img').length`),0)
  assert.deepEqual(await saved(),initial)
  await button('← Emoções');await open('Conhecer emoções')
  const {myDayEmotions:concepts}=await loadData('src/data/myDayEmotions.js')
  const current=()=>evaluate(`document.querySelector('[data-concept]').dataset.concept`)
  const cycles=[];let previous=null
  for(let cycle=0;cycle<2;cycle++){
    const seen=[]
    for(let i=0;i<6;i++){
      const id=await current();assert.notEqual(id,previous);seen.push(id);previous=id
      const concept=concepts.find(c=>c.id===id)
      assert.ok(await evaluate(`document.querySelector('.emotions-explore').textContent.includes(${JSON.stringify(concept.explanation)})`))
      const before=await saved(),speechCount=await evaluate('window.__spoken.length')
      await click('summary');assert.ok(await evaluate(`document.querySelector('details p').textContent===${JSON.stringify(concept.example)}`))
      await button('Ouvir nome');assert.equal(await evaluate('window.__spoken.at(-1).text'),concept.speech)
      await button('Ouvir explicação');assert.equal(await evaluate('window.__spoken.at(-1).text'),concept.explanation)
      assert.equal(await evaluate('window.__spoken.length'),speechCount+2);assert.deepEqual(await saved(),before)
      if(i===0){await cdp('Page.reload');await wait(`document.querySelector('[data-emotions-view="menu"]')`);await open('Conhecer emoções');assert.equal(await current(),id);assert.deepEqual(await saved(),before)}
      await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(i%2?'Pular':'Próximo conceito')});b.click();b.click()})()`);await pause(40)
      const next=await saved();assert.equal(next.modules.myDayEmotions.cycle*6+next.modules.myDayEmotions.currentIndex,before.modules.myDayEmotions.cycle*6+before.modules.myDayEmotions.currentIndex+1)
    }
    assert.equal(new Set(seen).size,6);cycles.push(seen)
  }
  console.log('Two UI cycles:',JSON.stringify(cycles))
  const after=await saved();for(const id of moduleIds)assert.deepEqual(after.modules[id],initial.modules[id])
  const currentBefore=await current();await button('← Emoções');await open('Como estou');await select('TRISTE');await button('Não quero responder');await open('Conhecer emoções');assert.equal(await current(),currentBefore)
  await button('← Emoções');await open('Como estou')
  const mouse=await evaluate(`(()=>{const el=document.querySelector('[aria-label="Selecionar EU"]');el.scrollIntoView();const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`)
  await cdp('Input.dispatchMouseEvent',{type:'mousePressed',...mouse,button:'left',clickCount:1});await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',...mouse,button:'left',clickCount:1});await pause(40)
  assert.equal(await evaluate(`document.querySelectorAll('.emotions-slots img').length`),1)
  await button('Limpar')
  await evaluate(`document.querySelector('[aria-label="Selecionar EU"]').focus()`);await press('Enter');await evaluate(`document.querySelector('[aria-label="Selecionar ESTOU"]').focus()`);await press(' ')
  assert.equal(await evaluate(`document.querySelectorAll('.emotions-slots img').length`),2)
  await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1})
  const point=await evaluate(`(()=>{const el=document.querySelector('[aria-label="Selecionar TRISTE"]');el.scrollIntoView();const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`)
  await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(60)
  assert.equal(await evaluate(`document.querySelector('.emotions-slots').textContent.includes('TRISTE')`),true)
  for(const width of [320,360,390,430,768,1024,1366])for(const size of ['normal','large']){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false})
    await evaluate(`document.documentElement.dataset.elementSize=${JSON.stringify(size)};document.documentElement.dataset.reduceMotion='true'`)
    for(const name of ['Como estou','O que preciso','Conhecer emoções']){
      await button('← Emoções');assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);await open(name)
      if(name==='Como estou'){await select('EU');await select('ESTOU');await button('CONFUSA');await select('CONFUSA')}
      if(name==='O que preciso'){await select('EU');await select('QUERO');await select('DESCANSAR')}
      if(name==='Conhecer emoções')await click('summary')
      await wait(`[...document.querySelectorAll('main img')].every(i=>i.complete&&i.naturalWidth>0)`)
      assert.ok(await evaluate(`[...document.querySelectorAll('main img')].every(i=>i.getBoundingClientRect().width>=48)`),`${width} ${size} visible pictograms`)
      const metrics=await evaluate(`(()=>{const r=[...document.querySelectorAll('main button,main summary')].map(e=>e.getBoundingClientRect());return{overflow:document.documentElement.scrollWidth>innerWidth,overlap:r.some((a,i)=>r.slice(i+1).some(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)),small:r.some(a=>a.height<47),cut:r.some(a=>a.left<0||a.right>innerWidth)}})()`)
      assert.deepEqual(metrics,{overflow:false,overlap:false,small:false,cut:false},`${width} ${size} ${name}`)
    }
  }
  await cdp('Emulation.setDeviceMetricsOverride',{width:320,height:1000,deviceScaleFactor:1,mobile:false})
  await cdp('Emulation.setPageScaleFactor',{pageScaleFactor:2});assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);await cdp('Emulation.setPageScaleFactor',{pageScaleFactor:1})
  await button('← Emoções');await open('Como estou');await select('EU');await select('ESTOU');await select('COM MEDO')
  await say('Eu estou com medo.');assert.equal(await evaluate('window.__spoken.at(-1).voice'),'QA Português')
  await evaluate('window.SpeechSynthesisUtterance=undefined');await button('Ouvir mensagem');assert.ok(await evaluate(`document.querySelector('main').textContent.includes('Áudio indisponível')`))
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:false})
  const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync('qa/emotions-390.png',Buffer.from(shot.data,'base64'))
  for(const value of ['invalid',null]){
    await cdp('Page.addScriptToEvaluateOnNewDocument',{source:value===null?`Storage.prototype.getItem=()=>{throw Error('QA unavailable')};Storage.prototype.setItem=()=>{throw Error('QA unavailable')}`:`localStorage.setItem('${key}','invalid')`})
    await cdp('Page.reload');await wait(`document.querySelector('[data-emotions-view="menu"]')`);await open('Conhecer emoções');await button('Próximo conceito');assert.ok(await current())
  }
  assert.equal(errors.length,0,JSON.stringify(errors))
  console.log('Emotions UI: ten phrases, faithful partial/gaps, variants, cancellation, neutral edits/exits, direct needs, focus/Enter/Space/Escape, emulated touch, seven widths normal/large, page scale, storage fallback PASS')
} finally {
  socket?.close();chrome.kill();server.close()
}
