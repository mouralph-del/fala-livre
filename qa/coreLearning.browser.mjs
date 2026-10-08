import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Targeted navigation styling harness. Native storage belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4217, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-core-learning-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9367', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
  validation: {
  let targets
  for (let i=0;i<100;i++) { try { targets=await(await fetch('http://127.0.0.1:9367/json/list')).json(); if(targets.some(t=>t.type==='page'))break } catch {} await pause(100) }
  const A = await connect(targets.find(t=>t.type==='page')), ev = A.evaluate
  await A.cdp('Page.addScriptToEvaluateOnNewDocument', { source: `
    localStorage.setItem('falalivre.demo-session.v1',JSON.stringify({demo:true,responsibleName:'Alex',userName:'Noa'}));
    window.__spoken=[];
    const voices=[{voiceURI:'chosen-br',name:'Chosen Brazilian',lang:'pt-BR',localService:true},{voiceURI:'other-br',name:'Other Brazilian',lang:'pt-BR',default:true,localService:true}];
    Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>voices,addEventListener(){},removeEventListener(){},cancel(){},speak(u){window.__spoken.push({text:u.text,voice:u.voice?.voiceURI,rate:u.rate,pitch:u.pitch})}}});
    window.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
    const prefs=JSON.parse(localStorage.getItem('falalivre.preferences')||'{}');prefs.voice=JSON.stringify(['chosen-br','Chosen Brazilian','pt-br']);localStorage.setItem('falalivre.preferences',JSON.stringify(prefs));
  ` })
  await A.cdp('Page.navigate', { url:'http://127.0.0.1:4217/__audit#/aprender/comunicar' }); await ready(A)
  const wait = async expression => { for(let i=0;i<150;i++){if(await ev(expression))return;await pause(40)}throw Error('not ready: '+expression) }
  const click = async selector => { await ev(`document.querySelector(${JSON.stringify(selector)}).click()`); await pause(45) }
  const button = async text => { await ev(`Array.from(document.querySelectorAll('main button')).find(b=>b.textContent.trim()===${JSON.stringify(text)}).click()`); await pause(70) }
  const choose = label => click('.communication-choices [aria-label=' + JSON.stringify('Selecionar ' + label) + ']')
  const navigate = async hash => { await ev('location.hash='+JSON.stringify(hash)); await pause(100) }
  const seed = async (module, ids, target, hash) => {
    await navigate('#/aprender')
    await ev(`(()=>{const value=JSON.parse(localStorage.getItem('falaLivre_contentRotation_v1')||'{}');value.modules=value.modules||{};value.modules[${JSON.stringify(module)}]={order:${JSON.stringify([target,...ids.filter(id=>id!==target)])},currentIndex:0,cycle:1,lastThemeId:null};localStorage.setItem('falaLivre_contentRotation_v1',JSON.stringify(value))})()`)
    await A.cdp('Page.reload'); await pause(150); await ready(A)
    await navigate(hash)
  }
  const catalog = await ev(`(async()=>{const c=await import('/src/data/communicationOptions.js'),e=await import('/src/data/myDayEmotions.js'),w=await import('/src/data/learningWords.js');return {sets:c.communicationSets,phrases:{...c.communicationNaturalPhrases,...e.emotionNaturalPhrases},words:w.learningWords}})()`)
  const progress = () => ev('localStorage.getItem("falaLivre_progress_v1")')
  for (const set of catalog.sets) {
    await seed('communication',catalog.sets.map(s=>s.id),set.id,'#/aprender/comunicar')
    assert.equal(await ev('document.querySelectorAll(".communication-qa-selector,select").length'),0)
    const before = await progress()
    const labels = await ev(`Array.from(document.querySelectorAll('.communication-choices .communication-select'),b=>b.getAttribute('aria-label').replace(/^Selecionar /,''))`)
    const map = Object.fromEntries(set.tokenIds.map((id,i)=>[id,labels[i]]))
    for (const [key,text] of Object.entries(catalog.phrases)) {
      const tokens=key.split(','); if(tokens.some(id=>!set.tokenIds.includes(id)))continue
      await button('Limpar')
      for(const token of tokens)await choose(map[token])
      assert.equal(await ev('document.querySelector(".sentence-natural")?.textContent'),text)
      await button('Ouvir frase')
      assert.equal(await ev('window.__spoken.at(-1).text'),text)
      assert.equal(await ev('window.__spoken.at(-1).voice'),'chosen-br')
    }
    await click('.communication-choices .communication-audio')
    assert.equal(await ev('window.__spoken.at(-1).voice'),'chosen-br')
    if(set.id==='need') {
      await button('Limpar'); for(const token of ['eu','preciso','ajuda','banheiro'])await choose(map[token])
      await click('.sentence-words [aria-label="Remover BANHEIRO"]')
      assert.equal(await ev('document.querySelector(".sentence-natural").textContent'),'Eu preciso de ajuda.')
      await choose(map.ajuda)
      assert.equal(await ev('document.querySelector(".sentence-natural")'),null)
      assert.equal(await ev('Array.from(document.querySelectorAll(".sentence-actions button")).find(b=>b.textContent.includes("Ouvir frase")).disabled'),true)
    }
    await button('Limpar')
    assert.equal(await ev('document.querySelectorAll(".sentence-words li").length'),0)
    assert.equal(await progress(),before,'personal communication/audio does not record message content')
    await button('Concluir exploração')
    await wait(`JSON.parse(localStorage.getItem('falaLivre_progress_v1')).exploredActivities.communication.includes('guided-exploration')`)
  }
  if(process.argv.includes('--communication-only')) {
    assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
    console.log('PASS Comunicar: all public combinations/states, remove/clear/audio/finish, unknown speech disabled and preserved progress semantics.')
    break validation
  }
  // Old build evidence remains readable and is presented with the new phase name.
  await navigate('#/aprender')
  await ev(`(async()=>{const p=(await import('/src/utils/progress.js')).createEmptyProgress('12345678-1234-4234-8234-123456789abc');const old=JSON.parse(JSON.stringify(p));old.exploredActivities.wordsAndPhrases=['casa'];old.performedActivities.wordsAndPhrases.casa=['build'];localStorage.setItem('falaLivre_progress_v1',JSON.stringify(old))})()`)
  await A.cdp('Page.reload');await pause(150);await ready(A);await navigate('#/meu-progresso')
  await wait('document.querySelector(".record-list")!==null')
  assert.ok(await ev('document.querySelector(".my-progress").textContent.includes("Reconhecer: Realizado")'))
  assert.equal(await ev('document.querySelector(".my-progress").textContent.includes("Montar")'),false)
  const oldProgress = await progress()
  await A.cdp('Page.reload');await pause(150);await ready(A)
  assert.equal(await progress(),oldProgress,'view/reload never migrates or erases previous progress')
  for (const word of catalog.words) {
    await seed('wordsAndPhrases',catalog.words.map(w=>w.id),word.id,'#/aprender/palavras-frases')
    await wait('document.querySelector(".words-name")?.textContent==='+JSON.stringify(word.word))
    assert.equal(await ev('document.querySelectorAll(".words-qa-selector,.words-letter-button,.words-slot").length'),0)
    await button('Ouvir palavra');assert.equal(await ev('window.__spoken.at(-1).voice'),'chosen-br')
    await button('Continuar')
    assert.equal(await ev('document.querySelector("#words-heading").textContent'),'Reconhecer')
    assert.equal(await ev('document.querySelector(".words-picture").alt'),'Pictograma de '+word.word.toLocaleLowerCase('pt-BR'))
    const options=await ev('Array.from(document.querySelectorAll(".words-option"),b=>b.textContent)')
    assert.equal(options.length,3);assert.equal(new Set(options).size,3)
    assert.equal(options.filter(text=>text===word.word).length,1)
    assert.ok(options.every(text=>catalog.words.some(w=>w.word===text)))
    assert.equal(options.includes('CASA') && options.includes('CAMA'),false)
    const before=await progress();await button(options.find(text=>text!==word.word))
    assert.ok(await ev('document.querySelector(".words-feedback").textContent.includes("Tente novamente")'))
    assert.equal(await progress(),before,'incorrect recognition writes no evidence')
    await button(word.word)
    assert.ok(await ev('document.querySelector(".words-feedback").textContent.includes("Muito bem")'))
    await wait(`JSON.parse(localStorage.getItem('falaLivre_progress_v1')).performedActivities.wordsAndPhrases[${JSON.stringify(word.id)}]?.includes('build')`)
    await button('Continuar')
    await button(word.sentenceOptions.find(text=>text!==word.sentenceAnswer));await button('Conferir')
    assert.ok(await ev('document.querySelector(".words-feedback").textContent.includes("Tente novamente")'))
    await button(word.sentenceAnswer);await button('Conferir');await button('Ouvir frase')
    assert.equal(await ev('window.__spoken.at(-1).text'),word.sentenceText)
    assert.equal(await ev('window.__spoken.at(-1).voice'),'chosen-br')
    assert.ok(await ev('document.querySelector(".words-feedback").textContent.includes('+JSON.stringify(word.sentenceText)+')'))
    await wait(`JSON.parse(localStorage.getItem('falaLivre_progress_v1')).performedActivities.wordsAndPhrases[${JSON.stringify(word.id)}]?.includes('complete')`)
    const completed=await progress();await button('Próxima palavra')
    assert.equal(await progress(),completed,'advance does not erase evidence')
  }
  // Trusted keyboard and touch activation on the public controls.
  const enter = async () => {
    await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13})
    await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await pause(60)
  }
  const touch = async selector => {
    await ev(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`)
    const point=await ev(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`)
    await A.cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,id:1}]})
    await A.cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(80)
  }
  await seed('communication',catalog.sets.map(s=>s.id),'state','#/aprender/comunicar')
  await ev(`document.querySelector('.communication-choices [aria-label="Selecionar EU"]').focus()`);await enter()
  await choose('ESTOU');await touch('.communication-choices [aria-label="Selecionar TRISTE"]')
  assert.equal(await ev('document.querySelector(".sentence-natural").textContent'),'Eu estou triste.')
  await seed('wordsAndPhrases',catalog.words.map(w=>w.id),'casa','#/aprender/palavras-frases');await button('Continuar')
  await ev(`Array.from(document.querySelectorAll('.words-option')).find(b=>b.textContent==='CASA').focus()`);await enter()
  assert.ok(await ev('document.querySelector(".words-feedback").textContent.includes("Muito bem")'))
  await button('Continuar');await touch('.words-option')
  assert.equal(await ev('document.querySelector(".words-option").getAttribute("aria-pressed")'),'true')
  // Minimal keyboard check: base alphabet stays distinct from accent aids.
  await seed('writing',catalog.words.map(w=>w.id),'agua','#/aprender/escrever');await wait('document.querySelector(".writing-letter")!==null')
  assert.equal(await ev(`document.querySelectorAll('[aria-label="Letras do alfabeto"] .writing-letter').length`),26)
  assert.ok(await ev(`!!document.querySelector('[aria-label="Letras com acento"] [aria-label="Inserir letra Á"]')`))
  await click('[aria-label="Inserir letra Á"]')
  assert.ok(await ev('document.querySelector(".writing-slot-panel")?.textContent.includes("Á")'))
  const shots=path.join(tempRoot,'falalivre-core-learning-review');fs.mkdirSync(shots,{recursive:true})
  const layout = async label => {
    assert.ok(await ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'),label+' overflow')
    assert.deepEqual(await ev(`Array.from(document.querySelectorAll('main button,main .words-option,main .sentence-natural'),e=>({text:e.textContent,clipped:e.scrollWidth>e.clientWidth+1})).filter(e=>e.clipped)`),[],label+' clipped text')
  }
  for(const width of [320,360,390,430,768,1024,1366])for(const size of ['normal','large'])for(const zoom of [1,1.25]) {
    await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false})
    await seed('communication',catalog.sets.map(s=>s.id),'state','#/aprender/comunicar')
    await ev(`document.documentElement.dataset.elementSize=${JSON.stringify(size)};document.documentElement.dataset.reduceMotion='true';document.documentElement.style.zoom=${zoom}`)
    await choose('EU');await choose('ESTOU');await choose('CONFUSA');await layout('communication '+width+size+zoom)
    if(zoom===1 && [320,1366].includes(width)) {await ev('window.scrollTo(0,0)');const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:75,captureBeyondViewport:true});fs.writeFileSync(path.join(shots,'communication-'+width+'-'+size+'.jpg'),Buffer.from(shot.data,'base64'))}
    await seed('wordsAndPhrases',catalog.words.map(w=>w.id),'cachorro','#/aprender/palavras-frases')
    await ev(`document.documentElement.dataset.elementSize=${JSON.stringify(size)};document.documentElement.dataset.reduceMotion='true';document.documentElement.style.zoom=${zoom}`)
    await layout('know '+width+size+zoom);await button('Continuar');await layout('recognize '+width+size+zoom)
    await ev('document.querySelector(".words-option").focus()')
    await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37})
    await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37})
    assert.equal(await ev('getComputedStyle(document.activeElement).outlineStyle'),'solid')
    if(zoom===1 && [320,1366].includes(width)) {await ev('window.scrollTo(0,0)');const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:75,captureBeyondViewport:true});fs.writeFileSync(path.join(shots,'recognize-'+width+'-'+size+'.jpg'),Buffer.from(shot.data,'base64'))}
    await button('CACHORRO');await button('Continuar');await layout('sentence '+width+size+zoom)
  }
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
  assert.equal(await ev('Object.keys(localStorage).some(key=>/audio|password/i.test(key))'),false)
  console.log('PASS targeted core learning: all public communication combinations/states, remove/clear/audio/finish, unknown speech disabled; twelve recognition/context flows and durable progress, historical build compatibility; global selected voice; A/Á separation; seven widths Normal/Grande 125%, focus/reduced motion. Screenshots: '+shots)

  }
} finally {
  for (const socket of sockets) socket.close(); chrome.kill(); await server.close(); await pause(500)
  const resolved = path.resolve(profile)
  if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith('falalivre-core-learning-')) throw Error('unsafe temporary path')
  try { fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { console.log('Temporary Chrome profile remains: ' + resolved) }
}
