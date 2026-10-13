const channels = require('../../config/channels');
const { createEmbed } = require('../embeds');
const { publishSetupMessage } = require('./publishSetupMessage');

async function publishVerificationGuide(guild) {
    const channel = guild.channels.cache.get(channels.verification);

    if (!channel?.isTextBased()) {
        throw new Error('Verification channel could not be found.');
    }

    const title = '⛩️ Blood Moon Verification';

    const embed = createEmbed(
        title,
        [
            '**Link your Roblox account. Begin your journey.**',
            'Blood Moon uses **Bloxlink** to verify your Roblox account before granting access to the community.',
            '',
            '**01 • Start Verification**',
            'Use the verification option provided by **Bloxlink** in this channel.',
            '',
            '**02 • Follow the Instructions**',
            'Complete the steps shown by Bloxlink and check that you are linking the Roblox account you intend to use.',
            '',
            '**03 • Return to Blood Moon**',
            'After Bloxlink confirms verification, return to Discord and check your channel access.',
            '',
            '**04 • Choose Your Path**',
            `Visit <#${channels.slayers2}> and choose **Slayer** or **Demon**.`,
            'Verification links your account; choosing a faction is a separate step.',
            '',
            '**Having Trouble?**',
            'If verification fails or access is still missing, contact staff. Explain what happened and include a screenshot of the error when possible.',
            '**Never share your password, account token or verification codes with another member.**',
            '',
            '──────────',
            '*One account linked. A new journey beneath the Blood Moon.*'
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

module.exports = { publishVerificationGuide };