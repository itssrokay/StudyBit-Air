'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {BookOpen,Check,Clapperboard,Code2,Loader2} from 'lucide-react';
import {uid,type LearningState} from '../lib/learning';
import {logExtra} from '../lib/capture';
import {validateQuickLog,type QuickLogErrors} from '../lib/quick-log';
import type {Workspace} from '../lib/spaces';
import ModalFrame from './modal';
export default function QuickLog({workspace,onSave,onClose,notify}:{workspace:Workspace;onSave:(fn:(s:LearningState)=>LearningState)=>Promise<boolean>;onClose:()=>void;notify:(s:string)=>void}){
 const [title,setTitle]=useState(''),[url,setUrl]=useState(''),[minutes,setMinutes]=useState('10'),[kind,setKind]=useState<'article'|'video'|'topic'>('article'),[reflection,setReflection]=useState(''),[keep,setKeep]=useState(false);
 const [errors,setErrors]=useState<QuickLogErrors>({}),[saveError,setSaveError]=useState(''),[busy,setBusy]=useState(false),[retrying,setRetrying]=useState(false);
 const form=useRef<HTMLFormElement>(null),identity=useRef<{id:string;at:Date|null}>({id:uid(),at:null}),saving=useRef(false),saved=useRef(false),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 function clear(field:keyof QuickLogErrors){setErrors(previous=>({...previous,[field]:undefined}));setSaveError('');}
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(saving.current||saved.current)return;
  const checked=validateQuickLog({title,url,minutes});setErrors(checked.errors);setSaveError('');
  if(!checked.valid){const field=(['title','minutes','url'] as const).find(key=>checked.errors[key]);const element=form.current?.elements.namedItem(field!) as HTMLInputElement|null;element?.focus();element?.scrollIntoView({block:'center',behavior:'smooth'});return;}
  saving.current=true;setBusy(true);identity.current.at??=new Date();
  try{
   const accepted=await onSave(s=>logExtra(s,{...checked.value,kind,reflection,workspace,keep},identity.current.at!,identity.current.id));
   if(!mounted.current)return;
   if(!accepted){setRetrying(true);setSaveError('Storage has not confirmed this log yet. Your entries are kept here. Retry saving the same log; it will not be added twice.');return;}
   saved.current=true;notify('Learning saved. Your progress, streak, and share card are updated.');onClose();
  }catch(e){if(mounted.current)setSaveError((e as Error).message||'Could not save. Your entries are still here.');}
  finally{saving.current=false;if(mounted.current)setBusy(false);}
 }
 return <ModalFrame title="That counts as learning, too." subtitle={'Log something outside your plan · '+(workspace==='work'?'Work':'Personal')} onClose={onClose} busy={busy}>
  <form ref={form} noValidate className="modal-content quick-log-form" onSubmit={submit} aria-busy={busy}>
   <fieldset disabled={busy||retrying} className="quick-log-fields">
    <div className="log-kind-picker" role="group" aria-label="What did you learn?">{([{id:'article',label:'Read',Icon:BookOpen},{id:'video',label:'Watched',Icon:Clapperboard},{id:'topic',label:'Practised',Icon:Code2}] as const).map(k=><button key={k.id} type="button" className={kind===k.id?'selected':''} aria-pressed={kind===k.id} onClick={()=>setKind(k.id)}><k.Icon size={21}/>{k.label}</button>)}</div>
    <label htmlFor="quick-log-title">What did you learn?</label><input id="quick-log-title" name="title" required maxLength={250} value={title} onChange={e=>{setTitle(e.target.value);clear('title');}} aria-invalid={!!errors.title} aria-describedby={errors.title?'quick-log-title-error':undefined} placeholder={kind==='topic'?'Practised binary search':kind==='video'?'Watched a lesson on database indexes':'Read an article about database indexes'}/>{errors.title&&<p id="quick-log-title-error" className="field-error" role="alert">{errors.title}</p>}
    <div className="form-grid"><div><label htmlFor="quick-log-minutes">Minutes spent</label><input id="quick-log-minutes" name="minutes" required type="number" inputMode="numeric" min={1} max={600} step={1} value={minutes} onChange={e=>{setMinutes(e.target.value);clear('minutes');}} aria-invalid={!!errors.minutes} aria-describedby={errors.minutes?'quick-log-minutes-error':undefined}/>{errors.minutes&&<p id="quick-log-minutes-error" className="field-error" role="alert">{errors.minutes}</p>}</div><div><label htmlFor="quick-log-url">Source link <small>optional</small></label><input id="quick-log-url" name="url" type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={url} onChange={e=>{setUrl(e.target.value);clear('url');}} maxLength={2000} aria-invalid={!!errors.url} aria-describedby={errors.url?'quick-log-url-help quick-log-url-error':'quick-log-url-help'} placeholder="leetcode.com"/>{errors.url&&<p id="quick-log-url-error" className="field-error" role="alert">{errors.url}</p>}</div></div>
    <p id="quick-log-url-help" className="field-hint">Links such as www.leetcode.com work. We add https:// for you.</p>
    <label htmlFor="quick-log-reflection">One thing that clicked <small>optional · stays out of social shares</small></label><textarea id="quick-log-reflection" maxLength={1000} rows={3} value={reflection} onChange={e=>setReflection(e.target.value)} placeholder="What clicked, or what you still need to practise…"/>
    <label className="inline-check"><input type="checkbox" checked={keep} onChange={e=>setKeep(e.target.checked)}/>Keep this in my active library</label>
   </fieldset>
   <p className="habit-rule">Your time counts toward this space’s progress and rewards. You can edit the item or remove its recorded time from Progress. Without keeping it active, it lives in Archived.</p>
   {saveError&&<p className="form-error quick-log-save-error" role="alert">{saveError}</p>}
   <div className="modal-actions"><button className="primary" type="submit" disabled={busy}>{busy?<Loader2 className="spin" size={17}/>:<Check size={17}/>} {busy?'Saving your learning…':retrying?'Retry saving this log':'Log my learning'}</button></div>
  </form>
 </ModalFrame>;
}
