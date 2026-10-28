'use client';
import {useMemo,useRef,useState,type PointerEvent as RPointerEvent} from 'react';
import {Sparkles,Plus,History,Flag,ChevronDown,ChevronUp,GripVertical,Share2,Send,Check,Loader2,ArrowRight,Lightbulb,X,RotateCcw,Minus,CalendarClock} from 'lucide-react';
import {goalForecast,forecastLine} from '../lib/forecast';
import ModalFrame from './modal';
import {progress,rankResource,dayKey,type LearningState} from '../lib/learning';
import {planProgress,weekLabel,buildRulePlan,fmtMinutes,weekStartOf,type WeeklyPlan,type WeekAnswers} from '../lib/weekly-plan';
import {weekVerdict,xIntent,TONE_LABEL,type Tone} from '../lib/coach-voice';
import {factOfDay,type BrainFact} from '../lib/brain-facts';
import {apiRequest} from '../lib/client-api';
import {nativeBridge} from '../lib/local-store';
import {uid} from '../lib/learning';
import type {Workspace} from '../lib/spaces';

const endLabel=(start:string)=>weekLabel(new Date(Date.parse(start+'T12:00:00Z')+6*86400000).toISOString().slice(0,10));

/* ---------------- This week card ---------------- */
export function WeekCard({state,plan,onPlan,onChange,onLog,onHistory,onGoals,full=false}:{state:LearningState;plan:WeeklyPlan|null;onPlan:()=>void;onChange:()=>void;onLog:()=>void;onHistory:()=>void;onGoals:()=>void;full?:boolean}){
 const [more,setMore]=useState(full);
 if(!plan)return <section className="wk-empty"><div className="wk-empty-icon"><Flag size={20}/></div><div><strong>Coaching is tailored to your goals</strong><p>Tell your coach what you’re working toward. It builds this week’s plan and tracks it with you.</p></div><div className="wk-empty-actions"><button className="wk-primary" onClick={onPlan}><Sparkles size={16}/>Plan my week</button><button className="wk-ghost" onClick={onGoals}><Flag size={15}/>See goals</button></div></section>;
 const pr=planProgress(state,plan),fc=goalForecast(state),left=Math.max(1,Math.round((Date.parse(plan.weekStart+'T12:00:00Z')+7*86400000-Date.parse(dayKey(new Date(),state.settings.timezone)+'T12:00:00Z'))/86400000));
 return <section className="wk-card" aria-label="This week">
  <div className="wk-head"><span className="wk-eyebrow">This week · {weekLabel(plan.weekStart)} – {endLabel(plan.weekStart)} · {left===1?'last day':`${left} days left`}</span><span className="wk-pct">{pr.pct}%</span></div>
  <h2>{plan.title}</h2>
  {plan.summary&&<p className={more?'':'wk-clamp'} onClick={()=>setMore(true)}>{plan.summary}</p>}
  {fc&&<p className={'wk-forecast'+(fc.onTrack===false||!fc.eta?' behind':'')}><CalendarClock size={15}/>{forecastLine(fc,state.coach.tone==='brutal')}</p>}
  <div className="wk-chips"><button onClick={onChange}><Sparkles size={15}/>Make changes</button><button onClick={onLog}><Plus size={15}/>Log</button><button onClick={onHistory}><History size={15}/>History</button></div>
  <div className="wk-targets">{pr.rows.map(({t,p})=><div key={t.id} className={'wk-target'+(p.complete?' done':'')}>
   <div><strong>{t.label}</strong><small>{p.complete?<><Check size={13}/>Done</>:p.remaining}</small></div>
   {t.target<=7&&t.kind!=='minutes'?<span className="wk-dots" aria-label={`${p.done} of ${t.target}`}>{Array.from({length:t.target},(_,i)=><i key={i} className={i<p.done?'on':''}>{t.target-i}</i>)}</span>
   :<span className="wk-bar" role="img" aria-label={`${p.pct}%`}><i style={{width:p.pct+'%'}}/></span>}
  </div>)}</div>
  <button className="wk-tailored" onClick={onGoals}><span>Coaching is tailored to your goals</span><span className="wk-ghost"><Flag size={14}/>See goals</span></button>
 </section>;
}

