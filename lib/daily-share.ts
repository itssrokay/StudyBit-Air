import {dayKey,doneMinutes,type LearningState} from './learning.ts';
import {streaks} from './habits.ts';
import {workspaceState,type Workspace} from './spaces.ts';
export type DailyShare={day:string;label:string;minutes:number;streak:number;completed:number;extra:number;todos:number;titles:string[]};
export function dailyShare(state:LearningState,space:Workspace,day:string):DailyShare{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day+'T12:00:00Z'))||new Date(day+'T12:00:00Z').toISOString().slice(0,10)!==day)throw Error('Choose a valid calendar day.');
 const view=workspaceState(state,space),today=new Date(day+'T12:00:00Z'),tz=view.settings.timezone;
 const onDay=(date:string|null)=>!!date&&dayKey(new Date(date),tz)===day;
 const ids=new Set(view.studyLog.filter(l=>onDay(l.at)).map(l=>l.lessonId));
 const completed=view.resources.flatMap(r=>r.lessons).filter(l=>l.done&&onDay(l.completedAt));completed.forEach(l=>ids.add(l.id));
 const titles=view.resources.flatMap(r=>r.lessons.filter(l=>ids.has(l.id)).map(l=>r.quickLog?r.title:l.title));
 // Noon in UTC can be tomorrow in UTC+14. Select an instant inside the requested local day.
 const instant=Array.from({length:49},(_,i)=>new Date(today.getTime()+(i-24)*3600000)).find(d=>dayKey(d,tz)===day)||today;
 return {day,label:space==='work'?'Work learning':'Personal learning',minutes:doneMinutes(view,instant),streak:streaks(view,instant).current,completed:completed.length,extra:view.resources.filter(r=>r.quickLog&&r.lessons.some(l=>ids.has(l.id))).length,todos:view.todos.filter(t=>onDay(t.doneAt)).length,titles:[...new Set(titles)].slice(0,12)};
}
export function shareCaption(data:DailyShare,includeTitles:boolean,note:string){return [`Today I made time to learn.`,`${data.minutes} minutes · ${data.completed} step${data.completed===1?'':'s'} finished · ${data.streak}-day streak`,...(data.extra||data.todos?[`${data.extra} extra discoveries · ${data.todos} to-dos checked off`]:[]),...(includeTitles?data.titles.slice(0,5).map(t=>'• '+t):[]),note.trim().slice(0,500),'#LearningInPublic'].filter(Boolean).join('\n');}
