import test from 'node:test';import assert from 'node:assert/strict';
import {seedState,parseLibrary} from '../lib/learning.ts';
import {captureInbox} from '../lib/capture.ts';
import {orderedIntents,remindDay,dueSaves,searchSaves,saveTitle,DEFAULT_INTENTS} from '../lib/saves.ts';
import {prepareScreenshotAI,prepareRecallAI} from '../lib/saves-ai.ts';
import {prepareOfflineAI} from '../lib/offline-ai.ts';
const tz='Asia/Kolkata';
const base=()=>{const s=seedState();s.settings={...s.settings,timezone:tz};return parseLibrary(s);};
const IMG='0123abcd-0123-4567-89ab-0123456789ab.jpg';

test('a save keeps why, intent, reminder and screenshot; an old-style capture serializes exactly as before',()=>{
 let s=captureInbox(base(),'https://x.com/a/status/1','personal','shared','a',new Date('2026-11-21T05:00:00Z'),{why:'  explain partitions in my interview ',intent:'For interview',remindOn:'2026-11-22',image:IMG});
 s=captureInbox(s,'Plain note','personal','typed','b',new Date('2026-11-21T05:00:00Z'));
 s=parseLibrary(s);
 const a=s.inbox.find(i=>i.id==='a'),b=s.inbox.find(i=>i.id==='b');
 assert.equal(a.why,'explain partitions in my interview');assert.equal(a.intent,'For interview');assert.equal(a.remindOn,'2026-11-22');assert.equal(a.image,IMG);
 assert.deepEqual(Object.keys(b).sort(),['createdAt','id','source','status','text','workspace']);
});
test('a screenshot with no text still saves as a screenshot, keeping your why separately',()=>{
 const s=captureInbox(base(),'','personal','shared','c',new Date(),{image:IMG});
 assert.equal(s.inbox[0].text,'Screenshot');
 const t=captureInbox(base(),'','personal','shared','d',new Date(),{image:IMG,why:'bathtub for small bathroom'});
 assert.equal(t.inbox[0].text,'Screenshot');assert.equal(t.inbox[0].why,'bathtub for small bathroom');
});
test('unsafe image names are rejected',()=>{
 assert.throws(()=>parseLibrary(captureInbox(base(),'x','personal','typed','e',new Date(),{image:'../../library.json'})));
});
test('intents you use most come first',()=>{
 let s=base();for(const [id,intent] of [['1','Buy'],['2','Buy'],['3','Idea'],['4','For the shop'],['5','For the shop'],['6','For the shop']])s=captureInbox(s,'n'+id,'personal','typed',id,new Date(),{intent});
 const order=orderedIntents(s.inbox);assert.deepEqual(order.slice(0,3),['For the shop','Buy','Idea']);assert.equal(order.length,DEFAULT_INTENTS.length);
});
test('reminder days are in your timezone: tonight, tomorrow, the coming weekend, next Monday',()=>{
 const fri=new Date('2026-11-20T15:00:00Z');// 20:30 IST Friday
 assert.equal(remindDay('tonight',tz,fri),'2026-11-20');assert.equal(remindDay('tomorrow',tz,fri),'2026-11-21');
 assert.equal(remindDay('weekend',tz,fri),'2026-11-21');assert.equal(remindDay('nextweek',tz,fri),'2026-11-23');
 const sun=new Date('2026-11-22T06:00:00Z');assert.equal(remindDay('weekend',tz,sun),'2026-11-22');assert.equal(remindDay('nextweek',tz,sun),'2026-11-23');
 const lateFri=new Date('2026-11-20T19:00:00Z');// 00:30 IST Saturday
 assert.equal(remindDay('tonight',tz,lateFri),'2026-11-21');
});
test('saved-for-today shows reminders that have come due, only while still to review',()=>{
 let s=base();
 s=captureInbox(s,'due','personal','typed','due',new Date(),{remindOn:'2026-11-20'});
 s=captureInbox(s,'later','personal','typed','later',new Date(),{remindOn:'2026-11-30'});
 s=captureInbox(s,'filed','personal','typed','filed',new Date(),{remindOn:'2026-11-19'});
 s={...s,inbox:s.inbox.map(i=>i.id==='filed'?{...i,status:'filed'}:i)};
 assert.deepEqual(dueSaves(s,'personal',new Date('2026-11-21T05:00:00Z')).map(i=>i.id),['due']);
});
test('search finds saves by your why, intent or screenshot text, all words required',()=>{
 let s=base();
 s=captureInbox(s,'https://www.amazon.in/dp/B0X','personal','shared','tub',new Date('2026-11-01T00:00:00Z'),{why:'bathtub for the small bathroom',intent:'Buy'});
 s=captureInbox(s,'Screenshot','personal','shared','shot',new Date('2026-11-02T00:00:00Z'),{image:IMG});
 s={...s,inbox:s.inbox.map(i=>i.id==='shot'?{...i,imageText:'Kafka stores messages in partitions on disk',title:'Kafka storage thread'}:i)};
 assert.deepEqual(searchSaves(s.inbox,'small bathroom').map(i=>i.id),['tub']);
 assert.deepEqual(searchSaves(s.inbox,'partition').map(i=>i.id),['shot']);
 assert.deepEqual(searchSaves(s.inbox,'buying').map(i=>i.id),['tub']);
 assert.deepEqual(searchSaves(s.inbox,'kafka bathroom'),[]);
 assert.equal(saveTitle(s.inbox.find(i=>i.id==='shot')),'Kafka storage thread');
});
test('screenshot AI request sends the image and asks for strict JSON; bad images are refused; links are cleaned',()=>{
 const img='data:image/jpeg;base64,AAAA';
 const {body,parse}=prepareScreenshotAI({image:img,why:'tile ideas'});
 assert.equal(body.input[0].content[1].type,'input_image');assert.equal(body.text.format.strict,true);assert.match(body.instructions,/untrusted/);
 assert.throws(()=>prepareScreenshotAI({image:'https://evil.example/x.jpg'}));
 const out=parse({output:[{content:[{type:'output_text',text:JSON.stringify({title:'Tiles',gist:'g',text:'t',urls:['https://shop.example/tile','not a link'],kind:'product'})}]}]});
 assert.deepEqual(out.urls,['https://shop.example/tile']);
});
test('recall request numbers items instead of sending IDs',()=>{
 const {body}=prepareRecallAI({query:'that bathtub',items:[{title:'Tub',why:'small bathroom',intent:'Buy',text:'',date:'2026-11-01'}]});
 assert.deepEqual(JSON.parse(body.input).items[0].n,1);assert.ok(!body.input.includes('"id"'));
});
test('offline AI routes screenshot and recall modes with validation',()=>{
 assert.equal(prepareOfflineAI('/api/coach',{mode:'screenshot',image:'data:image/jpeg;base64,AAAA'}).body.text.format.name,'saved_screenshot');
 assert.equal(prepareOfflineAI('/api/coach',{mode:'recall',query:'q',items:[{title:'t',why:'',intent:'',text:'',date:'2026-11-01'}]}).body.text.format.name,'saved_recall');
 assert.throws(()=>prepareOfflineAI('/api/coach',{mode:'recall',query:'',items:[]}));
});

test('Find by meaning accepts older saves beside new saves without changing metadata',()=>{
 const legacy={title:'Distributed systems notes',text:'Read about replication',date:'2026-11-01'};
 const newer={title:'Kafka notes',why:'interview prep',intent:'For interview',text:'Log compaction',date:'2026-11-21'};
 const request=prepareOfflineAI('/api/coach',JSON.parse(JSON.stringify({mode:'recall',query:'storage ideas',items:[legacy,newer]})));
 const items=JSON.parse(request.body.input).items;
 assert.deepEqual(items,[{n:1,...legacy,why:'',intent:''},{n:2,...newer}]);
 assert.deepEqual(request.parse({output:[{content:[{type:'output_text',text:'{"matches":[{"n":1,"reason":"Notes about storage replication"}]}'}]}]}).matches,[{n:1,reason:'Notes about storage replication'}]);
 assert.throws(()=>prepareOfflineAI('/api/coach',{mode:'recall',query:'storage',items:[{...legacy,why:123}]}),{message:'Could not search your saves by meaning. Try a shorter description or use word search.'});
});
