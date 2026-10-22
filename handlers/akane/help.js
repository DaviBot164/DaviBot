const { createEmbed } = require('../../utils/embeds');
function plainHelp(){return [
 '**Talk to Akane 🦊**','Start with `akane hi`, or mention the bot at the start of your message. English input and replies.',
 '', '**Talk naturally**','`akane where r u?` / `akane wyd?` / `akane wanna play?`','`akane could you give me a compliment pls?`','`akane ngl im really tired rn`','`akane can u pick between tea / coffee?`',
 '', '**Keep going**','Use Reply to my latest answer to you, or send a recognized phrase in the same channel within 2 minutes.',
 '`idk` · `wdym` · `hbu` · `ikr` · `tbh im bored` · `brb` · `gn`',
 '`tell me more` · `something else` · `that is not what I meant`',
 'After a mood question, `good` / `bad` works. Yes/no works only after a yes/no question.',
 '', '**Choose a tone**','`be nicer` / `be serious` — Next 4 replies. `normal mode` — Restore my usual attitude.',
 '', '**Requests**','`nice` · `roast` · `tip` · `mood` · `secret` · `luck` · `rate`',
 '`akane pick pvp / training` — 2–10 choices separated by `/`.',
 '`akane @member` / `akane davi` / `akane mae` — About someone.',
 '', '**Approved phrase learning**','Unfamiliar phrases addressed to Akane may be grouped for Davi to review. Only Davi can teach new meanings with `/akane teach`.',
 '', '`akane stop` / `bye` — End the conversation.',
 'Wait **3 seconds** between your requests; **2 seconds** between channel responses.',
 'Preset character dialogue: I recognize many English patterns, but cannot understand every sentence or answer arbitrary questions.'
].join('\n');}
function buildHelp(message){return createEmbed('🦊 Akane • Talk to Me',plainHelp()).setThumbnail(message.client.user.displayAvatarURL({size:256}));}
module.exports={buildHelp,plainHelp};
