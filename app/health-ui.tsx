'use client';
import {useState} from 'react';
import {Timer,Flame,Gauge,CalendarCheck,Clock3,Smartphone,Inbox,Trophy,SlidersHorizontal,ChevronUp,ChevronDown,Check} from 'lucide-react';
import ModalFrame from './modal';
import type {LearningState} from '../lib/learning';
import {progressSeries,type ProgressRange} from '../lib/progress-series';
import {briefDuration,type MorningBrief} from '../lib/morning-brief';

/* Material 3 Expressive "cookie" shape, used for a completed goal. */
const COOKIE=(()=>{const n=240,pts:string[]=[];for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,r=46*(1+0.075*Math.cos(9*a));pts.push(`${(60+r*Math.cos(a-Math.PI/2)).toFixed(2)},${(60+r*Math.sin(a-Math.PI/2)).toFixed(2)}`);}return 'M'+pts.join('L')+'Z';})();

export function GoalRing({minutes,goal,size=96}:{minutes:number;goal:number;size?:number}){
 const pct=Math.min(100,Math.round(minutes/Math.max(1,goal)*100)),done=minutes>=goal;
 return <div className={'h-ring'+(done?' done':'')} style={{width:size,height:size}} role="img" aria-label={`${minutes} of ${goal} minutes, ${pct}%`}>
  {done?<svg viewBox="0 0 120 120"><path className="h-cookie" d={COOKIE}/><path className="h-check" d="M40 61 l13 13 l27 -29" fill="none"/></svg>
  :<svg viewBox="0 0 120 120"><circle className="h-ring-base" cx="60" cy="60" r="48"/><circle className="h-ring-fill" cx="60" cy="60" r="48" pathLength="100" strokeDasharray={`${pct} 100`} style={{opacity:minutes?1:0}}/></svg>}
  {!done&&<span>{pct}<small>%</small></span>}
 </div>;
}

export type TileId='today'|'streak'|'momentum'|'week'|'minutes7'|'screen'|'inbox'|'best';
const TILE_KEY='learning-space-tiles-v1',DEFAULT_TILES:TileId[]=['today','streak','momentum'];
export const TILE_NAMES:Record<TileId,string>={today:'Learning today',streak:'Streak',momentum:'Momentum score',week:'Active days this week',minutes7:'Minutes, last 7 days',screen:'Screen time yesterday',inbox:'Inbox captures',best:'Best streak'};
export function readTiles():TileId[]{try{const v=JSON.parse(localStorage.getItem(TILE_KEY)||'null');if(Array.isArray(v)&&v.every(t=>t in TILE_NAMES))return v.slice(0,3);}catch{/* defaults */}return DEFAULT_TILES;}

export type TileData={today:number;goal:number;streak:number;best:number;daysWeek:number;weeklyDays:number;minutesWeek:number;screen:number|null;screenWhen?:string;inbox:number;brief:MorningBrief};
export function tile(id:TileId,d:TileData){
 switch(id){
  case 'today':return {icon:Timer,label:'Today',value:String(d.today),unit:`of ${d.goal} min`,tone:'blue'};
  case 'streak':return {icon:Flame,label:'Streak',value:String(d.streak),unit:d.streak===1?'day':'days',tone:'orange'};
  case 'momentum':return {icon:Gauge,label:'Momentum',value:String(d.brief.score),unit:d.brief.label.replace(' momentum',''),tone:'purple'};
  case 'week':return {icon:CalendarCheck,label:'This week',value:`${d.daysWeek}/${d.weeklyDays}`,unit:'days',tone:'teal'};
  case 'minutes7':return {icon:Clock3,label:'Last 7 days',value:String(d.minutesWeek),unit:'min',tone:'blue'};
  case 'screen':return {icon:Smartphone,label:'Screen time',value:d.screen==null?'—':briefDuration(d.screen),unit:d.screen==null?'not shared':(d.screenWhen||'yesterday'),tone:'pink'};
  case 'inbox':return {icon:Inbox,label:'Inbox',value:String(d.inbox),unit:d.inbox===1?'capture':'captures',tone:'green'};
  case 'best':return {icon:Trophy,label:'Best streak',value:String(d.best),unit:'days',tone:'orange'};
 }
}

