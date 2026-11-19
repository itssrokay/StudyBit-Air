import test from 'node:test';import assert from 'node:assert/strict';
import {librarySections,isStarted,isFinishedResource} from '../lib/library-sections.ts';
const r=(id,lessons)=>({id,lessons:lessons.map((x,i)=>({id:id+i,done:x==='d',studiedMinutes:x==='s'?5:0}))});
test('library groups: in progress first, then not started, finished folded away; rank order kept',()=>{
 const list=[r('a',['d','n']),r('b',['n','n']),r('c',['d','d']),r('d',['s','n']),r('e',[])];
 const g=librarySections(list);
 assert.deepEqual(g.doing.map(x=>x.id),['a','d']);
 assert.deepEqual(g.next.map(x=>x.id),['b','e']);
 assert.deepEqual(g.done.map(x=>x.id),['c']);
});
test('partly studied counts as started; an empty resource is never finished',()=>{
 assert.ok(isStarted(r('x',['s'])));assert.ok(!isFinishedResource(r('y',[])));
});
