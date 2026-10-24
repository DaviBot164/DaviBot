// Bounded context + semantic slots. Never store a transcript or infer another person's intent.
const bank=require('../../config/kitsuneFollowThrough');
const norm=value=>String(value??'').normalize('NFKC').toLowerCase().replace(/[!?.,…]+$/gu,'').trim();
const escape=value=>String(value).replace(/[\\`*_~|<>]/gu,'');
function analyzeFollowThrough(frame,session){
 if(!frame?.valid)return null;
 const text=frame.plainSentence.replace(/^(?:okay|ok|actually) /u,'').replace(/^please /u,'').replace(/ please$/u,'');
 const action=text.replace(/^(?:can|could|would) you (?:please )?/u,'');
 const thread=session?.thread;
 const out=(kind,data={})=>({category:'flow_'+kind,kind,data});
 const friend=thread?.kind==='friend'||session?.core?.topic==='argument';
 const boundary=thread?.kind==='boundary';
 const music=thread?.kind==='music'||/^music/u.test(session?.topicCategory??session?.category??'');
 const games=/^game_/u.test(session?.topicCategory??session?.category??'');
 const joke=thread?.kind==='joke'||/joke/u.test(session?.category??'')||session?.templateRef?.topic==='joke';
 // A new explicit topic replaces stale drafts, choices and paused work.
 if(/^(?:forget that|never mind|leave that)(?: and)? (?:lets|let us) talk about music(?: instead)?$/u.test(text))return out('music_start');
 if(/^(?:lets|let us) leave that and (?:talk|chat) about (games|music)$/u.test(text))return out(text.endsWith('games')?'game_start':'music_start');
 const switchTopic=text.match(/^enough about (?:music|games) (?:lets|let us) (?:talk|chat) about (music|games)$/u);
 if(switchTopic)return out(switchTopic[1]==='games'?'game_start':'music_start');
 const shorter=/^(?:make it shorter|shorter|shorter please|keep it short|one sentence please|make it shorter but keep the meaning)$/u.test(text);
 if(games){
  const corrected=text.match(/^(pvp|pve) not (?:pvp|pve)$/u);
  if(corrected)return out('game_correct',{preference:corrected[1]});
  if(/^what did i say i prefer$/u.test(text))return out('game_recall',{preference:thread?.kind==='game'?thread.preference:session.topicCategory==='game_relaxed'||session.category==='game_relaxed'?'pve':session.topicCategory==='game_competitive'||session.category==='game_competitive'?'pvp':null});
 }
 if(games&&shorter)return out('game_short',{preference:session.topicCategory==='game_relaxed'||session.category==='game_relaxed'?'pve':session.topicCategory==='game_competitive'||session.category==='game_competitive'?'pvp':null});
 if((friend||boundary)&&thread?.draft){
  if(/^(?:a bit more detail|more detail|make it more detailed)$/u.test(text))return out('draft_edit',{moreDetail:true});
  if(/^(?:make it more formal|more formal)$/u.test(text))return out('draft_edit',{formal:true});
  if(/^keep the no-pressure part$/u.test(text))return out('draft_edit',{noRush:true});
  if(shorter||/^(?:keep it casual and short|less formal|keep it casual|mention my earlier message|do not ask (?:him|her|them) to reply immediately|do not make it sound like i am blaming (?:him|her|them))$/u.test(text))return out('draft_edit',{short:shorter||/short/u.test(text),casual:/casual|formal/u.test(text),noBlame:/blaming/u.test(text),preserveMeaning:/keep the meaning/u.test(text),mentionEarlier:/earlier message/u.test(text),noRush:/reply immediately/u.test(text)});
 }
 if(music){
  const removal=text.match(/^(?:i (?:do not|no longer) (?:like|listen to) |not )(rock|pop|jazz|classical|metal|piano|quiet piano|lofi|lo fi)(?: anymore| any more)?$/u);
  if(removal)return out('music_remove',{genre:removal[1]});
  const correction=text.match(/^(rock|pop|jazz|classical|metal|piano|quiet piano|lofi|lo fi) not (rock|pop|jazz|classical|metal|piano|quiet piano|lofi|lo fi)$/u);
  if(correction)return out('music_correct',{genre:correction[1],previous:correction[2]});
  if(/^only when i am working$/u.test(text))return out('music_place',{place:'work',only:true});
  if(/^(?:what did i say i listen to|what music did i say i like)$/u.test(text))return out('music_recall');
  if(shorter&&thread?.kind==='music')return out('music_short');
 }
 if(session?.pickOptions?.length>=2||thread?.kind==='choice'&&thread.cancelled){
  if(/^(?:i have changed my mind|i changed my mind|neither lets leave it|neither let us leave it|neither leave it)$/u.test(text))return out('choice_cancel',{close:/neither/u.test(text)});
  if(/^(?:what did we decide|what did we choose|what is our choice)$/u.test(text))return out('choice_recall');
  if(/^(?:was that random or my choice|did i choose that or was it random)$/u.test(text))return out('choice_source');
 }
 if(joke){
  if(/^(?:not games something about animals|something about animals|another one about animals)$/u.test(text))return out('joke',{theme:'animals'});
  if(/^(?:keep it wholesome|keep it clean)$/u.test(text))return out('joke',{wholesome:true});
  if(shorter&&thread?.kind==='joke')return out('joke_short');
 }
 if((music||friend||boundary||thread?.kind==='joke')&&/^(?:continue|go on|carry on|we can continue)$/u.test(text))return out('resume');
 if(session?.suspended){
  if(/^(?:not yet|still not ready|wait a little longer)$/u.test(text))return out('hold');
  if(/^(?:continue|go on|carry on|we can continue|i am ready now|ready now)$/u.test(text))return out('resume');
 }
 if(/^(?:(?:my|a) friend (?:ignored me|did not reply|left me on read|(?:hasnt|has not) replied(?: yet)?|(?:hasnt|has not) answered(?: yet)?)|i feel ignored)$/u.test(text))return out('friend_event',{event:/left me on read/u.test(text)?'seen_unanswered':'unanswered',target:text==='i feel ignored'?'unknown':'friend'});
 if(friend&&/^(?:he|she|they) (?:ignored what i said|did not answer|did not reply)$/u.test(text))return out('friend_event',{event:'unanswered'});
 if(friend&&/^maybe (?:he|she|they) (?:(?:was|were) (?:just )?busy|had a busy day)$/u.test(text))return out('friend_possible',{cause:'busy'});
 if(friend&&/^maybe (?:he needs|she needs|they need) (?:some )?space$/u.test(text))return out('friend_possible',{cause:'space'});
 if(friend&&/^i do not want to pressure (?:him|her|them)$/u.test(text))return out('friend_no_pressure');
 if(friend&&/^help me write a (?:gentle|polite) follow(?:-| )up$/u.test(action))return out('draft',{target:'friend',noRush:true,noBlame:true});
 if(friend&&/^i do not want to (?:assume the worst|jump to conclusions)$/u.test(text))return out('friend_caution');
 if(/^(?:i )?do not want to (?:play|play games) today$/u.test(text))return out('boundary_start');
 if(boundary&&/^(?:my friends|they) keep asking(?: me(?: to play)?)?$/u.test(text))return out('boundary_pressure');
 if(boundary&&/^i (?:already )?said no$/u.test(text))return out('boundary_no');
 if(/^(?:what should i say to my friend|help me write a polite message)$/u.test(action))return out('draft',{target:boundary?'boundary':friend||/my friend/u.test(action)?'friend':'unknown'});
 if(friend&&/^how (?:can|do) i check in politely$/u.test(text))return out('draft',{target:'friend'});
 if(friend&&/^what should i say to (?:him|her|them)$/u.test(text))return out('draft',{target:'friend'});
 if((friend||boundary)&&/^(?:how do i say it nicely|without sounding rude|something short and polite)$/u.test(text))return out('draft',{target:boundary?'boundary':'friend',short:/short/u.test(text)});
 const options=session?.pickOptions;
 if(options?.length>=2){
  let match=text.match(/^(?:then )?why (?:(?:did you|have you) (?:pick|choose|chosen) )?(.+)$/u);
  if(match&&match[1].length<=100){const option=options.find(x=>norm(x)===match[1]);if(option||(/why (?:did you|have you)/u.test(text)&&!['that','it','that one'].includes(match[1])))return out('choice_why',{option:option??null});}
  match=text.match(/^i (?:actually )?(?:prefer|would prefer) (.+)$/u);
  if(match){const option=options.find(x=>norm(x)===match[1]);if(option)return out('choice_prefer',{option});}
  match=text.match(/^(?:let us|lets) (?:go with|choose) (.+)$/u);
  if(match){const option=options.find(x=>norm(x)===match[1]);if(option)return out('choice_decide',{option});const instead=options.find(x=>norm(x)===match[1].replace(/ instead$/u,''));if(/ instead$/u.test(match[1])&&instead)return out('choice_decide',{option:instead});}
 }
 // Modifier position is compositional, but the action stays an explicit joke request.
 let match=action.match(/^(?:tell|give) me (?:a |another )?(short|wholesome|clean|gaming) joke(?: about (?:games|gaming))?$/u);
 if(match)return out('joke',{short:match[1]==='short',wholesome:['wholesome','clean'].includes(match[1]),theme:match[1]==='gaming'||/ about /u.test(action)?'games':undefined});
 if(/^(?:tell|give) me (?:a |another )?joke about (?:games|gaming)$/u.test(action))return out('joke',{theme:'games'});
 if(joke){
  if(/^another one (?:but )?about (?:games|gaming)$/u.test(text))return out('joke',{theme:'games'});
  if(/^no sarcasm (?:this time|please)$/u.test(text))return out('joke_style',{noSarcasm:true});
  if(/^(?:something|make it) (?:wholesome|clean)$/u.test(text))return out('joke',{wholesome:true});
  if(thread?.kind==='joke'&&/^(?:another one|again|one more|(?:tell|give) me (?:a |another )?joke)$/u.test(action))return out('joke');
  if(/^(?:thats|that is|that's) more like it$/u.test(text))return out('joke_feedback');
 }
 if(music){
  match=text.match(/^(?:(?:i )?(?:mostly|usually|sometimes) )?(?:listen to )?(rock|pop|jazz|classical|metal|piano|quiet piano|lofi|lo fi)(?: music)?(?: too| as well)?$/u);
  if(match)return out('music_genre',{genre:match[1],occasional:/^sometimes /u.test(text),additive:/(?: too| as well)$/u.test(text)});
  if(/^i (?:(?:mostly|usually) )?listen(?: to music)? at work$/u.test(text)||/^(?:especially )?when i am working$/u.test(text))return out('music_place',{place:'work'});
  if(/^not always$/u.test(text))return out('music_exception');
  if(/^depends (?:on )?how my day went$/u.test(text))return out('music_reason',{reason:'day'});
  if(thread?.kind==='music'&&/^(?:what about you|how about you|and you)$/u.test(text))return out('music_reciprocal');
 }
 return null;
}
function followThroughResponse(request,roll){
 const flow=request.flow;if(!flow)return null;
 const old=request.conversation??{},prior=old.thread??{};
 let content,category=flow.category,thread=null,extra={};
 const kind=flow.kind,data=flow.data;
 const friendThread=()=>({...((prior.kind==='friend')?prior:{}),kind:'friend',...(data.event?{event:data.event}:{})});
 if(kind==='friend_event'){thread=friendThread();content=data.event==='seen_unanswered'?'They saw your message but have not replied. We do not know why yet.':'You felt ignored. Was there no reply, or did '+(data.target==='unknown'?'the person':'your friend')+' respond without addressing what you said?';}
 if(kind==='friend_possible'){thread={...friendThread(),possibleCause:data.cause};content=data.cause==='space'?'They may need some space, but that is a possibility rather than something we know. You can leave them room to reply.':'Being busy is one possibility. We do not know their reason yet; you can check in without treating a guess as a fact.';}
 if(kind==='friend_no_pressure'){thread={...friendThread(),noPressure:true};content='You want to check in without pushing them. We can leave the timing up to them.';}
 if(kind==='friend_caution'){thread=friendThread();content='You can leave room for another explanation. A calm check-in is more useful than assuming the worst.';}
 if(kind.startsWith('boundary_')){
  thread={...((prior.kind==='boundary')?prior:{}),kind:'boundary',activity:'play',time:'today'};
  content=kind==='boundary_start'?'You do not want to play today, understood. You do not owe anyone a game.'
   :kind==='boundary_pressure'?'They keep asking after your refusal, then. You can repeat your answer without making up an excuse.'
   :'You already said no. That answer can stand; being polite does not require changing it.';
 }
 if(kind==='draft'||kind==='draft_edit'){
  const target=kind==='draft_edit'?(prior.kind==='boundary'?'boundary':'friend'):data.target;
  const style={...prior.style,...Object.fromEntries(Object.entries(data).filter(([key,value])=>['short','casual','noBlame','preserveMeaning','mentionEarlier','noRush'].includes(key)&&value))};
  thread=target==='boundary'?{...prior,kind:'boundary',draft:'decline'}:target==='friend'?{...friendThread(),draft:['unanswered','seen_unanswered'].includes(prior.event)?'checkin':'generic'}:{kind:'writing',draft:'unknown'};
  if(data.short)style.detail=false;
  if(data.moreDetail){style.short=false;style.detail=true;}
  if(data.formal){style.casual=false;style.formal=true;}
  if(data.casual)style.formal=false;
  thread.style=style;
  const draft=target==='boundary'?(style.short?bank.drafts.declineShort:bank.drafts.decline):target==='friend'?(thread.draft==='checkin'?(style.short?bank.drafts.checkinShort:bank.drafts.checkin):bank.drafts.generic):null;
  // Edits preserve the check-in intent, including the earlier message and unhurried timing.
  const edited=target==='friend'&&thread.draft==='checkin'
   ?style.formal?(style.short?'Hello, following up on my message. Please reply when convenient.':style.detail?'Hello, I wanted to follow up on my earlier message and ask whether you have had a chance to consider it. Please reply when convenient; there is no urgency.':'Hello, I wanted to follow up on my earlier message. Please reply when convenient; there is no urgency.')
    :style.detail?'Hey, I wanted to check in about my earlier message and see whether you had a chance to think about it. No rush—reply when you have time.'
    :style.short?'Hey, about my message. No rush to reply.'
    :style.casual?'Hey, just checking in about my earlier message. Reply whenever you have time.'
    :style.noBlame||style.noRush||prior.noPressure||prior.event==='seen_unanswered'?'Hey, just checking in about my earlier message. No rush—reply when you have time.'
    :draft
   :draft;
  content=edited?'You could say: “'+edited+'”':'Who is the message for, and what do you want to say?';
 }
 if(kind.startsWith('choice_')){
  const options=old.pickOptions,selected=old.pickSelected;
  thread={...((prior.kind==='choice')?prior:{}),kind:'choice',origin:prior.kind==='choice'?(prior.origin??selected):selected};
  category='pick';extra.pickOptions=options;extra.pickSelected=selected;
  if(kind==='choice_cancel'){thread.cancelled=true;delete thread.preferred;delete thread.source;extra.pickSelected=null;if(data.close)extra.pickOptions=null;content='That decision is cancelled. We have no active final choice.';}
  if(kind==='choice_why'){
   if(thread.cancelled)content='The earlier decision is cancelled. We have no active choice to explain.';
   else if(!data.option)content='That is not one of the current options. They are '+options.map(escape).join(' / ')+'.';
   else if(norm(data.option)!==norm(selected))content='The current choice is **'+escape(selected)+'**. **'+escape(data.option)+'** was the other option; the original draw was random.';
   else content=thread.source==='user'?'We settled on **'+escape(selected)+'** after your preference. That is your choice.':'**'+escape(selected)+'** was randomly drawn from the options. I did not rank the options or know your preference.';
  }
  if(kind==='choice_recall')content=thread.cancelled?'We cancelled that decision. There is no active final choice.':'We settled on **'+escape(selected)+'**'+(thread.source==='user'?' — your final choice.':', from the random draw.') ;
  if(kind==='choice_source')content=thread.cancelled?'The decision was cancelled; neither the old random draw nor your earlier choice is a current decision.':thread.source==='user'?'The final choice, **'+escape(selected)+'**, was yours. The original random draw was **'+escape(thread.origin)+'**.':'**'+escape(selected)+'** came from a random draw. You have not made a final choice after it.';
  if(kind==='choice_prefer'){thread.preferred=data.option;content='You prefer **'+escape(data.option)+'**, understood. We can go with your preference instead of the random draw.';}
  if(kind==='choice_decide'){delete thread.cancelled;thread.preferred=data.option;thread.source='user';extra.pickSelected=data.option;content='**'+escape(data.option)+'** it is. We are going with your choice.';}
 }
 if(kind.startsWith('music_')){
  category=kind==='music_reciprocal'?'music_preferences':'music_chat';
  thread={...((prior.kind==='music')?prior:{}),kind:'music'};
  if(kind==='music_start'){thread={kind:'music'};extra.suspended=null;content='Music, then. What kind do you enjoy?';}
  if(kind==='music_correct'){thread.genre=data.genre;if([data.previous,data.genre].includes(thread.alternate)){delete thread.alternate;delete thread.alternateFrequency;}thread.additional=(thread.additional??[]).filter(value=>value!==data.genre&&value!==data.previous);content=data.genre+' instead, understood. I have corrected the genre.';}
  if(kind==='music_remove'){if(thread.genre===data.genre)delete thread.genre;if(thread.alternate===data.genre){delete thread.alternate;delete thread.alternateFrequency;}thread.additional=(thread.additional??[]).filter(value=>value!==data.genre);content='I will no longer list '+data.genre+' as one of your current preferences.';}
  if(kind==='music_recall'){
   const genres=[thread.genre,thread.alternate?(thread.alternateFrequency==='sometimes'?'sometimes ':'')+thread.alternate:null,...(thread.additional??[])].filter(Boolean);
   content=genres.length?'You said '+genres.join(', and ')+(thread.place?(thread.only?' only while working':' while working'):'')+'.':'There is no current genre preference saved in this conversation.';
  }
  if(kind==='music_short')content=thread.genre||thread.alternate?(thread.genre??(thread.alternateFrequency==='sometimes'?'sometimes ':'')+thread.alternate)+(thread.place?(thread.only?' only while working':' while working'):'')+' — got it.':'What music do you like?';
  if(kind==='music_genre'){
   if(data.occasional){thread.alternate=data.genre;thread.alternateFrequency='sometimes';}
   else if(data.additive){if(data.genre!==thread.genre&&data.genre!==thread.alternate)thread.additional=[...new Set([...(thread.additional??[]),data.genre])].slice(-6);}
   else{thread.genre=data.genre;thread.additional=(thread.additional??[]).filter(value=>value!==data.genre);if(thread.alternate===data.genre){delete thread.alternate;delete thread.alternateFrequency;}}
   content=data.occasional?'Sometimes '+data.genre+', then. A different sound can suit a different moment.':data.additive?data.genre+' as well, understood. I will add it without replacing your earlier preference.':'Mostly '+data.genre+', got it. What do you enjoy about that sound?';
  }
  if(kind==='music_place'){thread.place='work';thread.only=Boolean(data.only);content=data.only?'Only while working, understood. I will keep that limit with your music preference.':'You listen while working, then. Does it help you focus, or make the time more pleasant?';}
  if(kind==='music_exception'){thread.varies=true;content='Not always, understood. That is a preference, not a rule for every moment.';}
  if(kind==='music_reason'){thread.varies=true;thread.reason='day';content='How the day went changes what you want to hear. A quiet reset sometimes, a different sound at other times.';}
  if(kind==='music_reciprocal')content='Atmospheric melodies with a little tension suit my style. A little mystery belongs in the soundtrack.';
 }
 if(kind==='game_start'){category='game_chat';thread=null;extra.suspended=null;content='Games, then. Do you prefer PvP or PvE?';}
 if(kind==='game_correct'||kind==='game_recall'){category=data.preference==='pve'?'game_relaxed':data.preference==='pvp'?'game_competitive':'game_chat';thread={kind:'game',preference:data.preference};content=data.preference?(kind==='game_correct'?data.preference.toUpperCase()+' instead, understood. I have corrected your preference.':'You said you prefer '+data.preference.toUpperCase()+'.'):'You have not specified a PvP or PvE preference in this game conversation.';}
 if(kind==='game_short'){category=old.topicCategory??old.category;thread=null;content=data.preference==='pve'?'PvE means playing against the game’s enemies.':data.preference==='pvp'?'PvP means playing against other players.':'Do you prefer PvP or PvE?';}
 if(kind.startsWith('joke')){
  category='joke';thread={...((prior.kind==='joke')?prior:{}),kind:'joke',...Object.fromEntries(Object.entries(data).filter(([,v])=>v!==undefined))};
  if(kind==='joke_style')content='Understood. I will keep the next joke gentle and free of sarcasm.';
  else if(kind==='joke_feedback')content='Glad that style works better. I will keep it gentle.';
  else if(old.mode?.name==='serious'&&old.mode.remaining>0)content='I will skip jokes while the straightforward tone is active. Say normal mode to restore the playful tone.';
  else if(kind==='joke_short'&&thread.lastJoke){
   const [pool,index]=thread.lastJoke.split(':');
   content=bank.jokeSummaries[pool]?.[Number(index)]??'Which joke would you like shortened?';
  }
  else{
   const pool=thread.theme==='animals'?'animals':thread.wholesome||thread.noSarcasm?(thread.theme==='games'?'gamesWholesome':'wholesome'):thread.theme==='games'?'games':'general';
   const options=bank.jokes[pool].map((line,index)=>({line,key:pool+':'+index})).filter(row=>row.key!==thread.lastJoke);
   const selected=options[roll(options.length)];content=selected.line;thread.lastJoke=selected.key;
  }
 }
 if(kind==='hold'){content='Not yet, understood. We can keep this paused.';thread=old.thread??null;extra.suspended=old.suspended;extra.pending=old.pending??null;}
 if(kind==='resume'){
  const saved=old.suspended?.category??old.topicCategory;
  thread=old.thread??null;extra.suspended=null;
  if(/^study_/u.test(saved??'')){category=saved;content='We can continue with one small exercise or paragraph. Which part are you working on?';extra.pending={kind:'study_step'};}
  else if(thread?.kind==='choice'&&thread.cancelled){category='pick';content='That decision is cancelled. We have no active final choice.';extra.pickOptions=old.pickOptions??null;extra.pickSelected=null;}
  else if(old.pickOptions?.length){category='pick';content='The options are '+old.pickOptions.map(escape).join(' / ')+'. The last choice was **'+escape(old.pickSelected)+'**.';extra.pickOptions=old.pickOptions;extra.pickSelected=old.pickSelected;}
  else if(/^music/u.test(saved??'')||thread?.kind==='music'){category='music_chat';content='Back to music. What would you like to add?';}
  else if(thread?.kind==='joke'){category='joke';content='We can continue with another joke. Would you like the same theme?';}
  else if(thread?.kind==='boundary'){content='We were working on a polite refusal. What would you like to change?';}
  else if(thread?.kind==='friend'||old.core?.topic==='argument'){content='We can continue talking about your friend. What would you like to add?';}
  else content='What would you like to continue? Give me the topic so I do not guess.';
 }
 return {payload:{content},category,session:true,question:false,pending:null,thread,...extra};
}
const neutralTurns=new Set(['pause','flow_hold','flow_resume','thanks','reaction_thanks','why','really','explain','simplify','tone_gentle','tone_serious','tone_reset','core_gratitude','core_listen','core_listen_quiet','fallback','clarify','reaction_question']);
function followThroughMemory(old,request,response){
 let thread=null;
 if(Object.hasOwn(response,'thread'))thread=response.thread;
 else if(neutralTurns.has(request.category))thread=old.thread??null;
 else if(old.thread?.kind==='music'&&/^music/u.test(request.category))thread=old.thread;
 else if(old.thread?.kind==='joke'&&request.category==='joke')thread=old.thread;
 const suspended=Object.hasOwn(response,'suspended')?response.suspended:request.category==='pause'?old.suspended??{category:old.category??null}:neutralTurns.has(request.category)?old.suspended??null:null;
 return {thread,suspended};
}
module.exports={analyzeFollowThrough,followThroughResponse,followThroughMemory};
