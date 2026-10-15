'use client';
import {useEffect,useState} from 'react';
import {nativeBridge,nativeRequest} from '../lib/local-store';
import {FOCUS_TIMER_KEY,focusTimerSchema,browserTimerElapsed,browserTimerAction,type FocusTimer,type TimerSpec,type TimerAction} from '../lib/focus-timer-model';
export type TimerPacket={timer:FocusTimer|null;notificationsEnabled:boolean;native:boolean;error:string};
export function readFocusTimer():TimerPacket{
 const bridge=nativeBridge();if(bridge?.studyTimerState){try{const data=JSON.parse(bridge.studyTimerState());if(data.error)throw Error(data.error);return {timer:data.timer?focusTimerSchema.parse(data.timer):null,notificationsEnabled:!!data.notificationsEnabled,native:true,error:''};}catch(e){return {timer:null,notificationsEnabled:false,native:true,error:(e as Error).message};}}
 try{const raw=localStorage.getItem(FOCUS_TIMER_KEY);const timer=raw?focusTimerSchema.parse(JSON.parse(raw)):null;return {timer:timer?{...timer,elapsedMs:browserTimerElapsed(timer,Date.now())}:null,notificationsEnabled:false,native:false,error:''};}catch{return {timer:null,notificationsEnabled:false,native:false,error:'The saved timer could not be read. Your learning library is safe.'};}
}
export async function controlFocusTimer(action:TimerAction,spec:TimerSpec|{id:string}){
 const bridge=nativeBridge();if(bridge){if(!bridge.controlStudyTimer)throw Error('Install Android version 0.8.0 for notification timers.');const response=await nativeRequest('controlStudyTimer',{action,...spec});const data=await response.json() as {error?:string};if(!response.ok)throw Error(data.error||'Could not update the timer.');}
 else{const packet=readFocusTimer();if(packet.error)throw Error(packet.error);const timer=browserTimerAction(packet.timer,action,spec,Date.now());if(timer)localStorage.setItem(FOCUS_TIMER_KEY,JSON.stringify(timer));else localStorage.removeItem(FOCUS_TIMER_KEY);}
 window.dispatchEvent(new Event('learning-focus-changed'));return readFocusTimer();
}
export function resetUnreadableBrowserTimer(){if(nativeBridge())throw Error('Open Android settings to recover the native timer.');localStorage.removeItem(FOCUS_TIMER_KEY);window.dispatchEvent(new Event('learning-focus-changed'));}
export function useStudyTimer(tick=true){const [packet,setPacket]=useState<TimerPacket>({timer:null,notificationsEnabled:false,native:false,error:''});
 useEffect(()=>{let interval:ReturnType<typeof setInterval>|undefined;const read=()=>{const next=readFocusTimer();setPacket(previous=>{const comparable=(p:TimerPacket)=>JSON.stringify(tick?p:{...p,timer:p.timer?{...p.timer,elapsedMs:0}:null});return comparable(previous)===comparable(next)?previous:next;});};const visibility=()=>{if(interval)clearInterval(interval);if(document.visibilityState==='visible'){read();interval=setInterval(read,1000);}};visibility();window.addEventListener('learning-focus-changed',read);window.addEventListener('learning-native-ready',read);window.addEventListener('storage',read);document.addEventListener('visibilitychange',visibility);return()=>{if(interval)clearInterval(interval);window.removeEventListener('learning-focus-changed',read);window.removeEventListener('learning-native-ready',read);window.removeEventListener('storage',read);document.removeEventListener('visibilitychange',visibility);};},[tick]);return packet;
}
