const {
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed
} = require('../embeds');

const VERIFY_CHANNEL_ID =
    '1528402259699044352';

/**
 * Get and validate the verification channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').TextBasedChannel|null>}
 */
async function getVerificationChannel(
    interaction
) {
    const verifyChannel =
        await interaction.guild.channels.fetch(
            VERIFY_CHANNEL_ID
        );

    if (
        !verifyChannel ||
        !verifyChannel.isTextBased()
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Verification Channel Missing',
                    'Umbra could not find the configured verification channel.'
                )
            ],

            components: []
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
                    'Umbra could not access its server member information.'
                )
            ],

            components: []
        });

        return null;
    }

    const channelPermissions =
        verifyChannel.permissionsFor(
            botMember
        );

    if (
        !channelPermissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks
        ])
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Missing Umbra Permissions',
                    'Umbra requires **View Channel**, **Send Messages**, and **Embed Links** permissions in the verification channel.'
                )
            ],

            components: []
        });

        return null;
    }

    return verifyChannel;
}

/**
 * Publish the Crimson Eclipse verification guide.
 *
 * Bloxlink continues to handle the real Roblox verification.
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
        createEmbed({
            title:
                '⛩️ The Gate of Crimson Eclipse',

            description:
                [
                    'Welcome, traveler.',
                    '',
                    'Before entering the Order, you must verify your Roblox account through **Bloxlink**.',
                    '',
                    'Complete the steps below to unlock the main Crimson Eclipse channels.'
                ].join('\n'),

            thumbnail:
                interaction.guild.iconURL({
                    size: 512,
                    forceStatic: false
                }) ??
                interaction.client.user.displayAvatarURL({
                    size: 512,
                    forceStatic: false
                }),

            fields: [
                {
                    name:
                        '🔗 How to Verify',

                    value:
                        [
                            '1. Type the `/verify` command in this channel.',
                            '2. Select the Bloxlink command when Discord displays it.',
                            '3. Open the verification link sent by Bloxlink.',
                            '4. Connect the correct Roblox account.',
                            '5. Return to Discord and complete the process.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '✅ What Happens After Verification?',

                    value:
                        [
                            '• You receive the **Verified** role.',
                            '• The **Unverified** role is removed.',
                            '• The main community channels become available.',
                            '• You may enter the Gathering Hall and the Realms.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '⚠️ Important',

                    value:
                        [
                            '• Connect only your own Roblox account.',
                            '• Make sure the Roblox username is correct.',
                            '• Do not repeatedly spam the verification command.',
                            '• Never share your password with anyone.',
                            '• Crimson Eclipse staff will never ask for your Roblox password.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🔄 Already Verified With Bloxlink?',

                    value:
                        [
                            'If your Roblox account is already connected to Bloxlink, use `/verify` again.',
                            '',
                            'Bloxlink should update your roles automatically and grant access to the Order.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🎫 Verification Not Working?',

                    value:
                        [
                            'Wait a short moment and try `/verify` again.',
                            '',
                            'If the problem continues:',
                            '',
                            '1. Read the Ticket Guide.',
                            '2. Go to **🎫・create-ticket**.',
                            '3. Open a private support ticket.',
                            '4. Explain the problem clearly to the Shadow Wardens.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🌑 Final Instruction',

                    value:
                        [
                            'Verification protects the Order from impersonation and helps members use the correct Roblox identity.',
                            '',
                            '*Prove your identity, unlock the gates, and begin your journey beneath the crimson moon.*'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        });

    guideEmbed.setAuthor({
        name:
            'Umbra • Guardian of Crimson Eclipse',

        iconURL:
            interaction.client.user.displayAvatarURL({
                size: 256,
                forceStatic: false
            })
    });

    guideEmbed.setFooter({
        text:
            '🌑 Crimson Eclipse • Verification Gate',

        iconURL:
            interaction.guild.iconURL({
                size: 128,
                forceStatic: false
            }) ??
            interaction.client.user.displayAvatarURL({
                size: 128,
                forceStatic: false
            })
    });

    guideEmbed.setTimestamp();

    await verifyChannel.send({
        embeds:
            [guideEmbed],

        allowedMentions: {
            parse: []
        }
    });

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ Verification Guide Published',
                `Umbra successfully published the verification guide in ${verifyChannel}.`
            )
        ],

        components: []
    });

    console.log(
        '======================================'
    );

    console.log(
        '⛩️ Verification Guide Published Through Setup Wizard'
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
    publishVerificationGuide
};