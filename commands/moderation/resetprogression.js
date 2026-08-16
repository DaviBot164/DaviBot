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

const {
    query
} = require('../../database/connection');

const {
    ACHIEVEMENT_ROLE_IDS
} = require('../../handlers/achievementHandler');

const RESET_CONFIRMATION =
    'RESET THE X SINS';

const RESET_COLOR =
    '#ED4245';

const RESET_PREVIEW_SQL = `
    SELECT
        (
            SELECT COUNT(*)::INTEGER
            FROM levels
            WHERE guild_id = $1
        ) AS level_records,

        (
            SELECT COUNT(*)::INTEGER
            FROM soul_achievements
            WHERE guild_id = $1
        ) AS achievement_records,

        (
            SELECT COUNT(*)::INTEGER
            FROM soul_titles
            WHERE guild_id = $1
        ) AS title_records;
`;

const RESET_EXECUTE_SQL = `
    WITH
        deleted_levels AS (
            DELETE FROM levels
            WHERE guild_id = $1
            RETURNING 1
        ),

        deleted_achievements AS (
            DELETE FROM soul_achievements
            WHERE guild_id = $1
            RETURNING 1
        ),

        deleted_titles AS (
            DELETE FROM soul_titles
            WHERE guild_id = $1
            RETURNING 1
        )

    SELECT
        (
            SELECT COUNT(*)::INTEGER
            FROM deleted_levels
        ) AS level_records,

        (
            SELECT COUNT(*)::INTEGER
            FROM deleted_achievements
        ) AS achievement_records,

        (
            SELECT COUNT(*)::INTEGER
            FROM deleted_titles
        ) AS title_records;
`;

function normalizeCounts(
    row = {}
) {
    return {
        levels:
            Number(
                row.level_records
            ) || 0,

        achievements:
            Number(
                row.achievement_records
            ) || 0,

        titles:
            Number(
                row.title_records
            ) || 0
    };
}

function createCountFields(counts) {
    return [
        {
            name:
                '⭐ Level Records',

            value:
                String(
                    counts.levels
                ),

            inline:
                true
        },

        {
            name:
                '🏆 Achievement Records',

            value:
                String(
                    counts.achievements
                ),

            inline:
                true
        },

        {
            name:
                '🏷️ Title Records',

            value:
                String(
                    counts.titles
                ),

            inline:
                true
        }
    ];
}

async function getAchievementRolePreview(
    guild
) {
    const roleIds =
        new Set(
            Object.values(
                ACHIEVEMENT_ROLE_IDS
            ).filter(
                Boolean
            )
        );

    const members =
        await guild.members.fetch();

    let membersWithRoles = 0;
    let roleAssignments = 0;

    for (
        const member
        of members.values()
    ) {
        if (member.user.bot) {
            continue;
        }

        const count =
            member.roles.cache.filter(
                role =>
                    roleIds.has(
                        role.id
                    )
            ).size;

        if (count > 0) {
            membersWithRoles += 1;
            roleAssignments += count;
        }
    }

    return {
        membersWithRoles,
        roleAssignments
    };
}async function removeAchievementRoles(
    guild
) {
    const roleIds =
        new Set(
            Object.values(
                ACHIEVEMENT_ROLE_IDS
            ).filter(
                Boolean
            )
        );

    const members =
        await guild.members.fetch();

    let cleanedMembers = 0;
    let removedRoles = 0;
    let failedMembers = 0;

    for (
        const member
        of members.values()
    ) {
        if (member.user.bot) {
            continue;
        }

        const assignedRoleIds =
            member.roles.cache
                .filter(
                    role =>
                        roleIds.has(
                            role.id
                        )
                )
                .map(
                    role => role.id
                );

        if (
            assignedRoleIds.length ===
            0
        ) {
            continue;
        }

        try {
            await member.roles.remove(
                assignedRoleIds,
                'THE Ⅹ SINS progression reset'
            );

            cleanedMembers += 1;

            removedRoles +=
                assignedRoleIds.length;
        } catch (error) {
            failedMembers += 1;

            console.error(
                `❌ Progression reset role cleanup failed for ${member.user.tag}:`,
                error
            );
        }
    }

    return {
        cleanedMembers,
        removedRoles,
        failedMembers
    };
}

