import type {LearningState,Lesson} from './learning.ts';
export type ActivityRemoval={id:string;kind:'resource'|'lesson'|'log'|'session';targetId:string;at:string;lessonId:string};
function removal(kind:ActivityRemoval['kind'],targetId:string,at:string,lessonId=''):ActivityRemoval{return {id:kind+':'+targetId,kind,targetId,at,lessonId};}
function addRemovals(state:LearningState,events:ActivityRemoval[]){const byId=new Map(state.activityRemovals.map(x=>[x.id,x]));for(const event of events){const old=byId.get(event.id);if(!old||old.at<event.at)byId.set(event.id,event);}if(byId.size>20000)throw Error('Activity history is full. Export a backup before making more changes.');return {...state,activityRemovals:[...byId.values()]};}
export function liveStudyLogs(state:LearningState){
 const resources=new Map(state.resources.map(r=>[r.id,new Set(r.lessons.map(l=>l.id))]));const removed=new Set(state.activityRemovals.filter(e=>e.kind==='log'||e.kind==='resource').map(e=>e.kind+':'+e.targetId));const resets=new Map(state.activityRemovals.filter(e=>e.kind==='lesson').map(e=>[e.targetId,e.at]));
 return state.studyLog.filter(l=>resources.get(l.resourceId)?.has(l.lessonId)&&!removed.has('resource:'+l.resourceId)&&!removed.has('log:'+l.id)&&(!resets.has(l.lessonId)||l.at>resets.get(l.lessonId)!));
}
function invalidateReviews(state:LearningState):LearningState{return {...state,coach:{...state.coach,sessions:state.coach.sessions.map(s=>({...s,reply:null,aiStatus:'off',aiError:'',nextStep:''}))}};}
/** Repair dangling legacy activity and enforce removals after restore, save and Wi-Fi merge. */
export function normalizeActivity(state:LearningState):LearningState{
 const removedResources=new Set(state.activityRemovals.filter(e=>e.kind==='resource').map(e=>e.targetId));const resources=state.resources.filter(r=>!removedResources.has(r.id));const refs=new Map(resources.map(r=>[r.id,new Set(r.lessons.map(l=>l.id))]));
 const studyLog=liveStudyLogs({...state,resources});const resetAt=new Map(state.activityRemovals.filter(e=>e.kind==='lesson').map(e=>[e.targetId,e.at]));const removedSessions=new Set(state.activityRemovals.filter(e=>e.kind==='session').map(e=>e.targetId));const removedLogs=new Set(state.activityRemovals.filter(e=>e.kind==='log').map(e=>e.targetId));
 const touched=new Set([...resetAt.keys(),...state.activityRemovals.filter(e=>e.kind==='log'&&e.lessonId).map(e=>e.lessonId)]);const totals=new Map<string,number>();for(const l of studyLog)totals.set(l.lessonId,(totals.get(l.lessonId)||0)+l.minutes);
 const sessions=state.coach.sessions.filter(s=>refs.get(s.resourceId)?.has(s.lessonId)&&!removedSessions.has(s.id)&&!removedLogs.has(s.id)&&(!resetAt.has(s.lessonId)||s.at>resetAt.get(s.lessonId)!));
 const lessonIds=new Set(resources.flatMap(r=>r.lessons.map(l=>l.id)));const chosen=state.coach.todayPlan?.lessonIds.filter(id=>lessonIds.has(id))||[];
 let result:LearningState={...state,resources:resources.map(r=>({...r,lessons:r.lessons.map(l=>{if(!touched.has(l.id))return l;const studiedMinutes=Math.min(l.minutes,totals.get(l.id)||0),done=studiedMinutes>=l.minutes;return {...l,studiedMinutes,done,completedAt:done?studyLog.filter(log=>log.lessonId===l.id).map(log=>log.at).sort().at(-1)||null:null};})})),studyLog,coach:{...state.coach,sessions,todayPlan:state.coach.todayPlan&&chosen.length?{...state.coach.todayPlan,lessonIds:chosen}:null}};
 if(studyLog.length!==state.studyLog.length||sessions.length!==state.coach.sessions.length)result=invalidateReviews(result);return result;
}
export function resetLessonProgress(state:LearningState,rid:string,lid:string,now=new Date()):LearningState{
 if(!state.resources.some(r=>r.id===rid&&r.lessons.some(l=>l.id===lid)))return state;
 const next=addRemovals(state,[removal('lesson',lid,now.toISOString(),lid)]);
 return invalidateReviews(normalizeActivity({...next,resources:next.resources.map(r=>r.id===rid?{...r,lessons:r.lessons.map(l=>l.id===lid?{...l,done:false,completedAt:null,studiedMinutes:0}:l)}:r)}));
}
export function resetResourceProgress(state:LearningState,rid:string,now=new Date()):LearningState{
 const r=state.resources.find(r=>r.id===rid);if(!r)return state;const at=now.toISOString();return invalidateReviews(normalizeActivity(addRemovals(state,r.lessons.map(l=>removal('lesson',l.id,at,l.id)))));
}
export function deleteResource(state:LearningState,rid:string,now=new Date()):LearningState{return invalidateReviews(normalizeActivity(addRemovals(state,[removal('resource',rid,now.toISOString())])));}
export function deleteStudySession(state:LearningState,id:string,now=new Date()):LearningState{
 const session=state.coach.sessions.find(s=>s.id===id);if(!session)return state;
 const log=state.studyLog.find(l=>l.id===id)||state.studyLog.find(l=>l.lessonId===session.lessonId&&l.resourceId===session.resourceId&&l.at===session.at&&l.minutes===session.minutes);
 const at=now.toISOString();const events=[removal('session',id,at,session.lessonId),...(log?[removal('log',log.id,at,session.lessonId)]:[])];let next=addRemovals(state,events);
 // Legacy estimated completions may predate the session-linked log format.
 if(!log)next={...next,resources:next.resources.map(r=>r.id===session.resourceId?{...r,lessons:r.lessons.map(l=>l.id===session.lessonId?{...l,studiedMinutes:Math.max(0,l.studiedMinutes-session.minutes),done:false,completedAt:null}:l)}:r)};
 return invalidateReviews(normalizeActivity(next));
}
export function deleteStudyLog(state:LearningState,id:string,now=new Date()):LearningState{
 const log=state.studyLog.find(l=>l.id===id);if(!log)return state;const at=now.toISOString();const linked=state.coach.sessions.filter(s=>s.id===id||(s.resourceId===log.resourceId&&s.lessonId===log.lessonId&&s.at===log.at&&s.minutes===log.minutes));
 return invalidateReviews(normalizeActivity(addRemovals(state,[removal('log',id,at,log.lessonId),...linked.map(s=>removal('session',s.id,at,s.lessonId))])));
}
