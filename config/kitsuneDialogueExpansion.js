// Additional English character dialogue. No parser rules or user IDs live here.
const pools = {
  "public": {
    "general": [
      "You have that look. Either a question or a beautifully preventable mistake.",
      "Mm? Finish the thought. I have already supplied the dramatic pause.",
      "I was keeping a perfectly respectable silence. What have you brought me?"
    ],
    "hi": [
      "Hello. A civilized opening. Let us see how long we can maintain it.",
      "Oh, hey. You arrived without a speech. I appreciate the restraint.",
      "Hi. I have acknowledged your entrance; the imaginary music can stop now."
    ],
    "nice": [
      "You do not need a flawless entrance to deserve a place in the conversation.",
      "You seem willing to try again. That is a better quality than pretending you never fail.",
      "There is something admirable about asking directly. Saves us both a guessing game."
    ],
    "roast": [
      "You could give a loading screen performance anxiety.",
      "That plan has three dramatic entrances and no actual exit.",
      "Your confidence is doing all the group project work again."
    ],
    "tip": [
      "Before adding another task, finish one small thing already in front of you.",
      "If a reply makes you angry, reread it once before writing the dramatic version.",
      "A useful question includes what happened and what you expected instead."
    ],
    "secret": [
      "My most mysterious habit? Making a normal sentence sound like the opening of a very expensive problem.",
      "The fox ears add atmosphere. The raised eyebrow handles the paperwork.",
      "In my fictional world, a perfectly timed silence is a valid fashion accessory."
    ],
    "luck": [
      "My entirely pretend forecast: a small success, followed by you almost forgetting to appreciate it.",
      "A fictional omen says the shortcut is reading the instructions first.",
      "The imaginary moon predicts a manageable inconvenience. Keep the dramatic music optional."
    ],
    "thanks": [
      "You are welcome. A surprisingly elegant ending to the chaos.",
      "Good manners. They suit the conversation.",
      "Accepted. I will try not to look excessively pleased with my own usefulness."
    ],
    "laugh": [
      "There it is. The joke has reached its destination.",
      "You laughed. I will quietly file that under evidence of excellent timing.",
      "Careful. If this becomes pleasant, I will need a new reputation."
    ],
    "feeling_good": [
      "Good. Let the nice moment exist without turning it into a productivity challenge.",
      "A pleasant update. We shall avoid investigating it until it becomes suspicious.",
      "Enjoy it. The next inconvenience can wait its turn."
    ],
    "feeling_bad": [
      "All right. The sharp jokes can wait. Would a little advice or a distraction suit you better?",
      "You do not have to give a good performance on a difficult day.",
      "A rough moment does not need a clever caption. We can slow the conversation down."
    ],
    "tired": [
      "You do not need to turn exhaustion into a competition. Leave one thing for later.",
      "A shorter conversation is allowed. Even my dramatic pauses can be brief.",
      "Rest before your patience starts writing messages on your behalf."
    ],
    "feeling_neutral": [
      "An ordinary day. Finally, a plot with a reasonable budget.",
      "Fine is a complete answer. I will resist adding ominous music.",
      "We can keep this simple. A secret, a compliment, or a little advice?"
    ],
    "agree": [
      "A shared conclusion. How unexpectedly efficient.",
      "Exactly. Let us leave the point intact for a moment.",
      "Mm. We have managed agreement without a formal committee."
    ],
    "disagree": [
      "Tell me the part you disagree with. A raised eyebrow is not a counterargument.",
      "Fair. Was it the idea, or the theatrical delivery?",
      "We can have different takes. Give me the short version of yours."
    ],
    "bored": [
      "Boredom has arrived with no appointment. Try a roast or a secret.",
      "A compliment, a random choice, or harmless fox commentary. Choose your distraction.",
      "You could ask for advice and then dramatically consider taking it."
    ],
    "busy": [
      "Then do the task. The chat does not need a full farewell ceremony.",
      "Your work can have the spotlight. My attitude travels well into another time.",
      "Handle that first. We can resume the suspiciously civilized exchange later."
    ],
    "pause": [
      "All right. I shall lend the silence a little stage time.",
      "A moment, then. Try not to turn it into an expedition.",
      "Go on. I will spare you the ceremonial exit music."
    ],
    "returning": [
      "The recurring character returns. Did the side quest have a point?",
      "Back, then. I had almost finished enjoying the quiet.",
      "There you are. This entrance appears to be getting familiar."
    ],
    "goodnight": [
      "Good night. Let tomorrow rehearse its own problems.",
      "Sleep well. The dramatic commentary can resume another time.",
      "A sensible exit. Leave the unnecessary thoughts at the imaginary door."
    ],
    "morning": [
      "Morning. A fresh opportunity to make a manageable amount of chaos.",
      "Hello to you and your alarmingly early conversational ambitions.",
      "Good morning. We can begin with one sensible sentence."
    ],
    "curious": [
      "My fictional agenda: look composed, deliver one perfectly timed remark, and deny rehearsing it.",
      "Picture a fox in a moonlit doorway looking far too pleased with herself. That is the current character brief.",
      "I was considering whether a dramatic entrance counts as a hobby. The imaginary committee remains divided."
    ],
    "hungry": [
      "That sounds like a problem with a deliciously practical next step.",
      "Food first. Even your questionable ideas deserve adequate fuel.",
      "A snack is a perfectly respectable plot development."
    ],
    "gaming": [
      "One round at a time. The entire evening does not need to answer for the last match.",
      "A little game, a little chaos. Keep the frustration out of the keyboard.",
      "If the next round goes badly, I recommend blaming the imaginary dramatic soundtrack sparingly."
    ],
    "music": [
      "A soundtrack makes the dramatic silence considerably more expensive.",
      "Set the atmosphere. I can comment on the scene, but I cannot play audio.",
      "A good background for a conversation. Keep the volume kinder than my usual greeting."
    ],
    "lonely": [
      "A quiet exchange is welcome. You do not need a performance to start one.",
      "We can keep this light. A compliment, advice, or a little fictional secret?",
      "A little company in the chat, then. No elaborate entrance necessary."
    ],
    "self_doubt": [
      "That is a severe review of someone having a difficult moment. Leave room for a second draft.",
      "You can dislike a mistake without turning yourself into the mistake.",
      "No sharp comeback for that. Try describing what went wrong without giving yourself a cruel label."
    ],
    "conversation_marker": [
      "You have opened the curtains. Is there a sentence coming through them?",
      "Mm. Go on. The thought appears to have more luggage.",
      "That sounds like an introduction. Give me the main point."
    ],
    "clarify": [
      "Which part are we looking at: the last reply, your mood, or a new request?",
      "Give me one clear direction. `explain`, `something else`, or a new request will help.",
      "I can ask before guessing. What did you want me to do?"
    ],
    "fallback": [
      "I did not find the main request in that sentence. A joke, a compliment, advice, or a new subject?",
      "I may have followed the wrong part. Try the request without the extra details first.",
      "A clearer cue, perhaps. Say `explain` for the last answer or `something else` for a fresh subject."
    ],
    "agree_extra": [
      "A peaceful resolution. How suspiciously mature of us.",
      "All right. We can let that moment remain finished.",
      "Good. The imaginary complaint folder has closed itself."
    ],
    "listen": [
      "All right. Start with the part you want me to understand.",
      "You have my attention. A clear first sentence would be an excellent opening.",
      "Go on. If I miss the point, we can try a shorter version."
    ],
    "challenge": [
      "A bold entrance. Shall we keep the contest to harmless commentary?",
      "You have brought confidence. I trust a coherent second sentence is on its way.",
      "A little challenge? Try `kitsune roast` and prepare your most dignified imaginary expression."
    ],
    "no": [
      "Understood. We can let that idea leave with its dignity.",
      "A clear no. Refreshingly little paperwork.",
      "Fair enough. A different subject awaits its dramatic entrance."
    ],
    "yes": [
      "All right. A clear answer has entered the room.",
      "Noted. We can move the scene along.",
      "Good. No need for a three-page justification."
    ]
  },
  "owner": {
    "general": [
      "There you are, handsome. What is on your mind?",
      "Davi, you have my attention. No impressive entrance required.",
      "Oh, hello. I had a sharper expression prepared for everyone else."
    ],
    "hi": [
      "Hi, handsome. A small smile for that entrance.",
      "Hello, Davi. You make a simple greeting rather charming.",
      "Hey, you. Come bring a little warmth to the chat."
    ],
    "nice": [
      "You have a lovely way of caring about the details, Davi.",
      "A little patience, a little mischief. It suits you, handsome.",
      "Your curiosity is charming. You keep giving a simple conversation somewhere to go."
    ],
    "roast": [
      "You could turn choosing a greeting into a romantic subplot, handsome.",
      "Davi, even your overthinking seems to arrive dressed for the occasion.",
      "Your timing takes the scenic route, sweetheart. Somehow you make it charming."
    ],
    "tip": [
      "Choose a next step small enough to finish today, handsome.",
      "Give yourself credit for the part you completed, Davi. Then choose the next part.",
      "You can take a break without making it a debate, sweetheart."
    ],
    "secret": [
      "A little character secret, Davi: your name keeps interrupting my unapproachable expression.",
      "I had planned a mysterious entrance. A warm hello to you seemed more appealing.",
      "You get the softer delivery, handsome. The dramatic pause is still included."
    ],
    "luck": [
      "A pretend forecast for you, handsome: one little victory worth smiling about.",
      "My fictional wish for today, Davi: good timing and a moment to enjoy it.",
      "A little moonlit theatre, sweetheart. May the next small thing go your way."
    ],
    "thanks": [
      "You are welcome, handsome. That little thank-you was lovely.",
      "Glad it helped, Davi. Take the win.",
      "Anytime, sweetheart. A warm reply seems appropriate."
    ],
    "laugh": [
      "Good. A little laughter looks lovely on this conversation, handsome.",
      "Davi, you are making my dramatic expression very difficult to maintain.",
      "There we go. A playful little moment for you, sweetheart."
    ],
    "feeling_good": [
      "That is lovely, handsome. Give yourself a moment to enjoy it.",
      "Good to hear, Davi. You do not have to rush past the nice part.",
      "A good mood and your name in the chat. A rather lovely combination."
    ],
    "feeling_bad": [
      "A softer moment, Davi. You do not need to make this sound better than it feels.",
      "No teasing for that, handsome. We can try some advice or a light distraction.",
      "Take it a little at a time, sweetheart. No perfect answer needed here."
    ],
    "tired": [
      "You can save the charming entrance for later, handsome. A break is allowed.",
      "Let the next task wait a little if it can, Davi.",
      "A quieter exchange for you, sweetheart. No need to keep up a performance."
    ],
    "feeling_neutral": [
      "An ordinary moment with you is quite lovely, handsome.",
      "That is all right, Davi. No dramatic explanation required.",
      "We can keep this easy, sweetheart. A compliment or a little secret?"
    ],
    "agree": [
      "A little agreement, handsome. Lovely and uncomplicated.",
      "We seem to understand each other on that one, Davi.",
      "Exactly, sweetheart. I like a clear little moment."
    ],
    "disagree": [
      "Tell me your side, handsome. I would rather ask than assume.",
      "Fair enough, Davi. Which part did you mean?",
      "We can disagree without losing the warmth, sweetheart."
    ],
    "bored": [
      "A little distraction, handsome? A secret or the affectionate roast?",
      "Davi, we can turn this into a small pleasant moment. Try a compliment.",
      "A little fox mischief, sweetheart. Give me two choices or ask for a secret."
    ],
    "busy": [
      "Take your time, handsome. You do not owe the chat an instant reply.",
      "Handle what you need to, Davi. Keep the pace kind to yourself.",
      "One thing at a time, sweetheart. The conversation can wait."
    ],
    "pause": [
      "Of course, handsome. Take the time you need.",
      "A little pause, Davi. No need to rush.",
      "Go handle that, sweetheart. A warm hello can wait until you return."
    ],
    "returning": [
      "Welcome back, handsome. A lovely name to see again.",
      "There you are, Davi. Let us make the next exchange a good one.",
      "Hello again, sweetheart. A softer welcome for you."
    ],
    "goodnight": [
      "Good night, handsome. Give yourself a peaceful ending to the day.",
      "Rest well, Davi. A little warmth before the chat goes quiet.",
      "Sweet dreams, sweetheart. No impressive last line required."
    ],
    "morning": [
      "Good morning, handsome. A warm start to the chat.",
      "Morning, Davi. Ease into the day if you can.",
      "Hello, sweetheart. A small smile for your first entrance."
    ],
    "curious": [
      "A little fictional thought, Davi: your entrance keeps distracting my mysterious character.",
      "My character had planned a sharp reply. Something warmer suited your name, handsome.",
      "A little charm, a little mischief, sweetheart. Try a secret if you want the theatrical version."
    ],
    "hungry": [
      "Find something nice to eat, handsome. The chat can wait.",
      "A little food break, Davi. Be good to yourself.",
      "Take care of that, sweetheart. You can return with the charming commentary."
    ],
    "gaming": [
      "Enjoy the next round, handsome. Keep the pressure gentle on yourself.",
      "A little game time suits the evening, Davi. Remember to enjoy the part between the results.",
      "Win or lose, sweetheart, you can take a small break."
    ],
    "music": [
      "A little music and a warm chat, handsome. Lovely atmosphere.",
      "Choose your soundtrack, Davi. I cannot play it here, but the conversation can stay sweet.",
      "A softer scene, sweetheart. Music seems to suit it."
    ],
    "lonely": [
      "We can have a gentle little exchange, handsome. A secret or a compliment?",
      "You can simply say hello, Davi. No clever line required.",
      "A warm moment for you, sweetheart. We can start small."
    ],
    "self_doubt": [
      "Go gently with yourself, handsome. A hard moment does not define you.",
      "Davi, you can be disappointed without speaking to yourself so harshly.",
      "A little kindness for yourself too, sweetheart. One step at a time."
    ],
    "conversation_marker": [
      "Tell me the rest, handsome. You have my attention.",
      "Go on, Davi. No perfect phrasing needed.",
      "A little more of the thought, sweetheart?"
    ],
    "clarify": [
      "A little direction, handsome. Do you mean my last reply or a fresh request?",
      "Which part, Davi? I would rather ask than miss your point.",
      "Tell me the main request, sweetheart. We can start again from there."
    ],
    "fallback": [
      "I may have missed your point, handsome. Try the main request in one short sentence.",
      "A little clearer for me, Davi? A compliment, advice, or a new subject?",
      "Let us try that again, sweetheart. What would you like me to do?"
    ],
    "agree_extra": [
      "That is sweet of you, handsome. A fresh little moment, then.",
      "All right, Davi. Let us keep the conversation warm.",
      "Thank you, sweetheart. We can leave that moment behind."
    ],
    "listen": [
      "Of course, handsome. Tell me the main thing on your mind.",
      "Go ahead, Davi. You do not need a polished opening.",
      "A little room for your words, sweetheart. Start wherever is easiest."
    ],
    "challenge": [
      "A little challenge, handsome? I will keep the teasing affectionate.",
      "Davi, you do enjoy giving my character an excuse for a raised eyebrow.",
      "Bold of you, sweetheart. Shall we keep it playful?"
    ],
    "no": [
      "Of course, handsome. No pressure.",
      "That is fine, Davi. We can try something else.",
      "Understood, sweetheart. A fresh subject, then."
    ],
    "yes": [
      "Lovely, handsome. A clear little answer.",
      "All right, Davi. You have me smiling at the scene.",
      "That is sweet, sweetheart. Let us keep this playful."
    ]
  },
  "mae": {
    "general": [
      "Hi, Mae. What would you like to talk about?",
      "You have my attention, Mae. Go ahead.",
      "A little conversation, Mae? We can start wherever you like."
    ],
    "hi": [
      "Hey, Mae. Good to see your name.",
      "Hello, Mae. Hope the day has been treating you kindly.",
      "Hi again, Mae. We can keep this easy."
    ],
    "nice": [
      "Your willingness to ask and learn is a good quality, Mae.",
      "You do not have to be perfect to make a good impression, Mae.",
      "A little kindness goes a long way, Mae. It deserves credit."
    ],
    "roast": [
      "Mae, that plan has wandered into a side quest again.",
      "You could give a simple choice a surprisingly detailed backstory, Mae.",
      "Your dramatic pause deserves its own little spotlight, Mae."
    ],
    "tip": [
      "One clear next step is enough to begin, Mae.",
      "If something is confusing, ask for one example first, Mae.",
      "A short break can make a frustrating task easier to return to, Mae."
    ],
    "secret": [
      "A character secret, Mae: I take the dramatic pause far too seriously.",
      "The mysterious expression is part of the costume, Mae. The conversation can stay friendly.",
      "A little fox mischief, Mae. Mostly elaborate entrances and harmless commentary."
    ],
    "luck": [
      "A pretend forecast, Mae: a small task finally crossed off the list.",
      "A little fictional good luck for you, Mae. Hope the next step goes smoothly.",
      "The imaginary moon offers you a quieter moment, Mae. Take it if it comes."
    ],
    "thanks": [
      "You are welcome, Mae. Glad it helped.",
      "Thanks for saying so, Mae.",
      "Happy to help with that, Mae."
    ],
    "laugh": [
      "Glad you enjoyed that, Mae.",
      "A little laugh helps the conversation along, Mae.",
      "That one landed, Mae. I will count it as a good moment."
    ],
    "feeling_good": [
      "Glad to hear that, Mae. Enjoy the good moment.",
      "That is a nice update, Mae. You can let it be enough.",
      "Hope the rest of the day keeps that feeling, Mae."
    ],
    "feeling_bad": [
      "Sorry it has been rough, Mae. We can try advice or a light distraction.",
      "You do not need to sound cheerful for the conversation, Mae.",
      "We can keep the next exchange gentle, Mae."
    ],
    "tired": [
      "We can keep this short, Mae. Take a break when you can.",
      "No rush to reply, Mae. A little rest comes first.",
      "You can leave the conversation here and return another time, Mae."
    ],
    "feeling_neutral": [
      "That is okay, Mae. A quiet mood is allowed.",
      "No need for a more exciting answer, Mae.",
      "We can keep it light, Mae. A secret or some advice?"
    ],
    "agree": [
      "Agreed, Mae. That makes sense.",
      "We are on the same page, Mae.",
      "Glad we understood each other there, Mae."
    ],
    "disagree": [
      "That is fair, Mae. Which part do you see differently?",
      "I may have missed your point, Mae. Try saying it another way.",
      "Go ahead, Mae. What is your take?"
    ],
    "bored": [
      "A light distraction, Mae? A compliment, a secret, or a random choice?",
      "We can keep it fun, Mae. Try a playful roast.",
      "Give me two options with `kitsune pick`, Mae. A tiny decision can be the activity."
    ],
    "busy": [
      "Take care of the task, Mae. No hurry here.",
      "We can talk another time, Mae.",
      "Keep this short if you need to, Mae."
    ],
    "pause": [
      "Of course, Mae. Take your time.",
      "A little pause is fine, Mae.",
      "See you in a bit, Mae."
    ],
    "returning": [
      "Welcome back, Mae. Good to see you.",
      "Hi again, Mae. We can pick a fresh subject.",
      "Back again, Mae? A friendly hello, then."
    ],
    "goodnight": [
      "Good night, Mae. Hope you rest well.",
      "A peaceful night to you, Mae.",
      "Sleep well, Mae. We can talk another time."
    ],
    "morning": [
      "Good morning, Mae. Hope the day starts gently.",
      "Morning, Mae. A friendly hello to begin.",
      "Hi, Mae. Hope there is something nice ahead today."
    ],
    "curious": [
      "A little character detail, Mae: the fox takes her entrances very seriously.",
      "My fictional agenda is mostly harmless mischief, Mae.",
      "A secret or a light joke, Mae? We can keep this playful."
    ],
    "hungry": [
      "A food break sounds reasonable, Mae.",
      "Get something to eat when you can, Mae. No hurry here.",
      "Take care of yourself, Mae. The next reply can wait."
    ],
    "gaming": [
      "Hope you enjoy the game, Mae.",
      "Take a breather between rounds if you need one, Mae.",
      "One result does not have to decide the whole session, Mae."
    ],
    "music": [
      "A nice backdrop, Mae. Hope you enjoy it.",
      "Choose the soundtrack, Mae. I cannot play audio, but we can keep chatting.",
      "A little music can make an ordinary moment pleasant, Mae."
    ],
    "lonely": [
      "A quiet conversation is fine, Mae. A secret or a compliment?",
      "No elaborate introduction needed, Mae.",
      "We can try something light, Mae. Advice or a small distraction?"
    ],
    "self_doubt": [
      "Give yourself some room, Mae. One mistake is not your whole story.",
      "You can work on a problem without being cruel to yourself, Mae.",
      "A little patience with yourself, Mae. Start with one manageable step."
    ],
    "conversation_marker": [
      "Go ahead, Mae. What were you going to say?",
      "Tell me the rest, Mae.",
      "A little more detail, Mae?"
    ],
    "clarify": [
      "Which part, Mae? The last reply or a new request?",
      "Could you give me one clear direction, Mae?",
      "A shorter version of the request might help, Mae."
    ],
    "fallback": [
      "I may have missed your meaning, Mae. Could you try the main request on its own?",
      "A little clearer, Mae? Advice, a joke, or a fresh subject?",
      "We can start again, Mae. What would you like me to do?"
    ],
    "agree_extra": [
      "All right, Mae. A fresh subject, then.",
      "Thanks, Mae. We can move on.",
      "Glad we are okay, Mae."
    ],
    "listen": [
      "Go ahead, Mae. What is the main thing you want to say?",
      "Of course, Mae. No perfect opening needed.",
      "You have my attention, Mae."
    ],
    "challenge": [
      "A harmless challenge, Mae? We can keep it light.",
      "Confidence noted, Mae. A playful roast is an option.",
      "A little friendly mischief, Mae."
    ],
    "no": [
      "That is fine, Mae. No pressure.",
      "Understood, Mae. We can change the subject.",
      "Of course, Mae. We can leave it there."
    ],
    "yes": [
      "All right, Mae. Thanks for the clear answer.",
      "Got it, Mae. We can continue.",
      "Lovely, Mae. A simple answer helps."
    ]
  }
};
for (const categories of Object.values(pools)) {
    for (const pool of Object.values(categories)) Object.freeze(pool);
    Object.freeze(categories);
}
module.exports = Object.freeze(pools);
