const pools={
 public:{
  ambiguous_praise:['Was that praise or a raised eyebrow? Did the answer help?','I might be missing your tone. Did I answer the question?','That could go either way. Did the reply actually help?'],
  sarcasm_clear:['Sarcasm, understood. What did the answer miss?','Got it. You were not praising the answer. What should I clarify?','I hear the sarcasm now. Which part should I try again?'],
  target_correction:['Understood. You were not talking about me.','Got it. I will not make myself the subject of that sentence.','That clears up who you meant. We can move on.'],
  explain_wait:['Go ahead. I am listening.','All right. Take your time and explain.','You have the floor. What did you mean?'],
  answer_confusing:['The answer was unclear. Which sentence should I clarify?','You mean the explanation was confusing. I can rephrase it.','I can try another explanation. Which part did not make sense?'],
  ambiguous_tease:['A genius? Let us keep the expectations manageable. What is the question?','That came with a raised eyebrow, I suspect. Go on.','A compliment with a question mark. I am listening.'],
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
  target_correction:['Oh... understood. You were not talking about me.','That clears it up. I will follow your meaning.','Got it. No need to worry about that misunderstanding.'],
  explain_wait:['Of course. Take your time... I am listening.','Go ahead. You do not need to rush the explanation.','All right... tell me what you meant.'],
  answer_confusing:['You meant it was confusing. I understand... I can try a clearer version.','That is a helpful distinction. Let me try saying it more simply.','The explanation was unclear, then. We can try again.'],
  ambiguous_tease:['Oh... I cannot tell if you are teasing. You caught me off guard.','A genius? That is a little more confidence than I was prepared for.','I will take that gently... what did you want to ask?'],
  answer_feedback:['You meant the answer. I understand... I can try saying it another way.','That reply missed, then. Let me try a clearer version.','You can tell me when the answer feels wrong. I would rather understand you.'],
  intent_clear:['I understand. You did not mean to sound that way. We can start again.','That is all right... thank you for clarifying.','No need for a perfect explanation. I understand what you meant about the tone.'],
  sarcastic_challenge:['A little challenge? All right... give me the question.','I can try again. Tell me the part you wanted answered.','You caught me off balance. Let us try a clearer question together.'],
  reported_davi_quote:['I understand those were someone else’s words. You do not need to take the insult on yourself.','That was a cheap shot at you. I would rather hear the actual issue.','A reported insult, understood. I will not join in with it.'],
  reported_insult_question:['I understand that you are quoting someone else. I can try a clearer answer.','Their remark does not tell me what failed. What part should I explain?','A little context would help... which answer were they talking about?']
 },
 mae:{
  target_correction:['Understood, Mae. You were not talking about me.','That clears it up, Mae.','Got it, Mae. No misunderstanding.'],
  explain_wait:['Go ahead, Mae. I am listening.','Take your time, Mae.','Of course, Mae. What did you mean?'],
  answer_confusing:['You meant the reply was confusing, Mae. I can try a clearer version.','Fair distinction, Mae. I can rephrase it.','Understood, Mae. A simpler explanation, then.'],
  ambiguous_tease:['A little teasing, Mae? Go ahead with the question.','A genius might be setting the expectations high, Mae.','I cannot quite tell the tone, Mae. What would you like to ask?'],
  answer_feedback:['You mean the answer, Mae. I can try rephrasing it.','Fair feedback, Mae. I can make the reply simpler.','The reply missed your point, Mae. We can try again.'],
  intent_clear:['Understood, Mae. We can leave that misunderstanding behind.','That clears it up, Mae.','No problem, Mae. We can start again.'],
  sarcastic_challenge:['Give me the specific question, Mae, and I can try again.','A little sharp, Mae. What did you want answered?','We can keep this friendly, Mae. Tell me the actual question.'],
  reported_davi_quote:['I understand you are reporting someone else, Mae. Criticism of Davi should still stay respectful.','Those are someone else’s words, Mae. I will not add to the insult.','A cheap shot at Davi, Mae. It would be better to hear the actual disagreement.'],
  reported_insult_question:['I hear that it was someone else’s comment, Mae. Which answer did they mean?','We can discuss the answer, Mae. I will not treat their remark as yours.','A reported opinion, Mae. What part should I explain?']
 }
};
pools.owner.ambiguous_praise=['I may be missing your tone... did that answer help?','Was that a little sarcasm? Tell me if I missed your question.','I am not quite sure how you meant that. Did the answer help?'];
pools.owner.sarcasm_clear=['Oh... sarcasm. I understand. What did I miss?','Got it. Tell me which part needs another try.','I missed your tone there. What would you like me to clarify?'];
pools.mae.ambiguous_praise=['I may be missing your tone, Mae. Did the answer help?','Praise or sarcasm, Mae? I would rather ask.','Did that answer your question, Mae? I am not sure how you meant that.'];
pools.mae.sarcasm_clear=['Sarcasm, understood, Mae. What did I miss?','Got it, Mae. Which part should I clarify?','I understand your tone now, Mae. What should I try again?'];
for(const tone of ['public','owner','mae'])pools[tone].reported_distance = tone==='owner'
 ? ['I understand... you are telling me what someone else called me.','Those were their words, not yours. I understand.','You are reporting it, rather than saying it yourself. What did you want to discuss?']
 : tone==='mae' ? ['You are reporting their words, Mae. I will not treat them as yours.','That was their wording, Mae. What did you want to discuss?','Understood, Mae. You are not the one calling me that.']
 : ['You are reporting their words, not calling me that yourself.','Those are their words. What did you want to discuss?','I heard the distinction. I will not pin their wording on you.'];
const explanations={
 reported_distance:'You said someone else used the insult and denied using it yourself. I kept the speakers separate.',
 ambiguous_praise:'The wording could be sincere praise or sarcasm. I asked rather than assuming.',
 sarcasm_clear:'You explicitly said you were being sarcastic, so I acknowledged the correction.',
 target_correction:'You clarified that you were not talking about me.',
 explain_wait:'You asked for a moment to explain. I left room for the correction.',
 answer_confusing:'You said the answer was unclear or made no sense. I acknowledged the clarity problem.',
 ambiguous_tease:'The wording could be praise or teasing. I answered lightly instead of assuming an insult.',
 answer_feedback:'I understood the criticism as being about the answer, rather than treating it as a personal insult.',
 intent_clear:'You clarified that you did not intend to sound rude.',
 sarcastic_challenge:'I understood the question as a sarcastic challenge and asked for the specific request.',
 reported_davi_quote:'You reported an insult about Davi. I objected to the insult without attributing it to you.',
 reported_insult_question:'You asked about someone else’s criticism. I kept the quoted words separate from your own position.'
};
module.exports={pools,explanations};
