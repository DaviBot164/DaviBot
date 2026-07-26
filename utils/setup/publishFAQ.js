const {
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed
} = require('../embeds');

const FAQ_CHANNEL_ID =
    '1530998080688885763';

/**
 * Get and validate the FAQ channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<import('discord.js').TextBasedChannel|null>}
 */
async function getFAQChannel(
    interaction
) {
    const faqChannel =
        await interaction.guild.channels.fetch(
            FAQ_CHANNEL_ID
        );

    if (
        !faqChannel ||
        !faqChannel.isTextBased()
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    '❌ FAQ Channel Missing',
                    'Umbra could not find the configured FAQ channel.'
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
        faqChannel.permissionsFor(
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
                    'Umbra requires **View Channel**, **Send Messages**, and **Embed Links** permissions in the FAQ channel.'
                )
            ],

            components: []
        });

        return null;
    }

    return faqChannel;
}

/**
 * Publish the Crimson Eclipse FAQ archive.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishFAQ(
    interaction
) {
    const faqChannel =
        await getFAQChannel(
            interaction
        );

    if (!faqChannel) {
        return;
    }

    const publishedAt =
        Math.floor(
            Date.now() / 1000
        );

    const faqEmbed =
        createEmbed({
            title:
                '❓ Crimson Eclipse FAQ',

            description:
                [
                    'Umbra has opened the official Archive of Answers.',
                    '',
                    'This guide contains answers to the most common questions asked by Souls within Crimson Eclipse.',
                    '',
                    '*Read the archive before opening a support ticket.*'
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
                        '⛩️ How Do I Verify?',

                    value:
                        [
                            'Go to the verification channel and follow the instructions provided there.',
                            '',
                            'Verification is used to:',
                            '',
                            '• Confirm your Roblox identity',
                            '• Prevent impersonation',
                            '• Unlock the main community channels',
                            '• Receive the appropriate member role',
                            '',
                            'If verification fails, wait a moment and try again before contacting staff.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '📜 Where Can I Read the Rules?',

                    value:
                        [
                            'The official server rules are published in:',
                            '',
                            '**📜・sacred-laws**',
                            '',
                            'Remaining in Crimson Eclipse means that you agree to follow those rules.',
                            '',
                            'Serious violations may result in immediate moderation action.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🎫 How Do I Contact Staff?',

                    value:
                        [
                            'Read the Ticket Guide first, then go to:',
                            '',
                            '**🎫・create-ticket**',
                            '',
                            'Press the **Open Ticket** button to create a private support channel.',
                            '',
                            'Use tickets for reports, appeals, private evidence, or genuine staff assistance.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '⚔️ Is Scripting or Exploiting Allowed?',

                    value:
                        [
                            '**No.**',
                            '',
                            'Crimson Eclipse does not allow:',
                            '',
                            '• Scripts',
                            '• Exploits',
                            '• Cheats',
                            '• Unauthorized third-party tools',
                            '• Abusing glitches against other players',
                            '',
                            'Confirmed scripting or exploiting may result in a permanent ban without exceptions.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🛡️ What Do Shadow Wardens Do?',

                    value:
                        [
                            'Shadow Wardens are the moderation and support staff of Crimson Eclipse.',
                            '',
                            'They are responsible for:',
                            '',
                            '• Enforcing the Sacred Laws',
                            '• Reviewing reports',
                            '• Handling tickets',
                            '• Investigating evidence',
                            '• Applying fair moderation actions',
                            '• Protecting the community'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '👑 How Do Promotions Work?',

                    value:
                        [
                            'Authority must be earned through consistent behavior.',
                            '',
                            'Promotions may consider:',
                            '',
                            '• Trust',
                            '• Activity',
                            '• Maturity',
                            '• Respect',
                            '• Contribution',
                            '• Knowledge of the Sacred Laws',
                            '',
                            '**Repeatedly asking for a staff role will not guarantee promotion.**'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '⚠️ How Can I Appeal a Punishment?',

                    value:
                        [
                            'Create a ticket and explain the situation calmly.',
                            '',
                            'A useful appeal should include:',
                            '',
                            '• Your username',
                            '• The punishment received',
                            '• The reason shown',
                            '• Why you believe it should be reviewed',
                            '• Relevant evidence',
                            '',
                            'Do not create public arguments about moderation decisions.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '📢 Where Are Official Updates Posted?',

                    value:
                        [
                            'Official announcements are published in:',
                            '',
                            '**📢・decrees**',
                            '',
                            'This includes:',
                            '',
                            '• Server updates',
                            '• Events',
                            '• Maintenance notices',
                            '• Important warnings',
                            '• Community changes'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🎮 What Can I Do in the Community?',

                    value:
                        [
                            'Verified members can participate in the public areas of Crimson Eclipse.',
                            '',
                            'Depending on the available channels, members may:',
                            '',
                            '• Join general conversations',
                            '• Find teammates',
                            '• Discuss games',
                            '• Share music',
                            '• Post images or clips',
                            '• Join voice channels',
                            '• Participate in events'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🤖 What Is Umbra?',

                    value:
                        [
                            'Umbra is the official Guardian of Crimson Eclipse.',
                            '',
                            'Umbra helps the Order by:',
                            '',
                            '• Welcoming new members',
                            '• Managing support tickets',
                            '• Publishing official information',
                            '• Recording warnings and cases',
                            '• Protecting channels through Guardian systems',
                            '• Assisting the Shadow Wardens'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🌑 Still Need Help?',

                    value:
                        [
                            'If your question is not answered here:',
                            '',
                            '1. Review the Server Guide.',
                            '2. Read the Sacred Laws.',
                            '3. Read the Ticket Guide.',
                            '4. Create a support ticket if private assistance is still needed.',
                            '',
                            `**Archive updated:** <t:${publishedAt}:F>`,
                            `-# <t:${publishedAt}:R>`,
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
            '🌑 Crimson Eclipse • Archive of Answers',

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

    await faqChannel.send({
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
                `Umbra successfully published the FAQ archive in ${faqChannel}.`
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
        `📍 Channel: ${faqChannel.name}`
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