'use strict';
// Historical source names are used only here to preserve existing stored data.
const {pool}=require('./connection');
const OLD='akane',NEW='kitsune';
const quote=value=>'"'+String(value).replace(/"/g,'""')+'"';
const qualified=(schema,name)=>quote(schema)+'.'+quote(name);
const renamed=name=>name.split(OLD).join(NEW);
async function migrateKitsuneStorage(){
 const client=await pool.connect();
 const stats={tables:0,constraints:0,indexes:0,sequences:0};
 const query=(text,values=[])=>client.query(text,values);
 try{
  await query('BEGIN');
  try{
   await query("SET LOCAL lock_timeout = '5s'");
   await query("SET LOCAL statement_timeout = '30s'");
   await query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",['kitsune:storage-rename:v1']);
   const schema=(await query('SELECT current_schema() AS name')).rows[0]?.name;
   if(!schema)throw new Error('No database schema is available for the storage migration.');
   const available=async name=>(await query('SELECT to_regclass($1) AS object',[qualified(schema,name)])).rows[0]?.object;
   const tables=(await query(
    "SELECT c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=$1 AND c.relkind IN ('r','p') AND left(c.relname,length($2))=$2 ORDER BY c.relname",
    [schema,OLD+'_'])).rows;
   // Fail before renaming anything if both namespaces already contain the same table.
   for(const row of tables)if(await available(renamed(row.name)))throw new Error('Storage rename conflict: '+renamed(row.name)+'. Existing tables were not merged or overwritten.');
   for(const row of tables){
    await query('ALTER TABLE '+qualified(schema,row.name)+' RENAME TO '+quote(renamed(row.name)));
    stats.tables++;
   }
   const constraints=(await query(
    "SELECT c.conname AS name,t.relname AS table_name FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname=$1 AND left(t.relname,length($2))=$2 AND strpos(c.conname,$3)>0 ORDER BY t.relname,c.conname",
    [schema,NEW+'_',OLD])).rows;
   for(const row of constraints){
    await query('ALTER TABLE '+qualified(schema,row.table_name)+' RENAME CONSTRAINT '+quote(row.name)+' TO '+quote(renamed(row.name)));
    stats.constraints++;
   }
   // Constraint-backed indexes have already followed their renamed constraints.
   const indexes=(await query(
    "SELECT c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_index i ON i.indexrelid=c.oid JOIN pg_class t ON t.oid=i.indrelid WHERE n.nspname=$1 AND left(t.relname,length($2))=$2 AND strpos(c.relname,$3)>0 ORDER BY c.relname",
    [schema,NEW+'_',OLD])).rows;
   for(const row of indexes){
    if(await available(renamed(row.name)))throw new Error('Storage index rename conflict: '+renamed(row.name));
    await query('ALTER INDEX '+qualified(schema,row.name)+' RENAME TO '+quote(renamed(row.name)));
    stats.indexes++;
   }
   const sequences=(await query(
    "SELECT DISTINCT s.relname AS name FROM pg_class s JOIN pg_namespace n ON n.oid=s.relnamespace JOIN pg_depend d ON d.objid=s.oid AND d.classid='pg_class'::regclass AND d.refclassid='pg_class'::regclass JOIN pg_class t ON t.oid=d.refobjid WHERE s.relkind='S' AND d.deptype IN ('a','i') AND n.nspname=$1 AND left(t.relname,length($2))=$2 AND strpos(s.relname,$3)>0 ORDER BY name",
    [schema,NEW+'_',OLD])).rows;
   for(const row of sequences){
    if(await available(renamed(row.name)))throw new Error('Storage sequence rename conflict: '+renamed(row.name));
    await query('ALTER SEQUENCE '+qualified(schema,row.name)+' RENAME TO '+quote(renamed(row.name)));
    stats.sequences++;
   }
   await query('COMMIT');
   return stats;
  }catch(error){
   await query('ROLLBACK').catch(()=>{});
   throw error;
  }
 }finally{client.release();}
}
module.exports={migrateKitsuneStorage};
