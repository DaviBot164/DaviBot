'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const root=process.argv[2]||path.resolve(__dirname,'..');
const {recognize}=require(path.join(root,'handlers/akane/language'));
const {acknowledge,recognizeSocial}=require(path.join(root,'handlers/akane/socialIntent'));
const vocabulary=require(path.join(root,'config/akaneSocialVocabulary'));
const {contextualCategory}=require(path.join(root,'handlers/akane/context'));
let count=0;const eq=(a,b,label)=>{assert.equal(a,b,label);count++;};
for(const text of ['no','nope','nah','naw','never','not really','not at all','absolutely not','definitely not','of course not','certainly not','hell no','hell nah','no chance','not a chance','never ever','hard pass','pass','i refuse','i disagree','i do not agree','rather not','not interested','i am not interested','i do not want to','i do not think so','not today','maybe not','no thanks']){
 eq(recognize(text),'no',text);eq(recognize(text+' ngl'),'no',text+' ngl');eq(acknowledge(text,{question:true}),'no',text);
}
for(const word of vocabulary.negative){
 eq(recognizeSocial('you are '+word),'reaction_insult',word);
 eq(recognizeSocial('you are not '+word),'reaction_reassurance',word);
 eq(recognizeSocial('my friend is '+word),null,word);
}
for(const word of vocabulary.positive){
 eq(recognize('you are '+word),vocabulary.appreciation.includes('you are '+word)?'thanks':'reaction_affection',word);
 eq(recognizeSocial('my friend is '+word),null,word);
}
for(const text of vocabulary.appreciation)eq(recognize(text),'thanks',text);
for(const text of ['why are you so annoying','why are you such an idiot','who the hell do you think you are','who asked you','did anyone ask you','nobody asked you','do you ever shut up','can you just shut the fuck up','shut the fuck up','why do you even exist','what is your problem','are you always this stupid','is that the best you can do','you call that an answer','your replies are trash'])eq(recognize(text),/shut .*up/.test(text)?'reaction_dismissive':'reaction_insult',text);
for(const text of ['never mind the weather','no one is stupid','i never said you were stupid','my game is garbage','i am not interested in nudes','you are not helpful','he said you are a clown'])eq(recognizeSocial(text),null,text);
eq(contextualCategory('not okay',{pending:{kind:'mood'}}),'feeling_bad');
eq(contextualCategory('not really',{question:true}),'no');
eq(contextualCategory('never',{question:true}),'no');
const pools=require(path.join(root,'config/akaneSocialReplies')).pools;
for(const tone of ['public','owner','mae'])for(const category of ['no','reaction_insult','sexual_boundary']){
 assert.ok(pools[tone][category].length>=3);count++;
 for(const reply of pools[tone][category]){assert.ok(reply.length>0&&reply.length<400);count++;}
}
console.log(`${count} refusal, vocabulary and directed-question checks passed.`);
