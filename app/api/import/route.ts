import { getChatGPTUser } from '../../chatgpt-auth';
import { z } from 'zod';
import {importYouTube,youtubeLink} from '../../../lib/youtube';
export async function POST(request:Request){
 if(!await getChatGPTUser())return Response.json({error:'Please sign in.'},{status:401});
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==new URL(request.url).origin)return Response.json({error:'Invalid origin.'},{status:403});
 let value:string;try{value=z.object({url:z.string().url().max(2000)}).parse(await request.json()).url;}catch{return Response.json({error:'Enter a valid link.'},{status:400});}
 try{const url=new URL(value);if(!['https:','http:'].includes(url.protocol))throw Error('Use an http or https link.');
 if(youtubeLink(value))return Response.json(await importYouTube(value));
 const host=url.hostname.replace(/^www\./,'');
 return Response.json({title:'',provider:host==='boot.dev'?'Boot.dev':host==='100xdevs.com'?'100xDevs':host,notice:'For grouped lessons from a course platform, use Browser capture on its loaded outline, or paste a syllabus.'});
 }catch(e){return Response.json({error:(e as Error).message||'The outline could not be imported. Try Browser capture.'},{status:502});}
}
