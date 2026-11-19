import test from 'node:test';import assert from 'node:assert/strict';
import {seedState,parseLibrary,makeResource} from '../lib/learning.ts';
import {collectSaves,smartThemes,prepareThemesAI,themesFromAI,saveThemes,themeSet,newSince} from '../lib/themes.ts';
const at=(d)=>`2026-11-${d}T10:00:00.000Z`;
function lib(){const s=seedState();
 s.inbox=[
  {id:'a',workspace:'personal',text:'How Kafka stores messages https://x.com/a/status/1',createdAt:at(10),status:'inbox',source:'shared'},
  {id:'b',workspace:'personal',text:'Idea: build a small API this weekend with python',createdAt:at(11),status:'inbox',source:'typed'},
  {id:'c',workspace:'personal',text:'Already handled https://example.com/x',createdAt:at(12),status:'filed',source:'shared'},
  {id:'d',workspace:'work',text:'Work only note',createdAt:at(13),status:'inbox',source:'typed'}];
 s.resources=[makeResource({id:'r1',title:'System design primer',kind:'article',folderPath:'Tech',url:'https://github.com/donnemartin/system-design-primer'},[{title:'Read',minutes:10}]),...s.resources];
 s.resources[0].createdAt=at(14);
 return parseLibrary(s);}

test('collects inbox captures to review and unread readings for one workspace, newest first',()=>{
 const items=collectSaves(lib(),'personal');
 assert.deepEqual(items.map(i=>i.id),['r:r1','c:b','c:a']);
 assert.equal(items[2].host,'x.com');assert.equal(items[0].category,'Tech');
});
test('on-device grouping clubs by topic and puts singletons in Other',()=>{
 const g=smartThemes(collectSaves(lib(),'personal'));
 const tech=g.find(x=>x.title==='Tech');assert.ok(tech&&tech.itemIds.length>=2);
 assert.ok(g.every(x=>x.itemIds.length>=1));
});
test('AI request numbers items instead of sending IDs, and asks for a strict schema',()=>{
 const items=collectSaves(lib(),'personal');const {body}=prepareThemesAI({items,goals:['Crack system design']});
 assert.equal(body.text.format.strict,true);
 const input=JSON.parse(body.input);assert.deepEqual(input.items.map(i=>i.n),[1,2,3]);
 assert.ok(!body.input.includes('r:r1'));assert.match(body.instructions,/untrusted/);
});
test('AI result: unknown numbers, duplicates and one-item themes are dropped; leftovers go to Other',()=>{
 const items=collectSaves(lib(),'personal');
 const g=themesFromAI({themes:[{title:'Backend systems',summary:'s',next:'n',items:[1,3,3,99]},{title:'Solo',summary:'',next:'',items:[2]},{title:'Dup',summary:'',next:'',items:[1,3]}]},items);
 assert.deepEqual(g.map(x=>x.title),['Backend systems','Other saves']);
 assert.deepEqual(g[0].itemIds,['r:r1','c:a']);assert.deepEqual(g[1].itemIds,['c:b']);
});
test('a bad AI payload throws instead of saving nonsense',()=>{
 assert.throws(()=>themesFromAI({themes:'nope'},[]));
});
test('themes are saved per workspace and count new saves since grouping',()=>{
 let s=lib();const items=collectSaves(s,'personal');
 s=saveThemes(s,{workspace:'personal',at:at(15),source:'smart',seen:items.slice(1).map(i=>i.id),groups:smartThemes(items)});
 s=parseLibrary(s);
 assert.equal(themeSet(s,'personal').source,'smart');assert.equal(themeSet(s,'work'),null);
 assert.equal(newSince(themeSet(s,'personal'),items),1);
});
test('on-device fallback recognises common saved topics (system design, career)',()=>{
 const mk=(id,title,url='')=>({id,kind:'capture',title,text:'',host:'',url,createdAt:at(10),category:''});
 const g=smartThemes([mk('c:1','How Kafka stores messages','https://x.com/a/1'),mk('c:2','Consistent hashing explained'),mk('c:3','Build a tiny rate limiter'),mk('c:4','Salary negotiation thread','https://x.com/b/2'),mk('c:5','Ask manager about on-call')]);
 assert.deepEqual(g.map(x=>[x.title,x.itemIds.length]),[['System design',3],['Career',2]]);
});
