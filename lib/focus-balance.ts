import {z} from 'zod';
import {dayKey,doneMinutes,type LearningState} from './learning.ts';
import {streaks} from './habits.ts';
export const balanceSettingsSchema=z.object({enabled:z.boolean().default(false),budgetMinutes:z.number().int().min(5).max(480).default(60),categories:z.record(z.enum(['learning','leisure','neutral','mixed'])).default({})});
export type BalanceSettings=z.infer<typeof balanceSettingsSchema>;
export const usageReportSchema=z.object({granted:z.boolean(),timezone:z.string().max(100).default(''),capturedAt:z.string().datetime(),days:z.array(z.object({day:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),minutes:z.number().min(0).max(1500),apps:z.array(z.object({id:z.string().max(250),name:z.string().max(250),minutes:z.number().min(0).max(1500)})).max(300)})).max(7)});
export type UsageReport=z.infer<typeof usageReportSchema>;
export function focusBalance(state:LearningState,settings:BalanceSettings,usage:UsageReport|null,now=new Date()){
 const day=dayKey(now,state.settings.timezone),minutes=doneMinutes(state,now),goal=state.settings.dailyMinutes;
 const row=usage?.granted&&settings.enabled&&usage.timezone===state.settings.timezone?usage.days.find(d=>d.day===day):undefined;
 const leisureIds=Object.keys(settings.categories).filter(k=>settings.categories[k]==='leisure');
 // An empty events window is unknown rather than proof that the phone was unused.
 const balanceKnown=!!row&&row.apps.length>0&&leisureIds.length>0;
 const leisureMinutes=balanceKnown?row!.apps.filter(a=>leisureIds.includes(a.id)).reduce((n,a)=>n+a.minutes,0):null;
 const reflected=state.coach.sessions.some(s=>dayKey(new Date(s.at),state.settings.timezone)===day&&s.reflection.trim().length>0);
 const learningPoints=Math.round(70*Math.min(1,minutes/goal));
 const balancePoints=leisureMinutes===null?null:Math.round(20*Math.max(0,1-Math.max(0,leisureMinutes-settings.budgetMinutes)/settings.budgetMinutes));
 const reflectionPoints=reflected?10:0,possible=balancePoints===null?80:100;
 const score=Math.round(100*(learningPoints+(balancePoints||0)+reflectionPoints)/possible);
 const habit=streaks(state,now),days=Array.from({length:7},(_,i)=>{const date=new Date(Date.parse(day+'T12:00:00Z')+(i-6)*86400000),key=date.toISOString().slice(0,10);return {day:key,minutes:habit.minutes.get(key)||0,phoneMinutes:usage?.granted&&settings.enabled&&usage.timezone===state.settings.timezone?usage.days.find(d=>d.day===key)?.minutes??null:null};});
 return {day,score,possible,minutes,goal,learningPoints,balancePoints,reflectionPoints,reflected,leisureMinutes,budgetMinutes:settings.budgetMinutes,screenMinutes:row?.apps.length?row.minutes:null,days,nextStep:minutes<goal?`${Math.min(20,goal-minutes)} minutes of focused learning would move today forward.`:!reflected?'Before another lesson, write one idea you can recall without looking.':leisureMinutes!==null&&leisureMinutes>settings.budgetMinutes?'Your selected leisure apps passed your budget. Consider a short phone-free break.':'Your learning goal and reflection are covered. Choose a next step deliberately.'};
}
// Only this small, reviewed summary may be attached to chat. No package IDs or app names.
export function balanceCoachSummary(result:ReturnType<typeof focusBalance>){return {day:result.day,score:result.score,learningMinutes:result.minutes,goalMinutes:result.goal,leisureMinutes:result.leisureMinutes,budgetMinutes:result.budgetMinutes,reflected:result.reflected,measurement:'Estimated Android foreground app time; selected leisure categories are user chosen. Missing usage is unknown. Logged minutes do not prove understanding.'};}
