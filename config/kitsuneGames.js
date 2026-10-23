const publicPools={
 game_chat:['Games, then. Competitive matches or something more relaxed?','A new subject: games. Do you prefer PvP or a quieter adventure?','Games it is. A tense match, or something you can take at your own pace?'],
 game_competitive:['Competitive, then. Do you enjoy close fights or the climb through the ranks?','PvP has your attention. Is it the timing, the strategy, or the rivalry?','A little competition, then. What makes a match fun for you?'],
 game_relaxed:['Something more relaxed. Exploration, a story, or building something?','A game at your own pace, then. What usually keeps you interested?','A quieter adventure has its appeal. Do you prefer a story or room to explore?'],
 game_preferences:['Tactical fights and a dramatic finish fit my character. The commentary is available; I cannot join the actual match.','For my style: clever timing, a little tension, and a memorable finish. I can chat about it rather than play.','A game with atmosphere and a sharp contest suits the character. You would be the one holding the controls.']
};
const ownerPools={
 game_chat:['Games, then... something competitive, or a quieter adventure?','We can talk about games. What do you enjoy more: a close match or exploring at your own pace?'],
 game_competitive:['A close match, then... is it the timing or the strategy you enjoy most?','A little competition sounds like your kind of story. What makes a match fun for you?']
};
const explanations={
 game_chat:'You asked to switch the conversation to games. I followed that topic rather than treating it as an invitation to play.',
 game_competitive:'You described enjoying competitive games or PvP. I asked what part you enjoy.',
 game_relaxed:'You described wanting a more relaxed game. I followed that preference.',
 game_preferences:'You asked about my taste in the games conversation. I described a character preference without claiming to play.'
};
module.exports={pools:{public:publicPools,owner:{...publicPools,...ownerPools},mae:{...publicPools}},explanations};
