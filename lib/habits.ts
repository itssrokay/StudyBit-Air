import { dailyPlan, dayKey, doneMinutes, progress, type LearningState } from './learning.ts';
const shift=(key:string,days:number)=>new Date(Date.parse(key+'T12:00:00Z')+days*86400000).toISOString().slice(0,10);
export function streaks(state:LearningState,now=new Date()){
 const minutes=new Map<string,number>();const add=(date:string,n:number)=>{const day=dayKey(new Date(date),state.settings.timezone);minutes.set(day,(minutes.get(day)||0)+n);};
 for(const r of state.resources)for(const l of r.lessons)if(l.done&&l.completedAt)add(l.completedAt,l.minutes-l.studiedMinutes);
 for(const log of state.studyLog)add(log.at,log.minutes);
 const threshold=state.settings.streakMinimum;const qualifying=[...minutes].filter(([,n])=>n>=threshold).map(([d])=>d).sort();const days=new Set(qualifying);const today=dayKey(now,state.settings.timezone);
 let current=0,cursor=days.has(today)?today:shift(today,-1);while(days.has(cursor)){current++;cursor=shift(cursor,-1);}
 let best=0,run=0,previous='';for(const d of qualifying){run=previous&&shift(previous,1)===d?run+1:1;best=Math.max(best,run);previous=d;}
 return {current,best,todayDone:days.has(today),minimum:threshold,days:qualifying,minutes};
}
export function widgetSnapshot(state:LearningState,now=new Date()){
 const habit=streaks(state,now);const plan=dailyPlan(state,now);const reading=state.resources.find(r=>r.kind==='book'&&!r.archived&&progress(r)<100);
 return {version:1,themePreference:state.settings.theme,updatedAt:now.toISOString(),timezone:state.settings.timezone,day:dayKey(now,state.settings.timezone),todayMinutes:doneMinutes(state,now),goalMinutes:state.settings.dailyMinutes,streakCurrent:habit.current,streakBest:habit.best,streakMinimum:habit.minimum,todayDone:habit.todayDone,week:Array.from({length:7},(_,i)=>{const day=shift(dayKey(now,state.settings.timezone),i-6);return {day,minutes:habit.minutes.get(day)||0};}),next:plan.slice(0,3).map(p=>({id:p.lesson.id,resourceId:p.resource.id,title:p.lesson.title,course:p.resource.title,minutes:p.plannedMinutes,url:p.lesson.url||p.resource.url})),reading:reading?{title:reading.title,resourceId:reading.id,progress:progress(reading),chapter:reading.lessons.find(l=>!l.done)?.title||'',url:reading.url}:null};
}
