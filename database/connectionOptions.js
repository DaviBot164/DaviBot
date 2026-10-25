// Never log or embed the connection URI in errors.
function connectionOptions(env=process.env){
 const original=env.NF_DAVIBOT_DATABASE_POSTGRES_URI;
 let connectionString=original;
 if(original){
  let uri;try{uri=new URL(original);}catch{throw Error('Invalid PostgreSQL connection URI. Check the secret environment variable.');}
  if(!['postgres:','postgresql:'].includes(uri.protocol))throw Error('Unsupported PostgreSQL connection URI protocol.');
  // Make the current verified behavior explicit before pg changes legacy mode semantics.
  if(['prefer','require','verify-ca'].includes(uri.searchParams.get('sslmode'))){
   uri.searchParams.set('sslmode','verify-full');connectionString=uri.toString();
  }
 }
 return {connectionString,ssl:env.NODE_ENV==='production'?{rejectUnauthorized:true}:false};
}
module.exports={connectionOptions};
