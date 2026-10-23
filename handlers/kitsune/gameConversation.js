// Small-talk about games is separate from inviting the bot to play a real game.
const gameTopics=new Set(['gaming','game_chat','game_competitive','game_relaxed','game_preferences']);
function recognizeGameConversation(text,session=null){
 if(/^(?:(?:anyway|well|so) )?(?:let us|lets|let's|can we|could we) (?:just )?(?:talk|chat) about (?:games|gaming)(?: (?:instead|now))?$/u.test(text))return 'game_chat';
 if(/^i (?:prefer|like|enjoy) (?:pvp|competitive games|competitive matches)$/u.test(text))return 'game_competitive';
 if(/^i (?:prefer|like|enjoy) (?:pve|relaxed games|relaxing games|casual games)$/u.test(text))return 'game_relaxed';
 if(!session||!gameTopics.has(session.category))return null;
 if(/^(?:mostly |usually )?(?:pvp|competitive|competitive games|competitive matches)$/u.test(text))return 'game_competitive';
 if(/^(?:mostly |usually )?(?:pve|casual|relaxed|something relaxed|something relaxing|relaxing games|casual games)$/u.test(text))return 'game_relaxed';
 if(/^(?:what about you|how about you|and you)$/u.test(text))return session.category==='gaming'?'activity':'game_preferences';
 return null;
}
module.exports={gameTopics,recognizeGameConversation};
