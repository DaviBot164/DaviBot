'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {nextPreferences}=require(path.join(root,'handlers/kitsune/aiTurnGuidance'));
const {createAiLab}=require(path.join(root,'handlers/kitsune/aiTestLab'));
const {OWNER_ID}=require(path.join(root,'handlers/kitsune/settings'));
let count=0;const eq=(a,b)=>{assert.deepEqual(a,b);count++;};
for(const text of ['no advice please','no tips','without advice','i dont want advice','i dont need any tips','do not give me tips','not looking for advice','just company'])eq(nextPreferences({},text).listening,true);
for(const text of ['give me one tip','one small tip','got any advice?','i want a tip'])eq(nextPreferences({listening:true},text).listening,false);
eq(nextPreferences({},'i dont want advice, just listen').listening,true);
eq(nextPreferences({},'no advice please, actually give me one tip').listening,false);
eq(nextPreferences({},'give me a tip, actually no advice').listening,true);
eq(nextPreferences({},'someone said no advice please'),{});
eq(nextPreferences({},'he told me "give me a tip"'),{});
eq(nextPreferences({},'"no advice please" is the phrase'),{});
(async()=>{
 const calls=[];const lab=createAiLab({env:{KITSUNE_AI_LAB_ENABLED:'true',GROQ_API_KEY:'mock'},fetchFn:async(url,o)=>{calls.push(JSON.parse(o.body));return{ok:true,json:async()=>({choices:[{message:{content:'Mock only.'},finish_reason:'stop'}]})};}});
 const input={userId:OWNER_ID,guildId:'g',channelId:'c',persona:'member',seed:17};
 await lab.runAiLab({...input,text:'kitsune i lost another pvp match, no advice please || i keep attacking too early || just listen and keep it short'});
 for(const call of calls){assert.match(call.messages[0].content,/Listening requested/);count++;}
 await lab.runAiLab({...input,seed:undefined,text:'okay, now one small tip based only on what i told you || give me an example without adding game mechanics || what mistake did i say i keep making?'});
 for(const call of calls.slice(3)){assert.ok(!call.messages[0].content.includes('Listening requested'));assert.match(call.messages[0].content,/Grounding requested/);assert.match(call.messages[0].content,/guard drops/);count+=3;}
 eq(calls.length,6);eq(calls[3].messages.length,8,'history continues across slash batches without seed');
 await lab.runAiLab({...input,persona:'owner',text:'hello'});assert.ok(!calls.at(-1).messages[0].content.includes('Grounding requested'));count++;
 await lab.runAiLab({...input,text:'hello'});assert.ok(!calls.at(-1).messages[0].content.includes('Grounding requested'));count++;
 console.log(count+' advice-negation variants, cue ordering, quotation protection and exact live-chain request guidance checks passed. All HTTP mocked; not a model-quality test.');
})().catch(e=>{console.error(e);process.exitCode=1;});
