import {dailyPlan,dayKey,doneMinutes,dailyBudget,rankResource,eligibleLessons,type LearningState} from './learning.ts';
import {streaks} from './habits.ts';
import {coachReplySchema,type CoachReply,type CoachMessage} from './coach-schema.ts';

const shift=(day:string,n:number)=>new Date(Date.parse(day+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
export function coachActivity(state:LearningState,now=new Date()){
 const today=dayKey(now,state.settings.timezone),habit=streaks(state,now);
 const days=Array.from({length:7},(_,i)=>({day:shift(today,i-6),minutes:habit.minutes.get(shift(today,i-6))||0}));
 return {today,minutesToday:doneMinutes(state,now),minutesWeek:days.reduce((n,d)=>n+d.minutes,0),daysWeek:days.filter(d=>d.minutes>0).length,streak:habit.current,lastLoggedDay:[...habit.minutes].filter(([d,n])=>d<=today&&n>0).map(([d])=>d).sort().at(-1)||null};
}
export type CoachInsight={id:string;label:string;title:string;body:string;details:string[];prompt:string;context:string};
export function coachInsights(state:LearningState,now=new Date()):CoachInsight[]{
 const a=coachActivity(state,now),next=dailyPlan(state,now)[0];
 const activity:CoachInsight=a.minutesWeek?{id:'rhythm',label:'YOUR RHYTHM',title:`${a.minutesWeek} minutes, one step at a time`,body:`You recorded learning on ${a.daysWeek} of the last 7 days. ${a.minutesToday?'There’s already progress in today’s log.':'A short session can make today count too.'}`,details:[`${a.minutesToday} minutes recorded today.`,`${a.streak} day streak at your ${state.settings.streakMinimum} minute threshold.`,`Based on study logs and dated completions in ${state.settings.timezone}.`],prompt:'Help me build on this learning rhythm.',context:`Recorded activity: ${a.minutesWeek} minutes on ${a.daysWeek} days in the last seven calendar days; ${a.minutesToday} minutes today.`}:{id:'start',label:'A SMALL START',title:a.lastLoggedDay?'There’s room to begin again':'Your first session starts here',body:a.lastLoggedDay?`No learning time has been logged here since ${a.lastLoggedDay}. A small next step is ready when you are.`:'No study time is recorded yet. Start with one manageable block, then log what you actually study.',details:[a.lastLoggedDay?`Last recorded learning day: ${a.lastLoggedDay}.`:'Sample course progress is illustrative and doesn’t count as study time.','Learning outside this app may be missing. The coach will ask before drawing conclusions.'],prompt:'Help me get back on track',context:a.lastLoggedDay?`No recorded learning time in the last seven days. Last logged day: ${a.lastLoggedDay}. Activity outside this app is unknown.`:'There is no recorded study time. Sample progress is not activity. Activity outside this app is unknown.'};
 const result=[activity];
 if(next)result.push({id:'next',label:'YOUR NEXT STEP',title:next.lesson.title,body:`${next.plannedMinutes} minutes of ${next.resource.title}. ${next.reason}.`,details:[`Priority ${next.resource.priority} of 5.`,next.resource.focusModule?`Module focus: ${next.resource.focusModule}.`:'The next eligible unfinished lesson in this resource.',`${next.plannedMinutes<next.lesson.minutes-next.lesson.studiedMinutes?'A resumable block of':'Estimated duration:'} ${next.lesson.minutes-next.lesson.studiedMinutes} remaining minutes.`,next.resource.demo?'This resource is sample content.':'Based on your saved lesson list; hidden course content is unavailable.'],prompt:'What should I study next and why?',context:`Dashboard recommendation: ${next.lesson.title} in ${next.resource.title}, lesson ID ${next.lesson.id}, ${next.plannedMinutes} minutes. Reason: ${next.reason}.`});
 else if(a.minutesToday>=dailyBudget(state,now))result.push({id:'done',label:'ROOM TO REFLECT',title:'Your plan’s time goal is met',body:`${a.minutesToday} minutes are recorded today. Capture one idea you want to keep, or choose a new plan if you have more time.`,details:['Recorded minutes include study blocks and dated lesson completions.','Meeting a time goal does not mean every lesson is complete.'],prompt:'Help me reflect on today’s learning.',context:`${a.minutesToday} minutes recorded today; today’s budget is ${dailyBudget(state,now)} minutes.`});
 return result;
}

export function validateCoachReply(raw:unknown,state:LearningState):CoachReply{
 const reply=coachReplySchema.parse(raw),resources=state.resources.filter(r=>!r.archived);
 if(new Set(reply.suggestions.map(s=>s.resourceId)).size!==reply.suggestions.length)throw Error('The coach suggested a course twice. Try again.');
 for(const s of reply.suggestions){const r=resources.find(r=>r.id===s.resourceId);if(!r||(s.focusModule&&!r.lessons.some(l=>l.modulePath===s.focusModule||l.modulePath.startsWith(s.focusModule+'/'))))throw Error('A suggested course or module is no longer available. Ask for a fresh plan.');}
 if(reply.todayPlan){const ids=reply.todayPlan.lessonIds;if(new Set(ids).size!==ids.length||ids.some(id=>!resources.some(r=>r.lessons.some(l=>l.id===id&&!l.done&&l.studiedMinutes<l.minutes))))throw Error('A suggested lesson is no longer available. Ask for a fresh plan.');}
 return reply;
}
export function applyCoachReply(state:LearningState,raw:unknown,now=new Date()){
 const reply=validateCoachReply(raw,state);
 return {...state,resources:state.resources.map(r=>{const s=reply.suggestions.find(s=>s.resourceId===r.id);return s?{...r,priority:s.priority,focusModule:s.focusModule||r.focusModule}:r;}),coach:{...state.coach,todayPlan:reply.todayPlan?{day:dayKey(now,state.settings.timezone),minutes:reply.todayPlan.minutes,lessonIds:reply.todayPlan.lessonIds}:state.coach.todayPlan}};
}
export function smartCoachReply(state:LearningState,prompt:string,now=new Date()):CoachReply{
 const a=coachActivity(state,now),match=prompt.match(/\b(\d{1,3})\s*(?:min(?:ute)?s?)\b/i),restart=/back on track|finish what|rhythm|start again/i.test(prompt),nextRequest=/next|why|priorit|focus/i.test(prompt);
 let minutes=match?Math.min(480,Math.max(1,Number(match[1]))):restart?20:Math.max(1,dailyBudget(state,now)-a.minutesToday);
 const suggestedState={...state,coach:{...state.coach,todayPlan:null},settings:{...state.settings,dailyMinutes:Math.min(480,a.minutesToday+minutes)}};
 const plan=dailyPlan(suggestedState,now),next=plan[0];
 const empty={suggestions:[],todayPlan:null,question:''};
 if(!next)return {...empty,message:'There isn’t an eligible unfinished lesson in your saved library. Add a resource or check whether a course’s module focus hides its remaining lessons.',question:'What would you like to learn next?'};
 if(!match&&!restart&&!nextRequest)return {...empty,message:`I can use your saved priorities and recorded activity, but I don’t want to guess what you mean. Your next ranked lesson is “${next.lesson.title}” in ${next.resource.title}.`,question:'Which goal or course would you like to work on, and how many minutes do you have today?'};
 const total=plan.reduce((n,p)=>n+p.plannedMinutes,0);
 const explanation=`“${next.lesson.title}” is first because it is ${next.reason.toLowerCase()}. ${next.resource.demo?'It is sample content, so choose a real course when you’re ready. ':''}${next.plannedMinutes<next.lesson.minutes-next.lesson.studiedMinutes?'You can study a smaller block and resume later. ':''}`;
 return {...empty,message:match?`Here is a ${total} minute plan using your saved ranking. ${explanation}Your usual ${state.settings.dailyMinutes} minute goal stays the same.`:restart?`A ${total} minute restart is a manageable option. ${explanation}`:`Your next step is ${next.plannedMinutes} minutes of ${next.resource.title}. ${explanation}The ranking uses priorities, goals, module focus, deadlines, and saved lesson order.`,question:restart&&!a.minutesWeek?'Have you studied elsewhere without logging it here, or would a smaller plan help today?':'',todayPlan:match||restart?{minutes:Math.min(480,a.minutesToday+total),lessonIds:plan.map(p=>p.lesson.id),reason:`${total} more minutes today, in this order. Expires at the end of today in your timezone.`}:null};
}

export function coachContext(state:LearningState,messages:CoachMessage[]=[],context='',now=new Date()){
 const resources=state.resources.filter(r=>!r.archived).sort((a,b)=>rankResource(b,state,now)-rankResource(a,state,now)).slice(0,40);
 const contextData={activity:coachActivity(state,now),settings:state.settings,todayBudget:dailyBudget(state,now),remembered:state.coach.memory,goals:state.goals,insight:context.slice(0,2000),history:messages.slice(-12).map(m=>({role:m.role,text:m.text.slice(0,1000),source:m.source,question:m.reply?.question||'',proposals:m.reply?{suggestions:m.reply.suggestions.map(s=>({resourceId:s.resourceId,priority:s.priority,focusModule:s.focusModule})),todayPlan:m.reply.todayPlan?{minutes:m.reply.todayPlan.minutes,lessonIds:m.reply.todayPlan.lessonIds}:null}:null,appliedAt:m.appliedAt})),scope:`Only metadata for ${resources.length} saved active resources. Sample progress is illustrative. Activity elsewhere and hidden course content are unknown.`,resources:resources.map(r=>({id:r.id,title:r.title,kind:r.kind,sample:r.demo,folder:r.folderPath,priority:r.priority,goalId:r.goalId,deadline:r.deadline,focusModule:r.focusModule,completed:r.lessons.filter(l=>l.done).length,total:r.lessons.length,modules:[...new Set(r.lessons.flatMap(l=>l.modulePath.split('/').map((_,i,a)=>a.slice(0,i+1).join('/'))).filter(Boolean))].slice(0,8),nextLessons:eligibleLessons(r).slice(0,3).map(l=>({id:l.id,title:l.title.slice(0,150),module:l.modulePath,remainingMinutes:l.minutes-l.studiedMinutes,format:l.format}))}))};
 // Bound the context for the native request bridge, including non-ASCII text.
 const bytes=()=>new TextEncoder().encode(JSON.stringify(contextData)).length;
 while(bytes()>110000&&contextData.resources.length>1)contextData.resources.pop();
 while(bytes()>110000&&contextData.history.length>0)contextData.history.shift();
 contextData.scope=`Only metadata for ${contextData.resources.length} saved active resources and ${contextData.history.length} recent messages. Sample progress is illustrative. Activity elsewhere and hidden course content are unknown.`;
 return contextData;
}
