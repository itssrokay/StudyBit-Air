import { stateSchema, parseLibrary, type LearningState } from './learning.ts';
export type SyncConflict={path:string;label:string;phone:unknown;computer:unknown};
const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
export function mergeLearningStates(base:LearningState|null,phone:LearningState,computer:LearningState,resolution?:'phone'|'computer'){
 base=base?parseLibrary(base):null;phone=parseLibrary(phone);computer=parseLibrary(computer);
 const conflicts:SyncConflict[]=[];
 function merge(b:any,l:any,r:any,path:string,label:string):any{
  if(path.startsWith('screenTime.')&&l?.capturedAt&&r?.capturedAt)return l.capturedAt>=r.capturedAt?l:r;
  if(equal(l,r))return l;if(equal(l,b))return r;if(equal(r,b))return l;
  if(path.endsWith('.studiedMinutes')&&typeof l==='number'&&typeof r==='number')return Math.max(l,r);
  if(path.startsWith('activityRemovals.')&&path.endsWith('.at')&&typeof l==='string'&&typeof r==='string')return l>r?l:r;
  if(path.endsWith('.createdAt')&&typeof l==='string'&&typeof r==='string')return l<r?l:r;
  if(Array.isArray(l)&&Array.isArray(r)&&['screenTime','resources','goals','studyLog','lessons','conversations','messages','sessions','activityRemovals','todos','rewards','inbox','memories'].includes(path.split('.').at(-1)||'')){
   const bm=new Map((Array.isArray(b)?b:[]).map((x:any)=>[x.id,x])),lm=new Map(l.map(x=>[x.id,x])),rm=new Map(r.map(x=>[x.id,x]));
   const ids=[...new Set([...bm.keys(),...l.map(x=>x.id),...r.map(x=>x.id)])];
   const items=ids.map(id=>merge(bm.get(id),lm.get(id),rm.get(id),path+'.'+id,lm.get(id)?.title||rm.get(id)?.title||label)).filter(x=>x!==undefined);
   return (path.endsWith('.messages')||path.endsWith('.sessions'))?items.sort((a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id)):items;
  }
  if(l&&r&&typeof l==='object'&&typeof r==='object'&&!Array.isArray(l)&&!Array.isArray(r)){
   const result:any={};for(const key of new Set([...Object.keys(b||{}),...Object.keys(l),...Object.keys(r)])){const v=merge(b?.[key],l[key],r[key],path?path+'.'+key:key,label);if(v!==undefined)result[key]=v;}return result;
  }
  conflicts.push({path,label:label+' · '+(path.split('.').at(-1)||'change'),phone:l,computer:r});return resolution==='computer'?r:l;
 }
 const blank={resources:[],goals:[],studyLog:[],settings:undefined,version:1};
 const raw=merge(base||blank,phone,computer,'','Learning preferences');if(raw.coach?.sessions)raw.coach.sessions=raw.coach.sessions.sort((a:any,b:any)=>b.at.localeCompare(a.at)||a.id.localeCompare(b.id)).slice(0,120);// Choosing a side in a delete-versus-edit conflict also restores that side’s activity.
 if(resolution){const chosen=resolution==='computer'?computer:phone;for(const conflict of conflicts.filter(c=>/^resources\.[^.]+$/.test(c.path))){const rid=conflict.path.split('.')[1];if(chosen.resources.some(r=>r.id===rid)){raw.activityRemovals=(raw.activityRemovals||[]).filter((e:any)=>!(e.kind==='resource'&&e.targetId===rid));raw.studyLog=[...raw.studyLog.filter((l:any)=>l.resourceId!==rid),...chosen.studyLog.filter(l=>l.resourceId===rid)];raw.coach.sessions=[...raw.coach.sessions.filter((s:any)=>s.resourceId!==rid),...chosen.coach.sessions.filter(s=>s.resourceId===rid)];}}}
 const merged=parseLibrary(raw);
 const totals=(state:LearningState)=>{const map=new Map<string,number>();for(const log of state.studyLog)map.set(log.lessonId,(map.get(log.lessonId)||0)+log.minutes);return map;};
 const lt=totals(phone),rt=totals(computer),mt=totals(merged);const lm=new Map(phone.resources.flatMap(r=>r.lessons).map(l=>[l.id,l])),rm=new Map(computer.resources.flatMap(r=>r.lessons).map(l=>[l.id,l]));
 for(const r of merged.resources)for(const l of r.lessons){if(!mt.has(l.id))continue;const prior=Math.max(0,(lm.get(l.id)?.studiedMinutes||0)-(lt.get(l.id)||0),(rm.get(l.id)?.studiedMinutes||0)-(rt.get(l.id)||0));l.studiedMinutes=Math.min(l.minutes,prior+(mt.get(l.id)||0));if(!l.done&&l.studiedMinutes>=l.minutes){l.done=true;l.completedAt=merged.studyLog.filter((log:any)=>log.lessonId===l.id).map((log:any)=>log.at).sort().at(-1)||null;}}
 return {state:parseLibrary(merged),conflicts};
}
export function privateLanOrigin(value:string){
 const url=new URL(value.includes('://')?value:'http://'+value);
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||!['','/'].includes(url.pathname))throw Error('Use a private computer address such as http://192.168.1.20:5180.');
 const parts=url.hostname.split('.').map(Number);const ipv4=parts.length===4&&parts.every(n=>Number.isInteger(n)&&n>=0&&n<=255)&&url.hostname.split('.').every(p=>/^\d+$/.test(p));
 if(!ipv4||!(parts[0]===10||(parts[0]===172&&parts[1]>=16&&parts[1]<=31)||(parts[0]===192&&parts[1]===168)||url.hostname==='127.0.0.1'))throw Error('Use your computer’s private Wi-Fi IPv4 address. Public internet addresses are not accepted.');
 return url.origin;
}
