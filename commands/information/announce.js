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
        emoji:
            '📢',

        label:
            'Server Update',

        authority:
            'An official update from THE Ⅹ SINS.'
    },

    event: {
        emoji:
            '🎉',

        label:
            'Community Event',

        authority:
            'An official THE Ⅹ SINS community event.'
    },

    giveaway: {
        emoji:
            '🎁',

        label:
            'Giveaway',

        authority:
            'An official giveaway hosted by THE Ⅹ SINS.'
    },

    maintenance: {
        emoji:
            '🛠️',

        label:
            'Maintenance Notice',

        authority:
            'An official THE Ⅹ SINS maintenance notice.'
    },

    important: {
        emoji:
            '⚠️',

        label:
            'Important Notice',

        authority:
            'An important notice for all members.'
    },

    general: {
        emoji:
            'Ⅹ',

        label:
            'Official Decree',

        authority:
            'An official decree from THE Ⅹ SINS.'
    }
};

const ANNOUNCEMENT_CHOICES =
    Object.entries(
        ANNOUNCEMENT_TYPES
    ).map(
        (
            [
                value,
                type
            ]
        ) => ({
            name:
                `${type.emoji} ${type.label}`,

            value
        })
    );

function isValidImageURL(value) {
    if (!value) {
        return true;
    }

    try {
        const url =
            new URL(
                value
            );

        return (
            url.protocol ===
                'http:' ||
            url.protocol ===
                'https:'
        );
    } catch {
        return false;
    }
}

async function sendAnnouncementError(
    interaction,
    title,
    description
) {
    const payload = {
        embeds: [
            createErrorEmbed(
                title,
                description
            )
        ]
    };

    if (interaction.deferred) {
        await interaction
            .editReply(
                payload
            )
            .catch(
                () => null
            );

        return;
    }

    if (interaction.replied) {
        await interaction
            .followUp({
                ...payload,

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
            ...payload,

            flags:
                MessageFlags.Ephemeral
        })
        .catch(
            () => null
        );
}

function buildAnnouncementEmbed({
    interaction,
    type,
    title,
    message,
    imageURL
}) {
    const timestamp =
        Math.floor(
            Date.now() / 1000
        );

    const botAvatar =
        interaction.client.user
            .displayAvatarURL({
                size:
                    256,

                forceStatic:
                    false
            });

    const serverIcon =
        interaction.guild.iconURL({
            size:
                256,

            forceStatic:
                false
        }) ??
        botAvatar;

    const embed =
        createEmbed({
            title:
                `${type.emoji} ${title}`,

            description: [
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
                        'Ⅹ・THE Ⅹ SINS AUTHORITY',

                    value:
                        type.authority,

                    inline:
                        false
                }
            ],

            author: {
                name:
                    'Evelynn • THE Ⅹ SINS',

                iconURL:
                    botAvatar
            },

            footer: {
                text:
                    `THE Ⅹ SINS • ${type.label}`,

                iconURL:
                    serverIcon
            }
        })
            .setTimestamp();

    if (imageURL) {
        embed.setImage(
            imageURL
        );
    }

    return embed;
}module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'announce'
            )
            .setDescription(
                'Publish an official THE Ⅹ SINS announcement.'
            )
            .addStringOption(
                option =>
                    option
                        .setName(
                            'type'
                        )
                        .setDescription(
                            'Select the announcement type'
                        )
                        .setRequired(
                            true
                        )
                        .addChoices(
                            ...ANNOUNCEMENT_CHOICES
                        )
            )
            .addStringOption(
                option =>
                    option
                        .setName(
                            'title'
                        )
                        .setDescription(
                            'Announcement title'
                        )
                        .setRequired(
                            true
                        )
                        .setMaxLength(
                            200
                        )
            )
            .addStringOption(
                option =>
                    option
                        .setName(
                            'message'
                        )
                        .setDescription(
                            'Announcement message'
                        )
                        .setRequired(
                            true
                        )
                        .setMaxLength(
                            3500
                        )
            )
            .addStringOption(
                option =>
                    option
                        .setName(
                            'image'
                        )
                        .setDescription(
                            'Optional image URL'
                        )
                        .setRequired(
                            false
                        )
            )
            .addBooleanOption(
                option =>
                    option
                        .setName(
                            'mention_everyone'
                        )
                        .setDescription(
                            'Mention everyone when publishing'
                        )
                        .setRequired(
                            false
                        )
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.Administrator
            )
            .setDMPermission(
                false
            ),

    async execute(interaction) {
        try {
            if (
                !interaction.inGuild()
            ) {
                await sendAnnouncementError(
                    interaction,
                    '❌ Server Only Command',
                    'This command can only be used inside THE Ⅹ SINS.'
                );

                return;
            }

            if (
                !interaction.memberPermissions
                    ?.has(
                        PermissionFlagsBits.Administrator
                    )
            ) {
                await sendAnnouncementError(
                    interaction,
                    '❌ Permission Denied',
                    'Only Administrators may publish official announcements.'
                );

                return;
            }

            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            const typeKey =
                interaction.options.getString(
                    'type',
                    true
                );

            const type =
                ANNOUNCEMENT_TYPES[typeKey];

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

            if (!type) {
                await sendAnnouncementError(
                    interaction,
                    '❌ Invalid Announcement Type',
                    'Select a valid announcement type.'
                );

                return;
            }

            if (
                !isValidImageURL(
                    imageURL
                )
            ) {
                await sendAnnouncementError(
                    interaction,
                    '❌ Invalid Image URL',
                    'Use a valid `http://` or `https://` image URL.'
                );

                return;
            }

            const channel =
                await interaction.guild
                    .channels
                    .fetch(
                        DECREES_CHANNEL_ID
                    )
                    .catch(
                        () => null
                    );

            if (
                !channel?.isTextBased()
            ) {
                await sendAnnouncementError(
                    interaction,
                    '❌ Decrees Channel Missing',
                    'Evelynn could not find the configured decrees channel.'
                );

                return;
            }

            const botMember =
                interaction.guild.members.me;

            const permissions = [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks
            ];

            if (mentionEveryone) {
                permissions.push(
                    PermissionFlagsBits.MentionEveryone
                );
            }

            if (
                !botMember ||
                !channel.permissionsFor(
                    botMember
                )?.has(
                    permissions
                )
            ) {
                await sendAnnouncementError(
                    interaction,
                    '❌ Missing Evelynn Permissions',

                    mentionEveryone
                        ? 'Evelynn needs View Channel, Send Messages, Embed Links and Mention Everyone.'
                        : 'Evelynn needs View Channel, Send Messages and Embed Links.'
                );

                return;
            }

            await channel.send({
                content:
                    mentionEveryone
                        ? '@everyone'
                        : undefined,

                embeds: [
                    buildAnnouncementEmbed({
                        interaction,
                        type,
                        title,
                        message,
                        imageURL
                    })
                ],

                allowedMentions: {
                    parse:
                        mentionEveryone
                            ? [
                                'everyone'
                            ]
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

            await sendAnnouncementError(
                interaction,
                '❌ Announcement Failed',
                'Evelynn could not publish this announcement.'
            );
        }
    }
};