import { getChatGPTUser } from '../../chatgpt-auth';
import { env } from 'cloudflare:workers';
import { stateSchema, seedState } from '../../../lib/learning';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){
 const user=await getChatGPTUser();if(!user)return json({error:'Please sign in.'},401);
 if(!env.DB)return json({error:'Cloud storage is unavailable.'},503);
 const row=await env.DB.prepare('SELECT body, revision FROM learning_states WHERE user_id = ?').bind(user.userId).first<{body:string;revision:number}>();
 return json({state:row?JSON.parse(row.body):seedState(),revision:row?.revision??0});
}
export async function PUT(request:Request){
 const user=await getChatGPTUser();if(!user)return json({error:'Please sign in.'},401);
 if(request.headers.get('Origin')&&new URL(request.url).origin!==request.headers.get('Origin'))return json({error:'Invalid origin.'},403);
 if(!env.DB)return json({error:'Cloud storage is unavailable.'},503);
 const raw=await request.text();if(raw.length>4000000)return json({error:'Library is too large.'},413);
 let input;try{input=JSON.parse(raw);}catch{return json({error:'Invalid JSON.'},400);}
 const parsed=stateSchema.safeParse(input.state);if(!parsed.success||!Number.isInteger(input.revision)||input.revision<0)return json({error:parsed.success?'Invalid revision.':parsed.error.issues[0]?.message},400);
 // Preserve newer preferences when a previously opened older client saves its library.
 if(input.state.coach===undefined||input.state.coach.sessions===undefined||input.state.coach.autoReviews===undefined||input.state.settings.theme===undefined){const row=await env.DB.prepare('SELECT body, revision FROM learning_states WHERE user_id = ?').bind(user.userId).first<{body:string;revision:number}>();if(row&&row.revision===input.revision){const previous=stateSchema.safeParse(JSON.parse(row.body));if(previous.success){if(input.state.coach===undefined)parsed.data.coach=previous.data.coach;else {if(input.state.coach.sessions===undefined)parsed.data.coach.sessions=previous.data.coach.sessions;if(input.state.coach.autoReviews===undefined)parsed.data.coach.autoReviews=previous.data.coach.autoReviews;}if(input.state.settings.theme===undefined)parsed.data.settings.theme=previous.data.settings.theme;}}}
 const result=await env.DB.prepare('INSERT INTO learning_states (user_id, body, revision, updated_at) VALUES (?, ?, 1, ?) ON CONFLICT(user_id) DO UPDATE SET body=excluded.body, revision=learning_states.revision+1, updated_at=excluded.updated_at WHERE learning_states.revision=?').bind(user.userId,JSON.stringify(parsed.data),new Date().toISOString(),input.revision).run();
 if(!result.meta.changes)return json({error:'Your library changed in another tab. Export your current copy, then reload to get the latest version.'},409);
 const row=await env.DB.prepare('SELECT revision FROM learning_states WHERE user_id=?').bind(user.userId).first<{revision:number}>();
 return json({revision:row!.revision});
}
