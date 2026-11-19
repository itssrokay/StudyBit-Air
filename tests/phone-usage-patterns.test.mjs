import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seedState} from '../lib/learning.ts';
import {prepareCoachAI} from '../lib/coach-ai.ts';
import {shareablePhonePatterns,phoneUsagePatternsSchema} from '../lib/phone-usage-patterns.ts';
import {balanceSettingsSchema} from '../lib/focus-balance.ts';

const now=new Date('2026-11-19T08:00:00Z');
const patterns={
 fromDay:'2026-11-12',throughDay:'2026-11-18',timezone:'Asia/Kolkata',
 recurringWindow:{startHour:18,endHour:21,observedDays:6,activeDays:4,minimumActiveMinutes:15,averageMinutesOnActiveDays:87,shareOfUnlockedPercent:48},
 appUsage:{observedDays:6,totalForegroundMinutes:500,topAppSharePercent:80,topApps:[
  {name:'YouTube',minutes:240,shareOfForegroundPercent:48},
  {name:'Chrome',minutes:160,shareOfForegroundPercent:32},
 ]},
};
function prepare(summary,enabled=true){
 const state=seedState();
 state.coach.useScreenTime=enabled;
 return prepareCoachAI({state,prompt:'Where does my phone time cluster?',contextOptions:{phonePatterns:summary}},now).body;
}
test('phone patterns are opt-in and app names are independently removable',()=>{
 assert.equal(balanceSettingsSchema.parse({}).shareCoachPatterns,false);
 assert.equal(shareablePhonePatterns(patterns,false).appUsage,undefined);
 assert.equal(shareablePhonePatterns({...patterns,recurringWindow:undefined},false),undefined);
 assert.equal(shareablePhonePatterns(patterns,true).appUsage.topAppSharePercent,80);
 const body=prepare(shareablePhonePatterns(patterns,false));
 assert.doesNotMatch(body.input,/YouTube.*240|"appUsage"/);
 assert.equal(JSON.parse(body.input).phonePatterns.recurringWindow.averageMinutesOnActiveDays,87);
 assert.equal(JSON.parse(prepare(shareablePhonePatterns(patterns,true)).input).phonePatterns.appUsage.topAppSharePercent,80);
 assert.match(body.instructions,/specific, neutral question/);
});
test('fresh, completed and timezone-aligned windows only reach coach context',()=>{
 assert.equal(JSON.parse(prepare(patterns,false).input).phonePatterns,undefined);
 assert.equal(JSON.parse(prepare({...patterns,timezone:'UTC'}).input).phonePatterns,undefined);
 assert.equal(JSON.parse(prepare({...patterns,throughDay:'2026-11-19'}).input).phonePatterns,undefined);
 assert.equal(JSON.parse(prepare({...patterns,fromDay:'2026-11-11'}).input).phonePatterns,undefined);
 assert.equal(phoneUsagePatternsSchema.safeParse({...patterns,recurringWindow:{...patterns.recurringWindow,activeDays:2}}).success,false);
});
