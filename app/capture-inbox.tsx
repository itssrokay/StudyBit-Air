'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Check,ChevronRight,Inbox,Link2,ListTodo,Plus,Sprout,Archive,RotateCcw,Pencil,Trash2,Sparkles} from 'lucide-react';
import {makeResource,uid,type LearningState} from '../lib/learning';
import {captureInbox,captureLinks,captureTitle} from '../lib/capture';
import ModalFrame from './modal';
import InboxThemes from './inbox-themes';
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
 const [tab,setTab]=useState<'inbox'|'themes'|'filed'>('inbox');
 const [limit,setLimit]=useState(12);
 const editField=useRef<HTMLTextAreaElement>(null);
 const editAction=useRef<HTMLButtonElement>(null);
 const isEditing=editing!==null;
 useEffect(()=>{if(isEditing)editField.current?.focus();},[isEditing]);
 const items=state.inbox.filter(i=>i.status===tab);
 const item=state.inbox.find(i=>i.id===selected);
 const full=state.inbox.length>=300;
 const formatDate=new Intl.DateTimeFormat('en',{month:'short',day:'numeric',timeZone:state.settings.timezone});
 function changeTab(next:typeof tab){setTab(next);setLimit(12);}
 function closeCapture(){setSelected(null);setEditing(null);}
 function save(){
  if(!text.trim()||full)return;
  if(update(s=>captureInbox(s,text,workspace))===false)return;
  setText('');setComposing(false);changeTab('inbox');notify('Saved to your inbox.');
 }
 function file(id:string,status:'inbox'|'filed'){
  if(update(s=>({...s,inbox:s.inbox.map(i=>i.id===id?{...i,status}:i)}))===false)return;
  closeCapture();notify(status==='filed'?'Capture filed.':'Returned to your inbox.');
 }
 return <div className="capture-page inbox-queue">
  <div className="inbox-page-head"><h1>Inbox</h1><button className="primary" aria-haspopup="dialog" onClick={()=>setComposing(true)}><Plus size={18} aria-hidden="true"/>New capture</button></div>
  <div className="inbox-tabs" role="group" aria-label="Inbox status">
   <button aria-pressed={tab==='inbox'} className={tab==='inbox'?'selected':''} onClick={()=>changeTab('inbox')}>To review</button>
   <button aria-pressed={tab==='themes'} className={tab==='themes'?'selected':''} onClick={()=>changeTab('themes')}>Themes</button>
   <button aria-pressed={tab==='filed'} className={tab==='filed'?'selected':''} onClick={()=>changeTab('filed')}>Filed</button>
   <button className="inbox-log-link" onClick={onLog}>Log learning<ArrowUpRight size={15} aria-hidden="true"/></button>
  </div>
  {tab==='themes'?<InboxThemes state={state} workspace={workspace} update={update} notify={notify} onOpenCapture={setSelected}/>:<>
  <ul className="inbox-rows">
   {items.slice(0,limit).map(entry=>{
    const links=captureLinks(entry.text);
    const Icon=links.length?Link2:Inbox;
    return <li key={entry.id}><button className="m-simple-row inbox-row" aria-haspopup="dialog" onClick={()=>setSelected(entry.id)}>
     <Icon size={18} aria-hidden="true"/>
     <span><strong>{captureTitle(entry.text)}</strong><small>{links.length===1?links[0].host:links.length>1?links.length+' links':'Note'} · <time dateTime={entry.createdAt}>{formatDate.format(new Date(entry.createdAt))}</time></small></span>
     <ChevronRight size={18} aria-hidden="true"/>
    </button></li>;
   })}
  </ul>
  {items.length>limit&&<button className="secondary inbox-more" onClick={()=>setLimit(n=>n+12)}>Show more captures</button>}
  {!items.length&&<div className="inbox-empty"><h2>{tab==='inbox'?'You’re caught up':'No filed captures'}</h2><p>{tab==='inbox'?'Save a link or note to review later.':'Filed captures will appear here.'}</p>{tab==='filed'&&<button className="secondary" onClick={()=>changeTab('inbox')}>Back to review</button>}</div>}</>}

  {composing&&<ModalFrame title="New capture" onClose={()=>setComposing(false)}>
   <form className="modal-content inbox-compose" onSubmit={e=>{e.preventDefault();save();}}>
    <label>Link or note<textarea name="capture" rows={5} value={text} onChange={e=>setText(e.target.value)} maxLength={10000} placeholder="Paste a link or write a note…" required/></label>
    {full&&<p className="form-error" role="alert">Your inbox is full. Delete a capture to make room.</p>}
    <div className="modal-actions"><button className="primary" disabled={full||!text.trim()}><Check size={16} aria-hidden="true"/>Save to inbox</button></div>
   </form>
  </ModalFrame>}
  {item&&<ModalFrame title={editing===null?'Review capture':'Edit capture'} onClose={closeCapture}>
   {editing===null?<div className="modal-content inbox-review">
    <p className="inbox-review-text">{item.text}</p>
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
    <label>Link or note<textarea ref={editField} name="capture-edit" rows={6} value={editing} maxLength={10000} onChange={e=>setEditing(e.target.value)} required/></label>
    <div className="modal-actions">
     <button type="button" className="danger-button" onClick={()=>{if(confirm('Delete this capture? Imported resources and to-dos will stay.')&&update(s=>({...s,inbox:s.inbox.filter(i=>i.id!==item.id)}))!==false){closeCapture();notify('Capture deleted.');}}}><Trash2 size={16} aria-hidden="true"/>Delete capture</button>
     <button className="primary" disabled={!editing.trim()}><Check size={16} aria-hidden="true"/>Save changes</button>
    </div>
   </form>}
  </ModalFrame>}
 </div>;
}
