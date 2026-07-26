const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createSuccessEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const SACRED_LAWS_CHANNEL_ID =
    '1528401946363433180';

module.exports = {
    category: 'information',

    data: new SlashCommandBuilder()
        .setName('setuprules')
        .setDescription(
            'Publish the Crimson Eclipse Sacred Laws.'
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        )
        .setDMPermission(false),

    /**
     * Publish the Crimson Eclipse rules embed.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        try {
            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            if (!interaction.inGuild()) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Server Only Command',
                            'This command can only be used inside the Crimson Eclipse server.'
                        )
                    ]
                });

                return;
            }

            if (
                !interaction.memberPermissions.has(
                    PermissionFlagsBits.Administrator
                )
            ) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Permission Denied',
                            'Only an Administrator may publish the Sacred Laws.'
                        )
                    ]
                });

                return;
            }

            const rulesChannel =
                await interaction.guild.channels.fetch(
                    SACRED_LAWS_CHANNEL_ID
                );

            if (
                !rulesChannel ||
                !rulesChannel.isTextBased()
            ) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Sacred Laws Channel Missing',
                            'Umbra could not find the configured Sacred Laws channel.'
                        )
                    ]
                });

                return;
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
                    ]
                });

                return;
            }

            const channelPermissions =
                rulesChannel.permissionsFor(
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
                            'Umbra requires **View Channel**, **Send Messages**, and **Embed Links** permissions in the Sacred Laws channel.'
                        )
                    ]
                });

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
                ]
            });

            console.log(
                '======================================'
            );

            console.log(
                '📜 Sacred Laws Published'
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
        } catch (error) {
            console.error(
                '❌ Umbra setup rules command error:'
            );

            console.error(error);

            const errorEmbed =
                createErrorEmbed(
                    '❌ Sacred Laws Failed',
                    'Umbra could not publish the Sacred Laws. Please verify the channel ID and bot permissions.'
                );

            if (interaction.deferred) {
                await interaction
                    .editReply({
                        embeds:
                            [errorEmbed]
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            if (interaction.replied) {
                await interaction
                    .followUp({
                        embeds:
                            [errorEmbed],

                        flags:
                            MessageFlags.Ephemeral
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            await interaction
                .reply({
                    embeds:
                        [errorEmbed],

                    flags:
                        MessageFlags.Ephemeral
                })
                .catch(
                    () => null
                );
        }
    }
};