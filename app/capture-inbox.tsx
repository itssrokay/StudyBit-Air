'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Check,ChevronRight,Inbox,Link2,ListTodo,Plus,Sprout,Archive,RotateCcw,Pencil,Trash2,Sparkles,Search,X,Bell,ImageIcon} from 'lucide-react';
import {makeResource,uid,type LearningState} from '../lib/learning';
import {captureInbox,captureLinks,captureTitle} from '../lib/capture';
import ModalFrame from './modal';
import InboxThemes from './inbox-themes';
import {SaveMetaFields,emptyMeta,metaToSave,type SaveMetaValue} from './save-meta';
import {orderedIntents,saveTitle,searchSaves} from '../lib/saves';
import {savedImageUrl,deleteSavedImage,readScreenshot,recallSaves} from '../lib/saves-client';
import {nativeBridge} from '../lib/local-store';
import {dayKey} from '../lib/learning';
import type {Workspace} from '../lib/spaces';

export type UpdateLibrary=(fn:(s:LearningState)=>LearningState)=>boolean|void;
export function WorkspaceSwitch({workspace,onChange}:{workspace:Workspace;onChange:(value:Workspace)=>void}){
 return <div className="space-switch" role="group" aria-label="Learning space"><button className={workspace==='personal'?'selected':''} aria-pressed={workspace==='personal'} onClick={()=>onChange('personal')}>Personal</button><button className={workspace==='work'?'selected':''} aria-pressed={workspace==='work'} onClick={()=>onChange('work')}>Work</button></div>;
}

