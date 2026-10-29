const {SlashCommandBuilder,MessageFlags,PermissionFlagsBits}=require('discord.js');
const {OWNER_ID}=require('../../handlers/kitsune/settings');
const data=new SlashCommandBuilder().setName('kitsune').setDescription('Explore the server and manage approved knowledge.').setDMPermission(false)
 .addSubcommand(s=>s.setName('open').setDescription('Open your private Kitsune server guide.'))
 .addSubcommand(s=>s.setName('publish').setDescription('Publish or refresh the configured Kitsune hub. Manage Server required.'));
require('../../handlers/kitsune/knowledgeCommand').addCommands(data);
async function execute(interaction){const sub=interaction.options.getSubcommand();if(sub==='open')return require('../../handlers/hub/runtime').open(interaction);
 if(sub==='publish'){if(!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild))return interaction.reply({content:'Manage Server is required to publish the hub.',flags:MessageFlags.Ephemeral});await interaction.deferReply({flags:MessageFlags.Ephemeral});try{const message=await require('../../handlers/hub/runtime').publish(interaction.guild);return interaction.editReply({content:'Kitsune hub ready: '+message.url,allowedMentions:{parse:[]}});}catch{return interaction.editReply('Could not publish. Check the hub channel and bot permissions in Studio.');}}
 if(interaction.user.id!==OWNER_ID)return interaction.reply({content:'Only the bot owner can manage saved knowledge.',flags:MessageFlags.Ephemeral});await interaction.deferReply({flags:MessageFlags.Ephemeral});try{return await require('../../handlers/kitsune/knowledgeCommand').execute(interaction,content=>interaction.editReply({content,allowedMentions:{parse:[]}}));}catch{return interaction.editReply('Knowledge is temporarily unavailable. Try again shortly.');}}
module.exports={data,execute};
