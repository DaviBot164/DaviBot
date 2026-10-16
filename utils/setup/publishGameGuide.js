
const channels = require('../../config/channels');
const { createEmbed } = require('../embeds');
const { publishSetupMessage } = require('./publishSetupMessage');

async function publishGameGuide(guild) {
    const channel = guild.channels.cache.get(channels.slayers2);

    if (!channel?.isTextBased()) {
        throw new Error('Slayers 2 channel could not be found.');
    }

    const title = '🗺️ Slayers 2 Guide Directory';

    const embed = createEmbed(
        title,
        [
            '**Prepare for the hunt. Learn from the community.**',
            'Find and share Slayers 2 guides, builds and strategies in this channel.',
            '*In-game progression is separate from Akane server XP and faction ranks.*'
        ].join('\n')
    ).addFields(
        {
            name: '⚔️ SLAYER & DEMON PATHS',
            value: [
                'Share faction-specific progression advice, equipment and combat tips.',
                `For Blood Moon server ranks, visit <#${channels.factionProgression}>.`
            ].join('\n')
        },
        {
            name: '🌊 BREATHING STYLES & DEMON ARTS',
            value: 'Discuss abilities, strengths, weaknesses and combat combinations.'
        },
        {
            name: '🗡️ WEAPONS & BUILDS',
            value: 'Share equipment, stats and builds for PvE or PvP.'
        },
        {
            name: '👹 BOSSES & COMBAT',
            value: 'Discuss boss strategies, attack patterns and team tactics.'
        },
        {
            name: '📈 LEVELING & FARMING',
            value: [
                'Share legitimate leveling routes and resource farming methods.',
                'No exploits, malicious scripts or suspicious downloads.'
            ].join('\n')
        },
        {
            name: '🔎 FIND A PARTY',
            value: [
                'Looking for teammates? Ask here.',
                'Mention your goal, faction and relevant in-game level.'
            ].join('\n')
        },
        {
            name: '📖 SHARE A GUIDE',
            value: [
                'Explain your steps clearly and include screenshots when useful.',
                'Keep information updated when game mechanics change.'
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

module.exports = { publishGameGuide };
