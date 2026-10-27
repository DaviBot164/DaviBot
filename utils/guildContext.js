const {AsyncLocalStorage}=require('node:async_hooks');
const model=require('../config/serverSettings');
const storage=new AsyncLocalStorage();
const legacy=model.legacy();
function current(){return storage.getStore()?.settings??legacy;}
function guildId(){return storage.getStore()?.guildId??null;}
function run(guild,settings,callback){return storage.run({guildId:typeof guild==='string'?guild:guild.id,settings},callback);}
async function withGuild(guild,callback){const settings=await require('../database/guildSettings').getSettings(guild);return run(guild,settings.value,callback);}
function scoped(key){return new Proxy({}, {get(_target,property){return current()[key]?.[property];},ownKeys(){return Reflect.ownKeys(current()[key]);},getOwnPropertyDescriptor(){return{enumerable:true,configurable:true};}});}
function enabled(name){return current().modules[name]!==false;}
function factionName(faction){return current().paths[faction]??faction;}
function serverText(value){const text=String(value);const settings=storage.getStore()?.settings??model.defaults('Community');if(settings.theme==='blood-moon')return text;return text.replace(/beneath the Blood Moon/giu,'in this community').replace(/under the Blood Moon/giu,'in this community').replace(/the Blood Moon/giu,'this community').replace(/BLOOD MOON/gu,settings.brand.server.toUpperCase()).replace(/Blood Moon/gu,settings.brand.server).replace(/Slayers 2/gu,'your community game').replace(/Slayer or Demon/gu,'Any path').replace(/Slayer/gu,settings.paths.slayer).replace(/Demon/gu,settings.paths.demon).replace(/SLAYER/gu,settings.paths.slayer.toUpperCase()).replace(/DEMON/gu,settings.paths.demon.toUpperCase()).replace(/Hashira/gu,settings.ranks.hashira).replace(/Upper Moon/gu,settings.ranks.upper_moon).replace(/Lower Moon/gu,settings.ranks.lower_moon).replace(/Mizunoe/gu,settings.ranks.mizunoe).replace(/Kinoe/gu,settings.ranks.kinoe).replace(/Shogun(?:ate)?/gu,'Owner').replace(/Daimyo/gu,'Administrator').replace(/Hatamoto/gu,'Moderator').replace(/Samurai/gu,'Staff').replace(/Moonbound/gu,'Newcomer').replace(/Crimson Bloom/gu,'Contributor').replace(/Bloodbound/gu,'Regular').replace(/Night Ascendant/gu,'Veteran').replace(/Eternal Moon/gu,'Legend');}

module.exports={current,guildId,run,withGuild,scoped,enabled,factionName,serverText};
