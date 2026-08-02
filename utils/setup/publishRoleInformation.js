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
                    '❌ Kingdom Archive Missing',
                    'Umbra could not find the configured Las Noches Information channel.'
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
                    '❌ Umbra Unavailable',
                    'Umbra could not access its Las Noches member record.'
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
                    '❌ Missing Umbra Permissions',
                    [
                        `Umbra cannot publish the Kingdom Hierarchy in ${informationChannel}.`,
                        '',
                        'Required permissions:',
                        '• **View Channel**',
                        '• **Send Messages**',
                        '• **Embed Links**'
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
 * Las Noches Kingdom Hierarchy.
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
                '👑 Hierarchy of Las Noches',

            description:
                [
                    '## Every Soul has a place within the kingdom.',
                    '',
                    'The hierarchy of **Las Noches** represents leadership, authority, progression, recognition, and responsibility.',
                    '',
                    'Read the records below to understand how each rank serves the eternal kingdom.'
                ].join('\n'),

            color:
                '#6F42C1',

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
                        '╭・👑 ROYAL AUTHORITY',

                    value:
                        [
                            '**Ruler of Las Noches**',
                            '',
                            'The highest authority within the kingdom.',
                            '',
                            'The Ruler is responsible for:',
                            '',
                            '• Directing the future of Las Noches',
                            '• Approving major kingdom changes',
                            '• Managing senior leadership',
                            '• Resolving final disputes',
                            '• Protecting the stability of the community',
                            '',
                            '> The throne carries both absolute authority and absolute responsibility.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・⚜️ MILITARY COMMAND',

                    value:
                        [
                            '**Head Captain**',
                            'The highest senior administrator beneath the Ruler.',
                            '',
                            '**Captains**',
                            'Trusted leaders responsible for management, protection, and major decisions.',
                            '',
                            '**Lieutenants**',
                            'Moderators and support officers who enforce the Royal Laws and assist members.',
                            '',
                            'Command roles may be responsible for:',
                            '',
                            '• Moderation and investigations',
                            '• Ticket support',
                            '• Staff supervision',
                            '• Event organization',
                            '• Server maintenance',
                            '• Community protection'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・⚔️ ARRANCAR HIERARCHY',

                    value:
                        [
                            '**👑 Espada**',
                            'The elite Arrancar who hold the highest combat ranks within Las Noches.',
                            '',
                            '**🌘 Privaron Espada**',
                            'Former Espada who retain distinguished status and power.',
                            '',
                            '**⚔️ Fracción**',
                            'Trusted Arrancar who serve and support higher-ranked warriors.',
                            '',
                            '**🦴 Numeros**',
                            'Ranked Arrancar who form the broader military body of Las Noches.',
                            '',
                            '**⚪ Unranked Arrancar**',
                            'Members who have not yet earned an official Arrancar rank.',
                            '',
                            '-# Arrancar rank does not automatically grant staff or moderation authority.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・🌙 KINGDOM SOULS',

                    value:
                        [
                            'Verified members of Las Noches are recognized as **Souls**.',
                            '',
                            'Souls may:',
                            '',
                            '• Access community channels',
                            '• Participate in conversations',
                            '• Join events and giveaways',
                            '• Build Spiritual Power',
                            '• Earn Chronicle Titles',
                            '• Unlock Achievements',
                            '• Rise through the Arrancar hierarchy',
                            '',
                            'Every Soul is expected to respect the Royal Laws and the other members of the kingdom.'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        });            roleEmbed.addFields(
                {
                    name:
                        '├・🏆 PROGRESSION SYSTEM',

                    value:
                        [
                            'Las Noches rewards active Souls through Umbra\'s progression systems.',
                            '',
                            '⭐ **Levels**',
                            'Earn experience through activity.',
                            '',
                            '✨ **Spiritual Power**',
                            'Increase your strength as you level up.',
                            '',
                            '📜 **Chronicle Titles**',
                            'Unlock unique titles that represent your journey.',
                            '',
                            '🏆 **Achievements**',
                            'Complete milestones and collect permanent records.',
                            '',
                            '👤 **Soul Record**',
                            'Umbra permanently records your progression.',
                            '',
                            '> Your activity shapes your legacy.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・📖 CHRONICLE RECORDS',

                    value:
                        [
                            'Umbra maintains an official archive for every Soul.',
                            '',
                            'Your records include:',
                            '',
                            '• Level',
                            '• Spiritual Power',
                            '• Messages',
                            '• Achievements',
                            '• Chronicle Titles',
                            '• Arrancar Rank',
                            '• Soul Profile',
                            '',
                            'These records continue to grow as you remain active inside Las Noches.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・🤖 UMBRA SYSTEMS',

                    value:
                        [
                            'Umbra protects and manages the kingdom through multiple systems.',
                            '',
                            '• Guardian AutoMod',
                            '• Warning System',
                            '• Raid Protection',
                            '• Ticket System',
                            '• Welcome System',
                            '• Verification Guide',
                            '• Level System',
                            '• Soul Records',
                            '• Arrancar Rank System',
                            '• Chronicle Titles',
                            '• Achievement System',
                            '• Interactive Leaderboards',
                            '• Events',
                            '• Giveaways',
                            '',
                            '> Every major system inside Las Noches is maintained by Umbra.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・⚖️ AUTHORITY & RESPONSIBILITY',

                    value:
                        [
                            'A decorative or progression role does **not** grant moderation authority.',
                            '',
                            'Only authorized leadership may:',
                            '',
                            '• Moderate members',
                            '• Review private reports',
                            '• Manage staff systems',
                            '• Make official decisions',
                            '',
                            'Impersonating staff or falsely claiming authority may result in moderation.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '╰・🌙 FINAL RECORD',

                    value:
                        [
                            'Every rank exists to strengthen the kingdom.',
                            '',
                            'Leadership exists to serve.',
                            'Members exist to grow.',
                            'Umbra exists to protect.',
                            '',
                            '> **Power is earned. Respect is remembered. Legacy is eternal.**'
                        ].join('\n'),

                    inline:
                        false
                }
            );

    roleEmbed.setAuthor({
        name:
            'Umbra • Guardian of Las Noches',

        iconURL:
            interaction.client.user.displayAvatarURL({
                size: 256,
                forceStatic: false
            })
    });

    roleEmbed.setFooter({
        text:
            'Las Noches • Kingdom Hierarchy',

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
        embeds: [
            roleEmbed
        ],

        allowedMentions: {
            parse: []
        }
    });

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ Kingdom Hierarchy Published',
                `Umbra successfully published the Kingdom Hierarchy in ${informationChannel}.`
            )
        ],

        components: []
    });

    console.log(
        '======================================'
    );

    console.log(
        '👑 Kingdom Hierarchy Published'
    );

    console.log(
        `📍 Channel: ${informationChannel.name}`
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
    publishRoleInformation
};