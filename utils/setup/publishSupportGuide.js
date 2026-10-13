const channels = require('../../config/channels');
const { createEmbed } = require('../embeds');
const { publishSetupMessage } = require('./publishSetupMessage');

async function publishSupportGuide(guild) {
    const channel = guild.channels.cache.get(channels.supportGuide);

    if (!channel?.isTextBased()) {
        throw new Error('Support Guide channel could not be found.');
    }

    const title = '📜 Support Guide';

    const embed = createEmbed(
        title,
        [
            '**Need assistance? Let the Shogunate know.**',
            'Use a ticket to discuss server issues with staff privately, away from public chat.',
            `Open a ticket in <#${channels.openTicket}> and choose the category that best matches your request.`
        ].join('\n')
    ).addFields(
        {
            name: '🛟 SUPPORT',
            value: [
                'For server questions, verification problems, missing roles or issues with Akane.',
                'Explain what you expected to happen, what happened instead and which steps you already tried.'
            ].join('\n')
        },
        {
            name: '🚨 REPORT',
            value: [
                'For rule violations, harassment, suspicious links or other community concerns.',
                'Include the member involved, relevant message links or screenshots, and a brief explanation.',
                'Report the issue without starting an argument or sharing private details in public chat.'
            ].join('\n')
        },
        {
            name: '⚖️ APPEAL',
            value: [
                'Request a review of a moderation action you believe needs reconsideration.',
                'Include the action, its date or case ID if available, and why you are requesting a review.',
                'An appeal is a request for review, not a guarantee that the decision will change.'
            ].join('\n')
        },
        {
            name: '📜 OTHER',
            value: [
                'For requests that do not fit the categories above.',
                'State what you need clearly so staff can direct your request appropriately.'
            ].join('\n')
        },
        {
            name: '📋 HELP US UNDERSTAND',
            value: [
                '**1.** Describe the issue in your first message.',
                '**2.** Add relevant evidence and context.',
                '**3.** Keep related information in the same ticket.',
                '**4.** Never include passwords, account tokens or verification codes.'
            ].join('\n')
        },
        {
            name: '⏳ AFTER OPENING A TICKET',
            value: [
                'Wait patiently for a staff response. Avoid repeated mentions or duplicate tickets for the same issue.',
                'Keep the conversation respectful and answer any follow-up questions.',
                'Once your issue is resolved, follow the ticket controls or staff instructions to close it.'
            ].join('\n')
        }
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

module.exports = { publishSupportGuide };