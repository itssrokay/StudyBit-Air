import type {LearningState} from './learning.ts';
import {apiRequest} from './client-api.ts';
import {nativeBridge} from './local-store.ts';
import {captureLinks} from './capture.ts';
import {saveTitle} from './saves.ts';

type Update=(fn:(s:LearningState)=>LearningState)=>boolean|void;
const cache=new Map<string,string>();
/** A saved image as a data URL (phone only). Thumbnails are cached for the session. */
export function savedImageUrl(name:string,max=480){
 if(!name)return '';const key=name+'@'+max;if(cache.has(key))return cache.get(key)!;
 let url='';try{url=nativeBridge()?.savedImage?.(name,max)||'';}catch{/* older app */}
 if(url)cache.set(key,url);return url;
}
export function deleteSavedImage(name:string){if(!name)return;try{nativeBridge()?.deleteSavedImage?.(name);}catch{/* already gone */}for(const k of [...cache.keys()])if(k.startsWith(name))cache.delete(k);}

const reading=new Set<string>();
/** Ask AI what a saved screenshot shows; store its title, text and any links on the capture. Returns an error message, or '' on success. */
export async function readScreenshot(item:LearningState['inbox'][number],update:Update):Promise<string>{
 if(!item.image||reading.has(item.id))return '';
 const image=savedImageUrl(item.image,1024);if(!image)return 'This screenshot is only on the phone that saved it.';
 reading.add(item.id);
 try{
  const response=await apiRequest('/api/coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'screenshot',image,why:item.why,text:item.text==='Screenshot'?'':item.text})});
  const data=await response.json() as {error?:string;title?:string;gist?:string;text?:string;urls?:string[]};
  if(!response.ok)return data.error||'AI could not read this screenshot.';
  const ok=update(s=>({...s,inbox:s.inbox.map(i=>{if(i.id!==item.id)return i;
   const link=(data.urls||[])[0],hasLink=captureLinks(i.text).length>0;
   const text=hasLink||!link?i.text:(i.text==='Screenshot'?link:i.text+'\n'+link);
   return {...i,title:i.title||(data.title||'').slice(0,200),imageText:[data.gist,data.text].filter(Boolean).join('\n\n').slice(0,3000),imageRead:true,text};})}));
  return ok===false?'Could not save what AI read.':'';
 }catch(e){return (e as Error).message||'AI could not read this screenshot.';}
 finally{reading.delete(item.id);}
}

/** Find saves by meaning. Returns matching capture IDs with a short reason, best first. */
export async function recallSaves(inbox:LearningState['inbox'],query:string):Promise<{id:string;reason:string}[]>{
 const items=inbox.slice(0,150);
 const response=await apiRequest('/api/coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'recall',query,items:items.map(i=>({title:saveTitle(i).slice(0,200),why:i.why,intent:i.intent,text:(i.imageText||i.text).slice(0,400),date:i.createdAt.slice(0,10)}))})});
 const data=await response.json() as {error?:string;matches?:{n:number;reason:string}[]};
 if(!response.ok)throw Error(data.error||'AI search is unavailable.');
 const seen=new Set<string>();
 return (data.matches||[]).map(m=>({item:items[m.n-1],reason:m.reason})).filter(m=>m.item&&!seen.has(m.item.id)&&seen.add(m.item.id)).map(m=>({id:m.item.id,reason:m.reason.slice(0,120)}));
}
