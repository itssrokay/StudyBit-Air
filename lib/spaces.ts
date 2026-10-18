import type {LearningState} from './learning.ts';
export type Workspace='personal'|'work';
export function workspaceState(state:LearningState,workspace:Workspace):LearningState{
 const resources=state.resources.filter(r=>r.workspace===workspace),ids=new Set(resources.map(r=>r.id)),lessons=new Set(resources.flatMap(r=>r.lessons.map(l=>l.id)));
 const plan=state.coach.todayPlan;const lessonIds=plan?.lessonIds.filter(id=>lessons.has(id))||[];
 return {...state,resources,goals:state.goals.filter(g=>g.workspace===workspace),todos:state.todos.filter(t=>t.workspace===workspace),rewards:state.rewards.filter(r=>r.workspace===workspace),inbox:state.inbox.filter(i=>i.workspace===workspace),studyLog:state.studyLog.filter(l=>ids.has(l.resourceId)),coach:{...state.coach,sessions:state.coach.sessions.filter(s=>ids.has(s.resourceId)),todayPlan:plan&&lessonIds.length?{...plan,lessonIds}:null},settings:{...state.settings,...(workspace==='work'?{dailyMinutes:state.settings.workDailyMinutes,focusGoal:state.settings.workFocusGoal}:{})}};
}
/** Merge a view back into the full library without removing the other space. */
export function updateWorkspace(root:LearningState,next:LearningState,workspace:Workspace):LearningState{
 const original=workspaceState(root,workspace),ownIds=new Set(original.resources.map(r=>r.id));
 const rows=<T extends {id:string;workspace:Workspace}>(all:T[],view:T[])=>{const oldIds=new Set(all.map(x=>x.id)),byId=new Map(view.map(x=>[x.id,{...x,workspace:oldIds.has(x.id)?x.workspace:workspace}]));return [...all.flatMap(x=>x.workspace===workspace?(byId.has(x.id)?[byId.get(x.id)!]:[]):[x]),...view.filter(x=>!oldIds.has(x.id)).map(x=>({...x,workspace}))];};
 const sessions=[...root.coach.sessions.filter(s=>!ownIds.has(s.resourceId)),...next.coach.sessions].sort((a,b)=>b.at.localeCompare(a.at)).slice(0,120);
 return {...next,resources:rows(root.resources,next.resources),goals:rows(root.goals,next.goals),todos:rows(root.todos,next.todos),rewards:rows(root.rewards,next.rewards),inbox:rows(root.inbox,next.inbox),studyLog:[...root.studyLog.filter(l=>!ownIds.has(l.resourceId)),...next.studyLog],coach:{...next.coach,sessions,todayPlan:next.coach.todayPlan||(!original.coach.todayPlan?root.coach.todayPlan:null)},settings:workspace==='work'?{...next.settings,dailyMinutes:root.settings.dailyMinutes,focusGoal:root.settings.focusGoal,workDailyMinutes:next.settings.dailyMinutes,workFocusGoal:next.settings.focusGoal}:next.settings};
}
