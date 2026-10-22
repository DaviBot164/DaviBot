const pools={
 public:{
  answer_feedback:[
   'You mean the answer. Fair enough. Point me to the part that missed, and I can try again.',
   'A sharp review. If the answer missed your point, I can rephrase it.',
   'Criticism of the reply, understood. I can try a simpler explanation.'
  ],
  intent_clear:['Understood. You did not mean the tone that way. We can move on.','That clears up your intention. A fresh sentence, then.','Got it. We can leave the misunderstanding behind.'],
  sarcastic_challenge:[
   'That is quite an introduction for someone who still owes me the actual question.',
   'A dramatic challenge. Give me the question and let us see what I can do.',
   'I heard the sarcasm. Now give me something specific to answer.',
   'You have supplied the attitude. The useful question is still missing.'
  ],
  reported_davi_quote:[
   'That quote is an insult aimed at Davi. I would ask the person who said it to make their point respectfully.',
   'I hear that you are reporting someone else. The cheap shot at Davi still contributes nothing useful.',
   'Those are someone else’s words, understood. I will not pile on Davi because of them.'
  ],
  reported_insult_question:[
   'You are reporting someone else’s criticism. What part of the answer were they unhappy with?',
   'I hear that it was someone else’s remark. A specific criticism would be more useful than the insult.',
   'That is a reported opinion. I can discuss the reply without treating their words as yours.'
  ]
 },
 owner:{
  answer_feedback:['You meant the answer. I understand... I can try saying it another way.','That reply missed, then. Let me try a clearer version.','You can tell me when the answer feels wrong. I would rather understand you.'],
  intent_clear:['I understand. You did not mean to sound that way. We can start again.','That is all right... thank you for clarifying.','No need for a perfect explanation. I understand what you meant about the tone.'],
  sarcastic_challenge:['A little challenge? All right... give me the question.','I can try again. Tell me the part you wanted answered.','You caught me off balance. Let us try a clearer question together.'],
  reported_davi_quote:['I understand those were someone else’s words. You do not need to take the insult on yourself.','That was a cheap shot at you. I would rather hear the actual issue.','A reported insult, understood. I will not join in with it.'],
  reported_insult_question:['I understand that you are quoting someone else. I can try a clearer answer.','Their remark does not tell me what failed. What part should I explain?','A little context would help... which answer were they talking about?']
 },
 mae:{
  answer_feedback:['You mean the answer, Mae. I can try rephrasing it.','Fair feedback, Mae. I can make the reply simpler.','The reply missed your point, Mae. We can try again.'],
  intent_clear:['Understood, Mae. We can leave that misunderstanding behind.','That clears it up, Mae.','No problem, Mae. We can start again.'],
  sarcastic_challenge:['Give me the specific question, Mae, and I can try again.','A little sharp, Mae. What did you want answered?','We can keep this friendly, Mae. Tell me the actual question.'],
  reported_davi_quote:['I understand you are reporting someone else, Mae. Criticism of Davi should still stay respectful.','Those are someone else’s words, Mae. I will not add to the insult.','A cheap shot at Davi, Mae. It would be better to hear the actual disagreement.'],
  reported_insult_question:['I hear that it was someone else’s comment, Mae. Which answer did they mean?','We can discuss the answer, Mae. I will not treat their remark as yours.','A reported opinion, Mae. What part should I explain?']
 }
};
const explanations={
 answer_feedback:'I understood the criticism as being about the answer, rather than treating it as a personal insult.',
 intent_clear:'You clarified that you did not intend to sound rude.',
 sarcastic_challenge:'I understood the question as a sarcastic challenge and asked for the specific request.',
 reported_davi_quote:'You reported an insult about Davi. I objected to the insult without attributing it to you.',
 reported_insult_question:'You asked about someone else’s criticism. I kept the quoted words separate from your own position.'
};
module.exports={pools,explanations};
