'use client';
import {useRef,useState,type ComponentType} from 'react';
import {BookOpen,Target,Flag,Check,ListChecks} from 'lucide-react';
import {tile,type TileData,type TileId} from './health-ui';

/**
 * Google Health style hero: a thick progress ring with curved labels and a
 * marker badge at the end of the arc, three pill tiles on the right, and
 * swipeable pages with dots underneath.
 */
type IconType=ComponentType<{size?:number;x?:number;y?:number;width?:number;height?:number;strokeWidth?:number;className?:string}>;
export type HeroPill={id:string;icon:IconType;label:string;value:string;unit?:string;tone:string;empty?:boolean;onClick?:()=>void};
export type HeroPage={id:string;title:string;value:number;goal:number;bottom:string;icon:IconType;onRing?:()=>void;pills:HeroPill[]};

const R=78,C=100;
function Ring({page,index}:{page:HeroPage;index:number}){
 const pct=Math.max(0,Math.round(page.value/Math.max(1,page.goal)*100)),shown=Math.min(100,pct),done=pct>=100;
 const angle=(90+shown*3.6)*Math.PI/180,bx=C+R*Math.cos(angle),by=C+R*Math.sin(angle),Icon=done?Check:page.icon;
 const top=`hp-top-${page.id}`,bottom=`hp-bottom-${page.id}`;
 return <button className={'hp-ring'+(done?' done':'')} onClick={page.onRing} aria-label={`${page.title}: ${pct}%, ${page.bottom}`} style={{animationDelay:index*40+'ms'}}>
  <svg viewBox="0 0 200 200" aria-hidden="true">
   <defs><path id={top} d="M 56 100 A 44 44 0 0 1 144 100"/><path id={bottom} d="M 44 100 A 56 56 0 0 0 156 100"/></defs>
   <circle className="hp-base" cx={C} cy={C} r={R}/>
   {shown>0&&<circle className="hp-fill" cx={C} cy={C} r={R} pathLength={100} strokeDasharray={`${shown} 100`} transform={`rotate(90 ${C} ${C})`}/>}
   <text className="hp-curve"><textPath href={'#'+top} startOffset="50%" textAnchor="middle">{page.title}</textPath></text>
   <text className="hp-pct" x={C} y={C+15} textAnchor="middle">{pct}<tspan dx="2">%</tspan></text>
   <text className="hp-curve hp-curve-low"><textPath href={'#'+bottom} startOffset="50%" textAnchor="middle">{page.bottom}</textPath></text>
   <g className="hp-badge"><circle cx={bx} cy={by} r={21}/><circle className="hp-badge-in" cx={bx} cy={by} r={16}/><Icon x={bx-9} y={by-9} width={18} height={18} strokeWidth={2.4}/></g>
  </svg>
 </button>;
}

export function HeroPager({pages,actions}:{pages:HeroPage[];actions:React.ReactNode}){
 const scroller=useRef<HTMLDivElement>(null),[active,setActive]=useState(0);
 const go=(i:number)=>{const el=scroller.current;if(el)el.scrollTo({left:i*el.clientWidth,behavior:'smooth'});};
 return <section className="hp" aria-label="Your numbers">
  <div className="hp-pager" ref={scroller} onScroll={e=>{const el=e.currentTarget,i=Math.round(el.scrollLeft/Math.max(1,el.clientWidth));if(i!==active)setActive(i);}}>
   {pages.map((p,i)=><div key={p.id} className="hp-page" aria-roledescription="page" aria-label={`${i+1} of ${pages.length}: ${p.title}`}>
    <Ring page={p} index={i}/>
    <div className="hp-pills">{p.pills.map((t,j)=>{const Icon=t.icon;return <button key={t.id} className={'hp-pill tone-'+t.tone+(t.empty?' is-empty':'')} onClick={t.onClick} style={{animationDelay:80+j*60+'ms'}}>
     <span className="hp-pill-icon"><Icon size={22}/></span><span className="hp-pill-copy"><span>{t.label}</span><strong className={t.value.length>9?'long':undefined}>{t.value}{t.unit&&<small> {t.unit}</small>}</strong></span>
    </button>;})}</div>
   </div>)}
  </div>
  {pages.length>1&&<div className="hp-dots" role="tablist" aria-label="Pages">{pages.map((p,i)=><button key={p.id} role="tab" aria-selected={i===active} aria-label={p.title} onClick={()=>go(i)}/>)}</div>}
  <div className="hp-actions">{actions}</div>
 </section>;
}

/** Turn a stat tile into a pill. */
export function tilePill(id:TileId,data:TileData,onClick:()=>void):HeroPill{
 const t=tile(id,data);return {id,icon:t.icon as IconType,label:t.label,value:t.value==='—'?'No data':t.value,unit:t.value==='—'?'':t.unit,tone:t.value==='—'?'grey':t.tone,empty:t.value==='—',onClick};
}
export const HERO_ICONS={week:BookOpen,today:Target,plan:Flag,targets:ListChecks};
