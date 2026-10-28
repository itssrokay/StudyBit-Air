'use client';
import {useEffect,useRef,useState} from 'react';import {BookOpen,Inbox} from 'lucide-react';import ModalFrame from './modal';import {WorkspaceSwitch} from './capture-inbox';import {readingLink} from '../lib/reading';
import {captureLinks,captureTitle} from '../lib/capture';
import {fetchLinkPreview} from '../lib/link-preview';
import type {Workspace} from '../lib/spaces';
export type IncomingCapture={id:string;text:string;createdAt:string};
export default function IncomingShare({capture,onSave,onClose,onDiscard,onRead}:{capture:IncomingCapture;onSave:(text:string,space:Workspace)=>boolean|void;onClose:()=>void;onDiscard:()=>void;onRead:(text:string,title:string,space:Workspace)=>boolean|void}){
 const [title,setTitle]=useState(()=>{const links=captureLinks(capture.text);try{return links.length===1&&capture.text.trim()===links[0].url?readingLink(links[0].url).title:captureTitle(capture.text);}catch{return captureTitle(capture.text);}});const [text,setText]=useState(capture.text),[space,setSpace]=useState<Workspace>('personal');
 const links=captureLinks(text),reading=links.length===1&&!links[0].kind.startsWith('YouTube');
 const touched=useRef({title:false,text:false}),[lookup,setLookup]=useState<'idle'|'loading'|'done'|'failed'>(()=>{const f=captureLinks(capture.text);return f.length===1&&!f[0].kind.startsWith('YouTube')?'loading':'idle';});
 // Fetch the post text / page title once, and fill in only what the learner hasn't edited.
 useEffect(()=>{const found=captureLinks(capture.text);if(found.length!==1||found[0].kind.startsWith('YouTube'))return;let live=true;
  fetchLinkPreview(found[0].url).then(p=>{if(!live)return;if(!p){setLookup('failed');return;}setLookup('done');
   if(!touched.current.title)setTitle(p.title);
   if(!touched.current.text&&p.excerpt&&capture.text.trim()===found[0].url){let link=found[0].url;try{link=readingLink(link).url;}catch{/* keep as shared */}setText(`${p.excerpt}\n— ${p.author}\n${link}`);}
  });return()=>{live=false;};},[capture.text]);
 return <ModalFrame title="Keep this for later?" subtitle="Shared to Learning Space. Review the text and choose its home." onClose={onClose}><div className="modal-content incoming-share"><WorkspaceSwitch workspace={space} onChange={setSpace}/><label>Shared text or link<textarea rows={7} maxLength={10000} value={text} onChange={e=>{touched.current.text=true;setText(e.target.value);}}/></label>{reading&&<label>Reading title <small>optional</small><input value={title} maxLength={250} onChange={e=>{touched.current.title=true;setTitle(e.target.value);}} placeholder="Give this a title you’ll recognise"/>{lookup==='loading'&&<small className="share-lookup">Getting the post’s text and title…</small>}{lookup==='failed'&&<small className="share-lookup">Couldn’t reach the link. Type a title you’ll recognise.</small>}</label>}<p className="capture-note">Save the link and the text the source app provided. A full X thread may need you to paste its text. Closing keeps this draft on your phone for later.</p><div className="incoming-actions">{reading&&<button className="primary full" onClick={()=>onRead(text,title,space)}><BookOpen size={17}/>Save to read</button>}<button className={reading?"secondary full":"primary full"} disabled={!text.trim()} onClick={()=>onSave(text,space)}><Inbox size={17}/>Save to inbox</button></div><button className="text-button" onClick={()=>{if(confirm('Discard this shared draft?'))onDiscard();}}>Discard draft</button></div></ModalFrame>;
}
