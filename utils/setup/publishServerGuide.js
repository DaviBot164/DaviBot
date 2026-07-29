const {
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed
} = require('../embeds');

const setupChannels =
    require('../../config/setupChannels');

/**
 * Get and validate the Information channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').TextBasedChannel|null>}
 */
async function getServerGuideChannel(
    interaction
) {
    const guideChannel =
        await interaction.guild.channels.fetch(
            setupChannels
                .informationChannelId
        );

    if (
        !guideChannel ||
        !guideChannel.isTextBased()
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Information Channel Missing',
                    'Umbra could not find the configured Information channel.'
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
        guideChannel.permissionsFor(
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
                    'Umbra requires **View Channel**, **Send Messages**, and **Embed Links** permissions in the Information channel.'
                )
            ],

            components: []
        });

        return null;
    }

    return guideChannel;
}

/**
 * Publish the Crimson Eclipse Server Guide.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishServerGuide(
    interaction
) {
    const guideChannel =
        await getServerGuideChannel(
            interaction
        );

    if (!guideChannel) {
        return;
    }

    const guideEmbed =
        createEmbed({
            title:
                '📖 Journey Through Crimson Eclipse',

            description:
                [
                    `Welcome, ${interaction.user}.`,
                    '',
                    'Every Soul begins their journey beneath the crimson moon.',
                    '',
                    'Follow the steps below to unlock the Order and become part of the Crimson Eclipse community.'
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
                        '📜 Step I — Read the Sacred Laws',

                    value:
                        [
                            'Begin by reading the official laws of Crimson Eclipse.',
                            '',
                            'The Sacred Laws explain:',
                            '',
                            '• Community behavior',
                            '• Fair-play requirements',
                            '• Chat restrictions',
                            '• Staff authority',
                            '• Ticket expectations',
                            '• Guardian punishments',
                            '',
                            'Remaining in the server means that you agree to follow these laws.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '⛩️ Step II — Verify Your Account',

                    value:
                        [
                            'Visit the verification channel and connect your Roblox account.',
                            '',
                            'Verification helps the Order:',
                            '',
                            '• Confirm your Roblox identity',
                            '• Protect members from impersonation',
                            '• Assign the correct access roles',
                            '• Keep the community secure',
                            '',
                            'Complete verification before attempting to access the main community channels.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🌑 Step III — Enter the Gathering Hall',

                    value:
                        [
                            'After verification, introduce yourself and join the community.',
                            '',
                            'Use the main gathering channel for:',
                            '',
                            '• General conversations',
                            '• Meeting other members',
                            '• Discussing Project Slayers',
                            '• Sharing community ideas',
                            '• Finding people to play with',
                            '',
                            'Keep conversations respectful and follow the purpose of each channel.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🎮 Step IV — Explore the Community',

                    value:
                        [
                            'Crimson Eclipse contains several spaces for different activities.',
                            '',
                            '🎮 **Gaming** — Find teammates and discuss games',
                            '🎵 **Music** — Share songs and playlists',
                            '🖼️ **Gallery** — Share images, clips, and artwork',
                            '📢 **Decrees** — Read official announcements',
                            '📜 **Information** — Review server information and official guidance',
                            '',
                            'More systems may become available as the Order grows.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🎫 Step V — Request Support',

                    value:
                        [
                            'If you experience a problem, use Umbra’s Ticket System.',
                            '',
                            'Create a ticket for:',
                            '',
                            '• Reporting a member',
                            '• Appealing a moderation action',
                            '• Reporting a server problem',
                            '• Requesting help from Shadow Wardens',
                            '• Providing private evidence',
                            '',
                            'Explain your issue clearly and remain patient while waiting for assistance.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🛡️ Step VI — Understand the Order',

                    value:
                        [
                            'Crimson Eclipse is protected and managed through several ranks.',
                            '',
                            '👑 **Crimson Lord** — Leader of the Order',
                            '⚜️ **Eclipse Keepers** — Senior administrators',
                            '🛡️ **Shadow Wardens** — Moderation and support staff',
                            '🌑 **Souls** — Members of the community',
                            '🤖 **Umbra** — Guardian of Crimson Eclipse',
                            '',
                            'Respect every rank and report misuse of authority through the proper support channels.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🌙 Step VII — Begin Your Journey',

                    value:
                        [
                            'You are now ready to become part of Crimson Eclipse.',
                            '',
                            '• Respect other Souls',
                            '• Play fairly',
                            '• Help new members',
                            '• Report serious violations',
                            '• Participate in the community',
                            '• Enjoy your journey',
                            '',
                            '*Every Soul leaves a mark beneath the crimson moon.*'
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
            '🌑 Crimson Eclipse • Server Guide',

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

    await guideChannel.send({
        embeds:
            [guideEmbed],

        allowedMentions: {
            parse: []
        }
    });

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ Server Guide Published',
                `Umbra successfully published the Server Guide in ${guideChannel}.`
            )
        ],

        components: []
    });

    console.log(
        '======================================'
    );

    console.log(
        '📖 Server Guide Published Through Setup Wizard'
    );

    console.log(
        `📍 Channel: ${guideChannel.name}`
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
    publishServerGuide
};