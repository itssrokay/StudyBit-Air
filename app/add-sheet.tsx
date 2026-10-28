'use client';
import {useState} from 'react';
import {Link2,ClipboardPaste,ArrowRight,Lightbulb,BookOpen,FileText,Upload,Newspaper,Check,Minus,Plus} from 'lucide-react';
import ModalFrame from './modal';
import {makeResource,type LearningState,type Resource} from '../lib/learning';
import {linkRoute,topicLessons} from '../lib/library-add';

export default function AddSheet({state,onClose,onLink,onCreate,onOutline,onBook,onFile}:{state:LearningState;onClose:()=>void;onLink:(url:string,route:'link'|'article')=>void;onCreate:(r:Resource)=>boolean|void;onOutline:()=>void;onBook:()=>void;onFile:()=>void}){
 const [url,setUrl]=useState(''),[mode,setMode]=useState<'pick'|'topic'>('pick'),[err,setErr]=useState('');
 const [title,setTitle]=useState(''),[subs,setSubs]=useState(''),[sessions,setSessions]=useState(10),[minutes,setMinutes]=useState(30),[goal,setGoal]=useState(state.settings.focusGoal),[deadline,setDeadline]=useState(''),[high,setHigh]=useState(true);
 const valid=(()=>{try{const u=new URL(url.trim());return u.protocol==='https:'||u.protocol==='http:';}catch{return false;}})();
 async function paste(){try{const t=(await navigator.clipboard.readText()).trim();const m=t.match(/https?:\/\/\S+/);if(m)setUrl(m[0]);else setErr('No link on your clipboard. Long-press the box to paste.');}catch{setErr('Long-press the box and choose Paste.');}}
 const count=subs.split('\n').filter(s=>s.trim()).length;
 if(mode==='topic')return <ModalFrame title="Learn a topic" subtitle="No link needed. Break it into subtopics and your coach plans the sessions." onClose={onClose}><form className="modal-content as-topic" onSubmit={e=>{e.preventDefault();if(!title.trim())return;const r=makeResource({title:title.trim(),kind:'topic',provider:'Personal',goalId:goal,priority:high?5:3,deadline,color:'blue'},topicLessons(subs,sessions,minutes));if(onCreate(r)!==false)onClose();}}>
  <label>What do you want to learn?<input autoFocus required maxLength={250} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. DSA, System design, Spanish"/></label>
  <label>Subtopics <small>One per line. Each becomes a session you can tick off.</small><textarea rows={5} value={subs} onChange={e=>setSubs(e.target.value)} placeholder={'Arrays & hashing\nTwo pointers\nSliding window\nTrees\nGraphs'}/></label>
  {!count&&<div className="as-stepper"><span>Sessions</span><div><button type="button" aria-label="Fewer sessions" onClick={()=>setSessions(n=>Math.max(1,n-1))}><Minus size={15}/></button><b>{sessions}</b><button type="button" aria-label="More sessions" onClick={()=>setSessions(n=>Math.min(200,n+1))}><Plus size={15}/></button></div></div>}
  <div className="as-field"><span>Minutes per session</span><div className="as-pills">{[15,25,30,45,60,90].map(m=><button type="button" key={m} aria-pressed={minutes===m} onClick={()=>setMinutes(m)}>{m}</button>)}</div></div>
  <div className="form-grid"><label>Goal<select value={goal} onChange={e=>setGoal(e.target.value)}><option value="">No goal</option>{state.goals.map(g=><option key={g.id} value={g.id}>{g.title}</option>)}</select></label><label>Finish by (optional)<input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)}/></label></div>
  <label className="as-check"><input type="checkbox" checked={high} onChange={e=>setHigh(e.target.checked)}/><span><strong>Make it a top priority</strong><small>It moves up in your plan and coach.</small></span></label>
  <p className="as-summary">{count||sessions} sessions × {minutes} min = {Math.round((count||sessions)*minutes/60*10)/10} h</p>
  <div className="modal-actions"><button type="button" className="secondary" onClick={()=>setMode('pick')}>Back</button><button className="primary" disabled={!title.trim()}><Check size={16}/>Add topic</button></div>
 </form></ModalFrame>;
 return <ModalFrame title="Add to library" subtitle="Paste a link and we’ll work out the rest." onClose={onClose}><div className="modal-content as-pick">
  <form className="as-link" onSubmit={e=>{e.preventDefault();if(valid)onLink(url.trim(),linkRoute(url.trim()));}}>
   <Link2 size={19}/><input type="url" inputMode="url" value={url} onChange={e=>{setUrl(e.target.value);setErr('');}} placeholder="YouTube playlist, course, article or X post"/>
   {url?<button className="as-go" disabled={!valid} aria-label="Continue"><ArrowRight size={19}/></button>:<button type="button" className="as-paste" onClick={()=>void paste()}><ClipboardPaste size={16}/>Paste</button>}
  </form>
  {err&&<p className="as-err">{err}</p>}
  {valid&&<p className="as-hint">{linkRoute(url.trim())==='link'?'Imports the course or playlist with every lesson and its duration.':'Saves it to your reading list with its title. You can pick a category.'}</p>}
  <div className="as-or">or start from</div>
  <div className="as-grid">
   <button className="as-tile tone-blue" onClick={()=>setMode('topic')}><Lightbulb size={22}/><strong>A topic</strong><small>DSA, system design… no link needed</small></button>
   <button className="as-tile tone-teal" onClick={onOutline}><FileText size={22}/><strong>Course outline</strong><small>Paste a lesson list</small></button>
   <button className="as-tile tone-orange" onClick={onBook}><BookOpen size={22}/><strong>Book</strong><small>PDF, EPUB or just a title</small></button>
   <button className="as-tile tone-purple" onClick={()=>onLink('','article')}><Newspaper size={22}/><strong>Article or note</strong><small>Paste text or a post</small></button>
  </div>
  <button className="as-file" onClick={onFile}><Upload size={16}/>Import a JSON or text file</button>
 </div></ModalFrame>;
}
