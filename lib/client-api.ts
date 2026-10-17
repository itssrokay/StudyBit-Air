import {importLinkMetadata} from './link-import';
import {importYouTube,youtubeLink} from './youtube';
import {readLibrary,saveLibrary,nativeBridge,nativeRequest} from './local-store';import {prepareOfflineAI} from './offline-ai';
let local=false;
export function configureLocalMode(){local=true;}
export function isLocalMode(){return local;}
const json=(value:unknown,status=200)=>Response.json(value,{status});
export async function apiRequest(path:string,options:RequestInit={}):Promise<Response>{
 if(!local)return fetch(path,options);
 const method=options.method||'GET';let input:any;try{input=options.body?JSON.parse(String(options.body)):{};
  if(path==='/api/state'){if(method==='GET')return json(await readLibrary());const packet=await saveLibrary(input.state,input.revision);window.dispatchEvent(new CustomEvent('learning-state-saved'));return json({revision:packet.revision});}
  const bridge=nativeBridge();
  if(path==='/api/ai-key'){
   if(method==='GET')return json(bridge?JSON.parse(bridge.aiSettings()):{connected:false,personal:false,canSave:false,model:'gpt-4.1-mini',local:true});
   if(!bridge)return json({error:'AI keys in local mode are stored securely in the Android app. Use the app to connect your key.'},503);
   if(method==='POST'){if(typeof input.key!=='string'||input.key.trim().length<20||input.key.length>400||/[\r\n]/.test(input.key)||typeof input.model!=='string'||!/^[a-zA-Z0-9._:-]{1,100}$/.test(input.model))return json({error:'Check the API key and model name.'},400);const result=JSON.parse(bridge.saveAiKey(input.key.trim(),input.model));return json(result,result.error?500:200);}
   if(method==='DELETE'){bridge.removeAiKey();return json({removed:true});}if(method==='PUT')return nativeRequest('testAiKey');
  }
  if(path==='/api/coach'&&method==='GET')return json({connected:bridge?JSON.parse(bridge.aiSettings()).connected:false});
  if(path==='/api/coach'||path==='/api/book-plan'){if(!bridge||!JSON.parse(bridge.aiSettings()).connected)return json({error:'Add your OpenAI key in the app’s Settings first. AI needs internet; your library works offline.'},503);const request=prepareOfflineAI(path,input);const response=await nativeRequest('requestOpenAI',request.body);if(!response.ok)return response;return json(request.parse(await response.json()));}
  if(path==='/api/import'){if(youtubeLink(input.url)){if(bridge&&!bridge.requestYouTube)throw Error('Update the Android app to import YouTube playlists.');if(bridge?.requestYouTube)return json(await importYouTube(input.url,async request=>{const response=await nativeRequest('requestYouTube',request);const result=await response.json() as {error?:string;text:string};if(!response.ok)throw Error(result.error||'YouTube could not be reached.');return result.text;}));const response=await fetch('/api/import',{...options,signal:AbortSignal.timeout(50000)});if(response.status===404)throw Error('Start the updated computer Wi-Fi server or use Browser capture to import a playlist.');return response;}return json(importLinkMetadata(input.url));}
  return json({error:'This action is unavailable on this device.'},404);
 }catch(e){return json({error:(e as Error).message||'Could not save on this device.'},(e as {status?:number}).status||400);}
}
export function exportLocalFile(name:string,content:string){const bridge=nativeBridge();if(!local||!bridge)return false;bridge.exportFile(name,content);return true;}
