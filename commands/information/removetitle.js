const {
    SlashCommandBuilder,
    MessageFlags
} = require('discord.js');

const {
    createSuccessEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const {
    titles:
        titleDatabase
} = require('../../database');

/**
 * Default Title used when a Soul removes
 * their currently active designation.
 */
const DEFAULT_TITLE_ID =
    'nameless_soul';

/**
 * THE Ⅹ SINS gold color used for
 * Chronicle Title actions.
 */
const TITLE_COLOR =
    '#D4AF37';

/**
 * Format a Discord timestamp.
 *
 * @param {Date|string|number|null|undefined} value
 * @returns {string}
 */
function formatDiscordDate(
    value
) {
    if (!value) {
        return 'Not recorded';
    }

    const date =
        value instanceof Date
            ? value
            : new Date(
                value
            );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return 'Not recorded';
    }

    const unixTimestamp =
        Math.floor(
            date.getTime() /
            1000
        );

    return [
        `<t:${unixTimestamp}:F>`,
        `-# <t:${unixTimestamp}:R>`
    ].join('\n');
}

/**
 * Create the successful Title reset embed.
 *
 * @param {Object} options
 * @param {import('discord.js').ChatInputCommandInteraction} options.interaction
 * @param {import('discord.js').GuildMember} options.member
 * @param {Object} options.previousTitle
 * @param {Object} options.defaultTitle
 * @returns {import('discord.js').EmbedBuilder}
 */
function createTitleResetEmbed({
    interaction,
    member,
    previousTitle,
    defaultTitle
}) {
    const embed =
        createSuccessEmbed(
            '🌑 Chronicle Title Reset',
            [
                `${member} has removed their previous active designation.`,
                '',
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                '',
                '*The Soul Archives have restored the default Chronicle Title.*'
            ].join('\n')
        );

    embed.setColor(
        TITLE_COLOR
    );

    embed.setThumbnail(
        member.user.displayAvatarURL({
            size:
                1024,

            forceStatic:
                false
        })
    );

    embed.addFields(
        {
            name:
                '📜 Previous Active Title',

            value:
                [
                    `**${previousTitle.displayName}**`,
                    `-# ${previousTitle.rarity} • ${previousTitle.category}`
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '🌑 Current Active Title',

            value:
                [
                    `**${defaultTitle.displayName}**`,
                    `-# ${defaultTitle.rarity} • ${defaultTitle.category}`
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '🕒 Restored At',

            value:
                formatDiscordDate(
                    defaultTitle.activatedAt
                ),

            inline:
                false
        }
    );

    embed.setFooter({
        text:
            `🌙 Evelynn • Guardian of THE Ⅹ SINS • Reset by ${interaction.user.username}`,

        iconURL:
            interaction.client.user
                .displayAvatarURL({
                    size:
                        128,

                    forceStatic:
                        false
                })
    });

    return embed;
}

module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'removetitle'
            )
            .setDescription(
                'Remove your active Chronicle Title and restore the default Title.'
            )
            .setDMPermission(
                false
            ),

    /**
     * Execute the /removetitle command.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(
        interaction
    ) {
        try {
            if (
                !interaction.inGuild()
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ THE Ⅹ SINS Only Command',
                            'This command can only be used inside THE Ⅹ SINS.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            const member =
                interaction.member;

            if (!member) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Soul Not Found',
                            'Evelynn could not access your THE Ⅹ SINS member record.'
                        )
                    ]
                });

                return;
            }

            /*
             * Guarantee that the default Title
             * exists before checking the active
             * Chronicle designation.
             */
            await titleDatabase
                .ensureDefaultSoulTitle(
                    interaction.guild.id,
                    member.id
                );

            const activeTitle =
                await titleDatabase
                    .getActiveTitle(
                        interaction.guild.id,
                        member.id
                    );

            if (!activeTitle) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ No Active Title',
                            [
                                'You do not currently have an active Chronicle Title.',
                                '',
                                'Evelynn will restore the default **🌑 Nameless Soul** designation.'
                            ].join('\n')
                        )
                    ]
                });

                await titleDatabase
                    .ensureDefaultSoulTitle(
                        interaction.guild.id,
                        member.id
                    );

                return;
            }

            if (
                activeTitle.titleId ===
                DEFAULT_TITLE_ID
            ) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Default Title Already Active',
                            [
                                '**🌑 Nameless Soul** is already your active Chronicle Title.',
                                '',
                                'Use `/settitle` after unlocking another Title.'
                            ].join('\n')
                        )
                    ]
                });

                return;
            }

            const removedTitle =
                await titleDatabase
                    .clearActiveTitle(
                        interaction.guild.id,
                        member.id
                    );

            if (!removedTitle) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Title Removal Failed',
                            'Evelynn could not remove your active Chronicle Title.'
                        )
                    ]
                });

                return;
            }

            /*
             * Restore Nameless Soul as the
             * active fallback designation.
             */
            await titleDatabase
                .ensureDefaultSoulTitle(
                    interaction.guild.id,
                    member.id
                );

            const defaultTitle =
                await titleDatabase
                    .getActiveTitle(
                        interaction.guild.id,
                        member.id
                    );

            if (
                !defaultTitle ||
                defaultTitle.titleId !==
                    DEFAULT_TITLE_ID
            ) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Default Title Restoration Failed',
                            [
                                'The previous Title was removed, but Evelynn could not restore **🌑 Nameless Soul**.',
                                '',
                                'Please inspect the PostgreSQL connection before trying again.'
                            ].join('\n')
                        )
                    ]
                });

                return;
            }

            const successEmbed =
                createTitleResetEmbed({
                    interaction,
                    member,

                    previousTitle:
                        removedTitle,

                    defaultTitle
                });

            await interaction.editReply({
                embeds: [
                    successEmbed
                ]
            });
        } catch (error) {
            console.error(
                '❌ Evelynn /removetitle command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Title Removal Unavailable',
                    [
                        'Evelynn could not reset your active Chronicle Title.',
                        '',
                        'Please inspect the PostgreSQL connection and Northflank logs before trying again.'
                    ].join('\n')
                );

            if (
                interaction.deferred
            ) {
                await interaction
                    .editReply({
                        embeds: [
                            errorEmbed
                        ]
                    })
                    .catch(
                        () => null
                    );

                return;
            }

            if (
                interaction.replied
            ) {
                await interaction
                    .followUp({
                        embeds: [
                            errorEmbed
                        ],

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
                    embeds: [
                        errorEmbed
                    ],

                    flags:
                        MessageFlags.Ephemeral
                })
                .catch(
                    () => null
                );
        }
    }
};