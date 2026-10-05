import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Audit-only harness. Native storage below belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4199, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-audit-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9349', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
for(let i=0;i<100;i++){try{targets=await(await fetch('http://127.0.0.1:9349/json/list')).json();if(targets.some(t=>t.type==='page'))break}catch{}await pause(100)}
const A=await connect(targets.find(t=>t.type==='page'));
await A.cdp('Page.addScriptToEvaluateOnNewDocument',{source:"window.__spoken=[];const s=new EventTarget();s.getVoices=()=>[];s.cancel=()=>{};s.speak=u=>window.__spoken.push(u.text);Object.defineProperty(window,'speechSynthesis',{value:s});window.SpeechSynthesisUtterance=class{constructor(t){this.text=t}}"});
await A.cdp('Page.navigate',{url:'http://127.0.0.1:4199/__audit#/'});await ready(A);
const route=async r=>{await A.evaluate('location.hash='+JSON.stringify(r));await pause(100)};
const click=async s=>{await A.evaluate('document.querySelector('+JSON.stringify(s)+').click()');await pause(100)};
const games=['caminho','quebra-cabeca','caca-palavras','memoria','encontre-imagem','onde-pertence'].map(g=>'/jogar/'+g);
const routes=['/','/aprender','/jogar','/aprender/comunicar','/aprender/palavras-frases','/aprender/escrever','/aprender/escrever/teclado','/aprender/escrever/caderno','/aprender/meu-dia-a-dia','/aprender/meu-dia-a-dia/rotinas','/aprender/meu-dia-a-dia/comunicacao','/aprender/meu-dia-a-dia/emocoes',...games,'/meu-progresso','/perfil','/responsaveis'];
await A.cdp('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:false});
for(const r of routes){await route(r);assert.ok(await A.evaluate('!!document.querySelector("main h1")'),r);assert.deepEqual(await A.evaluate('Array.from(document.images).filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)'),[],r)}
for(const width of [320,360,390,430,768,1024,1366]){
await A.cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
for(const large of [false,true]){await A.evaluate("document.documentElement.dataset.elementSize="+JSON.stringify(large?'large':'normal'));
for(const zoom of [1,1.25]){await A.evaluate('document.documentElement.style.zoom='+zoom);
for(const r of ['/','/aprender','/aprender/comunicar','/jogar/caca-palavras','/meu-progresso','/perfil','/responsaveis']){await route(r);const size=await A.evaluate('({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})');assert.ok(size.scroll<=size.client+1,JSON.stringify({r,width,large,zoom,size}))}}}}
await A.evaluate('document.documentElement.style.zoom="";document.documentElement.dataset.elementSize="normal"');
await route('/aprender/comunicar');await click('.communication-select');assert.ok(await A.evaluate('document.querySelector(".sentence-words").textContent.length>0'));
await click('.sentence-actions button');assert.ok(await A.evaluate('window.__spoken.length>0'));
await route('/jogar/quebra-cabeca');assert.equal(await A.evaluate('document.querySelectorAll(".puzzle-level")[1].getAttribute("aria-disabled")'),'true');
await click('.puzzle-tray button');assert.equal(await A.evaluate('document.querySelector(".puzzle-tray button").getAttribute("aria-pressed")'),'true');await click('.puzzle-slot');
for(let i=0;i<4 && !await A.evaluate('document.querySelector(".puzzle-board").dataset.solved === "true"');i++)await click('.puzzle-controls button');
assert.equal(await A.evaluate('document.querySelector(".puzzle-board").dataset.solved'),'true');
assert.equal(await A.evaluate('document.querySelectorAll(".puzzle-level")[1].getAttribute("aria-disabled")'),'false');
await route('/meu-progresso');assert.ok(await A.evaluate('document.querySelector("main").textContent.includes("Quebra")'));
if(await A.evaluate('!!document.querySelector("main summary")')){await A.evaluate('document.querySelector("main summary").focus()');for(const type of ['keyDown','keyUp'])await A.cdp('Input.dispatchKeyEvent',{type,key:' ',code:'Space',windowsVirtualKeyCode:32});assert.equal(await A.evaluate('document.querySelector("main details").open'),true)}
await route('/');await A.evaluate('document.documentElement.dataset.reduceMotion="true"');assert.equal(await A.evaluate('getComputedStyle(document.querySelector(".start-button")).transitionDuration'),'0s');
await A.evaluate('delete document.documentElement.dataset.reduceMotion');await A.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});assert.equal(await A.evaluate('getComputedStyle(document.querySelector(".start-button")).transitionDuration'),'0s');await A.cdp('Emulation.setEmulatedMedia',{features:[]});
const tokens=await A.evaluate('(()=>{const t=getComputedStyle(document.documentElement);return Object.fromEntries(["text","surface-page","surface","muted","primary","secondary","soft-blue","soft-green","success","warning","error","focus","border-control"].map(k=>[k,t.getPropertyValue("--"+k).trim()]))})()');
const actual=await A.evaluate('(()=>{const s=getComputedStyle(document.querySelector(".start-button"));return [s.color,s.backgroundColor]})()');
const combinations=[['text','surface-page'],['text','surface'],['muted','surface-page'],['primary','soft-blue'],['secondary','surface'],['success','soft-green'],['warning','surface'],['error','surface'],['focus','surface-page'],['focus','soft-blue'],['border-control','surface'],['border-control','soft-blue']];
const luminance=c=>{const values=c.startsWith('#')?[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)):c.match(/\d+/g).slice(0,3).map(Number);const l=values.map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return l[0]*.2126+l[1]*.7152+l[2]*.0722};
const pairs=combinations.map(([a,b])=>[a+'/'+b,tokens[a],tokens[b]]);pairs.push(['primary actual',...actual]);
const contrasts=pairs.map(([name,a,b])=>{const x=luminance(a),y=luminance(b),ratio=(Math.max(x,y)+.05)/(Math.min(x,y)+.05);assert.ok(ratio>=(/focus|border/.test(name)?3:4.5),name+' '+ratio);return {name,ratio:Number(ratio.toFixed(2))}});
assert.deepEqual(errors,[]);assert.deepEqual(warnings,[]);console.log(JSON.stringify({result:'PASS',routes:routes.length,widths:[320,360,390,430,768,1024,1366],modes:'normal/Grande x zoom 100/125%',smoke:'selection, mocked audio, puzzle placement/completion/unlock, progress, Space summary, preference/OS reduced motion',contrasts,consoleErrors:0,consoleWarnings:0},null,2));
} finally {
for(const socket of sockets)socket.close();chrome.kill();await server.close();await pause(500);
const resolved=path.resolve(profile);if(path.dirname(resolved)!==tempRoot||!path.basename(resolved).startsWith('falalivre-audit-'))throw Error('unsafe temporary path');
try{fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:200})}catch{console.log('Temporary Chrome profile remains: '+resolved)}
}
