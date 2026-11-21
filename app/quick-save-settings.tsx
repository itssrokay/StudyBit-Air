'use client';
import {useEffect,useState} from 'react';
import {Bookmark,Image as ImageIcon,SquareStack,ChevronDown} from 'lucide-react';
import {nativeBridge} from '../lib/local-store';

/** Profile → Quick save: how to save from anywhere on a Galaxy (Side key, Quick Settings tile, Share), and screenshot access. */
export default function QuickSaveSettings(){
 const bridge=nativeBridge();
 const read=()=>{try{return bridge?.screenshotAccess?.()||'';}catch{return '';}};
 const [access,setAccess]=useState(read);
 useEffect(()=>{const update=()=>setAccess(read());window.addEventListener('learning-native-screenshot-access',update);window.addEventListener('learning-native-ready',update);return()=>{window.removeEventListener('learning-native-screenshot-access',update);window.removeEventListener('learning-native-ready',update);};// eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 if(!bridge?.screenshotAccess)return null;
 return <details className="quick-save-card" open={access!=='all'}>
  <summary><span className="quick-save-icon"><Bookmark size={20} aria-hidden="true"/></span><span><strong>Quick save</strong><small>Save a link or screenshot from anywhere in two taps</small></span><ChevronDown size={18} aria-hidden="true"/></summary>
  <ol className="quick-save-steps">
   <li><strong>Side key.</strong> Settings → Advanced features → Side button → Double press → Open app → <b>Quick save</b>.</li>
   <li><strong>Quick Settings tile.</strong> Pull down twice → ⋮ → Edit → drag <b>Quick save</b> into your tiles.</li>
   <li><strong>Use it.</strong> Copy a link or take a screenshot, then double-press the Side key. The link you copied in the last 15 minutes and your screenshot from the last 10 minutes are attached. Add why you’re saving it, and you’re done.</li>
   <li><strong>Share.</strong> From YouTube, Chrome, Gallery or the screenshot toolbar: Share → Learning Space.</li>
  </ol>
  <div className="quick-save-access">
   <ImageIcon size={18} aria-hidden="true"/>
   <p>{access==='all'?'Your latest screenshot is attached automatically.':access==='partial'?'You allowed only some photos, so new screenshots can’t be attached. Allow all photos to attach them automatically.':'Allow photo access so Quick save can attach the screenshot you just took. Images stay on this phone unless you ask AI to read one.'}</p>
   {access!=='all'&&<button className="secondary" onClick={()=>{try{access==='partial'?bridge.openAppSettings?.():bridge.requestScreenshotAccess?.();}catch{/* older app */}}}>{access==='partial'?'Open app settings':'Allow screenshots'}</button>}
  </div>
  <p className="quick-save-note"><SquareStack size={15} aria-hidden="true"/>Shared screenshots work without photo access.</p>
 </details>;
}
