
const {
    AttachmentBuilder,
    EmbedBuilder
} = require('discord.js');

const path = require('path');
const brand = require('../config/brand');
const channels = require('../config/channels');

const WELCOME_BANNER_NAME = 'welcome-banner.png';

const WELCOME_BANNER_PATH = path.join(
    __dirname,
    '..',
    'assets',
    'images',
    WELCOME_BANNER_NAME
);

function createWelcomeBanner() {
    return new AttachmentBuilder(
        WELCOME_BANNER_PATH,
        { name: WELCOME_BANNER_NAME }
    );
}

function createWelcomeEmbed(member) {
    const verification = member.guild.channels.cache.get(
        channels.verification
    );

    const verifyText = verification?.isTextBased()
        ? `Verify in ${verification} to begin your journey.`
        : 'Complete verification to begin your journey.';

    return new EmbedBuilder()
        .setColor(brand.color)
        .setAuthor({
            name: `${brand.name} • ${brand.server}`,
            iconURL: member.client.user.displayAvatarURL({
                size: 256
            })
        })
        .setTitle(`Welcome to ${brand.server}`)
        .setDescription([
            `Welcome, ${member}.`,
            '',
            `⛩️ ${verifyText}`,
            '',
            `**Member #${member.guild.memberCount}**`
        ].join('\n'))
        .setThumbnail(
            member.user.displayAvatarURL({ size: 256 })
        )
        .setImage(`attachment://${WELCOME_BANNER_NAME}`)
        .setFooter({ text: brand.footer });
}

module.exports = {
    createWelcomeBanner,
    createWelcomeEmbed
};
