// Everyday speech repairs found in real conversations. All matches are bounded.
function recognizePractical(text) {
 if(/^(?:let us|lets|let's|can we|could we) (?:please )?talk about (?:something (?:fun|funny|light|lighter|else)|a different topic)(?: instead)?$/u.test(text))return 'topic_change';
 if(/^(?:(?:can|could|would) you (?:please )?)?(?:explain (?:it|that|your answer) (?:more simply|in simpler words)|make (?:it|that) simpler|say (?:it|that) more simply)$/u.test(text))return 'simplify';
 if(/^(?:i (?:do not|would rather not|do not really) want to|i would rather not) (?:talk|speak)(?: about (?:it|that|this))?(?: (?:right now|anymore|please))?$/u.test(text))return 'topic_boundary';
 if(/^(?:that is|thats|that's|this is|it is|that sounds|this sounds) (?:much |a lot )?better(?: now)?$/u.test(text))return 'feedback_better';
 if(/^(?:let us|lets|let's|can we|could we) (?:please )?(?:change (?:the subject|topic)|talk about something else)$/u.test(text))return 'topic_change';
 if(/^(?:why did you (?:choose|pick) (?:that|it)|why that (?:one|option)|why (?:that|this) choice)$/u.test(text))return 'explain';
 if(/^(?:choose|pick)(?: (?:again|another|once more)| a different one)$/u.test(text))return 'again';
 if(/^(?:can|could|would) you (?:please )?explain (?:that|it)(?: to me)? without (?:making fun of me|teasing me|mocking me|jokes)$/u.test(text))return 'explain_gentle';
 if(/^i (?:like|enjoy|love) your jokes but not when i am (?:upset|sad|angry|stressed)$/u.test(text))return 'tone_gentle';
 if(/^my (?:friend|brother|sister|teammate) (?:said|says|thinks) (?:that )?you are (?:so |really |very )?(?:useless|stupid|annoying|dumb|an idiot|a clown) but i (?:disagree|do not agree|do not think so)$/u.test(text))return 'reported_disagreement';
 if(/^are you (?:always|usually) (?:this |so )?(?:dramatic|sarcastic|mysterious|playful)(?: or (?:is it )?just today)?$/u.test(text))return 'playful_question';
 if (/^(?:thanks|thank you)(?: (?:so|very) much| a lot)? for (?:helping(?: me| us)?|your help|the help|that|being (?:here|kind|nice)|listening|the (?:advice|tip|compliment))$/u.test(text)) return 'thanks';
 if (/^(?:i do not know|i am not sure) (?:what (?:i should |to )do|what to choose|where to start|how to start|what i want)$/u.test(text)) return 'feeling_stuck';
 if (/^(?:i am not feeling|i do not feel|i have not been feeling) (?:(?:very|really|so|too) )?(?:good|well|great|okay|ok)$/u.test(text)) return 'not_well';
 if (/^(?:i am|i feel) not (?:(?:very|really|so) )?(?:tired|sleepy|exhausted)$/u.test(text)) return 'not_tired';
 if (/^(?:this|that|the|my) (?:game|match|round) (?:is|was) (?:(?:so|really|absolutely|fucking) )?(?:stupid|dumb|awful|terrible|annoying|unfair|broken|garbage|trash|shit)$/u.test(text)) return 'frustration';
 if (/^my (?:friend|brother|sister|teammate) (?:is|was|seems) (?:(?:so|really|very) )?(?:stupid|dumb|annoying|rude|mean|an idiot|a jerk)$/u.test(text)) return 'people_problem';
 if (/^(?:can|could|would) you (?:please )?help me(?: (?:with something|with something please|out|a little|for a (?:second|moment)))?$/u.test(text)) return 'help_offer';
 if (/^(?:do you remember (?:what i (?:said|told you)|our conversation|me)|what did i (?:just )?say)$/u.test(text)) return 'memory_scope';
 if (/^(?:why did you (?:say|tell me) that|why would you say that|what did you mean by that|what does your (?:answer|reply) mean)$/u.test(text)) return 'explain';
 if (/^(?:what do you think (?:about|of) (?:it|that)|is that a good idea|should i do (?:it|that))$/u.test(text)) return 'reference_detail';
 if (/^(?:i am|i feel) (?:(?:really|very|so) )?(?:sad|upset|down|unhappy) but i (?:still )?(?:want to|would like to) (?:play|game|play a game|play something)$/u.test(text)) return 'mood_and_play';
 return null;
}
const publicPools = {
 study_alternative:['Try a different route: explain the idea aloud as if teaching someone, then check the part you could not explain.','Instead of reading again, turn one heading into a question and try answering it from memory.','Switch the format: make a small sketch or a two-line summary of one idea, then compare it with the material.'],
 topic_boundary:['You do not have to talk about it. We can leave that subject there.','Understood. No explanation needed. Another subject, or a pause?','That topic can stay closed. You choose what we discuss next.'],
 feedback_better:['Good. I will keep that tone.','Noted. We can carry on like this.','Glad that fits better. Go ahead.'],
 bad_day_context:['A rough day, then. I will leave the sharp teasing aside.','That gives the feeling some context. We can keep this gentle.','Sounds like the day took a lot out of you. No need to explain every part.'] ,
 reported_disagreement:['I heard your disagreement, not an insult from you. What made you bring it up?','That is their opinion, and you made your own position clear. No quarrel with you.','You are reporting someone else and disagreeing. I will not mistake that for your own insult.'],
 playful_question:['The dramatic timing is a character specialty. Today merely provided the lighting.','A little sarcasm comes with the fox. The theatrical pause was optional.','Call it a consistent artistic choice. What gave me away?'],
 decline_advice:['No advice, understood. We can just talk.','Got it. I will leave the suggestions aside. What would you like to talk about?','You do not need a solution from me. We can keep this a conversation.'],
 mood_recovered:['No longer sad, understood. How are things now?','Sounds like that feeling has shifted. Want to talk about something lighter?','Got it. I will not assume you are still feeling down. What is next?'],
 mood_lowered:['Things feel different now, understood. We can keep the conversation gentle.','Not feeling that way anymore, got it. Want to tell me what changed?','I hear the change. We can slow the conversation down.'],
 tension_clear:['Understood. I will not treat that as anger aimed at me.','No hard feelings, then. We can keep talking.','Got it. We can leave that little misunderstanding behind.'],
 disavow_insult:['Understood. You are denying the insult, not making one. We can move on.','Got it. I will not put words in your mouth.','A correction, understood. What did you actually mean?'],
 talk_choice:['Talking rather than playing, understood. What is on your mind?','A conversation it is. What would you like to talk about?','No game, just a chat. Go ahead.'],
 reaction_reassurance:['A vote of confidence. I will try not to look too pleased.','I hear the kind part. A surprisingly civilized turn of events.','No insult there. You may keep talking; that was almost charming.'],
 emotional_detail:['Your mood, understood. We can keep this gentle. Would you prefer advice, a distraction, or a pause?','I meant to check which kind of rough day you were having. Advice, a distraction, or a quiet pause?','Got it: emotionally. No sharp teasing for that. Would advice or a distraction suit you?'],
 physical_detail:['Physically, understood. I will leave the teasing aside. We can pause here or keep the chat quiet.','Your body rather than your mood, got it. No need to keep the conversation going if you would prefer a pause.','Understood. A quieter conversation or a pause is fine.'],
 mixed_wellbeing:['Both, understood. We can keep this gentle and take one part at a time.','A bit of both, then. You do not have to explain everything at once.','Got it. We can leave the teasing aside and slow down.'],
 study_start:['Studying, got it. Pick one small topic and one short task to begin. Want a first step?','Start with one subject and one manageable task. Shall I break the first step down?','Schoolwork, then. Choose one task rather than the whole pile. Want a simple starting step?'],
 study_step:['Open the material, pick one short section, and write down one question you want to answer. Start with just that.','Choose one exercise or one paragraph. Try it, then note the part you did not understand.','Make the task concrete: one page to read, one question to answer, or one exercise to attempt.'],
 study_breakdown:['Make it smaller: one sentence or one exercise. Put one distraction aside, then try that single step.','One tiny task is enough to begin. Choose a short section and write a single note about it.','Leave the whole pile for later. Pick the smallest task you can describe in one sentence.'],
 activity_start:['Something to do, then. A relaxed game, a little exercise, or a creative task? I can randomly pick if you give me options separated by `/`.','You are looking for an activity. Would you prefer something quiet or competitive?','An activity idea: a short game, a small creative project, or a conversation. Which sounds closest?'],
 choice_start:['Send two or more options separated by `/`, and I can make a random pick.','What are the options? Try `akane pick tea / coffee` with your own choices.','Give me the options separated by `/`. I can choose randomly, or you can ask for a general tip.'],
 feeling_stuck:['What are you stuck on: choosing something, starting a task, or finding something to do?','Let us make it smaller. Tell me what you are trying to decide.','No grand plan required. Do you want an activity idea or help choosing between options?'],
 not_well:['Do you mean your mood, or that you feel physically unwell?','Sorry you are feeling rough. Is it an emotional day or a physical discomfort?','We can slow down. When you say you do not feel good, what kind of feeling do you mean?'],
 not_tired:['Not tired, understood. What would you like to do?','Got it. I will not assume you need a rest. What is next?','An important distinction. A game, a conversation, or another subject?'],
 people_problem:['Sounds like someone frustrated you. What happened?','What did they do? A little context is more useful than a label.','A disagreement, then? Tell me what happened without the name-calling.'],
 mood_and_play:['A rough mood and a game anyway. Do you want something relaxed or competitive?','You can feel down and still want to play. A quiet match or finding teammates with `/match`?','I heard both parts. Would you prefer a relaxed game or a little conversation first?'],
 memory_scope:['I keep a little recent topic context during an active chat, not an exact transcript. Remind me which part you mean.','I can follow some recent topics here. I cannot quote your earlier messages from memory; give me the part you mean.','A little topic context, yes; a word-for-word memory, no. What would you like to return to?'],
 reference_detail:['Which idea do you mean? Tell me what “it” refers to.','Give me the idea in one sentence so I can follow the reference.','Which part are we discussing? I would rather ask than invent the missing detail.']
};
const pools={public:publicPools,owner:{},mae:{}};
for(const [category,lines] of Object.entries(publicPools)){
 pools.owner[category]=lines.map(line=>'Handsome, '+(line.startsWith('I ')?line:line[0].toLowerCase()+line.slice(1)));
 pools.mae[category]=lines.map(line=>'Mae, '+(line.startsWith('I ')?line:line[0].toLowerCase()+line.slice(1)));
}
pools.owner.reaction_reassurance=['I heard the kindness in that, handsome.','That is sweet of you, Davi. We can leave the misunderstanding behind.','A little reassurance, sweetheart. I understood you.'];
pools.mae.reaction_reassurance=['I hear you, Mae. Thank you for clarifying.','That was kind of you, Mae.','No misunderstanding, Mae. We can keep talking.'];
const explanations={
 study_alternative:'The first method did not fit, so I offered a different way to work with the material.',
 topic_boundary:'You said you did not want to discuss that subject. I respected the boundary.',
 feedback_better:'You said the answer or tone was better, so I acknowledged that feedback.',
 bad_day_context:'You added a rough day as the reason for your mood. I connected it to the ongoing conversation.',
 reported_disagreement:'You reported someone else’s criticism and said you disagreed. I did not attribute their words to you.',
 playful_question:'I took your question about the dramatic character style as playful conversation.',
 decline_advice:'You declined advice. I acknowledged that and offered to keep talking without suggestions.',
 mood_recovered:'You said the negative feeling was no longer present. I did not assume you were still upset.',
 mood_lowered:'You said a positive feeling was no longer present. I acknowledged the change.',
 tension_clear:'You clarified that your anger was not directed at me.',
 disavow_insult:'You denied having made an insult. That is different from insulting me.',
 talk_choice:'You chose talking and rejected playing. I followed the activity you wanted.',
 reaction_reassurance:'Your sentence denied a negative description of me, so I treated it as reassurance.',
 emotional_detail:'You clarified that you meant your mood, so I offered a gentler conversation.',
 physical_detail:'You clarified that you meant physical discomfort. I acknowledged that and offered a quieter chat or a pause.',
 mixed_wellbeing:'You said both your mood and your body felt off, so I acknowledged both without guessing the cause.',
 study_start:'You said studying was the task you were struggling to start. I suggested one small task.',
 study_step:'You asked for a starting step, so I suggested one small reading task or exercise.',
 study_breakdown:'You said the task felt too hard or distracting. I reduced it to a smaller step.',
 activity_start:'You clarified that you wanted an activity idea.',
 choice_start:'You said you needed help choosing. I asked for the options.',
 feeling_stuck:'You sounded unsure what to do next, so I asked what you were trying to choose or start.',
 not_well:'Not feeling good can mean a low mood or physical discomfort. I asked which you meant.',
 not_tired:'You said you were not tired. That alone does not tell me your mood or what you want to do.',
 people_problem:'You described frustration with another person. I asked what happened without treating it as an insult aimed at me.',
 mood_and_play:'You said you felt down and wanted to play. I acknowledged both parts.',
 memory_scope:'I keep a small amount of recent topic context while the chat is active, not the full text of your messages.',
 reference_detail:'The word “it” did not identify the subject clearly enough, so I asked which idea you meant.'
};
module.exports={recognizePractical,pools,explanations};
