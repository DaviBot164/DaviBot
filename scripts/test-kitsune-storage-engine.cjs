'use strict';
// Embedded PostgreSQL only. Never imports credentials or connects to a server.
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const {createRequire}=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const projectRequire=createRequire(path.join(process.env.KITSUNE_VERIFY_PROJECT??root,'package.json'));
async function main(){
 let PGlite;
 try{({PGlite}=projectRequire('@electric-sql/pglite'));}
 catch(error){throw new Error('Embedded PostgreSQL verification needs the existing dev dependency. Run npm install --include=dev in the bot folder, then run this installer again. No source files changed.');}
 const db=new PGlite();let legacy=true,count=0;
 const original=Module._load,repoPath=path.join(root,'database/migrateKitsuneStorage.js');
 const schemaNames=['schema','playerSchema','trainingPanels','questSchema','matchSchema','kitsuneLearningSchema'];
 const allowed=new Set(schemaNames.map(name=>path.join(root,'database',name+'.js')));
 const connection={query:async sql=>db.exec(legacy?sql.replaceAll('kitsune','akane'):sql),pool:{connect:async()=>({release(){},query:async(text,values=[])=>text.startsWith('SELECT pg_advisory')?{rows:[]}:db.query(text,values)})}};
 Module._load=function(request,parent){if((allowed.has(parent?.filename)||parent?.filename===repoPath)&&request==='./connection')return connection;return original.apply(this,arguments);};
 try{
  const schemas=schemaNames.map(name=>require(path.join(root,'database',name)));
  const init=async()=>{for(const schema of schemas)await Object.values(schema)[0]();};
  const migrate=require(repoPath).migrateKitsuneStorage;
  await init();
  await db.exec("INSERT INTO akane_users(guild_id,user_id,xp,level,messages,faction,rank,rank_points) VALUES('g','u',777,42,100,'slayer','slayer',7)");
  await db.exec("INSERT INTO akane_titles(guild_id,user_id,title_id,equipped) VALUES('g','u','moonbound',TRUE)");
  await db.exec("INSERT INTO akane_learned_phrases(guild_id,phrase,intent,taught_by) VALUES('g','moonfox greeting','hello','owner')");
  await db.exec("INSERT INTO akane_unknown_phrases(guild_id,phrase,expires_at) VALUES('g','unfamiliar phrase',NOW()+INTERVAL '1 day')");
  await db.exec("CREATE TABLE akane_rename_probe(id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,guild_id TEXT NOT NULL,user_id TEXT NOT NULL,FOREIGN KEY(guild_id,user_id) REFERENCES akane_users(guild_id,user_id)); CREATE INDEX idx_akane_rename_probe_user ON akane_rename_probe(user_id); INSERT INTO akane_rename_probe(guild_id,user_id) VALUES('g','u')");
  const before=(await db.query('SELECT * FROM akane_users')).rows;
  const title=(await db.query('SELECT * FROM akane_titles')).rows;
  const result=await migrate();assert.ok(result.tables>10);count++;
  assert.deepEqual((await db.query('SELECT * FROM kitsune_users')).rows,before);count++;
  assert.deepEqual((await db.query('SELECT * FROM kitsune_titles')).rows,title);count++;
  assert.equal((await db.query('SELECT intent FROM kitsune_learned_phrases')).rows[0].intent,'hello');count++;
  assert.equal((await db.query('SELECT phrase FROM kitsune_unknown_phrases')).rows[0].phrase,'unfamiliar phrase');count++;
  const second=await db.query("INSERT INTO kitsune_rename_probe(guild_id,user_id) VALUES('g','u') RETURNING id");
  assert.equal(Number(second.rows[0].id),2);count++;
  await assert.rejects(db.query("INSERT INTO kitsune_rename_probe(guild_id,user_id) VALUES('g','missing')"));count++;
  const oldObjects=await db.query("SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=current_schema() AND strpos(c.relname,'akane')>0");
  assert.equal(oldObjects.rows.length,0);count++;
  assert.deepEqual(await migrate(),{tables:0,constraints:0,indexes:0,sequences:0});count++;
  legacy=false;await init();
  assert.deepEqual((await db.query('SELECT * FROM kitsune_users')).rows,before);count++;
  assert.equal((await db.query('SELECT count(*)::integer AS count FROM kitsune_titles')).rows[0].count,1);count++;
  await db.exec('CREATE TABLE akane_conflict(id INTEGER); CREATE TABLE kitsune_conflict(id INTEGER)');
  await assert.rejects(migrate(),/conflict/);count++;
  assert.ok((await db.query("SELECT to_regclass('akane_conflict') AS name")).rows[0].name);count++;
  assert.ok((await db.query("SELECT to_regclass('kitsune_conflict') AS name")).rows[0].name);count++;
  console.log(count+' embedded PostgreSQL storage migration checks passed. Progress, titles, learned phrases, foreign keys and identity sequences preserved. No server connection.');
 }finally{Module._load=original;await db.close();}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
