import {build} from 'vite';import {mkdir,copyFile,cp,rm} from 'node:fs/promises';
await build({configFile:'vite.offline.config.ts'});await copyFile('.offline-dist/offline/index.html','.offline-dist/index.html');for(const name of ['favicon.svg','pdf.worker.min.mjs','sprout_buddy.svg','sprout_celebrate.svg'])await copyFile('public/'+name,'.offline-dist/'+name);
await mkdir('.offline-dist/downloads',{recursive:true});await copyFile('public/downloads/course-template.json','.offline-dist/downloads/course-template.json');
await rm('android-companion/assets/dashboard',{recursive:true,force:true});await mkdir('android-companion/assets/dashboard',{recursive:true});await cp('.offline-dist','android-companion/assets/dashboard',{recursive:true});
await build({configFile:false,ssr:{noExternal:['zod']},build:{ssr:'scripts/lan-server.ts',outDir:'.local-tools',emptyOutDir:true,target:'node22',rollupOptions:{output:{entryFileNames:'server.mjs'}}}});
console.log('Offline dashboard embedded; portable Wi-Fi server built.');
