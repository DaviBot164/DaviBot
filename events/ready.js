const { Events } = require('discord.js');
const brand = require('../config/brand');

const {
    startMatchExpiryScheduler
} = require('../handlers/matchExpiryScheduler');

function safeDetail(value){
    let text=String(value??'').replace(/[\r\n\t]+/g,' ');
    for(const key of ['TOKEN','GROQ_API_KEY','NF_DAVIBOT_DATABASE_POSTGRES_URI']){
        const secret=process.env[key];if(secret)text=text.split(secret).join('[redacted]');
    }
    return text.replace(/(?:https?|postgres(?:ql)?):\/\/\S+/gi,'[redacted URL]')
        .replace(/(?:Bot|Bearer)\s+\S+|(?:gsk_|sk-)[A-Za-z0-9_-]+/g,'[redacted credential]').slice(0,300);
}
async function syncName(client){
    const target=brand.accountName??brand.name;
    if(client.user.username===target)return;
    try{
        await client.user.setUsername(target);
        console.log('Bot name synced:',target);
    }catch(error){
        const code=typeof error?.code==='number'?error.code:'unknown';
        const status=typeof error?.status==='number'?error.status:'unknown';
        const rows=error?.rawError?.errors?.username?._errors??error?.errors?.username?._errors;
        const details=Array.isArray(rows)?rows.slice(0,3).map(row=>({code:safeDetail(row?.code),message:safeDetail(row?.message)})):[];
        console.error('Bot name sync failed:',JSON.stringify({code,status,username:details}));
        console.error('Bot remains online with its current account name. No automatic retry in this process.');
    }
}

async function syncNickname(client){
    // Only the configured primary server; never rename the bot in every joined guild.
    const guildId=process.env.GUILD_ID;
    if(!guildId||!brand.nickname)return;
    const guild=client.guilds?.cache?.get(guildId);
    if(!guild){console.error('Bot nickname sync skipped: primary server is not cached.');return;}
    try{
        const member=guild.members.me??await guild.members.fetchMe();
        if(member.nickname===brand.nickname)return;
        await member.setNickname(brand.nickname,'Blood Moon bot branding');
        console.log('Bot server nickname synced:',brand.nickname);
    }catch(error){
        console.error('Bot nickname sync failed:',JSON.stringify({code:typeof error?.code==='number'?error.code:'unknown',status:typeof error?.status==='number'?error.status:'unknown'}));
    }
}

module.exports = {
    name: Events.ClientReady,
    once: true,

    execute(client) {
        console.log(`${brand.name} • ${brand.server}`);
        console.log(`Online as ${client.user.tag}`);
        console.log(`Commands: ${client.commands.size}`);
        void syncName(client);
        void syncNickname(client);

        if (process.env.NF_DAVIBOT_DATABASE_POSTGRES_URI) {
            startMatchExpiryScheduler(client);
        }
    }
};
