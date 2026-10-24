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
 const joke=thread?.kind==='joke'||/joke/u.test(session?.category??'')||session?.templateRef?.topic==='joke';
 if(session?.suspended){
  if(/^(?:not yet|still not ready|wait a little longer)$/u.test(text))return out('hold');
  if(/^(?:continue|go on|carry on|we can continue|i am ready now|ready now)$/u.test(text))return out('resume');
 }
 if(/^(?:my friend (?:ignored me|did not reply)|i feel ignored)$/u.test(text))return out('friend_event',{event:'unanswered',target:text==='i feel ignored'?'unknown':'friend'});
 if(friend&&/^(?:he|she|they) (?:ignored what i said|did not answer|did not reply)$/u.test(text))return out('friend_event',{event:'unanswered'});
 if(friend&&/^maybe (?:he|she|they) (?:was|were) (?:just )?busy$/u.test(text))return out('friend_possible',{cause:'busy'});
 if(friend&&/^i do not want to (?:assume the worst|jump to conclusions)$/u.test(text))return out('friend_caution');
 if(/^(?:i )?do not want to (?:play|play games) today$/u.test(text))return out('boundary_start');
 if(boundary&&/^(?:my friends|they) keep asking(?: me(?: to play)?)?$/u.test(text))return out('boundary_pressure');
 if(boundary&&/^i (?:already )?said no$/u.test(text))return out('boundary_no');
 if(/^(?:what should i say to my friend|help me write a polite message)$/u.test(action))return out('draft',{target:boundary?'boundary':friend||/my friend/u.test(action)?'friend':'unknown'});
 if(friend&&/^what should i say to (?:him|her|them)$/u.test(text))return out('draft',{target:'friend'});
 if((friend||boundary)&&/^(?:how do i say it nicely|without sounding rude|something short and polite)$/u.test(text))return out('draft',{target:boundary?'boundary':'friend',short:/short/u.test(text)});
 const options=session?.pickOptions;
 if(options?.length>=2){
  let match=text.match(/^(?:then )?why (?:(?:did you|have you) (?:pick|choose|chosen) )?(.+)$/u);
  if(match&&match[1].length<=100){const option=options.find(x=>norm(x)===match[1]);if(option||(/why (?:did you|have you)/u.test(text)&&!['that','it','that one'].includes(match[1])))return out('choice_why',{option:option??null});}
  match=text.match(/^i (?:actually )?(?:prefer|would prefer) (.+)$/u);
  if(match){const option=options.find(x=>norm(x)===match[1]);if(option)return out('choice_prefer',{option});}
  match=text.match(/^(?:let us|lets) (?:go with|choose) (.+)$/u);
  if(match){const option=options.find(x=>norm(x)===match[1]);if(option)return out('choice_decide',{option});}
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
  match=text.match(/^(?:(?:i )?(?:mostly|usually|sometimes) )?(?:listen to )?(rock|pop|jazz|classical|metal|piano|quiet piano|lofi|lo fi)(?: music)?$/u);
  if(match)return out('music_genre',{genre:match[1],occasional:/^sometimes /u.test(text)});
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
 if(kind==='friend_event'){thread=friendThread();content='You felt ignored. Was there no reply, or did '+(data.target==='unknown'?'the person':'your friend')+' respond without addressing what you said?';}
 if(kind==='friend_possible'){thread={...friendThread(),possibleCause:'busy'};content='Being busy is one possibility. We do not know their reason yet; you can check in without treating a guess as a fact.';}
 if(kind==='friend_caution'){thread=friendThread();content='You can leave room for another explanation. A calm check-in is more useful than assuming the worst.';}
 if(kind.startsWith('boundary_')){
  thread={...((prior.kind==='boundary')?prior:{}),kind:'boundary',activity:'play',time:'today'};
  content=kind==='boundary_start'?'You do not want to play today, understood. You do not owe anyone a game.'
   :kind==='boundary_pressure'?'They keep asking after your refusal, then. You can repeat your answer without making up an excuse.'
   :'You already said no. That answer can stand; being polite does not require changing it.';
 }
 if(kind==='draft'){
  const target=data.target;
  thread=target==='boundary'?{...prior,kind:'boundary',draft:'decline'}:target==='friend'?{...friendThread(),draft:prior.event==='unanswered'?'checkin':'generic'}:{kind:'writing',draft:'unknown'};
  const draft=target==='boundary'?(data.short?bank.drafts.declineShort:bank.drafts.decline):target==='friend'?(thread.draft==='checkin'?(data.short?bank.drafts.checkinShort:bank.drafts.checkin):bank.drafts.generic):null;
  content=draft?'You could say: “'+draft+'”':'Who is the message for, and what do you want to say?';
 }
 if(kind.startsWith('choice_')){
  const options=old.pickOptions,selected=old.pickSelected;
  thread={...((prior.kind==='choice')?prior:{}),kind:'choice',origin:prior.kind==='choice'?(prior.origin??selected):selected};
  category='pick';extra.pickOptions=options;extra.pickSelected=selected;
  if(kind==='choice_why'){
   if(!data.option)content='That is not one of the current options. They are '+options.map(escape).join(' / ')+'.';
   else if(norm(data.option)!==norm(selected))content='The current choice is **'+escape(selected)+'**. **'+escape(data.option)+'** was the other option; the original draw was random.';
   else content=thread.source==='user'?'We settled on **'+escape(selected)+'** after your preference. That is your choice.':'**'+escape(selected)+'** was randomly drawn from the options. I did not rank the options or know your preference.';
  }
  if(kind==='choice_prefer'){thread.preferred=data.option;content='You prefer **'+escape(data.option)+'**, understood. We can go with your preference instead of the random draw.';}
  if(kind==='choice_decide'){thread.preferred=data.option;thread.source='user';extra.pickSelected=data.option;content='**'+escape(data.option)+'** it is. We are going with your choice.';}
 }
 if(kind.startsWith('music_')){
  category=kind==='music_reciprocal'?'music_preferences':'music_chat';
  thread={...((prior.kind==='music')?prior:{}),kind:'music'};
  if(kind==='music_genre'){if(data.occasional)thread.alternate=data.genre;else thread.genre=data.genre;content=data.occasional?'Sometimes '+data.genre+', then. A different sound can suit a different moment.':'Mostly '+data.genre+', got it. What do you enjoy about that sound?';}
  if(kind==='music_place'){thread.place='work';content='You listen while working, then. Does it help you focus, or make the time more pleasant?';}
  if(kind==='music_exception'){thread.varies=true;content='Not always, understood. That is a preference, not a rule for every moment.';}
  if(kind==='music_reason'){thread.varies=true;thread.reason='day';content='How the day went changes what you want to hear. A quiet reset sometimes, a different sound at other times.';}
  if(kind==='music_reciprocal')content='For my fox character, atmospheric melodies with a little tension fit. That is a character preference; I do not listen while working myself.';
 }
 if(kind.startsWith('joke')){
  category='joke';thread={...((prior.kind==='joke')?prior:{}),kind:'joke',...Object.fromEntries(Object.entries(data).filter(([,v])=>v!==undefined))};
  if(kind==='joke_style')content='Understood. I will keep the next joke gentle and free of sarcasm.';
  else if(kind==='joke_feedback')content='Glad that style works better. I will keep it gentle.';
  else if(old.mode?.name==='serious'&&old.mode.remaining>0)content='I will skip jokes while the straightforward tone is active. Say normal mode to restore the playful tone.';
  else{
   const pool=thread.wholesome||thread.noSarcasm?(thread.theme==='games'?'gamesWholesome':'wholesome'):thread.theme==='games'?'games':'general';
   const options=bank.jokes[pool].map((line,index)=>({line,key:pool+':'+index})).filter(row=>row.key!==thread.lastJoke);
   const selected=options[roll(options.length)];content=selected.line;thread.lastJoke=selected.key;
  }
 }
 if(kind==='hold'){content='Not yet, understood. We can keep this paused.';thread=old.thread??null;extra.suspended=old.suspended;extra.pending=old.pending??null;}
 if(kind==='resume'){
  const saved=old.suspended?.category??old.topicCategory;
  thread=old.thread??null;extra.suspended=null;
  if(/^study_/u.test(saved??'')){category=saved;content='We can continue with one small exercise or paragraph. Which part are you working on?';extra.pending={kind:'study_step'};}
  else if(old.pickOptions?.length){category='pick';content='The options are '+old.pickOptions.map(escape).join(' / ')+'. The last choice was **'+escape(old.pickSelected)+'**.';extra.pickOptions=old.pickOptions;extra.pickSelected=old.pickSelected;}
  else if(/^music/u.test(saved??'')||thread?.kind==='music'){category='music_chat';content='Back to music. What would you like to add?';}
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