/* ---------------- Coach interview → weekly plan ---------------- */
type Step='goal'|'why'|'hours'|'days'|'level'|'focus'|'style'|'build';
const STEPS:Step[]=['goal','why','hours','days','level','focus','style','build'];
const ASK:Record<Step,string>={goal:'What’s the one thing you want to get better at right now?',why:'Why does it matter, and is there a deadline? (Optional, but it makes me sharper.)',hours:'Honestly — in a normal week, how many hours can you give it?',days:'And in a normal week, on how many days?',level:'Where are you starting from?',focus:'Which of your saved resources should carry this week?',style:'How should I talk to you?',build:'Got it. Here’s your week.'};
export function PlanInterview({state,workspace,aiConnected,onClose,onSave,notify}:{state:LearningState;workspace:Workspace;aiConnected:boolean;onClose:()=>void;onSave:(plan:WeeklyPlan,answers:WeekAnswers,tone:Tone)=>boolean|void;notify:(s:string)=>void}){
 const last=[...state.weeklyPlans].sort((a,b)=>b.weekStart.localeCompare(a.weekStart))[0]?.answers;
 const focusGoal=state.goals.find(g=>g.id===state.settings.focusGoal)?.title||'';
 const [a,setA]=useState<WeekAnswers>(()=>({goal:last?.goal||focusGoal,why:last?.why||'',deadline:last?.deadline||'',hoursPerWeek:last?.hoursPerWeek||Math.max(1,Math.round(state.settings.dailyMinutes*state.settings.weeklyDays/60)),days:last?.days||state.settings.weeklyDays,level:last?.level||'some',focusResourceId:last?.focusResourceId||''}));
 const [tone,setTone]=useState<Tone>(state.coach.tone as Tone),[step,setStep]=useState<Step>('goal'),[plan,setPlan]=useState<WeeklyPlan|null>(null),[busy,setBusy]=useState(false),[note,setNote]=useState('');
 const dow=(new Date(dayKey(new Date(),state.settings.timezone)+'T12:00:00Z').getUTCDay()+6)%7,daysLeft=7-dow,dayName=(d:number)=>['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d];
 const scaleNote=daysLeft<7?`This week only has ${daysLeft} day${daysLeft===1?'':'s'} left (${daysLeft===1?'today':dayName(dow)+'–Sun'}), so I’ll scale this week down. From Monday you get the full plan.`:'';
 const idx=STEPS.indexOf(step),set=<K extends keyof WeekAnswers>(k:K,v:WeekAnswers[K])=>setA(x=>({...x,[k]:v}));
 const resources=useMemo(()=>state.resources.filter(r=>!r.archived&&progress(r)<100&&r.kind!=='article').sort((x,y)=>rankResource(y,state)-rankResource(x,state)).slice(0,12),[state]);
 const next=()=>{const n=STEPS[idx+1];setStep(n);if(n==='build')void build();};
 async function build(){
  setBusy(true);setNote('');const rules=buildRulePlan(state,a,new Date(),workspace);let result=rules;
  if(aiConnected){try{const r=await apiRequest('/api/coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'week',state:{...state,coach:{...state.coach,tone}},answers:a})});const d=await r.json() as {error?:string;title?:string;summary?:string;message?:string;targets?:WeeklyPlan['targets']};
   if(!r.ok||!d.title||!d.targets?.length)throw Error(d.error||'AI plan unavailable');result={...rules,title:d.title,summary:d.summary||rules.summary,source:'ai',targets:d.targets.map(t=>({...t,id:uid()}))};setNote(d.message||'');}
   catch(e){setNote('AI is unavailable right now, so I built this from your answers and library. '+((e as Error).message||''));}}
  setPlan(result);setBusy(false);
 }
 const bump=(id:string,by:number)=>setPlan(p=>p&&{...p,targets:p.targets.map(t=>t.id===id?{...t,target:Math.max(1,t.target+by*(t.kind==='minutes'?15:1))}:t)});
 const answered=STEPS.slice(0,idx).filter(s=>s!=='build');
 const reply=(s:Step)=>s==='goal'?a.goal:s==='why'?[a.why,a.deadline&&`by ${a.deadline}`].filter(Boolean).join(' · ')||'Skipped':s==='hours'?`${a.hoursPerWeek} h`:s==='days'?`${a.days} days`:s==='level'?{new:'Just starting',some:'Some basics',solid:'Pretty solid'}[a.level]:s==='focus'?(resources.find(r=>r.id===a.focusResourceId)?.title||'You pick'):TONE_LABEL[tone];
 return <ModalFrame title="Plan my week" subtitle="A 1-minute chat. Your coach turns it into this week’s plan." onClose={onClose} wide><div className="modal-content wk-chat">
  {answered.map(s=><div key={s} className="wk-turn"><p className="wk-bubble coach">{ASK[s]}</p><button className="wk-bubble me" onClick={()=>{setStep(s);setPlan(null);}}>{reply(s)}</button></div>)}
  <p className="wk-bubble coach live">{ASK[step]}</p>
  <div className="wk-answer">
   {step==='goal'&&<><textarea autoFocus rows={2} maxLength={200} value={a.goal} onChange={e=>set('goal',e.target.value)} placeholder="e.g. Crack DSA interviews, learn system design, read more"/>{state.goals.length>0&&<div className="wk-pills">{state.goals.slice(0,5).map(g=><button key={g.id} aria-pressed={a.goal===g.title} onClick={()=>set('goal',g.title)}>{g.title}</button>)}</div>}<button className="wk-primary" disabled={!a.goal.trim()} onClick={next}>Next<ArrowRight size={16}/></button></>}
   {step==='why'&&<><textarea rows={2} maxLength={400} value={a.why} onChange={e=>set('why',e.target.value)} placeholder="e.g. switching jobs, interviews in January"/><label className="wk-date">Deadline (optional)<input type="date" value={a.deadline} onChange={e=>set('deadline',e.target.value)}/></label><div className="wk-row"><button className="wk-ghost" onClick={()=>{set('why','');set('deadline','');next();}}>Skip</button><button className="wk-primary" onClick={next}>Next<ArrowRight size={16}/></button></div></>}
   {(step==='hours'||step==='days')&&scaleNote&&<p className="wk-scale">{scaleNote}</p>}{step==='hours'&&<div className="wk-pills">{[1,2,3,5,7,10,14].map(h=><button key={h} aria-pressed={a.hoursPerWeek===h} onClick={()=>{set('hoursPerWeek',h);setTimeout(next,120);}}>{h} h</button>)}</div>}
   {step==='days'&&<div className="wk-pills">{[2,3,4,5,6,7].map(d=><button key={d} aria-pressed={a.days===d} onClick={()=>{set('days',d);setTimeout(next,120);}}>{d} days</button>)}</div>}
   {step==='level'&&<div className="wk-pills">{([['new','Just starting'],['some','Some basics'],['solid','Pretty solid']] as const).map(([v,l])=><button key={v} aria-pressed={a.level===v} onClick={()=>{set('level',v);setTimeout(next,120);}}>{l}</button>)}</div>}
   {step==='focus'&&<><div className="wk-options">{resources.map(r=><button key={r.id} aria-pressed={a.focusResourceId===r.id} onClick={()=>set('focusResourceId',r.id)}><strong>{r.title}</strong><small>{r.kind} · {progress(r)}% done{r.demo?' · sample':''}</small></button>)}<button aria-pressed={!a.focusResourceId} onClick={()=>set('focusResourceId','')}><strong>You pick for me</strong><small>Based on your priorities and goal</small></button></div><button className="wk-primary" onClick={next}>Next<ArrowRight size={16}/></button></>}
   {step==='style'&&<div className="wk-options">{([['balanced','Gentle','Encouraging, still honest.'],['direct','Direct','Numbers first, no sugar-coating.'],['brutal','Unhinged','Roasts you when you slack. You asked for it.']] as const).map(([v,l,d])=><button key={v} aria-pressed={tone===v} onClick={()=>{setTone(v);setTimeout(next,150);}}><strong>{l}</strong><small>{d}</small></button>)}</div>}
   {step==='build'&&(busy||!plan?<p className="wk-building"><Loader2 size={18} className="spin"/>Building your week{aiConnected?' with AI':''}…</p>:<div className="wk-preview">
    <span className="wk-eyebrow">This week · {weekLabel(plan.weekStart)} – {endLabel(plan.weekStart)}{plan.source==='ai'?' · AI':''}</span><h3>{plan.title}</h3><p>{plan.summary}</p>{note&&<p className="wk-note">{note}</p>}
    {plan.targets.map(t=><div key={t.id} className="wk-edit-target"><span>{t.label}</span><div><button aria-label="Less" onClick={()=>bump(t.id,-1)}><Minus size={14}/></button><b>{t.kind==='minutes'?fmtMinutes(t.target):t.target}</b><button aria-label="More" onClick={()=>bump(t.id,1)}><Plus size={14}/></button></div></div>)}
    <div className="wk-row"><button className="wk-ghost" onClick={()=>void build()}><RotateCcw size={15}/>Regenerate</button><button className="wk-primary" onClick={()=>{const fixed={...plan,targets:plan.targets.map(t=>t.kind==='minutes'?{...t,label:t.resourceId?t.label:`Learn ${fmtMinutes(t.target)} in total`}:t)};if(onSave(fixed,a,tone)!==false){notify(tone==='brutal'?'Plan locked. No excuses this week.':'Your week is planned. I’ll track it with you.');onClose();}}}><Check size={16}/>Start this week</button></div>
   </div>)}
  </div>
 </div></ModalFrame>;
}

/* ---------------- Weekly report + share ---------------- */
function weekCardPng(v:ReturnType<typeof weekVerdict>,plan:WeeklyPlan){
 const c=document.createElement('canvas');c.width=1080;c.height=1350;const g=c.getContext('2d')!;
 const grad=g.createLinearGradient(0,0,1080,1350);grad.addColorStop(0,'#0b1d3a');grad.addColorStop(1,'#2a1747');g.fillStyle=grad;g.fillRect(0,0,1080,1350);
 const wrap=(text:string,x:number,y:number,max:number,lh:number,font:string,color:string,lines=6)=>{g.font=font;g.fillStyle=color;const words=text.split(' ');let line='',n=0;for(const w of words){const t=line?line+' '+w:w;if(g.measureText(t).width>max&&line){g.fillText(line,x,y);y+=lh;line=w;if(++n>=lines-1)break;}else line=t;}if(line)g.fillText(line,x,y);return y+lh;};
 g.font='600 40px system-ui';g.fillStyle='#a8c7fa';g.fillText('StudyBit Air · Week of '+weekLabel(plan.weekStart),90,140);
 g.font='800 300px system-ui';g.fillStyle=v.grade<='B'?'#8bd79f':v.grade==='C'?'#ffd36b':'#ff8a7a';g.fillText(v.grade,90,460);
 g.font='700 64px system-ui';g.fillStyle='#fff';g.fillText(v.pct+'% of plan',420,330);g.font='500 44px system-ui';g.fillStyle='#d0d6e4';g.fillText(fmtMinutes(v.minutes)+' learned'+(v.screen!==null?' · '+fmtMinutes(Math.round(v.screen))+' phone':''),420,400);
 const y=wrap(v.headline,90,600,900,72,'700 60px system-ui','#fff',3);
 wrap(v.lines[1]||v.lines[0],90,y+20,900,54,'400 40px system-ui','#d0d6e4',5);
 g.fillStyle='#ffffff14';g.fillRect(70,1040,940,220);wrap('Did you know? '+v.fact.text,100,1100,880,46,'400 34px system-ui','#e9ddff',4);
 return c.toDataURL('image/png');
}
export function WeekReport({state,plan,tone,notify,onDismiss,compact=false}:{state:LearningState;plan:WeeklyPlan;tone:Tone;notify:(s:string)=>void;onDismiss?:()=>void;compact?:boolean}){
 const v=weekVerdict(state,plan,tone),[open,setOpen]=useState(!compact);
 async function share(){try{const native=nativeBridge() as unknown as {shareProgress?:(t:string,p:string)=>string}|undefined;const png=weekCardPng(v,plan);if(native?.shareProgress){const r=JSON.parse(native.shareProgress(v.share,png));if(r.error)throw Error(r.error);return;}const blob=await (await fetch(png)).blob(),file=new File([blob],'studybit-week.png',{type:'image/png'});if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],text:v.share});return;}await navigator.clipboard.writeText(v.share);notify('Post text copied. Paste it anywhere.');}catch(e){if((e as Error).name!=='AbortError')notify((e as Error).message||'Sharing is unavailable here.');}}
 return <section className={'wk-report grade-'+v.grade} aria-label="Week report">
  <div className="wk-report-top"><span className="wk-grade">{v.grade}</span><div><span className="wk-eyebrow">Week of {weekLabel(plan.weekStart)} · {v.pct}% of plan</span><h3>{v.headline}</h3></div>{onDismiss&&<button className="wk-x" aria-label="Hide report" onClick={onDismiss}><X size={16}/></button>}</div>
  {open?<>{v.lines.map((l,i)=><p key={i}>{l}</p>)}{v.missed.length>0&&<p className="wk-missed">Missed: {v.missed.join(' · ')}</p>}</>:<button className="wk-more" onClick={()=>setOpen(true)}>Read the verdict<ChevronDown size={15}/></button>}
  <FactCard fact={v.fact}/>
  <div className="wk-row"><button className="wk-ghost" onClick={()=>void share()}><Share2 size={15}/>Share</button><a className="wk-x-post" href={xIntent(v.share)} target="_blank" rel="noreferrer"><Send size={15}/>Post on X</a></div>
 </section>;
}

