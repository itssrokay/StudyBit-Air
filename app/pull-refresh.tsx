'use client';
import {useEffect,useRef,useState} from 'react';
import {RefreshCw} from 'lucide-react';

/**
 * Pull down from the top of a page to refresh: reloads the library, phone
 * usage, shared captures and Wi-Fi sync. Ignores sideways swipes (the hero
 * pager) and does nothing while a sheet is open.
 */
export function usePullRefresh(onRefresh:()=>Promise<unknown>,enabled=true){
 const [pull,setPull]=useState(0),[busy,setBusy]=useState(false);
 const start=useRef<{x:number;y:number}|null>(null),live=useRef(0),cb=useRef(onRefresh);
 useEffect(()=>{cb.current=onRefresh;},[onRefresh]);
 useEffect(()=>{
  if(!enabled)return;
  const down=(e:TouchEvent)=>{if(busy||window.scrollY>2||document.querySelector('[role=dialog]')||e.touches.length!==1){start.current=null;return;}start.current={x:e.touches[0].clientX,y:e.touches[0].clientY};};
  const move=(e:TouchEvent)=>{const s=start.current;if(!s)return;const dx=e.touches[0].clientX-s.x,dy=e.touches[0].clientY-s.y;if(Math.abs(dx)>Math.abs(dy)&&live.current===0){start.current=null;return;}if(dy<=0||window.scrollY>2){live.current=0;setPull(0);return;}live.current=Math.min(120,dy*0.5);setPull(live.current);};
  const up=async()=>{const d=live.current;start.current=null;live.current=0;if(d<64){setPull(0);return;}setBusy(true);setPull(64);try{await cb.current();}finally{setBusy(false);setPull(0);}};
  window.addEventListener('touchstart',down,{passive:true});window.addEventListener('touchmove',move,{passive:true});window.addEventListener('touchend',up);window.addEventListener('touchcancel',up);
  return()=>{window.removeEventListener('touchstart',down);window.removeEventListener('touchmove',move);window.removeEventListener('touchend',up);window.removeEventListener('touchcancel',up);};
 },[enabled,busy]);
 return {pull,busy};
}

export function PullIndicator({pull,busy}:{pull:number;busy:boolean}){
 if(!pull&&!busy)return null;
 const ready=pull>=64;
 return <div className={'pr-indicator'+(busy?' busy':ready?' ready':'')} style={{transform:`translate(-50%,${Math.min(pull,90)-48}px)`,opacity:Math.min(1,pull/40)}} role="status" aria-label={busy?'Refreshing':ready?'Release to refresh':'Pull to refresh'}>
  <RefreshCw size={20} style={busy?undefined:{transform:`rotate(${pull*3}deg)`}}/>
 </div>;
}
