import type {LearningState} from './learning.ts';
import {dayKey} from './learning.ts';
import {type BalanceSettings,type UsageReport} from './focus-balance.ts';
import {screenSummarySchema,sameTimezone,type ScreenSummary} from './screen-time-schema.ts';
export function usageSummaries(report:UsageReport,settings:BalanceSettings,deviceId:string,deviceName='Phone'):ScreenSummary[]{
 if(!settings.enabled||!settings.syncSummaries||!report.granted||!deviceId)return [];
 return report.days.filter(d=>d.available??d.apps.length>0).map(d=>screenSummarySchema.parse({id:deviceId+':'+d.day,deviceId,deviceName,platform:report.platform,day:d.day,timezone:report.timezone,capturedAt:report.capturedAt,totalMinutes:d.minutes,neutralMinutes:d.minutes,budgetMinutes:settings.budgetMinutes,partial:true,measurement:d.measurement||{method:report.platform==='mac'?'mac-foreground-v1':'legacy'},topApps:settings.shareAppNames?[...d.apps].sort((a,b)=>b.minutes-a.minutes).slice(0,5).map(a=>({name:a.name.slice(0,120),minutes:a.minutes})):[]}));
}
export function mergeScreenSummaries(existing:ScreenSummary[],incoming:ScreenSummary[]){
 const map=new Map(existing.map(s=>[s.id,s]));
 for(const row of incoming){const old=map.get(row.id);if(!old||row.capturedAt>=old.capturedAt)map.set(row.id,row);}
 return [...map.values()].sort((a,b)=>b.day.localeCompare(a.day)||a.id.localeCompare(b.id)).slice(0,180);
}
export function updateScreenSummaries(state:LearningState,incoming:ScreenSummary[]){const screenTime=mergeScreenSummaries(state.screenTime,incoming);return JSON.stringify(screenTime)===JSON.stringify(state.screenTime)?state:{...state,screenTime};}
export function screenCoachEvidence(state:LearningState,now=new Date()){
 if(!state.coach.useScreenTime)return undefined;
 const today=dayKey(now,state.settings.timezone),start=new Date(Date.parse(today+'T12:00:00Z')-6*86400000).toISOString().slice(0,10);
 const rows=state.screenTime.filter(s=>s.day>=start&&s.day<=today&&sameTimezone(s.timezone,state.settings.timezone)&&Date.parse(s.capturedAt)<=now.getTime()+60000).slice(0,28);
 return {scope:'User opted in. Total phone/device use counts against the chosen screen-time budget, regardless of app purpose; no categories. Phone readings use observed unlocked-screen intervals when available, otherwise app activity estimates. Mac readings are foreground app estimates. Device-minutes can overlap across devices and are not elapsed free time. Missing devices and days are unknown. Total use alone does not prove distraction or wasted time.',days:rows.map(s=>({device:s.deviceName,platform:s.platform,day:s.day,capturedAt:s.capturedAt,totalMinutes:Math.round(s.totalMinutes),budgetMinutes:s.budgetMinutes,partial:s.partial,measurement:s.measurement||{method:'legacy'},topApps:(s.topApps.length?s.topApps:s.topLeisureApps).map(a=>({name:a.name,minutes:Math.round(a.minutes)}))}))};
}
export function realityCheck(learning:number,goal:number,usage:number|null,budget:number,tone:'direct'|'balanced'|'brutal'='direct'){
 const gap=Math.max(0,goal-learning),excess=usage===null?null:Math.max(0,Math.round(usage-budget));
 if(excess&&gap&&tone==='brutal')return {title:'Your phone is winning. Your goals are losing.',body:`${Math.round(usage!)} minutes on screens. ${learning} of ${goal} minutes of learning. ${excess} minutes over budget, ${gap} minutes short. The scroll is not going to study for you.`,action:`Phone in another room. ${Math.min(20,gap)} minutes on your next lesson. Right now, not after one more video.`};
 if(gap&&tone==='brutal')return {title:`${gap} minutes short. The course is not watching itself.`,body:`${learning} of ${goal} learning minutes recorded. ${usage===null?'Screen time unknown, so no excuses there either.':Math.round(usage)+' minutes of device time, though.'}`,action:`Start a ${Math.min(20,gap)} minute block before you open anything else.`};
 if(excess&&gap)return {title:'Your time and your goal are pulling apart.',body:`${Math.round(usage!)} minutes of screen time; ${learning} of ${goal} learning minutes recorded. That is ${excess} minutes over your screen-time budget and ${gap} minutes short of your learning target.`,action:tone!=='balanced'?`The current pattern is not meeting the goal you set. Close distractions and do ${Math.min(20,gap)} minutes of your next lesson now.`:`Try ${Math.min(20,gap)} minutes on your next lesson, with distractions closed.`};
 if(gap)return {title:tone!=='balanced'?'The goal is still unfinished.':'A focused block would help.',body:`${learning} of ${goal} learning minutes recorded. ${usage===null?'Screen time is unknown.':Math.round(usage)+' minutes recorded in your device use.'} Learning outside the app may be missing.`,action:`Log any learning you already did; otherwise start a ${Math.min(20,gap)} minute block before adding more material.`};
 if(excess)return {title:'Learning is covered. The screen-time budget is not.',body:`Your ${goal} minute learning target is met, but screen time is ${excess} minutes over budget. Completing one target does not cancel the other.`,action:'Finish the current scroll, put the phone away, and choose an offline break.'};
 return {title:'The recorded goal is covered.',body:`${learning} learning minutes recorded. ${usage===null?'Phone balance is unknown.':'Screen time is within the budget you set.'} Time alone does not prove understanding.`,action:'Explain one idea without notes, then decide whether you need another session or a break.'};
}
