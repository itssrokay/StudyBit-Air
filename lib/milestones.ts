import {dayKey,type LearningState} from './learning.ts';
import {streaks} from './habits.ts';
export type Reward=LearningState['rewards'][number];
export type Todo=LearningState['todos'][number];
const nextDay=(day:string)=>new Date(Date.parse(day+'T12:00:00Z')+86400000).toISOString().slice(0,10);
// Recalculate from real learning each time. Removing activity also removes its contribution.
export function rewardProgress(state:LearningState,reward:Reward,now=new Date(),minutes=streaks(state,now).minutes){
 const today=dayKey(now,state.settings.timezone);
 const days=[...minutes].filter(([day,minutes])=>day>=reward.startDay&&day<=today&&minutes>=reward.minimumMinutes).map(([day])=>day).sort();
 let best=0,run=0,previous='';for(const day of days){run=previous&&nextDay(previous)===day?run+1:1;best=Math.max(best,run);previous=day;}
 const value=reward.metric==='days'?days.length:best;
 return {value,percent:Math.min(100,value/reward.targetDays*100),eligible:value>=reward.targetDays,days};
}
export function redeemReward(state:LearningState,id:string,now=new Date()):LearningState{
 const reward=state.rewards.find(r=>r.id===id);
 if(!reward||reward.redeemedAt||!rewardProgress(state,reward,now).eligible)return state;
 return {...state,rewards:state.rewards.map(r=>r.id===id?{...r,redeemedAt:now.toISOString()}:r)};
}
export function todayTodos(state:LearningState,now=new Date()){
 const today=dayKey(now,state.settings.timezone);
 return state.todos.filter(t=>t.doneAt?dayKey(new Date(t.doneAt),state.settings.timezone)===today:!t.dueDay||t.dueDay<=today).sort((a,b)=>Number(!!a.doneAt)-Number(!!b.doneAt)||(a.dueDay||'9999').localeCompare(b.dueDay||'9999')||a.createdAt.localeCompare(b.createdAt));
}
