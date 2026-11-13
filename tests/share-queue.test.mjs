import test from 'node:test';import assert from 'node:assert/strict';
import {planShares} from '../lib/share-queue.ts';
const now=new Date('2026-11-07T12:00:00Z');const ago=m=>new Date(now.getTime()-m*60000).toISOString();
const none=()=>false;
test('only the share you just made pops up; old leftovers are filed, not shown',()=>{
 const items=[{id:'a',text:'old 1',createdAt:ago(60*24*3)},{id:'b',text:'old 2',createdAt:ago(90)},{id:'c',text:'new',createdAt:ago(0.2)}];
 const r=planShares(items,{known:none,dismissed:none,now});
 assert.equal(r.show?.id,'c');assert.deepEqual(r.stale.map(i=>i.id).sort(),['a','b']);
});
test('after saving the new share, nothing old pops up',()=>{
 const items=[{id:'a',text:'old',createdAt:ago(500)},{id:'c',text:'new',createdAt:ago(1)}];
 const r=planShares(items,{known:id=>id==='c',dismissed:none,now});
 assert.equal(r.show,null);assert.deepEqual(r.acknowledge,['c']);assert.deepEqual(r.stale.map(i=>i.id),['a']);
});
test('a share closed with X does not come back in the same session',()=>{
 const r=planShares([{id:'c',text:'x',createdAt:ago(1)}],{known:none,dismissed:id=>id==='c',now});
 assert.equal(r.show,null);assert.equal(r.stale.length,0);
});
test('two quick shares: newest first, the other still shows next',()=>{
 const items=[{id:'p',text:'1',createdAt:ago(3)},{id:'q',text:'2',createdAt:ago(1)}];
 assert.equal(planShares(items,{known:none,dismissed:none,now}).show?.id,'q');
 assert.equal(planShares(items,{known:id=>id==='q',dismissed:none,now}).show?.id,'p');
});
test('a share with no time is treated as old',()=>{
 const r=planShares([{id:'z',text:'t'}],{known:none,dismissed:none,now});
 assert.equal(r.show,null);assert.equal(r.stale.length,1);
});
import {alreadySaved} from '../lib/share-queue.ts';
test('a share whose link is already saved is skipped, even if it arrives looking new',()=>{
 const state={inbox:[],resources:[{url:'https://x.com/arpit_bhayani/status/99'}]};
 assert.ok(alreadySaved(state,'Post by @arpit_bhayani https://x.com/arpit_bhayani/status/99?s=46&t=abc'));
 assert.ok(!alreadySaved(state,'https://x.com/someone/status/100'));
 const r=planShares([{id:'n',text:'https://x.com/arpit_bhayani/status/99',createdAt:ago(0.1)}],{known:none,alreadySaved:s=>alreadySaved(state,s.text),dismissed:none,now});
 assert.equal(r.show,null);assert.deepEqual(r.acknowledge,['n']);
});
test('same text already in the inbox is skipped',()=>{
 assert.ok(alreadySaved({inbox:[{text:'Read  this\nhttps://reddit.com/r/developersIndia/x'}],resources:[]},'read this https://reddit.com/r/developersIndia/x'));
});
