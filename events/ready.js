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
    if(client.user.username===brand.name)return;
    try{
        await client.user.setUsername(brand.name);
        console.log('Bot name synced:',brand.name);
    }catch(error){
        const code=typeof error?.code==='number'?error.code:'unknown';
        const status=typeof error?.status==='number'?error.status:'unknown';
        const rows=error?.rawError?.errors?.username?._errors??error?.errors?.username?._errors;
        const details=Array.isArray(rows)?rows.slice(0,3).map(row=>({code:safeDetail(row?.code),message:safeDetail(row?.message)})):[];
        console.error('Bot name sync failed:',JSON.stringify({code,status,username:details}));
        console.error('Bot remains online with its current account name. No automatic retry in this process.');
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

        if (process.env.NF_DAVIBOT_DATABASE_POSTGRES_URI) {
            startMatchExpiryScheduler(client);
        }
    }
};
