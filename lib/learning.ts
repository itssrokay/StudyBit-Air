import { z } from 'zod';
import {normalizeActivity,liveStudyLogs} from './activity.ts';
import {safeThumbnail} from './youtube.ts';
import {coachStateSchema} from './coach-schema.ts';
export const safeUrl = (s: string) => { try { const u = new URL(s); return ['http:', 'https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
const thumbnail = z.string().max(2000).refine(s => !s || !!safeThumbnail(s), 'Use a YouTube thumbnail URL').default('');
const url = z.string().max(2000).refine(s => !s || !!safeUrl(s), 'Use an http or https link');
const calendarDay=z.string().refine(s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s,'Use a valid calendar date');
export const goalImageSchema=z.string().max(100000).refine(s=>!s||/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(s),'Choose a JPEG, PNG, or WebP image').default('');
export const todoSchema=z.object({id:z.string().min(1).max(100),title:z.string().trim().min(1).max(200),goalId:z.string().max(100).default(''),dueDay:calendarDay.or(z.literal('')).default(''),createdAt:z.string().datetime(),doneAt:z.string().datetime().nullable().default(null)});
export const rewardSchema=z.object({id:z.string().min(1).max(100),title:z.string().trim().min(1).max(120),description:z.string().max(500).default(''),image:goalImageSchema,metric:z.enum(['days','streak']).default('days'),targetDays:z.number().int().min(1).max(365),minimumMinutes:z.number().int().min(1).max(60).default(5),startDay:calendarDay,createdAt:z.string().datetime(),redeemedAt:z.string().datetime().nullable().default(null)});
export const lessonSchema = z.object({ id:z.string().min(1).max(100), title:z.string().min(1).max(250), minutes:z.number().int().min(1).max(600), thumbnailUrl:thumbnail, durationSeconds:z.number().int().min(0).max(604800).default(0), durationEstimated:z.boolean().default(false), url, done:z.boolean(), completedAt:z.string().datetime().nullable(), notes:z.string().max(10000), pinned:z.boolean().default(false), modulePath:z.string().max(200).default(''), format:z.enum(['video','exercise','reading']).default('video'), sourceId:z.string().max(2000).default(''), studiedMinutes:z.number().int().min(0).max(600).default(0), pageStart:z.number().int().min(1).max(100000).nullable().default(null), pageEnd:z.number().int().min(1).max(100000).nullable().default(null) });
export const resourceSchema = z.object({ id:z.string().min(1).max(100), title:z.string().min(1).max(250), provider:z.string().max(100), thumbnailUrl:thumbnail, excerpt:z.string().max(20000).default(''), kind:z.enum(['course','video','article','topic','book']), url, goalId:z.string().max(100), priority:z.number().int().min(1).max(5), deadline:z.string().refine(s => !s || /^\d{4}-\d{2}-\d{2}$/.test(s)), color:z.enum(['teal','orange','lavender','blue','rose']), archived:z.boolean(), demo:z.boolean(), createdAt:z.string().datetime(), notes:z.string().max(10000), bookPages:z.number().int().min(0).max(100000).default(0), bookFileName:z.string().max(255).default(''), outlineSource:z.enum(['manual','pdf-bookmarks','pdf-pages','epub-toc','ai-plan']).default('manual'), folderPath:z.string().max(200).default(''), focusModule:z.string().max(200).default(''), captureScope:z.enum(['manual','page','folder','course']).default('manual'), captureNote:z.string().max(1200).default(''), lessons:z.array(lessonSchema).min(1).max(500) });
export const stateSchema = z.object({ version:z.literal(1), todos:z.array(todoSchema).max(200).default([]), rewards:z.array(rewardSchema).max(30).default([]), activityRemovals:z.array(z.object({id:z.string().min(1).max(210),kind:z.enum(['resource','lesson','log','session']),targetId:z.string().min(1).max(100),at:z.string().datetime(),lessonId:z.string().max(100).default('')})).max(20000).default([]), coach:coachStateSchema, studyLog:z.array(z.object({id:z.string().min(1).max(100),resourceId:z.string().max(100),lessonId:z.string().max(100),minutes:z.number().int().min(1).max(600),at:z.string().datetime()})).max(20000).default([]), resources:z.array(resourceSchema).max(300), goals:z.array(z.object({id:z.string().min(1).max(100),title:z.string().min(1).max(120),description:z.string().max(500),image:goalImageSchema,importance:z.number().int().min(1).max(5)})).max(30), settings:z.object({theme:z.enum(['light','dark','system']).default('system'),dailyMinutes:z.number().int().min(10).max(480),weeklyDays:z.number().int().min(1).max(7),timezone:z.string().refine(s=>{try{new Intl.DateTimeFormat('en',{timeZone:s});return true;}catch{return false;}}),focusGoal:z.string().max(100),streakMinimum:z.number().int().min(1).max(60).default(5)}) }).superRefine((s,ctx)=>{
 for(const r of s.resources) for(const l of r.lessons) if(l.studiedMinutes>l.minutes) ctx.addIssue({code:z.ZodIssueCode.custom,message:'Studied time exceeds lesson duration'});
 const ids = s.resources.map(r=>r.id), lessons=s.resources.flatMap(r=>r.lessons.map(l=>l.id)), goals=s.goals.map(g=>g.id), conversations=s.coach.conversations.map(c=>c.id), messages=s.coach.conversations.flatMap(c=>c.messages.map(m=>m.id)), sessions=s.coach.sessions.map(s=>s.id);
 for(const items of [s.todos,s.rewards])if(new Set(items.map(x=>x.id)).size!==items.length)ctx.addIssue({code:z.ZodIssueCode.custom,message:'Duplicate task or reward IDs'});
 const logIds=s.studyLog.map(l=>l.id), removalIds=s.activityRemovals.map(e=>e.id);
 if(new Set(logIds).size!==logIds.length||new Set(removalIds).size!==removalIds.length||s.activityRemovals.some(e=>e.id!==e.kind+':'+e.targetId))ctx.addIssue({code:z.ZodIssueCode.custom,message:'Invalid or duplicate activity IDs'});
 if(new Set(sessions).size!==sessions.length || new Set(ids).size!==ids.length || new Set(lessons).size!==lessons.length || new Set(goals).size!==goals.length || new Set(conversations).size!==conversations.length || new Set(messages).size!==messages.length) ctx.addIssue({code:z.ZodIssueCode.custom,message:'Duplicate IDs in import'});
});
export type Lesson=z.infer<typeof lessonSchema>;
export type Resource=z.infer<typeof resourceSchema>;
export type LearningState=z.infer<typeof stateSchema>;
export const parseLibrary=(raw:unknown):LearningState=>normalizeActivity(stateSchema.parse(raw));
// An already-open older client may omit fields introduced by the YouTube importer.
export function preserveSourceMetadata(raw:LearningState,parsed:LearningState,previous:LearningState){
 if(raw.todos===undefined)parsed.todos=previous.todos;if(raw.rewards===undefined)parsed.rewards=previous.rewards;
 for(const g of parsed.goals)if(raw.goals.find(x=>x.id===g.id)?.image===undefined)g.image=previous.goals.find(x=>x.id===g.id)?.image||'';
 for(const r of parsed.resources){const old=previous.resources.find(x=>x.id===r.id),input=raw.resources.find(x=>x.id===r.id);if(!old||!input)continue;if(input.thumbnailUrl===undefined)r.thumbnailUrl=old.thumbnailUrl;if(input.excerpt===undefined)r.excerpt=old.excerpt;
  for(const l of r.lessons){const oldLesson=old.lessons.find(x=>x.id===l.id),inputLesson=input.lessons.find(x=>x.id===l.id);if(!oldLesson||!inputLesson)continue;for(const key of ['thumbnailUrl','durationSeconds','durationEstimated'] as const)if(inputLesson[key]===undefined)(l as any)[key]=oldLesson[key];}
 }
}
export const uid = () => crypto.randomUUID();
export function dayKey(date = new Date(), timezone='Asia/Kolkata') { return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date); }
export function doneMinutes(state:LearningState,date=new Date()){const day=dayKey(date,state.settings.timezone);return state.resources.flatMap(r=>r.lessons).filter(l=>l.done&&l.completedAt&&dayKey(new Date(l.completedAt),state.settings.timezone)===day).reduce((n,l)=>n+l.minutes-l.studiedMinutes,0)+liveStudyLogs(state).filter(log=>dayKey(new Date(log.at),state.settings.timezone)===day).reduce((n,log)=>n+log.minutes,0);}
export function progress(r:Resource){return Math.round(r.lessons.filter(l=>l.done).length/r.lessons.length*100);}
export function rankResource(r:Resource,state:LearningState,now=new Date()){
 const goal=state.goals.find(g=>g.id===r.goalId);
 const deadline=r.deadline ? Math.round((Date.parse(r.deadline+'T23:59:59Z')-now.getTime())/86400000) : Infinity;
 const urgency=deadline<=3?20:deadline<=7?14:deadline<=30?6:0;
 const started=r.lessons.some(l=>l.done)&&progress(r)<100?6:0;
 const focus=r.goalId&&r.goalId===state.settings.focusGoal?12:0;
 return r.priority*12+(goal?.importance||1)*4+urgency+started+focus;
}
export function rankReason(r:Resource,state:LearningState){ if(r.deadline) return 'Working toward your deadline'; if(r.goalId===state.settings.focusGoal&&r.goalId) return 'Aligned with your current focus'; if(r.priority>=4) return 'One of your highest priorities'; if(progress(r)>0) return 'Keep your momentum going'; return 'A little room to explore'; }
export function eligibleLessons(r:Resource){return r.lessons.filter(l=>!l.done&&(!r.focusModule||l.modulePath===r.focusModule||l.modulePath.startsWith(r.focusModule+'/')));}
export type QueueItem={resource:Resource;lesson:Lesson;reason:string;score:number;plannedMinutes:number};
export function dailyBudget(state:LearningState,now=new Date()){return state.coach.todayPlan?.day===dayKey(now,state.settings.timezone)?state.coach.todayPlan.minutes:state.settings.dailyMinutes;}
export function dailyPlan(state:LearningState,now=new Date()):QueueItem[]{
 let remaining=Math.max(0,dailyBudget(state,now)-doneMinutes(state,now)); const plan:QueueItem[]=[];
 const resources=state.resources.filter(r=>!r.archived&&progress(r)<100);
 const custom=state.coach.todayPlan?.day===dayKey(now,state.settings.timezone)?state.coach.todayPlan.lessonIds:[];
 for(const id of custom){const r=resources.find(r=>r.lessons.some(l=>l.id===id&&!l.done));const l=r?.lessons.find(l=>l.id===id);if(!r||!l||remaining<=0||l.studiedMinutes>=l.minutes||plan.some(p=>p.lesson.id===id))continue;const minutes=Math.min(remaining,l.minutes-l.studiedMinutes);plan.push({resource:r,lesson:l,reason:'Chosen with your coach',score:10000,plannedMinutes:minutes});remaining-=minutes;}
 if(plan.length)return plan;
 const offsets=new Map<string,number>();
 while(remaining>0 && plan.length<12){
  const candidates=resources.flatMap(r=>{const incomplete=eligibleLessons(r);const l=incomplete[offsets.get(r.id)||0];return l?[{resource:r,lesson:l,score:rankResource(r,state,now)+(l.pinned?1000:0)-(offsets.get(r.id)||0)*30,reason:l.pinned?'Pinned by you':r.focusModule?'Focused on '+r.focusModule:rankReason(r,state),plannedMinutes:Math.min(remaining,l.minutes-l.studiedMinutes)}]:[];}).filter(x=>x.plannedMinutes>0).sort((a,b)=>b.score-a.score||Number(a.plannedMinutes<a.lesson.minutes-a.lesson.studiedMinutes)-Number(b.plannedMinutes<b.lesson.minutes-b.lesson.studiedMinutes)||a.resource.createdAt.localeCompare(b.resource.createdAt));
  if(!candidates.length)break;
  const picked=candidates[0];plan.push(picked);remaining-=picked.plannedMinutes;offsets.set(picked.resource.id,(offsets.get(picked.resource.id)||0)+1);
 }
 return plan;
}
export function makeResource(partial:Partial<Resource>,lessons:Partial<Lesson>[]=[]):Resource {
 const rid=uid();return resourceSchema.parse({id:rid,title:'Untitled resource',provider:'Personal',kind:'course',url:'',goalId:'',priority:3,deadline:'',color:'teal',archived:false,demo:false,createdAt:new Date().toISOString(),notes:'',...partial,lessons:(lessons.length?lessons:[{title:partial.title||'Get started',minutes:15}]).map(l=>({id:uid(),title:'Lesson',minutes:15,url:partial.url||'',done:false,completedAt:null,notes:'',pinned:false,...l}))});
}
export function parseSyllabus(text:string,defaultMinutes=15):Partial<Lesson>[] {
 const rows:Partial<Lesson>[]=[];let headings:string[]=[];
 for(const [index,raw] of text.split('\n').entries()){
  const line=raw.trim();if(!line)continue;const heading=line.match(/^(#{1,8})\s+(.+)$/),bracket=line.match(/^\[([^\]]+)\]$/);
  if(heading){headings=headings.slice(0,heading[1].length-1);headings.push(heading[2].trim().replaceAll('>','/'));continue;}if(bracket){headings=[bracket[1].trim().replaceAll('>','/')];continue;}
  if(rows.length>=500)throw Error('Use up to 500 lessons per course. No lessons were imported.');
  const parts=line.replace(/^[-*•]\s*/,'').replace(/^\d+[.)]\s*/,'').split('|').map(x=>x.trim()),segments=parts[0].split('>').map(s=>s.trim());const title=segments.at(-1)||'';if(!title)throw Error('Line '+(index+1)+' needs a lesson title.');
  const duration=parts[1]?.match(/^\d+(?:\s*min(?:utes?)?)?$/i);if(parts[1]&&!duration)throw Error('Line '+(index+1)+': use whole minutes, such as 15 or 15 min.');const minutes=duration?Number.parseInt(parts[1]):defaultMinutes;if(!Number.isInteger(minutes)||minutes<1||minutes>600)throw Error('Line '+(index+1)+': duration must be 1–600 minutes.');
  if(parts[2]&&!safeUrl(parts[2]))throw Error('Line '+(index+1)+' has an invalid source link.');if(parts[3]&&parts[3].toLowerCase()!=='done')throw Error('Line '+(index+1)+': the optional status is done.');if(parts.length>4)throw Error('Line '+(index+1)+' has too many | separators.');
  const modulePath=[...headings,...segments.slice(0,-1)].filter(Boolean).join('/').split('/').map(s=>s.trim()).filter(Boolean).join('/');if(title.length>250||modulePath.length>200)throw Error('Line '+(index+1)+': shorten its title or chapter path.');rows.push({modulePath,title,minutes,url:parts[2]?safeUrl(parts[2]):'',done:parts[3]?.toLowerCase()==='done',completedAt:null});
 }if(!rows.length)throw Error('Add at least one lesson below a chapter heading.');return rows;
}
export function seedState():LearningState {
 const date=new Date().toISOString();
 const build=(id:string,title:string,provider:string,kind:Resource['kind'],color:Resource['color'],goalId:string,priority:number,titles:string[],minutes:number[],done=0,url='')=>({id,title,provider,kind,color,goalId,priority,url,deadline:'',archived:false,demo:true,createdAt:date,notes:'',lessons:titles.map((title,i)=>({id:id+'-'+i,title,minutes:minutes[i]||15,url,done:i<done,completedAt:null,notes:'',pinned:false}))});
 return stateSchema.parse({version:1,settings:{dailyMinutes:45,weeklyDays:5,timezone:'Asia/Kolkata',focusGoal:'build'},goals:[{id:'build',title:'Build better products',description:'Turn ideas into thoughtful, useful software.',importance:5},{id:'ai',title:'Get fluent with AI',description:'Understand models and build practical AI tools.',importance:4},{id:'design',title:'Think like a designer',description:'Learn the principles behind great interfaces.',importance:3}],resources:[
 build('react','The Complete React Course','Udemy','course','teal','build',5,['Welcome & setup','Thinking in components','Your first component','Props & composition','Rendering lists','State and events','Understanding useEffect','Managing complex state','Building a custom hook','Working with context','Shipping your first app'],[8,12,15,20,10,15,18,22,15,18,30],6,'https://www.udemy.com/'),
 build('ai-course','AI Engineering, from the ground up','YouTube','course','lavender','ai',4,['A map of the AI landscape','How language models work','Embeddings, visually explained','Retrieval augmented generation','Build a simple AI assistant'],[12,18,15,22,30],2,'https://www.youtube.com/'),
 build('design-course','Design for Developers','Independent course','course','orange','design',4,['Start with a clear hierarchy','Spacing is a design tool','Typography that works','Color with intention','Bring it all together'],[10,12,18,15,25],1),
 build('article','A practical guide to better habits','Article','article','blue','build',3,['Read & capture one idea'],[12],0),
 build('systems','System design fundamentals','YouTube','video','blue','build',3,['Scalability & tradeoffs'],[25],0,'https://www.youtube.com/'),
 build('writing','Writing that makes things clear','Topic','topic','rose','',2,['Write a short explanation of something you learned'],[20],0),
 build('typescript','TypeScript Essentials','YouTube','course','teal','build',3,['Types & interfaces','Generics in practice','Narrowing & inference','Make a reusable utility'],[15,18,20,15],0,'https://www.youtube.com/'),
 build('css','A deeper look at CSS Grid','Article','article','orange','design',2,['Read & try a layout'],[15],0)
 ]});
}
