// Exact chat tokens only. Never expand substrings inside unrelated words.
const tokens=Object.freeze({
 dumbfck:'idiot',dumbfuck:'idiot',stoopid:'stupid',dum:'dumb',dmb:'dumb',sob:'bastard',
 fck:'fuck',fk:'fuck',fuk:'fuck',fuq:'fuck','f*ck':'fuck','f**k':'fuck',fkn:'fucking',fkin:'fucking',fking:'fucking',fuckin:'fucking',
 bch:'bitch',btch:'bitch','b*tch':'bitch','b!tch':'bitch',biatch:'bitch',
 mf:'motherfucker',mfer:'motherfucker',mofo:'motherfucker','m0f0':'motherfucker',
 dumbass:'idiot',dumbazz:'idiot','dumb@ss':'idiot',dumb:'dumb',dumba55:'idiot',
 asshole:'asshole',asshat:'asshole','a$$hole':'asshole','a55hole':'asshole',
 sh1t:'shit','sh!t':'shit','sh*t':'shit',bs:'bullshit',
 idi0t:'idiot',l0ser:'loser',b1tch:'bitch',c_nt:'cunt'
});
const publicReplies=Object.freeze([
 'A lot of noise for a sentence with no point. Try again.',
 'You have supplied the insult. The actual argument is still missing.',
 'That entrance needs better material. What did you want?',
 'If the answer was wrong, point to the mistake. Swearing is not an explanation.',
 'How dramatic. Now give me something worth answering.',
 'You can be annoyed. You can also say what went wrong.',
 'Cheap shot. Was there a question behind it?'
]);
module.exports={tokens,publicReplies};
