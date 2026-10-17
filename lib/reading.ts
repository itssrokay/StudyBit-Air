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
 return makeResource({title,url:link.url,provider:link.provider,excerpt:input.excerpt.trim(),kind:'article',goalId:input.goalId,priority:input.priority,folderPath:input.folderPath,color:'orange',captureScope:'page',captureNote:input.excerpt.trim()?'Saved link with text pasted by you. Reading time is an editable estimate.':'Saved reading link. Open the original to read; its text has not been downloaded.'},[{title,minutes:input.minutes,url:link.url,sourceId:link.sourceId,format:'reading',durationEstimated:true}]);
}
