import type {Resource} from './learning.ts';
/** Library groups (DESIGN.md §2): where to pick up first, then what's waiting, with finished work folded away.
 * Order inside each group is kept (callers pass resources already ranked). */
export const isFinishedResource=(r:Resource)=>r.lessons.length>0&&r.lessons.every(l=>l.done);
export const isStarted=(r:Resource)=>!isFinishedResource(r)&&r.lessons.some(l=>l.done||l.studiedMinutes>0);
export function librarySections(resources:Resource[]){
 return {
  doing:resources.filter(isStarted),
  next:resources.filter(r=>!isStarted(r)&&!isFinishedResource(r)),
  done:resources.filter(isFinishedResource),
 };
}
