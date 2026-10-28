import {dailyPlan,dayKey,progress,type LearningState} from './learning.ts';
import {streaks} from './habits.ts';
import {liveStudyLogs} from './activity.ts';
import {rewardProgress} from './milestones.ts';
import {currentPlan,planProgress} from './weekly-plan.ts';
import {voiceLine,type Tone} from './coach-voice.ts';

/**
 * A short, data-backed morning note in the style of a fitness readiness brief:
 * a specific headline, the numbers behind it, one concrete step for today and
 * one practical nudge. Deterministic and offline: no AI call is needed.
 */
export type MorningBrief={
 day:string;score:number;label:string;tone:'high'|'steady'|'building'|'low';
 headline:string;body:string;facts:string[];
 action:{resourceId:string;lessonId:string;title:string;course:string;minutes:number}|null;
 prompt:string;
};

const shift=(key:string,days:number)=>new Date(Date.parse(key+'T12:00:00Z')+days*86400000).toISOString().slice(0,10);
const weekday=(key:string)=>new Date(key+'T12:00:00Z').getUTCDay();// 0 = Sunday
const plural=(n:number,word:string)=>`${n} ${word}${n===1?'':'s'}`;
export function briefDuration(minutes:number){const m=Math.round(minutes);if(m<60)return `${m} min`;const h=Math.floor(m/60),r=m%60;return r?`${h}h ${r}m`:`${h}h`;}
const short=(text:string,max=42)=>text.length>max?text.slice(0,max-1).trimEnd()+'…':text;

export function momentumScore(parts:{activeDays:number;targetDays:number;yesterday:number;goal:number;streak:number;daysSince:number|null}){
 const consistency=Math.min(1,parts.activeDays/Math.max(1,parts.targetDays))*40;
 const yesterday=Math.min(1,parts.yesterday/Math.max(1,parts.goal))*25;
 const streak=Math.min(1,parts.streak/7)*15;
 const recency=parts.daysSince===1?20:parts.daysSince===2?12:parts.daysSince!==null&&parts.daysSince<=4?6:0;
 return Math.round(consistency+yesterday+streak+recency);
}

