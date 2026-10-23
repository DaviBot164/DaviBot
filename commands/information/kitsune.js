const {SlashCommandBuilder,PermissionFlagsBits,MessageFlags,escapeMarkdown}=require('discord.js');
const config=require('../../config/kitsuneLearning');
const {OWNER_ID}=require('../../handlers/kitsune/settings');
const {learningPhrase}=require('../../handlers/kitsune/learningPhrases');
const {recognize,extractChoice}=require('../../handlers/kitsune/language');
const {contextualCategory}=require('../../handlers/kitsune/context');
const runtime=require('../../handlers/kitsune/learningRuntime');
const repo=require('../../database/kitsuneLearning');
const phraseOption=option=>option.setName('phrase').setDescription('Short English phrase, without the Kitsune prefix.').setRequired(true).setMinLength(2).setMaxLength(config.maxPhraseLength);
const pageOption=option=>option.setName('page').setDescription('Page number, 10 phrases per page.').setMinValue(1).setMaxValue(50);
const data=new SlashCommandBuilder().setName('kitsune').setDescription('Teach and review Kitsune conversation phrases. Owner only.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator).setDMPermission(false)
    .addSubcommand(sub=>sub.setName('unknown').setDescription('Review unfamiliar phrases, grouped by normalized wording.').addIntegerOption(pageOption))
    .addSubcommand(sub=>sub.setName('clearunknown').setDescription('Clear all unknown phrases in this server. Learned phrases stay saved.'))
    .addSubcommand(sub=>sub.setName('learned').setDescription('Review the phrases you have taught.').addIntegerOption(pageOption))
    .addSubcommand(sub=>sub.setName('teach').setDescription('Connect an unfamiliar phrase to an existing meaning.').addStringOption(phraseOption)
        .addStringOption(option=>option.setName('meaning').setDescription('The meaning this phrase expresses.').setRequired(true)
            .addChoices(...Object.keys(config.intents).map(name=>({name:name.replace(/_/g,' '),value:name})))))
    .addSubcommand(sub=>sub.setName('forget').setDescription('Remove a learned connection. Built-in rules stay intact.').addStringOption(phraseOption))
    .addSubcommand(sub=>sub.setName('dismiss').setDescription('Remove an unknown phrase from the review list.').addStringOption(phraseOption));
async function execute(interaction) {
    if(interaction.user.id!==OWNER_ID || !interaction.guildId) {
        return interaction.reply({content:'Only Davi can manage Kitsune learning in a server.',flags:MessageFlags.Ephemeral,allowedMentions:{parse:[]}});
    }
    await interaction.deferReply({flags:MessageFlags.Ephemeral});
    const reply=content=>interaction.editReply({content,allowedMentions:{parse:[]}});
    if(!runtime.enabled())return reply('Learning needs the existing PostgreSQL connection to be enabled.');
    try {
        const sub=interaction.options.getSubcommand();
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
            return reply(`🦊 ${sub==='unknown'?'Unknown':'Learned'} phrases • Page ${page}\n${lines.join('\n')||'No phrases on this page.'}\n\nTeach: /kitsune teach • Review: /kitsune learned • Remove learned: /kitsune forget • Clear unknown: /kitsune clearunknown\nOnly approved meanings are used. No automatic training or external AI API.`);
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
            return reply(`🦊 Learned: ${escapeMarkdown(phrase)} → ${intent.replace(/_/g,' ')}.\nThis server only. Existing personality, cooldowns and permissions still apply.`);
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
module.exports={data,execute};
