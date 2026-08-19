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

const VERIFY_CHANNEL_ID =
    channels.verifyChannelId;

const VERIFICATION_EMBED_COLOR =
    brand.themeColor;

/**
 * Get the verification channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').GuildTextBasedChannel|null>}
 */
async function getVerificationChannel(
    interaction
) {
    const channel =
        await interaction.guild.channels
            .fetch(
                VERIFY_CHANNEL_ID
            )
            .catch(
                () => null
            );

    if (
        !channel ||
        !channel.isTextBased() ||
        channel.isThread()
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Verification Channel Missing',
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

    if (!botMember) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Evelynn Unavailable',
                    'Evelynn could not access her server member record.'
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
                    '❌ Missing Permissions',
                    [
                        `Evelynn cannot publish the verification guide in ${channel}.`,
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
 * Build the verification guide.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildVerificationGuideEmbed(
    interaction
) {
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

    return createEmbed({
        title:
            '☾・TAKE THE OATH',

        description:
            [
                'Verify your Roblox account through **Bloxlink** to enter **Soul Society**.',
                '',
                '**◇・WANDERING SOUL** → **✦・SOUL REAPER**'
            ].join('\n'),

        color:
            VERIFICATION_EMBED_COLOR,

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
                    '✦・VERIFY',

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
                    '◆・AFTER VERIFICATION',

                value:
                    '**✦・SOUL REAPER** access will be granted and community channels will unlock.',

                inline:
                    false
            },

            {
                name:
                    '🛡️・STAY SAFE',

                value:
                    [
                        '• Never share passwords or login codes.',
                        '• Confirm the correct Roblox account is connected.',
                        '• Evelynn and High Command will never ask for your login credentials.'
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
                `${brand.botName} • ${brand.serverName}`,

            iconURL:
                botAvatar
        },

        footer: {
            text:
                `${brand.serverName} • Verification`,

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

    if (!channel) {
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
                '✅ Verification Guide Published',
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