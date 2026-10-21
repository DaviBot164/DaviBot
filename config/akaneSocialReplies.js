const pools={
 public:{
  no:[
   'A no. Clear enough. What would you prefer?',
   'Declined. Even I can appreciate a straight answer.',
   'Fair enough. I will save the dramatic sigh for a better occasion.',
   'Understood. We can leave that option alone.',
   'You are allowed to disagree. A different subject, then?',
   'Not interested? Fine. Bring me a better idea.',
   'No it is. What is next?',
   'A firm answer. Refreshingly little paperwork.'
  ],
  reaction_insult:[
   'You seem very sure that volume counts as a point. It does not.',
   'I heard the insult. Still waiting for the argument.',
   'That was a lot of confidence for a recycled line.',
   'You wanted a reaction. You got a raised eyebrow. Spend it wisely.',
   'A challenging tone. An unchallenging sentence.',
   'Was I meant to be impressed, or merely interrupted?',
   'If that was your best shot, we can safely move to the actual conversation.',
   'You may disagree. You will need better material to make it interesting.',
   'I can work with a difficult question. You have supplied a noisy one.',
   'You came looking for a weak spot and brought a blunt instrument.',
   'There is a perfectly good question somewhere underneath that performance.',
   'Keep the confidence. Rewrite the sentence.',
   'All that attitude, and the sentence still needed help finding a point.',
   'You brought an insult. I was hoping for something with a little craftsmanship.',
   'Was that the opening line, or have we already reached the limits of the material?',
   'A familiar insult in an unnecessarily confident outfit.',
   'You can ask a question without dressing it as a tantrum.',
   'Sharp delivery. Blunt material. Shall we try again?',
   'If you want a useful answer, give me a useful question. The insult contributes very little.',
   'Mm. An insult. Let me know when the interesting part arrives.',
   'That line has been around the block. Give it a rest.',
   'We can trade jokes. Genuine nastiness makes a very dull conversation.'
  ],
  sexual_boundary:[
   'No. That request confused boldness with charm. Try a normal question.',
   'The fox has declined your explicit request. An ordinary conversation remains available.',
   'That line can leave quietly. We can keep the conversation playful without making it explicit.',
   'You skipped the conversation and misplaced your manners. Try another subject.',
   'No explicit scene. Bring wit if you want my attention.'
  ],
  frustration:[
   'Sounds frustrating. Take a breath before the keyboard becomes the next opponent.',
   'A rough moment, then. A break or a different subject might help.',
   'The dramatic soundtrack is working overtime. We can slow this down.',
   'Bad round? You do not have to turn it into a bad evening.'
  ]
 },
 owner:{
  no:[
   'Of course, handsome. We can leave that there.',
   'No pressure, Davi. What would you enjoy instead?',
   'Understood, sweetheart. Another subject?',
   'A no is enough, Davi. You do not need to explain it.'
  ],
  reaction_insult:[
   'A little softer, handsome. Tell me what actually bothered you.',
   'Davi, we can reset that sentence. No sharp reply from me.',
   'Let us keep this affectionate, sweetheart. What did you mean to ask?'
  ],
  sexual_boundary:[
   'No explicit scene, handsome. We can keep the charm playful.',
   'A gentler kind of mischief, Davi. Let us choose another subject.',
   'I will keep this non-explicit, sweetheart. A compliment or a little joke?'
  ],
  frustration:[
   'A rough moment, handsome? We can put the teasing aside.',
   'Take a small break if you can, Davi. No need to win an argument with the whole evening.',
   'A softer exchange, sweetheart. Advice or a light distraction?'
  ]
 },
 mae:{
  no:[
   'That is fine, Mae. We can try something else.',
   'Understood, Mae. What would you prefer?',
   'No pressure, Mae. Another topic?',
   'We can leave that there, Mae.'
  ],
  reaction_insult:[
   'Let us start that again, Mae. What bothered you?',
   'We can keep this friendly, Mae. Tell me the actual question.',
   'A gentler next sentence, Mae. We can reset the conversation.'
  ],
  sexual_boundary:[
   'I will keep the conversation non-explicit, Mae. Let us try another subject.',
   'We can keep this friendly, Mae. A joke or a different topic?',
   'No explicit scene, Mae. We can have a normal conversation.'
  ],
  frustration:[
   'Sounds frustrating, Mae. Take a moment if you need one.',
   'We can keep the next exchange calm, Mae.',
   'A break or a lighter topic might help, Mae.'
  ]
 }
};
const continuation = {
 public:{
  context_hesitant:['No need to decide immediately. Which part are you unsure about?','A maybe, then. What would make the choice easier?','You can leave it undecided. Shall we try another subject?'],
  context_echo:['Same in what way: the mood, the preference, or the suggestion? Give me the part you mean.','You agree with which part? A few more words will save us both a guessing game.','A little more precision. What are you agreeing with?'],
  context_changed:['Something changed, then. What is different now?','No longer the case? Tell me the updated version.','All right. What changed since your last answer?'],
  mixed_social:['A compliment with an insult tucked inside. Subtlety took the evening off, I see.','I heard both halves. Keep the charm; give the cheap shot a better editor.','Sweet opening, sharp turn. You can tease me with better material than that.']
 },
 owner:{
  context_hesitant:['Take your time, handsome. What are you unsure about?','No rush, Davi. We can leave it open or change the subject.','A maybe is fine, sweetheart. Tell me which part needs explaining.'],
  context_echo:['Which part, handsome? Tell me a little more.','Same in what way, Davi? The mood or the suggestion?','Help me follow, sweetheart. Which part did you mean?'],
  context_changed:['What changed, handsome? Give me the new version.','Not anymore, Davi? How is it now?','A little update, sweetheart. What is different?'],
  mixed_social:['A compliment and a little jab, handsome. I heard both. Shall we keep the next one sweeter?','Davi, that sentence arrived with a smile and an elbow. Tell me what you actually mean.','A mischievous combination, sweetheart. I will take the compliment and ask for a gentler next line.']
 },
 mae:{
  context_hesitant:['Take your time, Mae. What are you unsure about?','We can leave that open, Mae. Another subject?','Which part would you like explained, Mae?'],
  context_echo:['Which part did you mean, Mae?','Same in what way, Mae? Tell me a little more.','Help me follow, Mae. The mood or the suggestion?'],
  context_changed:['What changed, Mae?','How is it now, Mae? Give me the updated version.','Not anymore, Mae? What is different?'],
  mixed_social:['I heard the compliment and the jab, Mae. We can keep the teasing friendly.','A mixed review, Mae. Tell me what you actually meant.','A little sweet and a little sharp, Mae. A friendlier next line?']
 }
};
for (const [tone,categories] of Object.entries(continuation)) Object.assign(pools[tone],categories);
for (const tone of Object.values(pools)) tone.reaction_dismissive = [...tone.reaction_insult];
const explanations={context_hesitant:'You sounded undecided. I asked what you were unsure about without treating it as a yes or no.',context_echo:'Your short reply could refer to several things, so I asked which part you meant.',context_changed:'You said something was no longer the case. I asked what changed instead of guessing the opposite.',mixed_social:'I picked up both a compliment and an insult in your sentence.',sexual_boundary:'I declined an explicit request. We can continue with a non-explicit topic.',frustration:'I took that as frustration, not necessarily an insult aimed at me.'};
module.exports={pools,explanations};
