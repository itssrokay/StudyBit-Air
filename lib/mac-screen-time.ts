import {readFileSync,writeFileSync,renameSync,mkdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {balanceSettingsSchema,usageReportSchema} from './focus-balance.ts';
import {updateScreenSummaries,usageSummaries} from './screen-time.ts';
import type {LearningState} from './learning.ts';
export const macUsageDirectory=()=>join(homedir(),'Library','Application Support','Learning Space');
export function macScreenPacket(directory=macUsageDirectory()){
 const configFile=join(directory,'settings.json'),reportFile=join(directory,'usage.json');
 let settings=balanceSettingsSchema.parse({}),report=null;
 if(existsSync(configFile))settings=balanceSettingsSchema.parse(JSON.parse(readFileSync(configFile,'utf8')));
 if(existsSync(reportFile))report=usageReportSchema.parse(JSON.parse(readFileSync(reportFile,'utf8')));
 return {settings,report};
}
export function saveMacScreenSettings(raw:unknown,directory=macUsageDirectory()){
 let settings=balanceSettingsSchema.parse(raw);if(!settings.deviceId){let previous='';try{previous=macScreenPacket(directory).settings.deviceId;}catch{}settings={...settings,deviceId:previous||randomUUID()};}mkdirSync(directory,{recursive:true,mode:0o700});const file=join(directory,'settings.json');writeFileSync(file+'.tmp',JSON.stringify(settings),{mode:0o600});renameSync(file+'.tmp',file);return settings;
}
export function ingestMacScreenTime(state:LearningState,directory=macUsageDirectory()){
 try{const packet=macScreenPacket(directory);if(!packet.report)return state;return updateScreenSummaries(state,usageSummaries(packet.report,packet.settings,packet.settings.deviceId,'Mac'));}catch{return state;}
}
