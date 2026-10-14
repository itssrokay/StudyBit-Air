import {getChatGPTUser} from '../../chatgpt-auth';
import {getAiConfig} from '../../../lib/ai-config';
import {prepareOfflineAI} from '../../../lib/offline-ai';
export async function GET(){const user=await getChatGPTUser();if(!user)return Response.json({error:'Please sign in.'},{status:401});return Response.json({connected:!!(await getAiConfig(user.userId)).key});}
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Please sign in.'},{status:401});
 if(request.headers.get('Origin')&&new URL(request.url).origin!==request.headers.get('Origin'))return Response.json({error:'Invalid origin.'},{status:403});
 const {key,model}=await getAiConfig(user.userId);if(!key)return Response.json({error:'Add your OpenAI key in Settings to use AI. Smart guidance works without a key.'},{status:503});
 const raw=await request.text();if(raw.length>4000000)return Response.json({error:'Input is too large.'},{status:413});
 let prepared;try{prepared=prepareOfflineAI('/api/coach',JSON.parse(raw));}catch{return Response.json({error:'Check the request and saved library. Grouping supports up to 200 unique lessons; coach messages support up to 6,000 characters.'},{status:400});}
 try{
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({...prepared.body,model}),signal:AbortSignal.timeout(45000)});
  if(!response.ok)return Response.json({error:'AI could not respond. Check your key, model, internet connection, and account quota. Smart guidance is available.'},{status:502});
  return Response.json(prepared.parse(await response.json()));
 }catch{return Response.json({error:'AI timed out or returned an invalid suggestion. Your library has not changed. Try again or use smart guidance.'},{status:502});}
}
