const pools={
 public:{
  reaction_insult:[
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
const explanations={sexual_boundary:'I declined an explicit request. We can continue with a non-explicit topic.',frustration:'I took that as frustration, not necessarily an insult aimed at me.'};
module.exports={pools,explanations};
