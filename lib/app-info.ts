import {nativeBridge} from './local-store';
declare const __APP_VERSION__:string|undefined;
/** The installed app's version: from Android when available, else the version this build was made from. */
export function appVersion():string{
 try{const v=nativeBridge()?.appVersion?.();if(v)return v;}catch{/* older app */}
 return typeof __APP_VERSION__!=='undefined'?__APP_VERSION__:'';
}
/** Android "Font size" scales every text size. Mark large settings so layouts can reflow (DESIGN.md §4). */
export function applyTextScale(){
 if(typeof document==='undefined')return 1;
 let scale=1;
 try{const s=nativeBridge()?.textScale?.();if(typeof s==='number'&&s>0)scale=s;}catch{/* older app */}
 if(scale===1){const probe=document.createElement('span');probe.style.cssText='position:absolute;visibility:hidden;font-size:16px';probe.textContent='x';document.body.appendChild(probe);scale=parseFloat(getComputedStyle(probe).fontSize)/16||1;probe.remove();}
 const root=document.documentElement;
 if(scale>=1.6)root.dataset.textScale='xl';else if(scale>=1.2)root.dataset.textScale='l';else delete root.dataset.textScale;
 return scale;
}
