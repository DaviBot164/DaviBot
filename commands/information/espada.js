const {
    SlashCommandBuilder,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const {
    levels:
        levelDatabase,

    ranks:
        rankDatabase
} = require('../../database');

/**
 * Official Espada positions ordered
 * from the highest position to the lowest.
 */
const ESPADA_POSITIONS = [
    '👑 Espada 0',
    'Ⅰ Espada',
    'Ⅱ Espada',
    'Ⅲ Espada',
    'Ⅳ Espada',
    'Ⅴ Espada',
    'Ⅵ Espada',
    'Ⅶ Espada',
    'Ⅷ Espada',
    'Ⅸ Espada',
    'Ⅹ Espada'
];

/**
 * Long visual divider for a wider
 * Las Noches hierarchy embed.
 */
const WIDE_DIVIDER =
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

/**
 * Format a numeric value using
 * readable thousands separators.
 *
 * @param {number|string|null|undefined} value
 * @returns {string}
 */
function formatNumber(
    value
) {
    const numericValue =
        Number(value);

    if (
        !Number.isFinite(
            numericValue
        )
    ) {
        return '0';
    }

    return numericValue.toLocaleString(
        'en-US'
    );
}

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

    return (
        `<t:${unixTimestamp}:D> ` +
        `(<t:${unixTimestamp}:R>)`
    );
}

/**
 * Find one Discord role using
 * its exact configured name.
 *
 * @param {import('discord.js').Guild} guild
 * @param {string} roleName
 * @returns {import('discord.js').Role|null}
 */
function findGuildRole(
    guild,
    roleName
) {
    return (
        guild.roles.cache.find(
            role =>
                role.name ===
                roleName
        ) ||
        null
    );
}

/**
 * Get every non-bot member who
 * currently holds an Espada role.
 *
 * @param {import('discord.js').Role|null} role
 * @returns {import('discord.js').GuildMember[]}
 */
function getRoleMembers(
    role
) {
    if (!role) {
        return [];
    }

    return role.members
        .filter(
            member =>
                !member.user.bot
        )
        .sort(
            (
                firstMember,
                secondMember
            ) =>
                firstMember.displayName
                    .localeCompare(
                        secondMember.displayName
                    )
        )
        .map(
            member =>
                member
        );
}

/**
 * Safely load one Espada member's
 * Level and Rank archive information.
 *
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').GuildMember} member
 * @returns {Promise<Object>}
 */
async function getEspadaMemberData(
    guild,
    member
) {
    const [
        levelData,
        rankData
    ] =
        await Promise.all([
            levelDatabase
                .getUserLevel(
                    guild.id,
                    member.id
                )
                .catch(
                    () => null
                ),

            rankDatabase
                .getCurrentRank(
                    guild.id,
                    member.id
                )
                .catch(
                    () => null
                )
        ]);

    return {
        member,

        level:
            Number(
                levelData?.level || 0
            ),

        xp:
            Number(
                levelData?.xp || 0
            ),

        assignedAt:
            rankData?.assigned_at ||
            null
    };
}

/**
 * Build one Espada position display.
 *
 * @param {string} positionName
 * @param {Object[]} holders
 * @returns {string}
 */
function buildEspadaPositionDisplay(
    positionName,
    holders
) {
    if (
        !Array.isArray(
            holders
        ) ||
        holders.length === 0
    ) {
        return [
            `### ${positionName}`,
            '🌑 **Vacant**',
            '-# This throne currently awaits a worthy Soul.'
        ].join('\n');
    }

    if (
        holders.length === 1
    ) {
        const holder =
            holders[0];

        return [
            `### ${positionName}`,
            `${holder.member}`,
            `⭐ **Soul Level:** \`${holder.level}\``,
            `✨ **Spiritual Power:** \`${formatNumber(holder.xp)} XP\``,
            `📅 **Promoted:** ${formatDiscordDate(holder.assignedAt)}`
        ].join('\n');
    }

    const holderLines =
        holders.map(
            holder =>
                [
                    `${holder.member}`,
                    `-# Level ${holder.level} • ${formatNumber(holder.xp)} XP`
                ].join('\n')
        );

    return [
        `### ${positionName}`,
        '⚠️ **Hierarchy Conflict Detected**',
        '-# More than one Soul currently holds this position.',
        '',
        ...holderLines
    ].join('\n');
}

/**
 * Count all unique active Espada Souls.
 *
 * @param {Object[]} positionRecords
 * @returns {number}
 */
