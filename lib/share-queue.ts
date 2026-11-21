/** Decides which shared draft (if any) should pop up. Only a share made in the last few minutes
 * is shown. Older leftovers never pop up again: they are filed quietly into the Inbox instead. */
export type QueuedShare={id:string;text:string;createdAt?:string;image?:string};
export const FRESH_SHARE_MS=15*60*1000;
export function planShares(items:QueuedShare[],opts:{known:(id:string)=>boolean;alreadySaved?:(share:QueuedShare)=>boolean;dismissed:(id:string)=>boolean;now?:Date;freshMs?:number}){
 const now=(opts.now??new Date()).getTime(),fresh=opts.freshMs??FRESH_SHARE_MS;
 const valid=items.filter(i=>i&&typeof i.id==='string'&&typeof i.text==='string');
 const sorted=valid.slice().reverse().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
 const acknowledge:string[]=[],stale:QueuedShare[]=[];let show:QueuedShare|null=null;
 for(const i of sorted){
  if(opts.known(i.id)||(!i.image&&opts.alreadySaved?.(i))){acknowledge.push(i.id);continue;}
  const at=Date.parse(i.createdAt||'');
  if(!Number.isFinite(at)||now-at>fresh){stale.push(i);continue;}
  if(opts.dismissed(i.id))continue;
  if(!show)show=i;
 }
 return {show,acknowledge,stale};
}
const norm=(t:string)=>t.trim().replace(/\s+/g,' ').toLowerCase();
const urlKey=(u:string)=>{try{const x=new URL(u);x.hash='';for(const k of [...x.searchParams.keys()])if(/^(utm_|s$|t$|ref|si$|share)/i.test(k))x.searchParams.delete(k);return (x.hostname.replace(/^www\./,'')+x.pathname.replace(/\/$/,'')+x.search).toLowerCase();}catch{return u.toLowerCase();}};
/** True when this shared text, or the one link in it, is already in the Inbox or the Library. */
export function alreadySaved(state:{inbox:{text:string}[];resources:{url:string}[]},text:string){
 const n=norm(text);if(state.inbox.some(i=>norm(i.text)===n))return true;
 const links=text.match(/https?:\/\/[^\s<>"']+/gi)||[];if(links.length!==1)return false;const k=urlKey(links[0]);
 return state.resources.some(r=>r.url&&urlKey(r.url)===k)||state.inbox.some(i=>(i.text.match(/https?:\/\/[^\s<>"']+/gi)||[]).some(u=>urlKey(u)===k));
}
