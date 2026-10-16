
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
            'Faction ranks represent your server progression, Achievement Ranks recognize accomplishments, and staff roles identify the team responsible for Blood Moon.',
            '*These are server roles, not your Slayers 2 in-game ranks.*'
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
            name: '🏯 FACTION PROMOTIONS',
            value: [
                'Regular ranks are awarded automatically when you reach the required server level within your chosen faction.',
                '**Hashira** and **Upper Moon** require Trials or staff approval. Level 50 alone does not grant either rank.'
            ].join('\n')
        },
        {
            name: '🌕 ACHIEVEMENT RANKS',
            value: [
                'From your first milestone to your greatest accomplishments:',
                '',
                '🌙 **Moonbound**',
                '🌸 **Crimson Bloom**',
                '🩸 **Bloodbound**',
                '🌑 **Night Ascendant**',
                '🌕 **Eternal Moon**',
                '',
                'Achievement Ranks are separate from faction ranks. Use `/achievements` to track your progress.'
            ].join('\n')
        },
        {
            name: '👑 SHOGUNATE',
            value: [
                'The staff hierarchy:',
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
                'Earn titles through activity, progression and achievements.',
                'Use `/titles` to view and equip unlocked titles. Titles do not change your faction rank or grant staff authority.'
            ].join('\n')
        },
        {
            name: '📖 EXPLORE YOUR PROGRESSION',
            value: [
                '`/profile` — View your server progression.',
                '`/corps` — Browse members and faction ranks.',
                `Slayer & Demon guides: <#${channels.factionProgression}>`
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
