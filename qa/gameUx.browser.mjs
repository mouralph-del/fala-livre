import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createServer } from 'vite'

// Targeted navigation styling harness. Native storage belongs to an isolated Chrome
// profile and temporary origin, never the user's browser or application data.
const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
const server = await createServer({ server: { host: '127.0.0.1', port: 4211, strictPort: true }, plugins: [{ name: 'progress-audit', configureServer(server) { server.middlewares.use('/__audit', async (request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__audit', html)) }) } }] })
await server.listen()
const tempRoot = path.resolve(os.tmpdir()), profile = fs.mkdtempSync(path.join(tempRoot, 'falalivre-game-ux-'))
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9361', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore', windowsHide: true })
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
  for (let i = 0; i < 100; i++) { try { targets = await (await fetch('http://127.0.0.1:9361/json/list')).json(); if (targets.some(t => t.type === 'page')) break } catch { /* Chrome startup. */ } await pause(100) }
  const A = await connect(targets.find(t => t.type === 'page')), ev = A.evaluate
  await A.cdp('Page.addScriptToEvaluateOnNewDocument', { source: `window.__spoken=[];speechSynthesis.speak=u=>window.__spoken.push(u.text);speechSynthesis.cancel=()=>{};localStorage.setItem('falalivre.demo-session.v1',JSON.stringify({demo:true,responsibleName:'Alex',userName:'Noa'}));localStorage.setItem('falalivre.preferences',JSON.stringify({reduceMotion:true}))` })
  await A.cdp('Page.navigate', { url: 'http://127.0.0.1:4211/__audit#/' }); await ready(A)
  const route = async hash => { await ev('location.hash=' + JSON.stringify(hash)); await pause(80) }
  const click = async selector => { await ev('document.querySelector(' + JSON.stringify(selector) + ').click()'); await pause(35) }
  const action = async text => { await ev(`Array.from(document.querySelectorAll('main button')).find(b=>b.textContent.trim()===${JSON.stringify(text)}).click()`); await pause(50) }
  const press = async key => { for (const type of ['keyDown', 'keyUp']) await A.cdp('Input.dispatchKeyEvent', { type, key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: { Enter: 13, Escape: 27, Tab: 9, ' ': 32 }[key], ...(type === 'keyDown' && key === 'Enter' ? { text: '\r' } : {}) }); await pause(40) }
  const viewport = async width => A.cdp('Emulation.setDeviceMetricsOverride', { width, height: 1800, deviceScaleFactor: 1, mobile: false })
  const shotDirectory = path.join(os.tmpdir(), 'falalivre-game-ux-review'); fs.mkdirSync(shotDirectory, { recursive: true })
  const screenshot = async name => { const shot = await A.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 75, captureBeyondViewport: true }); fs.writeFileSync(path.join(shotDirectory, name + '.jpg'), Buffer.from(shot.data, 'base64')) }
  async function responsiveBoard(selector) {
    for(const width of [320,360,390,430,768,1024,1366])for(const size of ['normal','large'])for(const zoom of [1,1.25]){
      await viewport(width);await ev(`document.documentElement.dataset.elementSize='${size}';document.documentElement.style.zoom=${zoom}`)
      const bounds=await ev('({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,outside:Array.from(document.querySelectorAll("main *")).filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth+1).slice(0,8).map(e=>e.className)})')
      assert.ok(bounds.scroll<=bounds.client+1,JSON.stringify({selector,width,size,zoom,bounds}))
      const clipping=await ev(`Array.from(document.querySelectorAll('${selector}')).filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>({text:e.textContent,scroll:e.scrollWidth,client:e.clientWidth,font:getComputedStyle(e).fontSize,border:getComputedStyle(e).borderTopWidth}))`)
      assert.deepEqual(clipping,[],JSON.stringify({selector,width,size,zoom}))
    }
    await ev('document.documentElement.style.zoom="";document.documentElement.dataset.elementSize="normal"');await viewport(1366)
  }

  // Real mouse and touch events exercise pointer capture, preview and drop.
  async function dragPiece(id, target, { touch = false, cancel = false, escape = false, outside = false } = {}) {
    await ev('window.scrollTo(0,0)')
    const coords = await ev(`(()=>{const a=document.querySelector('.puzzle-tray [data-piece="${id}"]')??document.querySelector('.puzzle-board [data-piece="${id}"]'),b=document.querySelector('[data-slot="${target}"]');const r=a.getBoundingClientRect(),s=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,dx:${outside ? '4' : 's.x+s.width/2'},dy:${outside ? '4' : 's.y+s.height/2'}}})()`)
    if (touch) await A.cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 })
    const move = async (type, x, y) => touch
      ? A.cdp('Input.dispatchTouchEvent', { type, touchPoints: [{ x, y, radiusX: 2, radiusY: 2, force: 1, id: 1 }] })
      : A.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: 1, clickCount: 1 })
    await move(touch ? 'touchStart' : 'mousePressed', coords.x, coords.y)
    await move(touch ? 'touchMove' : 'mouseMoved', (coords.x + coords.dx) / 2, (coords.y + coords.dy) / 2); await pause(40)
    assert.equal(await ev('!!document.querySelector(".puzzle-drag")'), true, JSON.stringify({ id, target, touch, coords }))
    assert.equal(await ev('document.querySelector(".puzzle-drag").getAttribute("aria-hidden")'), 'true')
    await move(touch ? 'touchMove' : 'mouseMoved', coords.dx, coords.dy); await pause(40)
    const preview=await ev('(()=>{const r=document.querySelector(".puzzle-drag").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()')
    assert.ok(Math.abs(preview.x-coords.dx)<2&&Math.abs(preview.y-coords.dy)<2,JSON.stringify({preview,coords}))
    if (!outside) assert.equal(await ev('document.querySelector(".puzzle-slot--over")?.dataset.slot'), String(target))
    if (escape) await press('Escape')
    if (touch) await A.cdp('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] })
    else await A.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: coords.dx, y: coords.dy, button: 'left', buttons: 0, clickCount: 1 })
    await pause(80)
    assert.equal(await ev('!!document.querySelector(".puzzle-drag")'), false)
    if (!cancel && !escape && !outside) assert.equal(await ev(`document.querySelector('[data-slot="${target}"]').dataset.piece`), id)
    if (touch) await A.cdp('Emulation.setTouchEmulationEnabled', { enabled: false })
  }
  await viewport(1366); await route('/jogar/quebra-cabeca')
  assert.equal(await ev('!!document.querySelector(".puzzle-scene,.puzzle-number")'), false)
  assert.equal(await ev('document.querySelector(".puzzle-empty").textContent'), '')
  await dragPiece('row-0-col-0', 0)
  await dragPiece('row-0-col-1', 1)
  await dragPiece('row-0-col-0', 1) // Board-to-board keeps the old swap semantics.
  assert.equal(await ev(`document.querySelector('[data-slot="0"]').dataset.piece`), 'row-0-col-1')
  await action('Reiniciar')
  for (const options of [{ escape: true }, { touch: true, cancel: true }, { outside: true }]) {
    await dragPiece('row-0-col-0', 0, options)
    assert.equal(await ev('document.querySelectorAll(".puzzle-board [data-piece]").length'), 0)
  }
  const emptyPoint=await ev('(()=>{const r=document.querySelector("[data-slot=\\\"0\\\"]").getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()')
  for(const type of ['mousePressed','mouseReleased'])await A.cdp('Input.dispatchMouseEvent',{type,...emptyPoint,button:'left',clickCount:1})
  await pause(50);assert.equal(await ev(`document.querySelector('[data-slot="0"]').dataset.piece`),'row-0-col-0');await action('Reiniciar')
  for (let level = 0; level < 3; level++) {
    if (level) await click(`.puzzle-level:nth-child(${level + 1})`)
    await viewport(390)
    await dragPiece('row-0-col-0', 0, { touch: true })
    // Native Enter and Space remain a complete alternative to dragging.
    await ev(`document.querySelector('.puzzle-tray [data-piece="row-0-col-1"]').focus()`); await press('Enter')
    await ev(`document.querySelector('[data-slot="1"]').focus()`); await press(' ')
    assert.equal(await ev(`document.querySelector('[data-slot="1"]').dataset.piece`), 'row-0-col-1')
    await action('Preciso de ajuda')
    assert.equal(await ev('document.querySelector(".puzzle-status").textContent.includes("Pista:")'), false)
    assert.equal(await ev('getComputedStyle(document.querySelector(".puzzle-slot--hint"),"::after").borderTopStyle'), 'none')
    const pieces = await ev('Array.from(document.querySelectorAll(".puzzle-tray [data-piece]"),e=>e.dataset.piece)')
    const columns = level === 0 ? 2 : 3
    for (const id of pieces) { const [, row, , col] = id.split('-'); await click(`.puzzle-tray [data-piece="${id}"]`); await click(`[data-slot="${Number(row) * columns + Number(col)}"]`) }
    assert.equal(await ev('document.querySelector(".puzzle-board").dataset.solved'), 'true')
    assert.equal(await ev('document.activeElement.id'), 'puzzle-success-title')
    if (level < 2) assert.equal(await ev(`document.querySelectorAll('.puzzle-level')[${level + 1}].getAttribute('aria-disabled')`), 'false')
  }
  // N3 uses the same two square images, side by side on a wider canvas.
  const ratio = await ev('document.querySelector(".puzzle-activity").style.getPropertyValue("--image-ratio")'); assert.equal(ratio, '2')
  await viewport(1366);await screenshot('puzzle-n3-complete')
  await action('Jogar novamente')
  for (const width of [320,360,390,430,768,1024,1366]) for (const size of ['normal','large']) for (const zoom of [1,1.25]) {
    await viewport(width); await ev(`document.documentElement.dataset.elementSize='${size}';document.documentElement.style.zoom=${zoom}`)
    await action('Reiniciar')
    const overflow=await ev('({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth,outside:Array.from(document.querySelectorAll("main *")).filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth+1).slice(0,8).map(e=>e.className)})')
    assert.ok(overflow.scroll<=overflow.client+1, JSON.stringify({ width, size, zoom,overflow }))
    assert.ok(await ev(`Array.from(document.querySelectorAll('.puzzle-slot'),e=>e.getBoundingClientRect().height/${zoom}).every(h=>h>=${size === 'large' ? 55 : 47})`))
    await dragPiece('row-0-col-0',0,{touch:true})
    assert.ok(await ev('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'))
    if (zoom === 1 && [320,1366].includes(width)) await screenshot(`puzzle-n3-${width}-${size}`)
  }
  await ev('document.documentElement.style.zoom="";document.documentElement.dataset.elementSize="normal"')
  await viewport(1366); await route('/jogar/caca-palavras')
  const wordLevels = await ev('(async()=>{const {wordSearchLevels}=await import("/src/data/wordSearchLevels.js");return wordSearchLevels})()')
  assert.equal(await ev('(async()=>{const {wordSearchLevels:l,canExtendSelection:c}=await import("/src/data/wordSearchLevels.js");return !c(l[0],[0],7)&&!c(l[1],[0],7)&&c(l[2],[56],49)})()'), true)
  for (let level = 0; level < 3; level++) {
    if (level) await click(`.wordsearch-level:nth-child(${level + 1})`)
    for (const [color, word] of wordLevels[level].words.entries()) {
      for (const cell of word.cells) await click(`[data-cell="${cell}"]`)
      const row = await ev(`document.querySelectorAll('.wordsearch-vocabulary li')[${color}].dataset.foundColor`); assert.equal(row, String(color))
      for (const cell of word.cells) assert.ok((await ev(`document.querySelector('[data-cell="${cell}"]').dataset.foundColor`)).split(' ').includes(String(color)))
      assert.match(await ev(`document.querySelectorAll('.wordsearch-vocabulary li')[${color}].textContent`), /Encontrada/)
      assert.match(await ev(`getComputedStyle(document.querySelector('[data-cell="${word.cells[0]}"]')).textDecorationLine`), /underline/)
    }
  }
  assert.equal(await ev('new Set(Array.from(document.querySelectorAll(".wordsearch-vocabulary li"),e=>getComputedStyle(e).backgroundColor)).size'), 4)
  await responsiveBoard('.wordsearch-cell')
  await screenshot('wordsearch-n3-found')
  await route('/jogar/caminho')
  for (let level = 0; level < 3; level++) {
    if (level) await click(`.path-level:nth-child(${level + 1})`)
    assert.equal(await ev('Array.from(document.querySelectorAll(".path-node span")).some(e=>e.textContent==="→")'), false)
    await action('Preciso de ajuda')
    const next = await ev('document.querySelector(".path-node--hint").dataset.node')
    const start = await ev('document.querySelector(".path-player").dataset.position')
    await click(`[data-node="${next}"]`); await action('Voltar um passo')
    assert.equal(await ev('document.querySelector(".path-player").dataset.position'), start)
    await action('Reiniciar')
    for (let step = 0; step < 30 && !await ev('!!document.querySelector(".path-result")'); step++) {
      const next = await ev(`(async()=>{const {pathGameLevels,nextPathStep}=await import('/src/data/pathGameLevels.js');return nextPathStep(pathGameLevels[${level}],document.querySelector('.path-player').dataset.position)})()`)
      await click(`[data-node="${next}"]`)
    }
    assert.equal(await ev('!!document.querySelector(".path-result")'), true)
  }
  await responsiveBoard('.path-node')
  await route('/jogar/memoria')
  assert.equal(await ev('Array.from(document.querySelectorAll(".memory-card-back")).some(e=>/Carta \d/.test(e.textContent))'), false)
  assert.ok(await ev('getComputedStyle(document.querySelector(".memory-card-back")).backgroundImage.includes("radial-gradient")'))
  await action('Preciso de ajuda'); assert.ok(await ev('!!document.querySelector(".memory-card--hint")'))
  await screenshot('memory-closed')
  for(let level=0;level<3;level++){
    if(level)await click(`.memory-level:nth-child(${level+1})`)
    const words=await ev('Array.from(new Set(Array.from(document.querySelectorAll(".memory-card-front strong"),e=>e.textContent)))')
    for(const word of words)for(let card=0;card<2;card++){
      await ev(`Array.from(document.querySelectorAll('.memory-card')).find(e=>e.getAttribute('aria-disabled')!=='true'&&e.querySelector('.memory-card-front strong').textContent===${JSON.stringify(word)}).click()`);await pause(40)
    }
    assert.equal(await ev('!!document.querySelector(".memory-success")'),true)
  }
  await responsiveBoard('.memory-card')

  // Contrast is checked with both the card and its actual CTA forced into hover.
  await ev('document.documentElement.dataset.reduceMotion="false"')
  await A.cdp('DOM.enable'); await A.cdp('CSS.enable')
  for (const [hash, card, button] of [['/','.activity-card','.start-button'],['/aprender','.learning-card','.learning-start'],['/jogar','.game-card','.game-start'],['/aprender/meu-dia-a-dia','.my-day-option','.my-day-start']].filter(([hash])=>!process.argv.includes('--games-only')||hash==='/jogar')) {
    await route(hash)
    const root = await A.cdp('DOM.getDocument')
    const nodes = await A.cdp('DOM.querySelectorAll', { nodeId: root.root.nodeId, selector: card })
    for (const [index, nodeId] of nodes.nodeIds.entries()) {
      const control = await A.cdp('DOM.querySelector', { nodeId, selector: button })
      await A.cdp('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] }); await A.cdp('CSS.forcePseudoState', { nodeId: control.nodeId, forcedPseudoClasses: ['hover'] }); await pause(180)
      const style = await ev(`(()=>{const e=document.querySelectorAll('${card}')[${index}].querySelector('${button}'),s=getComputedStyle(e);return {color:s.color,background:s.backgroundColor,opacity:s.opacity}})()`)
      assert.equal(style.color, 'rgb(255, 255, 255)'); assert.ok(['rgb(49, 95, 140)','rgb(33, 78, 122)'].includes(style.background)); assert.equal(style.opacity,'1')
      await ev('document.documentElement.dataset.reduceMotion="true"')
      assert.equal(await ev(`getComputedStyle(document.querySelectorAll('${card}')[${index}]).transform`),'none')
      await ev('document.documentElement.dataset.reduceMotion="false"')
      await A.cdp('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] }); await A.cdp('CSS.forcePseudoState', { nodeId: control.nodeId, forcedPseudoClasses: [] })
    }
    if (hash !== '/') assert.ok(await ev('document.querySelector("main header,main .learn-intro").getBoundingClientRect().height<150'))
    await screenshot('hub-'+(hash==='/'?'home':hash.slice(1).replaceAll('/','-')))
  }
  for (const hash of ['/aprender/comunicar','/aprender/palavras-frases','/aprender/escrever','/aprender/meu-dia-a-dia/emocoes','/aprender/meu-dia-a-dia/rotinas','/aprender/meu-dia-a-dia/comunicacao',...['caminho','quebra-cabeca','caca-palavras','memoria','encontre-imagem','onde-pertence'].map(g=>'/jogar/'+g)].filter(hash=>!process.argv.includes('--games-only')||hash.startsWith('/jogar/'))) { await route(hash); assert.equal(await ev('document.querySelector("main").textContent.includes("ARASAAC")'), false, hash) }
  if(!process.argv.includes('--games-only')) {
  await route('/responsaveis')
  assert.ok(await ev('document.querySelector("main").textContent.includes("Sergio Palao")'))
  assert.ok(await ev(`(async()=>{const a=Array.from(document.querySelectorAll('main a')).find(a=>a.textContent.startsWith('Créditos detalhados'));const r=await fetch(a.href);return r.ok&&(await r.text()).includes('CC BY-NC-SA 4.0')})()`))
  }
  assert.deepEqual(errors, []); assert.deepEqual(warnings, [])
  console.log('PASS: puzzle N1/N2/N3, real mouse/touch drag, swaps, Escape/cancel/outside, native Enter/Space, help, restart, completion/unlock; 3x3 seven widths Normal/Grande 125%; path three levels; wordsearch rules/four colors/shared cells/labels; memory backs; targeted hub hover contrast. Screenshots: '+shotDirectory)
} finally {
  for (const socket of sockets) socket.close(); chrome.kill(); await server.close(); await pause(500)
  const resolved = path.resolve(profile)
  if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith('falalivre-game-ux-')) throw Error('unsafe temporary path')
  try { fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { console.log('Temporary Chrome profile remains: ' + resolved) }
}
