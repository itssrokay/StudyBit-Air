import { z } from 'zod';
export const safeUrl = (s: string) => { try { const u = new URL(s); return ['http:', 'https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
const url = z.string().max(2000).refine(s => !s || !!safeUrl(s), 'Use an http or https link');
export const lessonSchema = z.object({ id:z.string().min(1).max(100), title:z.string().min(1).max(250), minutes:z.number().int().min(1).max(600), url, done:z.boolean(), completedAt:z.string().datetime().nullable(), notes:z.string().max(10000), pinned:z.boolean().default(false) });
export const resourceSchema = z.object({ id:z.string().min(1).max(100), title:z.string().min(1).max(250), provider:z.string().max(100), kind:z.enum(['course','video','article','topic']), url, goalId:z.string().max(100), priority:z.number().int().min(1).max(5), deadline:z.string().refine(s => !s || /^\d{4}-\d{2}-\d{2}$/.test(s)), color:z.enum(['teal','orange','lavender','blue','rose']), archived:z.boolean(), demo:z.boolean(), createdAt:z.string().datetime(), notes:z.string().max(10000), lessons:z.array(lessonSchema).min(1).max(500) });
export const stateSchema = z.object({ version:z.literal(1), resources:z.array(resourceSchema).max(300), goals:z.array(z.object({id:z.string().min(1).max(100),title:z.string().min(1).max(120),description:z.string().max(500),importance:z.number().int().min(1).max(5)})).max(30), settings:z.object({dailyMinutes:z.number().int().min(10).max(480),weeklyDays:z.number().int().min(1).max(7),timezone:z.string().refine(s=>{try{new Intl.DateTimeFormat('en',{timeZone:s});return true;}catch{return false;}}),focusGoal:z.string().max(100)}) }).superRefine((s,ctx)=>{
 const ids = s.resources.map(r=>r.id), lessons=s.resources.flatMap(r=>r.lessons.map(l=>l.id)), goals=s.goals.map(g=>g.id);
 if(new Set(ids).size!==ids.length || new Set(lessons).size!==lessons.length || new Set(goals).size!==goals.length) ctx.addIssue({code:z.ZodIssueCode.custom,message:'Duplicate IDs in import'});
});
export type Lesson=z.infer<typeof lessonSchema>;
export type Resource=z.infer<typeof resourceSchema>;
export type LearningState=z.infer<typeof stateSchema>;
export const uid = () => crypto.randomUUID();
export function dayKey(date = new Date(), timezone='Asia/Kolkata') { return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date); }
export function doneMinutes(state:LearningState,date=new Date()){const day=dayKey(date,state.settings.timezone);return state.resources.flatMap(r=>r.lessons).filter(l=>l.done&&l.completedAt&&dayKey(new Date(l.completedAt),state.settings.timezone)===day).reduce((n,l)=>n+l.minutes,0);}
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
export type QueueItem={resource:Resource;lesson:Lesson;reason:string;score:number};
export function dailyPlan(state:LearningState,now=new Date()):QueueItem[]{
 let remaining=Math.max(0,state.settings.dailyMinutes-doneMinutes(state,now)); const plan:QueueItem[]=[];
 const resources=state.resources.filter(r=>!r.archived&&progress(r)<100);
 const offsets=new Map<string,number>();
 while(remaining>0 && plan.length<12){
  const candidates=resources.flatMap(r=>{const incomplete=r.lessons.filter(l=>!l.done);const l=incomplete[offsets.get(r.id)||0];return l?[{resource:r,lesson:l,score:rankResource(r,state,now)+(l.pinned?1000:0)-(offsets.get(r.id)||0)*30,reason:l.pinned?'Pinned by you':rankReason(r,state)}]:[];}).filter(x=>x.lesson.minutes<=remaining).sort((a,b)=>b.score-a.score||a.resource.createdAt.localeCompare(b.resource.createdAt));
  if(!candidates.length)break;
  const picked=candidates[0];plan.push(picked);remaining-=picked.lesson.minutes;offsets.set(picked.resource.id,(offsets.get(picked.resource.id)||0)+1);
 }
 return plan;
}
export function makeResource(partial:Partial<Resource>,lessons:Partial<Lesson>[]=[]):Resource {
 const rid=uid();return resourceSchema.parse({id:rid,title:'Untitled resource',provider:'Personal',kind:'course',url:'',goalId:'',priority:3,deadline:'',color:'teal',archived:false,demo:false,createdAt:new Date().toISOString(),notes:'',...partial,lessons:(lessons.length?lessons:[{title:partial.title||'Get started',minutes:15}]).map(l=>({id:uid(),title:'Lesson',minutes:15,url:partial.url||'',done:false,completedAt:null,notes:'',pinned:false,...l}))});
}
export function parseSyllabus(text:string,defaultMinutes=15):Partial<Lesson>[] {
 return text.split('\n').map(s=>s.trim()).filter(Boolean).map((line)=>{
 const parts=line.replace(/^[-*•]\s*/,'').replace(/^\d+[.)]\s*/,'').split('|').map(x=>x.trim());
 const duration=parts[1]?.match(/\d+/);return {title:parts[0].slice(0,250),minutes:duration?Math.min(600,Math.max(1,Number(duration[0]))):defaultMinutes,url:parts[2]?safeUrl(parts[2]):'',done:parts[3]?.toLowerCase()==='done',completedAt:null};
 }).slice(0,500);
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
