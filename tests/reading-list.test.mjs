import test from 'node:test';import assert from 'node:assert/strict';
import {seedState,parseLibrary,dailyPlan} from '../lib/learning.ts';
import {saveSharedReading} from '../lib/capture.ts';
import {readingCategories,suggestCategory,isAsap,setAsap,asapDue,weekDeadline,DEFAULT_CATEGORIES} from '../lib/reading.ts';
const now=new Date('2026-10-29T05:00:00Z');
const base=()=>{const s=seedState();s.settings={...s.settings,timezone:'UTC'};return parseLibrary(s);};
test('share with your own title, a category and Read ASAP',()=>{
 const s=saveSharedReading(base(),{id:'share1',text:'Long post text\n— fardeen\nhttps://x.com/fardeentwt/status/2115416659884441711',title:'Why purpose matters',workspace:'personal',category:'Productivity',asap:true},now);
 const r=s.resources.find(x=>x.url==='https://x.com/fardeentwt/status/2115416659884441711');
 assert.equal(r.title,'Why purpose matters');assert.equal(r.folderPath,'Productivity');assert.ok(isAsap(r));assert.equal(r.priority,5);
 assert.equal(r.deadline,'2026-11-01','due by Sunday of this week');assert.ok(r.lessons.every(l=>!l.pinned),'not forced into today');
 assert.equal(asapDue(r,'UTC',now),'Read by Sun, Nov 1');
 assert.equal(s.inbox.find(i=>i.id==='share1').status,'filed');
});
test('sharing the same link again updates its category, title and ASAP instead of duplicating',()=>{
 const url='https://example.com/post';let s=saveSharedReading(base(),{id:'a',text:url,title:'Old',workspace:'personal'},now);
 s=saveSharedReading(s,{id:'b',text:url,title:'New title',workspace:'personal',category:'Tech',asap:true},now);
 const all=s.resources.filter(r=>r.url===url);assert.equal(all.length,1);assert.equal(all[0].title,'New title');assert.equal(all[0].folderPath,'Tech');assert.ok(isAsap(all[0]));
});
test('ASAP toggles off cleanly',()=>{
 const s=saveSharedReading(base(),{id:'c',text:'https://e.com/x',title:'X',workspace:'personal',asap:true},now);const r=s.resources.find(x=>x.url==='https://e.com/x');
 const off=setAsap(r,false);assert.ok(!isAsap(off));assert.equal(off.priority,3);assert.equal(off.deadline,'');
});
test('categories and suggestions',()=>{
 const s=saveSharedReading(base(),{id:'d',text:'https://e.com/y',title:'Y',workspace:'personal',category:'Design / UI'},now);
 const cats=readingCategories(s.resources);assert.equal(cats[0],'Design');for(const c of DEFAULT_CATEGORIES)assert.ok(cats.includes(c));
 assert.equal(suggestCategory('Building a REST API in Python with Docker'),'Tech');
 assert.equal(suggestCategory('how do people live without a purpose or a daily routine'),'Productivity');
 assert.equal(suggestCategory('a nice sunset'),'');
});
test('week deadline rolls to next week on Saturday/Sunday, and labels count down',()=>{
 assert.equal(weekDeadline('UTC',new Date('2026-10-26T10:00:00Z')),'2026-11-01');// Monday
 assert.equal(weekDeadline('UTC',new Date('2026-10-31T10:00:00Z')),'2026-11-08');// Saturday
 assert.equal(weekDeadline('Asia/Kolkata',new Date('2026-10-31T20:00:00Z')),'2026-11-08');// already Sunday in India
 const r={kind:'article',deadline:'2026-11-01',lessons:[{done:false,pinned:false}]};
 assert.equal(asapDue(r,'UTC',new Date('2026-11-01T09:00:00Z')),'Due today');
 assert.equal(asapDue(r,'UTC',new Date('2026-11-03T09:00:00Z')),'Overdue by 2 days');
});
test('older pinned ASAP readings still count and are converted when toggled',()=>{
 const legacy={kind:'article',deadline:'',priority:5,lessons:[{id:'l',done:false,pinned:true}]};
 assert.ok(isAsap(legacy));const off=setAsap(legacy,false);assert.ok(!isAsap(off));
});
