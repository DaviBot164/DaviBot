const publicPools={
 nickname_boundary:['Understood. I will leave the pet names out.','Fair enough. No nicknames.','Noted. I can address you without that.'],
 orientation_neutral:['I do not know his orientation, and I will not guess. Being gay is not an insult.','That does not tell me anything I should turn into a joke. Keep it respectful.','I will not speculate about someone’s orientation.'],
 tip_offer:['Go on. What is your tip?','A tip for me? Let us hear it.','All right. What would you suggest?'],
 tip_received:['I heard the suggestion. Thanks for sharing it.','Noted for this exchange. That is your suggestion, then.','Thank you. We can keep talking.'],
 chat_open:['A conversation, then. A joke, a character secret, or music?','We can chat. Music, a joke, or a little gaming talk?','You have my attention. A secret or a joke to start?'],
 topic_offer:['Try music, a joke, or a little gaming talk. Pick whichever sounds interesting.','A character secret or a joke would make a start.','Music, gaming, or a joke. Which direction?'],
 expression_uncertain:['You do not need a perfect explanation. A few words are enough; we can take it slowly.','Hard to put into words? We can leave it unfinished for a moment.','That is all right. You do not have to turn the feeling into a polished sentence.'],
 joke_repair:['Understood. I will take that as a clarification. We can move on.','A joke, then. Keep the next one charming.','Got it. We can leave that misunderstanding behind.'],
 restart_chat:['A fresh start. Hello again. What would you like to talk about?','All right. We can start again. A joke, music, or a new subject?','Fresh start accepted. Go ahead.'],
 reaction_davi_insult:[
  'Leave Davi out of the cheap shots. If you have a point, make it.',
  'That was an insult, not an argument. Speak about Davi with a little respect.',
  'You want to criticize Davi? Bring an actual point. The cheap insult can stay outside.',
  'I heard the insult. Now try a sentence about Davi that has something behind it.',
  'Davi is not a target for your recycled lines. Find better material.',
  'Enough with the cheap shots at Davi. Say what bothered you, plainly.'
 ]
};
const ownerPools={
 hi:['Oh. Hi. I was not expecting you just then.','There you are. I am glad you stopped by.','Hi... give me a second. All right, I am listening.','Hello again. You can stay a little, if you like.'],
 general:['You called? Yes... I am listening.','Oh, it is you. What did you want to tell me?','I had something clever ready. I seem to have misplaced it.'],
 nice:['You put care into things. I notice that.','Your patience is one of the things I like about these conversations.','You can be rather thoughtful. I wanted to say that properly.'],
 reaction_affection:['Oh... thank you. I did not have a clever answer ready for that.','That was sweet. Give me a second to find my words.','You caught me a little off guard. In a nice way.','I was trying to look composed. You are making that difficult.'],
 reaction_romance:['You are being rather bold... I can keep the scene playful, if you like.','Oh. I was not prepared for that line. Shall we keep this a little gentle?','A little flirting? All right... just give me a moment.'],
 thanks:['You are welcome. I am glad it helped.','Of course. That was kind of you to say.','You are welcome... really.'],
 secret:['A character secret? I practice sounding composed. These conversations make it difficult.','I had a mysterious entrance planned. A quiet hello seems nicer now.','Sometimes a small conversation is the nicest part of the scene.'],
 chat_open:['We can just talk. A joke, music, or a little character secret?','I would like that. Shall we start with music or a secret?','All right... a quiet conversation sounds nice. A joke to start?'],
 topic_offer:['Maybe music, or a little character secret? You can choose.','A joke or a secret might be a nice start.','We could talk about music, or keep it playful with a joke.'],
 reaction_davi_insult:['That includes how you speak about yourself. A gentler sentence, please.','I would rather hear what bothered you than an insult about you.','Let us leave the harsh words aside. I am listening.']
};
const pools={public:publicPools,owner:{...publicPools,...ownerPools},mae:{...publicPools,reaction_davi_insult:['Mae, let us keep criticism of Davi respectful. What bothered you?','We can discuss a disagreement with Davi, Mae. Leave the insult aside.','A gentler sentence about Davi, Mae. Tell me the actual issue.']}};
const explanations={
 nickname_boundary:'You asked me to stop using that nickname. I acknowledged the preference.',
 orientation_neutral:'I do not know Davi’s orientation. Mentioning an orientation is not itself an insult.',
 tip_offer:'You offered to give a tip. I understood you as the person offering it.',
 tip_received:'I acknowledged your suggestion. This does not automatically rewrite the bot’s dialogue.',
 chat_open:'You asked to chat, so I offered a few topics this character can respond to.',
 topic_offer:'You asked for a conversation topic.',
 expression_uncertain:'You said you were unsure how to explain it, so I left room for an unfinished explanation.',
 joke_repair:'You clarified that you were joking and did not intend an insult.',
 restart_chat:'You asked for a fresh start, so I cleared the current topic and choices.',
 reaction_davi_insult:'I understood that as a direct insult aimed at Davi and asked for respectful criticism.'
};
module.exports={pools,explanations};
