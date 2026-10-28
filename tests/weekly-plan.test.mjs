import test from 'node:test';import assert from 'node:assert/strict';
import {seedState,parseLibrary,makeResource} from '../lib/learning.ts';
import {weekStartOf,buildRulePlan,applyWeekPlan,currentPlan,planProgress,rolloverPlan,weekGrade} from '../lib/weekly-plan.ts';
import {weekVerdict,shareText,xIntent} from '../lib/coach-voice.ts';
import {factOfDay,BRAIN_FACTS} from '../lib/brain-facts.ts';
import {prepareWeekPlanAI} from '../lib/weekly-plan-ai.ts';
import {workspaceState,updateWorkspace} from '../lib/spaces.ts';
const tz='Asia/Kolkata',monday=new Date('2026-10-26T04:00:00Z');
function lib(logs=[]){const s=seedState();s.settings={...s.settings,timezone:tz};
 s.resources=[makeResource({id:'dsa',title:'Striver DSA Sheet',kind:'course',priority:5},Array.from({length:10},(_,i)=>({id:'l'+i,title:'Lesson '+i,minutes:30}))),...s.resources];
 s.studyLog=logs.map(([d,m,rid='dsa'],i)=>({id:'x'+i,resourceId:rid,lessonId:'l0',minutes:m,at:d+'T14:00:00.000Z'}));return parseLibrary(s);}
const answers={goal:'Crack DSA interviews',why:'switch jobs',deadline:'2027-01-31',hoursPerWeek:5,days:5,level:'some',focusResourceId:'dsa'};
test('Monday start in the learner timezone',()=>{assert.equal(weekStartOf(tz,monday),'2026-10-26');assert.equal(weekStartOf(tz,new Date('2026-11-01T17:00:00Z')),'2026-10-26');assert.equal(weekStartOf(tz,new Date('2026-11-01T19:00:00Z')),'2026-11-02');});
test('rule plan: titled focus week with measurable targets, saved with goal and settings',()=>{
 const s=lib(),plan=buildRulePlan(s,answers,monday);
 assert.equal(plan.weekStart,'2026-10-26');assert.match(plan.title,/^Momentum week: Striver DSA Sheet/);
 assert.deepEqual(plan.targets.map(t=>t.kind),['minutes','days','lessons','sessions']);assert.equal(plan.targets[0].target,300);
 const next=parseLibrary(applyWeekPlan(s,plan,answers,'brutal'));
 assert.equal(currentPlan(next,monday).id,plan.id);assert.equal(next.coach.tone,'brutal');assert.equal(next.settings.weeklyDays,5);assert.equal(next.settings.dailyMinutes,60);
 assert.ok(next.goals.some(g=>g.title==='Crack DSA interviews'&&g.id===next.settings.focusGoal));assert.match(next.coach.memory.learningIntent,/Crack DSA interviews because switch jobs by 2027-01-31/);
});
test('mid-week plans scale to the days left',()=>{const p=buildRulePlan(lib(),answers,new Date('2026-10-30T04:00:00Z'));assert.equal(p.targets[0].target,135);assert.equal(p.targets[1].target,2);});
test('progress tracks minutes, days, sessions and lessons inside the week only',()=>{
 let s=lib([['2026-10-26',40],['2026-10-27',50],['2026-10-27',10],['2026-10-20',90]]);const plan=buildRulePlan(s,answers,monday);
 s=parseLibrary({...applyWeekPlan(s,plan,answers),resources:s.resources.map(r=>r.id==='dsa'?{...r,lessons:r.lessons.map((l,i)=>i<2?{...l,done:true,completedAt:'2026-10-27T15:00:00.000Z'}:l)}:r)});
 const pr=planProgress(s,currentPlan(s,monday)),by=Object.fromEntries(pr.rows.map(r=>[r.t.kind,r.p]));
 assert.equal(by.minutes.done,160);assert.equal(by.days.done,2);assert.equal(by.sessions.done,2);assert.equal(by.lessons.done,2);assert.ok(pr.pct>0&&pr.pct<100);
});
test('new week rolls over last week’s answers',()=>{const s=parseLibrary(applyWeekPlan(lib(),buildRulePlan(lib(),answers,monday),answers));const r=rolloverPlan(s,new Date('2026-11-02T04:00:00Z'));assert.equal(r.weekStart,'2026-11-02');assert.match(r.summary,/Carried over/);assert.equal(rolloverPlan(s,monday),null);});
test('unhinged weekly verdict roasts behaviour, shares a postable message',()=>{
 let s=lib([['2026-10-27',15]]);s.coach.useScreenTime=true;s.screenTime=[{id:'p:2026-10-27',deviceId:'p',deviceName:'Phone',platform:'android',day:'2026-10-27',timezone:tz,capturedAt:'2026-10-27T18:00:00Z',totalMinutes:420,budgetMinutes:120}];
 s=parseLibrary(applyWeekPlan(parseLibrary(s),buildRulePlan(parseLibrary(s),answers,monday),answers,'brutal'));
 const v=weekVerdict(s,currentPlan(s,monday),'brutal');
 assert.equal(v.grade,'F');assert.ok(v.lines.some(l=>/phone got 7h/.test(l)),v.lines.join('|'));assert.ok(v.lines.some(l=>/finishes around|never finishes/.test(l)));
 assert.match(v.share,/^Hi, this side StudyBit Air 🤖\. My human learned 15 min this week and spent 7h on their phone\. Week grade: F\./);assert.ok(v.share.length<=280);
 assert.match(xIntent(v.share),/^https:\/\/x\.com\/intent\/post\?text=Hi%2C%20this%20side/);
 const gentle=weekVerdict(s,currentPlan(s,monday),'balanced');assert.doesNotMatch(gentle.lines.join(' '),/doomed|grandkids/);
 assert.match(shareText('A',96,300,5,null,'direct'),/hit 96% of this week’s learning plan/);assert.equal(weekGrade(50),'D');
});
test('facts rotate daily, every fact has a source',()=>{assert.notDeepEqual(factOfDay('2026-10-27'),factOfDay('2026-10-28'));assert.ok(BRAIN_FACTS.every(f=>f.source&&f.text.length<260));assert.ok(factOfDay('2026-10-27','phone').tags.includes('phone'));});
test('AI week request validates library ids',()=>{const s=lib();const r=prepareWeekPlanAI({state:s,answers},monday);assert.equal(r.body.text.format.name,'weekly_learning_plan');
 const out=r.parse({output:[{content:[{type:'output_text',text:JSON.stringify({title:'Trees week',summary:'s',message:'m',targets:[{kind:'lessons',label:'Do 3',target:3,resourceId:'dsa'},{kind:'minutes',label:'x',target:200,resourceId:'nope'}]})}]}]});
 assert.equal(out.targets[0].resourceId,'dsa');assert.equal(out.targets[1].resourceId,'');});
