/** Await all pending snapshots, including edits made during an earlier write. */
export function createSaveCoordinator(write:()=>Promise<boolean>,pending:()=>boolean){
 let active:Promise<boolean>|null=null;
 function flush():Promise<boolean>{
  if(active)return active;
  const run=async()=>{do{if(!await write())return false;}while(pending());return true;};
  active=run().finally(()=>{active=null;});return active;
 }
 return flush;
}
