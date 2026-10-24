const socialTone=require('../../config/kitsuneSocialTone');
const {randomInt}=require('node:crypto');
const {ownerId}=require('../../config/kitsunePersonality');
const {questions}=require('./briefConversation');
const simpleQuestions=['What is one small thing you are looking forward to?','What place would you like to visit?','What made you smile recently?'];
function explainStored(request,replies){
 const old=request.conversation??{},ref=old.templateRef;
 const line=ref && replies[ref.pool]?.[ref.index];
 if(!line)return 'Which sentence do you want explained? Paste it so I can address the actual words.';
 const form=request.recovery?.data.form??'explain';
 const topic=ref.topic;
 let meaning,example;
 if(topic==='secret'){
  if(/silence|pause/iu.test(line)){meaning='I make quiet pauses part of my character’s dramatic style.';example='For example, a pause before saying hello can make an ordinary greeting seem mysterious.';}
  else if(/normal sentence|problem/iu.test(line)){meaning='I make an ordinary sentence sound more mysterious or dramatic than it really is.';example='For example, I might call a simple plan a mysterious mission.';}
  else if(/entrance|hello/iu.test(line)){meaning='I describe an ordinary greeting as a dramatic arrival.';example='For example, saying hello becomes making a grand entrance in the story.';}
  else if(/composed|conversation|chat/iu.test(line)){meaning='The character acts composed, but enjoys friendly conversation.';example='For example, a friendly hello can make the character drop her mysterious attitude.';}
 }else if(topic==='tip'){
  if(/finish|task|small thing/iu.test(line)){meaning='Finish one manageable task before adding more work.';example='For example, finish one exercise before opening three new tasks.';}
  else if(/question|expected/iu.test(line)){meaning='Explain what happened and what you wanted to happen.';example='For example: I expected the command to reply, but it stayed silent.';}
  else if(/angry|reread|reply/iu.test(line)){meaning='Pause and reread a message before answering in anger.';example='For example, check whether a short reply was unclear rather than intentionally rude.';}
 }else if(topic==='joke'){
  meaning='The joke treats an ordinary object or situation as if it could complain or behave like a person.';
  example='For example, a calendar having a sense of humor means the schedule went unexpectedly.';
 }
 if(!meaning){
  if(/shorter|one sentence|more simply/u.test(form))return line.split(/(?<=[.!?])\s+/u)[0];
  return 'Which words should I clarify or give an example of? I do not want to invent a different meaning.';
 }
 if(/example/u.test(form))return example??meaning;
 if(/more detail/u.test(form))return meaning+' '+(example??'It is a character line rather than a literal event.');
 if(/why/u.test(form))return 'The point is: '+meaning;
 return meaning;
}
const lines={
 hello:'Hi. Good to see you.',hello_question:'Hi. How are you doing?',
 joke_short:'My imaginary calendar asked for a day off.',
 kind_advice:'Choose one manageable step and give yourself time to try it. No teasing.',
 goodbye:'Talk later. Take care.',return:'Welcome back. What is on your mind?',
 defer:'We can leave that for later. There is no need to continue it now.',
 listen:'Go ahead. I will listen before offering suggestions.',listen_quiet:'Understood. Take your time; I will leave the advice and teasing aside.',
 not_eaten:'You have not eaten yet, then. Want to talk while you take a food break, or leave the chat for later?',
 cannot_sleep:'Sleep is not coming easily, then. Would you prefer a quiet conversation or to leave the chat for now?',
 better:'You were feeling rough, but things are better now. Glad to hear it.',
 sleepy_contrast:'Sleepy, but not worn out. I hear the distinction; we can keep this quiet.',
 disappointed:'Disappointed rather than angry, understood. What part let you down?',
 hurt_report:'Being called that can hurt. What happened? You do not have to accept the label.',
 reported_bot:'You are reporting someone else’s words. I will not treat their insult as yours.',
 denial:'You are denying the insult, understood. I will not treat it as an attack.',
 feedback_hurt:'I hear that my wording bothered you. I am sorry for that. Which part should I address?',
 apology:'Apology accepted. We can start again without carrying the insult forward.',
 reassurance:'Understood. We can move on.',gratitude:'You are welcome. I am glad it helped.',
 style:'A compliment on my style? I will try not to look too pleased.',
 feedback:'That did not work for you, understood. Which part should I change? I will leave the sharp teasing aside.',
 joking:'A joke, understood. We can keep it playful without making it personal.',
 peace:'We do not need an argument. I will keep this calm.',
 no_nickname:'Understood. I will avoid pet names and unwanted nicknames.',
 flirt:'A bold line. I can keep the conversation playful; what did you have in mind?',
 identity:'Yes, I am a bot playing a fox character. The attitude is part of the performance.',
 insult:'Enough. The insult is clear; the point is missing. Ask properly if you want a useful answer.',
 protect:'Leave the cheap shots at Davi out of it. If there is a real issue, explain it without the insult.',
 report_davi:'That insult was aimed at Davi, and I would challenge the person who said it. I will not blame you for reporting it.',
 defend_davi:'You are defending Davi, understood. I will not mistake that for insulting him.',
 apology_davi:'Apology accepted. Leave the insults about Davi behind and we can talk normally.',
 davi_disagreement:'A disagreement or mistake can be discussed. What happened? Criticism does not need an insult.',
 davi_helped:'He helped you, then. It is good to acknowledge that. What did he help with?',
 davi_presence:'I cannot confirm whether Davi is here or available from this conversation. You could ask him directly.',
 davi_concern:'What happened with Davi? Tell me what kind of help is needed so I can point you toward something useful.',
 jealous:'Talking about Davi so fondly? The fox has noticed. A little jealous, perhaps; do go on.',
 davi_followup:'You mean Davi, understood. You can be grateful without flirting. What did you appreciate?',
 who:'Who do you mean? Tell me the person’s name so I do not guess.',
 name_question:'My name is Kitsune. The fox attitude comes with it.',
 creator:'Davi built and develops this server bot.',
 capabilities:'I can chat through recognized English patterns, make random choices, offer preset advice and help you find server commands. I cannot answer every question or play games myself.',
 chat_identity:'A little conversation suits this fox character. What would you like to talk about?',
 fox:'A fox-themed fictional character, yes. The bot behind the character is software.',
 origin:'Kitsune means fox in Japanese. It fits the fox-themed character.',
 understanding:'I understand many supported English phrases and some recent context. I can still miss new wording or complicated meanings.',
 language:'English input and replies are what this conversation system is designed for.',
 can_joke:'Yes. Ask me for a joke; I have a collection of character jokes.',
 help_scope:'I can help with conversation, simple choices, preset study suggestions and server commands. What do you need help with?',
 friend_study:'What is your friend trying to study? One subject and one difficult part would be a useful starting point.',
 game_help:'What kind of game help: finding a player, making a choice, or discussing the game? I cannot control or play the game.',
 find_players:'Try /match to look for other players on the server. I can explain the command, but I cannot join the game myself.',
 lost:'Another loss, then. Frustrating. Would you rather vent or discuss what happened?',
 interesting:'A character thought: a quiet setting can make a dramatic line land harder. Want a little story or a question?',
 atmospheric:'Atmospheric means creating a strong mood or feeling. In music, soft sounds, space or tension can create that atmosphere.',
 game_both:'Both competitive and relaxed play, then. Does the choice depend on your mood or who you play with?',
 game_company:'The people you play with change the experience. Friends, a team, or whoever is online?',
 game_friends:'Playing with friends, understood. Is the teamwork or the conversation the best part?',
 music_quiet:'Quiet music, then. Something to unwind with, or something you can focus to?',
 music_mix:'Sometimes a louder track fits, too. Your music does not have to stay in one mood.',
 music_mood:'Both can fit, depending on your mood. What have you felt like listening to lately?',
 suggestion:'An easy question, a song to talk about, or a small fictional story could work. Which appeals to you?',
 changed_mind:'Changed your mind, understood. You do not need to keep the earlier choice.',
};
function recoveryResponse(message,request,replies,roll=randomInt){
 const r=request.recovery;if(!r||r.kind==='alias'||r.kind==='choice_other'||r.kind==='tone'||r.kind==='study')return null;
 const old=request.conversation??{},memory=old.core??{};
 let content=lines[r.kind],category=request.category,extra={};
 const owner=message.author.id===ownerId;
 const draw=(key)=>{const pool=socialTone[key];const choices=pool.map((line,index)=>({line,index})).filter(row=>memory.socialKey!==key||memory.socialIndex!==row.index);const selected=choices[roll(choices.length)];extra.core={...memory,socialKey:key,socialIndex:selected.index,...(key==='protect'||r.kind==='jealous'?{person:'davi'}:{}),topic:'social'};return selected.line;};
 if(r.kind==='jealous_question')content=draw(owner?'ownerJealous':'memberJealous');
 if(r.kind==='social_friend')content=owner?'A friend, hm? A little fox jealousy, perhaps. Tell me how the conversation went.':'You can talk to your friends. The jealousy is just a little fox teasing.';
 if(r.kind==='social_reassure')content=owner?'There you are... I am glad you came back. No sulking; we can just talk.':'All right. We can keep this calm and talk normally.';
 if(r.kind==='social_friends')content=owner?'I know. You can have your friends and still catch this fox off guard. We are fine.':'Just friends, understood. I will keep the teasing light; there is no quarrel with you.';
 if(r.kind==='social_grateful')content='Understood. Being kind or grateful does not mean you are flirting. I will leave the jealousy there.';
 if(r.kind==='davi_grateful')content='Grateful to Davi, understood. You can appreciate his help without me turning it into a quarrel.';
 if(r.kind==='social_company')content=owner?'I am here... we can keep talking. What has been on your mind?':'We can stay with a normal conversation. What is on your mind?';
 if(r.kind==='answer_scope'){content='You mean my answer, not me. Understood. What part should I explain differently?';extra.core={topic:'answer_repair',answerKind:r.data.boundary?'boundary':'unknown'};}
 if(r.kind==='answer_repair'||r.kind==='answer_short'){
  content=r.data.boundary?(r.kind==='answer_short'?'Ask your question plainly; I will address it.':'I meant: insults do not explain the problem. Tell me the actual question so I can address it.'):'Which answer or question should I clarify? I do not have enough detail to invent an explanation.';
  extra.core={topic:'answer_repair',answerKind:r.data.boundary?'boundary':'unknown'};
 }
 if(r.kind==='quote_correction'){content='Thanks for clarifying. You are reporting words you disagree with. The boundary is for the person who said them, not you.';extra.core=r.data.davi?{person:'davi',topic:'social'}:{topic:'social'};}
 if(r.kind==='reconciled')content='We are good. We can talk normally from here.';
 if(['jealous_question','social_friend','social_reassure','social_friends','social_grateful','social_company','davi_grateful'].includes(r.kind)&&!extra.core)extra.core={topic:'social',...(memory.person==='davi'||r.data.davi||r.kind==='davi_grateful'?{person:'davi'}:{})};
 if(r.kind==='mommy')content=message.author.id===ownerId?'D-daddy? You cannot just say that and expect the fox to stay composed.':'No. Keep that nickname to yourself. Address me normally.';
 if(r.kind==='pve')content='PvE: facing the game’s enemies and challenges. Do you enjoy combat, exploration, or the story?';
 if(r.kind==='insult' && message.author.id===ownerId)content='Tell me what went wrong. I will leave the sharp reply aside.';
 if(r.kind==='protect' && message.author.id===ownerId)content='That includes how you speak about yourself. Tell me what went wrong without putting yourself down.';
 if(r.kind==='davi_followup'&&r.data.form==='funny')content='Funny, that is all, understood. A friendly compliment does not need an argument.';
 if(r.kind==='insult'&&!owner)content=draw('insult');
 if(r.kind==='protect'&&!owner)content=draw('protect');
 if(r.kind==='jealous'&&!owner)content=draw('daviJealous');
 if(r.kind==='jealous' && message.author.id===ownerId)content='A little praise for yourself? You did catch my attention.';
 if(r.kind==='remember')content=message.author.id===ownerId?'I recognize your account as Davi, the owner. I can follow some recent context, but I do not keep or quote your full chat history.':'I can follow some recent context in this channel, but I do not remember your full chat history.';
 if(r.kind==='state'){
  const d=r.data;
  content=d.target==='friend'?`Your friend is ${d.state}, understood. ${d.selfDenied?'You said you are not. ':''}What has been going on with them?`
   :d.time==='past'?`You felt ${d.state} earlier. How are you feeling now?`
   :d.time==='negated'?`You are not ${d.state}, understood. I will not assume otherwise.`
   :d.time==='recovered'?`You are no longer ${d.state}, understood. What changed?`
   :d.state==='cold'?'Feeling cold, then. We can keep the conversation quiet while you get comfortable.'
   :d.state==='nervous'?'Nervous about what is coming, then. Want to talk about it, or have a distraction?'
   :'You are not feeling okay. I am listening; you do not have to make it sound better than it feels.';
 }
 if(r.kind==='bot_state')content='I do not have a human body or those physical feelings. I can keep the fox character’s tone calm and stay in the conversation.';
 if(r.kind==='mixed_state')content=`You feel ${r.data.left} and ${r.data.right} at the same time. I hear both parts.`;
 if(r.kind==='argument')content=r.data.target==='game'?'Your game is frustrating you, not me. Want to tell me what happened?':r.data.target==='other'?'You are upset, but not at me. I will not make it about myself. What happened?':'An argument with your friend, then. What part bothered you? I can listen without taking sides.';
 if(r.kind==='name'){content=`Understood. I will call you ${r.data.name}.`;extra.preferredName=r.data.name;}
 if(r.kind==='music_topic'){content='Music, then. What kind do you enjoy?';category='music_chat';}
 if(r.kind==='game_topic'){content='Talking about games, understood. Competitive play or something more relaxed?';category='game_chat';}
 if(r.kind==='music_quiet')category='music_chat';
 if(r.kind==='music_mix')category='music_mix';
 if(r.kind==='music_mood')category='music_mood';
 if(['game_both','game_company','game_friends'].includes(r.kind))category='game_chat';
 if(r.kind==='open_question'){const index=(memory.question??-1)+1;const q=index%simpleQuestions.length;content=simpleQuestions[q];extra.core={question:q,noSchool:Boolean(r.data.noSchool)};}
 if(r.kind==='question_repeat'){
  const q=old.shortChat?.questionIndex;
  content=Number.isInteger(q)&&questions[q]?questions[q].question:Number.isInteger(memory.question)?simpleQuestions[memory.question]:'I do not have a specific question saved here. Want a new easy question?';
  extra.shortChat=old.shortChat??null;extra.core=memory;
 }
 if(r.kind==='changed_mind' && old.shortChat)extra.shortChat={...old.shortChat,selected:null};
 if(r.kind==='choice_info'){
  const options=old.pickOptions,selected=old.pickSelected;
  content=!options?.length?'There is no active choice here. Send two options so I know what you mean.':r.data.form==='what did you pick'?`I picked **${selected}**.`:r.data.form==='either is fine'?'Either works for you, understood. The previous pick still stands.':`The current options are ${options.join(' / ')}.`;
  if(options?.length){category='pick';extra.pickOptions=options;extra.pickSelected=selected;}
 }
 if(r.kind==='opinion')content=memory.topic==='argument'?'I would separate what happened from assumptions about your friend’s intent. What was said?':'I can give a view now. Which part do you want my opinion on?';
 if(r.kind==='explain'){content=explainStored(request,replies);category=old.templateRef?.topic??request.context??category;extra.templateRef=old.templateRef??null;}
 const topic=r.kind==='game_help'?'game':r.kind==='argument'?'argument':null;
 if(!extra.core && (topic||r.kind.startsWith('davi_')||['jealous','protect','report_davi','defend_davi'].includes(r.kind)))extra.core={...(topic?{topic}:{}),...((r.kind.startsWith('davi_')||['jealous','protect','report_davi','defend_davi'].includes(r.kind))?{person:'davi'}:{})};
 if(old.mode?.remaining>0 && old.mode.name!=='normal'){
  if(r.kind==='joke_short' && old.mode.name==='serious')content='I will skip jokes while the straightforward tone is active. Say normal mode to restore the playful tone.';
  if(r.kind==='insult')content='I will keep this calm. Tell me what bothered you without the insult.';
  if(r.kind==='protect')content='Please keep discussion about Davi respectful. What is the actual issue?';
  if(r.kind==='jealous_question')content='Only light fox teasing. I will keep this calm.';
  if(r.kind==='jealous')content='A positive comment about Davi, understood.';
 }
 if(['feedback','feedback_hurt','peace','listen_quiet'].includes(r.kind))extra.modeChange='gentle';
 if(!content)return null;
 return {payload:{content},category,session:request.category!=='stop',question:false,pending:null,...extra};
}
module.exports={recoveryResponse,explainStored};