export function FactCard({fact,title='Did you know?'}:{fact:BrainFact;title?:string}){
 return <aside className="wk-fact"><Lightbulb size={17}/><div><strong>{fact.kind==='quote'?'Worth remembering':title}</strong><p>{fact.kind==='quote'?`“${fact.text}”`:fact.text}</p><small>{fact.source}</small></div></aside>;
}
export function DailyFact({day}:{day:string}){return <FactCard fact={factOfDay(day)}/>;}

/* ---------------- Week history (Progress) ---------------- */
export function WeekHistory({state,now,tone,notify}:{state:LearningState;now:Date;tone:Tone;notify:(s:string)=>void}){
 const current=weekStartOf(state.settings.timezone,now),past=[...state.weeklyPlans].filter(p=>p.weekStart<current).sort((a,b)=>b.weekStart.localeCompare(a.weekStart));
 const [open,setOpen]=useState<string>('');
 if(!past.length)return null;
 return <section className="wk-history"><h3>Past weeks</h3>{past.map(p=>{const v=weekVerdict(state,p,tone);return <div key={p.id} className="wk-hist-row"><button onClick={()=>setOpen(open===p.id?'':p.id)}><span className={'wk-grade small grade-'+v.grade}>{v.grade}</span><span><strong>{p.title}</strong><small>Week of {weekLabel(p.weekStart)} · {v.pct}% · {fmtMinutes(v.minutes)}</small></span>{open===p.id?<ChevronUp size={17}/>:<ChevronDown size={17}/>}</button>{open===p.id&&<WeekReport state={state} plan={p} tone={tone} notify={notify}/>}</div>;})}</section>;
}

