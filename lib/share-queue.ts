/** Decides which shared draft (if any) should pop up. Only a share made in the last few minutes
 * is shown. Older leftovers never pop up again: they are filed quietly into the Inbox instead. */
export type QueuedShare={id:string;text:string;createdAt?:string};
export const FRESH_SHARE_MS=15*60*1000;
export function planShares(items:QueuedShare[],opts:{known:(id:string)=>boolean;dismissed:(id:string)=>boolean;now?:Date;freshMs?:number}){
 const now=(opts.now??new Date()).getTime(),fresh=opts.freshMs??FRESH_SHARE_MS;
 const valid=items.filter(i=>i&&typeof i.id==='string'&&typeof i.text==='string');
 const sorted=valid.slice().reverse().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
 const acknowledge:string[]=[],stale:QueuedShare[]=[];let show:QueuedShare|null=null;
 for(const i of sorted){
  if(opts.known(i.id)){acknowledge.push(i.id);continue;}
  const at=Date.parse(i.createdAt||'');
  if(!Number.isFinite(at)||now-at>fresh){stale.push(i);continue;}
  if(opts.dismissed(i.id))continue;
  if(!show)show=i;
 }
 return {show,acknowledge,stale};
}
