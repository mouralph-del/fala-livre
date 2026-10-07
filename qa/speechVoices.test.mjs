import assert from 'node:assert/strict'
import fs from 'node:fs'
let saved=null, voices=[], spoken=[], cancels=0
const synth=new EventTarget();synth.getVoices=()=>voices;synth.cancel=()=>cancels++;synth.speak=u=>spoken.push(u)
globalThis.window={speechSynthesis:synth,SpeechSynthesisUtterance:class{constructor(text){this.text=text}}}
globalThis.__preferences=()=>({voice:saved})
const source=fs.readFileSync('src/utils/speech.js','utf8').replace("import { getPreferences } from './preferences'",'const getPreferences=globalThis.__preferences')
const m=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
assert.equal(spoken.length,0);assert.equal(m.isSpeechReady(),false)
let updates=0;const off=m.subscribeVoices(()=>updates++)
const en={name:'Default English',voiceURI:'en',lang:'en-US',default:true,localService:true}
const pt={name:'Portuguese',voiceURI:'pt',lang:'pt-PT',localService:true}
const br={name:'Remote Brazilian',voiceURI:'br',lang:'pt-BR',localService:false}
const local={name:'Local Brazilian',voiceURI:'local',lang:'pt_BR',localService:true}
voices=[en,pt,br,local];synth.dispatchEvent(new Event('voiceschanged'))
assert.ok(updates>0);assert.equal(spoken.length,0);assert.equal(m.isSpeechReady(),true)
assert.deepEqual(m.getCommunicationVoices(),[br,local,pt])
m.falar('Teste');assert.equal(spoken.at(-1).voice,local)
assert.equal(spoken.at(-1).rate,.9);assert.equal(spoken.at(-1).pitch,1.05);assert.equal(spoken.at(-1).volume,1)
const refreshedLocal={...local},betterBrazilian={...br,default:true,localService:true}
voices=[betterBrazilian,pt,en,refreshedLocal];synth.dispatchEvent(new Event('voiceschanged'))
for(const text of ['A','Casa','Eu quero água.','Olá! Vamos aprender juntos.']) {
  m.falar(text);assert.equal(spoken.at(-1).voice,refreshedLocal,'automatic voice stays stable despite list order/score changes')
}
saved=m.voiceIdentifier(br);m.falar('Manual');assert.equal(spoken.at(-1).voice,betterBrazilian)
voices=[refreshedLocal,betterBrazilian,en,pt];synth.dispatchEvent(new Event('voiceschanged'))
for(const text of ['B','Bola','Eu quero brincar.','Olá! Vamos aprender juntos.']) { m.falar(text);assert.equal(spoken.at(-1).voice,betterBrazilian) }
saved=m.voiceIdentifier(en);m.falar('Other language');assert.equal(spoken.at(-1).voice,en,'manual non-Portuguese voice is honored')
saved='Portuguese';m.falar('Legacy name');assert.equal(spoken.at(-1).voice,pt,'existing name-only preferences are compatible')
saved=m.voiceIdentifier(br)
voices=[en,pt];synth.dispatchEvent(new Event('voiceschanged'));m.falar('Missing');assert.equal(spoken.at(-1).voice,pt)
assert.equal(spoken.at(-1).lang,'pt-PT');assert.equal(saved,m.voiceIdentifier(br),'temporary absence does not destroy saved preference')
saved=null;voices=[en];synth.dispatchEvent(new Event('voiceschanged'));m.falar('Fallback');assert.equal(spoken.at(-1).voice,en)
voices=[];synth.dispatchEvent(new Event('voiceschanged'));m.falar('Empty');assert.equal(spoken.at(-1).voice,undefined)
voices=[local];synth.dispatchEvent(new Event('voiceschanged'));const before=cancels;m.falar('A');m.falar('B');assert.equal(cancels,before+2)
const interrupted=spoken.at(-2);assert.equal(interrupted.onerror,null,'canceled utterance cannot report stale errors')
const speechCount=spoken.length;synth.dispatchEvent(new Event('voiceschanged'));assert.equal(spoken.length,speechCount,'voice list changes do not start queued speech')
saved=m.voiceIdentifier(br);m.falar('Missing saved voice');assert.equal(spoken.at(-1).voice,local)
voices=[];synth.dispatchEvent(new Event('voiceschanged'));assert.equal(m.isSpeechReady(),false)
voices=[br,local];synth.dispatchEvent(new Event('voiceschanged'));m.falar('Saved voice returns');assert.equal(spoken.at(-1).voice,br)
let message='';spoken.at(-1).onerror({error:'network'});assert.equal(m.falar('C',s=>message=s),true);spoken.at(-1).onerror({error:'network'});assert.ok(message)
off();delete window.speechSynthesis;assert.equal(m.falar('Unavailable',s=>message=s),false)
console.log('PASS automatic pt-BR/local/default, Portuguese/engine fallback, empty/async voiceschanged, manual/missing voice, parameters, cancellation, manual-only startup and unavailable engine')