/* ---------------- Drag-to-reorder priorities ---------------- */
export function PriorityBoard({state,onClose,onSave}:{state:LearningState;onClose:()=>void;onSave:(order:string[])=>void}){
 const [items,setItems]=useState(()=>state.resources.filter(r=>!r.archived&&progress(r)<100).sort((a,b)=>rankResource(b,state)-rankResource(a,state)));
 const drag=useRef<{id:string;startY:number;startIndex:number;height:number}|null>(null),[dragId,setDragId]=useState(''),[offset,setOffset]=useState(0);
 const move=(i:number,j:number)=>setItems(list=>{if(j<0||j>=list.length)return list;const n=[...list];const [x]=n.splice(i,1);n.splice(j,0,x);return n;});
 function down(e:RPointerEvent,id:string,index:number){const row=(e.currentTarget as HTMLElement).closest('li')!;drag.current={id,startY:e.clientY,startIndex:index,height:row.getBoundingClientRect().height+8};setDragId(id);(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);}
 function moveDrag(e:RPointerEvent){const d=drag.current;if(!d)return;const dy=e.clientY-d.startY,steps=Math.round(dy/d.height),from=items.findIndex(x=>x.id===d.id),to=Math.max(0,Math.min(items.length-1,d.startIndex+steps));if(to!==from){move(from,to);}setOffset(dy-(to-d.startIndex)*d.height);}
 function up(){drag.current=null;setDragId('');setOffset(0);}
 return <ModalFrame title="Your priorities" subtitle="Drag to reorder. Your coach and daily plan follow this order." onClose={onClose}><div className="modal-content wk-board">
  <ol>{items.map((r,i)=><li key={r.id} className={dragId===r.id?'dragging':''} style={dragId===r.id?{transform:`translateY(${offset}px)`}:undefined}>
   <span className="wk-rank">{i+1}</span><span className="wk-board-copy"><strong>{r.title}</strong><small>{r.kind==='article'?'Reading':r.kind} · {progress(r)}%{r.deadline?' · due '+r.deadline:''}</small></span>
   <button className="wk-arrow" aria-label={'Move '+r.title+' up'} disabled={i===0} onClick={()=>move(i,i-1)}><ChevronUp size={17}/></button>
   <span className="wk-handle" aria-hidden="true" onPointerDown={e=>down(e,r.id,i)} onPointerMove={moveDrag} onPointerUp={up} onPointerCancel={up}><GripVertical size={20}/></span>
  </li>)}</ol>
  <div className="wk-row"><button className="wk-ghost" onClick={()=>{onSave([]);onClose();}}>Use automatic order</button><button className="wk-primary" onClick={()=>{onSave(items.map(r=>r.id));onClose();}}><Check size={16}/>Save order</button></div>
 </div></ModalFrame>;
}

