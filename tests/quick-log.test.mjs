import test from 'node:test';import assert from 'node:assert/strict';
import {quickLogLink,validateQuickLog} from '../lib/quick-log.ts';
import {seedState,parseLibrary,doneMinutes} from '../lib/learning.ts';
import {logExtra} from '../lib/capture.ts';import {workspaceState,updateWorkspace} from '../lib/spaces.ts';
import {dailyShare,shareCaption} from '../lib/daily-share.ts';import {deleteStudySession} from '../lib/activity.ts';
import {streaks} from '../lib/habits.ts';import {createSaveCoordinator} from '../lib/save-coordinator.ts';
const now=new Date('2026-10-24T06:46:00Z');
const input={title:'Binary search practice',url:'www.leetcode.com',minutes:30,kind:'topic',reflection:'Private reflection: need more practice',workspace:'personal',keep:true};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
test('the reported bare domain and ordinary pasted links normalize without changing stored-URL validation',()=>{
 for(const [raw,wanted] of [['www.leetcode.com','https://www.leetcode.com/'],['  leetcode.com/problems/binary-search/?x=1#notes  ','https://leetcode.com/problems/binary-search/?x=1#notes'],['https://example.com/a?q=two%20words','https://example.com/a?q=two%20words'],['http://example.com','http://example.com/'],['',''],['   ','']])assert.equal(quickLogLink(raw),wanted);
 assert.equal(validateQuickLog(input).valid,true);
});
test('invalid fields identify what to fix; unsafe schemes, relative paths and credential URLs are not normalized',()=>{
 for(const url of ['javascript:alert(1)','file:///etc/passwd','mailto:user@example.com','//evil.example','/course/lesson','not a link','https://user:password@example.com','example.com\\@evil.example','https://','www.leetcode.com:99999'])assert.ok(validateQuickLog({...input,url}).errors.url,url);
 const result=validateQuickLog({title:'  ',url:'not a link',minutes:'0'});assert.equal(result.valid,false);assert.deepEqual(Object.keys(result.errors).sort(),['minutes','title','url']);
 for(const minutes of ['',0,-1,0.5,601,NaN,Infinity])assert.ok(validateQuickLog({...input,minutes}).errors.minutes);
 for(const minutes of ['1','30',600])assert.equal(validateQuickLog({...input,minutes}).valid,true);
 assert.equal(validateQuickLog({...input,url:'   '}).value.url,'');
});
test('a 30-minute practice log persists once and consistently updates learning, streaks and daily sharing',()=>{
 const before=seedState(),logged=logExtra(before,input,now,'practice'),saved=parseLibrary(JSON.parse(JSON.stringify(logged)));
 assert.equal(before.studyLog.length,0);assert.equal(doneMinutes(saved,now),30);assert.equal(saved.studyLog.length,1);assert.equal(streaks(saved,now).current,1);
 const resource=saved.resources.find(r=>r.id==='practice');assert.equal(resource.url,'https://www.leetcode.com/');assert.equal(resource.lessons[0].url,resource.url);assert.equal(resource.createdAt,now.toISOString());assert.equal(resource.archived,false);assert.equal(resource.lessons[0].format,'exercise');
 assert.equal(logExtra(saved,input,now,'practice'),saved);assert.equal(dailyShare(saved,'personal','2026-10-24').minutes,30);assert.equal(dailyShare(saved,'personal','2026-10-24').extra,1);assert.ok(!shareCaption(dailyShare(saved,'personal','2026-10-24'),true,'').includes('Private reflection'));
 const reset=deleteStudySession(saved,'practice-session',new Date(now.getTime()+1));assert.equal(doneMinutes(reset,now),0);assert.equal(dailyShare(reset,'personal','2026-10-24').extra,0);assert.equal(streaks(reset,now).current,0);
});
test('blank optional links and Work quick logs persist without altering Personal time',()=>{
 const root=seedState(),work=logExtra(workspaceState(root,'work'),{...input,workspace:'work',keep:false,url:'  '},now,'office-practice'),merged=parseLibrary(updateWorkspace(root,work,'work'));
 assert.equal(doneMinutes(workspaceState(merged,'work'),now),30);assert.equal(doneMinutes(workspaceState(merged,'personal'),now),0);assert.equal(merged.resources.find(r=>r.id==='office-practice').archived,true);assert.equal(merged.resources.find(r=>r.id==='office-practice').url,'');
});
test('library capacity gives an actionable error and never leaves an orphaned log',()=>{
 const state=seedState();while(state.resources.length<300)state.resources.push({...state.resources[0],id:'full-'+state.resources.length,lessons:[{...state.resources[0].lessons[0],id:'lesson-'+state.resources.length}]});
 assert.throws(()=>logExtra(state,input,now,'overflow'),/300 resources/);assert.equal(state.studyLog.length,0);
});
test('save confirmation waits for a log queued behind an older snapshot, with one writer at a time',async()=>{
 let value=1,pending=true,stored=0,writes=0;const first=deferred(),second=deferred();
 const flush=createSaveCoordinator(async()=>{if(!pending)return true;pending=false;const snapshot=value,index=++writes;await(index===1?first.promise:second.promise);stored=snapshot;return true;},()=>pending);
 const earlier=flush();value=2;pending=true;const logSave=flush();let confirmed=false;logSave.then(()=>{confirmed=true;});assert.equal(logSave,earlier);first.resolve();await Promise.resolve();await Promise.resolve();assert.equal(confirmed,false);assert.equal(writes,2);assert.equal(stored,1);second.resolve();assert.equal(await logSave,true);assert.equal(stored,2);assert.equal(confirmed,true);
});
test('failed storage does not report success; retrying the same log writes one activity record',async()=>{
 let state=seedState(),pending=true,attempt=0,stored=null;
 state=logExtra(state,input,now,'retry-log');const flush=createSaveCoordinator(async()=>{attempt++;if(attempt===1)return false;stored=parseLibrary(JSON.parse(JSON.stringify(state)));pending=false;return true;},()=>pending);
 assert.equal(await flush(),false);assert.equal(stored,null);state=logExtra(state,input,now,'retry-log');assert.equal(await flush(),true);assert.equal(stored.studyLog.length,1);assert.equal(doneMinutes(stored,now),30);
});
