import {dayKey,progress,rankResource,type LearningState,type Resource} from './learning.ts';
import {liveStudyLogs} from './activity.ts';
import {currentPlan} from './weekly-plan.ts';

const DAY=86400000;
const left=(r:Resource)=>r.lessons.filter(l=>!l.done).reduce((n,l)=>n+Math.max(0,l.minutes-l.studiedMinutes),0);
const total=(r:Resource)=>r.lessons.reduce((n,l)=>n+l.minutes,0);
export const shortDate=(day:string,withYear=true)=>new Intl.DateTimeFormat('en',{month:'short',day:'numeric',...(withYear?{year:'numeric'}:{}),timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'));

/**
 * "At this rate your goal is done by …": remaining minutes on the goal's
 * resources divided by your recent pace on them (last 14 days, falling back
 * to overall pace), compared with the deadline you gave.
 */
export function goalForecast(state:LearningState,now=new Date()){
 const tz=state.settings.timezone,today=dayKey(now,tz),plan=currentPlan(state,now);
 const goal=state.goals.find(g=>g.id===state.settings.focusGoal)||null;
 const open=state.resources.filter(r=>!r.archived&&r.lessons.length>0);
 let resources=goal?open.filter(r=>r.goalId===goal.id):[];
 const planFocus=plan?.targets.find(t=>t.resourceId)?.resourceId;
 if(!resources.length&&planFocus)resources=open.filter(r=>r.id===planFocus);
 if(!resources.length){const top=[...open].filter(r=>progress(r)<100&&r.kind!=='article').sort((a,b)=>rankResource(b,state,now)-rankResource(a,state,now))[0];if(top)resources=[top];}
 if(!resources.length)return null;
 const ids=new Set(resources.map(r=>r.id)),remaining=resources.reduce((n,r)=>n+left(r),0),all=Math.max(1,resources.reduce((n,r)=>n+total(r),0));
 const since=now.getTime()-14*DAY,logs=liveStudyLogs(state).filter(l=>Date.parse(l.at)>=since);
 const focused=logs.filter(l=>ids.has(l.resourceId)).reduce((n,l)=>n+l.minutes,0),overall=logs.reduce((n,l)=>n+l.minutes,0);
 const pace=focused>0?focused/14:overall/14*0.5;// minutes per day
 const days=remaining<=0?0:pace>0?Math.ceil(remaining/pace):null;
 const eta=days===null?null:new Date(Date.parse(today+'T12:00:00Z')+days*DAY).toISOString().slice(0,10);
 const dated=[plan?.answers.deadline,...resources.map(r=>r.deadline)].filter((d):d is string=>!!d&&d>=today).sort();
 const deadline=dated[0]||null,daysToDeadline=deadline?Math.max(1,Math.round((Date.parse(deadline+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/DAY)):null;
 const needed=daysToDeadline?Math.ceil(remaining/daysToDeadline):null;
 const late=eta&&deadline?Math.round((Date.parse(eta+'T12:00:00Z')-Date.parse(deadline+'T12:00:00Z'))/DAY):null;
 return {title:goal?.title||resources[0].title,resources,remaining,pct:Math.round((1-remaining/all)*100),pace:Math.round(pace),eta,days,deadline,daysToDeadline,needed,late,onTrack:late===null?null:late<=0};
}
export type GoalForecast=NonNullable<ReturnType<typeof goalForecast>>;

/** One sentence for cards and the coach. */
export function forecastLine(f:GoalForecast,brutal=false){
 if(f.remaining<=0)return `Everything for “${f.title}” is done.`;
 if(!f.eta)return brutal?`At your current pace (zero), “${f.title}” finishes never. Start the clock.`:`No recent study on “${f.title}” yet, so there’s no finish date. A few sessions will give you one.`;
 const when=shortDate(f.eta);
 if(f.late!==null&&f.late>0)return brutal?`At this rate you finish around ${when}, ${f.late} days after your ${shortDate(f.deadline!,false)} deadline. You need ${f.needed} min a day, not ${f.pace}.`:`At this rate you finish around ${when}, ${f.late} days after your deadline. About ${f.needed} min a day would get you there on time.`;
 if(f.late!==null)return `At this rate you finish around ${when}, ${-f.late} days before your deadline.`;
 return `At this rate (${f.pace} min a day) you finish around ${when}.`;
}
