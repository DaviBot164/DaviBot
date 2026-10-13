const channels = require('../../config/channels');
const { createEmbed } = require('../embeds');
const { publishSetupMessage } = require('./publishSetupMessage');

async function publishRoleGuide(guild) {
    const channel = guild.channels.cache.get(channels.roles);

    if (!channel?.isTextBased()) {
        throw new Error('Roles channel could not be found.');
    }

    const title = '🎭 Blood Moon Roles';

    const embed = createEmbed(
        title,
        [
            '**Every role marks a place in your journey.**',
            'Faction ranks show your server progression, Achievement Ranks recognize accomplishments, and staff roles identify the team responsible for the community.',
            '*These are Blood Moon server roles, not your Slayers 2 in-game ranks.*'
        ].join('\n')
    ).addFields(
        {
            name: '⚔️ SLAYER PATH',
            value: [
                '🗡️ **Slayer** — Starting faction rank',
                '🌊 **Mizunoe** — Server Level 10',
                '🍃 **Kinoe** — Server Level 25',
                '🔥 **Hashira** — Server Level 50+ and Trial / staff promotion'
            ].join('\n')
        },
        {
            name: '🩸 DEMON PATH',
            value: [
                '🩸 **Demon** — Starting faction rank',
                '🌑 **Lower Moon** — Server Level 20',
                '🌙 **Upper Moon** — Server Level 50+ and Trial / staff promotion'
            ].join('\n')
        },
        {
            name: '🏯 HOW FACTION PROMOTIONS WORK',
            value: [
                'Regular ranks are awarded automatically at their required server levels within your chosen faction.',
                '**Hashira** and **Upper Moon** require approval through Trials or staff promotion. Reaching Level 50 alone does not award either role.'
            ].join('\n')
        },
        {
            name: '🌕 ACHIEVEMENT RANKS',
            value: [
                'From first milestones to lasting accomplishments:',
                '',
                '🌙 **Moonbound**',
                '🌸 **Crimson Bloom**',
                '🩸 **Bloodbound**',
                '🌑 **Night Ascendant**',
                '🌕 **Eternal Moon**',
                '',
                'This progression is separate from your Slayer or Demon rank. Use `/achievements` to view your achievements.'
            ].join('\n')
        },
        {
            name: '👑 SHOGUNATE',
            value: [
                'The staff hierarchy, from owner to supporting staff:',
                '',
                '👑 **Shogun** — Server Owner',
                '🏯 **Daimyo** — Administrator',
                '🛡️ **Hatamoto** — Moderator',
                '🥷 **Samurai** — Staff',
                '',
                'Staff roles are assigned responsibilities, not automatic XP rewards.'
            ].join('\n')
        },
        {
            name: '✨ COLLECTIBLE TITLES',
            value: [
                'Titles are honors earned through activity, progression and achievements.',
                'Use `/titles` to view and equip unlocked titles. Equipping a title does not change your faction rank or grant staff authority.'
            ].join('\n')
        },
        {
            name: '📖 EXPLORE YOUR PROGRESSION',
            value: [
                '`/profile` — View your server progression.',
                '`/corps` — Browse members and faction ranks.',
                `Slayer guide: <#${channels.slayerPath}>`,
                `Demon guide: <#${channels.demonPath}>`
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

module.exports = { publishRoleGuide };