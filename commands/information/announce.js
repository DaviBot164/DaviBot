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

const DECREES_CHANNEL_ID =
    '1528401988272914463';

/**
 * Get announcement design information.
 *
 * @param {string} type
 * @returns {{
 *     emoji: string,
 *     label: string,
 *     authorityText: string
 * }}
 */
function getAnnouncementType(type) {
    switch (type) {
        case 'server-update':
            return {
                emoji: '📢',
                label: 'Server Update',
                authorityText:
                    'An official update from the Crimson Eclipse Order.'
            };

        case 'event':
            return {
                emoji: '🎉',
                label: 'Community Event',
                authorityText:
                    'An official Crimson Eclipse community event.'
            };

        case 'giveaway':
            return {
                emoji: '🎁',
                label: 'Giveaway',
                authorityText:
                    'An official giveaway hosted within Crimson Eclipse.'
            };

        case 'maintenance':
            return {
                emoji: '🛠️',
                label: 'Maintenance Notice',
                authorityText:
                    'An official maintenance notice from the Crimson Eclipse Order.'
            };

        case 'important':
            return {
                emoji: '⚠️',
                label: 'Important Notice',
                authorityText:
                    'An important notice requiring the attention of every Soul.'
            };

        default:
            return {
                emoji: '🌑',
                label: 'Official Decree',
                authorityText:
                    'An official decree issued under the authority of Crimson Eclipse.'
            };
    }
}

/**
 * Validate an optional image URL.
 *
 * @param {string|null} imageURL
 * @returns {boolean}
 */
function isValidImageURL(imageURL) {
    if (!imageURL) {
        return true;
    }

    try {
        const parsedURL =
            new URL(imageURL);

        return (
            parsedURL.protocol === 'http:' ||
            parsedURL.protocol === 'https:'
        );
    } catch {
        return false;
    }
}

