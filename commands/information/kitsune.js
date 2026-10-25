const {SlashCommandBuilder,PermissionFlagsBits,MessageFlags,escapeMarkdown}=require('discord.js');
const config=require('../../config/kitsuneLearning');
const {OWNER_ID}=require('../../handlers/kitsune/settings');
const {learningPhrase}=require('../../handlers/kitsune/learningPhrases');
const {recognize,extractChoice}=require('../../handlers/kitsune/language');
const {contextualCategory}=require('../../handlers/kitsune/context');
const runtime=require('../../handlers/kitsune/learningRuntime');
const repo=require('../../database/kitsuneLearning');
const phraseOption=option=>option.setName('phrase').setDescription('Short English phrase, without the Kitsune prefix.').setRequired(true).setMinLength(2).setMaxLength(config.maxPhraseLength).setAutocomplete(true);
const pageOption=option=>option.setName('page').setDescription('Page number, 10 phrases per page.').setMinValue(1).setMaxValue(50);
const data=new SlashCommandBuilder().setName('kitsune').setDescription('Test dialogue and manage Kitsune phrase learning. Owner only.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator).setDMPermission(false)
    .addSubcommand(sub=>sub.setName('test').setDescription('Private isolated dialogue test. Use || between turns.')
        .addStringOption(option=>option.setName('text').setDescription('Exact chat text. Start with kitsune hi; continue with || follow-ups.').setRequired(true).setMaxLength(1500))
        .addStringOption(option=>option.setName('persona').setDescription('Simulated speaker; live accounts are unaffected.').addChoices(...['member','owner','mae','ash'].map(value=>({name:value,value}))))
        .addIntegerOption(option=>option.setName('seed').setDescription('Restart this scenario with a repeatable seed.').setMinValue(0).setMaxValue(2147483647))
        .addStringOption(option=>option.setName('engine').setDescription('Built-in rules, or private external Groq trial.').addChoices({name:'built-in',value:'builtin'},{name:'Groq (private external trial)',value:'groq'}))
        .addStringOption(option=>option.setName('expected').setDescription('Optional expected category for a single turn.').setMaxLength(80)))
    .addSubcommand(sub=>sub.setName('testreset').setDescription('Clear your private test scenarios in this channel.'))
    .addSubcommand(sub=>sub.setName('unknown').setDescription('Review unfamiliar phrases, grouped by normalized wording.').addIntegerOption(pageOption))
    .addSubcommand(sub=>sub.setName('clearunknown').setDescription('Clear all unknown phrases in this server. Learned phrases stay saved.'))
    .addSubcommand(sub=>sub.setName('learned').setDescription('Review the phrases you have taught.').addIntegerOption(pageOption))
    .addSubcommand(sub=>sub.setName('teach').setDescription('Connect an unfamiliar phrase to an existing meaning.').addStringOption(phraseOption)
        .addStringOption(option=>option.setName('meaning').setDescription('The meaning this phrase expresses.').setRequired(true)
            .addChoices(...Object.keys(config.intents).map(name=>({name:({continue:'continue — carry on the current topic',stop:'stop — end the conversation',restart:'restart — start a fresh conversation',change_topic:'change topic — leave the current subject'})[name]??name.replace(/_/g,' '),value:name})))))
    .addSubcommand(sub=>sub.setName('forget').setDescription('Remove a learned connection. Built-in rules stay intact.').addStringOption(phraseOption))
    .addSubcommand(sub=>sub.setName('dismiss').setDescription('Remove an unknown phrase from the review list.').addStringOption(phraseOption));
async function execute(interaction) {
    if(interaction.user.id!==OWNER_ID || !interaction.guildId) {
        return interaction.reply({content:'Only Davi can manage Kitsune learning in a server.',flags:MessageFlags.Ephemeral,allowedMentions:{parse:[]}});
    }
    await interaction.deferReply({flags:MessageFlags.Ephemeral});
    const reply=content=>interaction.editReply({content,allowedMentions:{parse:[]}});
    const sub=interaction.options.getSubcommand();
    if(sub==='test'||sub==='testreset'){
        try{
            const lab=require('../../handlers/kitsune/testLab');
            const input={userId:interaction.user.id,guildId:interaction.guildId,channelId:interaction.channelId,botId:interaction.client?.user?.id,botAvatar:interaction.client?.user?.displayAvatarURL?.({size:256})};
            if(sub==='testreset'){const ai=require('../../handlers/kitsune/aiTestLab');const aiCount=ai.resetAiLab(input);return reply('🦊 Cleared '+lab.resetLab(input)+' private test scenarios and '+aiCount+' private AI scenarios. Live conversation memory was not changed.');}
            const engine=interaction.options.getString('engine')??'builtin';
            if(!['builtin','groq'].includes(engine))throw Error('Choose builtin or groq.');
            const runner=engine==='groq'?require('../../handlers/kitsune/aiTestLab'):lab;
            const options={...input,text:interaction.options.getString('text',true),persona:interaction.options.getString('persona')??'member',seed:interaction.options.getInteger('seed')??undefined,expected:interaction.options.getString('expected')??undefined};
            const result=engine==='groq'?await runner.runAiLab(options):runner.runLab(options);
            const report=engine==='groq'?runner.formatAiReport(result):runner.formatReport(result);
            return interaction.editReply({content:report.length<=1850?report:'🦊 Private test completed: '+result.turns.length+' turns. Full results are in the attached report.\n'+result.limitations,files:[{attachment:Buffer.from(report,'utf8'),name:'kitsune-test-report.txt'}],allowedMentions:{parse:[]}});
        }catch(error){return reply('Test could not complete: '+error.message+' No live conversation or learning data was changed.');}
    }
    if(!runtime.enabled())return reply('Learning needs the existing PostgreSQL connection to be enabled.');
    try {
        if(sub==='clearunknown') {
            const removed=await repo.clearUnknownPhrases(interaction.guildId);
            return reply(removed
                ? '🦊 Cleared '+removed+' unknown phrase'+(removed===1?'':'s')+' from this server. Learned phrases are still saved. New unknown messages can appear again.'
                : '🦊 The unknown list is already empty. Learned phrases are still saved.');
        }
        if(sub==='unknown'||sub==='learned') {
            const page=interaction.options.getInteger('page')??1;
            const rows=await (sub==='unknown'?repo.listUnknownPhrases:repo.listLearnedPhrases)(interaction.guildId,page);
            const lines=rows.map(row=>`• ${escapeMarkdown(row.phrase)} — ${sub==='unknown'?row.seen_count+' sightings':row.intent.replace(/_/g,' ')}`);
            return reply(`🦊 ${sub==='unknown'?'Unknown':'Learned'} phrases • Page ${page}\n${lines.join('\n')||'No phrases on this page.'}\n\nTeach: /kitsune teach • Review: /kitsune learned • Remove learned: /kitsune forget • Clear unknown: /kitsune clearunknown\nOnly approved meanings are used. No automatic training. External AI is available only through the owner’s explicit private test engine.`);
        }
        const raw=interaction.options.getString('phrase',true),phrase=learningPhrase(raw);
        if(!phrase)return reply('Use a short English phrase without the Kitsune prefix, links, mentions, long numbers or private tokens.');
        if(/^kitsune\b/u.test(phrase))return reply('Leave the Kitsune prefix out of the phrase.');
        if(sub==='teach') {
            const intent=interaction.options.getString('meaning',true);
            if(!Object.hasOwn(config.intents,intent))return reply('Choose a meaning from the list.');
            if(recognize(raw)||contextualCategory(raw,null)||extractChoice(raw))return reply('That phrase already has a built-in meaning. Teaching cannot replace built-in rules.');
            await repo.teachPhrase(interaction.guildId,phrase,intent,interaction.user.id);
            runtime.invalidateAliases(interaction.guildId);
            return reply(`🦊 Learned: ${escapeMarkdown(phrase)} → ${intent.replace(/_/g,' ')}.\nThis server only. Use /kitsune teach again to change this meaning. Built-in rules keep priority. Personality, cooldowns and permissions still apply.`);
        }
        if(sub==='forget') {
            const removed=await repo.forgetPhrase(interaction.guildId,phrase);runtime.invalidateAliases(interaction.guildId);
            return reply(removed?'Learned connection removed. Built-in understanding is unchanged.':'No learned connection was found for that phrase.');
        }
        if(sub==='dismiss')return reply(await repo.dismissUnknownPhrase(interaction.guildId,phrase)?'Unknown phrase removed from the list.':'That phrase is not in the unknown list.');
        return reply('Choose unknown, clearunknown, learned, teach, forget or dismiss.');
    } catch(error) {
        if(/^Learned phrase limit reached\./u.test(error.message))return reply(error.message);
        console.error('Kitsune learning command failed:',error.code??'database error');
        return reply('Learning is temporarily unavailable. Your normal Kitsune conversation can continue.');
    }
}
async function autocomplete(interaction){
    if(interaction.user.id!==OWNER_ID||!interaction.guildId||!runtime.enabled())return interaction.respond([]);
    const focused=interaction.options.getFocused(true);
    if(focused.name!=='phrase')return interaction.respond([]);
    const value=String(focused.value??'').trim();
    const prefix=value?learningPhrase(value):'';
    if(value&&!prefix)return interaction.respond([]);
    let timer;
    try{
        const sub=interaction.options.getSubcommand();
        const source=sub==='forget'?'learned':sub==='dismiss'?'unknown':'both';
        const rows=await Promise.race([repo.suggestPhrases(interaction.guildId,prefix,source),new Promise(resolve=>{timer=setTimeout(()=>resolve([]),1800);timer.unref?.();})]);
        return interaction.respond(rows.filter(row=>row.phrase.length<=100).slice(0,25).map(row=>({name:row.phrase,value:row.phrase})));
    }catch{return interaction.respond([]);}
    finally{clearTimeout(timer);}
}
module.exports={data,execute,autocomplete};
