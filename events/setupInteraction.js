const {
    Events,
    MessageFlags,
    PermissionFlagsBits
} = require('discord.js');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed,
    createWarningEmbed
} = require('../utils/embeds');

const SACRED_LAWS_CHANNEL_ID =
    '1528401946363433180';

const SERVER_GUIDE_CHANNEL_ID =
    '1530978474637135963';

/**
 * Safely send an ephemeral setup error.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @param {string} title
 * @param {string} description
 * @returns {Promise<void>}
 */
async function sendSetupError(
    interaction,
    title,
    description
) {
    const errorEmbed =
        createErrorEmbed(
            title,
            description
        );

    if (interaction.deferred) {
        await interaction.editReply({
            embeds: [errorEmbed],
            components: []
        });

        return;
    }

    if (interaction.replied) {
        await interaction.followUp({
            flags:
                MessageFlags.Ephemeral,

            embeds:
                [errorEmbed]
        });

        return;
    }

    await interaction.reply({
        flags:
            MessageFlags.Ephemeral,

        embeds:
            [errorEmbed]
    });
}

/**
 * Get and validate a configured text channel.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @param {string} channelId
 * @param {string} channelName
 * @returns {Promise<import('discord.js').TextChannel|null>}
 */
async function getSetupChannel(
    interaction,
    channelId,
    channelName
) {
    const channel =
        await interaction.guild.channels.fetch(
            channelId
        );

    if (
        !channel ||
        !channel.isTextBased()
    ) {
        await interaction.editReply({
            embeds: [
                createErrorEmbed(
                    `❌ ${channelName} Channel Missing`,
                    `Umbra could not find the configured ${channelName} channel.`
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
        channel.permissionsFor(
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
                    `Umbra requires **View Channel**, **Send Messages**, and **Embed Links** permissions in the ${channelName} channel.`
                )
            ],

            components: []
        });

        return null;
    }

    return channel;
}

/**
 * Publish the Sacred Laws embed.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishSacredLaws(
    interaction
) {
    const rulesChannel =
        await getSetupChannel(
            interaction,
            SACRED_LAWS_CHANNEL_ID,
            'Sacred Laws'
        );

    if (!rulesChannel) {
        return;
    }

    const rulesEmbed =
        createEmbed({
            title:
                '📜 Sacred Laws of Crimson Eclipse',

            description:
                [
                    'Welcome to **Crimson Eclipse**.',
                    '',
                    'Before beginning your journey, every **Soul** must respect the laws of the Order.',
                    '',
                    'These laws exist to protect the community beneath the crimson moon.'
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
                        '⚖️ I — Respect the Order',

                    value:
                        [
                            'Treat every Soul with respect.',
                            '',
                            '• No harassment or bullying',
                            '• No hate speech or discrimination',
                            '• No personal attacks',
                            '• No excessive toxicity',
                            '• No attempts to provoke unnecessary conflict'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '⚔️ II — Fair Play',

                    value:
                        [
                            'All members must play fairly.',
                            '',
                            '• No exploiting',
                            '• No cheating',
                            '• No scripting',
                            '• No unauthorized third-party tools',
                            '• No abusing glitches against other players',
                            '',
                            '**Anyone caught scripting or exploiting may be permanently banned without exceptions.**'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '💬 III — Chat Conduct',

                    value:
                        [
                            'Keep all conversations appropriate and readable.',
                            '',
                            '• No spam or message flooding',
                            '• No NSFW or disturbing content',
                            '• No scam, phishing, or malicious links',
                            '• No unauthorized advertising',
                            '• No excessive mentions',
                            '• Use each channel for its intended purpose'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🛡️ IV — Staff Decisions',

                    value:
                        [
                            'Respect the decisions made by the **Shadow Wardens**.',
                            '',
                            '• Do not insult or harass staff',
                            '• Do not evade moderation actions',
                            '• Do not create public arguments about punishments',
                            '• Use the ticket system for questions or appeals',
                            '',
                            'Staff members are also required to follow these laws.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🎫 V — Ticket System',

                    value:
                        [
                            'Use Umbra’s ticket system only when support is genuinely needed.',
                            '',
                            '• Do not create fake tickets',
                            '• Do not troll the support team',
                            '• Explain the issue clearly',
                            '• Provide evidence when necessary',
                            '• Remain patient while waiting for a response'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🌑 VI — Protect the Community',

                    value:
                        [
                            'Help Crimson Eclipse remain welcoming and organized.',
                            '',
                            '• Support new members when possible',
                            '• Do not spread false accusations',
                            '• Do not expose private information',
                            '• Report serious violations to the Shadow Wardens',
                            '• Do not encourage others to break the rules'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '⚖️ Guardian Punishments',

                    value:
                        [
                            'Punishments depend on severity, evidence, and previous violations.',
                            '',
                            '⚠️ **Warning**',
                            '🔇 **Timeout**',
                            '👢 **Kick**',
                            '🔨 **Temporary or Permanent Ban**',
                            '',
                            'Severe violations may result in an immediate ban without earlier warnings.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '📖 Final Decree',

                    value:
                        [
                            'By remaining within Crimson Eclipse, every member agrees to follow these Sacred Laws.',
                            '',
                            '*Every Soul leaves a mark beneath the crimson moon.*'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        });

    rulesEmbed.setAuthor({
        name:
            'Umbra • Guardian of Crimson Eclipse',

        iconURL:
            interaction.client.user.displayAvatarURL({
                size: 256,
                forceStatic: false
            })
    });

    rulesEmbed.setFooter({
        text:
            '🌑 Crimson Eclipse • Sacred Laws',

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

    rulesEmbed.setTimestamp();

    await rulesChannel.send({
        embeds:
            [rulesEmbed],

        allowedMentions: {
            parse: []
        }
    });

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ Sacred Laws Published',
                `Umbra successfully published the Sacred Laws in ${rulesChannel}.`
            )
        ],

        components: []
    });

    console.log(
        '======================================'
    );

    console.log(
        '📜 Sacred Laws Published Through Setup Wizard'
    );

    console.log(
        `📍 Channel: ${rulesChannel.name}`
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

/**
 * Publish the Crimson Eclipse Server Guide.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @returns {Promise<void>}
 */
async function publishServerGuide(
    interaction
) {
    const guideChannel =
        await getSetupChannel(
            interaction,
            SERVER_GUIDE_CHANNEL_ID,
            'Server Guide'
        );

    if (!guideChannel) {
        return;
    }

    const guideEmbed =
        createEmbed({
            title:
                '📖 Journey Through Crimson Eclipse',

            description:
                [
                    `Welcome, ${interaction.user}.`,
                    '',
                    'Every Soul begins their journey beneath the crimson moon.',
                    '',
                    'Follow the steps below to unlock the Order and become part of the Crimson Eclipse community.'
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
                        '📜 Step I — Read the Sacred Laws',

                    value:
                        [
                            'Begin by reading the official laws of Crimson Eclipse.',
                            '',
                            'The Sacred Laws explain:',
                            '',
                            '• Community behavior',
                            '• Fair-play requirements',
                            '• Chat restrictions',
                            '• Staff authority',
                            '• Ticket expectations',
                            '• Guardian punishments',
                            '',
                            'Remaining in the server means that you agree to follow these laws.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '⛩️ Step II — Verify Your Account',

                    value:
                        [
                            'Visit the verification channel and connect your Roblox account.',
                            '',
                            'Verification helps the Order:',
                            '',
                            '• Confirm your Roblox identity',
                            '• Protect members from impersonation',
                            '• Assign the correct access roles',
                            '• Keep the community secure',
                            '',
                            'Complete verification before attempting to access the main community channels.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🌑 Step III — Enter the Gathering Hall',

                    value:
                        [
                            'After verification, introduce yourself and join the community.',
                            '',
                            'Use the main gathering channel for:',
                            '',
                            '• General conversations',
                            '• Meeting other members',
                            '• Discussing Project Slayers',
                            '• Sharing community ideas',
                            '• Finding people to play with',
                            '',
                            'Keep conversations respectful and follow the purpose of each channel.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🎮 Step IV — Explore the Community',

                    value:
                        [
                            'Crimson Eclipse contains several spaces for different activities.',
                            '',
                            '🎮 **Gaming** — Find teammates and discuss games',
                            '🎵 **Music** — Share songs and playlists',
                            '🖼️ **Gallery** — Share images, clips, and artwork',
                            '📢 **Decrees** — Read official announcements',
                            '📜 **Sacred Laws** — Review server rules',
                            '',
                            'More systems may become available as the Order grows.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🎫 Step V — Request Support',

                    value:
                        [
                            'If you experience a problem, use Umbra’s Ticket System.',
                            '',
                            'Create a ticket for:',
                            '',
                            '• Reporting a member',
                            '• Appealing a moderation action',
                            '• Reporting a server problem',
                            '• Requesting help from Shadow Wardens',
                            '• Providing private evidence',
                            '',
                            'Explain your issue clearly and remain patient while waiting for assistance.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🛡️ Step VI — Understand the Order',

                    value:
                        [
                            'Crimson Eclipse is protected and managed through several ranks.',
                            '',
                            '👑 **Crimson Lord** — Leader of the Order',
                            '⚜️ **Eclipse Keepers** — Senior administrators',
                            '🛡️ **Shadow Wardens** — Moderation and support staff',
                            '🌑 **Souls** — Members of the community',
                            '🤖 **Umbra** — Guardian of Crimson Eclipse',
                            '',
                            'Respect every rank and report misuse of authority through the proper support channels.'
                        ].join('\n'),

                    inline:
                        false
                },
                {
                    name:
                        '🌙 Step VII — Begin Your Journey',

                    value:
                        [
                            'You are now ready to become part of Crimson Eclipse.',
                            '',
                            '• Respect other Souls',
                            '• Play fairly',
                            '• Help new members',
                            '• Report serious violations',
                            '• Participate in the community',
                            '• Enjoy your journey',
                            '',
                            '*Every Soul leaves a mark beneath the crimson moon.*'
                        ].join('\n'),

                    inline:
                        false
                }
            ]
        });

    guideEmbed.setAuthor({
        name:
            'Umbra • Guardian of Crimson Eclipse',

        iconURL:
            interaction.client.user.displayAvatarURL({
                size: 256,
                forceStatic: false
            })
    });

    guideEmbed.setFooter({
        text:
            '🌑 Crimson Eclipse • Server Guide',

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

    guideEmbed.setTimestamp();

    await guideChannel.send({
        embeds:
            [guideEmbed],

        allowedMentions: {
            parse: []
        }
    });

    await interaction.editReply({
        embeds: [
            createSuccessEmbed(
                '✅ Server Guide Published',
                `Umbra successfully published the Server Guide in ${guideChannel}.`
            )
        ],

        components: []
    });

    console.log(
        '======================================'
    );

    console.log(
        '📖 Server Guide Published Through Setup Wizard'
    );

    console.log(
        `📍 Channel: ${guideChannel.name}`
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

/**
 * Show a temporary coming-soon response.
 *
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @param {string} emoji
 * @param {string} moduleName
 * @returns {Promise<void>}
 */
async function showComingSoon(
    interaction,
    emoji,
    moduleName
) {
    await interaction.editReply({
        embeds: [
            createWarningEmbed(
                `${emoji} ${moduleName}`,
                [
                    `The **${moduleName}** module is not connected yet.`,
                    '',
                    'This option is prepared inside the Umbra Setup Wizard and will become active in a future update.'
                ].join('\n')
            )
        ],

        components: []
    });
}

module.exports = {
    name:
        Events.InteractionCreate,

    once:
        false,

    /**
     * Handle Umbra Setup Wizard interactions.
     *
     * @param {import('discord.js').Interaction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        if (
            !interaction.isStringSelectMenu()
        ) {
            return;
        }

        if (
            interaction.customId !==
            'umbra:setup:select'
        ) {
            return;
        }

        try {
            if (!interaction.inGuild()) {
                await sendSetupError(
                    interaction,
                    '❌ Server Only Action',
                    'The Umbra Setup Wizard can only be used inside a server.'
                );

                return;
            }

            if (
                !interaction.memberPermissions?.has(
                    PermissionFlagsBits.Administrator
                )
            ) {
                await sendSetupError(
                    interaction,
                    '❌ Permission Denied',
                    'Only an Administrator may use the Umbra Setup Wizard.'
                );

                return;
            }

            await interaction.deferUpdate();

            const selectedModule =
                interaction.values[0];

            switch (selectedModule) {
                case 'sacred-laws':
                    await publishSacredLaws(
                        interaction
                    );
                    break;

                case 'official-decrees':
                    await showComingSoon(
                        interaction,
                        '📢',
                        'Official Decrees'
                    );
                    break;

                case 'server-guide':
                    await publishServerGuide(
                        interaction
                    );
                    break;

                case 'role-information':
                    await showComingSoon(
                        interaction,
                        '🎖️',
                        'Role Information'
                    );
                    break;

                case 'faq':
                    await showComingSoon(
                        interaction,
                        '❓',
                        'Frequently Asked Questions'
                    );
                    break;

                case 'ticket-guide':
                    await showComingSoon(
                        interaction,
                        '🎫',
                        'Ticket Guide'
                    );
                    break;

                case 'full-setup':
                    await showComingSoon(
                        interaction,
                        '🚀',
                        'Full Server Setup'
                    );
                    break;

                default:
                    await interaction.editReply({
                        embeds: [
                            createErrorEmbed(
                                '❌ Unknown Setup Module',
                                'The selected Setup Wizard option is not supported.'
                            )
                        ],

                        components: []
                    });
            }
        } catch (error) {
            console.error(
                '❌ Umbra setup interaction error:'
            );

            console.error(error);

            try {
                await sendSetupError(
                    interaction,
                    '❌ Setup Module Failed',
                    'Umbra could not process the selected setup module.'
                );
            } catch (responseError) {
                console.error(
                    '❌ Failed to send setup interaction error response:'
                );

                console.error(
                    responseError
                );
            }
        }
    }
};