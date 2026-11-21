'use client';
import {useEffect,useRef,useState} from 'react';import {BookOpen,Inbox,X} from 'lucide-react';import {CategoryPicker,AsapToggle} from './reading-fields';import ModalFrame from './modal';import {WorkspaceSwitch} from './capture-inbox';import {readingLink,suggestCategory,weekDeadline,dayLabel} from '../lib/reading';
import {captureLinks,captureTitle} from '../lib/capture';
import {fetchLinkPreview} from '../lib/link-preview';
import type {Workspace} from '../lib/spaces';
import {SaveMetaFields,emptyMeta,metaToSave,type SaveMetaValue} from './save-meta';
import {savedImageUrl} from '../lib/saves-client';
import type {SaveMeta} from '../lib/capture';
export type IncomingCapture={id:string;text:string;createdAt:string;image?:string};
export type ReadingChoice={category:string;asap:boolean};
export default function IncomingShare({capture,categories,timezone='UTC',intents=[],onSave,onClose,onDiscard,onRead}:{capture:IncomingCapture;categories:string[];timezone?:string;intents?:string[];onSave:(text:string,space:Workspace,meta:SaveMeta)=>boolean|void;onClose:()=>void;onDiscard:()=>void;onRead:(text:string,title:string,space:Workspace,choice:ReadingChoice,meta:SaveMeta)=>boolean|void}){
 const [meta,setMeta]=useState<SaveMetaValue>(emptyMeta),image=capture.image||'',preview=image?savedImageUrl(image,720):'';
 const saveMeta=():SaveMeta=>({...metaToSave(meta,timezone),image});
 const [title,setTitle]=useState(()=>{const links=captureLinks(capture.text);try{return links.length===1&&capture.text.trim()===links[0].url?readingLink(links[0].url).title:captureTitle(capture.text);}catch{return captureTitle(capture.text);}});const [text,setText]=useState(capture.text),[space,setSpace]=useState<Workspace>('personal');
 const links=captureLinks(text),reading=links.length===1&&!links[0].kind.startsWith('YouTube');
 const [category,setCategory]=useState(()=>suggestCategory(capture.text)),[suggested,setSuggested]=useState(()=>suggestCategory(capture.text)),[asap,setAsap]=useState(false),[edited,setEdited]=useState(false);
 const touched=useRef({title:false,text:false,category:false}),[lookup,setLookup]=useState<'idle'|'loading'|'done'|'failed'>(()=>{const f=captureLinks(capture.text);return f.length===1&&!f[0].kind.startsWith('YouTube')?'loading':'idle';});
 // Fetch the post text / page title once, and fill in only what the learner hasn't edited.
 useEffect(()=>{const found=captureLinks(capture.text);if(found.length!==1||found[0].kind.startsWith('YouTube'))return;let live=true;
  fetchLinkPreview(found[0].url).then(p=>{if(!live)return;if(!p){setLookup('failed');return;}setLookup('done');
   if(!touched.current.title)setTitle(p.title);
   if(!touched.current.text&&p.excerpt&&capture.text.trim()===found[0].url){let link=found[0].url;try{link=readingLink(link).url;}catch{/* keep as shared */}setText(`${p.excerpt}\n— ${p.author}\n${link}`);}
   const guess=suggestCategory(p.title+' '+p.excerpt);if(guess&&!touched.current.category){setCategory(guess);setSuggested(guess);}
  });return()=>{live=false;};},[capture.text]);
 const pick=(v:string)=>{touched.current.category=true;setCategory(v);};
 return <ModalFrame title="Keep this for later?" subtitle={image?'Your screenshot is saved privately on this phone.':'Say why, so future you remembers.'} onClose={onClose}><div className="modal-content incoming-share">
  <WorkspaceSwitch workspace={space} onChange={setSpace}/>
  {image&&<figure className="share-shot">{preview?<img src={preview} alt="Screenshot you are saving"/>:<figcaption>Screenshot attached</figcaption>}</figure>}
  <SaveMetaFields value={meta} onChange={setMeta} intents={intents} autoFocus={!!image&&!capture.text.trim()}/>
  {reading&&<div className="rf-field"><label className="rf-label" htmlFor="share-title">Title</label><div className="rf-title"><textarea id="share-title" rows={3} value={title} maxLength={250} onChange={e=>{touched.current.title=true;setEdited(true);setTitle(e.target.value);}} placeholder="Name it so you’ll recognise it later"/>{title&&<button type="button" aria-label="Clear title" onClick={()=>{touched.current.title=true;setEdited(true);setTitle('');document.getElementById('share-title')?.focus();}}><X size={16}/></button>}</div><small className="share-lookup">{lookup==='loading'?'Getting the post’s text and title…':lookup==='failed'?'Couldn’t reach the link. Write your own title.':edited?'Your title.':'Filled in from the post. Tap to write your own.'}</small></div>}
  {reading&&<CategoryPicker value={category} onChange={pick} categories={categories} suggested={suggested}/>}
  {reading&&<AsapToggle checked={asap} onChange={setAsap} due={dayLabel(weekDeadline(timezone))}/>}
  <details className="rf-details" open={!reading&&!image}><summary>{reading?'Post text and link':image?'Add a link or note':'Shared text or link'}</summary><textarea aria-label="Shared text or link" rows={6} maxLength={10000} value={text} onChange={e=>{touched.current.text=true;setText(e.target.value);}}/></details>
  <div className="incoming-actions">{reading&&<button className="primary full" onClick={()=>onRead(text,title,space,{category,asap},saveMeta())}><BookOpen size={17}/>{asap?'Save · read ASAP':'Save to read'}</button>}<button className={reading?"secondary full":"primary full"} disabled={!text.trim()&&!image&&!meta.why.trim()} onClick={()=>onSave(text,space,saveMeta())}><Inbox size={17}/>Save</button></div>
  <button className="text-button" onClick={()=>{if(confirm('Discard this shared draft?'))onDiscard();}}>Discard draft</button>
 </div></ModalFrame>;
}