function countUniqueEspada(
    positionRecords
) {
    const uniqueMemberIds =
        new Set();

    for (
        const positionRecord
        of positionRecords
    ) {
        for (
            const holder
            of positionRecord.holders
        ) {
            uniqueMemberIds.add(
                holder.member.id
            );
        }
    }

    return uniqueMemberIds.size;
}

module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'espada'
            )
            .setDescription(
                'Display the official Espada hierarchy of Las Noches.'
            )
            .setDMPermission(
                false
            ),

    /**
     * Execute the /espada command.
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
                            '❌ Las Noches Only Command',
                            'This command can only be used inside Las Noches.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            await interaction.deferReply();

            /*
             * Refresh guild member data so the
             * role membership list is current.
             */
            await interaction.guild.members
                .fetch()
                .catch(
                    () => null
                );

            const positionRecords = [];

            for (
                const positionName
                of ESPADA_POSITIONS
            ) {
                const role =
                    findGuildRole(
                        interaction.guild,
                        positionName
                    );

                const members =
                    getRoleMembers(
                        role
                    );

                const holders =
                    await Promise.all(
                        members.map(
                            member =>
                                getEspadaMemberData(
                                    interaction.guild,
                                    member
                                )
                        )
                    );

                positionRecords.push({
                    positionName,
                    role,
                    holders
                });
            }

            const activePositions =
                positionRecords.filter(
                    positionRecord =>
                        positionRecord
                            .holders
                            .length >
                        0
                ).length;

            const vacantPositions =
                ESPADA_POSITIONS.length -
                activePositions;

            const activeEspada =
                countUniqueEspada(
                    positionRecords
                );

            const missingRoles =
                positionRecords.filter(
                    positionRecord =>
                        !positionRecord.role
                );

            const fields =
                positionRecords.map(
                    positionRecord => ({
                        name:
                            '\u200B',

                        value:
                            buildEspadaPositionDisplay(
                                positionRecord.positionName,
                                positionRecord.holders
                            ),

                        inline:
                            false
                    })
                );

            fields.push({
                name:
                    '📊 Espada Hierarchy Status',

                value:
                    [
                        `⚔️ **Active Espada Souls:** \`${activeEspada}\``,
                        `👑 **Occupied Positions:** \`${activePositions} / ${ESPADA_POSITIONS.length}\``,
                        `🌑 **Vacant Positions:** \`${vacantPositions}\``
                    ].join('\n'),

                inline:
                    false
            });

            if (
                missingRoles.length >
                0
            ) {
                fields.push({
                    name:
                        '⚠️ Missing Espada Roles',

                    value:
                        [
                            'Umbra could not find these Discord roles:',
                            '',
                            ...missingRoles.map(
                                positionRecord =>
                                    `• ${positionRecord.positionName}`
                            ),
                            '',
                            '-# The role names must match the configured Espada names exactly.'
                        ].join('\n'),

                    inline:
                        false
                });
            }

            const espadaEmbed =
                createEmbed({
                    title:
                        '👑 Official Espada Hierarchy',

                    description:
                        [
                            'Umbra has opened the central throne records of Las Noches.',
                            '',
                            WIDE_DIVIDER,
                            '',
                            '*The strongest Arrancar stand above the endless sands beneath the eternal moon.*'
                        ].join('\n'),

                    thumbnail:
                        interaction.guild.iconURL({
                            size:
                                1024,

                            forceStatic:
                                false
                        }) ??
                        interaction.client.user
                            .displayAvatarURL({
                                size:
                                    1024,

                                forceStatic:
                                    false
                            }),

                    fields,

                    footer: {
                        text:
                            `🌙 Umbra • Guardian of Las Noches • Requested by ${interaction.user.username}`,

                        iconURL:
                            interaction.client.user
                                .displayAvatarURL({
                                    size:
                                        128,

                                    forceStatic:
                                        false
                                })
                    }
                });

            espadaEmbed.setAuthor({
                name:
                    `${interaction.guild.name} • Espada Throne Records`,

                iconURL:
                    interaction.guild.iconURL({
                        size:
                            256,

                        forceStatic:
                            false
                    }) ??
                    interaction.client.user
                        .displayAvatarURL({
                            size:
                                256,

                            forceStatic:
                                false
                        })
            });

            await interaction.editReply({
                embeds: [
                    espadaEmbed
                ]
            });
        } catch (error) {
            console.error(
                '❌ Umbra /espada command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Espada Records Unavailable',
                    [
                        'Umbra could not open the official Espada hierarchy.',
                        '',
                        'Please inspect the Northflank logs and verify that the Espada roles still exist.'
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