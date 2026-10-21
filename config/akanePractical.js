// Everyday speech repairs found in real conversations. All matches are bounded.
function recognizePractical(text) {
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
const explanations={
 feeling_stuck:'You sounded unsure what to do next, so I asked what you were trying to choose or start.',
 not_well:'Not feeling good can mean a low mood or physical discomfort. I asked which you meant.',
 not_tired:'You said you were not tired. That alone does not tell me your mood or what you want to do.',
 people_problem:'You described frustration with another person. I asked what happened without treating it as an insult aimed at me.',
 mood_and_play:'You said you felt down and wanted to play. I acknowledged both parts.',
 memory_scope:'I keep a small amount of recent topic context while the chat is active, not the full text of your messages.',
 reference_detail:'The word “it” did not identify the subject clearly enough, so I asked which idea you meant.'
};
module.exports={recognizePractical,pools,explanations};