test('weekly plans stay in their own space',()=>{const s=parseLibrary(applyWeekPlan(lib(),buildRulePlan(lib(),answers,monday,'work'),answers));assert.equal(workspaceState(s,'personal').weeklyPlans.length,0);const w=workspaceState(s,'work');assert.equal(w.weeklyPlans.length,1);assert.equal(updateWorkspace(s,w,'work').weeklyPlans.length,1);});

test('manual priority order outranks automatic ranking',async()=>{
 const {rankResource,rankReason}=await import('../lib/learning.ts');
 const s=lib();const other=s.resources.find(r=>r.id!=='dsa'&&!r.archived);
 const ordered={...s,settings:{...s.settings,priorityOrder:[other.id,'dsa']}};
 assert.ok(rankResource(other,ordered,monday)>rankResource(s.resources.find(r=>r.id==='dsa'),ordered,monday));
 assert.match(rankReason(other,ordered,monday),/Ranked by you/);
});

test('coach context carries this week plan with progress and custom instructions',async()=>{
 const {coachContext}=await import('../lib/coach.ts');
 let s=lib([['2026-10-26',40]]);const plan=buildRulePlan(s,answers,monday);s=applyWeekPlan(s,plan,answers,'brutal');
 s={...s,coach:{...s.coach,memory:{...s.coach.memory,instructions:'Roast my phone use.'}}};
 const ctx=coachContext(s,[],'',new Date('2026-10-27T10:00:00Z'),{workspace:'personal'});
 assert.equal(ctx.weekPlan.title,plan.title);assert.ok(ctx.weekPlan.targets.length>=2);assert.equal(ctx.remembered.instructions,'Roast my phone use.');assert.equal(ctx.coachingStyle,'brutal');
});
