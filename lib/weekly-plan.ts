import {dayKey,dailyPlan,progress,rankResource,uid,type LearningState,type Resource} from './learning.ts';
import {liveStudyLogs} from './activity.ts';
import {streaks} from './habits.ts';
import {weeklyPlanSchema,type WeeklyPlan,type WeekAnswers,type WeekTarget} from './week-schema.ts';
import type {Workspace} from './spaces.ts';
export type {WeeklyPlan,WeekAnswers,WeekTarget};

const DAY=86400000;
const shift=(key:string,days:number)=>new Date(Date.parse(key+'T12:00:00Z')+days*DAY).toISOString().slice(0,10);
/** Monday of the week containing `now`, in the learner's timezone. */
export function weekStartOf(timezone:string,now=new Date()){const today=dayKey(now,timezone),dow=new Date(today+'T12:00:00Z').getUTCDay();return shift(today,-((dow+6)%7));}
export const weekDays=(start:string)=>Array.from({length:7},(_,i)=>shift(start,i));
export const weekLabel=(start:string)=>new Intl.DateTimeFormat('en',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(start+'T12:00:00Z'));
export function currentPlan(state:LearningState,now=new Date(),workspace?:Workspace){const start=weekStartOf(state.settings.timezone,now);return state.weeklyPlans.find(p=>p.weekStart===start&&(!workspace||p.workspace===workspace))||null;}
export function previousPlan(state:LearningState,now=new Date(),workspace?:Workspace){const start=shift(weekStartOf(state.settings.timezone,now),-7);return state.weeklyPlans.find(p=>p.weekStart===start&&(!workspace||p.workspace===workspace))||null;}

/** Everything recorded inside one Monday–Sunday week. */
export function weekActivity(state:LearningState,start:string){
 const tz=state.settings.timezone,days=new Set(weekDays(start)),inWeek=(iso:string|null)=>!!iso&&days.has(dayKey(new Date(iso),tz));
 const logs=liveStudyLogs(state).filter(l=>inWeek(l.at));
 const completions=state.resources.flatMap(r=>r.lessons.filter(l=>l.done&&inWeek(l.completedAt)).map(l=>({r,l})));
 const perDay=streaks(state,new Date(Date.parse(shift(start,6)+'T12:00:00Z'))).minutes;
 const minutesByDay=weekDays(start).map(d=>({day:d,minutes:perDay.get(d)||0}));
 return {logs,completions,minutesByDay,minutes:minutesByDay.reduce((n,d)=>n+d.minutes,0),activeDays:minutesByDay.filter(d=>d.minutes>=state.settings.streakMinimum).length};
}

export function targetProgress(state:LearningState,start:string,t:WeekTarget,activity=weekActivity(state,start)){
 const rid=t.resourceId;let done=0;
 if(t.kind==='minutes')done=rid?activity.logs.filter(l=>l.resourceId===rid).reduce((n,l)=>n+l.minutes,0)+activity.completions.filter(c=>c.r.id===rid).reduce((n,c)=>n+Math.max(0,c.l.minutes-c.l.studiedMinutes),0):activity.minutes;
 else if(t.kind==='days')done=activity.activeDays;
 else if(t.kind==='sessions')done=new Set(activity.logs.filter(l=>!rid||l.resourceId===rid).map(l=>dayKey(new Date(l.at),state.settings.timezone)+':'+l.resourceId)).size;
 else if(t.kind==='lessons')done=activity.completions.filter(c=>c.r.kind!=='article'&&(!rid||c.r.id===rid)).length;
 else done=activity.completions.filter(c=>c.r.kind==='article').length;
 const left=Math.max(0,t.target-done);
 const unit=t.kind==='minutes'?'min':t.kind==='days'?(left===1?'day':'days'):t.kind==='sessions'?(left===1?'session':'sessions'):t.kind==='lessons'?(left===1?'lesson':'lessons'):(left===1?'reading':'readings');
 const remaining=left===0?'Done':t.kind==='minutes'?`${fmtMinutes(left)} to go`:`${left} ${unit} to go`;
 return {done,target:t.target,pct:Math.min(100,Math.round(done/t.target*100)),complete:done>=t.target,remaining};
}
export const fmtMinutes=(m:number)=>m<60?`${m} min`:`${Math.floor(m/60)}h${m%60?` ${m%60}m`:''}`;
export function planProgress(state:LearningState,plan:WeeklyPlan){const a=weekActivity(state,plan.weekStart);const rows=plan.targets.map(t=>({t,p:targetProgress(state,plan.weekStart,t,a)}));return {rows,activity:a,pct:Math.round(rows.reduce((n,r)=>n+r.p.pct,0)/Math.max(1,rows.length)),complete:rows.filter(r=>r.p.complete).length};}

const short=(s:string,n=40)=>s.length>n?s.slice(0,n-1).trimEnd()+'…':s;
/** Pick the course the week should be about: the one asked for, else the top-ranked unfinished one. */
export function focusResource(state:LearningState,answers:WeekAnswers,now=new Date()):Resource|null{
 const open=state.resources.filter(r=>!r.archived&&progress(r)<100&&r.kind!=='article');
 return open.find(r=>r.id===answers.focusResourceId)||[...open].sort((a,b)=>rankResource(b,state,now)-rankResource(a,state,now))[0]||null;
}

