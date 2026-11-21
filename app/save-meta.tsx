'use client';
import {Bell} from 'lucide-react';
import {REMIND_LABELS,remindDay,type RemindChoice} from '../lib/saves';
export type SaveMetaValue={why:string;intent:string;remind:RemindChoice|''};
export const emptyMeta:SaveMetaValue={why:'',intent:'',remind:''};
export const metaToSave=(m:SaveMetaValue,timezone:string)=>({why:m.why.trim(),intent:m.intent,remindOn:m.remind?remindDay(m.remind,timezone):''});

/** "Why are you saving this?": one optional line, one-tap intents, and when to bring it back. Nothing here is required. */
export function SaveMetaFields({value,onChange,intents,autoFocus=false}:{value:SaveMetaValue;onChange:(v:SaveMetaValue)=>void;intents:string[];autoFocus?:boolean}){
 return <div className="save-meta">
  <label className="save-why"><span>Why are you saving this?</span><input value={value.why} maxLength={300} autoFocus={autoFocus} placeholder="Optional: what you want to do with it" onChange={e=>onChange({...value,why:e.target.value})}/></label>
  <div className="save-chips" role="group" aria-label="Saving it for">
   {intents.slice(0,8).map(t=><button type="button" key={t} aria-pressed={value.intent===t} className={value.intent===t?'on':''} onClick={()=>onChange({...value,intent:value.intent===t?'':t})}>{t}</button>)}
  </div>
  <div className="save-remind" role="group" aria-label="Remind me"><Bell size={16} aria-hidden="true"/>
   {(Object.keys(REMIND_LABELS) as RemindChoice[]).map(k=><button type="button" key={k} aria-pressed={value.remind===k} className={value.remind===k?'on':''} onClick={()=>onChange({...value,remind:value.remind===k?'':k})}>{REMIND_LABELS[k]}</button>)}
  </div>
 </div>;
}
