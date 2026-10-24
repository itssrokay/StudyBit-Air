import {validateQuickLog} from './quick-log.ts';
import {safeUrl,uid,makeResource,type LearningState,inboxSchema} from './learning.ts';
import {makeReading,readingLink,readingMinutes} from './reading.ts';
import {finishStudySession} from './session-review.ts';
import type {Workspace} from './spaces.ts';
export function captureLinks(text:string){
 const matches=text.match(/https?:\/\/[^\s<>"']+/gi)||[];const seen=new Set<string>();
 return matches.map(raw=>raw.replace(/[.,;!?\])}]+$/,'')).flatMap(raw=>{const url=safeUrl(raw);if(!url||seen.has(url))return [];seen.add(url);const u=new URL(url),host=u.hostname.replace(/^www\./,'');let kind='Article';if(['youtube.com','m.youtube.com','youtu.be'].includes(host))kind=u.searchParams.has('list')?'YouTube playlist':'YouTube video';else if(['x.com','twitter.com','mobile.twitter.com'].includes(host))kind='X post / thread';return [{url,kind,host}];}).slice(0,20);
}
export function captureTitle(text:string){const first=text.split('\n').find(s=>s.trim())||text;return first.trim().replace(/https?:\/\/\S+/g,'').replace(/^(todo|idea|learn|read)\s*:\s*/i,'').trim().slice(0,160)||captureLinks(text)[0]?.host||'A new idea';}
export function captureInbox(state:LearningState,text:string,workspace:Workspace,source:'typed'|'shared'='typed',id=uid(),now=new Date()){
 if(state.inbox.some(i=>i.id===id))return state;
 const item=inboxSchema.parse({id,text,workspace,source,createdAt:now.toISOString(),status:'inbox'});return {...state,inbox:[item,...state.inbox]};
}
export function logExtra(state:LearningState,input:{title:string;url:string;minutes:number;kind:'article'|'video'|'topic';reflection:string;workspace:Workspace;keep:boolean},now=new Date(),id=uid()):LearningState{
 if(state.resources.some(r=>r.id===id)||state.activityRemovals.some(e=>e.kind==='resource'&&e.targetId===id))return state;
 const checked=validateQuickLog(input);if(!checked.valid)throw Error(Object.values(checked.errors)[0]);
 if(state.resources.length>=300)throw Error('Your library has 300 resources. Export a backup and remove an unused resource before adding another log.');
 if(state.studyLog.length>=20000)throw Error('Your activity history is full. Export a backup before adding more learning.');
 const {title,url,minutes}=checked.value;
 const r=makeResource({id,title,url,createdAt:now.toISOString(),workspace:input.workspace,kind:input.kind,provider:'Quick log',quickLog:true,archived:!input.keep},[{id:id+'-lesson',title,url,minutes,format:input.kind==='article'?'reading':input.kind==='video'?'video':'exercise'}]);
 return finishStudySession({...state,resources:[...state.resources,r]},r.id,r.lessons[0].id,input.minutes,{difficulty:'unknown',reflection:input.reflection,timerSeconds:0,timeSource:'logged',plannedMinutes:input.minutes},now,state,id+'-session');
}

export function saveSharedReading(state:LearningState,input:{id:string;text:string;title:string;workspace:Workspace},now=new Date()):LearningState{
 if(state.inbox.some(i=>i.id===input.id))return state;
 const links=captureLinks(input.text);if(links.length!==1||links[0].kind.startsWith('YouTube'))throw Error('Save this capture to the inbox, then import its links.');
 const link=readingLink(links[0].url),excerpt=input.text.replace(/https?:\/\/[^\s<>"']+/gi,'').trim();
 const next=captureInbox(state,input.text,input.workspace,'shared',input.id,now);
 const existing=state.resources.find(r=>r.workspace===input.workspace&&r.kind==='article'&&r.url===link.url);
 const resource=existing?null:makeReading({url:link.url,title:input.title.trim()||link.title,excerpt,minutes:excerpt?readingMinutes(excerpt):5,goalId:input.workspace==='work'?state.settings.workFocusGoal:state.settings.focusGoal,priority:3,folderPath:''});
 return {...next,inbox:next.inbox.map(i=>i.id===input.id?{...i,status:'filed'}:i),resources:resource?[{...resource,workspace:input.workspace},...state.resources]:state.resources.map(r=>r.id===existing?.id?{...r,archived:false}:r)};
}
