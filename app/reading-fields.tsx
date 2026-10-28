'use client';
import {useState} from 'react';
import {Plus,Zap,Check,X} from 'lucide-react';

/** Single-choice category chips with an inline "New" option. Empty value = no category. */
export function CategoryPicker({value,onChange,categories,suggested=''}:{value:string;onChange:(v:string)=>void;categories:string[];suggested?:string}){
 const [adding,setAdding]=useState(false),[draft,setDraft]=useState('');
 const list=value&&!categories.includes(value)?[value,...categories]:categories;
 function add(){const v=draft.trim().replace(/\//g,' ').slice(0,40);if(v){onChange(v);}setAdding(false);setDraft('');}
 return <div className="rf-field"><span className="rf-label">Category{suggested&&value===suggested&&<small>Suggested</small>}</span>
  <div className="rf-chips" role="group" aria-label="Category">
   {list.map(c=><button type="button" key={c} aria-pressed={value===c} onClick={()=>onChange(value===c?'':c)}>{value===c&&<Check size={14}/>}{c}</button>)}
   {adding?<span className="rf-new"><input autoFocus value={draft} maxLength={40} placeholder="New category" onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();add();}if(e.key==='Escape')setAdding(false);}}/><button type="button" aria-label="Add category" onClick={add}><Check size={15}/></button><button type="button" aria-label="Cancel" onClick={()=>setAdding(false)}><X size={15}/></button></span>
   :<button type="button" className="rf-add" onClick={()=>setAdding(true)}><Plus size={14}/>New</button>}
  </div>
 </div>;
}

export function AsapToggle({checked,onChange,due}:{checked:boolean;onChange:(v:boolean)=>void;due?:string}){
 return <label className={'rf-asap'+(checked?' on':'')}><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/><span className="rf-asap-icon"><Zap size={17} fill={checked?'currentColor':'none'}/></span><span><strong>Read ASAP</strong><small>{due?`Must read by ${due}`:'Must read by the end of this week'}</small></span><i aria-hidden="true"/></label>;
}
