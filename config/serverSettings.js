// Guild-independent schema. Legacy values are imported only for the primary-guild seed.
const channelKeys=Object.freeze(['welcome','verification','sacredLaws','moonGuide','roles','announcements','general','soulProgression','slayers2','factionProgression','rankPromotions','pvp','training','supportGuide','openTicket','staffChat','staffLogs','moderation','botControl']);
const roleKeys=Object.freeze(['shogun','daimyo','hatamoto','samurai','hashira','kinoe','mizunoe','slayer','upperMoon','lowerMoon','demon','eternalMoon','nightAscendant','bloodbound','crimsonBloom','moonbound','kanoto','tsuchinoe','rogue','tsuyoi']);
const moduleKeys=Object.freeze(['welcome','moderation','progression','learning','conversation','tickets','matches','trials','logging']);
const rankKeys=Object.freeze(['slayer','mizunoe','kinoe','hashira','demon','lower_moon','upper_moon','kanoto','tsuchinoe','rogue','tsuyoi']);
const pageKeys=Object.freeze(['sacred_laws','moon_guide','verification_guide','role_guide','game_guide','support_guide']);
const plain=(s,max,allowBlank=false)=>{if(typeof s!=='string'||s.length>max||!allowBlank&&!s.trim()||/[<>`]|(?:gsk_|sk-)[\w-]{12,}|(?:token|password|api[_ ]?key)\s*[:=]/iu.test(s))throw Error('Invalid text');return s.trim();};
const id=v=>{if(v===null||v==='')return null;if(typeof v!=='string'||!/^\d{16,22}$/u.test(v))throw Error('Invalid Discord ID');return v;};
function defaults(name='Community'){return {version:1,theme:'neutral',brand:{name:'Kitsune',server:String(name).slice(0,60),color:'#b87948',footer:'Kitsune • Community'},channels:Object.fromEntries(channelKeys.map(k=>[k,null])),roles:Object.fromEntries(roleKeys.map(k=>[k,null])),modules:Object.fromEntries(moduleKeys.map(k=>[k,true])),progression:{extended:false},paths:{slayer:'Path One',demon:'Path Two'},ranks:{slayer:'Beginner',mizunoe:'Regular',kinoe:'Veteran',hashira:'Champion',demon:'Beginner',lower_moon:'Veteran',upper_moon:'Champion',kanoto:'Skilled',tsuchinoe:'Advanced',rogue:'Initiate',tsuyoi:'Experienced'},welcome:{mode:'custom',image:null,title:'Welcome to {server}',subtitle:'Make yourself at home.',message:'Welcome, {user}! Glad you are here.',background:'#172c24',accent:'#c6834b'},pages:{}};}
function legacy(){const v=defaults('Blood Moon'),brand=require('./legacy/brand');return {...v,theme:'blood-moon',brand:{name:brand.name,server:brand.server,color:'#9b1c31',footer:brand.footer},channels:{...v.channels,...require('./legacy/channels')},roles:{...v.roles,...require('./legacy/roles')},paths:{slayer:'Slayer',demon:'Demon'},ranks:{kanoto:'Kanoto',tsuchinoe:'Tsuchinoe',rogue:'Rogue',tsuyoi:'Tsuyoi',slayer:'Slayer',mizunoe:'Mizunoe',kinoe:'Kinoe',hashira:'Hashira',demon:'Demon',lower_moon:'Lower Moon',upper_moon:'Upper Moon'},welcome:{...v.welcome,mode:'legacy'}};}
function validate(value,guildName='Community'){
 if(!value||typeof value!=='object'||Array.isArray(value)||JSON.stringify({...value,welcome:{...value.welcome,image:undefined}}).length>24000)throw Error('Invalid server settings');
 const out=defaults(guildName);out.theme=value.theme==='blood-moon'?'blood-moon':'neutral';if(out.theme==='blood-moon')Object.assign(out.ranks,{kanoto:'Kanoto',tsuchinoe:'Tsuchinoe',rogue:'Rogue',tsuyoi:'Tsuyoi'});if(value.progression?.extended!==undefined){if(typeof value.progression.extended!=='boolean')throw Error('Invalid progression mode');out.progression.extended=value.progression.extended;}
 for(const k of ['name','server','footer'])if(value.brand?.[k]!==undefined)out.brand[k]=plain(value.brand[k],k==='footer'?100:60);
 const color=v=>{if(typeof v!=='string'||!/^#[a-f0-9]{6}$/iu.test(v))throw Error('Invalid color');return v.toLowerCase();};
 if(value.brand?.color!==undefined)out.brand.color=color(value.brand.color);
 for(const k of channelKeys)if(value.channels?.[k]!==undefined)out.channels[k]=id(value.channels[k]);
 for(const k of roleKeys)if(value.roles?.[k]!==undefined)out.roles[k]=id(value.roles[k]);
 for(const k of moduleKeys)if(value.modules?.[k]!==undefined){if(typeof value.modules[k]!=='boolean')throw Error('Invalid module toggle');out.modules[k]=value.modules[k];}
 for(const k of ['slayer','demon'])if(value.paths?.[k]!==undefined)out.paths[k]=plain(value.paths[k],30);
 for(const k of rankKeys)if(value.ranks?.[k]!==undefined)out.ranks[k]=plain(value.ranks[k],30);
 for(const [k,max]of [['title',70],['subtitle',120],['message',700]])if(value.welcome?.[k]!==undefined)out.welcome[k]=plain(value.welcome[k],max);
 for(const k of ['background','accent'])if(value.welcome?.[k]!==undefined)out.welcome[k]=color(value.welcome[k]);
 if(value.welcome?.image!=null)out.welcome.image=require('../utils/welcomeImage').validateImage(value.welcome.image);
 out.welcome.mode=value.welcome?.mode==='image'?'image':value.welcome?.mode==='legacy'&&out.theme==='blood-moon'?'legacy':'custom';if(out.welcome.mode==='image'&&!out.welcome.image)throw Error('Choose an image first.');
 for(const k of pageKeys)if(value.pages?.[k])out.pages[k]={title:plain(value.pages[k].title,100),description:plain(value.pages[k].description,2000)};
 return out;
}
module.exports={channelKeys,roleKeys,moduleKeys,rankKeys,pageKeys,defaults,legacy,validate};
