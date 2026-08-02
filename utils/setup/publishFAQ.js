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
async function getFAQChannel(
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
        informationChannel.permissionsFor(
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

    return informationChannel;
}

/**
 * Publish the official
 * Knowledge Archive of Las Noches.
 */
async function publishFAQ(
    interaction
) {
    const informationChannel =
        await getFAQChannel(
            interaction
        );

    if (!informationChannel) {
        return;
    }

    const faqEmbed =
        createEmbed({
            title:
                '📚 Knowledge Archive of Las Noches',

            description:
                [
                    '## Answers preserved by Umbra.',
                    '',
                    'Before opening a support ticket, consult this archive.',
                    '',
                    'Most questions asked by new Souls have already been answered here.'
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
                        '╭・⛩️ HOW DO I ENTER LAS NOCHES?',

                    value:
                        [
                            'Complete the verification process through **Bloxlink**.',
                            '',
                            'After verification Umbra will automatically grant the correct access roles.',
                            '',
                            'If verification fails, use the Ticket System.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・🔒 WHY ARE CHANNELS LOCKED?',

                    value:
                        [
                            'The most common reason is incomplete verification.',
                            '',
                            'Confirm that:',
                            '',
                            '• Your Roblox account is connected.',
                            '• Verification completed successfully.',
                            '• The Verified role has been assigned.',
                            '',
                            'If everything appears correct, contact the staff through a ticket.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・📜 WHERE ARE THE ROYAL LAWS?',

                    value:
                        [
                            'The Royal Laws are available inside the Information Archive.',
                            '',
                            'Every Soul is expected to read them before participating in the kingdom.',
                            '',
                            'Remaining in Las Noches means accepting those laws.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・📢 WHERE ARE KINGDOM DECREES POSTED?',

                    value:
                        [
                            'Official announcements are published inside the Kingdom Decrees channel.',
                            '',
                            'There you will find:',
                            '',
                            '• Updates',
                            '• Events',
                            '• Rule changes',
                            '• Community news',
                            '• Important notices'
                        ].join('\n'),

                    inline:
                        false
                },                {
                    name:
                        '├・🎫 HOW DO I CONTACT STAFF?',

                    value:
                        [
                            'Use Umbra’s private Ticket System whenever assistance is needed.',
                            '',
                            'Tickets may be opened for:',
                            '',
                            '• Member reports',
                            '• Moderation appeals',
                            '• Verification problems',
                            '• Server issues',
                            '• Private questions',
                            '• Evidence that should not be shared publicly',
                            '',
                            '-# Avoid repeatedly mentioning staff members in public channels.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・⏳ HOW LONG DOES SUPPORT TAKE?',

                    value:
                        [
                            'Response time depends on staff availability.',
                            '',
                            'After creating a ticket:',
                            '',
                            '• Explain the situation clearly.',
                            '• Include all important details.',
                            '• Attach screenshots or evidence when needed.',
                            '• Wait patiently for a response.',
                            '',
                            'Repeated mentions or unnecessary messages may slow the process.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・🛡️ CAN I APPEAL A PUNISHMENT?',

                    value:
                        [
                            'Warnings, timeouts, kicks, and bans may be appealed through the Ticket System.',
                            '',
                            'Your appeal should include:',
                            '',
                            '• Your Discord username',
                            '• The punishment received',
                            '• The reason provided',
                            '• A clear explanation',
                            '• Relevant evidence',
                            '',
                            '-# Submitting an appeal does not guarantee removal of the punishment.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・🤖 WHAT IS UMBRA?',

                    value:
                        [
                            'Umbra is the **Guardian of Las Noches**.',
                            '',
                            'Umbra manages:',
                            '',
                            '• Guardian AutoMod',
                            '• Warning and Raid Systems',
                            '• Tickets and verification guidance',
                            '• Welcome messages',
                            '• Levels and Spiritual Power',
                            '• Soul Records',
                            '• Arrancar Ranks',
                            '• Chronicle Titles',
                            '• Achievements',
                            '• Events and Giveaways',
                            '• Interactive Leaderboards',
                            '',
                            'Umbra responds through commands and interactions rather than normal conversation.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・⚠️ WHY DID UMBRA DELETE MY MESSAGE?',

                    value:
                        [
                            'Umbra’s Guardian system may remove messages that violate kingdom protections.',
                            '',
                            'This may include:',
                            '',
                            '• Prohibited language',
                            '• Spam',
                            '• Unauthorized Discord invites',
                            '• Repeated disruptive messages',
                            '• Attempts to bypass filters',
                            '',
                            'Repeated violations may result in warnings or temporary timeouts.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・⚔️ ARE SCRIPTS OR EXPLOITS ALLOWED?',

                    value:
                        [
                            '**No.**',
                            '',
                            'Scripts, exploits, cheats, unfair tools, and prohibited advantages are forbidden.',
                            '',
                            'Using or distributing them may result in immediate moderation or permanent exile from Las Noches.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・🏆 HOW DO I GROW STRONGER?',

                    value:
                        [
                            'Progression is earned through activity and participation.',
                            '',
                            'Your Soul may gain:',
                            '',
                            '• Levels',
                            '• Spiritual Power',
                            '• Chronicle Titles',
                            '• Achievements',
                            '• Progression Roles',
                            '• Arrancar Ranks',
                            '',
                            'Staff roles are not granted simply because someone requests them.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '├・👤 IS ADVERTISING ALLOWED?',

                    value:
                        [
                            'Advertising requires permission from Las Noches leadership.',
                            '',
                            'This includes:',
                            '',
                            '• Discord server invites',
                            '• Recruitment advertisements',
                            '• Unapproved communities',
                            '• Repeated promotional links',
                            '• Advertising through direct messages',
                            '',
                            'Unauthorized advertising may result in moderation.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '╰・🌙 WHAT IF MY QUESTION IS NOT HERE?',

                    value:
                        [
                            'Use the appropriate community channel for general questions.',
                            '',
                            'For private, serious, technical, or moderation-related matters, open a support ticket.',
                            '',
                            '> **Knowledge strengthens every Soul and preserves the eternal kingdom.**'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        });

    faqEmbed.setAuthor({
        name:
            'Umbra • Guardian of Las Noches',

        iconURL:
            interaction.client.user.displayAvatarURL({
                size: 256,
                forceStatic: false
            })
    });

    faqEmbed.setFooter({
        text:
            'Las Noches • Knowledge Archive',

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

    faqEmbed.setTimestamp();

    await informationChannel.send({
        embeds: [
            faqEmbed
        ],

        allowedMentions: {
            parse: []
        }
    });

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ Knowledge Archive Published',
                `Umbra successfully published the Las Noches Knowledge Archive in ${informationChannel}.`
            )
        ],

        components: []
    });

    console.log(
        '======================================'
    );

    console.log(
        '📚 Las Noches Knowledge Archive Published'
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
    publishFAQ
};