const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const [,,out,secs='9.8',fps='25',scheme='light']=process.argv;fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:470},deviceScaleFactor:2,colorScheme:scheme});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(`http://127.0.0.1:5190/record.html?scene=learning-space&fps=${fps}`);
for(let t=0;t<200;t++){if(await p.evaluate(()=>!!(window.__ready&&window.__stageshow&&window.__stageshow.clock)))break;await new Promise(r=>setTimeout(r,100));}
await p.evaluate(()=>window.__stageshow.clock.flushLayout());
const el=await p.$('.ss-stage');const n=Math.round(Number(secs)*Number(fps));
for(let i=0;i<n;i++){await p.evaluate(()=>window.__stageshow.clock.step(1));await el.screenshot({path:`${out}/f${String(i).padStart(4,'0')}.png`});}
console.log('frames',n,errs.join('\n'));await b.close();})();
