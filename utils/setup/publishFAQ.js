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
async function getFAQChannel(
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
 * Publish the Crimson Eclipse FAQ.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
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
                '❓ Crimson Eclipse FAQ',

            description:
                [
                    'Below are answers to frequently asked questions about Crimson Eclipse.',
                    '',
                    'Read this section before opening a support ticket, as your question may already be answered here.'
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
                        '⛩️ How do I verify?',

                    value:
                        [
                            'Go to the verification channel and follow the instructions shown there.',
                            '',
                            'Verification may require you to:',
                            '',
                            '• Connect your Roblox account',
                            '• Complete the provided verification steps',
                            '• Wait for the correct server role',
                            '',
                            'After successful verification, you should gain access to the main community channels.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🔒 Why can I not see the server channels?',

                    value:
                        [
                            'The most common reason is incomplete verification.',
                            '',
                            'Make sure that:',
                            '',
                            '• Your Roblox account is connected correctly',
                            '• You completed every verification step',
                            '• The Verified role was assigned',
                            '',
                            'If you are verified but still cannot access channels, create a support ticket.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '📜 Where can I read the server rules?',

                    value:
                        [
                            'The official rules are published in this Information channel.',
                            '',
                            'Read all Sacred Laws before participating in the community.',
                            '',
                            'By remaining in Crimson Eclipse, you agree to follow the server rules and Discord’s Terms of Service.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '📢 Where are official announcements posted?',

                    value:
                        [
                            'Official announcements are posted in the Decrees channel.',
                            '',
                            'Decrees may include:',
                            '',
                            '• Server updates',
                            '• Event announcements',
                            '• Rule changes',
                            '• Staff updates',
                            '• Important community information',
                            '',
                            'Members should check the Decrees channel regularly.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🎫 How do I contact the staff team?',

                    value:
                        [
                            'Use Umbra’s Ticket System when you need private assistance.',
                            '',
                            'Tickets should be used for:',
                            '',
                            '• Member reports',
                            '• Moderation appeals',
                            '• Server problems',
                            '• Verification problems',
                            '• Private questions',
                            '• Evidence that should not be shared publicly',
                            '',
                            'Do not repeatedly mention staff members in public channels.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '⏳ How long does ticket support take?',

                    value:
                        [
                            'Response times depend on staff availability.',
                            '',
                            'After creating a ticket:',
                            '',
                            '• Explain your issue clearly',
                            '• Include all important details',
                            '• Add screenshots or evidence when necessary',
                            '• Wait patiently for a Shadow Warden',
                            '',
                            'Repeated mentions or unnecessary messages may delay the process.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🛡️ Can I appeal a warning, timeout, kick, or ban?',

                    value:
                        [
                            'Yes, moderation actions may be appealed through the Ticket System.',
                            '',
                            'Your appeal should include:',
                            '',
                            '• Your Discord username',
                            '• The moderation action received',
                            '• The reason provided by staff',
                            '• A clear explanation of why you believe it should be reviewed',
                            '• Relevant evidence',
                            '',
                            'Submitting an appeal does not guarantee that the punishment will be removed.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🤖 What is Umbra?',

                    value:
                        [
                            'Umbra is the Guardian of Crimson Eclipse.',
                            '',
                            'Umbra manages systems such as:',
                            '',
                            '• Welcome messages',
                            '• Verification guidance',
                            '• Server information',
                            '• Moderation commands',
                            '• Guardian AutoMod',
                            '• Ticket support',
                            '• Member records',
                            '• Setup publications',
                            '',
                            'Umbra is a bot and cannot answer normal chat messages unless a command or interaction is used.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '⚠️ Why did Umbra delete my message?',

                    value:
                        [
                            'Umbra’s Guardian system may remove messages that violate server protections.',
                            '',
                            'This may include:',
                            '',
                            '• Offensive or prohibited language',
                            '• Spam',
                            '• Unauthorized Discord invites',
                            '• Repeated disruptive messages',
                            '• Attempts to bypass word filters',
                            '',
                            'Repeated violations may result in warnings or temporary timeouts.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🎮 Is scripting or exploiting allowed?',

                    value:
                        [
                            'No.',
                            '',
                            'Scripts, exploits, cheats, unfair tools, and other prohibited advantages are not allowed.',
                            '',
                            'Members caught using or distributing these tools may receive moderation action without exceptions.',
                            '',
                            'Play fairly and protect the community.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🎖️ How do I receive a higher role?',

                    value:
                        [
                            'Some roles are earned through activity, events, achievements, or contributions.',
                            '',
                            'Staff roles are not granted simply because someone asks for them.',
                            '',
                            'Members considered for staff must demonstrate:',
                            '',
                            '• Maturity',
                            '• Loyalty',
                            '• Fair judgment',
                            '• Consistent activity',
                            '• Respect for the community',
                            '',
                            'Do not repeatedly ask for promotions or staff permissions.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '👤 Can I advertise another server or community?',

                    value:
                        [
                            'Advertising is not allowed unless permission was given by Crimson Eclipse leadership.',
                            '',
                            'This includes:',
                            '',
                            '• Discord server invites',
                            '• Unapproved communities',
                            '• Recruitment advertisements',
                            '• Repeated promotional links',
                            '• Advertising through direct messages',
                            '',
                            'Unauthorized advertising may result in moderation action.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🌙 What should I do if my question is not listed?',

                    value:
                        [
                            'If your question is not answered here, use the appropriate community channel or open a support ticket.',
                            '',
                            'For private, serious, or moderation-related matters, always use the Ticket System.',
                            '',
                            '*Knowledge strengthens every Soul beneath the crimson moon.*'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        });

    faqEmbed.setAuthor({
        name:
            'Umbra • Guardian of Crimson Eclipse',

        iconURL:
            interaction.client.user.displayAvatarURL({
                size: 256,
                forceStatic: false
            })
    });

    faqEmbed.setFooter({
        text:
            '🌑 Crimson Eclipse • Frequently Asked Questions',

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
        embeds:
            [faqEmbed],

        allowedMentions: {
            parse: []
        }
    });

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ FAQ Published',
                `Umbra successfully published the FAQ in ${informationChannel}.`
            )
        ],

        components: []
    });

    console.log(
        '======================================'
    );

    console.log(
        '❓ FAQ Published Through Setup Wizard'
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
    publishFAQ
};