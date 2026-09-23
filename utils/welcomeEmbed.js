const {
    AttachmentBuilder,
    EmbedBuilder
} = require('discord.js');

const path = require('path');

const brand =
    require('../config/brand');

const channels =
    require('../config/channels');

const WELCOME_BANNER_NAME =
    'welcome-banner.png';

const WELCOME_BANNER_PATH =
    path.join(
        __dirname,
        '..',
        'assets',
        'images',
        WELCOME_BANNER_NAME
    );

function createWelcomeBanner() {
    return new AttachmentBuilder(
        WELCOME_BANNER_PATH,
        {
            name:
                WELCOME_BANNER_NAME
        }
    );
}

function createWelcomeEmbed(
    member
) {
    const botAvatar =
        member.client.user
            .displayAvatarURL({
                size: 256
            });

    const memberAvatar =
        member.user
            .displayAvatarURL({
                size: 256
            });

    const verificationChannel =
        member.guild.channels.cache.get(
            channels.verification
        );

    const verificationText =
        verificationChannel?.isTextBased()
            ? `Complete verification in ${verificationChannel} to access the server.`
            : 'Complete verification to access the server.';

    return new EmbedBuilder()
        .setColor(
            brand.color
        )

        .setAuthor({
            name:
                `${brand.name} • ${brand.server}`,

            iconURL:
                botAvatar
        })

        .setTitle(
            `Welcome to ${brand.server}`
        )

        .setDescription(
            [
                `Welcome, ${member}.`,
                '',
                verificationText,
                '',
                `You are member **#${member.guild.memberCount}**.`
            ].join('\n')
        )

        .setThumbnail(
            memberAvatar
        )

        .setImage(
            `attachment://${WELCOME_BANNER_NAME}`
        )

        .setFooter({
            text:
                brand.footer
        })

        .setTimestamp();
}

module.exports = {
    createWelcomeBanner,
    createWelcomeEmbed
};