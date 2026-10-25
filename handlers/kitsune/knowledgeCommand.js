const {kinds,nameKey,validate}=require('./knowledge');
const runtime=require('./knowledgeRuntime');
const {recognize,extractChoice}=require('./language');
const {contextualCategory}=require('./context');
const repo=()=>require('../../database/kitsuneKnowledge');
const clean=text=>String(text).replace(/[\\`*_~|<>]/gu,'\\$&');
function addCommands(data){
 data.addSubcommand(s=>s.setName('remember').setDescription('Save or update a server name, explanation, fact or custom reply.')
  .addStringOption(o=>o.setName('name').setDescription('Name, nickname or term to remember.').setRequired(true).setMinLength(2).setMaxLength(80))
  .addStringOption(o=>o.setName('kind').setDescription('What kind of knowledge is this?').setRequired(true).addChoices(...Object.entries(kinds).map(([value,name])=>({name,value}))))
  .addStringOption(o=>o.setName('explanation').setDescription('Your explanation, up to 500 characters. Required except for linked server objects.').setMaxLength(500))
  .addUserOption(o=>o.setName('member').setDescription('Required for a member name or nickname.'))
  .addRoleOption(o=>o.setName('role').setDescription('Required for a server role name.'))
  .addChannelOption(o=>o.setName('channel').setDescription('Required for a server channel name.')))
 .addSubcommand(s=>s.setName('knowledge').setDescription('Review saved server names and explanations.').addIntegerOption(o=>o.setName('page').setDescription('Ten entries per page.').setMinValue(1).setMaxValue(30)))
 .addSubcommand(s=>s.setName('unremember').setDescription('Remove a saved name or explanation. Phrase meanings stay intact.').addStringOption(o=>o.setName('name').setDescription('Exact name or term to remove.').setRequired(true).setMaxLength(80)));
 return data;
}
async function execute(interaction,reply){
 const sub=interaction.options.getSubcommand();
 if(sub==='knowledge'){
  const page=interaction.options.getInteger('page')??1;
  const rows=await repo().listKnowledge(interaction.guildId,page);
  const lines=rows.map(row=>`• ${clean(row.name)} [${row.kind}]${row.target_id?' → ID '+row.target_id:''}${row.explanation?' — '+clean(row.explanation):''}`.slice(0,145));
  return reply(`🦊 Server knowledge • Page ${page}\n${lines.join('\n')||'No entries on this page.'}\n\nSave/update: /kitsune remember • Remove: /kitsune unremember\nNames and explanations do not grant roles, permissions or owner identity.`);
 }
 const raw=interaction.options.getString('name',true),key=nameKey(raw);
 if(!key)return reply('Use a 2–80 character name or term, without mentions, links or code.');
 if(sub==='unremember'){
  const removed=await repo().removeKnowledge(interaction.guildId,key);runtime.invalidate(interaction.guildId);
  return reply(removed?'Removed from server knowledge.':'No saved entry with that name.');
 }
 const input={name:raw,kind:interaction.options.getString('kind',true),explanation:interaction.options.getString('explanation')??''};
 try{validate(input);}catch(e){return reply(e.message);}
 if(recognize(key)||contextualCategory(key,null)||extractChoice(key))return reply('That name or term already has a built-in meaning. Choose a more specific label.');
 if(input.kind==='member'){
  const user=interaction.options.getUser('member');if(!user)return reply('Select a server member for this name.');
  const member=await interaction.guild.members.fetch(user.id).catch(()=>null);
  if(!member)return reply('That member could not be verified in this server.');
  input.targetId=member.id;
 }else if(input.kind==='role'){
  const role=interaction.options.getRole('role');if(!role||role.guild.id!==interaction.guildId)return reply('Select a role from this server.');input.targetId=role.id;
 }else if(input.kind==='channel'){
  const channel=interaction.options.getChannel('channel');if(!channel||channel.guildId!==interaction.guildId)return reply('Select a channel from this server.');input.targetId=channel.id;
 }
 const row=await repo().saveKnowledge(interaction.guildId,input,interaction.user.id);runtime.invalidate(interaction.guildId);
 return reply(`🦊 Saved: ${clean(row.key)}.${row.explanation?'\n'+clean(row.explanation):''}`);
}
module.exports={addCommands,execute};
