'use strict';
const {SlashCommandBuilder,PermissionFlagsBits:P,MessageFlags,ChannelType,EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,UserSelectMenuBuilder}=require('discord.js');
const {successEmbed,errorEmbed}=require('../../utils/embeds');
const data=new SlashCommandBuilder().setName('announce').setDescription('Preview an announcement; optionally select up to 10 members.').setDMPermission(false).setDefaultMemberPermissions(P.ManageGuild)
 .addChannelOption(o=>o.setName('channel').setDescription('Where to publish.').addChannelTypes(ChannelType.GuildText,ChannelType.GuildAnnouncement).setRequired(true))
 .addStringOption(o=>o.setName('title').setDescription('Announcement title.').setMaxLength(256).setRequired(true))
 .addStringOption(o=>o.setName('text').setDescription('Announcement text. Use \\n for a new line.').setMaxLength(4000).setRequired(true))
 .addStringOption(o=>o.setName('color').setDescription('Optional HEX color, e.g. #B18CFF. Defaults to the server color.').setMinLength(6).setMaxLength(7))
 .addAttachmentOption(o=>o.setName('image').setDescription('Optional PNG, JPG or WebP image, up to 8 MB.'))
 .addUserOption(o=>o.setName('member').setDescription('Optional first member. You can select more in the preview.').setRequired(false))
 .addBooleanOption(o=>o.setName('everyone').setDescription('Optional @everyone ping; requires Mention Everyone.').setRequired(false));
