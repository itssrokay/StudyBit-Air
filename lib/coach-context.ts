import {dailyReviewRequestVersion} from './coach-schema.ts';
import {dayKey,type LearningState} from './learning.ts';
import {streaks} from './habits.ts';
import {workspaceState} from './spaces.ts';
export const shiftDay=(day:string,n:number)=>new Date(Date.parse(day+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
/** A small deterministic signature invalidates reviews of edited/deleted learning. */
export function activitySignature(state:LearningState,day:string){
 const logs=state.studyLog.filter(l=>dayKey(new Date(l.at),state.settings.timezone)===day).map(l=>[l.id,l.resourceId,l.lessonId,l.minutes,l.at]).sort();
 const completions=state.resources.flatMap(r=>r.lessons.filter(l=>l.done&&l.completedAt&&dayKey(new Date(l.completedAt),state.settings.timezone)===day).map(l=>[r.id,l.id,l.minutes,l.studiedMinutes,l.completedAt])).sort();
 const sessions=state.coach.sessions.filter(s=>dayKey(new Date(s.at),state.settings.timezone)===day).map(s=>[s.id,s.minutes,s.reflection,s.difficulty,s.completed]).sort();
 let hash=2166136261;for(const c of JSON.stringify([logs,completions,sessions])){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619);}return (hash>>>0).toString(16);
}
export function currentDailyReviews(state:LearningState){return state.coach.dailyReviews.filter(r=>r.timezone===state.settings.timezone&&r.activitySignature===activitySignature(state,r.day)).sort((a,b)=>b.day.localeCompare(a.day)||b.at.localeCompare(a.at));}
export function automaticCoachContext(state:LearningState,query='',now=new Date(),scope:'all'|'personal'|'work'='all'){
 const tokens=[...new Set(query.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)||[])];
 const captures=state.inbox.slice().sort((a,b)=>tokens.filter(t=>b.text.toLowerCase().includes(t)).length-tokens.filter(t=>a.text.toLowerCase().includes(t)).length||b.createdAt.localeCompare(a.createdAt));
 const textLimit=Math.max(80,Math.min(10000,Math.floor(42000/Math.max(1,captures.length))));
 const noteLimit=Math.max(60,Math.min(1800,Math.floor(18000/Math.max(1,state.resources.length))));
 const calendar=(space:'personal'|'work')=>[...streaks(workspaceState(state,space),now).minutes].sort(([a],[b])=>a.localeCompare(b)).slice(-730).map(([day,minutes])=>({day,minutes}));
 const latest=currentDailyReviews(state).find(r=>r.requestVersion>=dailyReviewRequestVersion);
 return {
  policy:'Automatic saved learning context. Captures are intentions, not completed work. Link text is not fetched page content. Text fields may be shortened as disclosed; original records remain in the app. Current records override old checkpoints and chat claims.',
  snapshotAt:new Date(Math.floor(now.getTime()/60000)*60000).toISOString(),
  continuity:latest&&scope==='all'?{requestVersion:latest.requestVersion,reviewDay:latest.day,at:latest.at,checkpoint:latest.reply.checkpoint}:null,
  activityCalendar:{personal:calendar('personal'),work:calendar('work')},
  targetBasis:'Current saved targets as of snapshotAt; historical target changes are not reconstructed.',
  targets:{personalMinutes:state.settings.dailyMinutes,workMinutes:state.settings.workDailyMinutes},
  inbox:captures.map(i=>({id:i.id,workspace:i.workspace,createdAt:i.createdAt,status:i.status,text:i.text.slice(0,textLimit),originalCharacters:i.text.length,truncated:i.text.length>textLimit})),
  library:state.resources.map(r=>({id:r.id,title:r.title,workspace:r.workspace,kind:r.kind,archived:r.archived,sample:r.demo,priority:r.priority,folder:r.folderPath,goalId:r.goalId,completed:r.lessons.filter(l=>l.done).length,total:r.lessons.length,notes:r.notes.slice(0,noteLimit),excerpt:r.excerpt.slice(0,noteLimit),textShortened:r.notes.length>noteLimit||r.excerpt.length>noteLimit})),
  todos:state.todos.map(({id,title,workspace,dueDay,doneAt,goalId})=>({id,title,workspace,dueDay,doneAt,goalId})),
  rewards:state.rewards.map(({id,title,workspace,description,metric,targetDays,minimumMinutes,startDay,redeemedAt})=>({id,title,workspace,description,metric,targetDays,minimumMinutes,startDay,redeemedAt})),
  recentConversations:state.coach.conversations.filter(c=>scope==='all'||c.contextSelection?.workspace===scope).slice(-4).map(c=>({title:c.title,createdAt:c.createdAt,messages:c.messages.slice(-4).map(m=>({at:m.at,role:m.role,text:m.text.slice(0,800)}))})),
  coverage:{omittedRows:{resources:0,captures:0,todos:0,rewards:0},activityCalendarLimit:730,nextLessonDetailLimit:40,captures:captures.length,resources:state.resources.length,todos:state.todos.length,rewards:state.rewards.length,captureTextLimit:textLimit,resourceTextLimit:noteLimit,excluded:'Binary images, full PDF/EPUB files, credentials, raw usage events and browser history. Lesson notes are not included. No URLs are fetched.'},
 };
}
export function reviewDayActivity(automatic:ReturnType<typeof automaticCoachContext>,day:string){
 const forSpace=(name:'personal'|'work')=>{const rows=automatic.activityCalendar[name];return {minutes:rows.find(d=>d.day===day)?.minutes||0,goalMinutes:name==='personal'?automatic.targets.personalMinutes:automatic.targets.workMinutes,minutesWeek:rows.filter(d=>d.day>=shiftDay(day,-6)&&d.day<=day).reduce((n,d)=>n+d.minutes,0)};};
 return {day,personal:forSpace('personal'),work:forSpace('work')};
}
