const {
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed
} = require('../embeds');

/**
 * Official THE Ⅹ SINS
 * verification channel.
 */
const VERIFY_CHANNEL_ID =
    '1528402259699044352';

/**
 * THE Ⅹ SINS signature color.
 */
const VERIFICATION_EMBED_COLOR =
    '#5B3A78';

/**
 * Get and validate the
 * verification channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').GuildTextBasedChannel|null>}
 */
async function getVerificationChannel(
    interaction
) {
    const verifyChannel =
        await interaction.guild.channels
            .fetch(
                VERIFY_CHANNEL_ID
            )
            .catch(
                () => null
            );

    if (
        !verifyChannel ||
        !verifyChannel.isTextBased() ||
        verifyChannel.isThread()
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

    const channelPermissions =
        verifyChannel.permissionsFor(
            botMember
        );

    const requiredPermissions = [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks
    ];

    if (
        !channelPermissions?.has(
            requiredPermissions
        )
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Missing Permissions',
                    [
                        `Evelynn cannot publish the verification guide in ${verifyChannel}.`,
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

    return verifyChannel;
}

/**
 * Build the compact
 * THE Ⅹ SINS verification guide.
 *
 * Bloxlink handles the real Roblox
 * account verification process.
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

    const guideEmbed =
        createEmbed({
            title:
                'Ⅹ・TAKE THE OATH',

            description:
                [
                    'Verify your Roblox account through **Bloxlink** to enter **THE Ⅹ SINS**.',
                    '',
                    '**◇・UNSWORN** → **✦・SWORN**'
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
                            '5. Return to Discord and complete verification.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '◆・AFTER VERIFICATION',

                    value:
                        [
                            '**✦・SWORN** access will be granted.',
                            '',
                            'Community channels will become available.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '🛡️・STAY SAFE',

                    value:
                        [
                            '• Never share your Discord or Roblox password.',
                            '• Confirm the correct Roblox account is connected.',
                            '• Evelynn and Staff will never ask for login codes.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '🎫・NEED HELP?',

                    value:
                        [
                            'Try `/verify` again after a short wait.',
                            '',
                            'If the issue continues, open a support ticket.'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        });

    guideEmbed.setAuthor({
        name:
            'Evelynn • THE Ⅹ SINS',

        iconURL:
            botAvatar
    });

    guideEmbed.setFooter({
        text:
            'TTS • Verification',

        iconURL:
            guildIcon
    });

    guideEmbed.setTimestamp();

    return guideEmbed;
}

/**
 * Publish the compact
 * THE Ⅹ SINS verification guide.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishVerificationGuide(
    interaction
) {
    const verifyChannel =
        await getVerificationChannel(
            interaction
        );

    if (!verifyChannel) {
        return;
    }

    const guideEmbed =
        buildVerificationGuideEmbed(
            interaction
        );

    await verifyChannel.send({
        embeds: [
            guideEmbed
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
                `The verification guide was published in ${verifyChannel}.`
            )
        ],

        components:
            []
    });

    console.log(
        '======================================'
    );

    console.log(
        'Ⅹ Verification Guide Published'
    );

    console.log(
        `📍 Channel: ${verifyChannel.name}`
    );

    console.log(
        `🛡️ Published By: ${interaction.user.tag}`
    );

    console.log(
        `🏰 Server: ${interaction.guild.name}`
    );

    console.log(
        '======================================'
    );
}

module.exports = {
    VERIFY_CHANNEL_ID,
    VERIFICATION_EMBED_COLOR,
    getVerificationChannel,
    buildVerificationGuideEmbed,
    publishVerificationGuide
};