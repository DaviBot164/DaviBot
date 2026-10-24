'use strict';
// Read-only source inventory. No module execution, credentials, DB or Discord access.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const files=[];
function walk(dir){for(const row of fs.readdirSync(dir,{withFileTypes:true})){
 if(['node_modules','.git','scripts','docs'].includes(row.name)||row.name.startsWith('.'))continue;
 const file=path.join(dir,row.name);if(row.isDirectory())walk(file);else if(row.name.endsWith('.js'))files.push(file);
}}
walk(root);
const relative=file=>path.relative(root,file).split(path.sep).join('/');
const edges=new Map(),groups=new Map(),missing=[];
const commands=new Map(),events=new Map(),collisions=[];
for(const file of files){
 const source=fs.readFileSync(file,'utf8'),key=relative(file);
 const hash=crypto.createHash('sha256').update(source.replace(/\r\n/g,'\n').trim()).digest('hex');
 groups.set(hash,[...(groups.get(hash)||[]),key]);
 const refs=[];
 for(const match of source.matchAll(/require\(['"](\.[^'"]+)['"]\)/g)){
  const base=path.resolve(path.dirname(file),match[1]);
  const dest=[base,base+'.js',path.join(base,'index.js')].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
  if(dest)refs.push(dest);else missing.push({file:key,request:match[1]});
 }
 edges.set(file,refs);
 const add=(map,name)=>{if(!name)return;if(map.has(name))collisions.push({name,files:[map.get(name),key]});else map.set(name,key);};
 if(key.startsWith('commands/'))add(commands,source.match(/\.setName\(\s*['"]([^'"]+)['"]\s*\)/)?.[1]);
 if(key.startsWith('events/'))add(events,source.match(/name:\s*Events\.(\w+)/)?.[1]);
}
const roots=files.filter(file=>{const key=relative(file);return ['index.js','deploy-commands.js'].includes(key)||key.startsWith('commands/')||key.startsWith('events/');});
const seen=new Set(),queue=[...roots];while(queue.length){const file=queue.pop();if(seen.has(file))continue;seen.add(file);queue.push(...(edges.get(file)||[]));}
const result={runtimeFiles:files.length,reachable:files.filter(file=>seen.has(file)).length,commands:commands.size,events:events.size,identicalFiles:[...groups.values()].filter(x=>x.length>1),unreferencedCandidates:files.filter(file=>!seen.has(file)).map(relative),missingLocalRequires:missing,duplicateRegistrations:collisions};
console.log(JSON.stringify(result,null,2));
console.log('Read-only static audit. Dynamic loading may need manual review; candidates are never auto-deleted.');
if(missing.length||collisions.length)process.exitCode=1;
