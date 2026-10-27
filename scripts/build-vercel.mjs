import {build} from 'vite';
import {cp,copyFile,mkdir,rm} from 'node:fs/promises';
// This deployment deliberately uses the offline client. No Cloudflare Worker,
// account database, runtime secrets or local libraries are uploaded to Vercel.
await build({configFile:'vite.offline.config.ts',build:{outDir:'.vercel-dist',emptyOutDir:true}});
await copyFile('.vercel-dist/offline/index.html','.vercel-dist/index.html');
for(const name of ['favicon.svg','pdf.worker.min.mjs','sprout_buddy.svg','sprout_celebrate.svg'])await copyFile('public/'+name,'.vercel-dist/'+name);
await mkdir('.vercel-dist/downloads',{recursive:true});
await cp('public/downloads','.vercel-dist/downloads',{recursive:true});
// Only root index.html is needed for the standalone website.
await rm('.vercel-dist/offline',{recursive:true,force:true});
console.log('Vercel browser-local dashboard built. No account or device data included.');
