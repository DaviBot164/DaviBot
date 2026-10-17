
const {
    AttachmentBuilder,
    EmbedBuilder
} = require('discord.js');

const path = require('path');
const brand = require('../config/brand');
const channels = require('../config/channels');

const BANNER_NAME = 'welcome-banner.png';

const BANNER_PATH = path.join(
    __dirname,
    '..',
    'assets',
    'images',
    BANNER_NAME
);

function createWelcomeBanner() {
    return new AttachmentBuilder(BANNER_PATH, {
        name: BANNER_NAME
    });
}

function createWelcomeEmbed(member) {
    const verification = member.guild.channels.cache.get(
        channels.verification
    );

    const verifyText = verification?.isTextBased()
        ? `Begin your journey in ${verification}.`
        : 'Complete verification to begin your journey.';

    return new EmbedBuilder()
        .setColor(brand.color)
        .setAuthor({
            name: `${brand.name} • ${brand.server}`,
            iconURL: member.client.user.displayAvatarURL({
                size: 256
            })
        })
        .setTitle('🌙 A New Soul Has Arrived')
        .setDescription([
            `Welcome, ${member}.`,
            '',
            `⛩️ ${verifyText}`
        ].join('\n'))
        .setThumbnail(
            member.user.displayAvatarURL({ size: 256 })
        )
        .setImage(`attachment://${BANNER_NAME}`)
        .setFooter({ text: brand.footer });
}

module.exports = {
    createWelcomeBanner,
    createWelcomeEmbed
};
