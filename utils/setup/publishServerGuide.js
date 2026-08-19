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

const setupChannels =
    require('../../config/setupChannels');

const GUIDE_EMBED_COLOR =
    brand.themeColor;

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
                        `Evelynn cannot publish the Soul Codex in ${channel}.`,
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
 * Lunar Seireitei server guide.
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
                '☾・SOUL CODEX',

            description:
                [
                    '**Your path begins here.**',
                    '',
                    `A quick guide to **${brand.serverName}**.`,
                    '',
                    `*${brand.motto}*`
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
                        'Read the **Sacred Laws** and respect every Soul within Seireitei.',

                    inline:
                        false
                },

                {
                    name:
                        'Ⅱ・ENTER SOUL SOCIETY',

                    value:
                        [
                            'Verify through **Bloxlink** to unlock the community.',
                            '',
                            '**◇・WANDERING SOUL** → **✦・SOUL REAPER**'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        'Ⅲ・FIND YOUR PLACE',

                    value:
                        'Meet other Souls, find players and take part in community activities.',

                    inline:
                        false
                },

                {
                    name:
                        'Ⅳ・AWAKEN YOUR SOUL',

                    value:
                        'Earn Levels, Achievements, Titles and Soul Progression roles through activity.',

                    inline:
                        false
                },

                {
                    name:
                        'Ⅴ・RISE AS A CAPTAIN',

                    value:
                        [
                            'Compete in the official **Captain Trials**.',
                            '',
                            'Rise from **◇・UNRANKED** through the numbered **Captain Ranks**.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        'Ⅵ・SEEK SUPPORT',

                    value:
                        'Use the Ticket System for reports, appeals or private assistance.',

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
                    `${brand.serverName} • Soul Codex`,

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
                '✅ Soul Codex Published',
                `The Soul Codex was published in ${channel}.`
            )
        ],

        components:
            []
    });

    console.log(
        `Soul Codex published in #${channel.name} by ${interaction.user.tag}.`
    );
}

module.exports = {
    GUIDE_EMBED_COLOR,
    publishServerGuide
};