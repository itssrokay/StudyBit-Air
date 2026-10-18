import type {LearningState} from './learning.ts';
import {dayKey} from './learning.ts';
import {type BalanceSettings,type UsageReport} from './focus-balance.ts';
import {screenSummarySchema,sameTimezone,type ScreenSummary} from './screen-time-schema.ts';
export function usageSummaries(report:UsageReport,settings:BalanceSettings,deviceId:string,deviceName='Phone'):ScreenSummary[]{
 if(!settings.enabled||!settings.syncSummaries||!report.granted||!deviceId)return [];
 return report.days.filter(d=>d.apps.length>0).map(d=>{const sums={learningMinutes:0,leisureMinutes:0,mixedMinutes:0,neutralMinutes:0};
  for(const a of d.apps){const key=(settings.categories[a.id]||'neutral')+'Minutes' as keyof typeof sums;sums[key]+=a.minutes;}
  return screenSummarySchema.parse({id:deviceId+':'+d.day,deviceId,deviceName,platform:report.platform,day:d.day,timezone:report.timezone,capturedAt:report.capturedAt,totalMinutes:Object.values(sums).reduce((n,v)=>n+v,0),...sums,budgetMinutes:settings.budgetMinutes,leisureConfigured:Object.values(settings.categories).includes('leisure'),partial:true,topLeisureApps:settings.shareAppNames?d.apps.filter(a=>settings.categories[a.id]==='leisure').sort((a,b)=>b.minutes-a.minutes).slice(0,5).map(a=>({name:a.name.slice(0,120),minutes:a.minutes})):[]});
 });
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
 return {scope:'User opted in. Available per-device foreground app estimates for the last seven days. Device-minutes can overlap across devices and must not be treated as elapsed free time. Categories are user assigned. Missing devices and days are unknown. Work, learning, mixed browsing, and necessary communication are not automatically leisure.',days:rows.map(s=>({device:s.deviceName,platform:s.platform,day:s.day,capturedAt:s.capturedAt,totalMinutes:Math.round(s.totalMinutes),leisureMinutes:s.leisureConfigured?Math.round(s.leisureMinutes):null,learningAppMinutes:Math.round(s.learningMinutes),mixedMinutes:Math.round(s.mixedMinutes),unclassifiedMinutes:Math.round(s.neutralMinutes),budgetMinutes:s.budgetMinutes,partial:s.partial,topLeisureApps:s.topLeisureApps.map(a=>({name:a.name,minutes:Math.round(a.minutes)}))}))};
}
export function realityCheck(learning:number,goal:number,leisure:number|null,budget:number,tone:'direct'|'balanced'='direct'){
 const gap=Math.max(0,goal-learning),excess=leisure===null?null:Math.max(0,Math.round(leisure-budget));
 if(excess&&gap)return {title:'Your time and your goal are pulling apart.',body:`${Math.round(leisure!)} minutes in apps you marked Leisure; ${learning} of ${goal} learning minutes recorded. That is ${excess} minutes over your leisure budget and ${gap} minutes short of your learning target.`,action:tone==='direct'?`The current pattern is not meeting the goal you set. Put the device out of reach and do ${Math.min(20,gap)} minutes of your next lesson now.`:`Try ${Math.min(20,gap)} minutes on your next lesson, with the phone out of reach.`};
 if(gap)return {title:tone==='direct'?'The goal is still unfinished.':'A focused block would help.',body:`${learning} of ${goal} learning minutes recorded. ${leisure===null?'Leisure usage is unknown.':Math.round(leisure)+' minutes recorded in your selected leisure apps.'} Learning outside the app may be missing.`,action:`Log any learning you already did; otherwise start a ${Math.min(20,gap)} minute block before adding more material.`};
 if(excess)return {title:'Learning is covered. The leisure budget is not.',body:`Your ${goal} minute learning target is met, but selected leisure apps are ${excess} minutes over budget. Completing one target does not cancel the other.`,action:'Finish the current scroll, put the phone away, and choose an offline break.'};
 return {title:'The recorded goal is covered.',body:`${learning} learning minutes recorded. ${leisure===null?'Phone balance is unknown.':'Selected leisure apps are within the budget you set.'} Time alone does not prove understanding.`,action:'Explain one idea without notes, then decide whether you need another session or a break.'};
}
