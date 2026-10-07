import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Targeted navigation styling harness. Native storage belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4209, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-navigation-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9359', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
  let targets;
  for(let i=0;i<100;i++){try{targets=await(await fetch('http://127.0.0.1:9359/json/list')).json();if(targets.some(t=>t.type==='page'))break}catch{}await pause(100)}
  const A=await connect(targets.find(t=>t.type==='page'));
  await A.cdp('Page.navigate',{url:'http://127.0.0.1:4209/__audit#/'});await ready(A);
  const ev=A.evaluate,route=async hash=>{await ev('location.hash='+JSON.stringify(hash));await pause(80)};
  const routes=['/','/aprender','/aprender/comunicar','/aprender/palavras-frases','/aprender/escrever','/aprender/escrever/teclado','/aprender/escrever/caderno','/aprender/meu-dia-a-dia','/aprender/meu-dia-a-dia/rotinas','/aprender/meu-dia-a-dia/comunicacao','/aprender/meu-dia-a-dia/emocoes','/aprender/situacoes','/jogar',...['caminho','quebra-cabeca','caca-palavras','memoria','encontre-imagem','onde-pertence','bingo','sequencias','situacoes-interativas'].map(g=>'/jogar/'+g),'/meu-progresso','/perfil','/responsaveis'];
  const selector='.navigation-action,a.navigation-return,a[class$="-back"],button.emotions-back,a.puzzle-action,a.wordsearch-action,a.memory-action,a.findimage-action,a.belongs-action,a.sequence-action,a.interactive-action';
  const shots=path.join(os.tmpdir(),'falalivre-navigation-review');fs.mkdirSync(shots,{recursive:true});
  for(const width of [320,360,390,430,768,1024,1366])for(const large of [false,true])for(const zoom of [1,1.25]){
    await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
    await ev('document.documentElement.dataset.elementSize='+JSON.stringify(large?'large':'normal'));
    await ev('document.documentElement.style.zoom='+zoom);
    for(const hash of routes){
      await route(hash);
      assert.ok(await ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'),hash+' overflow');
      const buttons=await ev('Array.from(document.querySelectorAll('+JSON.stringify(selector)+'),e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {text:e.textContent.trim(),height:r.height,scroll:e.scrollWidth,width:e.clientWidth,bg:s.backgroundColor,color:s.color,border:s.borderTopWidth,underline:s.textDecorationLine,primary:e.classList.contains("navigation-action--primary")}})');
      for(const b of buttons){assert.ok(b.text);assert.ok(b.height>=(large?55:47)*zoom,JSON.stringify({hash,width,large,b}));assert.ok(b.scroll<=b.width+1);assert.equal(b.underline,'none');assert.ok(parseFloat(b.border)>=0.79);assert.equal(b.bg,b.primary?'rgb(49, 95, 140)':'rgb(255, 255, 255)');assert.equal(b.color,b.primary?'rgb(255, 255, 255)':'rgb(49, 95, 140)');}
      if(buttons.length){await ev('document.querySelector("main").focus()');await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
        const focused=await ev('Array.from(document.querySelectorAll('+JSON.stringify(selector)+'),e=>{e.focus();const s=getComputedStyle(e);return {text:e.textContent.trim(),outline:s.outlineStyle,width:s.outlineWidth,clipped:e.scrollHeight>e.clientHeight+1}})');
        for(const action of focused){assert.equal(action.outline,'solid',action.text);assert.ok(parseFloat(action.width)*zoom>=2.99,action.text);assert.equal(action.clipped,false,action.text);}
      }
      if(zoom===1&&((['/','/meu-progresso','/aprender/comunicar'].includes(hash)&&[320,1366].includes(width))||(!large&&width===390))) {const shot=await A.cdp('Page.captureScreenshot',{format:'jpeg',quality:70,captureBeyondViewport:true});fs.writeFileSync(path.join(shots,(hash==='/'?'home':hash.slice(1).replaceAll('/','-'))+'-'+width+(large?'-large':'')+'.jpg'),Buffer.from(shot.data,'base64'));}
    }
  }
  await ev('document.documentElement.style.zoom=""');
  await route('/');const href=await ev('document.querySelector(".progress-entry a").getAttribute("href")');assert.equal(href,'#/meu-progresso');
  await ev('document.querySelector("main").focus()');await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  // Native keyboard activation of the semantic anchor and focus ring.
  await ev('document.querySelector(".progress-entry a").focus()');assert.equal(await ev('getComputedStyle(document.activeElement).outlineStyle'),'solid');assert.equal(await ev('getComputedStyle(document.activeElement).outlineWidth'),'3px');
  await A.cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});await A.cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await pause(100);assert.equal(await ev('location.hash'),href);
  for(const [text,destination] of [['Explorar Aprender','#/aprender'],['Ver jogos','#/jogar'],['Voltar ao in\u00edcio','#/']]){await route('/meu-progresso');assert.equal(await ev('Array.from(document.querySelectorAll("main a")).find(e=>e.textContent.trim()==='+JSON.stringify(text)+').getAttribute("href")'),destination);}
  await ev('document.documentElement.dataset.reduceMotion="true"');assert.equal(await ev('getComputedStyle(document.querySelector(".navigation-return")).transitionDuration'),'0s');
  assert.deepEqual(errors,[]);assert.deepEqual(warnings,[]);console.log('PASS navigation actions on 25 routes x 7 widths x Normal/Grande x zoom 100/125%; primary/secondary appearance, 48/56px targets, labels, no overflow, focus/Enter and unchanged destinations. Screenshots: '+shots);
} finally {
  for(const socket of sockets)socket.close();chrome.kill();await server.close();await pause(500)
  const resolved=path.resolve(profile)
  if(path.dirname(resolved)!==tempRoot||!path.basename(resolved).startsWith('falalivre-navigation-'))throw Error('unsafe temporary path')
  try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:200})}catch{console.log('Temporary Chrome profile remains: '+resolved)}
}
