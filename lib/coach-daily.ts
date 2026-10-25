import {alignDailyReviewInput,dailyDatePolicy} from './daily-review-context.ts';
import {dayKey,type LearningState} from './learning.ts';
import {activitySignature,automaticCoachContext,reviewDayActivity,shiftDay} from './coach-context.ts';
import {dailyCoachReplySchema,dailyCoachReviewSchema,dailyReviewRequestVersion,type DailyCoachReview} from './coach-schema.ts';
import {prepareCoachAI} from './coach-ai.ts';
export const dailyReviewId=(day:string,timezone:string)=>day+'@'+timezone;
export function dailyReviewDay(state:LearningState,now=new Date()){return shiftDay(dayKey(now,state.settings.timezone),-1);}
export function prepareDailyCoach(state:LearningState,day=dailyReviewDay(state),now=new Date()){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day+'T12:00:00Z'))||new Date(day+'T12:00:00Z').toISOString().slice(0,10)!==day||day>=dayKey(now,state.settings.timezone))throw Error('Choose a completed calendar day.');
 const base=prepareCoachAI({state,prompt:'Review my completed day '+day+' honestly.',contextOptions:{workspace:'all',contextMode:'automatic'}},now).body;
 const context=JSON.parse(base.input),automatic=context.automatic||automaticCoachContext(state,'',now);
 for(const field of ['request','sessionEvidence','activity','todayBudget','focusBalance'])delete context[field];
 const fields=['headline','assessment','nextAction','checkpoint','question'];
 const input={requestVersion:dailyReviewRequestVersion,reviewDay:day,timezone:state.settings.timezone,snapshotAt:now.toISOString(),context,dayActivity:reviewDayActivity(automatic,day)};
 const body={...base,instructions:base.instructions+' '+dailyDatePolicy+' This is the daily review of a COMPLETED day, not today so far. Use reviewDay and dayActivity as the authoritative date and totals. Targets are the saved targets at snapshot time; qualify historical target changes if unknown. Do not attribute captures created after reviewDay to that day. Cover personal/work targets separately, available screen time, captures versus action, due to-dos and rewards where useful. Lead with the clearest mismatch and actual numbers. Be blunt and honest; no insults, shame, diagnosis, or invented work/attention. Missing usage is unknown; no saved study does not prove no work. Say which evidence is old or shortened. Give one realistic next action. checkpoint is a compact dated continuity note: current goals, stated constraints, unresolved questions and follow-up commitment, with evidence dates. Do not infer a personality or preserve deleted activity as truth. It is a coach note, not a confirmed user fact. Do not issue priority writes or memory writes. Return assessment under 350 words, a concise headline and one nextAction.',input:JSON.stringify(alignDailyReviewInput(input,day,state.settings.timezone,now)),text:{format:{type:'json_schema',name:'daily_learning_review',strict:true,schema:{type:'object',properties:Object.fromEntries(fields.map(k=>[k,{type:'string'}])),required:fields,additionalProperties:false}}}};
 return {body,templateBody:{...body,input:JSON.stringify(input)},activitySignature:activitySignature(state,day),parse:(raw:any)=>{const text=raw.output?.flatMap((o:any)=>o.content||[]).filter((c:any)=>c.type==='output_text').map((c:any)=>c.text||'').join('');return dailyCoachReplySchema.parse(JSON.parse(text||''));}};
}
export function saveDailyReview(state:LearningState,raw:DailyCoachReview){const review=dailyCoachReviewSchema.parse(raw);return {...state,coach:{...state.coach,dailyReviews:[review,...state.coach.dailyReviews.filter(r=>r.id!==review.id)].sort((a,b)=>b.day.localeCompare(a.day)||b.at.localeCompare(a.at)).slice(0,60)}};}
/** Background template: fresh usage and pending Android shares are added by the native job. */
export function dailyPhoneTemplate(state:LearningState,revision:number,now=new Date()){
 const day=dailyReviewDay(state,now),prepared=prepareDailyCoach(state,day,now);
 return {enabled:state.coach.dailyEnabled,timezone:state.settings.timezone,revision,preparedAt:now.toISOString(),body:prepared.templateBody,requestVersion:dailyReviewRequestVersion,signatures:Object.fromEntries([day,dayKey(now,state.settings.timezone)].map(d=>[d,activitySignature(state,d)])),emptySignature:activitySignature({...state,resources:[],studyLog:[],coach:{...state.coach,sessions:[]}},day)};
}
