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
async function getRoleInformationChannel(
    interaction
) {
    const informationChannel =
        await interaction.guild.channels
            .fetch(
                setupChannels
                    .informationChannelId
            )
            .catch(
                () => null
            );

    if (
        !informationChannel ||
        !informationChannel.isTextBased()
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
                    '❌ Bot Unavailable',
                    'The bot could not access its server member record.'
                )
            ],

            components:
                []
        });

        return null;
    }

    const channelPermissions =
        informationChannel.permissionsFor(
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
                    '❌ Missing Permissions',
                    [
                        `Cannot publish role information in ${informationChannel}.`,
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

    return informationChannel;
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
    const informationChannel =
        await getRoleInformationChannel(
            interaction
        );

    if (!informationChannel) {
        return;
    }

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
                        '♛・STAFF',

                    value:
                        [
                            '**♛・SOVEREIGN**',
                            'Highest server authority.',
                            '',
                            '**⚜️・HEAD CAPTAIN**',
                            'Senior leadership.',
                            '',
                            '**🛡️・CAPTAIN**',
                            'Administration and server management.',
                            '',
                            '**⚔️・LIEUTENANT**',
                            'Moderation and member support.',
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
                            '**Beyond the Ten.**',
                            '',
                            'Dominion stands outside the standard Sin ranking.',
                            '',
                            '-# The Ten are ranked. Dominion is not.'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        });    roleEmbed.addFields(
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
                    '-# Progression reflects activity and advancement, not Staff authority.'
                ].join('\n'),

            inline:
                false
        },

        {
            name:
                '✦・VERIFICATION',

            value:
                [
                    '**✦・SWORN**',
                    'Verified member.',
                    '',
                    '**◇・UNSWORN**',
                    'Awaiting verification.'
                ].join('\n'),

            inline:
                false
        }
    );

    roleEmbed.setAuthor({
        name:
            'THE Ⅹ SINS',

        iconURL:
            interaction.client.user
                .displayAvatarURL({
                    size:
                        256,

                    forceStatic:
                        false
                })
    });

    roleEmbed.setFooter({
        text:
            'TTS • Role Hierarchy',

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

    roleEmbed.setTimestamp();

    await informationChannel.send({
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
                `Role information was published in ${informationChannel}.`
            )
        ],

        components:
            []
    });

    console.log(
        '======================================'
    );

    console.log(
        'Ⅹ Role Information Published'
    );

    console.log(
        `📍 Channel: ${informationChannel.name}`
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
    publishRoleInformation
};