const {
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed
} = require('../embeds');

const brand =
    require('../../config/brand');

const channels =
    require('../../config/channels');

const {
    getGuildProfile
} = require('../../config/guildProfiles');

/*
 * Legacy exports kept for compatibility.
 * Runtime values come from the Guild Profile.
 */
const VERIFY_CHANNEL_ID =
    channels.verifyChannelId;

const VERIFICATION_EMBED_COLOR =
    brand.themeColor;

/**
 * Get the configured verification channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').GuildTextBasedChannel|null>}
 */
async function getVerificationChannel(
    interaction
) {
    const profile =
        getGuildProfile(
            interaction.guildId
        );

    const channelId =
        profile.channels
            .verifyChannelId;

    const channel =
        channelId
            ? await interaction.guild.channels
                .fetch(
                    channelId
                )
                .catch(
                    () => null
                )
            : null;

    if (
        !channel ||
        !channel.isTextBased() ||
        channel.isThread()
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    'Verification Channel Missing',
                    'The configured verification channel could not be found.'
                )
            ],

            components:
                []
        });

        return null;
    }

    const botMember =
        interaction.guild.members.me;

    if (
        !botMember
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    `${profile.botName} Unavailable`,
                    `${profile.botName} could not access the server member record.`
                )
            ],

            components:
                []
        });

        return null;
    }

    const permissions =
        channel.permissionsFor(
            botMember
        );

    if (
        !permissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks
        ])
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    'Missing Permissions',
                    [
                        `${profile.botName} cannot publish the verification guide in ${channel}.`,
                        '',
                        'Required:',
                        '• View Channel',
                        '• Send Messages',
                        '• Embed Links'
                    ].join('\n')
                )
            ],

            components:
                []
        });

        return null;
    }

    return channel;
}

/**
 * Build a server-aware verification guide.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildVerificationGuideEmbed(
    interaction
) {
    const profile =
        getGuildProfile(
            interaction.guildId
        );

    const botAvatar =
        interaction.client.user
            .displayAvatarURL({
                size:
                    256,

                forceStatic:
                    false
            });

    const guildIcon =
        interaction.guild.iconURL({
            size:
                128,

            forceStatic:
                false
        }) ??
        botAvatar;

    const unverifiedName =
        profile.roles
            .unverifiedName;

    const verifiedName =
        profile.roles
            .verifiedName;

    return createEmbed({
        title:
            '⛩️・TAKE THE OATH',

        description:
            [
                `Verify your Roblox account through **Bloxlink** to enter **${profile.serverName}**.`,
                '',
                `**◇・${unverifiedName.toUpperCase()}** → **◆・${verifiedName.toUpperCase()}**`
            ].join('\n'),

        color:
            profile.themeColor,

        thumbnail:
            interaction.guild.iconURL({
                size:
                    512,

                forceStatic:
                    false
            }) ??
            botAvatar,

        fields: [
            {
                name:
                    '◆・VERIFY',

                value:
                    [
                        '1. Use `/verify` in this channel.',
                        '2. Select the Bloxlink command.',
                        '3. Open the verification link.',
                        '4. Connect the correct Roblox account.',
                        '5. Return to Discord and finish verification.'
                    ].join('\n'),

                inline:
                    false
            },

            {
                name:
                    '⚜・AFTER VERIFICATION',

                value:
                    `The **${verifiedName}** role will be granted and the kingdom will open to you.`,

                inline:
                    false
            },

            {
                name:
                    '🛡️・STAY SAFE',

                value:
                    [
                        '• Never share passwords or login codes.',
                        '• Confirm that the correct Roblox account is connected.',
                        `• ${profile.botName} and the server staff will never request your login credentials.`
                    ].join('\n'),

                inline:
                    false
            },

            {
                name:
                    '🎫・NEED HELP?',

                value:
                    'Try `/verify` again after a short wait. If the issue continues, open a support ticket.',

                inline:
                    false
            }
        ],

        author: {
            name:
                `${profile.botName} • ${profile.serverName}`,

            iconURL:
                botAvatar
        },

        footer: {
            text:
                `${profile.serverName} • Verification`,

            iconURL:
                guildIcon
        }
    });
}

/**
 * Publish the verification guide.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishVerificationGuide(
    interaction
) {
    const channel =
        await getVerificationChannel(
            interaction
        );

    if (
        !channel
    ) {
        return;
    }

    await channel.send({
        embeds: [
            buildVerificationGuideEmbed(
                interaction
            )
        ],

        allowedMentions: {
            parse:
                []
        }
    });

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                'Verification Guide Published',
                `The verification guide was published in ${channel}.`
            )
        ],

        components:
            []
    });

    console.log(
        `Verification guide published in #${channel.name} by ${interaction.user.tag}.`
    );
}

module.exports = {
    VERIFY_CHANNEL_ID,
    VERIFICATION_EMBED_COLOR,
    getVerificationChannel,
    buildVerificationGuideEmbed,
    publishVerificationGuide
};