const {AttachmentBuilder,EmbedBuilder}=require('discord.js');
const path=require('node:path'),fs=require('node:fs');
const {current}=require('./guildContext');const brand=require('../config/brand');
const BANNER_NAME='welcome-banner.png';const BANNER_PATH=path.join(__dirname,'..','assets','images',BANNER_NAME);
function text(template,member){return template.replace(/\{server\}/g,current().brand.server).replace(/\{user\}/g,member?.displayName??member?.user?.username??'New member').replace(/\{count\}/g,String(member?.guild?.memberCount??1));}
function bannerPng(member){const settings=current();if(settings.welcome.mode==='image')return require('./welcomeImage').imageBuffer(settings.welcome.image);if(settings.welcome.mode==='legacy'&&fs.existsSync(BANNER_PATH))return fs.readFileSync(BANNER_PATH);const {createCanvas}=require('@napi-rs/canvas');const canvas=createCanvas(1200,400),ctx=canvas.getContext('2d');ctx.fillStyle=settings.welcome.background;ctx.fillRect(0,0,1200,400);const glow=ctx.createRadialGradient(1030,80,10,1030,80,440);glow.addColorStop(0,settings.welcome.accent+'80');glow.addColorStop(1,settings.welcome.background);ctx.fillStyle=glow;ctx.fillRect(0,0,1200,400);ctx.strokeStyle=settings.welcome.accent;ctx.lineWidth=2;ctx.beginPath();ctx.arc(1040,135,76,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(1075,112,76,1.7,4.7);ctx.stroke();ctx.fillStyle=settings.welcome.accent;ctx.fillRect(64,96,55,4);ctx.font='bold 17px sans-serif';ctx.fillText(settings.brand.name.toUpperCase(),64,137);let size=48,title=text(settings.welcome.title,member);do{ctx.font=`bold ${size}px sans-serif`;size-=2;}while(ctx.measureText(title).width>940&&size>24);ctx.fillStyle='#ffffff';ctx.fillText(title,64,221,1060);ctx.font='23px sans-serif';ctx.fillStyle='#e0e5df';ctx.fillText(text(settings.welcome.subtitle,member),64,271,1020);ctx.font='15px sans-serif';ctx.fillStyle=settings.welcome.accent;ctx.fillText(settings.brand.server,64,349,1060);return canvas.toBuffer('image/png');}
function createWelcomeBanner(member){return new AttachmentBuilder(current().welcome.mode==='legacy'?BANNER_PATH:bannerPng(member),{name:BANNER_NAME});}
function welcomeDestinations(member){
 const settings=current(),entries=[['sacredLaws','Rules','📜'],['verification','Verification','✅'],['slayers2','Choose a path','⚔️']];
 return entries.filter(([key])=>key!=='slayers2'||settings.modules.progression!==false).flatMap(([key,label,emoji])=>{
  const id=settings.channels[key],channel=id?member.guild.channels.cache.get(id):null;
  return /^\d{17,20}$/.test(id??'')&&channel?.guild?.id===member.guild.id&&typeof channel.isTextBased==='function'&&channel.isTextBased()?[{key,label,emoji,id}]:[];
 });
}
function createWelcomeComponents(member){
 const {ActionRowBuilder,ButtonBuilder,ButtonStyle}=require('discord.js'),destinations=welcomeDestinations(member);
 return destinations.length?[new ActionRowBuilder().addComponents(...destinations.map(({label,emoji,id})=>new ButtonBuilder().setLabel(label).setEmoji(emoji).setStyle(ButtonStyle.Link).setURL(`https://discord.com/channels/${member.guild.id}/${id}`)))]:[];
}
function createWelcomeEmbed(member){
 const settings=current(),legacy=settings.welcome.mode==='legacy';
 return new EmbedBuilder().setColor(brand.color).setAuthor({name:`${brand.name} • ${brand.server}`,iconURL:member.client.user.displayAvatarURL({size:256})})
 .setTitle(legacy?'🌙 A New Soul Has Arrived':text(settings.welcome.title,member))
 .setDescription(legacy?`Welcome, ${member}.`:text(settings.welcome.message.replace(/\{user\}/g,`<@${member.id}>`),member))
 .setThumbnail(member.user.displayAvatarURL({size:256})).setImage(`attachment://${BANNER_NAME}`).setFooter({text:brand.footer});
}
module.exports={createWelcomeBanner,createWelcomeEmbed,bannerPng,createWelcomeComponents};
