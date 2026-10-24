import {safeUrl} from './learning.ts';
export type QuickLogFields={title:string;url:string;minutes:string|number};
export type QuickLogErrors=Partial<Record<keyof QuickLogFields,string>>;
/** Normalize user input without widening safeUrl for stored or imported data. */
export function quickLogLink(value:string):string{
 const text=value.trim();if(!text)return '';
 if(text.length>2000||/[\s\u0000-\u001f\u007f\\]/u.test(text))throw Error('Enter a web address such as leetcode.com, or leave this blank.');
 const explicit=/^https?:\/\//i.test(text),candidate=explicit?text:'https://'+text;
 if(!explicit&&!/^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z]{2,63}(?::\d{1,5})?(?:[/?#]|$)/i.test(text))throw Error('Enter a web address such as leetcode.com, or leave this blank.');
 const normalized=safeUrl(candidate);if(!normalized)throw Error('Use a valid http or https web address.');
 const url=new URL(normalized);if(url.username||url.password)throw Error('Remove the username or password from this link.');
 if(normalized.length>2000)throw Error('Keep the source link under 2,000 characters.');
 return normalized;
}
export function validateQuickLog(input:QuickLogFields){
 const errors:QuickLogErrors={},title=input.title.trim(),minutes=Number(input.minutes);let url='';
 if(!title)errors.title='Add a short title for what you learned.';
 else if(title.length>250)errors.title='Keep the title under 250 characters.';
 if(!Number.isInteger(minutes)||minutes<1||minutes>600)errors.minutes='Enter 1–600 whole minutes.';
 try{url=quickLogLink(input.url);}catch(e){errors.url=(e as Error).message;}
 return {errors,value:{title,url,minutes},valid:Object.keys(errors).length===0};
}
