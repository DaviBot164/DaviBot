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

const ANNOUNCEMENT_TYPES = {
    'server-update': {
        emoji: '📢',
        label: 'Server Update',
        authority:
            'An official update from THE Ⅹ SINS.'
    },

    event: {
        emoji: '🎉',
        label: 'Community Event',
        authority:
            'An official TTS community event.'
    },

    giveaway: {
        emoji: '🎁',
        label: 'Giveaway',
        authority:
            'An official giveaway hosted by THE Ⅹ SINS.'
    },

    maintenance: {
        emoji: '🛠️',
        label: 'Maintenance Notice',
        authority:
            'An official TTS maintenance notice.'
    },

    important: {
        emoji: '⚠️',
        label: 'Important Notice',
        authority:
            'An important notice for all members.'
    },

    general: {
        emoji: 'Ⅹ',
        label: 'Official Decree',
        authority:
            'An official decree from THE Ⅹ SINS.'
    }
};

function getAnnouncementType(type) {
    return (
        ANNOUNCEMENT_TYPES[type] ??
        ANNOUNCEMENT_TYPES.general
    );
}

function isValidImageURL(value) {
    if (!value) {
        return true;
    }

    try {
        const url =
            new URL(value);

        return [
            'http:',
            'https:'
        ].includes(url.protocol);
    } catch {
        return false;
    }
}

function errorReply(
    interaction,
    title,
    description
) {
    return interaction.editReply({
        embeds: [
            createErrorEmbed(
                title,
                description
            )
        ]
    });
}

function buildAnnouncementEmbed(
    interaction,
    type,
    title,
    message,
    imageURL
) {
    const timestamp =
        Math.floor(
            Date.now() / 1000
        );

    const botAvatar =
        interaction.client.user
            .displayAvatarURL({
                size: 256,
                forceStatic: false
            });

    const serverIcon =
        interaction.guild.iconURL({
            size: 256,
            forceStatic: false
        }) ?? botAvatar;

    const embed =
        createEmbed({
            title:
                `${type.emoji} ${title}`,

            description:
                [
                    `### ${type.emoji} ${type.label}`,
                    '',
                    message,
                    '',
                    `**Issued by:** ${interaction.user}`,
                    `**Issued:** <t:${timestamp}:F> • <t:${timestamp}:R>`
                ].join('\n'),

            thumbnail:
                serverIcon,

            fields: [
                {
                    name:
                        'Ⅹ・TTS AUTHORITY',

                    value:
                        type.authority,

                    inline:
                        false
                }
            ]
        })
            .setAuthor({
                name:
                    'Evelynn • THE Ⅹ SINS',

                iconURL:
                    botAvatar
            })
            .setFooter({
                text:
                    `TTS • ${type.label}`,

                iconURL:
                    serverIcon
            })
            .setTimestamp();

    if (imageURL) {
        embed.setImage(
            imageURL
        );
    }

    return embed;
}module.exports = {
    category: 'information',

    data:
        new SlashCommandBuilder()
            .setName('announce')
            .setDescription(
                'Publish an official TTS announcement.'
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
                            name: 'Ⅹ General Decree',
                            value: 'general'
                        }
                    )
            )
            .addStringOption(option =>
                option
                    .setName('title')
                    .setDescription(
                        'Announcement title'
                    )
                    .setRequired(true)
                    .setMaxLength(200)
            )
            .addStringOption(option =>
                option
                    .setName('message')
                    .setDescription(
                        'Announcement message'
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
            )
            .addBooleanOption(option =>
                option
                    .setName('mention_everyone')
                    .setDescription(
                        'Mention everyone when publishing'
                    )
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.Administrator
            )
            .setDMPermission(false),

    async execute(interaction) {
        try {
            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            if (!interaction.inGuild()) {
                return errorReply(
                    interaction,
                    '❌ Server Only Command',
                    'This command can only be used inside THE Ⅹ SINS.'
                );
            }

            if (
                !interaction.memberPermissions?.has(
                    PermissionFlagsBits.Administrator
                )
            ) {
                return errorReply(
                    interaction,
                    '❌ Permission Denied',
                    'Only Administrators may publish official TTS announcements.'
                );
            }

            const type =
                getAnnouncementType(
                    interaction.options.getString(
                        'type',
                        true
                    )
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
                ) ?? false;

            if (!isValidImageURL(imageURL)) {
                return errorReply(
                    interaction,
                    '❌ Invalid Image URL',
                    'Use a valid `http://` or `https://` image URL.'
                );
            }

            const channel =
                await interaction.guild.channels
                    .fetch(
                        DECREES_CHANNEL_ID
                    )
                    .catch(() => null);

            if (!channel?.isTextBased()) {
                return errorReply(
                    interaction,
                    '❌ Decrees Channel Missing',
                    'Evelynn could not find the configured decrees channel.'
                );
            }

            const botMember =
                interaction.guild.members.me;

            if (!botMember) {
                return errorReply(
                    interaction,
                    '❌ Evelynn Unavailable',
                    'Evelynn could not access its server member information.'
                );
            }

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
                !channel.permissionsFor(botMember)
                    ?.has(requiredPermissions)
            ) {
                return errorReply(
                    interaction,
                    '❌ Missing Evelynn Permissions',
                    mentionEveryone
                        ? 'Evelynn needs View Channel, Send Messages, Embed Links and Mention Everyone.'
                        : 'Evelynn needs View Channel, Send Messages and Embed Links.'
                );
            }

            await channel.send({
                content:
                    mentionEveryone
                        ? '@everyone'
                        : undefined,

                embeds: [
                    buildAnnouncementEmbed(
                        interaction,
                        type,
                        title,
                        message,
                        imageURL
                    )
                ],

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
                        '✅ Announcement Published',
                        `${type.emoji} **${type.label}** was published in ${channel}.`
                    )
                ]
            });
        } catch (error) {
            console.error(
                '❌ Evelynn /announce failed:',
                error
            );

            const embed =
                createErrorEmbed(
                    '❌ Announcement Failed',
                    'Evelynn could not publish this announcement.'
                );

            if (interaction.deferred) {
                await interaction
                    .editReply({
                        embeds: [embed],
                        components: []
                    })
                    .catch(() => null);

                return;
            }

            if (interaction.replied) {
                await interaction
                    .followUp({
                        embeds: [embed],
                        flags:
                            MessageFlags.Ephemeral
                    })
                    .catch(() => null);

                return;
            }

            await interaction
                .reply({
                    embeds: [embed],
                    flags:
                        MessageFlags.Ephemeral
                })
                .catch(() => null);
        }
    }
};