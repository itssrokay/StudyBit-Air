import test from 'node:test';import assert from 'node:assert/strict';
import {seedState} from '../lib/learning.ts';
import {saveSharedReading} from '../lib/capture.ts';
import {markFinished,isFinished} from '../lib/reading-done.ts';
const now=new Date('2026-11-07T10:00:00Z');
const withReading=()=>saveSharedReading(seedState(),{id:'share-1',text:'https://example.com/post',title:'A post',workspace:'personal'},now);
test('one tap marks a saved reading as read, and it can be undone',()=>{
 const s=withReading();const r=s.resources.find(x=>x.title==='A post');assert.ok(r&&!isFinished(r));
 const done=markFinished(s,r.id,true,now);assert.ok(isFinished(done.resources.find(x=>x.id===r.id)));
 const undone=markFinished(done,r.id,false,now);assert.ok(!isFinished(undone.resources.find(x=>x.id===r.id)));
});
test('marking read twice is harmless',()=>{
 const s=withReading();const r=s.resources.find(x=>x.title==='A post');
 const once=markFinished(s,r.id,true,now);const twice=markFinished(once,r.id,true,now);
 assert.equal(twice.coach.sessions.length,once.coach.sessions.length);
});
