'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {Play,Pause,Square,Check,Loader2,RotateCcw,Timer,PenLine,Trash2,CloudOff} from 'lucide-react';
import {uid,dayKey,type LearningState} from '../lib/learning';
import {validateQuickLog,type QuickLogErrors} from '../lib/quick-log';
import {clockTime,saveTimeEntry,QUICK_TIMER_PREFIX,type TimeEntryInput} from '../lib/time-log';
import {queueTimeEntry,dropTimeEntry,readOutbox} from '../lib/time-outbox';
import {controlFocusTimer,readFocusTimer,useStudyTimer} from './use-study-timer';
import type {Workspace} from '../lib/spaces';
import ModalFrame from './modal';
const DRAFT='learning-space-time-entry-v1';
const PRESETS=[15,25,45,60,90];
type Errors=QuickLogErrors&{when?:string};
function readDraft(workspace:Workspace){try{const t=readFocusTimer().timer;const d=JSON.parse(localStorage.getItem(DRAFT)||'null');return t?.resourceId===QUICK_TIMER_PREFIX+workspace&&d?.id===t.id?d:null;}catch{return null;}}
function writeDraft(value:unknown){try{localStorage.setItem(DRAFT,JSON.stringify(value));return true;}catch{return false;}}
function clearDraft(){try{localStorage.removeItem(DRAFT);}catch{/* Private mode: nothing was stored. */}}
/** Value for <input type=datetime-local> in the device's local time. */
function localInput(date:Date){const d=new Date(date.getTime()-date.getTimezoneOffset()*60000);return d.toISOString().slice(0,16);}
/** Parse the manual “Finished at” field: a Date, or an error message. */
function finishedAt(value:string):Date|string{const picked=new Date(value),now=Date.now();if(!value||Number.isNaN(picked.getTime()))return 'Choose when you finished.';if(picked.getTime()>now+5*60000)return 'That time is in the future.';if(picked.getTime()<now-60*86400000)return 'Log time from the last 60 days.';return picked;}
function duration(ms:number){const s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor(s/60)%60;return h?`${h}h ${m}m`:`${m}m ${String(s%60).padStart(2,'0')}s`;}

