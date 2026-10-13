const channels = require('../../config/channels');
const { createEmbed } = require('../embeds');
const { publishSetupMessage } = require('./publishSetupMessage');

async function publishSacredLaws(guild) {
    const channel = guild.channels.cache.get(channels.sacredLaws);

    if (!channel?.isTextBased()) {
        throw new Error('Sacred Laws channel could not be found.');
    }

    const title = '📜 Sacred Laws';

    const embed = createEmbed(
        title,
        [
            '**Under one moon, respect binds us.**',
            'Whether you walk the Slayer or Demon path, these rules apply to every member.',
            '',
            '**01 • Respect Your Fellow Members**',
            'Friendly rivalry is welcome. Harassment, slurs, discrimination, threats and personal attacks are not. Respect boundaries and stop when someone asks.',
            '',
            '**02 • Keep the Chat Clear**',
            'Do not flood messages, repeat posts or abuse mentions. Avoid disrupting conversations or voice channels.',
            '',
            '**03 • Keep Content Appropriate**',
            'Do not share sexual or NSFW content, graphic gore, or material intended to shock or offend. Dark fantasy themes must stay appropriate for the community.',
            '',
            '**04 • Use the Right Channels**',
            'Post builds, guides, party requests and other content where they belong. Read channel topics before posting and keep discussions relevant.',
            '',
            '**05 • Protect the Community**',
            'No scams, phishing, malicious downloads or harmful links. Never ask for passwords, account tokens or verification codes. Report suspicious activity to staff.',
            '',
            '**06 • Cooperate with Staff**',
            'Follow moderation instructions and do not evade warnings or restrictions. If you disagree with a decision, explain the issue calmly through support rather than disrupting the chat.',
            '',
            '──────────',
            '**Need help or want to report a problem?**',
            'Read the support guide and open a ticket. Include relevant messages or screenshots so staff can understand what happened.',
            '',
            '*Keep the rivalry in the game. Keep respect in the server.*'
        ].join('\n')
    );

    const icon = guild.iconURL({ size: 256 });

    if (icon) {
        embed.setThumbnail(icon);
    }

    return publishSetupMessage(
        channel,
        { embeds: [embed] },
        title
    );
}

module.exports = { publishSacredLaws };