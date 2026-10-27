import test from 'node:test';import assert from 'node:assert/strict';
import {saveTimeEntry,hasTimeEntry} from '../lib/time-log.ts';
import {seedState,parseLibrary,makeResource,doneMinutes} from '../lib/learning.ts';
import {rebaseLocalEdits} from '../lib/save-rebase.ts';
import {queueTimeEntry,readOutbox,pruneOutbox,applyOutbox,dropTimeEntry} from '../lib/time-outbox.ts';
const now=new Date('2026-10-27T05:00:00Z');
const entry={title:'Trees DSA',url:'',minutes:27,kind:'topic',reflection:'',workspace:'personal',keep:false,resourceId:'',timerSeconds:1625};
function memory(){const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};}

test('a time entry survives a save race with another writer instead of locking the library',()=>{
 const base=parseLibrary(seedState());
 const remote=parseLibrary(saveTimeEntry(base,{...entry,title:'Docker',minutes:40},new Date('2026-10-24T16:15:00Z'),'docker'));// e.g. Wi-Fi sync or another tab saved first
 const local=parseLibrary(saveTimeEntry(base,entry,now,'trees'));
 const merged=rebaseLocalEdits(base,local,remote);
 assert.ok(hasTimeEntry(merged,'trees'));assert.ok(hasTimeEntry(merged,'docker'));
 assert.equal(doneMinutes(merged,now),27);
 assert.equal(merged.studyLog.reduce((n,l)=>n+l.minutes,0),67);
});
test('on a same-field conflict this device’s newer edit wins',()=>{
 const base=parseLibrary(seedState());
 const local=parseLibrary({...base,settings:{...base.settings,dailyMinutes:60}}),remote=parseLibrary({...base,settings:{...base.settings,dailyMinutes:30}});
 assert.equal(rebaseLocalEdits(base,local,remote).settings.dailyMinutes,60);
});
test('rebase keeps remote deletions and local additions',()=>{
 const course=makeResource({id:'course',title:'Backend'});const base=parseLibrary({...seedState(),resources:[...seedState().resources,course]});
 const remote=parseLibrary({...base,resources:base.resources.filter(r=>r.id!=='course')});
 const local=parseLibrary(saveTimeEntry(base,entry,now,'trees'));
 const merged=rebaseLocalEdits(base,local,remote);
 assert.ok(!merged.resources.some(r=>r.id==='course'));assert.ok(hasTimeEntry(merged,'trees'));
});
test('outbox replays unsaved entries once and is pruned after a confirmed save',()=>{
 const store=memory(),state=parseLibrary(seedState());
 queueTimeEntry({id:'trees',at:now.toISOString(),input:entry},store);queueTimeEntry({id:'trees',at:now.toISOString(),input:entry},store);
 assert.equal(readOutbox(store).length,1);
 const once=applyOutbox(state,readOutbox(store)).state,twice=applyOutbox(once,readOutbox(store)).state;
 assert.equal(twice.studyLog.length,once.studyLog.length);assert.equal(doneMinutes(twice,now),27);
 pruneOutbox(state,store);assert.equal(readOutbox(store).length,1,'not saved yet, keep it');
 pruneOutbox(once,store);assert.equal(readOutbox(store).length,0);
});
test('outbox falls back to standalone learning if the chosen course disappeared',()=>{
 const store=memory();queueTimeEntry({id:'gone',at:now.toISOString(),input:{...entry,resourceId:'missing'}},store);
 const result=applyOutbox(parseLibrary(seedState()),readOutbox(store));
 assert.deepEqual(result.failed,[]);assert.ok(hasTimeEntry(result.state,'gone'));
 dropTimeEntry('gone',store);assert.equal(readOutbox(store).length,0);
});
test('corrupt outbox data is ignored safely',()=>{const store=memory();store.setItem('learning-space-time-outbox-v1','{bad');assert.deepEqual(readOutbox(store),[]);});
