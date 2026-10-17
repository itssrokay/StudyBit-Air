import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {importYouTube,youtubeLink,youtubeFetchSpec,safeThumbnail,embeddedJson} from '../lib/youtube.ts';
import {makeResource,stateSchema,seedState,preserveSourceMetadata} from '../lib/learning.ts';
import {refreshYouTubeCourse} from '../lib/course-tools.ts';
const fixture=JSON.parse(await readFile(new URL('./fixtures/youtube-spring-boot.json',import.meta.url),'utf8'));
const html=data=>'var ytInitialData = '+JSON.stringify(data)+';';
const link='https://www.youtube.com/playlist?list=PLEYgx5hMdopw';
const legacy=(id,title='Lesson',duration='12:34')=>({playlistVideoRenderer:{videoId:id,title:{simpleText:title},lengthText:{simpleText:duration}}});
test('the reported Spring Boot playlist imports all 42 actual titles, durations, covers and stable source IDs',async()=>{
 const result=await importYouTube(link,async()=>html(fixture));assert.equal(result.lessons.length,42);assert.equal(result.totalItems,42);assert.equal(result.complete,true);assert.equal(result.provider,'Coder Army · YouTube');assert.equal(result.title,'Spring Boot Full Course 2026');assert.equal(result.lessons[0].durationSeconds,2621);assert.equal(result.lessons[0].minutes,44);assert.equal(result.lessons.at(-1).sourceId,'youtube:ZxCcYHL96x8');assert.ok(result.lessons.every(l=>safeThumbnail(l.thumbnailUrl)&&!l.durationEstimated));
 const parsed=makeResource({...result,lessons:undefined},result.lessons);assert.equal(parsed.lessons.length,42);assert.equal(parsed.thumbnailUrl,result.thumbnailUrl);
});
test('watch links containing list import the playlist, including the supplied short list ID',()=>{
 assert.deepEqual(youtubeLink('https://www.youtube.com/watch?v=Q04sTEwC7Kg&list=PLEYgx5hMdopw'),youtubeLink(link));assert.equal(youtubeLink('https://youtu.be/Q04sTEwC7Kg').kind,'video');assert.equal(youtubeLink('https://youtube.com.evil.example/watch?v=Q04sTEwC7Kg'),null);assert.equal(youtubeLink('https://www.youtube.com@localhost/watch?v=Q04sTEwC7Kg'),null);assert.equal(youtubeLink('https://youtube.com:8443/watch?v=Q04sTEwC7Kg'),null);
});
test('legacy renderers paginate in source order, combine repeats, and report unavailable entries honestly',async()=>{
 const data={...fixture,sidebar:{playlistSidebarPrimaryInfoRenderer:{stats:[{simpleText:'4 videos'}]}},contents:[legacy('Q04sTEwC7Kg'),{continuationItemRenderer:{continuationEndpoint:{continuationCommand:{token:'next'}}}}]};const calls=[];
 const result=await importYouTube(link,async req=>{calls.push(req);return req.kind==='playlist'?html(data):JSON.stringify({onResponseReceivedActions:[{appendContinuationItemsAction:{continuationItems:[legacy('ZxCcYHL96x8'),legacy('Q04sTEwC7Kg'),legacy('xxxxxxxxxxx','[Private video]')]}}]});});
 assert.equal(calls.length,2);assert.equal(calls[1].kind,'continuation');assert.equal(result.lessons.length,2);assert.equal(result.complete,false);assert.match(result.notice,/Partial outline/);assert.match(result.notice,/repeated entries/);
});
test('continuation errors and repeated tokens retain a clearly marked partial outline',async()=>{
 const data={...fixture,contents:[legacy('Q04sTEwC7Kg'),{continuationItemViewModel:{continuationCommand:{token:'again'}}}]};let calls=0;
 const result=await importYouTube(link,async req=>{calls++;if(req.kind==='continuation')throw Error('Blocked');return html(data);});assert.equal(calls,2);assert.equal(result.lessons.length,1);assert.equal(result.complete,false);
});
test('no public entries never becomes an invented one-lesson course, and missing durations stay estimated',async()=>{
 await assert.rejects(importYouTube(link,async()=>html({...fixture,contents:[]})),/No public/);const result=await importYouTube(link,async()=>html({...fixture,contents:[legacy('Q04sTEwC7Kg','Visible video','')]}));assert.equal(result.lessons[0].durationEstimated,true);assert.equal(result.lessons[0].minutes,15);
});
test('standalone videos use player metadata and exact seconds',async()=>{
 const result=await importYouTube('https://youtu.be/Q04sTEwC7Kg',async()=>`var ytInitialPlayerResponse = ${JSON.stringify({videoDetails:{title:'Video title',author:'Creator',lengthSeconds:'121'}})};`);assert.equal(result.kind,'video');assert.equal(result.lessons.length,1);assert.equal(result.lessons[0].durationSeconds,121);assert.equal(result.lessons[0].minutes,3);
});
test('JSON parsing never executes page code and fetch targets are fixed',()=>{
 assert.deepEqual(embeddedJson('var ytInitialData = {"title":"brace } and \\\" quote"}; throw new Error("never execute");','ytInitialData'),{title:'brace } and " quote'});assert.throws(()=>youtubeFetchSpec({kind:'playlist',id:'evil&url=https://localhost'}));assert.throws(()=>youtubeFetchSpec({kind:'other',id:'Q04sTEwC7Kg'}));assert.equal(youtubeFetchSpec({kind:'playlist',id:'PLEYgx5hMdopw'}).url,'https://www.youtube.com/playlist?list=PLEYgx5hMdopw&hl=en');assert.equal(safeThumbnail('https://i.ytimg.com.evil.example/vi/Q04sTEwC7Kg/hqdefault.jpg'),'');assert.equal(safeThumbnail('http://i.ytimg.com/vi/Q04sTEwC7Kg/hqdefault.jpg'),'');
});
test('refresh replaces only an untouched placeholder and keeps course identity and user choices',async()=>{
 const data=await importYouTube(link,async()=>html(fixture)),incoming=makeResource({...data,lessons:undefined},data.lessons);const old=makeResource({title:'spring boot finale',url:link,priority:5,notes:'My goal',folderPath:'Backend/Spring'});const result=refreshYouTubeCourse(old,incoming);assert.equal(result.id,old.id);assert.equal(result.title,old.title);assert.equal(result.priority,5);assert.equal(result.notes,'My goal');assert.equal(result.folderPath,'Backend/Spring');assert.equal(result.lessons.length,42);
 const withNotes=structuredClone(old);withNotes.lessons[0].notes='Do not lose this';const retained=refreshYouTubeCourse(withNotes,incoming);assert.equal(retained.lessons.length,43);assert.equal(retained.lessons.at(-1).notes,'Do not lose this');assert.equal(refreshYouTubeCourse(old,incoming,[old.lessons[0].id]).lessons.length,43);
});
test('refresh matches watch URLs with list params and preserves lesson progress, notes, pins, IDs and grouping',async()=>{
 const data=await importYouTube(link,async()=>html(fixture)),incoming=makeResource({...data,lessons:undefined},data.lessons);const old=makeResource({title:'Mine',url:link},[{title:'Old title',url:'https://www.youtube.com/watch?v=Q04sTEwC7Kg&list=PLEYgx5hMdopw',minutes:50,studiedMinutes:48,notes:'Question',pinned:true,modulePath:'My module'}]);const result=refreshYouTubeCourse(old,incoming);assert.equal(result.lessons.length,42);const l=result.lessons[0];assert.equal(l.id,old.lessons[0].id);assert.equal(l.studiedMinutes,48);assert.equal(l.minutes,48);assert.equal(l.notes,'Question');assert.equal(l.modulePath,'My module');assert.equal(l.pinned,true);assert.equal(refreshYouTubeCourse(result,incoming).lessons.length,42);
});
test('old backups get safe defaults and an older saving client preserves source metadata by ID',()=>{
 const previous=seedState();previous.resources[0].thumbnailUrl='https://i.ytimg.com/vi/Q04sTEwC7Kg/hqdefault.jpg';previous.resources[0].lessons[0].thumbnailUrl=previous.resources[0].thumbnailUrl;previous.resources[0].lessons[0].durationSeconds=480;const raw=structuredClone(previous);for(const r of raw.resources){delete r.thumbnailUrl;for(const l of r.lessons){delete l.thumbnailUrl;delete l.durationSeconds;delete l.durationEstimated;}}const parsed=stateSchema.parse(raw);assert.equal(parsed.resources[0].thumbnailUrl,'');preserveSourceMetadata(raw,parsed,previous);assert.equal(parsed.resources[0].thumbnailUrl,previous.resources[0].thumbnailUrl);assert.equal(parsed.resources[0].lessons[0].durationSeconds,480);
});