/** A complete week from the interview answers, with no AI: realistic, specific, trackable. */
export function buildRulePlan(state:LearningState,answers:WeekAnswers,now=new Date(),workspace:Workspace='personal'):WeeklyPlan{
 const start=weekStartOf(state.settings.timezone,now),focus=focusResource(state,answers,now);
 const dow=(new Date(dayKey(now,state.settings.timezone)+'T12:00:00Z').getUTCDay()+6)%7,daysLeft=7-dow;// Plan only the days that remain
 const scale=Math.max(0.3,daysLeft/7),minutes=Math.max(30,Math.round(answers.hoursPerWeek*60*scale/15)*15),days=Math.max(1,Math.min(daysLeft,Math.round(answers.days*scale)||1));
 const targets:WeekTarget[]=[{id:uid(),kind:'minutes',label:`Learn ${fmtMinutes(minutes)} in total`,target:minutes,resourceId:''},{id:uid(),kind:'days',label:`Study on ${days} day${days===1?'':'s'}`,target:days,resourceId:''}];
 if(focus){
  const next=focus.lessons.filter(l=>!l.done),avg=Math.max(5,Math.round(next.slice(0,8).reduce((n,l)=>n+l.minutes,0)/Math.max(1,Math.min(8,next.length)))),share=Math.round(minutes*0.6);
  const lessons=Math.max(1,Math.min(next.length,Math.round(share/avg)));
  targets.push({id:uid(),kind:'lessons',label:`Finish ${lessons} lesson${lessons===1?'':'s'} of ${short(focus.title)}`,target:lessons,resourceId:focus.id});
  const sessions=Math.max(1,Math.min(days,3));targets.push({id:uid(),kind:'sessions',label:`${sessions} focused session${sessions===1?'':'s'} on ${short(focus.title,28)}`,target:sessions,resourceId:focus.id});
 }
 const asap=state.resources.filter(r=>r.kind==='article'&&!r.archived&&progress(r)<100&&!!r.deadline).length;
 if(asap)targets.push({id:uid(),kind:'readings',label:`Read ${Math.min(asap,3)} saved article${Math.min(asap,3)===1?'':'s'}`,target:Math.min(asap,3),resourceId:''});
 const goal=answers.goal||state.goals.find(g=>g.id===state.settings.focusGoal)?.title||'';
 const level={new:'Foundations',some:'Momentum',solid:'Depth'}[answers.level];
 const title=focus?`${level} week: ${short(focus.title,44)}`:`${level} week${goal?': '+short(goal,44):''}`;
 const summary=[goal?`This week moves you toward “${short(goal,80)}”${answers.deadline?` (target ${answers.deadline})`:''}.`:'',focus?`Most of your time goes to ${focus.title}, about ${fmtMinutes(Math.round(minutes*0.6/5)*5)}, in short focused sessions.`:'Add a course or topic so the plan can focus on one thing.',`${days} study day${days===1?'':'s'}, ${fmtMinutes(minutes)} in total${daysLeft<7?`, sized for the ${daysLeft} day${daysLeft===1?'':'s'} left this week`:''}. Small and finished beats big and abandoned.`].filter(Boolean).join(' ');
 return weeklyPlanSchema.parse({id:uid(),workspace,weekStart:start,title,summary,source:'rules',createdAt:now.toISOString(),targets:targets.slice(0,6),answers});
}

/** Save the interview: goal, daily target, weekly days, intent memory, and this week's plan. */
export function applyWeekPlan(state:LearningState,plan:WeeklyPlan,answers:WeekAnswers,tone?:'direct'|'balanced'|'brutal'):LearningState{
 let goals=state.goals,focusGoal=state.settings.focusGoal;
 if(answers.goal){const existing=goals.find(g=>g.title.toLowerCase()===answers.goal.toLowerCase());if(existing)focusGoal=existing.id;else if(goals.length<30){const id=uid();goals=[...goals,{workspace:plan.workspace,id,title:answers.goal.slice(0,120),description:answers.why.slice(0,500),image:'',importance:5}];focusGoal=id;}}
 const daily=Math.max(10,Math.min(480,Math.round(answers.hoursPerWeek*60/answers.days/5)*5));
 const intent=[answers.goal,answers.why&&`because ${answers.why}`,answers.deadline&&`by ${answers.deadline}`].filter(Boolean).join(' ');
 const resources=answers.focusResourceId?state.resources.map(r=>r.id===answers.focusResourceId?{...r,goalId:r.goalId||focusGoal,priority:Math.max(r.priority,4)}:r):state.resources;
 return {...state,goals,resources,weeklyPlans:[...state.weeklyPlans.filter(p=>!(p.weekStart===plan.weekStart&&p.workspace===plan.workspace)),plan].sort((a,b)=>b.weekStart.localeCompare(a.weekStart)).slice(0,26),settings:{...state.settings,focusGoal,dailyMinutes:daily,weeklyDays:answers.days},coach:{...state.coach,tone:tone||state.coach.tone,memory:{...state.coach.memory,learningIntent:intent?intent.slice(0,1000):state.coach.memory.learningIntent}}};
}

/** New week, no plan yet: carry last week's answers forward so tracking never stops. */
export function rolloverPlan(state:LearningState,now=new Date(),workspace:Workspace='personal'):WeeklyPlan|null{
 if(currentPlan(state,now,workspace))return null;
 const last=[...state.weeklyPlans].filter(p=>p.workspace===workspace).sort((a,b)=>b.weekStart.localeCompare(a.weekStart))[0];
 if(!last)return null;
 const next=buildRulePlan(state,last.answers,now,workspace);return {...next,summary:'Carried over from last week’s answers. Tap Make changes to adjust. '+next.summary};
}

/** End-of-week grade from target completion. */
export function weekGrade(pct:number){return pct>=95?'A':pct>=80?'B':pct>=60?'C':pct>=35?'D':'F';}
export function nextLessonForPlan(state:LearningState,plan:WeeklyPlan|null,now=new Date()){const rid=plan?.targets.find(t=>t.resourceId&&t.kind!=='readings')?.resourceId;const items=dailyPlan(state,now);return items.find(i=>i.resource.id===rid)||items[0]||null;}
