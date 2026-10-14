import { env } from 'cloudflare:workers';
import { decryptKey } from './key-crypto';
export async function getAiConfig(userId:string){const runtime=env as unknown as Record<string,string|undefined>;const row=env.DB?await env.DB.prepare('SELECT ciphertext, iv, model FROM user_ai_keys WHERE user_id=?').bind(userId).first<{ciphertext:string;iv:string;model:string}>():null;
 if(row&&runtime.LEARNING_KEYS_SECRET){return {key:await decryptKey(row,runtime.LEARNING_KEYS_SECRET,userId),model:row.model,personal:true};}
 return {key:runtime.OPENAI_API_KEY,model:runtime.OPENAI_MODEL||'gpt-4.1-mini',personal:false};
}
