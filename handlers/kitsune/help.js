const { createEmbed } = require('../../utils/embeds');
function plainHelp(){return [
 '**Talk to Kitsune 🦊**','Start with `kitsune hi`, or mention the bot at the start of your message. English input and replies.',
 'Names can go at the start, middle or end: `lady kitsune hru`, `can you, kitsu, help me study?`, `how are you, kitsune?`. Short `kit` works at the start or with an explicit salutation.',
 '', '**Talk naturally**','`kitsune where r u?` / `kitsune wyd?` / `kitsune wanna play?`','`kitsune could you give me a compliment pls?`','`kitsune ngl im really tired rn`','`kitsune can u pick between tea / coffee?`',
 '', '**Keep going**','Use Reply to my latest answer to you, or send a recognized phrase in the same channel within 2 minutes.',
 '`idk` · `wdym` · `hbu` · `ikr` · `tbh im bored` · `brb` · `gn`',
 '`tell me more` · `something else` · `that is not what I meant`',
 'After a mood question, `good` / `bad` works. Yes/no works only after a yes/no question.',
 '', '**Choose a tone**','`be nicer` / `be serious` — Next 4 replies. `normal mode` — Restore my usual attitude.',
 '', '**Requests**','`nice` · `roast` · `tip` · `mood` · `secret` · `luck` · `rate`',
 '`kitsune pick pvp / training` — 2–10 choices separated by `/`.',
 '`kitsune @member` / `kitsune davi` / `kitsune mae` — About someone.',
 '', '**Approved phrase learning**','Unfamiliar phrases addressed to Kitsune may be grouped for Davi to review. Only Davi can teach new meanings with `/kitsune teach`.',
 '', '`kitsune stop` / `bye` — End the conversation.',
 'Wait **3 seconds** between your requests; **2 seconds** between channel responses.',
 'Preset character dialogue: I recognize many English patterns, but cannot understand every sentence or answer arbitrary questions.'
].join('\n');}
function buildHelp(message){return createEmbed('🦊 Kitsune • Talk to Me',plainHelp()).setThumbnail(message.client.user.displayAvatarURL({size:256}));}
module.exports={buildHelp,plainHelp};