export function morningBrief(state:LearningState,now=new Date()):MorningBrief{
 const tz=state.settings.timezone,today=dayKey(now,tz),yday=shift(today,-1);
 const habit=streaks(state,now),minutesOn=(d:string)=>habit.minutes.get(d)||0;
 const goal=state.settings.dailyMinutes,target=state.settings.weeklyDays;
 const last7=Array.from({length:7},(_,i)=>shift(yday,-i));
 const activeDays=last7.filter(d=>minutesOn(d)>0).length,yesterday=minutesOn(yday);
 const lastActive=[...habit.minutes].filter(([d,n])=>d<today&&n>0).map(([d])=>d).sort().at(-1)||null;
 const daysSince=lastActive?Math.round((Date.parse(today+'T12:00:00Z')-Date.parse(lastActive+'T12:00:00Z'))/86400000):null;
 const streak=habit.todayDone?Math.max(0,habit.current-1):habit.current;// streak as of the end of yesterday
 // Length of the run that ended the day before yesterday, to spot a streak that just broke.
 let previousRun=0;if(!yesterday){let cursor=shift(yday,-1);while((minutesOn(cursor))>=habit.minimum){previousRun++;cursor=shift(cursor,-1);}}
 const score=momentumScore({activeDays,targetDays:target,yesterday,goal,streak,daysSince});
 const tone=score>=75?'high':score>=55?'steady':score>=30?'building':'low';
 const label={high:'High momentum',steady:'Steady momentum',building:'Building momentum',low:'Low momentum'}[tone];

 // Monday-start week, so "first session of the week" matches how people talk.
 const weekStart=shift(today,-((weekday(today)+6)%7));
 const logs=liveStudyLogs(state);
 const next=dailyPlan(state,now)[0];
 const action=next?{resourceId:next.resource.id,lessonId:next.lesson.id,title:next.lesson.title,course:next.resource.title,minutes:next.plannedMinutes}:null;
 const firstOnCourse=!!next&&!logs.some(l=>l.resourceId===next.resource.id&&dayKey(new Date(l.at),tz)>=weekStart&&dayKey(new Date(l.at),tz)<today);
 const firstOfWeek=![...habit.minutes].some(([d,n])=>d>=weekStart&&d<today&&n>0);

 // Screen time yesterday (opt-in summaries only).
 const screenRows=state.coach.useScreenTime?state.screenTime.filter(s=>s.day===yday):[];
 const phone=screenRows.filter(s=>s.platform==='android');
 const screen=(phone.length?phone:screenRows).reduce((n,s)=>n+s.totalMinutes,0);

 // Deadlines, rewards, to-dos, inbox → one practical nudge.
 const deadlines=state.resources.filter(r=>!r.archived&&!r.demo&&r.deadline&&progress(r)<100).map(r=>({r,days:Math.round((Date.parse(r.deadline+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000)})).filter(x=>x.days>=0&&x.days<=7).sort((a,b)=>a.days-b.days);
 const due=deadlines[0];
 const reward=state.rewards.filter(r=>!r.redeemedAt).map(r=>({r,p:rewardProgress(state,r,now,habit.minutes)})).filter(x=>!x.p.eligible).map(x=>({...x,left:x.r.targetDays-x.p.value})).filter(x=>x.left>0&&x.left<=3).sort((a,b)=>a.left-b.left)[0];
 const todosDue=state.todos.filter(t=>!t.doneAt&&t.dueDay&&t.dueDay<=today).length;
 const inbox=state.inbox.filter(i=>i.status==='inbox').length;
 const when=(d:number)=>d===0?'today':d===1?'tomorrow':`in ${d} days`;
 const nudge=due?(due.r.kind==='article'?`Read ASAP: “${short(due.r.title,60)}” is due ${when(due.days)}.`:`${due.r.title} is due ${when(due.days)}, with ${plural(due.r.lessons.filter(l=>!l.done).length,'lesson')} left.`)
  :reward?`Your reward “${reward.r.title}” is ${plural(reward.left,reward.r.metric==='streak'?'streak day':'learning day')} away.`
  :todosDue?`${plural(todosDue,'to-do')} ${todosDue===1?'is':'are'} due today.`
  :inbox>=3?`${plural(inbox,'capture')} ${inbox===1?'is':'are'} waiting in your inbox.`:'';

 const lesson=action?short(action.title):'';
 const brutal=state.coach.tone==='brutal';
 const plan=currentPlan(state,now),week=plan?planProgress(state,plan):null,daysLeftInWeek=7-((weekday(today)+6)%7);
 const headline=brutal&&tone==='low'&&lastActive?`Momentum ${score}. Today is a rescue mission`
  :!action&&!lastActive?'Set up your first learning session today'
  :due&&due.days<=3?`${short(due.r.title,34)} is due ${due.days===0?'today':due.days===1?'tomorrow':`in ${due.days} days`}. Make today count`
  :tone==='high'&&action?`High momentum sets up today for ${lesson}`
  :streak>=2?`Keep your ${streak}-day streak going today`
  :previousRun>=3?`One session today restarts your ${previousRun}-day rhythm`
  :daysSince!==null&&daysSince>=3&&action?`It’s been ${daysSince} days. ${action.minutes} minutes gets you back in`
  :firstOfWeek&&action?`Start the week with ${lesson}`
  :action?`Today’s best next step: ${lesson}`:'A quiet day to plan your next step';

 const yClause=yesterday>=goal?`, and ${briefDuration(yesterday)} yesterday beat your ${goal}-minute goal`
  :yesterday>0?`, with ${briefDuration(yesterday)} of your ${goal}-minute goal yesterday`
  :`, but nothing was logged yesterday`;
 const facts=[`Your momentum score is ${score}: you learned on ${activeDays} of ${target} target days this week${yClause}.`];
 const roast=voiceLine(state.coach.tone as Tone,{yesterday,goal,screen:screen>=30?screen:null,score},today);if(roast)facts.push(roast);
 if(week&&plan)facts.push(`This week (“${short(plan.title,50)}”): ${week.pct}% of your plan done, ${daysLeftInWeek} day${daysLeftInWeek===1?'':'s'} left.`);
 if(screen>=30&&!roast)facts.push(yesterday>0&&screen>=yesterday*2?`Phone time was ${briefDuration(screen)} yesterday, ${Math.round(screen/yesterday)}× your learning time.`:yesterday>0?`Phone time was ${briefDuration(screen)} yesterday.`:`Phone time was ${briefDuration(screen)} yesterday, with no learning logged.`);
 facts.push(action?`Today is a good chance to do “${action.title}” (${action.minutes} min) in ${action.course}${firstOnCourse&&!firstOfWeek?', your first session on it this week':firstOfWeek?', your first session of the week':''}.`:'Add a course, book or topic so your coach can plan the next step.');
 if(nudge)facts.push(nudge);
 const body=facts.join(' ');
 const prompt=`Here is my morning brief for ${today}: ${headline}. ${body} Help me make the most of today. Be specific and honest.`;
 return {day:today,score,label,tone,headline,body,facts,action,prompt};
}

/** Morning time (default 08:30) as a Date on the given calendar day in the learner's timezone. */
export function briefTime(day:string,timezone:string,time='08:30'){
 const [h,m]=time.split(':').map(Number);const guess=Date.parse(`${day}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00Z`);
 // Correct the UTC guess by the zone offset at that moment (twice, for DST edges).
 let t=guess;for(let i=0;i<2;i++){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(t));const v=(k:string)=>Number(parts.find(p=>p.type===k)?.value);const local=Date.UTC(v('year'),v('month')-1,v('day'),v('hour'),v('minute'));t+=guess-local;}
 return new Date(t);
}

/** Briefs for today and tomorrow, so the phone can show the right one even if the app is not opened. */
export function upcomingBriefs(state:LearningState,now=new Date(),time='08:30'){
 const tz=state.settings.timezone,today=dayKey(now,tz),tomorrow=shift(today,1);
 return [today,tomorrow].map(day=>{const at=briefTime(day,tz,time);const brief=morningBrief(state,new Date(Math.max(at.getTime(),day===today?now.getTime():0)));return {day,at:at.toISOString(),title:brief.headline,body:brief.body,score:brief.score,label:brief.label};});
}
