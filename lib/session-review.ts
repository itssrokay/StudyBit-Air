import {dailyPlan,rankResource,uid,type LearningState} from './learning.ts';
import {logStudyBlock} from './course-tools.ts';
import type {StudySession} from './coach-schema.ts';
export type SessionFeedback={difficulty:StudySession['difficulty'];reflection:string;timerSeconds:number;timeSource:StudySession['timeSource'];plannedMinutes:number};
/** Snapshot the choice before logging changes the queue. Time is self-reported, never inferred mastery. */
export function finishStudySession(state:LearningState,rid:string,lid:string,minutes:number,feedback:SessionFeedback,now=new Date(),baseline=state,sessionId=uid()):LearningState{
 if(state.coach.sessions.some(s=>s.id===sessionId)||state.activityRemovals.some(e=>(e.kind==='session'||e.kind==='log')&&e.targetId===sessionId))return state;
 const reset=state.activityRemovals.find(e=>e.kind==='lesson'&&e.targetId===lid);if(reset&&reset.at===now.toISOString())now=new Date(now.getTime()+1);
 const resource=state.resources.find(r=>r.id===rid),lesson=resource?.lessons.find(l=>l.id===lid);
 if(!resource||!lesson||lesson.done||!Number.isInteger(minutes)||minutes<1||minutes>lesson.minutes-lesson.studiedMinutes)return state;
 const next=logStudyBlock(state,rid,lid,minutes,now,sessionId);if(next===state)return state;
 const choice=dailyPlan(baseline,now)[0];
 const recommended=choice?{resourceId:choice.resource.id,lessonId:choice.lesson.id,resourceTitle:choice.resource.title,lessonTitle:choice.lesson.title,reason:choice.reason}:null;
 const focusGoal=baseline.goals.find(g=>g.id===baseline.settings.focusGoal)?.title||'';
 const goal=baseline.goals.find(g=>g.id===resource.goalId)?.title||'';
 const other=!!choice&&choice.resource.id!==rid;
 const outOfOrder=!!choice&&choice.resource.id===rid&&choice.lesson.id!==lid&&baseline.resources.find(r=>r.id===rid)?.lessons.find(l=>!l.done)?.id!==lid;
 const stronger=outOfOrder||(other&&((!!focusGoal&&resource.goalId!==baseline.settings.focusGoal&&choice.resource.goalId===baseline.settings.focusGoal)||rankResource(choice.resource,baseline,now)>rankResource(resource,baseline,now)));
 const verdict=stronger?'detour':choice?'aligned':'unplanned';
 const completed=next.resources.find(r=>r.id===rid)!.lessons.find(l=>l.id===lid)!.done;
 const reflection=feedback.reflection.trim().slice(0,1000);
 const summary=`You recorded ${minutes} minutes on “${lesson.title}”${completed?' and marked the lesson finished':''}. `+(stronger?`Your plan put “${choice!.lesson.title}” first${focusGoal?' for '+focusGoal:''}. This choice left that priority waiting; consider whether the detour was intentional.`:choice?`This ${other?'alternative fits your saved priorities':'followed your planned next step'}${goal?' toward '+goal:''}.`:'Your daily queue was empty, so this was additional study.')+(feedback.difficulty==='stuck'?' You reported getting stuck; more watch time alone may not resolve the gap.':'');
 const nextItem=dailyPlan(next,now)[0];
 const nextStep=feedback.difficulty==='stuck'?`Before moving on, write the specific point you cannot explain in “${lesson.title}”, then revisit its prerequisite or try one small example.`:nextItem?`Next: ${nextItem.lesson.title} · ${nextItem.plannedMinutes} min in ${nextItem.resource.title}. ${nextItem.reason}.`:'Your planned time is covered. Before another lesson, recall one idea without looking at your notes.';
 const session:StudySession={id:sessionId,at:now.toISOString(),resourceId:rid,lessonId:lid,resourceTitle:resource.title,lessonTitle:lesson.title,minutes,plannedMinutes:Math.max(1,Math.min(600,Math.round(feedback.plannedMinutes))),completed,timeSource:feedback.timeSource,timerSeconds:Math.min(86400,Math.max(0,Math.floor(feedback.timerSeconds))),difficulty:feedback.difficulty,reflection,goal,focusGoal,recommended:recommended||null,verdict,summary,nextStep,aiStatus:state.coach.autoReviews?'queued':'off',aiError:'',reply:null};
 return {...next,coach:{...next.coach,sessions:[session,...next.coach.sessions].slice(0,120)}};
}
