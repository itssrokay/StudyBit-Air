import type {LearningState} from './learning.ts';
import {captureTitle} from './capture.ts';
import {dayKey} from './learning.ts';

/** What you saved something for. Ordered by how often you use each, so your usual reasons come first. */
export const DEFAULT_INTENTS=['Read later','Watch later','Try this','Buy','For interview','For the shop','For work','Idea'];
export function orderedIntents(inbox:LearningState['inbox']){
 const count=new Map<string,number>();for(const i of inbox)if(i.intent)count.set(i.intent,(count.get(i.intent)||0)+1);
 const custom=[...count.keys()].filter(k=>!DEFAULT_INTENTS.includes(k));
 return [...DEFAULT_INTENTS,...custom].sort((a,b)=>(count.get(b)||0)-(count.get(a)||0));
}

const shift=(key:string,days:number)=>new Date(Date.parse(key+'T12:00:00Z')+days*86400000).toISOString().slice(0,10);
export type RemindChoice='tonight'|'tomorrow'|'weekend'|'nextweek';
export const REMIND_LABELS:Record<RemindChoice,string>={tonight:'Tonight',tomorrow:'Tomorrow',weekend:'This weekend',nextweek:'Next week'};
/** The day to bring a save back, in your timezone. Weekend = the coming Saturday (today if it's already the weekend). */
export function remindDay(choice:RemindChoice,timezone:string,now=new Date()){
 const today=dayKey(now,timezone),dow=new Date(today+'T12:00:00Z').getUTCDay();// 0 Sun … 6 Sat
 if(choice==='tonight')return today;
 if(choice==='tomorrow')return shift(today,1);
 if(choice==='weekend')return dow===6||dow===0?today:shift(today,6-dow);
 return shift(today,((8-dow)%7)||7);// next Monday
}

export const saveTitle=(i:LearningState['inbox'][number])=>i.title||captureTitle(i.text);

/** Saves to bring back today: still to review, with a reminder day that has arrived. Oldest reminder first. */
export function dueSaves(state:LearningState,workspace:string,now=new Date()){
 const today=dayKey(now,state.settings.timezone);
 return state.inbox.filter(i=>i.workspace===workspace&&i.status==='inbox'&&i.remindOn&&i.remindOn<=today).sort((a,b)=>(a.remindOn||'').localeCompare(b.remindOn||'')||b.createdAt.localeCompare(a.createdAt));
}

const words=(t:string)=>t.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(w=>w.length>1);
const stem=(w:string)=>w.replace(/(ing|ed|es|s)$/,'');
/** Search everything saved by what you remember: title, text, your why, the intent, and text read from screenshots.
 * Every word must match (prefix or stem), and hits in your own "why" and the title rank highest. */
export function searchSaves(inbox:LearningState['inbox'],query:string,workspace?:string){
 const q=words(query).map(stem);if(!q.length)return [];
 const scored=inbox.filter(i=>!workspace||i.workspace===workspace).map(i=>{
  const fields:[string,number][]=[[saveTitle(i),3],[i.why||'',3],[i.intent||'',2],[i.text,1],[i.imageText||'',1]];
  let score=0;for(const term of q){let best=0;for(const [f,w] of fields){if(words(f).some(x=>stem(x).startsWith(term)||x.startsWith(term)))best=Math.max(best,w);}if(!best)return null;score+=best;}
  return {item:i,score:score+(i.status==='inbox'?0.5:0)};
 }).filter((x):x is {item:LearningState['inbox'][number];score:number}=>!!x);
 return scored.sort((a,b)=>b.score-a.score||b.item.createdAt.localeCompare(a.item.createdAt)).map(x=>x.item);
}
