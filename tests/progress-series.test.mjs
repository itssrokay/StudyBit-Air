import test from 'node:test';import assert from 'node:assert/strict';
import {seedState,parseLibrary,makeResource} from '../lib/learning.ts';
import {progressSeries} from '../lib/progress-series.ts';
const s=seedState();s.settings={...s.settings,timezone:'UTC'};s.resources=[makeResource({id:'c',title:'C'},[{id:'l',title:'L',minutes:30}]),...s.resources];
s.studyLog=[['2026-10-28',20],['2026-10-27',30],['2026-10-01',15],['2026-08-10',40],['2026-01-05',10]].map(([d,m],i)=>({id:'x'+i,resourceId:'c',lessonId:'l',minutes:m,at:d+'T10:00:00.000Z'}));
const st=parseLibrary(s),now=new Date('2026-10-28T18:00:00Z');
test('week, month, quarter and year buckets add up',()=>{
 const w=progressSeries(st,now,'W');assert.equal(w.bars.length,7);assert.equal(w.total,50);assert.ok(w.bars.at(-1).current);assert.equal(w.bars.at(-1).minutes,20);
 const m=progressSeries(st,now,'M');assert.equal(m.bars.length,30);assert.equal(m.total,65);
 const q=progressSeries(st,now,'3M');assert.equal(q.bars.length,13);assert.equal(q.total,105);
 const y=progressSeries(st,now,'Y');assert.equal(y.bars.length,12);assert.equal(y.total,115);assert.equal(y.bars.at(-1).minutes,65);
});
