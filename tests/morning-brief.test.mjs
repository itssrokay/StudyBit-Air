import test from 'node:test';import assert from 'node:assert/strict';
import {seedState,parseLibrary,makeResource} from '../lib/learning.ts';
import {morningBrief,momentumScore,briefTime,upcomingBriefs,briefDuration} from '../lib/morning-brief.ts';
const tz='Asia/Kolkata';
function library(days){// days: {'2026-10-27':45,...} minutes logged at 9pm IST
 const s=seedState();s.settings={...s.settings,timezone:tz,dailyMinutes:45,weeklyDays:5,streakMinimum:5};
 const course=makeResource({id:'dsa',title:'DSA Course',kind:'course',priority:5},[{id:'trees',title:'Binary trees',minutes:20},{id:'graphs',title:'Graphs',minutes:30}]);
 s.resources=[course,...s.resources];
 s.studyLog=Object.entries(days).map(([d,m],i)=>({id:'log'+i,resourceId:'dsa',lessonId:'graphs',minutes:m,at:new Date(d+'T15:30:00Z').toISOString()}));
 return parseLibrary(s);
}
const morning=new Date('2026-10-28T03:00:00Z');// 8:30 IST, Wednesday
test('high momentum brief names the numbers and the next lesson',()=>{
 const b=morningBrief(library({'2026-10-27':52,'2026-10-26':30,'2026-10-25':40,'2026-10-24':25}),morning);
 assert.equal(b.day,'2026-10-28');
 assert.ok(b.score>=75,'score '+b.score);assert.equal(b.tone,'high');
 assert.match(b.headline,/^High momentum sets up today for /);
 assert.match(b.body,/learned on 4 of 5 target days/);assert.match(b.body,/52 min yesterday beat your 45-minute goal/);
 assert.ok(b.action);assert.match(b.body,/\(\d+ min\) in /);
});
test('missed yesterday after a run says so and stays encouraging',()=>{
 const b=morningBrief(library({'2026-10-26':30,'2026-10-25':40,'2026-10-24':25}),morning);
 assert.match(b.body,/nothing was logged yesterday/);
 assert.match(b.headline,/restarts your 3-day rhythm/);
});
test('long gap and empty library have sensible headlines',()=>{
 assert.match(morningBrief(library({'2026-10-20':30}),morning).headline,/It’s been 8 days/);
 const empty=parseLibrary({...seedState(),resources:[]});assert.match(morningBrief(empty,morning).headline,/first learning session/);
});
test('deadline beats everything and is phrased as a nudge',()=>{
 const s=library({'2026-10-27':52});s.resources[0].deadline='2026-10-30';
 const b=morningBrief(parseLibrary(s),morning);
 assert.match(b.headline,/DSA Course is due in 2 days/);assert.match(b.body,/due in 2 days, with 2 lessons left/);
});
test('screen time appears only when opted in',()=>{
 const s=library({'2026-10-27':30});
 s.screenTime=[{id:'p:2026-10-27',deviceId:'p',deviceName:'Phone',platform:'android',day:'2026-10-27',timezone:tz,capturedAt:'2026-10-27T18:00:00Z',totalMinutes:190,budgetMinutes:120}];
 s.coach.useScreenTime=true;assert.match(morningBrief(parseLibrary(s),morning).body,/Phone time was 3h 10m yesterday, 6× your learning time/);
 s.coach.useScreenTime=false;assert.doesNotMatch(morningBrief(parseLibrary(s),morning).body,/Phone time/);
});
test('score parts and helpers',()=>{
 assert.equal(momentumScore({activeDays:5,targetDays:5,yesterday:45,goal:45,streak:7,daysSince:1}),100);
 assert.equal(momentumScore({activeDays:0,targetDays:5,yesterday:0,goal:45,streak:0,daysSince:null}),0);
 assert.equal(briefDuration(190),'3h 10m');assert.equal(briefDuration(60),'1h');
 assert.equal(briefTime('2026-10-28',tz,'08:30').toISOString(),'2026-10-28T03:00:00.000Z');
 assert.equal(briefTime('2026-03-09','America/New_York','08:30').toISOString(),'2026-03-09T12:30:00.000Z');
});
test('upcoming briefs cover today and tomorrow, and tomorrow counts today as yesterday',()=>{
 const s=library({'2026-10-28':50});const evening=new Date('2026-10-28T16:00:00Z');
 const [a,b]=upcomingBriefs(s,evening,'08:30');
 assert.equal(a.day,'2026-10-28');assert.equal(b.day,'2026-10-29');assert.equal(b.at,'2026-10-29T03:00:00.000Z');
 assert.match(b.body,/50 min yesterday beat your 45-minute goal/);
});
