'use client';
import {useEffect,useMemo,useState} from 'react';
import {Sparkles,Play,MessageCircle,X,Bell,BellOff,Send} from 'lucide-react';
import {morningBrief,upcomingBriefs,type MorningBrief} from '../lib/morning-brief';
import {workspaceState} from '../lib/spaces';
import {nativeBridge} from '../lib/local-store';
import type {LearningState} from '../lib/learning';

const CONFIG='learning-space-brief-v1',DISMISSED='learning-space-brief-dismissed';
export type BriefConfig={enabled:boolean;time:string};
const defaults:BriefConfig={enabled:true,time:'08:30'};
export function readBriefConfig():BriefConfig{try{const v=JSON.parse(localStorage.getItem(CONFIG)||'null');return v&&typeof v.enabled==='boolean'&&/^\d{2}:\d{2}$/.test(v.time)?v:defaults;}catch{return defaults;}}
function writeBriefConfig(v:BriefConfig){try{localStorage.setItem(CONFIG,JSON.stringify(v));}catch{/* Private mode: use defaults. */}window.dispatchEvent(new Event('learning-brief-config'));}

type NativeBrief={scheduleMorningBrief?:(json:string)=>string;previewMorningBrief?:()=>string};
const native=()=>nativeBridge() as unknown as NativeBrief|undefined;
export const briefNotificationsSupported=()=>!!native()?.scheduleMorningBrief;

/** Keep the phone's scheduled morning notification in step with the library. */
export function useMorningBriefSync(state:LearningState,loaded:boolean,clock:Date){
 const [config,setConfig]=useState(defaults);
 useEffect(()=>{const read=()=>setConfig(readBriefConfig());read();window.addEventListener('learning-brief-config',read);return()=>window.removeEventListener('learning-brief-config',read);},[]);
 const day=clock.toISOString().slice(0,13);
 useEffect(()=>{
  const bridge=native();if(!loaded||!bridge?.scheduleMorningBrief)return;
  const t=setTimeout(()=>{try{const personal=workspaceState(state,'personal');bridge.scheduleMorningBrief!(JSON.stringify({enabled:config.enabled,time:config.time,timezone:state.settings.timezone,briefs:upcomingBriefs(personal,new Date(),config.time)}));}catch{/* Notifications are best-effort; the in-app brief still works. */}},1500);
  return()=>clearTimeout(t);
 },[state,loaded,config,day]);
 return config;
}

export function useTodayBrief(state:LearningState,clock:Date):MorningBrief{
 const day=clock.toISOString().slice(0,13);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 return useMemo(()=>morningBrief(state,new Date()),[state,day]);
}

export function BriefCard({brief,onStart,onAsk,dismissible=false,variant='today'}:{brief:MorningBrief;onStart?:(rid:string,lid:string)=>void;onAsk?:(prompt:string)=>void;dismissible?:boolean;variant?:'today'|'coach'}){
 const [dismissedDay,setDismissedDay]=useState(()=>{try{return localStorage.getItem(DISMISSED)||'';}catch{return '';}}),[open,setOpen]=useState(variant==='coach');
 if(dismissible&&dismissedDay===brief.day)return null;
 return <section className={'brief-card brief-'+brief.tone+' brief-'+variant} aria-label="Morning brief">
  <div className="brief-top"><span className="brief-eyebrow"><Sparkles size={14}/>Morning brief</span><span className="brief-score" title="Momentum score: consistency this week, yesterday vs your goal, streak and recency">{brief.score}<small>{brief.label}</small></span>{dismissible&&<button className="brief-close" aria-label="Hide today’s brief" onClick={()=>{try{localStorage.setItem(DISMISSED,brief.day);}catch{/* ignore */}setDismissedDay(brief.day);}}><X size={16}/></button>}</div>
  <h2>{brief.headline}</h2>
  <p className={open?'':'brief-clamp'}>{brief.body}</p>{!open&&<button className="brief-more" onClick={()=>setOpen(true)}>Read more</button>}
  {(onStart&&brief.action||onAsk)&&<div className="brief-actions">{onStart&&brief.action&&<button className="brief-primary" onClick={()=>onStart(brief.action!.resourceId,brief.action!.lessonId)}><Play size={16} fill="currentColor"/>Start · {brief.action.minutes} min</button>}{onAsk&&<button className="brief-secondary" onClick={()=>onAsk(brief.prompt)}><MessageCircle size={16}/>{variant==='coach'?'Discuss this brief':'Ask coach'}</button>}</div>}
 </section>;
}

export function BriefSettings({notify}:{notify:(s:string)=>void}){
 const [config,setConfig]=useState(readBriefConfig);
 const supported=briefNotificationsSupported();
 function save(next:BriefConfig){setConfig(next);writeBriefConfig(next);}
 return <section className="panel settings-panel brief-settings"><h2>{config.enabled?<Bell size={20}/>:<BellOff size={20}/>} Morning brief</h2>
  <p>Every morning your coach looks at yesterday, your week, your streak and what’s next, and sends one short note with a clear step for today. It runs on this phone, without AI or internet.</p>
  {supported?<><label className="inline-check"><input type="checkbox" checked={config.enabled} onChange={e=>save({...config,enabled:e.target.checked})}/>Send the brief as a notification</label>
   <label>Time<input type="time" value={config.time} disabled={!config.enabled} onChange={e=>{if(/^\d{2}:\d{2}$/.test(e.target.value))save({...config,time:e.target.value});}}/></label>
   <button className="secondary" onClick={()=>{const r=native()?.previewMorningBrief?.();try{const d=r?JSON.parse(r):{};if(d.error)throw Error(d.error);notify('Preview sent. Check your notifications.');}catch(e){notify((e as Error).message||'Allow notifications for Learning Space to see the brief.');}}}><Send size={16}/>Send a preview now</button>
   <small>Uses your Personal space. Android may deliver it a few minutes late to save battery.</small></>
  :<small>Notifications need the Android app (version 0.24 or newer). The brief still appears on Today and in Coach.</small>}
 </section>;
}
