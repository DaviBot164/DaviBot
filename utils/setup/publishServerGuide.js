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

const {
    getGuildProfile
} = require('../../config/guildProfiles');

/*
 * Legacy export kept for compatibility.
 * Runtime color comes from the Guild Profile.
 */
const GUIDE_EMBED_COLOR =
    brand.themeColor;

/**
 * Get the configured information channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').GuildTextBasedChannel|null>}
 */
async function getServerGuideChannel(
    interaction
) {
    const profile =
        getGuildProfile(
            interaction.guildId
        );

    const channelId =
        profile.channels
            .informationChannelId;

    const channel =
        channelId
            ? await interaction.guild.channels
                .fetch(
                    channelId
                )
                .catch(
                    () => null
                )
            : null;

    if (
        !channel ||
        !channel.isTextBased() ||
        channel.isThread()
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    'Information Channel Missing',
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

    if (
        !botMember
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    `${profile.botName} Unavailable`,
                    `${profile.botName} could not access the server member record.`
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
                    'Missing Permissions',
                    [
                        `${profile.botName} cannot publish the Kingdom Guide in ${channel}.`,
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
 * Publish a server-aware Kingdom Guide.
 *
 * The legacy function name remains unchanged.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishServerGuide(
    interaction
) {
    const profile =
        getGuildProfile(
            interaction.guildId
        );

    const channel =
        await getServerGuideChannel(
            interaction
        );

    if (
        !channel
    ) {
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

    const unverifiedName =
        profile.roles
            .unverifiedName;

    const verifiedName =
        profile.roles
            .verifiedName;

    const guideEmbed =
        createEmbed({
            title:
                `📜・${profile.shortName.toUpperCase()} GUIDE`,

            description:
                [
                    '**Your path begins here.**',
                    '',
                    `A quick guide to **${profile.serverName}**.`,
                    '',
                    `*${profile.motto}*`
                ].join('\n'),

            color:
                profile.themeColor,

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
                        'Ⅰ・READ THE LAWS',

                    value:
                        'Read the **Royal Laws** and respect every member of the kingdom.',

                    inline:
                        false
                },

                {
                    name:
                        'Ⅱ・TAKE THE OATH',

                    value:
                        [
                            'Verify through **Bloxlink** to unlock the community.',
                            '',
                            `**◇・${unverifiedName.toUpperCase()}** → **◆・${verifiedName.toUpperCase()}**`
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        'Ⅲ・ENTER THE KINGDOM',

                    value:
                        'Meet other members, find players and join community activities.',

                    inline:
                        false
                },

                {
                    name:
                        'Ⅳ・EARN YOUR PLACE',

                    value:
                        'Earn Levels, Achievements, Titles and progression roles through activity.',

                    inline:
                        false
                },

                {
                    name:
                        'Ⅴ・RISE THROUGH THE RANKS',

                    value:
                        [
                            `Compete in the official **${profile.trialSystemName}**.`,
                            '',
                            `Rise from **◇・UNRANKED** through the **${profile.rankSystemName}**.`
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
                    `${profile.botName} • ${profile.serverName}`,

                iconURL:
                    botAvatar
            },

            footer: {
                text:
                    `${profile.serverName} • Kingdom Guide`,

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
                'Kingdom Guide Published',
                `The Kingdom Guide was published in ${channel}.`
            )
        ],

        components:
            []
    });

    console.log(
        `Kingdom Guide published in #${channel.name} by ${interaction.user.tag}.`
    );
}

module.exports = {
    GUIDE_EMBED_COLOR,
    publishServerGuide
};