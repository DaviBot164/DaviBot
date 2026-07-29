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
async function getRoleInformationChannel(
    interaction
) {
    const informationChannel =
        await interaction.guild.channels.fetch(
            setupChannels
                .informationChannelId
        );

    if (
        !informationChannel ||
        !informationChannel.isTextBased()
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
                    '❌ Missing Umbra Permissions',
                    'Umbra requires **View Channel**, **Send Messages**, and **Embed Links** permissions in the Information channel.'
                )
            ],

            components: []
        });

        return null;
    }

    return informationChannel;
}

/**
 * Publish Crimson Eclipse role information.
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
                '🎖️ Ranks of Crimson Eclipse',

            description:
                [
                    'Every rank within Crimson Eclipse has its own purpose and responsibility.',
                    '',
                    'Roles may represent leadership, moderation authority, community progress, special recognition, or system access.',
                    '',
                    'Read the information below to understand the structure of the Order.'
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
                        '👑 Crimson Lord',

                    value:
                        [
                            'The highest authority within Crimson Eclipse.',
                            '',
                            'The Crimson Lord is responsible for:',
                            '',
                            '• Leading the Order',
                            '• Making final server decisions',
                            '• Managing senior leadership',
                            '• Approving major changes',
                            '• Protecting the future of the community',
                            '',
                            'Decisions made by the Crimson Lord must be respected unless they violate Discord rules or community safety.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '⚜️ Eclipse Keepers',

                    value:
                        [
                            'Senior administrators trusted with the management of Crimson Eclipse.',
                            '',
                            'Eclipse Keepers may:',
                            '',
                            '• Manage server systems',
                            '• Oversee Shadow Wardens',
                            '• Review serious reports',
                            '• Organize server changes',
                            '• Assist the Crimson Lord',
                            '• Handle important community decisions',
                            '',
                            'This rank carries significant authority and responsibility.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🛡️ Shadow Wardens',

                    value:
                        [
                            'The moderation and support team of Crimson Eclipse.',
                            '',
                            'Shadow Wardens are responsible for:',
                            '',
                            '• Enforcing the Sacred Laws',
                            '• Responding to tickets',
                            '• Reviewing member reports',
                            '• Managing disruptive behavior',
                            '• Protecting community channels',
                            '• Helping new members',
                            '',
                            'Shadow Wardens must use their permissions fairly and provide clear reasons for moderation actions.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🌑 Souls',

                    value:
                        [
                            'Verified members of the Crimson Eclipse community.',
                            '',
                            'Souls may:',
                            '',
                            '• Access community channels',
                            '• Participate in conversations',
                            '• Join gaming activities',
                            '• Share images and clips',
                            '• Attend community events',
                            '• Earn progression roles',
                            '',
                            'Every Soul is expected to respect the Sacred Laws and other members.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🎖️ Progression Roles',

                    value:
                        [
                            'Progression roles represent activity and growth within Crimson Eclipse.',
                            '',
                            'They may be earned through:',
                            '',
                            '• Community activity',
                            '• Umbra’s Level System',
                            '• Event participation',
                            '• Special achievements',
                            '• Contributions to the Order',
                            '',
                            'Progression roles do not automatically grant moderation authority.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🏆 Special Recognition Roles',

                    value:
                        [
                            'Some roles may be granted as special recognition.',
                            '',
                            'These roles may represent:',
                            '',
                            '• Event victories',
                            '• Community contributions',
                            '• Trusted membership',
                            '• Partnerships',
                            '• Support for the server',
                            '• Limited-time achievements',
                            '',
                            'Special roles may be changed, retired, or replaced as the server develops.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🤖 Umbra',

                    value:
                        [
                            'Umbra is the Guardian of Crimson Eclipse.',
                            '',
                            'Umbra manages several server systems, including:',
                            '',
                            '• Welcome messages',
                            '• Verification guidance',
                            '• Setup publications',
                            '• Moderation commands',
                            '• Guardian AutoMod',
                            '• Ticket support',
                            '• Level progression',
                            '• Server records',
                            '',
                            'Umbra is a system role and should remain above every role that the bot must manage.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '⚠️ Role Authority',

                    value:
                        [
                            'A decorative or progression role does not grant staff authority.',
                            '',
                            'Only authorized leadership and moderation roles may:',
                            '',
                            '• Punish members',
                            '• Manage server channels',
                            '• Review private reports',
                            '• Speak officially for the Order',
                            '• Use restricted staff systems',
                            '',
                            'Impersonating staff or falsely claiming authority may result in moderation action.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🌙 Respect the Order',

                    value:
                        [
                            'Every rank exists to support the community.',
                            '',
                            'Higher roles must not misuse their power, and members must not harass staff for performing legitimate duties.',
                            '',
                            'Concerns about staff behavior should be reported privately through the Ticket System.',
                            '',
                            '*Strength earns recognition. Loyalty preserves the Order.*'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        });

    roleEmbed.setAuthor({
        name:
            'Umbra • Guardian of Crimson Eclipse',

        iconURL:
            interaction.client.user.displayAvatarURL({
                size: 256,
                forceStatic: false
            })
    });

    roleEmbed.setFooter({
        text:
            '🌑 Crimson Eclipse • Role Information',

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

    roleEmbed.setTimestamp();

    await informationChannel.send({
        embeds:
            [roleEmbed],

        allowedMentions: {
            parse: []
        }
    });

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ Role Information Published',
                `Umbra successfully published the Role Information in ${informationChannel}.`
            )
        ],

        components: []
    });

    console.log(
        '======================================'
    );

    console.log(
        '🎖️ Role Information Published Through Setup Wizard'
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