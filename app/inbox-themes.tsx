'use client';
import {useMemo,useState} from 'react';
import {ArrowRight,BookOpen,ChevronDown,Layers,Link2,RefreshCw,StickyNote} from 'lucide-react';
import type {LearningState} from '../lib/learning';
import type {Workspace} from '../lib/spaces';
import {apiRequest} from '../lib/client-api';
import {collectSaves,smartThemes,themesFromAI,saveThemes,themeSet,newSince,type SaveItem,type ThemeGroup} from '../lib/themes';

type Update=(fn:(s:LearningState)=>LearningState)=>boolean|void;
const ago=(iso:string)=>{const m=Math.round((Date.now()-Date.parse(iso))/60000);if(m<1)return 'just now';if(m<60)return m+' min ago';const h=Math.round(m/60);if(h<24)return h+' h ago';const d=Math.round(h/24);return d===1?'yesterday':d+' days ago';};

/** Inbox → Themes: everything shared or jotted, clubbed into a few named themes (DESIGN.md: one action, say it once). */
export default function InboxThemes({state,workspace,update,notify,onOpenCapture}:{state:LearningState;workspace:Workspace;update:Update;notify:(t:string)=>void;onOpenCapture:(id:string)=>void}){
 const items=useMemo(()=>collectSaves(state,workspace),[state,workspace]);
 const byId=useMemo(()=>new Map(items.map(i=>[i.id,i])),[items]);
 const set=themeSet(state,workspace);
 const [busy,setBusy]=useState(false),[note,setNote]=useState('');
 const fresh=newSince(set,items);

 async function group(){
  if(items.length<2||busy)return;setBusy(true);setNote('');
  let groups:ThemeGroup[],source:'ai'|'smart'='ai';
  try{
   const response=await apiRequest('/api/coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'themes',items,goals:state.goals.filter(g=>g.workspace===workspace).map(g=>g.title)})});
   const data=await response.json() as {error?:string};
   if(!response.ok)throw Error(data.error||'AI is unavailable.');
   groups=themesFromAI(data,items);
  }catch(e){groups=smartThemes(items);source='smart';setNote(((e as Error).message||'').includes('key')?'Add your OpenAI key in Settings for sharper, AI-named themes with a next step for each.':'AI couldn’t answer, so these were grouped on your phone. Regroup when you’re online.');}
  const ok=update(s=>saveThemes(s,{workspace,at:new Date().toISOString(),source,seen:items.map(i=>i.id),groups}));
  setBusy(false);
  if(ok!==false){const n=groups.filter(g=>g.id!=='other').length;notify(n?`${n} theme${n===1?'':'s'} from ${items.length} saves.`:'Nothing clubs together yet. Save a few more.');}
 }

 if(!set)return <section className="themes-empty">
  <span className="themes-empty-icon"><Layers size={22} aria-hidden="true"/></span>
  <h2>Club your saves into themes</h2>
  <p>{items.length<2?'Share a few links or jot a few notes first. They’ll be grouped here.':`${items.length} links, notes and readings are waiting. Group them to see what they add up to and what to do first.`}</p>
  {items.length>=2&&<button className="primary" onClick={group} disabled={busy} aria-busy={busy}>{busy?'Grouping…':'Group my saves'}</button>}
  {note&&<p className="themes-note" role="status">{note}</p>}
 </section>;

 const live=set.groups.map(g=>({...g,list:g.itemIds.map(id=>byId.get(id)).filter((x):x is SaveItem=>!!x)})).filter(g=>g.list.length>0);
 const main=live.filter(g=>g.id!=='other'),other=live.find(g=>g.id==='other');
 return <div className="themes">
  <div className="themes-meta">
   <p>{set.source==='ai'?'Grouped by AI':'Grouped on this phone'} · {ago(set.at)}{fresh>0&&<> · <strong>{fresh} new</strong></>}</p>
   <button className="secondary" onClick={group} disabled={busy||items.length<2} aria-busy={busy}><RefreshCw size={16} aria-hidden="true"/>{busy?'Grouping…':'Regroup'}</button>
  </div>
  {note&&<p className="themes-note" role="status">{note}</p>}
  {main.map(g=><ThemeCard key={g.id} group={g} list={g.list} onOpenCapture={onOpenCapture}/>)}
  {other&&<details className="theme-card theme-other"><summary><h2>{other.title}<small>{other.list.length}</small></h2><ChevronDown size={18} aria-hidden="true"/></summary><ul className="theme-items">{other.list.map(i=><ThemeItem key={i.id} item={i} onOpenCapture={onOpenCapture}/>)}</ul></details>}
  {!main.length&&!other&&<p className="themes-note">Everything here has been read or filed. Regroup when you’ve saved more.</p>}
 </div>;
}

function ThemeCard({group,list,onOpenCapture}:{group:ThemeGroup;list:SaveItem[];onOpenCapture:(id:string)=>void}){
 const [all,setAll]=useState(false);const shown=all?list:list.slice(0,3);
 return <section className="theme-card" aria-label={group.title}>
  <h2>{group.title}<small>{list.length}</small></h2>
  {group.summary&&<p className="theme-summary">{group.summary}</p>}
  {group.next&&<p className="theme-next"><ArrowRight size={16} aria-hidden="true"/><span>{group.next}</span></p>}
  <ul className="theme-items">{shown.map(i=><ThemeItem key={i.id} item={i} onOpenCapture={onOpenCapture}/>)}</ul>
  {list.length>3&&<button className="text-button theme-more" onClick={()=>setAll(v=>!v)} aria-expanded={all}>{all?'Show fewer':`Show ${list.length-3} more`}</button>}
 </section>;
}

function ThemeItem({item,onOpenCapture}:{item:SaveItem;onOpenCapture:(id:string)=>void}){
 const Icon=item.kind==='reading'?BookOpen:item.url?Link2:StickyNote;
 const meta=item.kind==='reading'?'Saved reading'+(item.host?' · '+item.host:''):item.url?item.host:'Note';
 const body=<><Icon size={18} aria-hidden="true"/><span><strong>{item.title}</strong><small>{meta}</small></span></>;
 return <li>{item.kind==='capture'?<button className="theme-item" onClick={()=>onOpenCapture(item.id.slice(2))}>{body}</button>:<a className="theme-item" href={item.url} target="_blank" rel="noreferrer">{body}</a>}</li>;
}
