import {uid} from './learning.ts';
import {youtubeLink} from './youtube.ts';

/** Where a pasted link should go: a YouTube/course import or the reading list. */
export function linkRoute(url:string):'link'|'article'{
 try{if(youtubeLink(url))return 'link';}catch{/* not YouTube */}
 const host=(()=>{try{return new URL(url).hostname.replace(/^www\./,'');}catch{return '';}})();
 if(/(udemy|coursera|edx|boot\.dev|frontendmasters|egghead|pluralsight|educative|scaler|nptel|khanacademy|codecademy|datacamp|skillshare|linkedin\.com\/learning)/.test(host))return 'link';
 return 'article';
}

/** Lessons for a quick topic: your subtopics, or numbered sessions. */
export function topicLessons(subtopics:string,sessions:number,minutes:number){
 const lines=subtopics.split('\n').map(s=>s.replace(/^[-*•\d.)\s]+/,'').trim()).filter(Boolean).slice(0,200);
 return (lines.length?lines:Array.from({length:sessions},(_,i)=>`Session ${i+1}`)).map(title=>({id:uid(),title:title.slice(0,250),minutes,format:'exercise' as const}));
}

