const channels = require('../../config/channels');
const { createEmbed } = require('../embeds');
const { publishSetupMessage } = require('./publishSetupMessage');

async function publishGameGuide(guild) {
    const channel = guild.channels.cache.get(channels.guides);

    if (!channel?.isTextBased()) {
        throw new Error('Guides channel could not be found.');
    }

    const title = '🗺️ Slayers 2 Guide Directory';

    const embed = createEmbed(
        title,
        [
            '**Prepare for the hunt. Learn from the community.**',
            'Use this space to find and share **Slayers 2** guides, build advice and practical strategies.',
            '*These guides concern in-game progression. Akane’s server XP and faction ranks are separate.*'
        ].join('\n')
    ).addFields(
        {
            name: '⚔️ SLAYER & DEMON PATHS',
            value: [
                '**Slayers:** Getting started, equipment and progression advice.',
                '**Demons:** Getting started, combat options and progression advice.',
                'Look for information that matches your current faction and stage of the game.'
            ].join('\n')
        },
        {
            name: '🌊 BREATHING STYLES & DEMON ARTS',
            value: [
                'Share move explanations, comparisons and combat tips.',
                'Explain the strengths, limitations and situations where a style or art works well.'
            ].join('\n')
        },
        {
            name: '🗡️ WEAPONS & BUILDS',
            value: [
                'Discuss equipment, stats and build combinations.',
                'When sharing a build, include its purpose, requirements and whether you use it for **PvE**, **PvP** or both.'
            ].join('\n')
        },
        {
            name: '👹 BOSSES & COMBAT',
            value: [
                'Share encounter strategies, attack patterns and useful combat techniques.',
                'Explain when to attack, defend or reposition, and whether your strategy is intended for solo or team play.'
            ].join('\n')
        },
        {
            name: '📈 LEVELING & FARMING',
            value: [
                'Share leveling routes and methods for gathering materials or other resources.',
                'Include prerequisites, the steps to follow and the game update your information applies to.',
                'Keep advice legitimate: no exploits, scripts or suspicious downloads.'
            ].join('\n')
        },
        {
            name: '🔎 ASK FOR HELP OR FIND A PARTY',
            value: [
                `For general game discussion, visit <#${channels.slayers2}>.`,
                'Use the party-finder channel to find teammates. Include your goal, faction and relevant in-game level.',
                'When asking for advice, explain what you have already tried and where you are stuck.'
            ].join('\n')
        },
        {
            name: '📚 SHARE A USEFUL GUIDE',
            value: [
                'Use a clear title and explain the steps in order.',
                'Add screenshots or a video when they make the instructions easier to follow. Credit sources you use.',
                'Game updates can change mechanics. If advice becomes outdated, correct it or flag it clearly.'
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