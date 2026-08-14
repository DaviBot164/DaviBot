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

const GUIDE_EMBED_COLOR =
    '#B026FF';

/**
 * Get the server guide channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').TextBasedChannel|null>}
 */
async function getServerGuideChannel(
    interaction
) {
    const channel =
        await interaction.guild.channels
            .fetch(
                setupChannels
                    .informationChannelId
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
                        `Evelynn cannot publish the Sin Codex in ${channel}.`,
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
 * Publish the official
 * THE Ⅹ SINS server guide.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishServerGuide(
    interaction
) {
    const channel =
        await getServerGuideChannel(
            interaction
        );

    if (!channel) {
        return;
    }

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
                'Ⅹ・SIN CODEX',

            description:
                [
                    '**Your path begins here.**',
                    '',
                    'A quick guide to **THE Ⅹ SINS**.'
                ].join('\n'),

            color:
                GUIDE_EMBED_COLOR,

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
                        'Ⅰ・READ THE CODE',

                    value:
                        'Read the **Code of Sins** and follow the server rules.',

                    inline:
                        false
                },

                {
                    name:
                        'Ⅱ・TAKE THE OATH',

                    value:
                        [
                            'Verify through **Bloxlink**.',
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
                        'Chat, find players and take part in community activities.',

                    inline:
                        false
                },

                {
                    name:
                        'Ⅳ・PROGRESS',

                    value:
                        'Earn Levels, Achievements, Titles and progression roles.',

                    inline:
                        false
                },

                {
                    name:
                        'Ⅴ・SUPPORT',

                    value:
                        'Use the Ticket System for reports, appeals or private assistance.',

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
            ],

            author: {
                name:
                    'Evelynn • THE Ⅹ SINS',

                iconURL:
                    botAvatar
            },

            footer: {
                text:
                    'TTS • Sin Codex',

                iconURL:
                    guildIcon
            }
        });

    await channel.send({
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
                `The Sin Codex was published in ${channel}.`
            )
        ],

        components:
            []
    });

    console.log(
        `Ⅹ Sin Codex published in #${channel.name} by ${interaction.user.tag}.`
    );
}

module.exports = {
    GUIDE_EMBED_COLOR,
    publishServerGuide
};