// Self-contained: Chrome serializes this function into the current tab.
// It only reads rendered DOM metadata; it never requests cookies, APIs or video bytes.
export function capturePage() {
 const clean=s=>(s||'').replace(/\s+/g,' ').trim();
 const page=new URL(location.href);page.hash='';const source=page.href;
 const host=page.hostname.replace(/^www\./,'');
 const heading=clean(document.querySelector('h1')?.textContent)||clean(document.title);
 const rows=[];const seen=new Set();
 const duration=text=>{const m=text.match(/(?:^|\s)(?:(\d{1,2}):)?(\d{1,3}):(\d{2})(?=\s|$)/);if(!m)return 15;return Math.min(600,Math.max(1,Math.ceil((Number(m[1]||0)*3600+Number(m[2])*60+Number(m[3]))/60)));};
 const urlFor=el=>{const link=el.matches?.('a[href]')?el:el.querySelector?.('a[href]');const raw=link?.getAttribute('href')?.trim();if(!raw||raw.startsWith('#'))return '';try{const u=new URL(raw,source);u.hash='';return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}};
 const add=(title,url,modulePath,format='video',text='',sourceId='')=>{title=clean(title).slice(0,250);if(!title)return;const key=sourceId.includes('::chapter:')?sourceId:(url||sourceId||source+'::'+title);if(seen.has(key)||rows.length>=500)return;seen.add(key);rows.push({title,url,modulePath:clean(modulePath).slice(0,200),minutes:duration(text),format,done:false,sourceId:key,durationEstimated:!text.match(/(?:^|\s)(?:\d{1,2}:)?\d{1,3}:\d{2}(?=\s|$)/)});};
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
  title=clean(document.querySelector('ytd-playlist-panel-renderer #title, ytd-playlist-header-renderer h1, .page-header-view-model-wiz__page-header-title')?.textContent)||heading.replace(/\s*-\s*YouTube$/,'');
  const roots=[...document.querySelectorAll('ytd-playlist-video-list-renderer,ytd-playlist-panel-renderer')];
  for(const root of roots)for(const row of root.querySelectorAll('ytd-playlist-video-renderer,ytd-playlist-panel-video-renderer,yt-lockup-view-model')){
   const a=row.querySelector('a[href*="watch?"]');if(!a)continue;const u=new URL(a.href,source),id=u.searchParams.get('v');if(!id||!/^[A-Za-z0-9_-]{11}$/.test(id))continue;
   const name=clean(row.querySelector('#video-title,.yt-lockup-metadata-view-model__title,h3')?.textContent)||clean(a.title);if(!name||/^\[?(?:private|deleted) video\]?$/i.test(name))continue;
   const time=[...row.querySelectorAll('ytd-thumbnail-overlay-time-status-renderer,.yt-badge-shape__text')].map(e=>clean(e.textContent)).find(t=>/^\d+(?::\d{2}){1,2}$/.test(t))||'';
   add(name,'https://www.youtube.com/watch?v='+id,'','video',time,'youtube:'+id);const item=rows.at(-1);if(item&&item.url==='https://www.youtube.com/watch?v='+id){item.sourceId='youtube:'+id;item.thumbnailUrl='https://i.ytimg.com/vi/'+id+'/hqdefault.jpg';item.durationSeconds=time?time.split(':').reduce((n,x)=>n*60+Number(x),0):0;}
  }
  if(!rows.length&&!page.searchParams.get('list')){const id=page.searchParams.get('v')||page.pathname.split('/')[1];if(id&&/^[A-Za-z0-9_-]{11}$/.test(id)){add(title,'https://www.youtube.com/watch?v='+id,'','video','','youtube:'+id);rows[0].thumbnailUrl='https://i.ytimg.com/vi/'+id+'/hqdefault.jpg';}}
  captureNote='Loaded YouTube playlist entries only, with thumbnails. Scroll the playlist to load more entries, capture again, and merge if needed. For automatic full playlist import, paste its link in Learning Space and choose Get details. Recommendations are excluded; unknown durations are estimates.';
 }else{
  const parts=page.pathname.split('/').filter(Boolean);
  const coursePrefix=parts[0]==='learn'&&parts[1]?'/learn/'+parts[1]+'/':parts[0]==='courses'&&parts[1]?'/courses/'+parts[1]+'/':'';
  const roots=[...document.querySelectorAll('main,aside,[role="navigation"],nav,[role="tree"],article')];if(!roots.length)roots.push(document.body);
  if(coursePrefix){const courseLink=[...document.querySelectorAll('a[href]')].find(a=>new URL(a.href,source).pathname.endsWith('/'+parts[1])&&!new URL(a.href,source).pathname.startsWith('/learn/'));title=clean(courseLink?.textContent)||parts[1].replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());}
  for(const root of roots)for(const a of root.querySelectorAll('a[href]')){
   const u=urlFor(a);if(!u)continue;const candidate=new URL(u);
   let name=clean(a.querySelector('[title]')?.getAttribute('title'))||clean(a.getAttribute('title'))||clean(a.textContent);
   if(!name||/^(next|previous|back|login|sign in|sign up|buy now)$/i.test(name))continue;
   if(coursePrefix){if(candidate.origin!==page.origin||!candidate.pathname.startsWith(coursePrefix))continue;}else{if(a.closest('header,footer')||!/lesson|lecture|video|watch|chapter|tutorial|\/content\/|\/learn\//i.test(u))continue;}
   const container=a.closest('.chapters-container,[data-chapter],[data-module],details,[role="treeitem"],section');
   let module=clean(container?.querySelector('.chapter-name,[data-module-title],summary,h2,h3,h4')?.textContent)||candidate.pathname.split('/').filter(Boolean).slice(2,-1).join('/').replace(/-/g,' ');
   const slug=candidate.pathname.split('/').filter(Boolean)[2]||'';const normal=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');const chapter=host==='interviewready.io'?(a.closest('.product-content-container')?.parentElement?.previousElementSibling?.querySelector('.chapter-container')||[...document.querySelectorAll('.chapter-container')].find(c=>normal(clean(c.querySelector('.chapter-name')?.textContent))===normal(slug))):null;if(chapter)module=clean(chapter.querySelector('.chapter-name')?.textContent);
   add(name,u,module,/quiz|assignment|exercise/i.test(name)?'exercise':/\bpdf\b|\.pdf(?:[?#]|$)|-pdf(?:-|$)/i.test(name+' '+u)?'reading':'video',clean(a.innerText),u+'::'+name);
   const row=rows.find(l=>l.url===u);if(chapter&&row?.durationEstimated){const info=[...chapter.querySelectorAll('.chapter-info-container span')].map(s=>clean(s.textContent));const count=info.map(s=>s.match(/^\d+\s*\/\s*(\d+)$/)).find(Boolean),time=info.map(s=>s.match(/^(?:(\d+)h\s*)?(\d+)m$/)).find(Boolean);if(count&&time&&Number(count[1])>0){row.minutes=Math.max(1,Math.ceil((Number(time[1]||0)*60+Number(time[2]))/Number(count[1])));row.durationSource='chapter-average';}}
  }
  for(const script of document.querySelectorAll('script[type="application/ld+json"]')){try{const data=JSON.parse(script.textContent);const visit=(v,depth=0)=>{if(depth>8||!v||typeof v!=='object')return;if(Array.isArray(v)){v.forEach(x=>visit(x,depth+1));return;}if(v.name&&v.url&&['LearningResource','VideoObject','HowToStep'].includes(v['@type'])){const u=new URL(v.url,source);if(['https:','http:'].includes(u.protocol)&&(!coursePrefix||u.pathname.startsWith(coursePrefix)))add(v.name,u.href,'','video','',u.href+'::'+v.name);}for(const [key,value] of Object.entries(v))if(['itemListElement','hasPart','syllabusSections','item','@graph'].includes(key))visit(value,depth+1);};visit(data);}catch{}}
  if(host==='interviewready.io'){provider='InterviewReady';folderPath='AI';captureNote='InterviewReady course outline discovered across the sidebar. Use Scan chapters to expand remaining chapter disclosures and collect their lesson links. Unknown durations are estimates; protected playback stays on InterviewReady.';}
  if(!rows.length){add(heading,source,'',coursePrefix?'video':'reading');captureNote=coursePrefix?'Only the current lesson was found. Open the course outline and use Scan chapters. This capture is partial; no unseen lessons were invented.':'Current page only. No course outline was found; choose a course sidebar or paste a syllabus.';}
 }

 if(!rows.length)throw new Error('No course outline is loaded. Open a lesson or an expanded course folder and try again.');
 const moduleOrder=[...new Set([...document.querySelectorAll('.chapter-name,[data-module-title]')].map(e=>clean(e.textContent)).filter(Boolean))];
 return {title,provider,thumbnailUrl:rows.find(l=>l.thumbnailUrl)?.thumbnailUrl||'',kind:rows.length===1&&rows[0].format==='reading'?'article':'course',url:source,folderPath,captureScope:'page',captureNote,lessons:rows,capturedAt:new Date().toISOString(),discovery:{items:rows.length,modules:[...new Set(rows.map(r=>r.modulePath).filter(Boolean))],moduleOrder,unknownDurations:rows.filter(r=>r.durationEstimated).length,partial:true}};
}
export function mergeCaptures(draft,capture){
 const key=l=>l.sourceId?.includes('::chapter:')?l.sourceId:(l.url||l.sourceId||l.title.toLowerCase().trim());
 const seen=new Set(draft.lessons.map(key));const lessons=draft.lessons.map(l=>({...l}));
 for(const l of capture.lessons){if(!seen.has(key(l))){seen.add(key(l));lessons.push(l);}else{const old=lessons.find(item=>key(item)===key(l));if(old&&!old.modulePath&&l.modulePath)old.modulePath=l.modulePath;if(old?.durationEstimated&&l.durationSource==='chapter-average'){old.minutes=l.minutes;old.durationSource=l.durationSource;}}}
 if(lessons.length>500)throw new Error('A course can contain up to 500 captured items. Export this draft and start another.');
 const moduleOrder=[...new Set([...(draft.discovery?.moduleOrder||[]),...(capture.discovery?.moduleOrder||[])])];
 if(moduleOrder.length)lessons.sort((a,b)=>{const ai=moduleOrder.indexOf(a.modulePath),bi=moduleOrder.indexOf(b.modulePath);return (ai<0?moduleOrder.length:ai)-(bi<0?moduleOrder.length:bi);});
 return {...draft,kind:lessons.length>1?'course':draft.kind,lessons,discovery:{...draft.discovery,items:lessons.length,modules:[...new Set(lessons.map(l=>l.modulePath).filter(Boolean))],moduleOrder,unknownDurations:lessons.filter(l=>l.durationEstimated).length,partial:true},captureNote:'Merged page captures. This is the combined loaded outline, not a guarantee of a complete course. Review grouping, ordering, links, and estimated durations.'};
}

// User-triggered, bounded accordion scanning. No submission or completion controls are touched.
export function disclosureControls(){
 const denied=/buy|purchase|submit|complete|answer|quiz|play video|delete|sign.?in|log.?in|reset|download/i;
 const roots=[...document.querySelectorAll('aside,[role="tree"],main,[role="navigation"]')];
 const controls=[...new Set(roots.flatMap(root=>[...root.querySelectorAll('.chapter-container,button[aria-expanded="false"],[role="button"][aria-expanded="false"],details:not([open])>summary')]))];
 return controls.filter(e=>{const text=(e.textContent||'').trim();if(!text||denied.test(text)||e.closest('form,header,footer'))return false;if(e.matches('.chapter-container'))return !!e.querySelector('.chapter-name')&&!!e.querySelector('.chevron.down');return !!e.closest('aside,[role="tree"],nav')||/chapter|module|section|curriculum|course content/i.test(text);}).slice(0,40).map((e,i)=>({index:i,label:(e.querySelector('.chapter-name')?.textContent||e.textContent||'').trim().slice(0,150)}));
}
export function expandNextDisclosure(skipLabels=[]){
 const denied=/buy|purchase|submit|complete|answer|quiz|play video|delete|sign.?in|log.?in|reset|download/i;
 const roots=[...document.querySelectorAll('aside,[role="tree"],main,[role="navigation"]')];
 const controls=[...new Set(roots.flatMap(root=>[...root.querySelectorAll('.chapter-container,button[aria-expanded="false"],[role="button"][aria-expanded="false"],details:not([open])>summary')]))];
 const e=controls.find(e=>{const label=(e.querySelector('.chapter-name')?.textContent||e.textContent||'').trim().slice(0,150);if(skipLabels.some(s=>s.toLowerCase().replace(/[^a-z0-9]/g,'')===label.toLowerCase().replace(/[^a-z0-9]/g,'')))return false;const text=(e.textContent||'').trim();if(!text||denied.test(text)||e.closest('form,header,footer'))return false;if(e.matches('.chapter-container'))return !!e.querySelector('.chapter-name')&&!!e.querySelector('.chevron.down');return !!e.closest('aside,[role="tree"],nav')||/chapter|module|section|curriculum|course content/i.test(text);});
 if(!e)return {expanded:false};const label=(e.querySelector('.chapter-name')?.textContent||e.textContent||'').trim().slice(0,150);e.click();return {expanded:true,label};
}