/* ---------------- Tile history ---------------- */
export type MetricId='today'|'streak'|'momentum'|'week'|'minutes7'|'screen'|'best';
export function MetricHistory({metric,state,now,onClose,series}:{metric:MetricId;state:LearningState;now:Date;onClose:()=>void;series:(day:string)=>number|null}){
 const tz=state.settings.timezone,days=Array.from({length:14},(_,i)=>dayKey(new Date(now.getTime()-(13-i)*86400000),tz));
 const values=days.map(d=>({d,v:series(d)})),[sel,setSel]=useState(days.length-2);
 const max=Math.max(1,...values.map(x=>x.v||0)),title={today:'Learning minutes',streak:'Streak days',momentum:'Momentum score',week:'Active days',minutes7:'Learning minutes',screen:'Phone time',best:'Streak days'}[metric];
 const fmt=(v:number|null)=>v===null?'—':metric==='screen'||metric==='today'||metric==='minutes7'?fmtMinutes(Math.round(v)):String(v);
 const label=(d:string,i:number)=>i===days.length-1?'Today':i===days.length-2?'Yesterday':new Intl.DateTimeFormat('en',{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
 return <ModalFrame title={title} subtitle="Tap a day to see it. Last 14 days." onClose={onClose}><div className="modal-content wk-metric">
  <div className="wk-metric-big"><small>{label(values[sel].d,sel)}</small><strong>{fmt(values[sel].v)}</strong></div>
  <div className="wk-metric-bars">{values.map((x,i)=><button key={x.d} aria-pressed={i===sel} aria-label={label(x.d,i)+': '+fmt(x.v)} onClick={()=>setSel(i)}><span><i style={{height:(x.v?Math.max(4,x.v/max*100):0)+'%'}}/></span><small>{new Intl.DateTimeFormat('en',{weekday:'narrow',timeZone:'UTC'}).format(new Date(x.d+'T12:00:00Z'))}</small></button>)}</div>
  <ul className="wk-metric-list">{values.slice().reverse().slice(0,7).map((x,i)=><li key={x.d}><span>{label(x.d,values.length-1-i)}</span><b>{fmt(x.v)}</b></li>)}</ul>
 </div></ModalFrame>;
}
