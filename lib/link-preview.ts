import {readingLink} from './reading.ts';
import {nativeBridge,nativeRequest} from './local-store.ts';
/**
 * Titles for shared links. X posts use the public oEmbed endpoint (post text and
 * author, no login); other pages use their <title> / Open Graph tags. Fetching
 * happens on the phone or the computer server; parsing is shared and pure.
 */
export type LinkPreview={title:string;excerpt:string;author:string;site:string};
export type PreviewRequest={url:string;kind:'x'|'x-full'|'page';endpoint:string};

export function previewRequest(value:string):PreviewRequest{
 const link=readingLink(value);
 if(link.sourceId.startsWith('x:'))return {url:link.url,kind:'x',endpoint:'https://publish.twitter.com/oembed?omit_script=1&dnt=true&url='+encodeURIComponent(link.url)};
 return {url:link.url,kind:'page',endpoint:link.url};
}

const NAMED:Record<string,string>={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',mdash:'—',ndash:'–',hellip:'…',rsquo:'’',lsquo:'‘',rdquo:'”',ldquo:'“',middot:'·',bull:'•',copy:'©',reg:'®',trade:'™'};
export function decodeEntities(text:string){return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,(m,e:string)=>{if(e[0]==='#'){const n=e[1].toLowerCase()==='x'?parseInt(e.slice(2),16):parseInt(e.slice(1),10);return Number.isFinite(n)&&n>0&&n<0x110000?String.fromCodePoint(n):m;}return NAMED[e.toLowerCase()]??m;});}
const clean=(s:string)=>decodeEntities(s.replace(/<[^>]*>/g,'')).replace(/[ \t ]+/g,' ').replace(/\s*\n\s*/g,'\n').trim();
/** First sentence or line of a post, kept short enough for a list title. */
export function snippet(text:string,max=100){
 const line=(text.split('\n').find(l=>l.trim())||'').trim();const sentence=line.match(/^.{20,}?[.!?](?=\s|$)/)?.[0]||line;
 return sentence.length>max?sentence.slice(0,max-1).replace(/\s+\S*$/,'').trimEnd()+'…':sentence;
}

export function parseXOembed(body:string,url:string):LinkPreview|null{
 let data:{author_name?:unknown;author_url?:unknown;html?:unknown};try{data=JSON.parse(body);}catch{return null;}
 if(typeof data.html!=='string')return null;
 const author=typeof data.author_name==='string'?data.author_name.trim():'';
 const handle=(typeof data.author_url==='string'?data.author_url:url).match(/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})/i)?.[1]||'';
 const inner=data.html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]||'';
 const text=clean(inner.replace(/<br\s*\/?>/gi,'\n').replace(/<a[^>]*>\s*(?:pic\.twitter\.com\/\S+|https?:\/\/t\.co\/\S+)\s*<\/a>/gi,'')).replace(/\s*(?:https?:\/\/t\.co\/\S+|pic\.twitter\.com\/\S+)/g,'').trim();
 const who=handle?'@'+handle:author||'X';
 return {title:(text?`${who}: ${snippet(text)}`:`Post by ${author&&handle?`${author} (@${handle})`:who}`).slice(0,250),excerpt:text.slice(0,20000),author:author||who,site:'X / Twitter'};
}

function meta(html:string,names:string[]){
 for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){const key=tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();if(key&&names.includes(key)){const v=tag.match(/\bcontent\s*=\s*"([^"]*)"/i)?.[1]??tag.match(/\bcontent\s*=\s*'([^']*)'/i)?.[1];if(v&&v.trim())return clean(v);}}
 return '';
}
export function parseHtmlPreview(html:string,url:string):LinkPreview|null{
 const head=html.slice(0,600000);
 const title=meta(head,['og:title','twitter:title'])||clean(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'');
 if(!title)return null;
 const site=meta(head,['og:site_name'])||new URL(url).hostname.replace(/^www\./,'');
 return {title:title.slice(0,250),excerpt:'',author:meta(head,['author','article:author']),site};
}
/** Long X posts ("note tweets") come back cut off from oEmbed; this endpoint returns the whole text. */
export function fullPostRequest(url:string):PreviewRequest|null{const m=url.match(/^https:\/\/x\.com\/([A-Za-z0-9_]{1,15}|i\/web)\/status\/(\d{5,25})$/);return m?{url,kind:'x-full',endpoint:`https://api.fxtwitter.com/${m[1]==='i/web'?'i':m[1]}/status/${m[2]}`}:null;}
export const looksTruncated=(text:string)=>/(…|\.\.\.)\s*$/.test(text);
export function parseFullPost(body:string):LinkPreview|null{
 let data:{tweet?:{text?:unknown;author?:{name?:unknown;screen_name?:unknown}}};try{data=JSON.parse(body);}catch{return null;}
 const t=data.tweet;if(!t||typeof t.text!=='string'||!t.text.trim())return null;
 const text=t.text.replace(/\s*https?:\/\/t\.co\/\S+/g,'').trim(),handle=typeof t.author?.screen_name==='string'?t.author.screen_name:'',name=typeof t.author?.name==='string'?t.author.name:'';
 return {title:`${handle?'@'+handle:name||'X'}: ${snippet(text)}`.slice(0,250),excerpt:text.slice(0,20000),author:name||'@'+handle,site:'X / Twitter'};
}
export function parsePreview(kind:PreviewRequest['kind'],body:string,url:string){return kind==='x'?parseXOembed(body,url):kind==='x-full'?parseFullPost(body):parseHtmlPreview(body,url);}
/** Fetch with any transport, then upgrade a cut-off X post to its full text. */
export async function resolvePreview(request:PreviewRequest,get:(r:PreviewRequest)=>Promise<{text:string;url?:string}|null>):Promise<LinkPreview|null>{
 const first=await get(request).catch(()=>null);let preview=first?parsePreview(request.kind,first.text,first.url||request.url):null;
 if(request.kind==='x'&&(!preview||looksTruncated(preview.excerpt))){const full=fullPostRequest(request.url);const second=full?await get(full).catch(()=>null):null;const better=second?parseFullPost(second.text):null;if(better)preview={...better,author:preview?.author||better.author};}
 return preview;
}

/** Fetch a preview from the phone app or the computer server. Returns null when neither is available or the site refuses. */
export async function fetchLinkPreview(value:string):Promise<LinkPreview|null>{
 let request:PreviewRequest;try{request=previewRequest(value);}catch{return null;}
 try{
  const bridge=nativeBridge() as unknown as {requestLinkPreview?:unknown}|undefined;
  if(bridge?.requestLinkPreview)return await resolvePreview(request,async r=>{const res=await nativeRequest('requestLinkPreview',{url:r.url,kind:r.kind});if(!res.ok)return null;const d=await res.json() as {text?:string;url?:string};return typeof d.text==='string'?{text:d.text,url:d.url}:null;});
  if(typeof location!=='undefined'&&/^(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname)){const r=await fetch('/api/link-preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:request.url}),signal:AbortSignal.timeout(15000)});if(!r.ok)return null;const d=await r.json() as LinkPreview;return typeof d.title==='string'?d:null;}
 }catch{return null;}
 return null;
}
