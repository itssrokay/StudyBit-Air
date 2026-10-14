import type { Resource, Lesson } from './learning';
export function normalizePath(value:string){return value.split(/[/>]/).map(s=>s.trim()).filter(Boolean).join('/').slice(0,200);}
export function groupLessons(lessons:Lesson[]){const groups=new Map<string,Lesson[]>();for(const lesson of lessons){const name=lesson.modulePath||'Ungrouped';groups.set(name,[...(groups.get(name)||[]),lesson]);}return [...groups].map(([path,lessons])=>({path,lessons}));}
export function suggestModule(title:string){
 const t=title.toLowerCase();
 if(/docker|container|bind mount|kubernetes/.test(t))return 'DevOps/Containers';
 if(/ci\/cd|continuous integration|github actions/.test(t))return 'DevOps/CI-CD';
 if(/deploy|\baws\b|certificate|scaling|serverless/.test(t))return 'DevOps/Deployment';
 if(/bash|terminal|linux|shell/.test(t))return 'DevOps/Linux & shell';
 if(/sql|postgres|mongo|prisma|database|indexing|normalization/.test(t))return 'Backend/Databases';
 if(/express|backend|jwt|auth|openapi|websocket|redis/.test(t))return 'Backend/APIs & architecture';
 if(/react|recoil|hook|tailwind|frontend|nextjs|next\.js|dom|css|html/.test(t))return 'Web/Interfaces';
 if(/typescript|generics|enums/.test(t))return 'Languages/TypeScript';
 if(/javascript|\bjs\b|promise|async|callback|map, filter/.test(t))return 'Languages/JavaScript';
 return 'Foundations';
}
function lessonKey(l:Lesson,courseUrl:string){if(l.sourceId.includes('::chapter:'))return l.sourceId;return (l.url&&(l.url!==courseUrl||/\/(?:learn|lessons)\//.test(l.url)))?l.url:l.sourceId||l.title.toLowerCase().replace(/\s+/g,' ').trim();}
export function mergeCourse(existing:Resource,incoming:Resource):Resource{
 const byKey=new Map(existing.lessons.map(l=>[lessonKey(l,existing.url),l]));
 const additions:Lesson[]=[];
 for(const fresh of incoming.lessons){const key=lessonKey(fresh,incoming.url);const old=byKey.get(key);if(old)continue;byKey.set(key,fresh);additions.push(fresh);}
 return {...existing,lessons:[...existing.lessons,...additions],captureNote:incoming.captureNote||existing.captureNote};
}
export function logStudyBlock(state:import('./learning').LearningState,rid:string,lid:string,minutes:number,now=new Date()){
 const r=state.resources.find(r=>r.id===rid),l=r?.lessons.find(l=>l.id===lid);if(!l||l.done)return state;
 const amount=Math.min(Math.max(1,Math.floor(minutes)),l.minutes-l.studiedMinutes);if(!Number.isFinite(amount)||amount<=0)return state;
 return {...state,studyLog:[...state.studyLog,{id:crypto.randomUUID(),resourceId:rid,lessonId:lid,minutes:amount,at:now.toISOString()}],resources:state.resources.map(r=>r.id===rid?{...r,lessons:r.lessons.map(l=>l.id===lid?{...l,studiedMinutes:l.studiedMinutes+amount,done:l.studiedMinutes+amount>=l.minutes,completedAt:l.studiedMinutes+amount>=l.minutes?now.toISOString():null}:l)}:r)};
}
