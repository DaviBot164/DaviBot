// Full self-reports can start a topic; fragments require this speaker's music topic.
const musicTopics=new Set(['music','music_chat','music_time','music_mood','music_mix','music_preferences','music_curiosity']);
function recognizeMusicConversation(text, session=null) {
 if(/^i (?:(?:mostly|usually|often|sometimes) )?listen to music (?:(?:mostly|usually) )?(?:at night|in the evening|before bed|during the day)$/u.test(text))return 'music_time';
 if(/^(?:can we|could we|let us|lets|let's) (?:just )?(?:talk|chat) about music$/u.test(text))return 'music_chat';
 if(/^what (?:kind of )?music do you (?:like|enjoy)$/u.test(text))return 'music_preferences';
 if(!session || !musicTopics.has(session.category))return null;
 if(/^(?:(?:it|that|the music|what i listen to) )?(?:mostly |really )?depends on my mood$/u.test(text))return 'music_mood';
 if(/^sometimes (?:something |some )?(?:calm|quiet|soft|relaxed)(?: stuff| music)? (?:and |but )?sometimes (?:something |some )?(?:heavier|louder|more energetic|heavy|loud)(?: stuff| music)?$/u.test(text))return 'music_mix';
 if(/^(?:what about you|how about you|and you)$/u.test(text))return 'music_preferences';
 if(/^(?:i am )?not asking for (?:any )?advice(?: by the way)? (?:but |and )?(?:i am )?(?:just |only )?curious$/u.test(text))return 'music_curiosity';
 return null;
}
module.exports={musicTopics,recognizeMusicConversation};
