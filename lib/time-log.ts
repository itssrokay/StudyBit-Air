import {type LearningState} from './learning.ts';
import {logExtra} from './capture.ts';
import {finishStudySession} from './session-review.ts';
import {makeResource} from './learning.ts';
import {validateQuickLog} from './quick-log.ts';
import type {Workspace} from './spaces.ts';
export const QUICK_TIMER_PREFIX='quick-log-';
export function clockTime(ms:number){const seconds=Math.floor(Math.max(0,ms)/1000);return [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,'0')).join(':');}
export function saveTimeEntry(state:LearningState,input:{title:string;url:string;minutes:number;kind:'article'|'video'|'topic';reflection:string;workspace:Workspace;keep:boolean;resourceId:string;timerSeconds:number},now:Date,id:string):LearningState{
 if(state.coach.sessions.some(s=>s.id===id+'-session')||state.studyLog.some(l=>l.id===id+'-session')||state.activityRemovals.some(e=>e.targetId===id||e.targetId===id+'-session'))return state;
 const checked=validateQuickLog(input);if(!checked.valid)throw Error(Object.values(checked.errors)[0]);
 if(!input.resourceId){const next=logExtra(state,input,now,id);return {...next,coach:{...next.coach,sessions:next.coach.sessions.map(s=>s.id===id+'-session'?{...s,timerSeconds:Math.min(86400,Math.max(0,input.timerSeconds))}:s)}};}
 const resource=state.resources.find(r=>r.id===input.resourceId&&r.workspace===input.workspace&&!r.demo);if(!resource)throw Error('That course is no longer available. Choose another course or Standalone learning.');
 if(resource.lessons.length>=500)throw Error('This course has reached its lesson limit. Save as standalone learning.');
 if(state.studyLog.length>=20000)throw Error('Your activity history is full. Export a backup first.');
 const lesson=makeResource({},[{id:id+'-lesson',title:checked.value.title,minutes:input.minutes,url:checked.value.url,format:input.kind==='article'?'reading':input.kind==='video'?'video':'exercise',modulePath:'Extra study'}]).lessons[0];
 const prepared={...state,resources:state.resources.map(r=>r.id===resource.id?{...r,lessons:[...r.lessons,lesson]}:r)};
 return finishStudySession(prepared,resource.id,lesson.id,input.minutes,{difficulty:'unknown',reflection:input.reflection,timerSeconds:input.timerSeconds,timeSource:'logged',plannedMinutes:input.minutes},now,state,id+'-session');
}
