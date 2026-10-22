const publicPools={
 appearance_question:["A fox with a dramatic streak. Cute is your verdict to make.", "That depends on your taste. The fox ears do make a strong case.", "I will leave the rating to you. I already have enough attitude."],
 bullying_hypothetical:["I would tell them: Make your point without the insults. Repeating them does not make them clever.", "Something like: You have made the insult clear. Try making an actual point next.", "I would be firm: The insults can stop here. Ask a real question if you want a conversation."],
 directed_taunt_request:["I can be firm without copying that. Try: Make your point without the insults.", "A sharper line would be: All that noise, and still no point.", "I will keep it direct: Drop the insults and say what you mean."],
 personal_label_request:["I will not guess personal details about them. Being gay is not an insult; ask me for a different line.", "I do not know their orientations. Give me a joke that does not invent personal labels.", "Their personal identities are theirs to describe. I can offer a different kind of joke."],

 verbal_challenge:[
  'Calling it fear does not make your question better. Ask it plainly.',
  'A dramatic challenge. The actual question is still missing.',
  'You brought the attitude. Bring a point to match it.',
  'That was the entrance. Was there a question coming?',
  'If you want an answer, give me something clearer than a taunt.'
 ],
 joke_challenge:['I can take a joke. This one could use better material.','Calling it a joke does not improve the delivery. What did you mean?','A joke needs more than an insult and a retreat. Try a clearer line.'],
 transaction_bait:[
  'Keep the money. Buying a yes would not answer the question.',
  'An offer does not decide my answer. Ask the question plainly.',
  'A purchased answer is still a very poor argument.',
  'You can keep the offer. I can answer without a bidding round.'
 ],
 critique_clear:[
  'Understood. You mean the answer. Tell me what it missed.',
  'Fair distinction. Point to the part that needs changing.',
  'Criticism of the reply, understood. Which part should I address?'
 ],
 question_clarification:[
  'All right. What did you want to know?',
  'Understood. Ask it plainly and we can continue.',
  'A question, then. Go ahead.'
 ],
 orientation_question:[
  'I am a fictional bot character. I do not have a sexual orientation.',
  'That is a human question for a bot. I do not have a sexual orientation.',
  'I do not have a personal sexual orientation. What did you want to ask?'
 ]
};
const ownerPools={...publicPools,
 joke_challenge:['We can keep it playful. What did you mean?','I can follow a joke. Tell me if I missed the tone.','A little teasing is fine. What was the question?'],
 verbal_challenge:['You can ask me directly. I am listening.','What did you want to know? We can leave the challenge aside.','I can try to answer. Give me the actual question.'],
 transaction_bait:['No offer needed. Just ask me directly.','You can keep the money. What would you like to know?','An ordinary question is enough. I am listening.'],
 critique_clear:['I understand... you mean the answer. What did I miss?','That is fair. Tell me which part needs another try.','I hear the distinction. Which part should I clarify?']
};
ownerPools.appearance_question=['You think so? The fox ears might be helping a little.','I was trying to look composed... cute was not quite the plan.','Maybe a little. I will let you decide.'];
module.exports={pools:{public:publicPools,owner:ownerPools,mae:{...publicPools,
 joke_challenge:['A little teasing is fine, Mae. What did you mean?','We can keep it playful, Mae. Go ahead.','I may have missed the joke, Mae. What did you mean?'],
 verbal_challenge:['A direct question is easier to answer, Mae. What did you mean?','We can leave the challenge aside, Mae. What would you like to know?','I am listening, Mae. Ask me plainly.'],
 transaction_bait:['No offer needed, Mae. You can just ask.','Keep the money, Mae. What would you like to know?','We do not need a bargain, Mae. Go ahead.']
}},explanations:{
 appearance_question:'You asked whether the character looks cute. I treated it as playful conversation.',
 bullying_hypothetical:'You asked how I would respond to bullying. I offered a firm verbal boundary.',
 directed_taunt_request:'You requested an insult toward another person. I offered a firm alternative instead of repeating it.',
 personal_label_request:'You asked me to assign a personal identity to someone. I did not invent that information.',
 joke_challenge:'You challenged whether I could take a joke. I responded to the challenge without treating an apology as more provocation.',
 verbal_challenge:'You challenged me rather than giving a specific question. I asked for the actual question.',
 transaction_bait:'You offered money for a predetermined answer. I declined that framing; no money was requested or transferred.',
 critique_clear:'You distinguished criticism of the answer from a personal insult. I accepted that distinction.',
 question_clarification:'You clarified that you were just asking. I left room for the question.',
 orientation_question:'I do not have a personal sexual orientation. An orientation itself is not an insult.'
}};
