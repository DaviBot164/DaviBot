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
 * Get and validate the
 * Las Noches Information channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').TextBasedChannel|null>}
 */
async function getServerGuideChannel(
    interaction
) {
    const guideChannel =
        await interaction.guild.channels
            .fetch(
                setupChannels
                    .informationChannelId
            )
            .catch(
                () => null
            );

    if (
        !guideChannel ||
        !guideChannel.isTextBased()
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ Kingdom Archive Missing',
                    'Umbra could not find the configured Las Noches Information channel.'
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
                    'Umbra could not access its Las Noches member record.'
                )
            ],

            components: []
        });

        return null;
    }

    const permissions =
        guideChannel.permissionsFor(
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
                    '❌ Missing Umbra Permissions',
                    [
                        'Umbra requires:',
                        '',
                        '• View Channel',
                        '• Send Messages',
                        '• Embed Links'
                    ].join('\n')
                )
            ],

            components: []
        });

        return null;
    }

    return guideChannel;
}

/**
 * Publish the official
 * Las Noches Kingdom Guide.
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
                '📖 Welcome to Las Noches',

            description:
                [
                    '## Every Soul begins somewhere.',
                    '',
                    'This guide explains everything you need before beginning your journey inside **Las Noches**.',
                    '',
                    'Follow each step to unlock the kingdom and begin building your Soul Record.'
                ].join('\n'),

            color:
                '#6F42C1',

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
                        '╭・📜 STEP I — LEARN THE ROYAL LAWS',

                    value:
                        [
                            'Before doing anything else, read the **Royal Laws of Las Noches**.',
                            '',
                            'They explain:',
                            '',
                            '• Kingdom rules',
                            '• Fair gameplay',
                            '• Communication standards',
                            '• Authority structure',
                            '• Guardian punishments',
                            '',
                            '> Remaining inside Las Noches means accepting these laws.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・⛩️ STEP II — VERIFY YOUR IDENTITY',

                    value:
                        [
                            'Use **Bloxlink** to verify your Roblox account.',
                            '',
                            'Verification protects every Soul and allows Umbra to assign your correct roles automatically.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・🌙 STEP III — ENTER THE KINGDOM',

                    value:
                        [
                            'After verification you may freely enter the kingdom.',
                            '',
                            'Introduce yourself.',
                            'Meet other Souls.',
                            'Begin your adventure.'
                        ].join('\n'),

                    inline:
                        false
                },                {
                    name:
                        '├・🎮 STEP IV — EXPLORE LAS NOCHES',

                    value:
                        [
                            'Las Noches contains different spaces for every kind of activity.',
                            '',
                            '🎮 **Gaming** — Find teammates and discuss games',
                            '🎵 **Music** — Share songs and playlists',
                            '🖼️ **Gallery** — Share artwork, screenshots, and clips',
                            '📢 **Kingdom Decrees** — Read official announcements',
                            '📜 **Information Archive** — Review guides and important records',
                            '',
                            '-# New areas may be added as the kingdom expands.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・✨ STEP V — BUILD SPIRITUAL POWER',

                    value:
                        [
                            'Activity inside Las Noches contributes to your progression.',
                            '',
                            'Through messages, events, achievements, ranks, and other systems, your Soul may unlock:',
                            '',
                            '• Higher Levels',
                            '• More Spiritual Power',
                            '• Chronicle Titles',
                            '• Achievement Records',
                            '• Arrancar Ranks',
                            '• Progression Roles',
                            '',
                            '> Your Soul Record grows alongside your activity.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・🎫 STEP VI — REQUEST SUPPORT',

                    value:
                        [
                            'Use Umbra’s private Ticket System when assistance is needed.',
                            '',
                            'Tickets may be used for:',
                            '',
                            '• Reporting members',
                            '• Appealing moderation decisions',
                            '• Reporting server problems',
                            '• Sharing private evidence',
                            '• Requesting help from Las Noches staff',
                            '',
                            'Explain the issue clearly and remain patient while waiting for a response.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・👑 STEP VII — UNDERSTAND THE HIERARCHY',

                    value:
                        [
                            'Las Noches is protected through a clear structure of authority and progression.',
                            '',
                            '👑 **Ruler of Las Noches** — Kingdom leadership',
                            '⚜️ **Head Captain** — Senior administration',
                            '🛡️ **Captains** — Management and protection',
                            '⚔️ **Lieutenants** — Moderation and support',
                            '👑 **Espada** — Elite Arrancar ranks',
                            '🌘 **Privaron Espada** — Former elite ranks',
                            '⚔️ **Fracción** — Arrancar serving higher ranks',
                            '🦴 **Numeros** — Ranked Arrancar',
                            '🌙 **Souls** — Members of Las Noches',
                            '🤖 **Umbra** — Guardian of Las Noches',
                            '',
                            '-# Always report misuse of authority through the proper support channels.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '╰・🌑 STEP VIII — BEGIN YOUR JOURNEY',

                    value:
                        [
                            'You are now ready to become part of Las Noches.',
                            '',
                            '• Respect every Soul',
                            '• Follow the Royal Laws',
                            '• Compete fairly',
                            '• Support new members',
                            '• Participate in events',
                            '• Build your Soul Record',
                            '• Rise through the Arrancar hierarchy',
                            '',
                            '> **Enter the eternal night and carve your name into the Kingdom Records.**'
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
            'Las Noches • Kingdom Guide',

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

    await guideChannel.send({
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
                '✅ Kingdom Guide Published',
                `Umbra successfully published the Las Noches Kingdom Guide in ${guideChannel}.`
            )
        ],

        components:
            []
    });

    console.log(
        '======================================'
    );

    console.log(
        '📖 Las Noches Kingdom Guide Published'
    );

    console.log(
        `📍 Channel: ${guideChannel.name}`
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
    publishServerGuide
};