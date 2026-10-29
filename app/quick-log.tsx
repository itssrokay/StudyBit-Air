'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {Play,Pause,Square,Check,Loader2,RotateCcw,Timer,PenLine,Trash2,CloudOff,Sparkles,Layers,Minus,Plus,MonitorPlay,BookOpen} from 'lucide-react';
import {uid,dayKey,dailyPlan,type LearningState} from '../lib/learning';
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

export default function QuickLog({state,workspace,onSave,onClose,notify,initialMode}:{state:LearningState;workspace:Workspace;initialMode?:'timer'|'manual';onSave:(fn:(s:LearningState)=>LearningState)=>Promise<boolean>;onClose:()=>void;notify:(s:string,tone?:'error'|'info')=>void}){
 const [draft]=useState(()=>readDraft(workspace)),[openedAt]=useState(()=>Date.now()),[unsynced]=useState(()=>readOutbox().filter(e=>e.input.workspace===workspace).length);
 const identity=useRef<{id:string;at:Date|null}>({id:draft?.id||'',at:null});
 const entryId=()=>{if(!identity.current.id)identity.current.id=uid();return identity.current.id;};
 const [title,setTitle]=useState<string>(draft?.title||''),[url,setUrl]=useState<string>(draft?.url||''),[minutes,setMinutes]=useState<string>(draft?.minutes||(!draft&&initialMode==='manual'?'25':'')),[kind,setKind]=useState<'article'|'video'|'topic'>(draft?.kind||'topic'),[reflection,setReflection]=useState<string>(draft?.reflection||''),[keep,setKeep]=useState(!!draft?.keep),[resourceId,setResourceId]=useState<string>(draft?.resourceId||'');
 const [mode,setMode]=useState<'timer'|'manual'>(draft?(draft.mode==='manual'?'manual':'timer'):initialMode||'timer'),[when,setWhen]=useState(()=>localInput(new Date())),[errors,setErrors]=useState<Errors>({}),[whenChoice,setWhenPick]=useState<'now'|'1h'|'morning'|'yesterday'|'custom'>('now'),[error,setError]=useState(''),[busy,setBusy]=useState(false),[limit,setLimit]=useState(8);
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

 const plan=dailyPlan(state,new Date(openedAt)),next=plan[0];
 const recentTitles=[...new Map(entries.map(e=>[e.title.toLowerCase(),e])).values()].slice(0,4);
 const courses=state.resources.filter(r=>!r.demo&&!r.quickLog&&!r.archived);
 const linked=courses.find(r=>r.id===resourceId);
 const pick=(t:string,rid:string)=>{setTitle(t);setResourceId(rid);clear('title');};
 const mins=Number(minutes)||0,bump=(by:number)=>{setMinutes(String(Math.max(1,Math.min(600,(mins||0)+by))));clear('minutes');};
 const setWhenChoice=(c:typeof whenChoice)=>{setWhenPick(c);const now=new Date(),d=new Date(now);if(c==='1h')d.setTime(now.getTime()-3600000);else if(c==='morning'){d.setHours(10,0,0,0);if(d>now)d.setTime(now.getTime());}else if(c==='yesterday'){d.setDate(d.getDate()-1);d.setHours(21,0,0,0);}if(c!=='custom')setWhen(localInput(d));clear('when');};
 const goal=state.settings.dailyMinutes,pctToday=Math.min(100,Math.round(todayMinutes/Math.max(1,goal)*100));
 const elapsed=own?.elapsedMs||0,ringPct=((elapsed/60000)%60)/60*100;
 const KINDS=[['topic','Practice',PenLine],['video','Watched',MonitorPlay],['article','Read',BookOpen]] as const;
 return <ModalFrame title="Log learning" subtitle={(workspace==='work'?'Work':'Personal')+' · '+(todayMinutes?`${todayMinutes} of ${goal} min today`:`Goal ${goal} min today`)} onClose={onClose} busy={busy} wide>
 <div className="tl tl2">
  <div className="tl2-today" aria-label={`${todayMinutes} of ${goal} minutes today`}><span style={{width:pctToday+'%'}}/></div>
  {!own&&<div className="tl-modes" role="group" aria-label="Logging mode">
   <button type="button" disabled={busy} aria-pressed={mode==='timer'} onClick={()=>{setMode('timer');setErrors({});}}><Timer size={16}/><span>Timer</span></button>
   <button type="button" disabled={busy} aria-pressed={mode==='manual'} onClick={()=>{setMode('manual');if(!minutes)setMinutes('25');setWhenChoice('now');setErrors({});}}><PenLine size={16}/><span>Already done</span></button>
  </div>}
  <form ref={form} noValidate onSubmit={submit} className="tl-form">
   <div className={'tl-card tl2-what'+(own?.running?' is-running':own?' is-paused':'')}>
    <label htmlFor="time-entry-title" className="tl-eyebrow">What are you learning?</label>
    <input id="time-entry-title" name="title" className="tl-title" value={title} disabled={!!own||busy} maxLength={250} onChange={e=>{setTitle(e.target.value);clear('title');}} placeholder="e.g. Binary search practice" aria-invalid={!!errors.title} autoComplete="off" enterKeyHint="done"/>
    {errors.title&&<p className="field-error" role="alert">{errors.title}</p>}
    {!own&&<div className="tl2-suggest" role="group" aria-label="Suggestions">
     {next&&<button type="button" className={title===next.lesson.title?'on':''} onClick={()=>pick(next.lesson.title,next.resource.id)}><Sparkles size={14}/><span><small>Up next</small>{next.lesson.title}</span></button>}
     {recentTitles.filter(r=>r.title!==next?.lesson.title).map(r=><button type="button" key={r.id} className={title===r.title?'on':''} onClick={()=>pick(r.title,r.resource.quickLog?'':r.resource.id)}><RotateCcw size={14}/><span><small>Recent</small>{r.title}</span></button>)}
    </div>}
    <label className="tl2-course"><Layers size={15}/><select aria-label="Course or project" value={resourceId} disabled={!!own||busy} onChange={e=>setResourceId(e.target.value)}><option value="">No course · standalone</option>{courses.map(r=><option key={r.id} value={r.id}>{r.title}</option>)}</select></label>
    {(mode==='timer'||own)&&<div className="tl2-timer">
     <div className={'tl2-ring'+(own?.running?' live':'')}><svg viewBox="0 0 120 120" aria-hidden="true"><circle className="tl2-base" cx="60" cy="60" r="52"/>{own&&<circle className="tl2-fill" cx="60" cy="60" r="52" pathLength="100" strokeDasharray={`${ringPct} 100`} transform="rotate(-90 60 60)"/>}</svg>
      <div><output className="tl-clock" aria-label="Elapsed learning time">{clockTime(elapsed)}</output><span className={'tl-state'+(own?.running?' live':'')}>{own?(own.running?'Recording':'Paused'):'Ready'}</span></div></div>
     <div className="tl-controls tl2-controls">
      {!own&&<button type="button" className="tl2-big" disabled={busy||!!other||!!packet.error} onClick={()=>timerAction('start')}><Play size={22} fill="currentColor"/>Start</button>}
      {own?.running&&<><button type="button" className="tl2-round" disabled={busy} onClick={()=>timerAction('pause')} aria-label="Pause"><Pause size={22}/></button><button type="button" className="tl2-big tl2-stop" disabled={busy} onClick={()=>timerAction('stop')}><Square size={18} fill="currentColor"/>Stop & review</button></>}
      {own&&!own.running&&<><button type="button" className="tl2-round" disabled={busy} onClick={()=>timerAction('discard')} aria-label="Discard timer"><Trash2 size={20}/></button><button type="button" className="tl2-big" disabled={busy} onClick={()=>timerAction('resume')}><Play size={20} fill="currentColor"/>Resume</button></>}
     </div>
    </div>}
   </div>
   {other&&<p className="form-error">A lesson timer is already running. Finish it from the active timer bar first.</p>}
   {packet.error&&<p role="alert" className="form-error">{packet.error}</p>}
   {mode==='timer'&&!own&&<p className="tl-hint">You can close this screen. The timer keeps running, with a notification.</p>}
   {reviewing&&<div className="tl-review tl2-review">
    {own&&<p className="tl-hint tl-timed">Timed {duration(own.elapsedMs)}. Adjust if needed.</p>}
    <div className="tl2-section"><span className="tl2-label">How long?</span>
     <div className="tl2-stepper"><button type="button" aria-label="5 minutes less" disabled={busy||mins<=1} onClick={()=>bump(-5)}><Minus size={20}/></button>
      <label><input id="tl-minutes" name="minutes" type="number" inputMode="numeric" min="1" max="600" value={minutes} disabled={busy} onChange={e=>{setMinutes(e.target.value);clear('minutes');}} aria-invalid={!!errors.minutes} aria-label="Minutes"/><small>min</small></label>
      <button type="button" aria-label="5 minutes more" disabled={busy} onClick={()=>bump(5)}><Plus size={20}/></button></div>
     <div className="tl-chips tl2-chips" role="group" aria-label="Quick durations">{PRESETS.map(n=><button type="button" key={n} aria-pressed={mins===n} disabled={busy} onClick={()=>{setMinutes(String(n));clear('minutes');}}>{n<60?n+'m':n===60?'1h':'1h 30'}</button>)}</div>
     {errors.minutes&&<span className="field-error" role="alert">{errors.minutes}</span>}
    </div>
    <div className="tl2-section"><span className="tl2-label">What kind?</span><div className="tl2-seg" role="group" aria-label="Activity">{KINDS.map(([v,l,Icon])=><button type="button" key={v} aria-pressed={kind===v} disabled={busy} onClick={()=>setKind(v)}><Icon size={17}/>{l}</button>)}</div></div>
    {!own&&mode==='manual'&&<div className="tl2-section"><span className="tl2-label">When did you finish?</span>
     <div className="tl-chips tl2-chips" role="group" aria-label="When">{([['now','Just now'],['1h','1 hour ago'],['morning','This morning'],['yesterday','Last night'],['custom','Pick time']] as const).map(([v,l])=><button type="button" key={v} aria-pressed={whenChoice===v} disabled={busy} onClick={()=>setWhenChoice(v)}>{l}</button>)}</div>
     {whenChoice==='custom'&&<input id="tl-when" name="when" type="datetime-local" value={when} max={localInput(new Date(openedAt+24*3600000))} disabled={busy} onChange={e=>{setWhen(e.target.value);clear('when');}} aria-invalid={!!errors.when}/>}
     {errors.when&&<span className="field-error" role="alert">{errors.when}</span>}
    </div>}
    <details className="tl-more" open={!!errors.url||undefined}><summary>Add a link or a note</summary>
     <div className="tl-field"><label htmlFor="tl-url">Source link</label><input id="tl-url" name="url" value={url} disabled={busy} inputMode="url" placeholder="leetcode.com (optional)" onChange={e=>{setUrl(e.target.value);clear('url');}}/>{errors.url&&<span className="field-error" role="alert">{errors.url}</span>}</div>
     <div className="tl-field"><label htmlFor="tl-reflection">What clicked?</label><textarea id="tl-reflection" value={reflection} disabled={busy} onChange={e=>setReflection(e.target.value)} maxLength={1000} placeholder="One thing you learned, or what needs more practice"/><small>Notes stay out of social shares.</small></div>
     {!resourceId&&<label className="tl-check"><input type="checkbox" checked={keep} disabled={busy} onChange={e=>setKeep(e.target.checked)}/><span>Also keep it in my library</span></label>}
    </details>
    <button type="submit" className="primary tl-save tl2-save" disabled={busy||!!own?.running}>{busy?<Loader2 size={18} className="spin"/>:<Check size={18}/>}{mins?`Log ${mins<60?mins+' min':Math.floor(mins/60)+'h'+(mins%60?' '+mins%60+'m':'')}`:'Log time'}</button>
    <small className="tl-note">Counts toward your streak, goal and weekly plan{linked?` · adds an “Extra study” entry to ${linked.title}`:''}.</small>
   </div>}
   {error&&<p className="form-error" role="alert">{error}</p>}
  </form>
  <div className="tl-history">
   <div className="tl-history-head"><h3>Recent entries</h3><span>{unsynced?<><CloudOff size={13}/> {unsynced} waiting to save</>:`${entries.reduce((n,e)=>n+e.minutes,0)} min total`}</span></div>
   {[...groups].map(([day,rows])=><section key={day}><header><strong>{day===today?'Today':new Intl.DateTimeFormat('en',{timeZone:state.settings.timezone,weekday:'short',month:'short',day:'numeric'}).format(new Date(rows[0].at))}</strong><span>{entries.filter(e=>dayKey(new Date(e.at),state.settings.timezone)===day).reduce((n,e)=>n+e.minutes,0)} min</span></header>
    {rows.map(row=><div className="tl-entry" key={row.id}><div><strong>{row.title}</strong><small>{row.resource.quickLog?'Standalone learning':row.resource.title} · {new Intl.DateTimeFormat('en',{timeZone:state.settings.timezone,hour:'numeric',minute:'2-digit'}).format(new Date(row.at))}</small></div><span className="tl-entry-min">{row.minutes}m</span><button type="button" className="icon-button" disabled={!!timer||busy} aria-label={'Track '+row.title+' again'} onClick={()=>repeat(row)}><RotateCcw size={17}/></button></div>)}
   </section>)}
   {!entries.length&&<p className="tl-hint">Your first entry starts here. A chapter, a coding problem, or an article all count.</p>}
   {entries.length>limit&&<button type="button" className="text-button" onClick={()=>setLimit(n=>n+12)}>Show more entries</button>}
  </div>
 </div>
 </ModalFrame>;
}
