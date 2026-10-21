const { createEmbed } = require('../../utils/embeds');

function plainHelp() {
    return [
        '**Talk to Akane**',
        'Start with `akane` or `აკანე`. Replies are in English.',
        '',
        '**Try these**',
        '`akane hi` — Say hello',
        '`akane nice` — A compliment',
        '`akane roast` — Playful teasing',
        '`akane tip` — Advice',
        '`akane mood` / `secret` / `luck` / `rate` — Mood, secret, pretend luck or random score',
        '`akane pick pvp / training` — A random choice',
        '`akane @member` / `akane davi` / `akane mae` — About someone',
        '',
        '**Keep talking for 2 minutes after each answer**',
        'Use Reply, or type a recognized phrase directly:',
        '`thanks` · `really?` · `why?` · `what do you mean?` · `again`',
        '`haha` · `I am fine` · `I had a bad day` · `I am tired`',
        '`მადლობა` · `რას გულისხმობ?` · `კიდევ` · `კარგად ვარ` · `დავიღალე`',
        'Try `tbh idk`, `wdym`, `wbu`, `brb`, `gn`, or `I am bored`.',
        'Recognized phrases also work without Reply during your active conversation.',
        'Yes/no works only after a yes/no question.',
        '',
        '`akane stop` or `bye` during a conversation — End it.',
        'Wait **3 seconds** between requests; **2 seconds** between channel responses.',
        'Tone: `be nicer` / `be serious` (next 4 replies); `normal mode` restores the usual tone.',
        'Misunderstood? Try `that is not what I meant`. After a mood question, `good` / `bad` works.',
        'Change subject: `something else`. If misunderstood, say `that is not what I meant`, then `topic`, `tone`, or `request`.',
        'Preset character dialogue: unfamiliar sentences may need a clearer request.'
    ].join('\n');
}

function buildHelp(message) {
    return createEmbed('🩸 Akane • Chat Help', plainHelp())
        .setThumbnail(message.client.user.displayAvatarURL({ size: 256 }));
}

module.exports = { buildHelp, plainHelp };
