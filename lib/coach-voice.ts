import {progress,type LearningState} from './learning.ts';
import {planProgress,weekGrade,weekDays,fmtMinutes,type WeeklyPlan} from './weekly-plan.ts';
import {factOfDay} from './brain-facts.ts';
export type Tone='direct'|'balanced'|'brutal';
export const TONE_LABEL:Record<Tone,string>={balanced:'Gentle',direct:'Direct',brutal:'Unhinged'};

const pick=<T,>(list:T[],seed:string)=>list[[...seed].reduce((n,c)=>(n*33+c.charCodeAt(0))>>>0,5)%list.length];
const hours=(m:number)=>m>=60?`${Math.round(m/6)/10}h`:`${Math.round(m)} min`;

/** Phone time across the plan's week from opted-in summaries (phone first, else any device). */
export function weekScreenMinutes(state:LearningState,start:string){
 if(!state.coach.useScreenTime)return null;const days=new Set(weekDays(start));
 const rows=state.screenTime.filter(s=>days.has(s.day)),phone=rows.filter(r=>r.platform==='android');
 return rows.length?(phone.length?phone:rows).reduce((n,r)=>n+r.totalMinutes,0):null;
}

/** When the focus course finishes at this week's pace. */
function projection(state:LearningState,plan:WeeklyPlan,minutes:number){
 const r=state.resources.find(x=>x.id===plan.targets.find(t=>t.resourceId)?.resourceId);if(!r||progress(r)>=100)return null;
 const left=r.lessons.filter(l=>!l.done).reduce((n,l)=>n+l.minutes-l.studiedMinutes,0);if(!left)return null;
 const weeks=minutes>0?left/minutes:Infinity;return {title:r.title,weeks,year:Number.isFinite(weeks)?new Date(Date.now()+weeks*7*86400000).getFullYear():null};
}

export function weekVerdict(state:LearningState,plan:WeeklyPlan,tone:Tone=state.coach.tone as Tone){
 const {pct,activity,rows}=planProgress(state,plan),grade=weekGrade(pct),screen=weekScreenMinutes(state,plan.weekStart);
 const minutes=activity.minutes,target=plan.targets.find(t=>t.kind==='minutes')?.target||0,proj=projection(state,plan,minutes),seed=plan.id+pct;
 const phoneHeavy=screen!==null&&screen>Math.max(60,minutes*4);
 const lines:string[]=[];let headline='';
 if(tone==='brutal'){
  headline=grade==='A'?pick(['Okay, fine. You actually did it.','Grade A. Who are you and what did you do with the old you?'],seed)
   :grade==='B'?pick(['Solid week. Annoyingly close to an A.','B. Good. Not legendary. Good.'],seed)
   :grade==='C'?pick(['Mid. Not bad, not good. Mid.','C for “could’ve”. You know you could’ve.'],seed)
   :grade==='D'?pick(['Half a plan, half an effort.','D week. The plan was fine. Showing up wasn’t.'],seed)
   :pick(['With this little learning, you are doomed. Slowly, but doomed.','F. Your future self just filed a complaint.','This week your goals got ghosted.'],seed);
  lines.push(`${fmtMinutes(minutes)} of learning${target?` out of ${fmtMinutes(target)} planned`:''} on ${activity.activeDays} day${activity.activeDays===1?'':'s'}. That’s ${pct}% of the plan.`);
  if(phoneHeavy)lines.push(`Meanwhile your phone got ${hours(screen!)}. Your thumbs trained harder than your brain this week. Work on your attention span: reading this little while scrolling that much is a choice.`);
  else if(screen!==null&&pct<60)lines.push(`${hours(screen)} of phone time. Not even the phone’s fault entirely. You just didn’t start.`);
  if(proj&&pct<80)lines.push(proj.year?`At this pace, ${proj.title} finishes around ${proj.year}. Maybe your grandkids will enjoy it.`:`At this pace, ${proj.title} never finishes. Literally zero minutes is a very long ETA.`);
  lines.push(pct>=80?'Now don’t ruin it next week.':'Next week: phone in another room, 25 minutes, every planned day. No speeches, just reps.');
 }else{
  headline=grade==='A'?'Plan complete. Great week.':grade==='B'?'Strong week, most of the plan done.':grade==='C'?'Some progress, but the plan slipped.':grade==='D'?'The week mostly got away from you.':'The plan didn’t happen this week.';
  lines.push(`${fmtMinutes(minutes)} learned${target?` of ${fmtMinutes(target)} planned`:''} across ${activity.activeDays} day${activity.activeDays===1?'':'s'} (${pct}% of targets).`);
  if(phoneHeavy)lines.push(tone==='direct'?`Phone time was ${hours(screen!)}, about ${Math.round(screen!/Math.max(1,minutes))}× your learning time. That gap is the problem to fix.`:`Phone time was ${hours(screen!)}. Moving a little of that to learning would close the gap.`);
  if(proj&&pct<80&&proj.year)lines.push(`At this pace ${proj.title} finishes around ${proj.year}.`);
  lines.push(pct>=80?'Keep the same rhythm next week.':'Next week, protect a fixed time slot and start with just 20 minutes.');
 }
 const missed=rows.filter(r=>!r.p.complete).map(r=>r.t.label);
 return {grade,pct,headline,lines,missed,minutes,screen,fact:factOfDay(plan.weekStart,phoneHeavy?'phone':pct<60?'habit':'memory'),share:shareText(grade,pct,minutes,activity.activeDays,screen,tone)};
}

