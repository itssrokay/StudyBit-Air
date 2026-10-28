import test from 'node:test';import assert from 'node:assert/strict';
import {previewRequest,parseXOembed,parseHtmlPreview,snippet,decodeEntities} from '../lib/link-preview.ts';
import {captureTitle} from '../lib/capture.ts';
test('X links go to the public oEmbed endpoint with a clean status URL',()=>{
 const r=previewRequest('https://twitter.com/karpathy/status/1617979122625712128?s=20&t=abc');
 assert.equal(r.kind,'x');assert.equal(r.url,'https://x.com/karpathy/status/1617979122625712128');
 assert.match(r.endpoint,/^https:\/\/publish\.twitter\.com\/oembed\?omit_script=1&dnt=true&url=https%3A%2F%2Fx\.com%2Fkarpathy%2Fstatus%2F1617979122625712128$/);
 assert.equal(previewRequest('https://example.com/post').kind,'page');
});
test('oEmbed becomes “@handle: first sentence” with the full post as text',()=>{
 const body=JSON.stringify({author_name:'Andrej Karpathy',author_url:'https://twitter.com/karpathy',html:'<blockquote class="twitter-tweet"><p lang="en" dir="ltr">The hottest new programming language is English. It&#39;s also the oldest &amp; <a href="https://twitter.com/hashtag/AI">#AI</a><br>Second line <a href="https://t.co/xyz">https://t.co/xyz</a> <a href="https://t.co/p">pic.twitter.com/abc</a></p>&mdash; Andrej Karpathy (@karpathy) <a href="https://twitter.com/karpathy/status/1">January 24, 2023</a></blockquote>'});
 const p=parseXOembed(body,'https://x.com/karpathy/status/1');
 assert.equal(p.title,'@karpathy: The hottest new programming language is English.');
 assert.equal(p.excerpt,'The hottest new programming language is English. It\'s also the oldest & #AI\nSecond line');
 assert.equal(p.author,'Andrej Karpathy');
});
test('media-only posts fall back to the author',()=>{
 const p=parseXOembed(JSON.stringify({author_name:'NASA',author_url:'https://twitter.com/NASA',html:'<blockquote><p><a href="https://t.co/q">pic.twitter.com/q</a></p></blockquote>'}),'');
 assert.equal(p.title,'Post by NASA (@NASA)');assert.equal(parseXOembed('not json',''),null);
});
test('pages use Open Graph, then <title>',()=>{
 assert.equal(parseHtmlPreview('<head><meta content="How Transformers Work" property="og:title"><meta property="og:site_name" content="Blog"><title>x</title></head>','https://e.com/a').title,'How Transformers Work');
 const p=parseHtmlPreview('<title> Big O &amp; you | Site </title>','https://www.e.com/a');assert.equal(p.title,'Big O & you | Site');assert.equal(p.site,'e.com');
 assert.equal(parseHtmlPreview('<p>no title</p>','https://e.com'),null);
});
test('helpers',()=>{
 assert.equal(decodeEntities('&#x1F600; &#8217; &hellip;'),'😀 ’ …');
 assert.equal(snippet('word '.repeat(60)).length<=100,true);
 assert.equal(captureTitle('https://x.com/naval/status/123456'),'Post by @naval');
});
import {resolvePreview,fullPostRequest,looksTruncated} from '../lib/link-preview.ts';
test('cut-off long posts are upgraded to the full text',async()=>{
 const url='https://x.com/fardeentwt/status/2115416659884441711';
 assert.equal(fullPostRequest(url).endpoint,'https://api.fxtwitter.com/fardeentwt/status/2115416659884441711');
 assert.ok(looksTruncated('how do people even live like this, if i…'));
 const full='i cant imagine living with a person who has no purpose in life\n\nhow do people even live like this, if i wake up and i dont have a purpose\n\nblessed are those who wake up every day and have a goal to work toward';
 const seen=[];
 const p=await resolvePreview({url,kind:'x',endpoint:'oembed'},async r=>{seen.push(r.kind);return r.kind==='x'?{text:JSON.stringify({author_name:'fardeen',author_url:'https://twitter.com/fardeentwt',html:'<blockquote><p>i cant imagine living with a person who has no purpose in life<br><br>how do people even live like this, if i…</p>&mdash; fardeen</blockquote>'})}:{text:JSON.stringify({tweet:{text:full,author:{name:'fardeen',screen_name:'fardeentwt'}}})};});
 assert.deepEqual(seen,['x','x-full']);assert.equal(p.excerpt,full);assert.equal(p.author,'fardeen');
 assert.equal(p.title,'@fardeentwt: i cant imagine living with a person who has no purpose in life');
});
test('short posts make one request only',async()=>{
 const seen=[];await resolvePreview({url:'https://x.com/a/status/12345',kind:'x',endpoint:''},async r=>{seen.push(r.kind);return {text:JSON.stringify({author_name:'A',author_url:'https://twitter.com/a',html:'<blockquote><p>Short and complete.</p></blockquote>'})};});
 assert.deepEqual(seen,['x']);
});
