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
await new Promise(resolve=>server.listen(4186,'127.0.0.1',resolve))
const profile = fs.mkdtempSync(path.join(os.tmpdir(),'falalivre-routines-qa-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',[
  '--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',
  '--remote-debugging-port=9336',`--user-data-dir=${profile}`,'about:blank',
],{stdio:'ignore',windowsHide:true})
const pause = ms=>new Promise(resolve=>setTimeout(resolve,ms))
let socket
try {
  let targets
  for(let i=0;i<100;i++) {
    try { targets=await (await fetch('http://127.0.0.1:9336/json/list')).json(); break } catch {await pause(100)}
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
  const key='falaLivre_contentRotation_v1',saved=()=>evaluate(`JSON.parse(localStorage.getItem('${key}'))`)
  const bt=async text=>{await evaluate(`(()=>{const e=[...document.querySelectorAll('main button')].find(e=>e.textContent.trim()===${JSON.stringify(text)}&&!e.disabled);if(!e)throw Error(${JSON.stringify(text)});e.click()})()`);await pause(40)}
  await cdp('Page.navigate',{url:'http://127.0.0.1:4186/#/aprender'});await wait(`document.querySelector('.learning-card')`)
  await evaluate(`window.__spoken=[];window.__cancel=0;speechSynthesis.speak=u=>window.__spoken.push(u.text);speechSynthesis.cancel=()=>window.__cancel++`)
  for(const route of ['/aprender/comunicar','/aprender/palavras-frases','/aprender/escrever','/aprender/situacoes','/aprender/meu-dia-a-dia/rotinas','/aprender/meu-dia-a-dia/comunicacao','/aprender/meu-dia-a-dia/emocoes']){await navigate(route);if(route.endsWith('emocoes'))await click('[aria-label="Abrir Conhecer emoções"]')}
  let snapshot=await saved();assert.equal(Object.keys(snapshot.modules).length,7)
  const check=async module=>{const next=await saved();for(const m of Object.keys(snapshot.modules))if(m!==module)assert.deepEqual(next.modules[m],snapshot.modules[m]);assert.notDeepEqual(next.modules[module],snapshot.modules[module]);snapshot=next;await cdp('Page.reload');await wait(`document.querySelector('main button')`);assert.deepEqual(await saved(),snapshot);await evaluate(`window.__spoken=[];window.__cancel=0;speechSynthesis.speak=u=>window.__spoken.push(u.text);speechSynthesis.cancel=()=>window.__cancel++`)}
  await bt('Próximo conceito');await check('myDayEmotions')
  await navigate('/aprender/meu-dia-a-dia/rotinas');const rs=(await loadData('src/data/myDayRoutines.js')).myDayRoutines,r=snapshot.modules.myDayRoutines,routine=rs.find(x=>x.id===r.order[r.currentIndex])
  await click('.sequence-audio');const cancelBefore=await evaluate('window.__cancel')
  await click('.sequence-slot:nth-child(1) .sequence-select');await click('.sequence-slot:nth-child(2) .sequence-position');assert.ok(await evaluate('window.__cancel')>cancelBefore);assert.equal(await evaluate('window.__spoken.length'),1);const noChange=await evaluate('window.__cancel');await click('.sequence-slot:nth-child(1) .sequence-select');assert.equal(await evaluate('window.__cancel'),noChange);await click('.sequence-slot:nth-child(1) .sequence-position');assert.equal(await evaluate('window.__cancel'),noChange);console.log('Swap cancels audio, no autoplay; select and same position do not cancel PASS')
  for(let i=0;i<routine.steps.length;i++){const source=(await order()).indexOf(routine.steps[i].word);if(source!==i){await click(`.sequence-slot:nth-child(${source+1}) .sequence-select`);await click(`.sequence-slot:nth-child(${i+1}) .sequence-position`)}}
  await bt('Conferir');await bt('Próxima rotina');await check('myDayRoutines');await click('.sequence-audio');let cancels=await evaluate('window.__cancel')
  await navigate('/aprender/meu-dia-a-dia/comunicacao');assert.ok(await evaluate('window.__cancel')>cancels)
  const cs=(await loadData('src/data/learningConcepts.js')).learningConcepts,s=snapshot.modules.myDayCommunication,situation=situations.find(x=>x.id===s.order[s.currentIndex])
  for(const token of situation.expectedTokens)await click(`[aria-label="Selecionar ${cs[token].label}"]`)
  await click('[aria-label^="Ouvir frase"]');cancels=await evaluate('window.__cancel');await bt('Conferir frase');await bt('Próxima situação');assert.ok(await evaluate('window.__cancel')>cancels);await check('myDayCommunication')
  await click('[aria-label^="Ouvir"]');cancels=await evaluate('window.__cancel');await navigate('/aprender/meu-dia-a-dia/emocoes');assert.ok(await evaluate('window.__cancel')>cancels);await click('[aria-label="Abrir Conhecer emoções"]');await bt('Ouvir nome');cancels=await evaluate('window.__cancel');await navigate('/aprender/comunicar');assert.ok(await evaluate('window.__cancel')>cancels);await click('[aria-label^="Ouvir"]');cancels=await evaluate('window.__cancel');await navigate('/');assert.ok(await evaluate('window.__cancel')>cancels)
  assert.deepEqual(await saved(),snapshot);console.log('All three MyDay advances preserve six other VALID modules, refresh, cross-module audio cancellation PASS')
  await navigate('/jogar/bingo');await bt('Preciso de ajuda')
  for(let i=0;i<25;i++){if(await evaluate(`!!document.querySelector('.bingo-success')`))break;const target=await evaluate(`document.querySelector('#bingo-target').textContent`);await evaluate(`(()=>{const e=[...document.querySelectorAll('.bingo-cell')].find(e=>e.querySelector('strong').textContent===${JSON.stringify(target)});e.click()})()`);await pause(30);if(!await evaluate(`!!document.querySelector('.bingo-success')`))await bt('Próxima palavra')}
  assert.ok(await evaluate(`!!document.querySelector('.bingo-success')`));await bt('Jogar novamente');console.log('Legacy Bingo help, complete line, restart PASS')
  await navigate('/aprender/meu-dia-a-dia/emocoes');await evaluate(`document.querySelector('[aria-label="Abrir Conhecer emoções"]').focus()`); await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});console.log('Tab focus',await evaluate(`document.activeElement.outerHTML`));await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8});await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8});assert.equal(await evaluate(`document.activeElement.getAttribute('aria-label')`),'Abrir Conhecer emoções');console.log('ShiftTab return PASS');
  const routes=await (async()=>{await navigate('/jogar');return evaluate(`[...document.querySelectorAll('.game-start')].map(e=>e.getAttribute('href'))`)})();console.log('Game routes',routes)
  const ws=(await loadData('src/data/wordSearchLevels.js')).wordSearchLevels
  const belongs=(await loadData('src/data/whereBelongsLevels.js')).whereBelongsLevels
  const find=(await loadData('src/data/findImageLevels.js')).findImageLevels
  const cw=(await loadData('src/data/communicationOptions.js')).communicationWords; const pathSource=fs.readFileSync('src/data/pathGameLevels.js','utf8').replace(/import (.+?) from '([^']+)'/g,(_,binding,target)=>target.endsWith('.png')?'const '+binding+'="asset"':'const words='+JSON.stringify(cw));const pathmod=await import('data:text/javascript;base64,'+Buffer.from(pathSource).toString('base64'))
  for(const route of routes){await navigate(route.replace(/^#/,''));console.log('Game start',route)
    for(let level=0;level<3;level++){
      const kind=await evaluate(`document.querySelector('.memory-levels')?'memory':document.querySelector('.puzzle-levels')?'puzzle':document.querySelector('.wordsearch-levels')?'wordsearch':document.querySelector('.belongs-levels')?'belongs':document.querySelector('.findimage-levels')?'findimage':document.querySelector('.path-levels')?'path':null`);assert.ok(kind)
      await click(`.${kind}-levels button:nth-child(${level+1})`)
      if(await evaluate(`[...document.querySelectorAll('main button')].some(e=>e.textContent.trim()==='Preciso de ajuda')`))await bt('Preciso de ajuda')
      if(await evaluate(`[...document.querySelectorAll('main button')].some(e=>e.textContent.trim()==='Reiniciar')`))await bt('Reiniciar')
      if(kind==='memory'){
        const groups=await evaluate(`(()=>{const g={};document.querySelectorAll('[data-card]').forEach(e=>{const k=e.querySelector('strong').textContent;(g[k]??=[]).push(e.dataset.card)});return Object.values(g)})()`)
        for(const pair of groups){for(const id of pair)await click(`[data-card="${id}"]`);await pause(60)}
      } else if(kind==='puzzle'){
        const count=await evaluate(`document.querySelectorAll('[data-slot]').length`);for(let i=0;i<count;i++){await click(`[aria-label="Selecionar peça ${i+1}"]`);await click(`[data-slot="${i}"]`)}
      } else if(kind==='wordsearch'){
        for(const word of ws[level].words)for(const cell of word.cells)await click(`[data-cell="${cell}"]`)
      } else if(kind==='belongs'){
        for(let i=0;i<belongs[level].rounds.length;i++){const id=await evaluate(`document.querySelector('[data-round]').dataset.round`),r=belongs[level].rounds.find(r=>r.id===id);await click('.belongs-object');await click(`[data-destination="${r.correctDestination}"]`);await bt('Próxima')}
      } else if(kind==='findimage'){
        for(let i=0;i<find[level].concepts.length;i++){const question=await evaluate(`document.querySelector('#findimage-target').textContent.trim()`),c=find[level].concepts.find(c=>c.question===question);assert.ok(c,question);await click(`[data-animal="${c.id}"]`);await bt('Próxima')}
      } else if(kind==='path'){
        const l=pathmod.pathGameLevels[level];for(let i=0;i<40;i++){const pos=await evaluate(`document.querySelector('[data-position]').dataset.position`);if(pos===l.correctDestination)break;const next=pathmod.nextPathStep(l,pos);await click(`[data-node="${next}"]`);await pause(500)}
      }
      await wait(`document.querySelector('.${kind}-success') || document.querySelector('.path-result')`)
      console.log('Game complete',kind,level+1);await bt('Jogar novamente')
      for(const width of [320,768,1366]){await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`),`${kind} overflow ${width}`)}
      await cdp('Emulation.clearDeviceMetricsOverride')
    }
  }

  for(const width of [320,360,390,430,768,1024,1366]) {
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false})
    for(const size of ['normal','large']) {
      await evaluate(`localStorage.setItem('falalivre.preferences',JSON.stringify({elementSize:'${size}',reduceMotion:true,voice:'QA Português'}))`)
      for(const route of ['/jogar/caca-palavras','/aprender/meu-dia-a-dia/rotinas']) {
        await navigate(route);await cdp('Page.reload');await wait(`document.querySelector('main button')`)
        assert.equal(await evaluate(`document.documentElement.dataset.reduceMotion`),'true')
        assert.equal(await evaluate(`document.documentElement.dataset.elementSize`),size)
        assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`),`${route} ${width} ${size}`)
        if(route.includes('caca-palavras')) {
          await click('.wordsearch-levels button:nth-child(3)')
          for(const word of ws[2].words)for(const cell of word.cells){await evaluate(`document.querySelector('[data-cell="${cell}"]').focus()`);await press('Enter')}
          assert.ok(await evaluate(`!!document.querySelector('.wordsearch-success')`));await bt('Jogar novamente')
        } else {
          await click('.sequence-select');await press('Escape');await bt('Preciso de ajuda');await bt('Conferir')
        }
      }
    }
    console.log(`${width}px affected areas normal/large reduced-motion keyboard PASS`)
  }
  assert.equal(errors.length,0,JSON.stringify(errors))
} finally {socket?.close();chrome.kill();server.close()}
