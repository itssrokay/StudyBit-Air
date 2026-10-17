import {readingLink} from './reading.ts';
/** A deterministic reading draft; no cross-site fetch, login, or invented article body. */
export function importLinkMetadata(value:string){
 const source=readingLink(value),url=new URL(source.url);const host=url.hostname.replace(/^www\./,'');
 if(['boot.dev','100xdevs.com','interviewready.io','udemy.com','coursera.org','www.coursera.org'].some(h=>host===h||host.endsWith('.'+h))||/\/(?:courses|lessons|learn)\//.test(url.pathname))return {title:'',provider:host,kind:'course' as const,url:source.url,notice:'For grouped lessons from this course platform, use Browser capture on its loaded outline, or import your chapters and lessons.'};
 const notice='Saved as a reading draft. The title is suggested from the link; edit it and the estimated reading time. Use Article / post to paste text for offline reading.';
 return {title:source.title,provider:source.provider,kind:'article' as const,url:source.url,notice,captureScope:'page' as const,captureNote:notice,lessons:[{title:source.title,url:source.url,sourceId:source.sourceId,minutes:5,format:'reading' as const,durationEstimated:true}]};
}
