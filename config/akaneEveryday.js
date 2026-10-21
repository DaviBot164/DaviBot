// Daily small talk: complete English patterns, not isolated keyword matching.
const rules = [
 ['location', /^(?:where (?:are you|you at|you|do you live|are you from)|where is akane)$/u],
 ['activity', /^(?:what (?:are you|you) (?:doing|up to)|what is (?:going on|up) with you|how are you spending your time)$/u],
 ['game_invite', /^(?:(?:(?:do you )?want to|would you like to) (?:play|game)(?: (?:with me|together|a game|some games|roblox|slayers 2|project slayers))?|(?:are you|you) (?:up|down) (?:for (?:a game|some games|roblox|slayers 2|project slayers)|to play)|(?:can|could|will|would) you (?:play|game)(?: (?:with me|together|a game|roblox|slayers 2|project slayers))?|(?:can|should) we play(?: together)?|let us play(?: (?:together|a game|roblox|slayers 2|project slayers))?|join (?:me|my game)|play with me)$/u],
 ['availability', /^(?:are you (?:here|there|around|online|on|awake|free|busy|available)|you (?:here|there|around|online|awake|free|busy)|got a (?:minute|moment|second)|do you have (?:time|a minute|a moment)(?: to talk)?|can we chat)$/u],
 ['plans', /^(?:what are (?:your plans|you going to do)(?: later|tonight|tomorrow)?|any plans(?: for (?:today|tonight|tomorrow))?|what do you want to do|what should we do)$/u],
 ['day_chat', /^(?:how (?:was|has) your day(?: been)?|how is your day going|did you have a good day|how was (?:your morning|your evening)|what did you do today)$/u],
 ['preferences', /^(?:what do you (?:like|enjoy|love)|what (?:is|are) your (?:favorite|favourite) (?:thing|things|color|colour|game|music)|do you like (?:games|gaming|music|the night|foxes))$/u],
 ['gaming_identity', /^(?:do you (?:play|game)(?: (?:games|roblox|slayers 2|project slayers))?|what (?:game|games) do you play|are you a gamer|can you actually play)$/u]
];
function recognizeEveryday(text){
 const simple=text.replace(/^let'?s /u,'let us ').replace(/^hey /u,'').replace(/^(?:so |anyway )/u,'').replace(/ now$/u,'');
 if(/^(?:(?:do you )?want to play|would you like to play|can you play|let us play) [a-z0-9]+(?: [a-z0-9]+){0,5}$/u.test(simple) && !/\b(?:not|never|but|cannot|because|without)\b/u.test(simple)) return 'game_invite';
 for(const [category,pattern]of rules)if(pattern.test(simple))return category;
 return null;
}
const pools={
 public:{
  location:['Right here in the server chat. The mysterious fox does not have a secret street address.','Here, answering you. An unexpectedly easy mystery to solve.'],
  activity:['Answering you, apparently. My fictional plans for an elegant silence have suffered.','A little conversation and a carefully raised eyebrow. What did you have in mind?','Right now? This chat. The fox drama is included at no extra charge.'],
  game_invite:['I cannot join the game, but I can help you pick one or plan a match. You will have to supply the actual player.','A tempting invitation. I cannot play myself; I can make a random choice with `akane pick pvp / training`.','I cannot join as a player; I provide the commentary. Use `/match` if you want to recruit actual players.'],
  availability:['I am answering you now. Go on, before the dramatic pause grows ambitions.','You have my attention. What would you like to talk about?','Here in the chat. A normal question is a surprisingly good opening.'],
  plans:['My fictional agenda is mostly fox mischief. For us, a secret, advice, or a random choice would work.','A conversation seems achievable. World domination may require a less questionable schedule.','We could choose between two things. Give me `akane pick` and your options.'],
  day_chat:['In character? Quiet atmosphere, a little mischief, then your entrance. I do not have a human day outside the chat.','My fictional day has excellent lighting and very little paperwork. How was yours?','I do not have real daily experiences. The character version involves an unnecessarily dramatic entrance.'],
  preferences:['For the character: moonlit settings, clever jokes, and entrances that do not need a second announcement.','Akane has a fictional taste for dark red, quiet atmosphere and a well-timed remark.','Music makes a lovely backdrop for the character. I do not listen or play games myself.'],
  gaming_identity:['I do not play games myself. I can help with a random choice or setting up a server match.','A gaming-themed fox, not an actual player. My commentary is easier to summon than my aim.']
 },
 owner:{
  location:['Right here in our server chat, handsome. No secret physical home behind the fox.','Here in the conversation, Davi. You have my attention.'],
  activity:['Talking with you, handsome. A rather lovely use of the moment.','Answering you, Davi, and giving my mysterious character a softer expression.','Right now, this little conversation. What did you have in mind, sweetheart?'],
  game_invite:['A lovely invitation, handsome. I cannot join a game myself, but I can help you choose or set up a match.','I cannot be your teammate in the actual game, Davi. Try `/match` to find players, and I can keep the chat playful.','I cannot join the actual game, sweetheart. I can offer a random pick or a little encouragement.'],
  availability:['You have my attention, handsome. Go ahead.','Here in the chat, Davi. What is on your mind?','Of course, sweetheart. We can have a little conversation.'],
  plans:['A warm little conversation sounds lovely, handsome. A secret or a compliment?','Nothing real outside this chat, Davi. For our next exchange, we could try a little mischief.','You could give me two choices, sweetheart. I will make the random pick.'],
  day_chat:['My day is only part of the character, handsome. A softer little scene now that you are here. How was yours?','No real day outside the chat, Davi. In our fictional scene, this is a lovely little moment.','The character version involves a dramatic entrance and a smile for you, sweetheart. How was your day?'],
  preferences:['For the character, handsome: moonlight, dark red, clever little jokes, and a warm conversation with you.','Akane has a fictional fondness for quiet atmosphere and playful charm, Davi.','A little romance and a little fox mischief suit the character, handsome.'],
  gaming_identity:['I do not actually play, handsome. I can still help you pick an activity or set up a match.','No controller behind these replies, Davi. A little encouragement is available, though.']
 },
 mae:{
  location:['Here in the server chat, Mae. I do not have a physical location.','Right here in the conversation, Mae.'],
  activity:['Chatting with you, Mae. What did you have in mind?','Answering messages here, Mae. A little friendly fox commentary included.','A quiet little conversation, Mae. We can keep it light.'],
  game_invite:['Thanks for the invitation, Mae. I cannot join a game, but I can help you choose one.','I cannot play myself, Mae. `/match` can help you recruit actual players.','I cannot join as a player, Mae. Give me two options with `akane pick` and I can choose an activity at random.'],
  availability:['Here in the chat, Mae. Go ahead.','You have my attention, Mae. What would you like to talk about?','We can have a little conversation, Mae.'],
  plans:['A light conversation, Mae? A secret, advice, or a random choice could work.','No real plans outside the chat, Mae. We can pick a fresh topic here.','We could choose an activity, Mae. Give me two options with `akane pick`.'],
  day_chat:['I do not have a real day outside the chat, Mae. The character version is mostly harmless fox mischief. How was yours?','A quiet fictional scene, Mae. How was your day?','My daily life is part of the character, Mae. We can talk about how your day went.'],
  preferences:['For the character, Mae: dark red, moonlit scenes and a little harmless mischief.','Akane has a fictional taste for quiet atmosphere and clever jokes, Mae.','Music and games fit the conversation, Mae, though I do not listen or play myself.'],
  gaming_identity:['I do not play games myself, Mae. I can help with a random pick or setting up a match.','I cannot join the actual game, Mae. We can still chat about the activity.']
 }
};
const explanations={
 location:'I am available through this Discord chat, not at a physical location.',
 activity:'I meant that I am replying in this chat. The dramatic fox activity is fictional.',
 game_invite:'I cannot control a game or join as a player. I can help choose an activity or use the server match system.',
 availability:'I am responding in this chat. You can send a recognized request to continue.',
 plans:'I do not have real plans outside the chat. I offered activities this bot supports.',
 day_chat:'The story about my day is fictional. I was asking how your day went.',
 preferences:'Those are fictional character preferences, not real personal experiences.',
 gaming_identity:'I do not play games myself. My match and choice features help human players.'
};
module.exports={recognizeEveryday,pools,explanations};