export function shareText(grade:string,pct:number,minutes:number,days:number,screen:number|null,tone:Tone){
 const bad=pct<60;
 const body=bad
  ?`Hi, this side StudyBit Air 🤖. My human learned ${fmtMinutes(minutes)} this week${screen!==null?` and spent ${hours(screen)} on their phone`:''}. Week grade: ${grade}.${tone==='brutal'?' Public shaming is part of the plan. Hold them accountable 👇':' Next week will be better.'}`
  :`Hi, this side StudyBit Air 🤖. My human hit ${pct}% of this week’s learning plan: ${fmtMinutes(minutes)} across ${days} day${days===1?'':'s'}. Grade ${grade}.${tone==='brutal'?' I’m as shocked as you are.':''}`;
 return (body+' #StudyBitAir #LearningInPublic').slice(0,280);
}
export const xIntent=(text:string)=>'https://x.com/intent/post?text='+encodeURIComponent(text);

/** One-line nudge for the brief/Today in the chosen voice. */
export function voiceLine(tone:Tone,ctx:{yesterday:number;goal:number;screen:number|null;score:number},seed:string){
 if(tone!=='brutal')return '';
 if(ctx.screen!==null&&ctx.screen>Math.max(90,ctx.yesterday*4))return pick([`Your phone got ${hours(ctx.screen)} of you yesterday. Your learning got ${fmtMinutes(ctx.yesterday)}. Pick a winner today.`,`${hours(ctx.screen)} on the phone, ${fmtMinutes(ctx.yesterday)} learning. Your attention span is begging for a rescue.`],seed);
 if(!ctx.yesterday)return pick(['Zero minutes yesterday. Bold strategy. Let’s see if it pays off.','Nothing logged yesterday. The course didn’t miss you, but your goals did.'],seed);
 if(ctx.yesterday<ctx.goal/2)return pick([`${fmtMinutes(ctx.yesterday)} yesterday. That’s a warm-up, not a session.`,`${fmtMinutes(ctx.yesterday)}? Your goal is ${ctx.goal}. Math is not on your side yet.`],seed);
 return ctx.score>=75?pick(['Good. Keep doing it before you remember to be lazy.','Momentum is real. Don’t waste it on reels.'],seed):'';
}
