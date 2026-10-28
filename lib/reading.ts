import {makeResource,safeUrl,type Resource} from './learning.ts';
export function readingLink(value:string){
 const valid=safeUrl(value.trim());if(!valid)throw Error('Use an http or https article or post link.');const url=new URL(valid);if(url.username||url.password)throw Error('Remove credentials from the link.');url.hash='';for(const key of [...url.searchParams.keys()])if(/^(utm_|fbclid$|gclid$)/i.test(key))url.searchParams.delete(key);
 const host=url.hostname.replace(/^(www|mobile|m)\./,'');const post=['x.com','twitter.com'].includes(host)?url.pathname.match(/^\/(?:([A-Za-z0-9_]{1,15})|i\/web)\/status\/(\d{5,25})(?:\/|$)/):null;
 if(post){url.hostname='x.com';url.pathname='/'+(post[1]||'i/web')+'/status/'+post[2];url.search='';return {url:url.href,provider:'X / Twitter',title:post[1]?'Post by @'+post[1]:'Saved post on X',sourceId:'x:'+post[2]};}
 let slug='';try{slug=decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1)||'').replace(/\.(html?|php)$/i,'').replace(/[-_]+/g,' ').trim();}catch{}
 return {url:url.href,provider:host,title:(slug?slug[0].toUpperCase()+slug.slice(1):'Reading from '+host).slice(0,250),sourceId:url.href};
}
export function readingMinutes(text:string){return Math.max(1,Math.min(600,Math.ceil(text.trim().split(/\s+/u).filter(Boolean).length/220)));}
export function makeReading(input:{url:string;title:string;excerpt:string;minutes:number;goalId:string;priority:number;folderPath:string}):Resource{
 const link=readingLink(input.url);const title=input.title.trim();if(!title)throw Error('Give this article or post a title.');
 return makeResource({title,url:link.url,provider:link.provider,excerpt:input.excerpt.trim(),kind:'article',goalId:input.goalId,priority:input.priority,folderPath:input.folderPath,color:'orange',captureScope:'page',captureNote:input.excerpt.trim()?'Saved link with text you provided. Reading time is an editable estimate.':'Saved reading link. Open the original to read; its text has not been downloaded.'},[{title,minutes:input.minutes,url:link.url,sourceId:link.sourceId,format:'reading',durationEstimated:true}]);
}

/* ---------- Reading list: categories and "Read ASAP" ---------- */
export const DEFAULT_CATEGORIES=['Tech','Productivity','Career','Ideas','Health','Money'];
const HINTS:Record<string,RegExp>={
 Tech:/\b(code|coding|program|developer|software|engineer|api|ai|llm|gpt|model|react|java(script)?|python|rust|docker|kubernetes|cloud|database|sql|system design|backend|frontend|startup|tech|open ?source|github|algorithm|dsa|leetcode)\b/i,
 Productivity:/\b(productiv|focus|habit|routine|discipline|deep work|time management|procrastinat|morning|schedule|goal|notion|workflow|purpose|motivation)\w*/i,
 Career:/\b(career|job|interview|resume|cv|hiring|salary|promotion|manager|leadership|founder|freelanc|internship|offer)\w*/i,
 Health:/\b(health|fitness|gym|workout|sleep|diet|nutrition|mental|run|running|yoga|meditat)\w*/i,
 Money:/\b(money|invest|stock|finance|financial|crypto|wealth|budget|saving|tax|income|market)\w*/i,
};
/** Category names for this space: your existing ones first, then the defaults. */
export function readingCategories(resources:Resource[]){
 const used=resources.filter(r=>r.kind==='article'&&r.folderPath).map(r=>r.folderPath.split('/')[0]);
 return [...new Set([...used,...DEFAULT_CATEGORIES])].slice(0,20);
}
/** A gentle first guess from the post text; the learner can always change it. */
export function suggestCategory(text:string){let best='',score=0;for(const [name,re] of Object.entries(HINTS)){const n=(text.match(new RegExp(re.source,'gi'))||[]).length;if(n>score){best=name;score=n;}}return best;}
/** "Read ASAP" = must be read by the end of this week. Stored as the reading's deadline
 *  (end of the coming Sunday), so it climbs the plan as the week runs out instead of
 *  taking over today. Older builds pinned the lesson instead; that still counts. */
const DAY=86400000;
function localDay(now:Date,timezone:string){return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function weekDeadline(timezone:string,now=new Date()){
 const today=localDay(now,timezone),dow=new Date(today+'T12:00:00Z').getUTCDay();// 0 = Sunday
 let ahead=(7-dow)%7;if(ahead<2)ahead+=7;// Marked on Sat/Sun: give it next week
 return new Date(Date.parse(today+'T12:00:00Z')+ahead*DAY).toISOString().slice(0,10);
}
export const isAsap=(r:Resource)=>r.kind==='article'&&r.lessons.some(l=>!l.done)&&(!!r.deadline||r.lessons.some(l=>!l.done&&l.pinned));
export function setAsap(r:Resource,on:boolean,timezone='UTC',now=new Date()):Resource{
 return {...r,deadline:on?(r.deadline||weekDeadline(timezone,now)):'',priority:on?5:r.priority===5?3:r.priority,lessons:r.lessons.map(l=>({...l,pinned:false}))};
}
export const dayLabel=(day:string)=>new Intl.DateTimeFormat('en',{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'));
/** "Read by Sun, Nov 1", "Due today", "Overdue by 2 days". */
export function asapDue(r:Resource,timezone:string,now=new Date()){
 if(!r.deadline)return 'Read this week';
 const days=Math.round((Date.parse(r.deadline+'T12:00:00Z')-Date.parse(localDay(now,timezone)+'T12:00:00Z'))/DAY);
 if(days<0)return `Overdue by ${days===-1?'1 day':-days+' days'}`;if(days===0)return 'Due today';if(days===1)return 'Due tomorrow';
 return 'Read by '+new Intl.DateTimeFormat('en',{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(r.deadline+'T12:00:00Z'));
}
