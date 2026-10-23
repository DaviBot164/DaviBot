'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),Module=require('node:module');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {DAY,streakInfo,themeFor,QUESTS}=require(path.join(root,'config/missions'));
let count=0;function eq(a,b){assert.deepEqual(a,b);count++;}
for(const [n,base,bonus]of [[1,50,0],[3,100,25],[7,200,50],[14,200,75],[30,200,100],[31,200,0],[33,200,25]]){eq(streakInfo(n).base,base);eq(streakInfo(n).bonus,bonus);}
for(const value of [0,-1,1.5,Infinity,NaN]){assert.throws(()=>streakInfo(value));count++;}
eq(themeFor('abc'),themeFor('abc'));eq(Object.keys(QUESTS),['active_soul','dedicated_warrior','blood_moon_devotion']);
// Use the real transaction functions against an in-memory SQL protocol stub.
// Never loads connection.js, credentials, PostgreSQL or Discord.
let now=Date.parse('2026-10-21T12:00:00Z');
const cycle='11111111-1111-4111-8111-111111111111';
let db,failUpdate=false,released=0;
function reset(){db={user:{level:'1',xp:'10'},stats:{daily_streak:0,last_daily_claim_at:null},quest:{cycle_id:cycle,cycle_started_at:new Date(now),eligible_messages:30,daily_claimed:true,claimed_rewards:[]}};}
const client={
 async query(sql,args=[]){sql=sql.replace(/\s+/g,' ').trim();
  if(sql==='BEGIN'){this.snapshot=structuredClone(db);return{rows:[]};}
  if(sql==='COMMIT')return{rows:[]};
  if(sql==='ROLLBACK'){db=this.snapshot;return{rows:[]};}
  if(sql.startsWith('SELECT level, xp'))return{rows:[{...db.user}]};
  if(sql.startsWith('SELECT daily_streak'))return{rows:[{...db.stats}]};
  if(sql.startsWith('SELECT clock_timestamp()')||sql.startsWith('SELECT NOW()'))return{rows:[{current_time:new Date(now)}]};
  if(sql.startsWith('SELECT cycle_started_at'))return{rows:[{cycle_started_at:db.quest.cycle_started_at}]};
  if(sql.startsWith('SELECT * FROM kitsune_daily_quests'))return{rows:[structuredClone(db.quest)]};
  if(sql.startsWith('INSERT INTO'))return{rows:[]};
  if(sql.startsWith('UPDATE kitsune_users')){if(failUpdate)throw Error('simulated write failure');db.user={level:args[2],xp:args[3]};return{rows:[]};}
  if(sql.startsWith('UPDATE kitsune_player_stats')){db.stats={daily_streak:args[2],last_daily_claim_at:args[3]??new Date(now)};return{rows:[]};}
  if(sql.startsWith('UPDATE kitsune_daily_quests')){
   if(sql.includes('gen_random_uuid()')){db.quest={cycle_id:'22222222-2222-4222-8222-222222222222',cycle_started_at:new Date(now),eligible_messages:0,daily_claimed:sql.includes('daily_claimed = TRUE'),claimed_rewards:[]};}
   else if(sql.includes("array_append(claimed_rewards, 'board_bonus')"))db.quest.claimed_rewards.push('board_bonus');
   else if(sql.includes('array_append('))db.quest.claimed_rewards.push(args[2]);
   else if(sql.includes('daily_claimed = TRUE'))db.quest.daily_claimed=true;
   else if(sql.includes('eligible_messages = eligible_messages + 1'))db.quest.eligible_messages++;
   return{rows:[structuredClone(db.quest)]};
  }
  throw Error('Unexpected SQL: '+sql);
 },release(){released++;}
};
const original=Module._load;
class Builder{constructor(){this.data={};this.components=[];}setCustomId(v){this.data.custom_id=v;return this;}setLabel(v){this.data.label=v;return this;}setStyle(v){return this;}setEmoji(v){return this;}addComponents(...v){this.components.push(...v);return this;}}
class Embed{constructor(){this.data={fields:[]};}addFields(...f){this.data.fields.push(...f);return this;}}
Module._load=function(request,parent){
 if(parent?.filename?.startsWith(root)&&request==='discord.js')return{ActionRowBuilder:Builder,ButtonBuilder:Builder,ButtonStyle:{Primary:1,Secondary:2,Success:3,Danger:4}};
 if(parent?.filename?.startsWith(root)&&request==='./connection')return{pool:{connect:async()=>client}};
 if(parent?.filename?.startsWith(root)&&request==='../utils/leveling')return{calculateLevel:(level,xp)=>{assert.equal(typeof xp,'number');return{level,xp,levelsGained:0};}};
 if(parent?.filename?.startsWith(root)&&['./embeds','../embeds'].includes(request))return{createEmbed:(title,description)=>{const e=new Embed();e.data.title=title;e.data.description=description;return e;}};
 return original.apply(this,arguments);
};
let daily,quests,presentation,view,matchPanel;
try{daily=require(path.join(root,'database/dailyRewards'));quests=require(path.join(root,'database/dailyQuests'));presentation=require(path.join(root,'utils/dailyPresentation'));view=require(path.join(root,'utils/quests/missionView'));matchPanel=require(path.join(root,'utils/matches/matchPanel'));}finally{Module._load=original;}
(async()=>{
 const match={id:'1',status:'recruiting',gameName:'Game',teamSize:1,creatorId:'u',players:[]};
 const recruiting=matchPanel.buildMatchPanel(match);
 eq(recruiting.components[0].components[0].data.label,'Join Vortex');eq(recruiting.components[0].components[1].data.label,'Join Nova');
 eq(recruiting.components[0].components[0].data.custom_id,'kitsune:match:join_crimson:1');
 const active=matchPanel.buildMatchPanel({...match,status:'active'});eq(active.components[0].components[1].data.custom_id,'kitsune:match:report_azure:1');eq(active.components[0].components[1].data.label,'Nova Won');
 const won=matchPanel.buildMatchPanel({...match,status:'completed',winnerTeam:'crimson'});assert.ok(won.embeds[0].data.description.includes('Vortex'));count++;
 reset();let result=await daily.claimDaily('g','u');eq(result.reward,50);eq(db.user.xp,60);eq(result.streak,1);eq(result.nextClaimAt.getTime(),now+DAY);
 result=await daily.claimDaily('g','u');eq(result.claimed,false);eq(db.user.xp,60);
 now+=DAY;result=await daily.claimDaily('g','u');eq(result.streak,2);eq(result.reward,75);
 now+=DAY;result=await daily.claimDaily('g','u');eq(result.streak,3);eq(result.streakBonus,25);eq(result.reward,125);
 now+=2*DAY;result=await daily.claimDaily('g','u');eq(result.streak,4);
 now+=2*DAY+1;result=await daily.claimDaily('g','u');eq(result.streak,1);eq(result.streakReset,true);
 reset();const before=structuredClone(db);failUpdate=true;await assert.rejects(()=>daily.claimDaily('g','u'));count++;failUpdate=false;eq(db,before);
 reset();let q=await quests.claimQuestReward('g','u','active_soul',cycle);eq(q.reward,75);eq(q.boardBonus,0);
 q=await quests.claimQuestReward('g','u','dedicated_warrior',cycle);eq(q.reward,125);
 q=await quests.claimQuestReward('g','u','blood_moon_devotion',cycle);eq(q.reward,100);eq(q.boardBonus,50);eq(db.user.xp,310);
 q=await quests.claimQuestReward('g','u','blood_moon_devotion',cycle);eq(q.reason,'already_claimed');eq(db.user.xp,310);
 reset();db.quest.eligible_messages=14;q=await quests.claimQuestReward('g','u','active_soul',cycle);eq(q.reason,'incomplete');
 q=await quests.claimQuestReward('g','u','active_soul','not-a-cycle');eq(q.reason,'invalid_cycle');
 q=await quests.claimQuestReward('g','u','active_soul','33333333-3333-4333-8333-333333333333');eq(q.reason,'expired');
 reset();db.quest.claimed_rewards=['active_soul','dedicated_warrior'];const saved=structuredClone(db);failUpdate=true;await assert.rejects(()=>quests.claimQuestReward('g','u','blood_moon_devotion',cycle));count++;failUpdate=false;eq(db,saved);
 const data=await quests.getDailyQuests('g','u');eq(data.quests.length,3);eq(data.boardBonus,50);
 const button={data:{custom_id:'old:active_soul:'+cycle},setLabel(x){this.label=x;return this;}};
 const panel=view.decorateQuestPanel({components:[{components:[button]}]},data);eq(button.data.custom_id,'old:active_soul:'+cycle);eq(panel.components[0].components[0],button);
 for(const e of panel.embeds){assert.ok(e.data.description.length<4096);count++;for(const field of e.data.fields){assert.ok(field.value.length<=1024);count++;}}
 const embed=presentation.dailyEmbed({claimed:true,reward:125,baseReward:100,streakBonus:25,streak:3,level:1,nextClaimAt:new Date(now+DAY)});assert.ok(embed.data.description.includes('+25 XP'));count++;
 assert.ok(released>0);count++;
 console.log(`${count} offline mission and reward checks passed. No real database or Discord calls.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
