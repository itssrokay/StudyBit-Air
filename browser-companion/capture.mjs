// Self-contained: Chrome serializes this function into the current tab.
// It only reads rendered DOM metadata; it never requests cookies, APIs or video bytes.
export function capturePage() {
 const clean=s=>(s||'').replace(/\s+/g,' ').trim();
 const page=new URL(location.href);page.hash='';const source=page.href;
 const host=page.hostname.replace(/^www\./,'');
 const heading=clean(document.querySelector('h1')?.textContent)||clean(document.title);
 const rows=[];const seen=new Set();
 const duration=text=>{const m=text.match(/(?:^|\s)(?:(\d{1,2}):)?(\d{1,3}):(\d{2})(?=\s|$)/);if(!m)return 15;return Math.min(600,Math.max(1,Math.ceil((Number(m[1]||0)*3600+Number(m[2])*60+Number(m[3]))/60)));};
 const urlFor=el=>{const link=el.matches?.('a[href]')?el:el.querySelector?.('a[href]');try{const u=new URL(link?.getAttribute('href')||'',source);return link&&['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}};
 const add=(title,url,modulePath,format='video',text='',sourceId='')=>{title=clean(title).slice(0,250);if(!title)return;const key=sourceId||(url&&url!==source?url:source+'::'+title);if(seen.has(key)||rows.length>=500)return;seen.add(key);rows.push({title,url,modulePath:clean(modulePath).slice(0,200),minutes:duration(text),format,done:false,sourceId:key,durationEstimated:!text.match(/(?:^|\s)(?:\d{1,2}:)?\d{1,3}:\d{2}(?=\s|$)/)});};
 let title=heading,provider=host,folderPath='',captureNote='Captured from the loaded page. Collapsed folders, pagination, and unloaded lessons may be missing. Review before importing.';
 if(host==='boot.dev'){
  provider='Boot.dev';folderPath='DevOps';
  title=clean(document.title.split(':')[0]).replace(/\s*\|\s*Boot\.dev.*$/i,'')||heading;
  if(page.pathname.startsWith('/courses/')){
   title=heading;
   const chapterHeading=[...document.querySelectorAll('h2,h3')].find(e=>clean(e.textContent)==='Chapter List');
   const chapters=chapterHeading?.nextElementSibling;
   if(chapters)for(const row of chapters.children){const name=clean(row.querySelector('.text-xl')?.textContent);if(name)add(name+' (chapter)',source,name,'exercise','',source+'::chapter:'+name);}
   captureNote='Chapter-level outline only. Boot.dev’s detailed lesson list is not loaded on this course page. These are chapter study tasks, not a claim that every exercise has been imported. Open individual lessons to capture their direct links.';
  }else if(page.pathname.startsWith('/lessons/')){
   const chapter=[...document.querySelectorAll('button')].map(e=>clean(e.textContent)).find(s=>/^CH\d+:/.test(s))?.replace(/^CH\d+:\s*/,'')||'';
   add(heading,source,chapter,'exercise','',source);
   captureNote='One Boot.dev lesson captured. Recent-lessons history and Back/Next navigation are excluded. Open the course page for chapters, or capture further lesson pages and merge them.';
  }
 }else if(host==='100xdevs.com'){
  provider='100xDevs';folderPath='Learning';
  const breadcrumb=document.querySelector('nav[aria-label="Course content breadcrumb"]');
  const module=clean(breadcrumb?.textContent).replace(/^Course content\s*/i,'');
  for(const card of document.querySelectorAll('main [role="button"], main button')){
   const h=card.querySelector('h3');if(!h)continue;
   const name=clean(h.textContent),text=[...card.querySelectorAll('span')].map(s=>clean(s.textContent)).find(s=>/^\d{1,3}:\d{2}(?::\d{2})?$/.test(s))||clean(card.innerText);const direct=urlFor(card);
   add(name,direct,module,/assignments?/i.test(name)?'exercise':'video',text,source+'::'+name);
  }
  captureNote='Loaded 100xDevs outline captured. Cards without an exposed link open the source folder in Learning Space; no lesson URL is guessed. Paid videos remain on 100xDevs. Open other folders and capture them to build a larger course.';
 }else if(host==='youtube.com'||host==='m.youtube.com'||host==='youtu.be'){
  provider='YouTube';
  title=clean(document.querySelector('h1 yt-formatted-string')?.textContent)||heading.replace(/\s*-\s*YouTube$/,'');
  const playlist=document.querySelector('ytd-playlist-panel-renderer');
  if(playlist)for(const a of playlist.querySelectorAll('a[href*="watch?"]')){const name=clean(a.querySelector('#video-title')?.textContent)||clean(a.getAttribute('title'));add(name,urlFor(a),'Playlist','video',clean(a.textContent));}
  if(!rows.length)add(title,source,'','video');
  captureNote='Loaded playlist entries or the current video only. Recommended videos are excluded. Unknown durations default to 15 minutes; edit them in the preview.';
 }else{
  const root=document.querySelector('main')||document.querySelector('article')||document.body;
  for(const a of root.querySelectorAll('a[href]')){
   const u=urlFor(a),name=clean(a.textContent);if(!u||!name||a.closest('nav,footer,header')||/^(next|previous|back|login|sign in|sign up)$/i.test(name))continue;
   if(!/lesson|lecture|video|watch|chapter|tutorial|\/content\//i.test(u))continue;
   const module=clean(a.closest('section')?.querySelector('h2,h3')?.textContent);
   add(name,u,module,'video',clean(a.parentElement?.textContent));
  }
  if(!rows.length)add(title,source,'','reading');
 }
 if(!rows.length)throw new Error('No course outline is loaded. Open a lesson or an expanded course folder and try again.');
 return {title,provider,kind:rows.length===1&&rows[0].format==='reading'?'article':'course',url:source,folderPath,captureScope:'page',captureNote,lessons:rows,capturedAt:new Date().toISOString()};
}
export function mergeCaptures(draft,capture){
 const key=l=>l.sourceId||(l.url&&l.url!==draft.url?l.url:l.title.toLowerCase().trim());
 const seen=new Set(draft.lessons.map(key));const lessons=[...draft.lessons];
 for(const l of capture.lessons){if(!seen.has(key(l))){seen.add(key(l));lessons.push(l);}}
 if(lessons.length>500)throw new Error('A course can contain up to 500 captured items. Export this draft and start another.');
 return {...draft,lessons,captureNote:'Merged page captures. This is the combined loaded outline, not a guarantee of a complete course. Review grouping, ordering, links, and estimated durations.'};
}