async function execute(interaction){
 const silent={parse:[]};if(!interaction.inGuild()||!interaction.memberPermissions?.has(P.ManageGuild))return interaction.reply({content:'You need Manage Server to use this command.',flags:MessageFlags.Ephemeral,allowedMentions:silent});
 await interaction.deferReply({flags:MessageFlags.Ephemeral});
 const fail=(title,description)=>interaction.editReply({content:null,embeds:[errorEmbed(title,description)],components:[],allowedMentions:silent});
 const picked=interaction.options.getChannel('channel',true),title=interaction.options.getString('title',true).trim(),text=interaction.options.getString('text',true).replace(/\\n/g,'\n').trim();
 const first=interaction.options.getUser('member'),everyone=interaction.options.getBoolean('everyone')??false;let ids=first?[first.id]:[];
 const required=[P.ViewChannel,P.SendMessages,P.EmbedLinks],authorRequired=[P.ViewChannel,P.SendMessages];
 async function check(){const channel=await interaction.guild.channels.fetch(picked.id);if(!channel||channel.guildId!==interaction.guildId||![ChannelType.GuildText,ChannelType.GuildAnnouncement].includes(channel.type))throw Error('The announcement channel is unavailable in this server.');
  const author=await interaction.guild.members.fetch({user:interaction.user.id,force:true}),bot=await interaction.guild.members.fetchMe({force:true});
  if(!author.permissions.has(P.ManageGuild)||!channel.permissionsFor(author)?.has(authorRequired)||!channel.permissionsFor(bot)?.has(required))throw Error('You need Manage Server and access to send in that channel. Kitsune needs View Channel, Send Messages and Embed Links.');
  if(everyone&&(!channel.permissionsFor(author)?.has(P.MentionEveryone)||!channel.permissionsFor(bot)?.has(P.MentionEveryone)))throw Error('Both you and Kitsune need Mention Everyone in that channel.');
  const members=[];for(const id of ids){const member=await interaction.guild.members.fetch({user:id,force:true}).catch(()=>null);if(!member)throw Error('A selected member is no longer in this server. Run /announce again and update the selection.');members.push(member);}return{channel,members};
 }
 const color=interaction.options.getString('color')?.trim(),image=interaction.options.getAttachment('image');
 if(color&&!/^#?[a-f0-9]{6}$/i.test(color))return fail('Invalid Color','Use a HEX color such as #B18CFF.');
 if(image){let url;try{url=new URL(image.url);}catch{return fail('Invalid Image','Upload a PNG, JPG or WebP image.');}if(!['image/png','image/jpeg','image/webp'].includes(image.contentType)||image.size>8*1024*1024||url.protocol!=='https:'||!['cdn.discordapp.com','media.discordapp.net'].includes(url.hostname))return fail('Invalid Image','Upload a PNG, JPG or WebP image up to 8 MB.');}
 const publish='kitsune:announce:publish:'+interaction.id,cancel='kitsune:announce:cancel:'+interaction.id,select='kitsune:announce:members:'+interaction.id;
 const mentionText=()=>[everyone?'@everyone':null,...ids.map(id=>`<@${id}>`)].filter(Boolean).join(' ');
 const embed=new EmbedBuilder().setColor(color?'#'+color.replace(/^#/,''):require('../../utils/guildContext').current().brand.color).setTitle(title).setDescription(text).setFooter({text:'Kitsune • '+interaction.guild.name}).setTimestamp();
 if(image)embed.setImage(image.url);
 function preview(members){embed.setThumbnail(members.length===1?members[0].user.displayAvatarURL({size:256}):null);const menu=new UserSelectMenuBuilder().setCustomId(select).setPlaceholder('Optional: select members to notify (0–10)').setMinValues(0).setMaxValues(10);if(ids.length)menu.setDefaultUsers(ids);return{content:`Preview for <#${picked.id}> · Confirm within 2 minutes.\n${mentionText()?'Notifications: '+mentionText():'No notifications — this announcement will not ping anyone.'}`,embeds:[embed],components:[new ActionRowBuilder().addComponents(menu),new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(publish).setLabel('Publish').setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId(cancel).setLabel('Cancel').setStyle(ButtonStyle.Secondary))],allowedMentions:silent};}
 if(!title||!text)return fail('Invalid Announcement','The title and text cannot be empty.');
 try{let checked=await check();const message=await interaction.editReply(preview(checked.members)),expires=Date.now()+120000;
  for(;;){let confirmation;try{confirmation=await message.awaitMessageComponent({filter:c=>c.user.id===interaction.user.id&&c.guildId===interaction.guildId&&[publish,cancel,select].includes(c.customId),time:Math.max(1,expires-Date.now())});}catch{return interaction.editReply({content:'Announcement preview expired. Run /announce again.',components:[],allowedMentions:silent});}
   await confirmation.deferUpdate();
   if(confirmation.customId===cancel)return interaction.editReply({content:'Announcement cancelled.',embeds:[],components:[],allowedMentions:silent});
   if(confirmation.customId===select){const selected=confirmation.values;if(!Array.isArray(selected)||selected.length>10||selected.some(id=>!/^\d{16,22}$/.test(id)))return fail('Invalid Selection','Select up to 10 server members.');ids=[...new Set(selected)];checked=await check();await interaction.editReply(preview(checked.members));if(Date.now()>=expires)return interaction.editReply({content:'Announcement preview expired. Run /announce again.',components:[],allowedMentions:silent});continue;}
   await interaction.editReply({content:'Publishing announcement…',components:[],allowedMentions:silent});checked=await check();
   const sent=await checked.channel.send({content:mentionText()||undefined,embeds:[embed],allowedMentions:{parse:everyone?['everyone']:[],users:ids,roles:[],repliedUser:false}});
   return interaction.editReply({content:null,embeds:[successEmbed('Announcement Published',`Published in <#${picked.id}>.\n[View announcement](${sent.url})`)],components:[],allowedMentions:silent});
  }
 }catch(error){console.error('Announcement could not complete:',error?.code??'validation or delivery failed');return fail('Announcement Not Published','Check channel permissions and selected members. If a selected member left, run /announce again. Both you and Kitsune need Mention Everyone when that option is enabled.');}
}
module.exports={data,execute};
