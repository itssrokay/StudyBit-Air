import {parseLibrary,makeResource,eligibleLessons,dayKey,type LearningState} from './learning.ts';
import {coachActionsSchema,type CoachAction,type ActionReceipt} from './coach-action-schema.ts';
import {normalizePath} from './course-tools.ts';
import {logExtra} from './capture.ts';
import {deleteResource,deleteStudySession} from './activity.ts';
const stable=(value:unknown):string=>JSON.stringify(value,(_key,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const equal=(a:unknown,b:unknown)=>stable(a)===stable(b);
export function validateCoachActions(state:LearningState,raw:unknown,scope:'all'|'personal'|'work'='all'){
 const actions=coachActionsSchema.parse(raw||[]),keys=new Set<string>(),goalKeys=new Map(actions.filter(a=>a.type==='create_goal').map(a=>[a.key,a.workspace]));
 const referenced=new Set<string>();
 for(const a of actions){
  if('key'in a){if(keys.has(a.key)||state.goals.some(g=>g.id===a.key))throw Error('The coach used a creation key twice. Ask for a fresh proposal.');keys.add(a.key);}
  if('workspace'in a&&scope!=='all'&&a.workspace!==scope)throw Error('This proposal changes another learning space. Switch context and ask again.');
  if('goalRef'in a&&a.goalRef){const goal=state.goals.find(g=>g.id===a.goalRef),space=goal?.workspace||goalKeys.get(a.goalRef);if(!space)throw Error('A proposed goal is no longer available.');const targetSpace='workspace'in a?a.workspace:state.resources.find(r=>r.id===a.resourceId)?.workspace;if(space!==targetSpace)throw Error('Goals and resources must belong to the same space.');}
  if(a.type==='organize_resource'){const r=state.resources.find(r=>r.id===a.resourceId);if(!r||scope!=='all'&&r.workspace!==scope)throw Error('That resource is no longer available in this space.');if(referenced.has('resource:'+r.id))throw Error('The same resource is changed twice.');referenced.add('resource:'+r.id);}
  if(a.type==='file_capture'){const c=state.inbox.find(i=>i.id===a.captureId);if(!c||c.status!=='inbox'||scope!=='all'&&c.workspace!==scope)throw Error('That capture is already filed or unavailable.');if(referenced.has('capture:'+c.id))throw Error('The same capture is filed twice.');referenced.add('capture:'+c.id);}
  if(a.type==='set_today_plan'){if(referenced.has('plan'))throw Error('Only one Today plan can be proposed at a time.');referenced.add('plan');if(new Set(a.resourceRefs).size!==a.resourceRefs.length)throw Error('A planned resource was repeated.');for(const ref of a.resourceRefs){const r=state.resources.find(r=>r.id===ref)||actions.find(x=>x.type==='create_resource'&&x.key===ref);if(!r||!('workspace'in r)||r.workspace!==a.workspace)throw Error('A planned resource is unavailable in this space.');}}
  if(a.type==='set_daily_goal'){if(referenced.has('target:'+a.workspace))throw Error('The same daily goal is changed twice.');referenced.add('target:'+a.workspace);}
 }
 return actions;
}
export function coachChangeReceipt(before:LearningState,after:LearningState):ActionReceipt{
 const changes:ActionReceipt['changes']=[];
 for(const collection of ['resources','goals','todos','inbox','studyLog','sessions'] as const){const left=collection==='sessions'?before.coach.sessions:before[collection],right=collection==='sessions'?after.coach.sessions:after[collection];const l=new Map<string,unknown>(left.map(x=>[x.id,x])),r=new Map<string,unknown>(right.map(x=>[x.id,x]));for(const id of new Set([...l.keys(),...r.keys()]))if(!equal(l.get(id),r.get(id)))changes.push({collection,id,before:l.has(id)?stable(l.get(id)):null,after:r.has(id)?stable(r.get(id)):null});}
 for(const id of ['dailyMinutes','workDailyMinutes','focusGoal','workFocusGoal'] as const)if(before.settings[id]!==after.settings[id])changes.push({collection:'settings',id,before:JSON.stringify(before.settings[id]),after:JSON.stringify(after.settings[id])});
 if(!equal(before.coach.todayPlan,after.coach.todayPlan))changes.push({collection:'todayPlan',id:'todayPlan',before:stable(before.coach.todayPlan),after:stable(after.coach.todayPlan)});
 if(JSON.stringify(changes).length>300000)throw Error('This proposal is too large to keep a safe undo record. Ask for fewer changes.');return {changes,undoneAt:null};
}
export function applyCoachActions(state:LearningState,raw:unknown,batchId:string,scope:'all'|'personal'|'work'='all',now=new Date()){
 const actions=validateCoachActions(state,raw,scope);let next=state;
 const ids=new Map(actions.flatMap((a,i)=>'key'in a?[[a.key,'ca-'+batchId.slice(0,42)+'-'+i] as const]:[]));
 const goalId=(ref:string)=>ids.get(ref)||ref;
 // Goal references can point to goals created anywhere in the same batch.
 for(const a of actions)if(a.type==='create_goal'){const id=ids.get(a.key)!;if(state.goals.some(g=>g.id===id))throw Error('This proposal was already applied.');next={...next,goals:[...next.goals,{id,workspace:a.workspace,title:a.title,description:a.description,importance:a.importance,image:''}]};}
 for(const a of actions){
  if(a.type==='create_resource'){const id=ids.get(a.key)!;if(next.resources.some(r=>r.id===id)||next.activityRemovals.some(e=>e.targetId===id))throw Error('This proposal was already applied or undone.');const generated=a.outlineSource==='generated';const r=makeResource({id,workspace:a.workspace,title:a.title,kind:a.kind,url:a.url,goalId:goalId(a.goalRef),priority:a.priority,folderPath:normalizePath(a.folderPath),provider:generated?'AI study roadmap':'Your supplied outline',captureNote:generated?'AI-generated study roadmap. These are suggested learning tasks, not a verified course or book table of contents. Durations are estimates.':'Created from the outline supplied in your coach conversation. Durations are estimates.',outlineSource:generated?'ai-plan':'manual',createdAt:now.toISOString()},a.lessons.map((l,i)=>({...l,id:id+'-l'+i,modulePath:normalizePath(l.modulePath),durationEstimated:true})));next={...next,resources:[...next.resources,r]};}
  if(a.type==='organize_resource')next={...next,resources:next.resources.map(r=>r.id===a.resourceId?{...r,folderPath:normalizePath(a.folderPath),priority:a.priority,goalId:goalId(a.goalRef)}:r)};
  if(a.type==='create_todo'){const id=ids.get(a.key)!;if(next.todos.some(t=>t.id===id))throw Error('This proposal was already applied.');next={...next,todos:[...next.todos,{id,workspace:a.workspace,title:a.title,goalId:goalId(a.goalRef),dueDay:a.dueDay,createdAt:now.toISOString(),doneAt:null}]};}
  if(a.type==='file_capture')next={...next,inbox:next.inbox.map(c=>c.id===a.captureId?{...c,status:'filed'}:c)};
  if(a.type==='set_daily_goal')next={...next,settings:{...next.settings,[a.workspace==='work'?'workDailyMinutes':'dailyMinutes']:a.minutes},coach:{...next.coach,todayPlan:null}};
  if(a.type==='set_focus_goal')next={...next,settings:{...next.settings,[a.workspace==='work'?'workFocusGoal':'focusGoal']:goalId(a.goalRef)},coach:{...next.coach,todayPlan:null}};
  if(a.type==='log_learning')next=logExtra(next,{...a,kind:'topic',keep:false},now,ids.get(a.key)!);
 }
 for(const a of actions)if(a.type==='set_today_plan'){const lessons=a.resourceRefs.flatMap(ref=>{const r=next.resources.find(r=>r.id===(ids.get(ref)||ref));return r&&!r.archived?eligibleLessons(r):[];}).slice(0,12);if(!lessons.length)throw Error('No unfinished lessons remain for this plan.');next={...next,coach:{...next.coach,todayPlan:{day:dayKey(now,next.settings.timezone),minutes:a.minutes,lessonIds:lessons.map(l=>l.id)}}};}
 next=parseLibrary(next);return {state:next,receipt:coachChangeReceipt(state,next)};
}
export function undoCoachActions(state:LearningState,record:ActionReceipt,now=new Date()){
 if(record.undoneAt)throw Error('These changes were already undone.');
 // Reject if any affected record was subsequently edited or studied. Unrelated additions are preserved.
 for(const c of record.changes){const current=c.collection==='settings'?(state.settings as unknown as Record<string,unknown>)[c.id]:c.collection==='todayPlan'?state.coach.todayPlan:(c.collection==='sessions'?state.coach.sessions:state[c.collection]).find(x=>x.id===c.id);if((current===undefined?null:stable(current))!==c.after)throw Error('An affected item changed after this proposal. Undo would overwrite newer work; edit that item directly instead.');}
 let next=state;
 // Leave activity tombstones so a stale phone cannot restore reversed learning logs.
 for(const c of record.changes)if(c.before===null&&c.collection==='sessions')next=deleteStudySession(next,c.id,now);
 for(const c of record.changes)if(c.before===null&&c.collection==='resources')next=deleteResource(next,c.id,now);
 for(const c of record.changes){const value=c.before===null?undefined:JSON.parse(c.before);
  if(c.collection==='settings'){next={...next,settings:{...next.settings,[c.id]:value}};continue;}
  if(c.collection==='todayPlan'){next={...next,coach:{...next.coach,todayPlan:value}};continue;}
  const rows=c.collection==='sessions'?next.coach.sessions:next[c.collection];const restored=[...rows.filter(r=>r.id!==c.id),...(value===undefined?[]:[value])];if(c.collection==='sessions')next={...next,coach:{...next.coach,sessions:restored}};else next={...next,[c.collection]:restored};
 }
 const removedGoals=new Set(record.changes.filter(c=>c.collection==='goals'&&c.before===null).map(c=>c.id));if(next.resources.some(r=>removedGoals.has(r.goalId))||next.todos.some(t=>removedGoals.has(t.goalId))||removedGoals.has(next.settings.focusGoal)||removedGoals.has(next.settings.workFocusGoal))throw Error('This goal is now used by newer work. Edit it directly instead of undoing.');
 return parseLibrary(next);
}
export function actionLabel(a:CoachAction){switch(a.type){case 'create_goal':return 'Create goal: '+a.title;case 'create_resource':return 'Add '+(a.outlineSource==='generated'?'AI roadmap':'resource')+': '+a.title;case 'create_todo':return 'Add task: '+a.title;case 'organize_resource':return 'Organize resource → '+(a.folderPath||'Library')+' · priority '+a.priority+'/5';case 'file_capture':return 'File Inbox capture';case 'set_daily_goal':return 'Set '+a.workspace+' goal to '+a.minutes+' min/day';case 'set_focus_goal':return 'Set '+a.workspace+' learning focus';case 'set_today_plan':return 'Plan today: '+a.minutes+' minute target';case 'log_learning':return 'Log '+a.minutes+' minutes: '+a.title;}}
/** Fingerprints cover records a proposal relies on, not unrelated screen-time refreshes. */
export function coachActionGuard(state:LearningState,actions:CoachAction[]){
 const seen=new Map<string,unknown>();
 for(const a of actions){if(a.type==='organize_resource')seen.set('resource:'+a.resourceId,state.resources.find(r=>r.id===a.resourceId));if(a.type==='file_capture')seen.set('capture:'+a.captureId,state.inbox.find(c=>c.id===a.captureId));if(a.type==='set_today_plan'){seen.set('todayPlan',state.coach.todayPlan);for(const id of a.resourceRefs)seen.set('plan-resource:'+id,state.resources.find(r=>r.id===id)||null);}if(a.type==='set_focus_goal')seen.set('focus:'+a.workspace,state.settings[a.workspace==='work'?'workFocusGoal':'focusGoal']);if(a.type==='set_daily_goal')seen.set('target:'+a.workspace,state.settings[a.workspace==='work'?'workDailyMinutes':'dailyMinutes']);if('goalRef'in a&&a.goalRef)seen.set('goal:'+a.goalRef,state.goals.find(g=>g.id===a.goalRef)||null);}
 return JSON.stringify([...seen].map(([id,value])=>{let hash=2166136261;for(const c of stable(value??null)){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619);}return [id,(hash>>>0).toString(16)];}));
}
