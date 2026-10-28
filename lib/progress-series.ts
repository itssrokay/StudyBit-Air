import {dayKey,type LearningState} from './learning.ts';
import {streaks} from './habits.ts';
export type ProgressRange='W'|'M'|'3M'|'Y';
export type SeriesBar={key:string;label:string;minutes:number;current:boolean};
const shift=(key:string,days:number)=>new Date(Date.parse(key+'T12:00:00Z')+days*86400000).toISOString().slice(0,10);
const fmt=(key:string,o:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat('en',{...o,timeZone:'UTC'}).format(new Date(key+'T12:00:00Z'));
/** Learning minutes grouped for the Progress chart: 7 days, 30 days, 13 weeks or 12 months. */
export function progressSeries(state:LearningState,now:Date,range:ProgressRange,minutes=streaks(state,now).minutes){
 const today=dayKey(now,state.settings.timezone),on=(d:string)=>minutes.get(d)||0;
 let bars:SeriesBar[]=[];
 if(range==='W'||range==='M'){const n=range==='W'?7:30;bars=Array.from({length:n},(_,i)=>{const d=shift(today,i-n+1);return {key:d,label:range==='W'?fmt(d,{weekday:'narrow'}):(i%5===4||i===n-1?String(Number(d.slice(8))):''),minutes:on(d),current:d===today};});}
 else if(range==='3M'){bars=Array.from({length:13},(_,i)=>{const end=shift(today,(i-12)*7),days=Array.from({length:7},(_,j)=>shift(end,-j));const first=days[6];return {key:end,label:i%4===0||i===12?fmt(first,{month:'short',day:'numeric'}):'',minutes:days.reduce((t,d)=>t+on(d),0),current:i===12};});}
 else{const [y,m]=today.split('-').map(Number);bars=Array.from({length:12},(_,i)=>{const date=new Date(Date.UTC(y,m-1-(11-i),1)),prefix=date.toISOString().slice(0,7);let total=0;for(const [d,v] of minutes)if(d.startsWith(prefix)&&d<=today)total+=v;return {key:prefix,label:fmt(prefix+'-01',{month:'narrow'}),minutes:total,current:i===11};});}
 const total=bars.reduce((t,b)=>t+b.minutes,0),active=bars.filter(b=>b.minutes>0).length;
 const days=range==='W'?7:range==='M'?30:range==='3M'?91:365;
 return {bars,total,average:Math.round(total/days),active,unit:range==='W'||range==='M'?'day':range==='3M'?'week':'month'};
}
