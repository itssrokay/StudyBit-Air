import {macScreenPacket,saveMacScreenSettings,ingestMacScreenTime} from '../lib/mac-screen-time.ts';
import {importYouTube,youtubeLink} from '../lib/youtube.ts';
import {createServer,type IncomingMessage,type ServerResponse} from 'node:http';import {readFileSync,writeFileSync,renameSync,existsSync,mkdirSync,chmodSync,statSync,realpathSync} from 'node:fs';import {join,resolve,extname} from 'node:path';import {networkInterfaces} from 'node:os';import {randomBytes,timingSafeEqual} from 'node:crypto';import {fileURLToPath,pathToFileURL} from 'node:url';import {stateSchema,seedState,preserveSourceMetadata,parseLibrary} from '../lib/learning.ts';
const own=fileURLToPath(new URL('.',import.meta.url));const project=existsSync(join(own,'www'))?own:resolve(own,'..');
export function startLanServer(options:{port?:number;host?:string;dataDir?:string;webRoot?:string;downloadRoot?:string;code?:string;macUsageDir?:string}={}){
 const dir=options.dataDir||join(project,'.local-learning'),webRoot=options.webRoot||join(project,existsSync(join(project,'www'))?'www':'.offline-dist'),downloads=options.downloadRoot||join(project,existsSync(join(project,'www/downloads'))?'www/downloads':'public/downloads');mkdirSync(dir,{recursive:true,mode:0o700});const codeFile=join(dir,'connection-code');let code=options.code||(existsSync(codeFile)?readFileSync(codeFile,'utf8').trim():randomBytes(32).toString('base64url'));if(!existsSync(codeFile)){writeFileSync(codeFile,code,{mode:0o600});}chmodSync(codeFile,0o600);const stateFile=join(dir,'library.json');
 const read=()=>{if(!existsSync(stateFile))return {revision:0,state:seedState()};const packet=JSON.parse(readFileSync(stateFile,'utf8'));return {revision:packet.revision,state:parseLibrary(packet.state)};};
 const write=(packet:unknown)=>{writeFileSync(stateFile+'.tmp',JSON.stringify(packet),{mode:0o600});renameSync(stateFile+'.tmp',stateFile);};
 const privateIP=(ip:string)=>{ip=ip.replace(/^::ffff:/,'');return ip==='::1'||ip.startsWith('127.')||/^10\./.test(ip)||/^192\.168\./.test(ip)||/^172\.(1[6-9]|2\d|3[01])\./.test(ip);};
 const json=(res:ServerResponse,value:unknown,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
 const server=createServer(async(req:IncomingMessage,res:ServerResponse)=>{
  try{
   const remote=req.socket.remoteAddress||'';if(!privateIP(remote))return json(res,{error:'Local network connections only.'},403);
   const host=(req.headers.host||'').split(':')[0];const ips=Object.values(networkInterfaces()).flat().filter(x=>x?.family==='IPv4').map(x=>x!.address);if(!['localhost','127.0.0.1',...ips].includes(host))return json(res,{error:'Invalid host.'},403);
   const origin=req.headers.origin;if(origin){const u=new URL(origin);if(!privateIP(u.hostname)&&u.hostname!=='localhost')return json(res,{error:'Invalid origin.'},403);res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','GET,PUT,OPTIONS');}if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
   const url=new URL(req.url||'/','http://'+req.headers.host),path=url.pathname;
   if(path==='/api/screen-time'){
    if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(remote)||(origin&&new URL(origin).origin!==url.origin))return json(res,{error:'Open screen time on this computer.'},403);
    if(req.method==='GET'){try{return json(res,macScreenPacket(options.macUsageDir));}catch{return json(res,{error:'Mac usage file could not be read.'},400);}}
    if(req.method!=='PUT'||!origin||new URL(origin).origin!==url.origin)return json(res,{error:'Invalid request.'},403);
    let raw='';for await(const chunk of req){raw+=chunk.toString();if(Buffer.byteLength(raw)>150000)return json(res,{error:'Settings too large.'},413);}
    try{return json(res,{settings:saveMacScreenSettings(JSON.parse(raw).settings,options.macUsageDir)});}catch{return json(res,{error:'Invalid screen-time settings.'},400);}
   }
   if(path==='/api/import'){
    if(req.method!=='POST')return json(res,{error:'Method not allowed.'},405);
    if(!origin||new URL(origin).origin!==url.origin)return json(res,{error:'Open imports on this computer’s learning dashboard.'},403);
    let raw='';for await(const chunk of req){raw+=chunk.toString();if(Buffer.byteLength(raw)>4000)return json(res,{error:'Link is too long.'},413);}
    try{const input=JSON.parse(raw);if(typeof input.url!=='string'||input.url.length>2000||!youtubeLink(input.url))return json(res,{error:'Use a YouTube playlist or video link.'},400);return json(res,await importYouTube(input.url));}catch(e){return json(res,{error:(e as Error).message||'YouTube could not be reached.'},502);}
   }
   if(path==='/lan/setup'){
    if(origin&&new URL(origin).origin!==url.origin)return json(res,{error:'Open connection setup on this computer.'},403);
    if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(remote))return json(res,{error:'Open Settings on the computer to get its connection code.'},403);
    const port=(server.address() as {port:number}).port;return json(res,{code,addresses:ips.filter(ip=>privateIP(ip)&&!ip.startsWith('127.')).map(ip=>'http://'+ip+':'+port)});
   }
   if(path.startsWith('/lan/')){
    const supplied=(req.headers.authorization||'').replace(/^Bearer /,'');const a=Buffer.from(supplied),b=Buffer.from(code);if(a.length!==b.length||!timingSafeEqual(a,b))return json(res,{error:'Connection code required.'},401);
    if(path!=='/lan/state')return json(res,{error:'Not found.'},404);
    if(req.method==='GET'){const packet=read();const next=ingestMacScreenTime(packet.state,options.macUsageDir);if(next!==packet.state){packet.state=next;packet.revision++;write(packet);}return json(res,packet);}if(req.method!=='PUT')return json(res,{error:'Method not allowed.'},405);
    let raw='';for await(const chunk of req){raw+=chunk.toString();if(Buffer.byteLength(raw)>4000000){json(res,{error:'Library exceeds 4 MB.'},413);req.destroy();return;}}
    let data;try{data=JSON.parse(raw);}catch{return json(res,{error:'Invalid JSON.'},400);}const parsed=stateSchema.safeParse(data.state);if(!parsed.success||!Number.isInteger(data.revision)||data.revision<0)return json(res,{error:'Invalid library.'},400);const old=read();if(old.revision!==data.revision)return json(res,{error:'The computer library changed. Sync again.'},409);preserveSourceMetadata(data.state,parsed.data,old.state);if(data.state.activityRemovals===undefined)parsed.data.activityRemovals=old.state.activityRemovals;if(data.state.coach===undefined)parsed.data.coach=old.state.coach;else {if(data.state.coach.sessions===undefined)parsed.data.coach.sessions=old.state.coach.sessions;if(data.state.coach.autoReviews===undefined)parsed.data.coach.autoReviews=old.state.coach.autoReviews;}if(data.state.settings.theme===undefined)parsed.data.settings.theme=old.state.settings.theme;const packet={state:parseLibrary(parsed.data),revision:old.revision+1};write(packet);return json(res,{revision:packet.revision});
   }
   if(req.method!=='GET'&&req.method!=='HEAD')return json(res,{error:'Method not allowed.'},405);
   const root=path.startsWith('/downloads/')?downloads:webRoot;let relative=path.startsWith('/downloads/')?path.slice('/downloads/'.length):path.replace(/^\//,'');if(!relative)relative='index.html';const file=resolve(root,decodeURIComponent(relative));if(!file.startsWith(resolve(root)+'/')||!existsSync(file)||!statSync(file).isFile())return json(res,{error:'Not found.'},404);
   const mime:Record<string,string>={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.apk':'application/vnd.android.package-archive','.zip':'application/zip'};res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:readFileSync(file));
  }catch{if(!res.headersSent)json(res,{error:'Could not process the request. The saved library is unchanged.'},500);else res.end();}
 });server.listen(options.port??5180,options.host||'0.0.0.0');return server;
}
if(process.argv[1]&&existsSync(process.argv[1])&&import.meta.url===pathToFileURL(realpathSync(process.argv[1])).href){const server=startLanServer({port:Number(process.env.LEARNING_LAN_PORT||5180)});server.on('listening',()=>console.log('Learning Space Wi-Fi server: http://localhost:'+(server.address() as {port:number}).port+' · Open Settings to pair your phone.'));server.on('error',e=>{console.error('Could not start Wi-Fi server:',e.message);process.exitCode=1;});}