export default function QuickLog({state,workspace,onSave,onClose,notify}:{state:LearningState;workspace:Workspace;onSave:(fn:(s:LearningState)=>LearningState)=>Promise<boolean>;onClose:()=>void;notify:(s:string,tone?:'error'|'info')=>void}){
 const [draft]=useState(()=>readDraft(workspace)),[openedAt]=useState(()=>Date.now()),[unsynced]=useState(()=>readOutbox().filter(e=>e.input.workspace===workspace).length);
 const identity=useRef<{id:string;at:Date|null}>({id:draft?.id||'',at:null});
 const entryId=()=>{if(!identity.current.id)identity.current.id=uid();return identity.current.id;};
 const [title,setTitle]=useState<string>(draft?.title||''),[url,setUrl]=useState<string>(draft?.url||''),[minutes,setMinutes]=useState<string>(draft?.minutes||''),[kind,setKind]=useState<'article'|'video'|'topic'>(draft?.kind||'topic'),[reflection,setReflection]=useState<string>(draft?.reflection||''),[keep,setKeep]=useState(!!draft?.keep),[resourceId,setResourceId]=useState<string>(draft?.resourceId||'');
 const [mode,setMode]=useState<'timer'|'manual'>(draft?.mode==='manual'?'manual':'timer'),[when,setWhen]=useState(()=>localInput(new Date())),[errors,setErrors]=useState<Errors>({}),[error,setError]=useState(''),[busy,setBusy]=useState(false),[limit,setLimit]=useState(8);
 const packet=useStudyTimer(),timer=packet.timer,own=timer?.resourceId===QUICK_TIMER_PREFIX+workspace?timer:null,other=timer&&!own;
 const saving=useRef(false),mounted=useRef(true),form=useRef<HTMLFormElement>(null);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{if(own){identity.current.id=own.id;if(!writeDraft({id:own.id,title,url,kind,reflection,keep,resourceId,minutes,mode}))notify('Your timer is running, but this device could not save its description. Keep this screen open until you save.','error');}},[own?.id,title,url,kind,reflection,keep,resourceId,minutes,mode]);
 const entries=state.studyLog.flatMap(log=>{const r=state.resources.find(r=>r.id===log.resourceId),l=r?.lessons.find(l=>l.id===log.lessonId);return r&&l&&!r.demo?[{...log,title:l.title,resource:r,url:l.url||r.url}]:[];}).sort((a,b)=>b.at.localeCompare(a.at));
 const today=dayKey(new Date(openedAt),state.settings.timezone),todayMinutes=entries.filter(e=>dayKey(new Date(e.at),state.settings.timezone)===today).reduce((n,e)=>n+e.minutes,0);
 const groups=new Map<string,typeof entries>();for(const row of entries.slice(0,limit)){const day=dayKey(new Date(row.at),state.settings.timezone);groups.set(day,[...(groups.get(day)||[]),row]);}
 const reviewing=mode==='manual'||(!!own&&!own.running);
 function clear(field:keyof Errors){setErrors(e=>({...e,[field]:undefined}));setError('');}

 async function timerAction(action:'start'|'pause'|'resume'|'stop'|'discard'){
  if(saving.current)return;setError('');setBusy(true);try{
   if(action==='start'){
    const checked=validateQuickLog({title,url,minutes:1});setErrors(checked.errors);if(!checked.valid){form.current?.querySelector<HTMLInputElement>('#time-entry-title')?.focus();return;}
    identity.current={id:uid(),at:null};writeDraft({id:identity.current.id,title:checked.value.title,url:checked.value.url,kind,reflection,keep,resourceId,mode:'timer'});
    await controlFocusTimer('start',{id:identity.current.id,resourceId:QUICK_TIMER_PREFIX+workspace,lessonId:'quick-log',resourceTitle:workspace==='work'?'Work learning':'Personal learning',lessonTitle:checked.value.title,plannedMinutes:600});
   }else if(own){
    if(action==='discard'){if(!confirm('Discard this timer? The time will not be logged.'))return;await controlFocusTimer('clear',{id:own.id});clearDraft();identity.current={id:uid(),at:null};setMinutes('');setMode('timer');return;}
    const next=await controlFocusTimer(action==='stop'?'pause':action,{id:own.id});
    if(action==='stop'){setMinutes(String(Math.max(1,Math.round((next.timer?.elapsedMs||0)/60000))));setErrors({});}
   }
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }

 async function submit(e:FormEvent){
  e.preventDefault();if(saving.current||own?.running)return;
  const checked=validateQuickLog({title,url,minutes}),found:Errors={...checked.errors};
  let at=new Date();
  if(!own&&mode==='manual'){const picked=finishedAt(when);if(typeof picked==='string')found.when=picked;else at=picked;}
  setErrors(found);setError('');
  if(Object.values(found).some(Boolean)){const name=(['title','minutes','when','url'] as const).find(k=>found[k]);(form.current?.elements.namedItem(name!) as HTMLInputElement)?.focus();return;}
  saving.current=true;setBusy(true);identity.current.at??=at;
  const id=entryId(),entryAt=identity.current.at!,input:TimeEntryInput={...checked.value,minutes:checked.value.minutes,kind,reflection,workspace,keep,resourceId,timerSeconds:Math.floor((own?.elapsedMs||0)/1000)};
  // Write the entry to a durable on-device queue first; it is removed only after a confirmed save.
  queueTimeEntry({id,at:entryAt.toISOString(),input});
  try{
   const accepted=await onSave(s=>saveTimeEntry(s,input,entryAt,id));
   if(own)try{await controlFocusTimer('clear',{id:own.id});}catch{/* The entry id prevents duplicates if the timer lingers. */}
   clearDraft();
   if(accepted){dropTimeEntry(id);notify('Time saved. Progress, streak, and coach context updated.','info');}
   else notify('Time logged on this device. Saving will retry automatically — nothing is lost.','info');
   if(mounted.current)onClose();
  }catch(err){dropTimeEntry(id);identity.current.at=null;if(mounted.current)setError((err as Error).message);}
  finally{saving.current=false;if(mounted.current)setBusy(false);}
 }

 function repeat(row:(typeof entries)[number]){setTitle(row.title);setUrl(row.url);setResourceId(row.resource.quickLog?'':row.resource.id);setMode('timer');setReflection('');setErrors({});setError('');identity.current={id:uid(),at:null};form.current?.scrollIntoView({behavior:'smooth',block:'start'});}

 return <ModalFrame title="Track your learning" subtitle={(workspace==='work'?'Work':'Personal')+' · '+(todayMinutes?`${todayMinutes} min logged today`:'Make your time count')} onClose={onClose} busy={busy} wide>
 <div className="tl">
  {!own&&<div className="tl-modes" role="group" aria-label="Logging mode">
   <button type="button" disabled={busy} aria-pressed={mode==='timer'} onClick={()=>{setMode('timer');setErrors({});}}><Timer size={16}/><span>Timer</span></button>
   <button type="button" disabled={busy} aria-pressed={mode==='manual'} onClick={()=>{setMode('manual');if(!minutes)setMinutes('25');setWhen(localInput(new Date()));setErrors({});}}><PenLine size={16}/><span>Add manually</span></button>
  </div>}
  <form ref={form} noValidate onSubmit={submit} className="tl-form">
   <div className={'tl-card'+(own?.running?' is-running':own?' is-paused':'')}>
    <label htmlFor="time-entry-title" className="tl-eyebrow">What are you learning?</label>
    <input id="time-entry-title" name="title" className="tl-title" value={title} disabled={!!own||busy} maxLength={250} onChange={e=>{setTitle(e.target.value);clear('title');}} placeholder="e.g. Binary search practice" aria-invalid={!!errors.title} autoComplete="off" enterKeyHint="done"/>
    {errors.title&&<p className="field-error" role="alert">{errors.title}</p>}
    <select aria-label="Course or project" className="tl-project" value={resourceId} disabled={!!own||busy} onChange={e=>setResourceId(e.target.value)}><option value="">Standalone learning</option>{state.resources.filter(r=>!r.demo&&!r.quickLog&&!r.archived).map(r=><option key={r.id} value={r.id}>{r.title}</option>)}</select>
    {(mode==='timer'||own)&&<>
     <div className="tl-clock-row">
      <output className="tl-clock" aria-label="Elapsed learning time">{clockTime(own?.elapsedMs||0)}</output>
      {own&&<span className={'tl-state'+(own.running?' live':'')}>{own.running?'Recording':'Paused'}</span>}
     </div>
     <div className="tl-controls">
      {!own&&<button type="button" className="primary tl-start" disabled={busy||!!other||!!packet.error} onClick={()=>timerAction('start')}><Play size={18} fill="currentColor"/>Start timer</button>}
      {own?.running&&<><button type="button" className="secondary" disabled={busy} onClick={()=>timerAction('pause')}><Pause size={18}/>Pause</button><button type="button" className="tl-stop" disabled={busy} onClick={()=>timerAction('stop')}><Square size={16} fill="currentColor"/>Stop</button></>}
      {own&&!own.running&&<><button type="button" className="secondary" disabled={busy} onClick={()=>timerAction('resume')}><Play size={18}/>Resume</button><button type="button" className="secondary tl-discard" disabled={busy} onClick={()=>timerAction('discard')} aria-label="Discard timer"><Trash2 size={17}/>Discard</button></>}
     </div>
    </>}
   </div>
   {other&&<p className="form-error">A lesson timer is already running. Finish it from the active timer bar first.</p>}
   {packet.error&&<p role="alert" className="form-error">{packet.error}</p>}
   {mode==='timer'&&!own&&<p className="tl-hint">You can close this screen — the timer keeps running on this device.</p>}
   {own?.running&&<p className="tl-hint"><i/>Timing your learning. Stop when you’re done to review and save.</p>}
   {reviewing&&<div className="tl-review">
    {own&&<p className="tl-hint tl-timed">Timed {duration(own.elapsedMs)}. Adjust the minutes if needed.</p>}
    <div className="tl-field"><label htmlFor="tl-minutes">Minutes</label>
     <div className="tl-minutes"><input id="tl-minutes" name="minutes" type="number" inputMode="numeric" min="1" max="600" value={minutes} disabled={busy} onChange={e=>{setMinutes(e.target.value);clear('minutes');}} aria-invalid={!!errors.minutes}/>
      <div className="tl-chips" role="group" aria-label="Quick durations">{PRESETS.map(n=><button type="button" key={n} aria-pressed={Number(minutes)===n} disabled={busy} onClick={()=>{setMinutes(String(n));clear('minutes');}}>{n}</button>)}</div></div>
     {errors.minutes&&<span className="field-error" role="alert">{errors.minutes}</span>}
    </div>
    <div className="tl-grid">
     <div className="tl-field"><label htmlFor="tl-kind">Activity</label><select id="tl-kind" value={kind} disabled={busy} onChange={e=>setKind(e.target.value as typeof kind)}><option value="topic">Practice / study</option><option value="video">Watched</option><option value="article">Read</option></select></div>
     {!own&&mode==='manual'&&<div className="tl-field"><label htmlFor="tl-when">Finished at</label><input id="tl-when" name="when" type="datetime-local" value={when} max={localInput(new Date(openedAt+24*3600000))} disabled={busy} onChange={e=>{setWhen(e.target.value);clear('when');}} aria-invalid={!!errors.when}/>{errors.when&&<span className="field-error" role="alert">{errors.when}</span>}</div>}
    </div>
    <details className="tl-more" open={!!errors.url||undefined}><summary>Add a link or reflection</summary>
     <div className="tl-field"><label htmlFor="tl-url">Source link</label><input id="tl-url" name="url" value={url} disabled={busy} inputMode="url" placeholder="leetcode.com (optional)" onChange={e=>{setUrl(e.target.value);clear('url');}}/>{errors.url&&<span className="field-error" role="alert">{errors.url}</span>}</div>
     <div className="tl-field"><label htmlFor="tl-reflection">Reflection</label><textarea id="tl-reflection" value={reflection} disabled={busy} onChange={e=>setReflection(e.target.value)} maxLength={1000} placeholder="What clicked? What needs more practice?"/><small>Reflections stay out of social shares.</small></div>
    </details>
    {!resourceId&&<label className="tl-check"><input type="checkbox" checked={keep} disabled={busy} onChange={e=>setKeep(e.target.checked)}/><span>Keep this in my active library</span></label>}
    <button type="submit" className="primary tl-save" disabled={busy||!!own?.running}>{busy?<Loader2 size={18} className="spin"/>:<Check size={18}/>}Save time</button>
    <small className="tl-note">Counts toward your progress and streak.{resourceId?' Adds an “Extra study” lesson to the course.':''}</small>
   </div>}
   {error&&<p className="form-error" role="alert">{error}</p>}
  </form>
  <div className="tl-history">
   <div className="tl-history-head"><h3>Recent entries</h3><span>{unsynced?<><CloudOff size={13}/> {unsynced} waiting to save</>:`${entries.reduce((n,e)=>n+e.minutes,0)} min total`}</span></div>
   {[...groups].map(([day,rows])=><section key={day}><header><strong>{day===today?'Today':new Intl.DateTimeFormat('en',{timeZone:state.settings.timezone,weekday:'short',month:'short',day:'numeric'}).format(new Date(rows[0].at))}</strong><span>{entries.filter(e=>dayKey(new Date(e.at),state.settings.timezone)===day).reduce((n,e)=>n+e.minutes,0)} min</span></header>
    {rows.map(row=><div className="tl-entry" key={row.id}><div><strong>{row.title}</strong><small>{row.resource.quickLog?'Standalone learning':row.resource.title} · {new Intl.DateTimeFormat('en',{timeZone:state.settings.timezone,hour:'numeric',minute:'2-digit'}).format(new Date(row.at))}</small></div><span className="tl-entry-min">{row.minutes}m</span><button type="button" className="icon-button" disabled={!!timer||busy} aria-label={'Track '+row.title+' again'} onClick={()=>repeat(row)}><RotateCcw size={17}/></button></div>)}
   </section>)}
   {!entries.length&&<p className="tl-hint">Your first entry starts here. A chapter, a coding problem, or an article — all count.</p>}
   {entries.length>limit&&<button type="button" className="text-button" onClick={()=>setLimit(n=>n+12)}>Show more entries</button>}
  </div>
 </div>
 </ModalFrame>;
}
