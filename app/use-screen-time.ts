'use client';
import {useEffect,useRef,useState} from 'react';
import {balanceSettingsSchema,usageReportSchema,type BalanceSettings,type UsageReport} from '../lib/focus-balance';
import {localRead,localWrite,nativeBridge,nativeRequest} from '../lib/local-store';
import {updateScreenSummaries,usageSummaries} from '../lib/screen-time';
import type {LearningState} from '../lib/learning';
export type ScreenTimeController=ReturnType<typeof useScreenTime>;
export function useScreenTime(state:LearningState,update:(fn:(s:LearningState)=>LearningState)=>boolean|void,localMode:boolean,loaded:boolean){
 const [settings,setSettings]=useState<BalanceSettings>(()=>balanceSettingsSchema.parse({})),[usage,setUsage]=useState<UsageReport|null>(null),[granted,setGranted]=useState(false),[kind,setKind]=useState<'android'|'mac'|'web'>('web'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[ready,setReady]=useState(false);
 const latest=useRef({state,update,settings});latest.current={state,update,settings};const request=useRef(0),running=useRef(false);
 useEffect(()=>{if(!loaded)return;let alive=true;localRead('focus-balance').then(raw=>{if(alive)setSettings(balanceSettingsSchema.parse(raw||{}));}).catch(()=>{if(alive)setError('Could not read local usage preferences.');}).finally(()=>{if(alive)setReady(true);});return()=>{alive=false;request.current++;};},[loaded]);
 function publish(report:UsageReport,config:BalanceSettings){if(!config.syncSummaries)return;const rows=usageSummaries(report,config,config.deviceId,report.platform==='mac'?'Mac':'Phone');if(rows.length)latest.current.update(s=>updateScreenSummaries(s,rows));}
 async function refresh(){if(running.current)return;running.current=true;const token=++request.current;setBusy(true);try{
  const bridge=nativeBridge();let config=latest.current.settings,report:UsageReport|null=null;
  if(bridge?.requestFocusUsage){setKind('android');const allowed=!!bridge.focusUsageGranted?.();setGranted(allowed);if(allowed&&config.enabled){const response=await nativeRequest('requestFocusUsage',{timezone:latest.current.state.settings.timezone});const raw=await response.json() as {error?:string};if(!response.ok)throw Error(raw.error||'Usage unavailable.');report=usageReportSchema.parse(raw);if(!config.deviceId){config={...config,deviceId:crypto.randomUUID()};await localWrite('focus-balance',config);if(token===request.current)setSettings(config);}}}
  else if(localMode&&['127.0.0.1','localhost'].includes(location.hostname)){const response=await fetch('/api/screen-time');if(response.ok){const raw=await response.json() as {settings:unknown;report:unknown};config=balanceSettingsSchema.parse(raw.settings);setKind('mac');setGranted(!!raw.report);setSettings(config);if(raw.report)report=usageReportSchema.parse(raw.report);}}
  if(token===request.current){setUsage(config.enabled?report:null);setError('');if(report&&config.enabled)publish(report,config);}
 }catch(e){if(token===request.current){setUsage(null);setError((e as Error).message);}}finally{running.current=false;if(token===request.current)setBusy(false);}}
 useEffect(()=>{if(!ready)return;refresh();const visible=()=>{if(document.visibilityState==='visible')refresh();};window.addEventListener('learning-native-ready',visible);document.addEventListener('visibilitychange',visible);const timer=setInterval(visible,120000);return()=>{window.removeEventListener('learning-native-ready',visible);document.removeEventListener('visibilitychange',visible);clearInterval(timer);request.current++;};},[ready,state.settings.timezone]);
 async function save(next:BalanceSettings){try{const parsed=balanceSettingsSchema.parse(next);if(kind==='mac'){const response=await fetch('/api/screen-time',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({settings:parsed})});if(!response.ok)throw Error('Mac preferences could not be saved.');}else await localWrite('focus-balance',parsed);setSettings(parsed);latest.current.settings=parsed;if(!parsed.enabled){request.current++;setUsage(null);setBusy(false);}else await refresh();return true;}catch(e){setError((e as Error).message);return false;}}
 return {settings,usage,granted,kind,busy,error,ready,save,refresh};
}
