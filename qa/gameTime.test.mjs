import assert from 'node:assert/strict'
import fs from 'node:fs'
const core = fs.readFileSync('src/utils/gameTimeCore.js', 'utf8')
const url = 'data:text/javascript;base64,' + Buffer.from(core).toString('base64')
const { limitMs, localDay, dailyUsage, consume, isPlayRoute, GAME_TIME_KEY } = await import(url)
const runtime = fs.readFileSync('src/utils/gameTime.js', 'utf8').replace("import { getPreferences, subscribePreferences } from './preferences'", 'const getPreferences=()=>({gameTimeLimit:"unlimited"});const subscribePreferences=()=>()=>{}').replace("'./gameTimeCore'", JSON.stringify(url))
const { createGameTimeTracker } = await import('data:text/javascript;base64,' + Buffer.from(runtime).toString('base64'))
for (const [mode, expected] of [['unlimited', Infinity], ['15', 15], ['30', 30], ['45', 45], ['60', 60], ['custom', 7]]) assert.equal(limitMs({gameTimeLimit:mode,customGameMinutes:7}), expected === Infinity ? Infinity : expected*60000)
let clock = new Date(2026, 9, 6, 12).getTime(), hash='#/', shown=true, prefs={gameTimeLimit:'15',customGameMinutes:7}
const values=new Map([['falaLivre_progress_v1','preserved'],['falaLivre_contentRotation_v1','preserved']])
const storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}
const options={now:()=>clock,storage,route:()=>hash,visible:()=>shown,preferences:()=>prefs}
const tracker=createGameTimeTracker(options)
let notifications=0;const off=tracker.subscribe(()=>notifications++)
const advance=ms=>{clock+=ms;tracker.tick()}
for(const route of ['#/','#/aprender','#/perfil','#/responsaveis','#/meu-progresso','#/aprender/meu-dia-a-dia/rotinas']){hash=route;tracker.tick();advance(60000)}
assert.equal(tracker.getSnapshot().consumedMs,0)
hash='#/jogar/memoria';tracker.tick();advance(60000);assert.equal(tracker.getSnapshot().consumedMs,60000)
tracker.tick();tracker.tick();assert.equal(tracker.getSnapshot().consumedMs,60000,'same timestamp/repeated tick never duplicates time')
shown=false;tracker.tick();advance(600000);assert.equal(tracker.getSnapshot().consumedMs,60000)
shown=true;tracker.tick();hash='#/aprender';tracker.tick();advance(600000);assert.equal(tracker.getSnapshot().consumedMs,60000)
assert.equal(createGameTimeTracker(options).getSnapshot().consumedMs,60000,'refresh preserves usage')
hash='#/jogar';tracker.tick();advance(14*60000);assert.equal(tracker.getSnapshot().exhausted,true)
advance(60000);assert.equal(tracker.getSnapshot().consumedMs,15*60000)
prefs={...prefs,gameTimeLimit:'30'};tracker.tick();assert.equal(tracker.getSnapshot().exhausted,false)
prefs={...prefs,gameTimeLimit:'15'};tracker.tick();assert.equal(tracker.getSnapshot().exhausted,true)
prefs={...prefs,gameTimeLimit:'unlimited'};tracker.tick();assert.equal(tracker.getSnapshot().exhausted,false);assert.equal(tracker.getSnapshot().consumedMs,15*60000,'restoring unlimited preserves today usage')
tracker.suspend();advance(600000);assert.equal(tracker.getSnapshot().consumedMs,15*60000,'pagehide/BFCache absence excluded')
tracker.suspend();clock=new Date(2026,9,7,0,0,5).getTime();hash='#/perfil';shown=false;tracker.tick();assert.equal(tracker.getSnapshot().consumedMs,0)
assert.equal(tracker.getSnapshot().day,localDay(clock))
const midnight=new Date(2026,9,8).getTime()
assert.equal(consume({day:localDay(midnight-1),consumedMs:50},midnight-1000,midnight+1000,true,{gameTimeLimit:'15'}).consumedMs,1000)
assert.equal(dailyUsage({day:localDay(clock),consumedMs:-1},clock).consumedMs,0)
assert.equal(dailyUsage({day:localDay(clock),consumedMs:'bad'},clock).consumedMs,0)
assert.equal(isPlayRoute('#/jogar/sequencias'),true);assert.equal(isPlayRoute('#/aprender'),false)
assert.equal(values.get('falaLivre_progress_v1'),'preserved');assert.equal(values.get('falaLivre_contentRotation_v1'),'preserved')
assert.deepEqual(Object.keys(JSON.parse(values.get(GAME_TIME_KEY))).sort(),['consumedMs','day'])
assert.ok(notifications>0);off()
console.log('PASS presets/custom, persistence, routes, visibility, repeated ticks, exhaustion, changes/restoration, midnight, BFCache, progress/rotation isolation')
