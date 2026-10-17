// Public metadata only. Never execute page scripts or request playback/cookies.
export type YouTubeLink={kind:'playlist'|'video';id:string;url:string};
export type YouTubeRequest={kind:'playlist'|'video'|'continuation';id?:string;token?:string;clientVersion?:string};
export type YouTubeTransport=(request:YouTubeRequest)=>Promise<string>;
export type YouTubeLesson={title:string;url:string;sourceId:string;minutes:number;durationSeconds:number;durationEstimated:boolean;thumbnailUrl:string;format:'video';modulePath:string};
export type YouTubeImport={title:string;provider:string;kind:'course'|'video';url:string;thumbnailUrl:string;lessons:YouTubeLesson[];captureScope:'course'|'page';captureNote:string;notice:string;totalItems:number|null;complete:boolean};
const videoId=/^[A-Za-z0-9_-]{11}$/;
export function youtubeLink(value:string):YouTubeLink|null{
 let u:URL;try{u=new URL(value);}catch{return null;}
 if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.port)return null;
 const host=u.hostname.toLowerCase().replace(/^www\./,'');if(!['youtube.com','m.youtube.com','music.youtube.com','youtu.be'].includes(host))return null;
 const list=u.searchParams.get('list');if(list){if(!/^[A-Za-z0-9_-]{2,150}$/.test(list))throw Error('Check the YouTube playlist link.');return {kind:'playlist',id:list,url:'https://www.youtube.com/playlist?list='+list};}
 const id=host==='youtu.be'?u.pathname.split('/')[1]:u.searchParams.get('v')||u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1];
 if(!id||!videoId.test(id))throw Error('Paste a YouTube playlist or video link.');return {kind:'video',id,url:'https://www.youtube.com/watch?v='+id};
}
export function youtubeThumbnail(id:string){return videoId.test(id)?'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg':'';}
export function safeThumbnail(value:string){try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='i.ytimg.com'&&!u.port&&!u.username&&!u.password&&/^\/vi\/[A-Za-z0-9_-]{11}\/(?:hqdefault|mqdefault|sddefault|maxresdefault)\.jpg$/.test(u.pathname)?u.origin+u.pathname:'';}catch{return '';}}
function text(v:any):string{return (typeof v==='string'?v:v?.simpleText||v?.content||v?.runs?.map((r:any)=>r.text||'').join('')||'').trim();}
function collect(v:any,key:string,out:any[]=[]):any[]{if(!v||typeof v!=='object')return out;if(Array.isArray(v)){for(const x of v)collect(x,key,out);}else{if(v[key])out.push(v[key]);for(const x of Object.values(v))collect(x,key,out);}return out;}
// JSON.parse consumes only a balanced JSON object, never JavaScript from YouTube.
export function embeddedJson(html:string,name:string):any{
 const match=new RegExp('(?:var\\s+)?'+name+'\\s*=\\s*').exec(html);if(!match)throw Error('YouTube did not expose a public outline. Try Browser capture on the loaded playlist.');
 const start=match.index+match[0].length;let depth=0,quoted=false,escape=false;
 for(let i=start;i<html.length;i++){const c=html[i];if(quoted){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&!--depth)return JSON.parse(html.slice(start,i+1));}
 throw Error('YouTube returned an incomplete outline. Please retry.');
}
function seconds(value:string){if(!/^\d{1,3}(?::\d{2}){1,2}$/.test(value))return 0;return value.split(':').reduce((n,x)=>n*60+Number(x),0);}
function lesson(id:string,title:string,duration:number):YouTubeLesson|null{if(!videoId.test(id)||!title||/^\[?(?:private|deleted) video\]?$/i.test(title))return null;return {title:title.slice(0,250),url:'https://www.youtube.com/watch?v='+id,sourceId:'youtube:'+id,minutes:duration?Math.min(600,Math.max(1,Math.ceil(duration/60))):15,durationSeconds:duration,durationEstimated:!duration||duration>36000,thumbnailUrl:youtubeThumbnail(id),format:'video',modulePath:''};}
export function parsePlaylistPage(data:any,playlistId:string){
 const root=data.contents||data.onResponseReceivedActions||data.onResponseReceivedEndpoints||data.continuationContents||data;const lessons:YouTubeLesson[]=[];
 const visit=(v:any)=>{if(!v||typeof v!=='object')return;if(Array.isArray(v)){for(const x of v)visit(x);return;}
  if(v.playlistVideoRenderer){const x=v.playlistVideoRenderer;const l=lesson(x.videoId,text(x.title),Number(x.lengthSeconds)||seconds(text(x.lengthText)));if(l&&x.isPlayable!==false)lessons.push(l);return;}
  if(v.lockupViewModel){const x=v.lockupViewModel;const endpoint=x.rendererContext?.commandContext?.onTap?.innertubeCommand?.watchEndpoint;if(x.contentType==='LOCKUP_CONTENT_TYPE_VIDEO'&&endpoint?.playlistId===playlistId){const duration=collect(x.contentImage,'thumbnailBadgeViewModel').map(b=>seconds(text(b.text))).find(Boolean)||0;const l=lesson(x.contentId,text(x.metadata?.lockupMetadataViewModel?.title),duration);if(l)lessons.push(l);}return;}
  for(const x of Object.values(v))visit(x);
 };visit(root);
 const continuations=[...collect(root,'continuationItemRenderer'),...collect(root,'continuationItemViewModel')];const token=continuations.flatMap(x=>collect(x,'continuationCommand')).map(x=>x.token).find(x=>typeof x==='string')||'';
 return {lessons,token};
}
function expectedCount(data:any):number|null{for(const sidebar of collect(data.sidebar,'playlistSidebarPrimaryInfoRenderer'))for(const stat of sidebar.stats||[]){const m=text(stat).match(/^([\d,]+)\s+videos?$/i);if(m)return Number(m[1].replaceAll(',',''));}return null;}
export async function importYouTube(value:string,transport:YouTubeTransport=fetchYouTube):Promise<YouTubeImport>{
 const started=Date.now();const link=youtubeLink(value);if(!link)throw Error('Use a YouTube playlist or video link.');
 const html=await transport({kind:link.kind,id:link.id});let title='',provider='YouTube',lessons:YouTubeLesson[]=[],totalItems:number|null=null,complete=true;
 if(link.kind==='video'){const p=embeddedJson(html,'ytInitialPlayerResponse'),d=p.videoDetails;if(!d?.title)throw Error('This video is unavailable publicly. Use Browser capture or enter its details manually.');const l=lesson(link.id,d.title,Number(d.lengthSeconds)||0);if(!l)throw Error('This video is unavailable.');lessons=[l];title=d.title;provider=(d.author?d.author+' · ':'')+'YouTube';totalItems=1;}
 else{
  const data=embeddedJson(html,'ytInitialData');title=text(data.metadata?.playlistMetadataRenderer?.title)||text(collect(data.sidebar,'playlistSidebarPrimaryInfoRenderer')[0]?.title);if(!title)throw Error('This playlist is unavailable publicly. Check its link or use Browser capture.');
  const owner=collect(data.sidebar,'videoOwnerRenderer')[0];provider=(text(owner?.title)?text(owner.title)+' · ':'')+'YouTube';totalItems=expectedCount(data);
  const first=parsePlaylistPage(data,link.id);lessons=first.lessons;let token=first.token;const tokens=new Set<string>();const version=html.match(/"INNERTUBE_CLIENT_VERSION"\s*:\s*"([\w.]+)"/)?.[1]||'2.20261001.00.00';
  for(let page=0;token&&lessons.length<500&&!(totalItems!==null&&lessons.length>=totalItems)&&page<9;page++){
   if(tokens.has(token)||Date.now()-started>33000){complete=false;break;}tokens.add(token);
   try{const next=parsePlaylistPage(JSON.parse(await transport({kind:'continuation',token,clientVersion:version})),link.id);if(!next.lessons.length){complete=false;break;}lessons.push(...next.lessons);token=next.token;}catch{complete=false;break;}
  }
  if((token&&!(totalItems!==null&&lessons.length>=totalItems))||(totalItems!==null&&lessons.length<totalItems)||lessons.length>500)complete=false;
 }
 // Duplicate playlist entries share one learning task, so progress cannot be counted twice.
 const unique=[...new Map(lessons.map(l=>[l.sourceId,l])).values()].slice(0,500);if(!unique.length)throw Error('No public playlist videos were found. Use Browser capture on the loaded playlist; no placeholder was added.');
 const estimated=unique.filter(l=>l.durationEstimated).length;const duplicateCount=lessons.length-unique.length;
 const notice=[`${unique.length}${totalItems!==null?' of '+totalItems:''} ${link.kind==='playlist'?'playlist videos':'video'} loaded in source order.`,complete?'':'Partial outline: some videos are private, unavailable, or could not be loaded. You can retry later.',duplicateCount?`${duplicateCount} repeated entries combined.`:'',estimated?`${estimated} durations need review (15 min when unknown; planning durations above 10 hours are capped).`:'Durations come from YouTube; planning minutes round up.', 'Thumbnails and source links included.'].filter(Boolean).join(' ');
 return {title:title.slice(0,250),provider:provider.slice(0,100),kind:link.kind==='playlist'?'course':'video',url:link.url,thumbnailUrl:unique[0].thumbnailUrl,lessons:unique,totalItems,complete,captureScope:complete?'course':'page',captureNote:notice,notice};
}
export function youtubeFetchSpec(request:YouTubeRequest):{url:string;init:RequestInit}{
 if(request.kind==='continuation'){if(!request.token||request.token.length>15000||!request.clientVersion||!/^[\w.]{1,80}$/.test(request.clientVersion))throw Error('Invalid playlist continuation.');return {url:'https://www.youtube.com/youtubei/v1/browse',init:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({context:{client:{clientName:'WEB',clientVersion:request.clientVersion,hl:'en',gl:'US'}},continuation:request.token})}};}
 if(!request.id||(request.kind==='video'?!videoId.test(request.id):request.kind!=='playlist'||!/^[A-Za-z0-9_-]{2,150}$/.test(request.id)))throw Error('Invalid YouTube link.');
 return {url:'https://www.youtube.com/'+(request.kind==='playlist'?'playlist?list=':'watch?v=')+request.id+'&hl=en',init:{}};
}
export async function fetchYouTube(request:YouTubeRequest):Promise<string>{
 const spec=youtubeFetchSpec(request);const response=await fetch(spec.url,{...spec.init,redirect:'error',credentials:'omit',headers:{...spec.init.headers,'User-Agent':'Mozilla/5.0','Accept-Language':'en-US,en;q=0.9'},signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('YouTube could not be reached. Try again or use Browser capture.');
 if(Number(response.headers.get('Content-Length'))>6000000)throw Error('YouTube’s outline is too large. Use Browser capture.');const reader=response.body?.getReader();if(!reader)throw Error('Empty YouTube response.');let size=0,result='';const decoder=new TextDecoder();try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>6000000)throw Error('YouTube’s outline is too large. Use Browser capture.');result+=decoder.decode(value,{stream:true});}return result+decoder.decode();}finally{await reader.cancel();}
}
