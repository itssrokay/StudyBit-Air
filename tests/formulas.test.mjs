import test from 'node:test';import assert from 'node:assert/strict';
import {seedState,parseLibrary,makeResource,progress,rankResource} from '../lib/learning.ts';
import {goalForecast} from '../lib/forecast.ts';
import {progressSeries} from '../lib/progress-series.ts';
import {coachActivity} from '../lib/coach.ts';
import {morningBrief} from '../lib/morning-brief.ts';
const tz='Asia/Kolkata';
function lib(logs=[],lessons=10,minutes=30){const s=seedState();s.settings={...s.settings,timezone:tz,streakMinimum:10};
 s.resources=[makeResource({id:'dsa',title:'DSA',kind:'course',priority:5},Array.from({length:lessons},(_,i)=>({id:'l'+i,title:'L'+i,minutes}))),...s.resources.map(r=>({...r,demo:true}))];
 s.studyLog=logs.map(([d,m],i)=>({id:'x'+i,resourceId:'dsa',lessonId:'l0',minutes:m,at:d+'T08:00:00.000Z'}));return parseLibrary(s);}

test('forecast pace uses the days you have actually been studying, not a flat 14',()=>{
 // Started 4 days ago (Nov 16-19), 30 min each day = 120 min → 30 min/day, not 120/14 ≈ 9
 const f=goalForecast(lib([['2026-11-16',30],['2026-11-17',30],['2026-11-18',30],['2026-11-19',30]]),new Date('2026-11-19T12:00:00Z'));
 assert.equal(f.paceDays,4);assert.equal(f.pace,30);
});
test('forecast: one study day left means you finish today, not tomorrow',()=>{
 // 30 min left, 30 min/day pace → done today
 const s=lib([['2026-11-16',30],['2026-11-17',30],['2026-11-18',30],['2026-11-19',30]],1,30);
 const f=goalForecast(s,new Date('2026-11-19T12:00:00Z'));
 assert.equal(f.days,1);assert.equal(f.eta,'2026-11-19');
});
test('forecast: deadline tomorrow leaves two study days (today and tomorrow)',()=>{
 const s=lib([['2026-11-19',20]]);s.resources[0].deadline='2026-11-20';
 const f=goalForecast(parseLibrary(s),new Date('2026-11-19T12:00:00Z'));
 assert.equal(f.daysToDeadline,2);assert.equal(f.needed,Math.ceil(f.remaining/2));
});
test('progress of a resource with no lessons is 0, not NaN',()=>{
 assert.equal(progress({lessons:[]}),0);
});
test('deadline urgency counts calendar days in your timezone',()=>{
 // 11:30 pm IST on Nov 19 is still Nov 19 for you: a Nov 22 deadline is 3 days away → top urgency
 const s=lib();const r={...s.resources[0],deadline:'2026-11-22',priority:3};
 const late=new Date('2026-11-19T18:00:00Z'),noDeadline={...r,deadline:null};
 assert.equal(rankResource(r,s,late)-rankResource(noDeadline,s,late),20);
});
test('12-month average divides by the days actually covered',()=>{
 const s=lib([['2026-11-19',365]]);const y=progressSeries(s,new Date('2026-11-19T12:00:00Z'),'Y');
 // Dec 1 2025 → Nov 19 2026 = 354 days
 assert.equal(y.average,Math.round(365/354));
});
test('"active days" means days at your streak minimum, everywhere',()=>{
 // 5 min on Nov 18 is below the 10 min minimum; 20 min on Nov 17 counts
 const s=lib([['2026-11-17',20],['2026-11-18',5]]),now=new Date('2026-11-19T12:00:00Z');
 assert.equal(coachActivity(s,now).daysWeek,1);
 assert.match(morningBrief(s,now).facts[0],/learned on 1 of/);
});
