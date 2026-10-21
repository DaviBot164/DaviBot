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
        'For a yes/no question, use Reply or `akane yes` / `akane no`.',
        '',
        '`akane stop` or `bye` during a conversation — End it.',
        'Wait **10 seconds** between requests; **5 seconds** between channel responses.',
        'Preset character dialogue: unfamiliar sentences may need a clearer request.'
    ].join('\n');
}

function buildHelp(message) {
    return createEmbed('🩸 Akane • Chat Help', plainHelp())
        .setThumbnail(message.client.user.displayAvatarURL({ size: 256 }));
}

module.exports = { buildHelp, plainHelp };