async function sendError(
    interaction,
    title,
    message
) {
    const payload = {
        embeds: [
            createErrorEmbed(
                title,
                message
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

module.exports = {
    category:
        'moderation',

    data:
        new SlashCommandBuilder()
            .setName(
                'resetprogression'
            )
            .setDescription(
                'Preview or execute the server progression reset.'
            )
            .addStringOption(
                option =>
                    option
                        .setName(
                            'mode'
                        )
                        .setDescription(
                            'Select preview or execute'
                        )
                        .setRequired(
                            true
                        )
                        .addChoices(
                            {
                                name:
                                    'Preview only',

                                value:
                                    'preview'
                            },

                            {
                                name:
                                    'Execute reset',

                                value:
                                    'execute'
                            }
                        )
            )
            .addStringOption(
                option =>
                    option
                        .setName(
                            'confirmation'
                        )
                        .setDescription(
                            `Required for execute: ${RESET_CONFIRMATION}`
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

    async execute(
        interaction
    ) {
        try {
            if (
                !interaction.inGuild()
            ) {
                await sendError(
                    interaction,
                    '❌ Server Only Command',
                    'This command can only be used inside THE Ⅹ SINS.'
                );

                return;
            }

            if (
                interaction.user.id !==
                interaction.guild.ownerId
            ) {
                await sendError(
                    interaction,
                    '❌ Server Owner Required',
                    'Only the server owner may reset progression.'
                );

                return;
            }

            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            const mode =
                interaction.options.getString(
                    'mode',
                    true
                );

            const confirmation =
                interaction.options.getString(
                    'confirmation'
                );            if (
                mode ===
                'preview'
            ) {
                const [
                    databaseResult,
                    rolePreview
                ] =
                    await Promise.all([
                        query(
                            RESET_PREVIEW_SQL,
                            [
                                interaction.guild.id
                            ]
                        ),

                        getAchievementRolePreview(
                            interaction.guild
                        )
                    ]);

                const counts =
                    normalizeCounts(
                        databaseResult.rows[0]
                    );

                const embed =
                    createEmbed({
                        title:
                            '⚠️ Progression Reset Preview',

                        description: [
                            'No data has been changed.',
                            '',
                            `To execute, use confirmation: \`${RESET_CONFIRMATION}\``
                        ].join('\n'),

                        color:
                            RESET_COLOR,

                        fields: [
                            ...createCountFields(
                                counts
                            ),

                            {
                                name:
                                    '👥 Members With Achievement Roles',

                                value:
                                    String(
                                        rolePreview
                                            .membersWithRoles
                                    ),

                                inline:
                                    true
                            },

                            {
                                name:
                                    '🎭 Achievement Role Assignments',

                                value:
                                    String(
                                        rolePreview
                                            .roleAssignments
                                    ),

                                inline:
                                    true
                            }
                        ],

                        footer: {
                            text:
                                'Preview only • Nothing was deleted'
                        }
                    });

                await interaction.editReply({
                    embeds: [
                        embed
                    ]
                });

                return;
            }

            if (
                confirmation !==
                RESET_CONFIRMATION
            ) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Confirmation Required',
                            `Enter exactly: \`${RESET_CONFIRMATION}\``
                        )
                    ]
                });

                return;
            }

            const databaseResult =
                await query(
                    RESET_EXECUTE_SQL,
                    [
                        interaction.guild.id
                    ]
                );

            const counts =
                normalizeCounts(
                    databaseResult.rows[0]
                );

            const roleResult =
                await removeAchievementRoles(
                    interaction.guild
                );

            const embed =
                createSuccessEmbed(
                    '✅ Progression Reset Complete',
                    [
                        'Levels, Achievements and Titles now start from zero.',
                        '',
                        'Sin Ranks and High Command roles were not changed.'
                    ].join('\n')
                );

            embed.addFields(
                ...createCountFields(
                    counts
                ),

                {
                    name:
                        '👥 Cleaned Members',

                    value:
                        String(
                            roleResult.cleanedMembers
                        ),

                    inline:
                        true
                },

                {
                    name:
                        '🎭 Removed Roles',

                    value:
                        String(
                            roleResult.removedRoles
                        ),

                    inline:
                        true
                },

                {
                    name:
                        '⚠️ Role Cleanup Failures',

                    value:
                        String(
                            roleResult.failedMembers
                        ),

                    inline:
                        true
                }
            );

            await interaction.editReply({
                embeds: [
                    embed
                ]
            });
        } catch (error) {
            console.error(
                '❌ Evelynn /resetprogression command error:',
                error
            );

            await sendError(
                interaction,
                '❌ Progression Reset Failed',
                'Check the runtime logs, then run preview again before retrying.'
            );
        }
    }
};