import {z} from 'zod';
const text=(max:number)=>z.string().trim().min(1).max(max),ref=z.string().max(100),space=z.enum(['personal','work']),reason=z.string().max(500),link=z.string().max(2000).refine(s=>{try{const u=new URL(s);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return !s;}},'Use a valid web URL');
const key=text(60).regex(/^[a-zA-Z0-9_-]+$/),day=z.string().max(10).refine(s=>!s||/^\d{4}-\d{2}-\d{2}$/.test(s)&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s,'Use a valid date');
export const coachActionSchema=z.discriminatedUnion('type',[
 z.object({type:z.literal('create_goal'),key,workspace:space,title:text(120),description:z.string().max(500),importance:z.number().int().min(1).max(5),reason}),
 z.object({type:z.literal('create_resource'),key,workspace:space,title:text(250),kind:z.enum(['course','video','article','topic','book']),url:link,goalRef:ref,folderPath:z.string().max(200),priority:z.number().int().min(1).max(5),outlineSource:z.enum(['generated','provided']),lessons:z.array(z.object({title:text(250),minutes:z.number().int().min(1).max(600),modulePath:z.string().max(200),url:link,format:z.enum(['video','reading','exercise'])})).min(1).max(40),reason}),
 z.object({type:z.literal('organize_resource'),resourceId:text(100),folderPath:z.string().max(200),goalRef:ref,priority:z.number().int().min(1).max(5),reason}),
 z.object({type:z.literal('create_todo'),key,workspace:space,title:text(200),goalRef:ref,dueDay:day,reason}),
 z.object({type:z.literal('file_capture'),captureId:text(100),reason}),
 z.object({type:z.literal('set_daily_goal'),workspace:space,minutes:z.number().int().min(10).max(480),reason}),
 z.object({type:z.literal('set_focus_goal'),workspace:space,goalRef:text(100),reason}),
 z.object({type:z.literal('set_today_plan'),workspace:space,minutes:z.number().int().min(1).max(480),resourceRefs:z.array(text(100)).min(1).max(12),reason}),
 z.object({type:z.literal('log_learning'),key,workspace:space,title:text(250),minutes:z.number().int().min(1).max(600),url:link,reflection:z.string().max(1000),reason})
]);
export const coachActionsSchema=z.array(coachActionSchema).max(12);
export type CoachAction=z.infer<typeof coachActionSchema>;
export const actionReceiptSchema=z.object({changes:z.array(z.object({collection:z.enum(['resources','goals','todos','inbox','studyLog','sessions','settings','todayPlan']),id:text(100),before:z.string().max(160000).nullable(),after:z.string().max(160000).nullable()})).max(120),undoneAt:z.string().datetime().nullable().default(null)});
export type ActionReceipt=z.infer<typeof actionReceiptSchema>;
// Required properties and closed objects match the existing Responses structured-output contract.
const str=(max:number)=>({type:'string',maxLength:max}),obj=(properties:Record<string,unknown>)=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false}),integer=(min:number,max:number)=>({type:'integer',minimum:min,maximum:max}),en=(values:string[])=>({type:'string',enum:values});
const base={workspace:en(['personal','work']),reason:str(500)},create={...base,key:str(60)};
const variant=(type:string,fields:Record<string,unknown>)=>obj({type:en([type]),...fields});
export const coachActionsJsonSchema={type:'array',maxItems:12,items:{anyOf:[
 variant('create_goal',{...create,title:str(120),description:str(500),importance:integer(1,5)}),
 variant('create_resource',{...create,title:str(250),kind:en(['course','video','article','topic','book']),url:str(2000),goalRef:str(100),folderPath:str(200),priority:integer(1,5),outlineSource:en(['generated','provided']),lessons:{type:'array',minItems:1,maxItems:40,items:obj({title:str(250),minutes:integer(1,600),modulePath:str(200),url:str(2000),format:en(['video','reading','exercise'])})}}),
 variant('organize_resource',{resourceId:str(100),folderPath:str(200),goalRef:str(100),priority:integer(1,5),reason:str(500)}),
 variant('create_todo',{...create,title:str(200),goalRef:str(100),dueDay:str(10)}),
 variant('file_capture',{captureId:str(100),reason:str(500)}),
 variant('set_daily_goal',{...base,minutes:integer(10,480)}),
 variant('set_focus_goal',{...base,goalRef:str(100)}),
 variant('set_today_plan',{...base,minutes:integer(1,480),resourceRefs:{type:'array',minItems:1,maxItems:12,items:str(100)}}),
 variant('log_learning',{...create,title:str(250),minutes:integer(1,600),url:str(2000),reflection:str(1000)})
]}};
