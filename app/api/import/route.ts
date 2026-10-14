import { getChatGPTUser } from '../../chatgpt-auth';
import { z } from 'zod';
export async function POST(request:Request){
 if(!await getChatGPTUser())return Response.json({error:'Please sign in.'},{status:401});
 let input;try{input=z.object({url:z.string().url().max(2000)}).parse(await request.json());}catch{return Response.json({error:'Invalid input.'},{status:400});}
 let url:URL;try{url=new URL(input.url);}catch{return Response.json({error:'Enter a valid link.'},{status:400});}
 if(!['https:','http:'].includes(url.protocol))return Response.json({error:'Use an http or https link.'},{status:400});
 const host=url.hostname.replace(/^www\./,'');
 if(host==='boot.dev')return Response.json({title:'',provider:'Boot.dev',notice:'This link saves the current resource. For chapter or lesson grouping, use Browser capture on the loaded Boot.dev outline. A lesson page does not expose the whole course.'});
 if(host==='100xdevs.com')return Response.json({title:'',provider:'100xDevs',notice:'For all loaded lecture cards and durations, use Browser capture, then import its JSON. Expand other course folders and capture them too; URLs alone cannot guarantee a complete outline.'});
 if(!['youtube.com','youtu.be','m.youtube.com'].includes(host))return Response.json({title:'',provider:host});
 const videoId=host==='youtu.be'?url.pathname.slice(1):url.searchParams.get('v');
 if(!videoId)return Response.json({title:'',provider:'YouTube',notice:'For playlists, paste the lesson list or upload a JSON syllabus. Playlist extraction needs an additional integration.'});
 try{
 const response=await fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent('https://www.youtube.com/watch?v='+videoId),{signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw Error();const data=await response.json() as {title:string;author_name:string};return Response.json({title:data.title,provider:data.author_name+' · YouTube'});
 }catch{return Response.json({title:'',provider:'YouTube',notice:'Metadata could not be loaded. You can enter the title yourself.'});}
}
