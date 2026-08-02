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
                    [
                        'Umbra requires the following permissions inside the verification channel:',
                        '',
                        '• **View Channel**',
                        '• **Send Messages**',
                        '• **Embed Links**'
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
 * Publish the Las Noches verification guide.
 *
 * Bloxlink continues to handle the real
 * Roblox account verification process.
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
                '⛩️ Gate of Las Noches',

            description:
                [
                    '## Welcome, wandering Soul.',
                    '',
                    'Before entering **Las Noches**, your Roblox identity must be verified through **Bloxlink**.',
                    '',
                    'Complete the ritual below to receive access to the kingdom and begin your progression.'
                ].join('\n'),

            color:
                '#6F42C1',

            thumbnail:
                interaction.guild.iconURL({
                    size:
                        512,

                    forceStatic:
                        false
                }) ??
                interaction.client.user
                    .displayAvatarURL({
                        size:
                            512,

                        forceStatic:
                            false
                    }),

            fields: [
                {
                    name:
                        '╭・🔗 VERIFICATION RITUAL',

                    value:
                        [
                            '1. Use the `/verify` command in this channel.',
                            '2. Select the command provided by **Bloxlink**.',
                            '3. Open the secure verification link.',
                            '4. Connect the correct Roblox account.',
                            '5. Return to Discord and finish the process.',
                            '',
                            '-# Bloxlink manages the actual Roblox verification process.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・✅ AFTER VERIFICATION',

                    value:
                        [
                            '• The **Verified** role will be granted.',
                            '• The **Unverified** role will be removed.',
                            '• Las Noches community channels will unlock.',
                            '• Your Roblox identity will be linked to your Discord account.',
                            '• You may begin building your Soul Record and Spiritual Power.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・🛡️ SECURITY NOTICE',

                    value:
                        [
                            '• Connect only an account that belongs to you.',
                            '• Confirm that the Roblox username is correct.',
                            '• Never share your Roblox or Discord password.',
                            '• Do not repeatedly spam the verification command.',
                            '• Las Noches staff will never request your password.',
                            '• Umbra will never send private login requests.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・🔄 ALREADY CONNECTED?',

                    value:
                        [
                            'If your Roblox account is already linked to Bloxlink, use `/verify` again.',
                            '',
                            'Bloxlink should refresh your server information and update your roles automatically.',
                            '',
                            '-# Role updates may take a short moment to appear.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・🎫 VERIFICATION SUPPORT',

                    value:
                        [
                            'If verification does not work:',
                            '',
                            '1. Wait briefly and try `/verify` again.',
                            '2. Confirm that the correct Roblox account is connected.',
                            '3. Read the Las Noches Ticket Guide.',
                            '4. Open a private support ticket.',
                            '5. Explain the issue clearly to the Las Noches staff.',
                            '',
                            '-# Never post passwords, login codes, or private account information.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '╰・🌙 FINAL DECREE',

                    value:
                        [
                            'Verification protects Las Noches from impersonation and keeps every Soul connected to the correct Roblox identity.',
                            '',
                            '> **Reveal your identity, cross the gate, and enter the kingdom beneath the eternal night.**'
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
            interaction.client.user
                .displayAvatarURL({
                    size:
                        256,

                    forceStatic:
                        false
                })
    });

    guideEmbed.setFooter({
        text:
            'Las Noches • Soul Verification Gate',

        iconURL:
            interaction.guild.iconURL({
                size:
                    128,

                forceStatic:
                    false
            }) ??
            interaction.client.user
                .displayAvatarURL({
                    size:
                        128,

                    forceStatic:
                        false
                })
    });

    guideEmbed.setTimestamp();

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
                `Umbra successfully published the Las Noches verification guide in ${verifyChannel}.`
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
        `🏰 Kingdom: ${interaction.guild.name}`
    );

    console.log(
        '======================================'
    );
}

module.exports = {
    publishVerificationGuide
};