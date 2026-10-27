const {getRanks}=require('./progression');
const {current,factionName}=require('../utils/guildContext');
const channel=(s,key,fallback)=>s.channels[key]?`<#${s.channels[key]}>`:fallback;
function guide(kind,s=current()){
 const support=channel(s,'openTicket','the ticket channel');
 const specs={
 sacred_laws:{title:'Community Rules',intro:'Respect people. Keep conversations useful and welcoming.',fields:[{name:'Respect',value:'No harassment, threats, discrimination or personal attacks. Respect other people’s boundaries.'},{name:'Keep channels useful',value:'No spam, scams or malicious links. Follow each channel’s topic and staff instructions.'},{name:'Privacy and support',value:`Do not share passwords or private information. Use ${support} for support, reports and appeals.`}]},
 moon_guide:{title:`Welcome to ${s.brand.server}`,intro:'Your starting point in this community.',fields:[{name:'Get started',value:`Read ${channel(s,'sacredLaws','the rules')}, then join ${channel(s,'general','the conversation')}.`},{name:'Explore',value:'Use /help to see available commands. Try /profile, /daily and /match when those systems are enabled.'},{name:'Need a hand?',value:`Open a ticket in ${support}.`}]},
 verification_guide:{title:'Verification Guide',intro:'Follow this server’s verification instructions to obtain access.',fields:[{name:'Account safety',value:'Only use the verification service selected by this server. Never share passwords, tokens or verification codes with members.'},{name:'Need help?',value:`Contact staff or use ${support}.`}]},
 role_guide:{title:'Roles and Progression',intro:'Community progress and staff authority are separate.',fields:[{name:factionName('slayer'),value:rankLines('slayer')},{name:factionName('demon'),value:rankLines('demon')},{name:'Staff',value:'Owner, administrators, moderators and support staff are assigned by the server. XP and titles never grant staff authority.'}]},
 game_guide:{title:'Community Game Guide',intro:'A place for questions, guides and finding people to play with.',fields:[{name:'Share a useful guide',value:'Name the game and explain the steps. Separate tested information from assumptions. No cheats, exploits or malicious downloads.'},{name:'Find company',value:'Use /match for friendly matches. Mention your goal and availability when looking for a team.'}]},
 support_guide:{title:'Support Guide',intro:`Use ${support} for questions, reports and appeals.`,fields:[{name:'A useful first message',value:'Explain what happened, where it happened, what you expected and what you already tried. Include relevant evidence without sharing credentials.'},{name:'While waiting',value:'Keep related details in one ticket. Avoid repeated pings or duplicate tickets.'}]}
 };
 return specs[kind]?{...specs[kind],key:kind}:null;
}
function rankLines(faction){return getRanks(faction).map(r=>`**${r.name}** · Level ${r.level}${r.automatic?'':' + trial / staff promotion'}`).join('\n');}
function pathGuide(faction){return {key:'progression_'+faction,title:factionName(faction)+' Progression',intro:'Progress at your own pace. Server ranks are separate from your in-game character.',fields:[{name:'Rank path',value:rankLines(faction)},{name:'Make progress',value:'Chat naturally, claim /daily and complete missions. Spam does not speed up your progress.'},{name:'Prestige ranks',value:'The final rank requires a trial or staff promotion. Reaching the required level alone is not enough.'}]};}
module.exports={guide,pathGuide};
