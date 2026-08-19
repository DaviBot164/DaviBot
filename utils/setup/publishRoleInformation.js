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

const ROLE_EMBED_COLOR =
    brand.themeColor;

/**
 * Get the role information channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').TextBasedChannel|null>}
 */
async function getRoleInformationChannel(
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
                        `Evelynn cannot publish role information in ${channel}.`,
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
 * Lunar Seireitei role hierarchy.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishRoleInformation(
    interaction
) {
    const channel =
        await getRoleInformationChannel(
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

    const roleEmbed =
        createEmbed({
            title:
                '☾・ROLE HIERARCHY',

            description:
                [
                    '**Every soul has a place beneath the moon.**',
                    '',
                    `Authority, Captain rank and progression are separate systems inside **${brand.serverName}**.`
                ].join('\n'),

            color:
                ROLE_EMBED_COLOR,

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
                        '♔・HIGH COMMAND',

                    value:
                        [
                            '**♔・LUNAR SOVEREIGN** — Highest authority',
                            '**🌙・MOON SPIRIT** — Voice of Seireitei',
                            '**⚔・CAPTAIN-COMMANDER** — Senior leadership',
                            '**🛡・CAPTAIN** — Administration',
                            '**◇・LIEUTENANT** — Moderation',
                            '',
                            '-# Only High Command roles grant moderation authority.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '⚔・CAPTAIN RANKS',

                    value:
                        [
                            '**Ø・CAPTAIN** — Highest ranked position',
                            '',
                            '**Ⅰ・CAPTAIN**　 **Ⅱ・CAPTAIN**',
                            '**Ⅲ・CAPTAIN**　 **Ⅳ・CAPTAIN**',
                            '**Ⅴ・CAPTAIN**　 **Ⅵ・CAPTAIN**',
                            '**Ⅶ・CAPTAIN**　 **Ⅷ・CAPTAIN**',
                            '**Ⅸ・CAPTAIN**　 **Ⅹ・CAPTAIN**',
                            '',
                            '**◇・UNRANKED** — No Captain rank',
                            '',
                            '-# Captain Ranks are earned through official Captain Trials.',
                            '-# Captain Ranks do not grant Staff permissions.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '✦・SOUL PROGRESSION',

                    value:
                        [
                            '**✦・ETERNAL SOUL**',
                            '**♔・SOUL SOVEREIGN**',
                            '**☾・SOUL ASCENDANT**',
                            '**◇・SOUL AWAKENED**',
                            '**✧・SOULBOUND**',
                            '',
                            '-# Progression reflects activity and advancement.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '◇・VERIFICATION',

                    value:
                        [
                            '**✦・SOUL REAPER** — Verified',
                            '**◇・WANDERING SOUL** — Awaiting verification'
                        ].join('\n'),

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
                    `${brand.serverName} • Role Hierarchy`,

                iconURL:
                    guildIcon
            }
        });

    await channel.send({
        embeds: [
            roleEmbed
        ],

        allowedMentions: {
            parse:
                []
        }
    });

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ Role Information Published',
                `Role information was published in ${channel}.`
            )
        ],

        components:
            []
    });

    console.log(
        `${brand.serverName} role hierarchy published in #${channel.name} by ${interaction.user.tag}.`
    );
}

module.exports = {
    ROLE_EMBED_COLOR,
    publishRoleInformation
};
