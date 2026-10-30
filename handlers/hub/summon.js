'use strict';
const cooldowns=new Map(),COOLDOWN=15000,MAX=2000;
function addressed(content,botId){
 const text=String(content??'').trim();
 return new RegExp('^(?:kitsune|kitsu|kit|<@!?'+botId+'>)(?:[\\s,!?.]+(?:hi|hello|hey|help|menu|play))?[\\s!?.]*$','iu').test(text);
}
async function handle(message){
 if(!message.inGuild()||message.author.bot||message.webhookId||!require('../../utils/guildContext').enabled('conversation')||!addressed(message.content,message.client.user.id))return false;
 const key=message.guild.id+':'+message.author.id,now=Date.now();
 if((cooldowns.get(key)??0)>now)return true;
 if(cooldowns.size>=MAX){for(const[k,until]of cooldowns)if(until<=now)cooldowns.delete(k);if(cooldowns.size>=MAX)cooldowns.delete(cooldowns.keys().next().value);}
 cooldowns.set(key,now+COOLDOWN);
 const payload=require('./panel').buildPanel({guildId:message.guild.id});
 payload.embeds[0].setDescription('I’m here. Pick a topic below; your next menu opens privately.');
 await message.reply({...payload,allowedMentions:{parse:[],repliedUser:false}});
 return true;
}
module.exports={handle,addressed};
