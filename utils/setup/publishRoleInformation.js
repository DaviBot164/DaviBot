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

const ROLE_EMBED_COLOR =
    '#B026FF';

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
 * THE Ⅹ SINS role hierarchy.
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
                'Ⅹ・ROLE HIERARCHY',

            description:
                [
                    '**Every role has a purpose.**',
                    '',
                    'Authority, rank and progression are separate systems inside **THE Ⅹ SINS**.'
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
                        '♛・STAFF',

                    value:
                        [
                            '**♛・SOVEREIGN** — Highest authority',
                            '**⚜️・HEAD CAPTAIN** — Senior leadership',
                            '**🛡️・CAPTAIN** — Administration',
                            '**⚔️・LIEUTENANT** — Moderation',
                            '',
                            '-# Only Staff roles grant moderation authority.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        'Ⅹ・THE TEN SINS',

                    value:
                        [
                            '**♛ Pride**　**🩸 Wrath**',
                            '**🐍 Envy**　**💰 Greed**',
                            '**🖤 Lust**　**🍷 Gluttony**',
                            '**💤 Sloth**　**☠️ Ruin**',
                            '**⛧ Heresy**　**⚔️ Vengeance**',
                            '',
                            'The Ten are earned through rank competition.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        'Ø・SIN OF DOMINION',

                    value:
                        [
                            '**The throne above the Ten.**',
                            '',
                            'A singular position of supreme standing within the hierarchy.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '◆・PROGRESSION',

                    value:
                        [
                            '**🕯️・SIN HEIR**',
                            '**⚔️・SINBOUND**',
                            '**🗡️・ASCENDANT**',
                            '**◇・UNRANKED**',
                            '**⛓️・OATHBOUND**',
                            '**♜・WARLORD**',
                            '**🐺・REAVER**',
                            '**⚔️・VANGUARD**',
                            '**🛡️・LEGIONARY**',
                            '**◆・INITIATE**',
                            '',
                            '-# Progression reflects activity and advancement.'
                        ].join('\n'),

                    inline:
                        false
                },

                {
                    name:
                        '✦・VERIFICATION',

                    value:
                        [
                            '**✦・SWORN** — Verified',
                            '**◇・UNSWORN** — Awaiting verification'
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
                    'TTS • Role Hierarchy',

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
        `Ⅹ Role hierarchy published in #${channel.name} by ${interaction.user.tag}.`
    );
}

module.exports = {
    ROLE_EMBED_COLOR,
    publishRoleInformation
};