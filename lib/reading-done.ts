import {dailyPlan,type LearningState,type Resource} from './learning.ts';
import {finishStudySession} from './session-review.ts';
import {resetLessonProgress} from './activity.ts';
/** "Mark as read" for a whole resource in one tap. Finishing logs the remaining estimated minutes,
 * exactly like ticking each lesson; undoing resets every lesson. */
export const isFinished=(r:Resource)=>r.lessons.length>0&&r.lessons.every(l=>l.done);
export function markFinished(state:LearningState,rid:string,done:boolean,now=new Date()):LearningState{
 const r=state.resources.find(x=>x.id===rid);if(!r)return state;let s=state;
 for(const l of r.lessons){
  if(done&&!l.done){const left=Math.max(0,l.minutes-l.studiedMinutes);s=finishStudySession(s,rid,l.id,left,{difficulty:'unknown',reflection:'',timerSeconds:0,timeSource:'estimated',plannedMinutes:dailyPlan(s,now).find(p=>p.lesson.id===l.id)?.plannedMinutes||left},now);}
  else if(!done&&l.done)s=resetLessonProgress(s,rid,l.id,now);
 }
 return s;
}
