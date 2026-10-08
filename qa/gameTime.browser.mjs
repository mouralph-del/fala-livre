import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Audit-only harness. Native storage below belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4204, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-game-time-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9354', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
  for(let i=0;i<100;i++){try{targets=await(await fetch('http://127.0.0.1:9354/json/list')).json();if(targets.some(t=>t.type==='page'))break}catch{}await pause(100)}
  const A=await connect(targets.find(t=>t.type==='page'))
  await A.cdp('Page.addScriptToEvaluateOnNewDocument',{source:`
    window.__clock = new Date(2026,9,6,12).getTime();Date.now=()=>window.__clock;
    window.__visible=true;Object.defineProperty(document,'visibilityState',{get:()=>window.__visible?'visible':'hidden'});
    window.confirm=()=>true;
  `})
  await A.cdp('Page.navigate',{url:'http://127.0.0.1:4204/__audit#/responsaveis'});await ready(A)
  const ev=A.evaluate
  const route=async hash=>{await ev('location.hash='+JSON.stringify(hash));await pause(100)}
  const click=async selector=>{await ev('document.querySelector('+JSON.stringify(selector)+').click()');await pause(80)}
  const prefs=async(key,value)=>{await ev(`(async()=>{const p=await import('/src/utils/preferences.js');p.updatePreference(${JSON.stringify(key)},${JSON.stringify(value)})})()`);await pause(80)}
  const advance=async ms=>{await ev(`(async()=>{window.__clock+=${ms};const m=await import('/src/utils/gameTime.js');m.getGameTimeTracker().tick()})()`);await pause(80)}
  const state=()=>ev("(async()=>{const m=await import('/src/utils/gameTime.js');return m.getGameTimeTracker().getSnapshot()})()")
  assert.equal(await ev('document.querySelectorAll("[name=gameTimeLimit]").length'),6)
  await ev("(async()=>{await(await import('/src/services/accountAccess.js')).requestAccountAccess('sign-in',{email:'teste@falalivre.com',password:'FalaLivre123'})})()")
  await ev("localStorage.setItem('falaLivre_progress_v1','{}');localStorage.setItem('falaLivre_contentRotation_v1','{}')")
  const protectedBefore=await ev("[localStorage.getItem('falaLivre_progress_v1'),localStorage.getItem('falaLivre_contentRotation_v1')]")
  await click('[name=gameTimeLimit][value="15"]')
  for(const mode of ['unlimited','15','30','45','60','custom']) {await click('[name=gameTimeLimit][value="'+mode+'"]');assert.equal(await ev("JSON.parse(localStorage.getItem('falalivre.preferences')).gameTimeLimit"),mode)}
  for(const invalid of ['0','-2','bad','1.5','1441']){
    await ev(`(()=>{const n=document.querySelector('#game-time-minutes');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(n,${JSON.stringify(invalid)});n.dispatchEvent(new Event('input',{bubbles:true}));n.dispatchEvent(new Event('change',{bubbles:true}))})()`)
    await pause(50);await click('.profile-game-time button');assert.ok(await ev('!!document.querySelector("#game-time-error").textContent'))
  }
  await ev("(()=>{const n=document.querySelector('#game-time-minutes');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(n,'2');n.dispatchEvent(new Event('input',{bubbles:true}))})()");await pause(80);await click('.profile-game-time button')
  assert.equal(await ev("JSON.parse(localStorage.getItem('falalivre.preferences')).customGameMinutes"),2)
  await advance(60000);assert.equal((await state()).consumedMs,0)
  await route('/jogar/memoria');await advance(60000);assert.equal((await state()).consumedMs,60000)
  await ev("window.__visible=false;document.dispatchEvent(new Event('visibilitychange'))");await advance(600000);assert.equal((await state()).consumedMs,60000)
  await ev("window.__visible=true;document.dispatchEvent(new Event('visibilitychange'))")
  await route('/aprender');await advance(60000);assert.equal((await state()).consumedMs,60000)
  await route('/jogar/memoria');await advance(60000);assert.equal((await state()).exhausted,true)
  assert.ok(await ev("document.querySelector('main').textContent.includes('O tempo de jogos de hoje terminou.')"))
  const gameRoutes=['/jogar/caminho','/jogar/quebra-cabeca','/jogar/caca-palavras','/jogar/memoria','/jogar/encontre-imagem','/jogar/onde-pertence']
  for(const hash of ['/jogar',...gameRoutes]){await route(hash);assert.ok(await ev("!!document.querySelector('a[href=\"#/aprender\"]') && document.querySelector('main').textContent.includes('terminou')"))}
  await click('main a[href="#/aprender"]');assert.equal(await ev('location.hash'),'#/aprender');assert.ok(await ev('!!document.querySelector(".learning-grid")'))
  for(const hash of ['/perfil','/responsaveis','/meu-progresso']){await route(hash);assert.ok(!(await ev("document.querySelector('main').textContent.includes('O tempo de jogos de hoje terminou.')")))}
  await prefs('gameTimeLimit','15');await route('/jogar');assert.equal((await state()).exhausted,false)
  await prefs('gameTimeLimit','custom');assert.equal((await state()).exhausted,true)
  await prefs('gameTimeLimit','unlimited');assert.equal((await state()).exhausted,false)
  for(const hash of gameRoutes){
    await route(hash);assert.ok(await ev("!document.querySelector('main').textContent.includes('O tempo de jogos de hoje terminou.') && !document.querySelector('.premium-access-panel')"))
    const before=(await state()).consumedMs;await advance(1000);assert.equal((await state()).consumedMs,before+1000)
  }
  await route('/perfil')
  assert.equal(await ev('document.querySelectorAll("[name=gameTimeLimit],#game-time-minutes,.profile-game-time").length'),0)
  for(const learn of ['girl','boy'])for(const play of ['girl','boy']){await click('[name=learnCharacter][value="'+learn+'"]');await click('[name=gameCharacter][value="'+play+'"]');assert.equal(await ev('Array.from(document.querySelectorAll(".profile-character-preview")).every(i=>i.complete&&i.naturalWidth>0)'),true)}
  await click('[name=elementSize]');await prefs('elementSize','large');await prefs('reduceMotion',true)
  assert.equal(await ev('document.documentElement.dataset.elementSize'),'large');assert.equal(await ev('document.documentElement.dataset.reduceMotion'),'true')
  assert.ok(await ev("Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Ouvir exemplo')"))
  await click('.profile-restore button');assert.equal(await ev("JSON.parse(localStorage.getItem('falalivre.preferences')).gameTimeLimit"),'unlimited');assert.equal((await state()).consumedMs,126000)
  assert.deepEqual(await ev("[localStorage.getItem('falaLivre_progress_v1'),localStorage.getItem('falaLivre_contentRotation_v1')]"),protectedBefore)
  await prefs('customGameMinutes',2);await prefs('gameTimeLimit','custom');await A.cdp('Page.reload');await ready(A);assert.equal((await state()).exhausted,true)
  await ev("(async()=>{const m=await import('/src/utils/gameTime.js');m.getGameTimeTracker().suspend();window.__clock=new Date(2026,9,7,0,0,5).getTime();m.getGameTimeTracker().tick()})()");await pause(80);assert.equal((await state()).consumedMs,0)
  const screenshots=path.join(os.tmpdir(),'falalivre-game-time-review');fs.mkdirSync(screenshots,{recursive:true})
  for(const width of [320,390,768,1440]){
    await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false})
    await prefs('elementSize','large');await prefs('reduceMotion',true)
    for(const [name,hash,exhaust] of [['settings','/perfil',false],['games','/jogar',false],['finished','/jogar/memoria',true],['learn','/aprender',false],['guidance','/responsaveis',false]]){
      if(exhaust){await route('/jogar');await advance(120000)}
      await route(hash);await pause(100)
      assert.ok(await ev('document.documentElement.scrollWidth<=innerWidth+1'),'horizontal overflow '+name+' '+width)
      assert.deepEqual(await ev('Array.from(document.images).filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)'),[])
      const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:65,captureBeyondViewport:true});fs.writeFileSync(path.join(screenshots,name+'-'+width+'.jpg'),Buffer.from(shot.data,'base64'))
    }
    await prefs('gameTimeLimit','unlimited');await route('/jogar');await prefs('gameTimeLimit','custom')
    await ev("(async()=>{const m=await import('/src/utils/gameTime.js');m.getGameTimeTracker().suspend();window.__clock+=86400000;m.getGameTimeTracker().tick()})()");await pause(80)
  }
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[])
  console.log('PASS Responsible presets/custom validation, all six game timers/gates, Settings control absent, preferences/restore/refresh/day reset, accessibility and 20 responsive screenshots: '+screenshots)

} finally {
  for(const socket of sockets)socket.close();chrome.kill();await server.close();await pause(500)
  const resolved=path.resolve(profile)
  if(path.dirname(resolved)!==tempRoot||!path.basename(resolved).startsWith('falalivre-game-time-'))throw Error('unsafe temporary path')
  try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:200})}catch{console.log('Temporary Chrome profile remains: '+resolved)}
}
