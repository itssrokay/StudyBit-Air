import {z} from 'zod';
export const FOCUS_TIMER_KEY='learning-space-focus-v1';
export const focusTimerSchema=z.object({id:z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),resourceId:z.string().min(1).max(100),lessonId:z.string().min(1).max(100),resourceTitle:z.string().min(1).max(250),lessonTitle:z.string().min(1).max(250),plannedMinutes:z.number().int().min(1).max(600),running:z.boolean(),accumulatedMs:z.number().int().min(0).max(86400000),anchorElapsedMs:z.number().min(0),updatedAt:z.number().min(0),bootCount:z.number().int(),elapsedMs:z.number().min(0).max(86400000)});
export type FocusTimer=z.infer<typeof focusTimerSchema>;
export type TimerSpec=Pick<FocusTimer,'id'|'resourceId'|'lessonId'|'resourceTitle'|'lessonTitle'|'plannedMinutes'>;
export type TimerAction='start'|'pause'|'resume'|'clear';
export function browserTimerElapsed(timer:FocusTimer,now:number){return Math.min(86400000,Math.max(0,timer.accumulatedMs+(timer.running?Math.max(0,now-timer.anchorElapsedMs):0)));}
export function browserTimerAction(current:FocusTimer|null,action:TimerAction,spec:TimerSpec|{id:string},now:number):FocusTimer|null{
 if(action==='start'){
  if(current){if(current.id===spec.id)return current;throw Error('Finish or discard your current focus session first.');}
  return focusTimerSchema.parse({...spec,running:true,accumulatedMs:0,anchorElapsedMs:now,updatedAt:now,bootCount:0,elapsedMs:0});
 }
 if(!current||current.id!==spec.id)throw Error('This timer changed. Open your current session.');
 if(action==='clear')return null;
 const elapsed=browserTimerElapsed(current,now);
 if(action==='resume'&&current.running)return current;
 return {...current,running:action==='resume'&&elapsed<86400000,accumulatedMs:elapsed,anchorElapsedMs:now,updatedAt:now,elapsedMs:elapsed};
}
export function formatFocusTime(ms:number){const s=Math.floor(ms/1000);return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
