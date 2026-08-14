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
 * THE Ⅹ SINS information channel.
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
                    '❌ Information Channel Missing',
                    'The configured information channel could not be found.'
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
                    '❌ Missing Permissions',
                    [
                        `Evelynn cannot publish the guide in ${guideChannel}.`,
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

    return guideChannel;
}

/**
 * Publish the official
 * THE Ⅹ SINS server guide.
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
                'Ⅹ・SIN CODEX',

            description:
                [
                    '**Your path begins here.**',
                    '',
                    'Everything you need to enter, progress and take part in **THE Ⅹ SINS**.'
                ].join('\n'),

            color:
                '#5B3A78',

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
                        'Ⅰ・READ THE CODE',

                    value:
                        [
                            'Read the **Code of Sins** before participating.',
                            '',
                            'Respect others, play fairly and follow Staff decisions.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        'Ⅱ・TAKE THE OATH',

                    value:
                        [
                            'Verify your Roblox account through **Bloxlink**.',
                            '',
                            '**◇・UNSWORN** → **✦・SWORN**'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        'Ⅲ・EXPLORE',

                    value:
                        [
                            'Once verified, the server opens to you.',
                            '',
                            'Chat, find players, share content and join community activities.'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        });    guideEmbed.addFields(
        {
            name:
                'Ⅳ・PROGRESS',

            value:
                [
                    'Stay active and build your standing within **THE Ⅹ SINS**.',
                    '',
                    'Earn levels, achievements, titles and progression roles.',
                    '',
                    '-# Rank and Staff authority are separate systems.'
                ].join('\n'),

            inline:
                false
        },

        {
            name:
                'Ⅴ・SEEK SUPPORT',

            value:
                [
                    'Use the Ticket System when private help is needed.',
                    '',
                    'Tickets may be used for:',
                    '• Reports',
                    '• Appeals',
                    '• Server issues',
                    '• Private evidence',
                    '• Staff assistance'
                ].join('\n'),

            inline:
                false
        },

        {
            name:
                'Ⅹ・REMEMBER',

            value:
                [
                    'Respect the Code.',
                    'Earn your place.',
                    'Make your name known.'
                ].join('\n'),

            inline:
                false
        }
    );

    guideEmbed.setAuthor({
        name:
            'Evelynn • THE Ⅹ SINS',

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
            'TTS • Sin Codex',

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
                '✅ Sin Codex Published',
                `The Sin Codex was published in ${guideChannel}.`
            )
        ],

        components:
            []
    });

    console.log(
        '======================================'
    );

    console.log(
        'Ⅹ Sin Codex Published'
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