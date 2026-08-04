const {
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed
} = require('../embeds');

/**
 * Official Las Noches verification channel.
 */
const VERIFY_CHANNEL_ID =
    '1528402259699044352';

/**
 * Cold silver tone matching the current
 * Las Noches visual identity.
 */
const VERIFICATION_EMBED_COLOR =
    '#C8CDD4';

/**
 * Get and validate the verification channel.
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
                    '❌ Verification Gate Missing',
                    'Umbra could not find the configured Las Noches verification channel.'
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
                    '❌ Umbra Unavailable',
                    'Umbra could not access its Las Noches member record.'
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
                    '❌ Missing Umbra Permissions',
                    [
                        'Umbra requires these permissions in the verification channel:',
                        '',
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
 * Build the compact Las Noches
 * verification guide Embed.
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
                '⛩️ Verification Gate',

            description:
                [
                    'Verify your Roblox account through **Bloxlink** to enter Las Noches.',
                    '',
                    'Use the instructions below and make sure the correct Roblox account is connected.'
                ].join(
                    '\n'
                ),

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
                        '🔗 How to Verify',

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
                        '✅ After Verification',

                    value:
                        [
                            '• The Verified role will be granted.',
                            '• The Unverified role will be removed.',
                            '• Las Noches community channels will unlock.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🛡️ Safety',

                    value:
                        [
                            '• Never share your Discord or Roblox password.',
                            '• Confirm the connected Roblox username.',
                            '• Umbra and Las Noches staff will never request login codes.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🎫 Need Help?',

                    value:
                        [
                            'Try `/verify` again after a short wait.',
                            'If the problem continues, open a private support ticket.'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        });

    guideEmbed.setAuthor({
        name:
            'Umbra • Guardian of Las Noches',

        iconURL:
            botAvatar
    });

    guideEmbed.setFooter({
        text:
            'Las Noches • Verification Gate',

        iconURL:
            guildIcon
    });

    guideEmbed.setTimestamp();

    return guideEmbed;
}/**
 * Publish the compact Las Noches
 * verification guide.
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
                `Umbra published the Las Noches verification guide in ${verifyChannel}.`
            )
        ],

        components:
            []
    });

    console.log(
        '======================================'
    );

    console.log(
        '⛩️ Las Noches Verification Guide Published'
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