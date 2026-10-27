import {saveTimeEntry,hasTimeEntry,type TimeEntryInput} from './time-log.ts';
import type {LearningState} from './learning.ts';
/**
 * Durable queue for time entries. An entry is written here before the library save
 * starts and removed only once a saved library contains it, so a crash, a killed
 * WebView, or a sync race can never silently drop logged time.
 */
export const TIME_OUTBOX_KEY='learning-space-time-outbox-v1';
export type OutboxEntry={id:string;at:string;input:TimeEntryInput};
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const store=():Store|null=>{try{return typeof localStorage==='undefined'?null:localStorage;}catch{return null;}};
export function readOutbox(storage:Store|null=store()):OutboxEntry[]{
 try{const data=JSON.parse(storage?.getItem(TIME_OUTBOX_KEY)||'[]');return Array.isArray(data)?data.filter((e:OutboxEntry)=>e&&typeof e.id==='string'&&typeof e.at==='string'&&e.input&&typeof e.input.title==='string').slice(0,200):[];}catch{return [];}
}
function write(entries:OutboxEntry[],storage:Store|null){if(!storage)return false;try{if(entries.length)storage.setItem(TIME_OUTBOX_KEY,JSON.stringify(entries));else storage.removeItem(TIME_OUTBOX_KEY);return true;}catch{return false;}}
export function queueTimeEntry(entry:OutboxEntry,storage:Store|null=store()){return write([...readOutbox(storage).filter(e=>e.id!==entry.id),entry],storage);}
export function dropTimeEntry(id:string,storage:Store|null=store()){const all=readOutbox(storage);if(all.some(e=>e.id===id))write(all.filter(e=>e.id!==id),storage);}
/** Forget queued entries that a confirmed-saved library already contains. */
export function pruneOutbox(saved:LearningState,storage:Store|null=store()){const all=readOutbox(storage);if(!all.length)return;const left=all.filter(e=>!hasTimeEntry(saved,e.id));if(left.length!==all.length)write(left,storage);}
/** Re-apply queued entries (idempotent: an entry already in the library is skipped). */
export function applyOutbox(state:LearningState,entries:OutboxEntry[]){
 let next=state;const failed:string[]=[];
 for(const entry of entries){const at=new Date(entry.at);if(Number.isNaN(at.getTime())){failed.push(entry.id);continue;}
  try{next=saveTimeEntry(next,entry.input,at,entry.id);}
  catch{try{next=saveTimeEntry(next,{...entry.input,resourceId:''},at,entry.id);}catch{failed.push(entry.id);}}} // The course may have been removed meanwhile; keep the time as standalone learning.
 return {state:next,failed};
}