module.exports = {
    category: 'information',

    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription(
            'Publish an official Crimson Eclipse decree.'
        )
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription(
                    'Select the announcement type'
                )
                .setRequired(true)
                .addChoices(
                    {
                        name: '📢 Server Update',
                        value: 'server-update'
                    },
                    {
                        name: '🎉 Event',
                        value: 'event'
                    },
                    {
                        name: '🎁 Giveaway',
                        value: 'giveaway'
                    },
                    {
                        name: '🛠️ Maintenance',
                        value: 'maintenance'
                    },
                    {
                        name: '⚠️ Important Notice',
                        value: 'important'
                    },
                    {
                        name: '🌑 General Decree',
                        value: 'general'
                    }
                )
        )
        .addStringOption(option =>
            option
                .setName('title')
                .setDescription(
                    'The title of the announcement'
                )
                .setRequired(true)
                .setMaxLength(200)
        )
        .addStringOption(option =>
            option
                .setName('message')
                .setDescription(
                    'The announcement message'
                )
                .setRequired(true)
                .setMaxLength(3500)
        )
        .addStringOption(option =>
            option
                .setName('image')
                .setDescription(
                    'Optional image URL'
                )
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('mention_everyone')
                .setDescription(
                    'Mention everyone when publishing'
                )
                .setRequired(false)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        )
        .setDMPermission(false),

    /**
     * Execute the /announce command.
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
                            'Only an Administrator may publish official decrees.'
                        )
                    ]
                });

                return;
            }

            const announcementType =
                interaction.options.getString(
                    'type',
                    true
                );

            const title =
                interaction.options.getString(
                    'title',
                    true
                );

            const message =
                interaction.options.getString(
                    'message',
                    true
                );

            const imageURL =
                interaction.options.getString(
                    'image'
                );

            const mentionEveryone =
                interaction.options.getBoolean(
                    'mention_everyone'
                ) ??
                false;

            if (
                !isValidImageURL(
                    imageURL
                )
            ) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Invalid Image URL',
                            'The image must use a valid `http://` or `https://` URL.'
                        )
                    ]
                });

                return;
            }

            const typeData =
                getAnnouncementType(
                    announcementType
                );

            const decreesChannel =
                await interaction.guild.channels.fetch(
                    DECREES_CHANNEL_ID
                );

            if (
                !decreesChannel ||
                !decreesChannel.isTextBased()
            ) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Decrees Channel Missing',
                            'Umbra could not find the configured decrees channel.'
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
                decreesChannel.permissionsFor(
                    botMember
                );

            const requiredPermissions = [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks
            ];

            if (mentionEveryone) {
                requiredPermissions.push(
                    PermissionFlagsBits.MentionEveryone
                );
            }

            if (
                !channelPermissions?.has(
                    requiredPermissions
                )
            ) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Missing Umbra Permissions',
                            mentionEveryone
                                ? 'Umbra requires **View Channel**, **Send Messages**, **Embed Links**, and **Mention Everyone** permissions in the decrees channel.'
                                : 'Umbra requires **View Channel**, **Send Messages**, and **Embed Links** permissions in the decrees channel.'
                        )
                    ]
                });

                return;
            }

            const issuedTimestamp =
                Math.floor(
                    Date.now() / 1000
                );

            const announcementEmbed =
                createEmbed({
                    title:
                        `${typeData.emoji} ${title}`,

                    description:
                        [
                            `### ${typeData.emoji} ${typeData.label}`,
                            '',
                            message,
                            '',
                            '━━━━━━━━━━━━━━━━━━━━',
                            '',
                            `**Issued by:** ${interaction.user}`,
                            `**Issued at:** <t:${issuedTimestamp}:F>`,
                            `-# <t:${issuedTimestamp}:R>`
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
                                '🌑 Crimson Eclipse Authority',

                            value:
                                typeData.authorityText,

                            inline:
                                false
                        }
                    ]
                });

            announcementEmbed.setAuthor({
                name:
                    'Umbra • Guardian of Crimson Eclipse',

                iconURL:
                    interaction.client.user.displayAvatarURL({
                        size: 256,
                        forceStatic: false
                    })
            });

            announcementEmbed.setFooter({
                text:
                    `${typeData.emoji} Crimson Eclipse • ${typeData.label}`,

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

            announcementEmbed.setTimestamp();

            if (imageURL) {
                announcementEmbed.setImage(
                    imageURL
                );
            }

            await decreesChannel.send({
                content:
                    mentionEveryone
                        ? '@everyone'
                        : undefined,

                embeds:
                    [announcementEmbed],

                allowedMentions: {
                    parse:
                        mentionEveryone
                            ? ['everyone']
                            : []
                }
            });

            await interaction.editReply({
                embeds: [
                    createSuccessEmbed(
                        '✅ Decree Published',
                        `${typeData.emoji} **${typeData.label}** was successfully published in ${decreesChannel}.`
                    )
                ]
            });

            console.log(
                '======================================'
            );

            console.log(
                `${typeData.emoji} ${typeData.label} Published`
            );

            console.log(
                `📌 Title: ${title}`
            );

            console.log(
                `📍 Channel: ${decreesChannel.name}`
            );

            console.log(
                `🛡️ Published By: ${interaction.user.tag}`
            );

            console.log(
                `🏰 Server: ${interaction.guild.name}`
            );

            console.log(
                `📣 Mention Everyone: ${mentionEveryone}`
            );

            console.log(
                '======================================'
            );
        } catch (error) {
            console.error(
                '❌ Umbra announce command error:'
            );

            console.error(error);

            const errorEmbed =
                createErrorEmbed(
                    '❌ Decree Failed',
                    'Umbra could not publish the announcement. Please verify the channel ID and bot permissions.'
                );

            if (interaction.deferred) {
                await interaction
                    .editReply({
                        embeds:
                            [errorEmbed],

                        components: []
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