export function StatTiles({data,tiles,onTile,onEdit}:{data:TileData;tiles:TileId[];onTile:(id:TileId)=>void;onEdit:()=>void}){
 return <div className="h-tiles">{tiles.map((id,i)=>{const t=tile(id,data),Icon=t.icon;return <button key={id} className={'h-tile tone-'+t.tone} style={{animationDelay:`${60+i*50}ms`}} onClick={()=>onTile(id)}><Icon size={17} aria-hidden="true"/><strong>{t.value}</strong><small>{t.unit}</small><span>{t.label}</span></button>;})}
  <button className="h-tiles-edit" aria-label="Choose your tiles" onClick={onEdit}><SlidersHorizontal size={16}/></button></div>;
}

export function TileEditor({tiles,onClose,onSave}:{tiles:TileId[];onClose:()=>void;onSave:(t:TileId[])=>void}){
 const [list,setList]=useState<TileId[]>(tiles);
 const all=Object.keys(TILE_NAMES) as TileId[];
 const move=(i:number,by:number)=>setList(l=>{const n=[...l];const j=i+by;if(j<0||j>=n.length)return l;[n[i],n[j]]=[n[j],n[i]];return n;});
 return <ModalFrame title="Your tiles" subtitle="Pick up to 3 numbers for the top of Today, in the order you want." onClose={onClose}><div className="modal-content h-tile-editor">
  <ol>{list.map((id,i)=><li key={id}><span>{TILE_NAMES[id]}</span><button className="icon-button" aria-label={'Move '+TILE_NAMES[id]+' up'} disabled={i===0} onClick={()=>move(i,-1)}><ChevronUp size={18}/></button><button className="icon-button" aria-label={'Move '+TILE_NAMES[id]+' down'} disabled={i===list.length-1} onClick={()=>move(i,1)}><ChevronDown size={18}/></button></li>)}</ol>
  <div className="h-tile-options">{all.map(id=>{const on=list.includes(id);return <label key={id} className={on?'on':''}><input type="checkbox" checked={on} disabled={!on&&list.length>=3} onChange={e=>setList(l=>e.target.checked?[...l,id]:l.filter(x=>x!==id))}/>{on&&<Check size={15}/>}{TILE_NAMES[id]}</label>;})}</div>
  <button className="primary" disabled={!list.length} onClick={()=>{try{localStorage.setItem(TILE_KEY,JSON.stringify(list));}catch{/* session only */}onSave(list);onClose();}}>Save tiles</button>
 </div></ModalFrame>;
}

export function ProgressChart({state,now,goal}:{state:LearningState;now:Date;goal:number}){
 const [range,setRange]=useState<ProgressRange>('W');
 const s=progressSeries(state,now,range),max=Math.max(...s.bars.map(b=>b.minutes),range==='W'||range==='M'?goal:1,1);
 const goalLine=range==='W'||range==='M'?Math.min(100,goal/max*100):null;
 return <section className="h-chart">
  <div className="h-chart-head"><div><span>{range==='W'?'Last 7 days':range==='M'?'Last 30 days':range==='3M'?'Last 3 months':'Last 12 months'}</span><strong>{briefDuration(s.total)}</strong><small>{s.average} min a day on average · {s.active} active {s.unit}{s.active===1?'':'s'}</small></div></div>
  <div className={'h-bars r-'+range} key={range}>{goalLine!==null&&<i className="h-goal-line" style={{bottom:`calc(24px + (100% - 24px) * ${(goalLine/100).toFixed(3)})`}} aria-hidden="true"><b>{goal} min goal</b></i>}{s.bars.map((b,i)=><div key={b.key} title={`${b.key}: ${b.minutes} min`}><span><i className={b.current?'current':''} style={{height:(b.minutes?Math.max(4,b.minutes/max*100):0)+'%',animationDelay:`${i*(range==='M'?12:30)}ms`}}/></span><small>{b.label}</small></div>)}</div>
  <div className="h-range" role="group" aria-label="Time range">{(['W','M','3M','Y'] as ProgressRange[]).map(r=><button key={r} aria-pressed={range===r} onClick={()=>setRange(r)}>{r}</button>)}</div>
 </section>;
}