export default function CaptureInbox({state,workspace,update,onImport,onLog,notify,onCoach}:{state:LearningState;workspace:Workspace;update:UpdateLibrary;onImport:(url:string,text?:string)=>void;onLog:()=>void;notify:(text:string)=>void;onCoach?:(id:string)=>void}){
 const [composing,setComposing]=useState(false);
 const [selected,setSelected]=useState<string|null>(null);
 const [editing,setEditing]=useState<string|null>(null);
 const [text,setText]=useState('');
 const [meta,setMeta]=useState<SaveMetaValue>(emptyMeta),[query,setQuery]=useState(''),[recall,setRecall]=useState<{id:string;reason:string}[]|null>(null),[recalling,setRecalling]=useState(false),[readNote,setReadNote]=useState(''),[readingShot,setReadingShot]=useState(false);
 const intents=orderedIntents(state.inbox),today=dayKey(new Date(),state.settings.timezone);
 const [tab,setTab]=useState<'inbox'|'themes'|'filed'>('inbox');
 const [limit,setLimit]=useState(12);
 const editField=useRef<HTMLTextAreaElement>(null);
 const editAction=useRef<HTMLButtonElement>(null);
 const isEditing=editing!==null;
 useEffect(()=>{if(isEditing)editField.current?.focus();},[isEditing]);
 // Quick save with nothing copied or captured opens a blank note.
 useEffect(()=>{const open=()=>{try{if(nativeBridge()?.consumeQuickNote?.())setComposing(true);}catch{/* older app */}};open();window.addEventListener('learning-quick-note',open);return()=>window.removeEventListener('learning-quick-note',open);},[]);
 // Read screenshots that were saved offline (a few at a time, quietly).
 useEffect(()=>{if(!nativeBridge())return;let live=true;(async()=>{for(const i of state.inbox.filter(i=>i.image&&!i.imageRead).slice(0,3)){if(!live)break;const err=await readScreenshot(i,update);if(err)break;}})();return()=>{live=false;};// eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 const items=state.inbox.filter(i=>i.status===tab);
 const item=state.inbox.find(i=>i.id===selected);
 const full=state.inbox.length>=300;
 const formatDate=new Intl.DateTimeFormat('en',{month:'short',day:'numeric',timeZone:state.settings.timezone});
 function changeTab(next:typeof tab){setTab(next);setLimit(12);}
 function SaveRow({entry,reason}:{entry:typeof state.inbox[number];reason?:string}){
  const links=captureLinks(entry.text),thumb=entry.image?savedImageUrl(entry.image,160):'';
  const Icon=entry.image?ImageIcon:links.length?Link2:Inbox;
  const due=entry.status==='inbox'&&entry.remindOn&&entry.remindOn<=today;
  const where=entry.image?'Screenshot':links.length===1?links[0].host:links.length>1?links.length+' links':'Note';
  return <button className="m-simple-row inbox-row" aria-haspopup="dialog" onClick={()=>setSelected(entry.id)}>
   {thumb?<img className="save-thumb" src={thumb} alt=""/>:<Icon size={18} aria-hidden="true"/>}
   <span><strong>{saveTitle(entry)}</strong>{(reason||entry.why)&&(reason||entry.why)!==saveTitle(entry)&&<em className="save-row-why">{reason||entry.why}</em>}<small>{due&&<b className="save-due-badge"><Bell size={12} aria-hidden="true"/>Due</b>}{entry.intent?entry.intent+' · ':''}{where} · <time dateTime={entry.createdAt}>{formatDate.format(new Date(entry.createdAt))}</time>{entry.status==='filed'?' · Filed':''}</small></span>
   <ChevronRight size={18} aria-hidden="true"/>
  </button>;
 }
 function SearchResults(){
  const found=recall?recall.map(r=>({entry:state.inbox.find(i=>i.id===r.id),reason:r.reason})).filter(r=>r.entry):searchSaves(state.inbox,query,workspace).slice(0,30).map(entry=>({entry,reason:''}));
  const ai=!!nativeBridge()||typeof window!=='undefined';
  return <div className="save-results">
   <p className="save-results-meta">{recall?`${found.length} match${found.length===1?'':'es'} by meaning`:`${found.length} result${found.length===1?'':'s'}`}{ai&&!recall&&<button type="button" className="text-button" disabled={recalling} aria-busy={recalling} onClick={async()=>{setRecalling(true);try{setRecall(await recallSaves(state.inbox.filter(i=>i.workspace===workspace),query));}catch(e){notify((e as Error).message);}finally{setRecalling(false);}}}><Sparkles size={15} aria-hidden="true"/>{recalling?'Searching…':'Find by meaning'}</button>}{recall&&<button type="button" className="text-button" onClick={()=>setRecall(null)}>Show word matches</button>}</p>
   <ul className="inbox-rows">{found.map(r=><li key={r.entry!.id}><SaveRow entry={r.entry!} reason={r.reason}/></li>)}</ul>
   {!found.length&&<div className="inbox-empty"><h2>Nothing matches yet</h2><p>{recall?'Try describing it differently, or what you wanted it for.':'Try other words, or Find by meaning to search by what it was about.'}</p></div>}
  </div>;
 }
 function closeCapture(){setSelected(null);setEditing(null);}
 function save(){
  if(!text.trim()||full)return;
  if(update(s=>captureInbox(s,text,workspace,'typed',undefined,new Date(),metaToSave(meta,state.settings.timezone)))===false)return;
  setText('');setMeta(emptyMeta);setComposing(false);changeTab('inbox');notify('Saved to your inbox.');
 }
 function file(id:string,status:'inbox'|'filed'){
  if(update(s=>({...s,inbox:s.inbox.map(i=>i.id===id?{...i,status}:i)}))===false)return;
  closeCapture();notify(status==='filed'?'Capture filed.':'Returned to your inbox.');
 }
 return <div className="capture-page inbox-queue">
  <div className="inbox-page-head"><h1>Inbox</h1><button className="primary" aria-haspopup="dialog" onClick={()=>setComposing(true)}><Plus size={18} aria-hidden="true"/>New capture</button></div>
  <label className="inbox-search"><Search size={18} aria-hidden="true"/><input type="text" enterKeyHint="search" value={query} placeholder="Search what you saved, or why" aria-label="Search your saves" onChange={e=>{setQuery(e.target.value);setRecall(null);}}/>{query&&<button type="button" aria-label="Clear search" onClick={()=>{setQuery('');setRecall(null);}}><X size={18}/></button>}</label>
  {query.trim()?<SearchResults/>:<>
  <div className="inbox-tabs" role="group" aria-label="Inbox status">
   <button aria-pressed={tab==='inbox'} className={tab==='inbox'?'selected':''} onClick={()=>changeTab('inbox')}>To review</button>
   <button aria-pressed={tab==='themes'} className={tab==='themes'?'selected':''} onClick={()=>changeTab('themes')}>Themes</button>
   <button aria-pressed={tab==='filed'} className={tab==='filed'?'selected':''} onClick={()=>changeTab('filed')}>Filed</button>
   <button className="inbox-log-link" onClick={onLog}>Log learning<ArrowUpRight size={15} aria-hidden="true"/></button>
  </div>
  {tab==='themes'?<InboxThemes state={state} workspace={workspace} update={update} notify={notify} onOpenCapture={setSelected}/>:<>
  <ul className="inbox-rows">
   {items.slice(0,limit).map(entry=>{
    return <li key={entry.id}><SaveRow entry={entry}/></li>;
   })}
  </ul>
  {items.length>limit&&<button className="secondary inbox-more" onClick={()=>setLimit(n=>n+12)}>Show more captures</button>}
  {!items.length&&<div className="inbox-empty"><h2>{tab==='inbox'?'You’re caught up':'No filed captures'}</h2><p>{tab==='inbox'?'Save a link or note to review later.':'Filed captures will appear here.'}</p>{tab==='filed'&&<button className="secondary" onClick={()=>changeTab('inbox')}>Back to review</button>}</div>}</>}</>}

  {composing&&<ModalFrame title="New capture" onClose={()=>setComposing(false)}>
   <form className="modal-content inbox-compose" onSubmit={e=>{e.preventDefault();save();}}>
    <label>Link or note<textarea name="capture" rows={4} value={text} onChange={e=>setText(e.target.value)} maxLength={10000} placeholder="Paste a link or write a note…" required/></label>
    <SaveMetaFields value={meta} onChange={setMeta} intents={intents}/>
    {full&&<p className="form-error" role="alert">Your inbox is full. Delete a capture to make room.</p>}
    <div className="modal-actions"><button className="primary" disabled={full||!text.trim()}><Check size={16} aria-hidden="true"/>Save to inbox</button></div>
   </form>
  </ModalFrame>}
  {item&&<ModalFrame title={editing===null?'Review capture':'Edit capture'} onClose={closeCapture}>
   {editing===null?<div className="modal-content inbox-review">
    {item.image&&<figure className="share-shot">{savedImageUrl(item.image,900)?<img src={savedImageUrl(item.image,900)} alt={saveTitle(item)}/>:<figcaption><ImageIcon size={16} aria-hidden="true"/>Screenshot saved on your phone</figcaption>}</figure>}
    {(item.why||item.intent||item.remindOn)&&<div className="save-why-card">{item.intent&&<span className="save-intent">{item.intent}</span>}{item.why&&<p><strong>You saved this because:</strong> {item.why}</p>}{item.remindOn&&<p className="save-due"><Bell size={14} aria-hidden="true"/>{item.remindOn<=today?'Due '+(item.remindOn===today?'today':'since '+formatDate.format(new Date(item.remindOn+'T12:00:00Z'))):'Comes back '+formatDate.format(new Date(item.remindOn+'T12:00:00Z'))}</p>}</div>}
    {item.title&&<h3 className="save-title">{item.title}</h3>}
    {!(item.image&&item.text==='Screenshot')&&<p className="inbox-review-text">{item.text}</p>}
    {item.image&&(item.imageRead?item.imageText&&<details className="rf-details"><summary>Text on the screenshot</summary><p className="inbox-review-text">{item.imageText}</p></details>:<div className="save-read"><button className="secondary" disabled={readingShot} aria-busy={readingShot} onClick={async()=>{setReadingShot(true);setReadNote('');const err=await readScreenshot(item,update);setReadingShot(false);setReadNote(err);}}><Sparkles size={16} aria-hidden="true"/>{readingShot?'Reading…':'Read with AI'}</button><small>{readNote||'AI names it, pulls out the text and any links, so search can find it.'}</small></div>)}
    {captureLinks(item.text).map(link=>{
     const saved=state.resources.some(r=>r.url===link.url);
     return <div className="capture-link" key={link.url}><Link2 size={17} aria-hidden="true"/><span><strong>{link.kind}</strong><small>{link.host}</small></span><button className="secondary" onClick={()=>{closeCapture();onImport(link.url,item.text);}}>{saved?'Review link':'Import link'}</button></div>;
    })}
    <div className="inbox-review-actions">
     <button ref={editAction} className="m-simple-row" onClick={()=>setEditing(item.text)}><Pencil size={18} aria-hidden="true"/><span>Edit capture</span></button>
     {onCoach&&<button className="m-simple-row" onClick={()=>{closeCapture();onCoach(item.id);}}><Sparkles size={18} aria-hidden="true"/><span>Think with coach</span></button>}
     <button className="m-simple-row" onClick={()=>{if(update(s=>({...s,todos:[...s.todos,{id:uid(),title:captureTitle(item.text).slice(0,200),createdAt:new Date().toISOString(),workspace,goalId:'',dueDay:'',doneAt:null}]}))!==false){closeCapture();notify('Added as a to-do.');}}}><ListTodo size={18} aria-hidden="true"/><span>Make a to-do</span></button>
     <button className="m-simple-row" onClick={()=>{const title=captureTitle(item.text);const resource=makeResource({title,kind:'topic',workspace,notes:item.text,provider:'Your inbox'},[{title:'Explore '+title,minutes:15,format:'exercise'}]);if(update(s=>({...s,resources:[...s.resources,resource]}))!==false){closeCapture();notify('Added as a topic in your library.');}}}><Sprout size={18} aria-hidden="true"/><span>Add a topic</span></button>
    </div>
    <div className="modal-actions"><button className="primary" onClick={()=>file(item.id,item.status==='inbox'?'filed':'inbox')}>{item.status==='inbox'?<Archive size={16} aria-hidden="true"/>:<RotateCcw size={16} aria-hidden="true"/>}{item.status==='inbox'?'File capture':'Return to inbox'}</button></div>
   </div>:<form className="modal-content inbox-compose" onSubmit={e=>{e.preventDefault();if(!editing.trim())return;if(update(s=>({...s,inbox:s.inbox.map(i=>i.id===item.id?{...i,text:editing.trim()}:i)}))!==false){setEditing(null);requestAnimationFrame(()=>editAction.current?.focus());}}}>
    <label>Link or note<textarea ref={editField} name="capture-edit" rows={5} value={editing} maxLength={10000} onChange={e=>setEditing(e.target.value)} required/></label>
    <label className="save-why"><span>Why you saved it</span><input value={item.why} maxLength={300} placeholder="Optional" onChange={e=>{const why=e.target.value;update(s=>({...s,inbox:s.inbox.map(i=>i.id===item.id?{...i,why}:i)}));}}/></label>
    <div className="modal-actions">
     <button type="button" className="danger-button" onClick={()=>{if(confirm('Delete this capture? Imported resources and to-dos will stay.')&&update(s=>({...s,inbox:s.inbox.filter(i=>i.id!==item.id)}))!==false){deleteSavedImage(item.image||'');closeCapture();notify('Capture deleted.');}}}><Trash2 size={16} aria-hidden="true"/>Delete capture</button>
     <button className="primary" disabled={!editing.trim()}><Check size={16} aria-hidden="true"/>Save changes</button>
    </div>
   </form>}
  </ModalFrame>}
 </div>;
}
