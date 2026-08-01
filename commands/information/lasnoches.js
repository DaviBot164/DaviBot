const {
    SlashCommandBuilder,
    MessageFlags
} = require('discord.js');

const {
    createEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

/**
 * Las Noches silver embed color.
 */
const LAS_NOCHES_COLOR =
    '#E8E8E8';

/**
 * Visual divider used throughout
 * the Las Noches kingdom panel.
 */
const WIDE_DIVIDER =
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

/**
 * Administrative roles displayed
 * inside the Las Noches command.
 */
const STAFF_ROLES = [
    {
        name:
            '👑 Ruler of Las Noches',

        fallback:
            'Server Owner'
    },
    {
        name:
            '⚜️ Head Captain',

        fallback:
            'Vacant'
    },
    {
        name:
            '🛡️ Captain',

        fallback:
            'Vacant'
    },
    {
        name:
            '⚔️ Lieutenant',

        fallback:
            'Vacant'
    }
];

/**
 * Official Espada positions.
 */
const ESPADA_ROLES = [
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
 * Hollow Evolution roles managed
 * automatically by the Level System.
 */
const HOLLOW_EVOLUTION_ROLES = [
    '👁️ Hollow',
    '🦴 Menos Grande',
    '⚪ Gillian',
    '🐺 Adjuchas',
    '👑 Vasto Lorde',
    '⚔️ Arrancar'
];

/**
 * Additional manually assigned
 * Arrancar hierarchy roles.
 */
const ARRANCAR_HIERARCHY_ROLES = [
    '🌘 Privaron Espada',
    '⚔️ Fracción',
    '🦴 Numeros',
    '⚪ Unranked Arrancar'
];

/**
 * Find a Discord role using its
 * exact configured name.
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
 * Get non-bot members belonging
 * to a specific role.
 *
 * @param {import('discord.js').Role|null} role
 * @returns {import('discord.js').GuildMember[]}
 */
function getHumanRoleMembers(
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
 * Convert a member list into a
 * readable Discord display.
 *
 * @param {import('discord.js').GuildMember[]} members
 * @param {string} emptyText
 * @param {number} limit
 * @returns {string}
 */
function formatMemberList(
    members,
    emptyText = '🌑 Vacant',
    limit = 8
) {
    if (
        !Array.isArray(members) ||
        members.length === 0
    ) {
        return emptyText;
    }

    const visibleMembers =
        members.slice(
            0,
            limit
        );

    const lines =
        visibleMembers.map(
            member =>
                `${member}`
        );

    const remaining =
        members.length -
        visibleMembers.length;

    if (remaining > 0) {
        lines.push(
            `-# +${remaining} additional Souls`
        );
    }

    return lines.join('\n');
}

/**
 * Find the Las Noches server owner.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {import('discord.js').GuildMember|null}
 */
function getOwnerMember(
    guild
) {
    return (
        guild.members.cache.get(
            guild.ownerId
        ) ||
        null
    );
}

/**
 * Build the High Command section.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {string}
 */
function buildHighCommandDisplay(
    guild
) {
    const lines = [];

    for (
        const staffRoleConfig
        of STAFF_ROLES
    ) {
        if (
            staffRoleConfig.name ===
            '👑 Ruler of Las Noches'
        ) {
            const owner =
                getOwnerMember(
                    guild
                );

            lines.push(
                `**${staffRoleConfig.name}**`,
                owner
                    ? `${owner}`
                    : staffRoleConfig.fallback,
                ''
            );

            continue;
        }

        const role =
            findGuildRole(
                guild,
                staffRoleConfig.name
            );

        const members =
            getHumanRoleMembers(
                role
            );

        lines.push(
            `**${staffRoleConfig.name}**`,
            formatMemberList(
                members,
                `🌑 ${staffRoleConfig.fallback}`,
                6
            ),
            ''
        );
    }

    return lines
        .join('\n')
        .trim();
}

/**
 * Build the Espada throne section.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {{
 *     display: string,
 *     activePositions: number,
 *     vacantPositions: number,
 *     uniqueEspada: number,
 *     missingRoles: string[]
 * }}
 */
function buildEspadaDisplay(
    guild
) {
    const lines = [];

    const uniqueMemberIds =
        new Set();

    const missingRoles = [];

    let activePositions =
        0;

    for (
        const roleName
        of ESPADA_ROLES
    ) {
        const role =
            findGuildRole(
                guild,
                roleName
            );

        if (!role) {
            missingRoles.push(
                roleName
            );

            lines.push(
                `**${roleName}** — ⚠️ Role Missing`
            );

            continue;
        }

        const members =
            getHumanRoleMembers(
                role
            );

        if (
            members.length === 0
        ) {
            lines.push(
                `**${roleName}** — 🌑 Vacant`
            );

            continue;
        }

        activePositions +=
            1;

        for (
            const member
            of members
        ) {
            uniqueMemberIds.add(
                member.id
            );
        }

        if (
            members.length === 1
        ) {
            lines.push(
                `**${roleName}** — ${members[0]}`
            );

            continue;
        }

        lines.push(
            `**${roleName}** — ⚠️ ${members.length} holders`,
            members
                .map(
                    member =>
                        `- ${member}`
                )
                .join('\n')
        );
    }

    return {
        display:
            lines.join('\n'),

        activePositions,

        vacantPositions:
            ESPADA_ROLES.length -
            activePositions,

        uniqueEspada:
            uniqueMemberIds.size,

        missingRoles
    };
}

/**
 * Build the Hollow Evolution
 * population section.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {{
 *     display: string,
 *     totalAssignments: number,
 *     missingRoles: string[]
 * }}
 */
function buildEvolutionPopulation(
    guild
) {
    const lines = [];

    const missingRoles = [];

    let totalAssignments =
        0;

    for (
        const roleName
        of HOLLOW_EVOLUTION_ROLES
    ) {
        const role =
            findGuildRole(
                guild,
                roleName
            );

        if (!role) {
            missingRoles.push(
                roleName
            );

            lines.push(
                `**${roleName}:** \`Role Missing\``
            );

            continue;
        }

        const memberCount =
            getHumanRoleMembers(
                role
            ).length;

        totalAssignments +=
            memberCount;

        lines.push(
            `**${roleName}:** \`${memberCount}\``
        );
    }

    return {
        display:
            lines.join('\n'),

        totalAssignments,

        missingRoles
    };
}

/**
 * Build the manually assigned Arrancar
 * hierarchy population section.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {{
 *     display: string,
 *     totalAssignments: number,
 *     missingRoles: string[]
 * }}
 */
function buildArrancarPopulation(
    guild
) {
    const lines = [];

    const missingRoles = [];

    let totalAssignments =
        0;

    for (
        const roleName
        of ARRANCAR_HIERARCHY_ROLES
    ) {
        const role =
            findGuildRole(
                guild,
                roleName
            );

        if (!role) {
            missingRoles.push(
                roleName
            );

            lines.push(
                `**${roleName}:** \`Role Missing\``
            );

            continue;
        }

        const memberCount =
            getHumanRoleMembers(
                role
            ).length;

        totalAssignments +=
            memberCount;

        lines.push(
            `**${roleName}:** \`${memberCount}\``
        );
    }

    return {
        display:
            lines.join('\n'),

        totalAssignments,

        missingRoles
    };
}

/**
 * Count non-bot server members.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {number}
 */
function countHumanMembers(
    guild
) {
    return guild.members.cache.filter(
        member =>
            !member.user.bot
    ).size;
}

/**
 * Count server bots.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {number}
 */
function countBots(
    guild
) {
    return guild.members.cache.filter(
        member =>
            member.user.bot
    ).size;
}

/**
 * Format the server creation date.
 *
 * @param {number} timestamp
 * @returns {string}
 */
function formatDiscordDate(
    timestamp
) {
    if (!timestamp) {
        return 'Unknown';
    }

    const unixTimestamp =
        Math.floor(
            timestamp /
            1000
        );

    return (
        `<t:${unixTimestamp}:D> ` +
        `(<t:${unixTimestamp}:R>)`
    );
}

module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'lasnoches'
            )
            .setDescription(
                'Open the central kingdom records of Las Noches.'
            )
            .setDMPermission(
                false
            ),

    /**
     * Execute the /lasnoches command.
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
             * Refresh members so role population
             * statistics are as current as possible.
             */
            await interaction.guild.members
                .fetch()
                .catch(
                    () => null
                );

            const highCommandDisplay =
                buildHighCommandDisplay(
                    interaction.guild
                );

            const espadaData =
                buildEspadaDisplay(
                    interaction.guild
                );

            const evolutionData =
                buildEvolutionPopulation(
                    interaction.guild
                );

            const arrancarData =
                buildArrancarPopulation(
                    interaction.guild
                );

            const humanMembers =
                countHumanMembers(
                    interaction.guild
                );

            const botMembers =
                countBots(
                    interaction.guild
                );

            const totalMembers =
                interaction.guild.memberCount;

            const missingRoles = [
                ...espadaData.missingRoles,
                ...evolutionData.missingRoles,
                ...arrancarData.missingRoles
            ];

            const fields = [
                {
                    name:
                        '👑 High Command',

                    value:
                        highCommandDisplay,

                    inline:
                        false
                },
                {
                    name:
                        '⚔️ Espada Thrones',

                    value:
                        espadaData.display,

                    inline:
                        false
                },
                {
                    name:
                        '👁️ Hollow Evolution Population',

                    value:
                        evolutionData.display,

                    inline:
                        true
                },
                {
                    name:
                        '🌙 Arrancar Hierarchy Population',

                    value:
                        arrancarData.display,

                    inline:
                        true
                },
                {
                    name:
                        '📊 Kingdom Overview',

                    value:
                        [
                            `👥 **Total Members:** \`${totalMembers}\``,
                            `🌙 **Registered Souls:** \`${humanMembers}\``,
                            `🤖 **Guardians and Bots:** \`${botMembers}\``,
                            '',
                            `⚔️ **Active Espada Souls:** \`${espadaData.uniqueEspada}\``,
                            `👑 **Occupied Thrones:** \`${espadaData.activePositions} / ${ESPADA_ROLES.length}\``,
                            `🌑 **Vacant Thrones:** \`${espadaData.vacantPositions}\``,
                            '',
                            `📅 **Kingdom Established:** ${formatDiscordDate(interaction.guild.createdTimestamp)}`
                        ].join('\n'),

                    inline:
                        false
                }
            ];

            if (
                missingRoles.length >
                0
            ) {
                fields.push({
                    name:
                        '⚠️ Missing Kingdom Roles',

                    value:
                        [
                            'Umbra could not locate the following roles:',
                            '',
                            ...[
                                ...new Set(
                                    missingRoles
                                )
                            ].map(
                                roleName =>
                                    `• ${roleName}`
                            ),
                            '',
                            '-# Role names must match Umbra’s configuration exactly.'
                        ].join('\n'),

                    inline:
                        false
                });
            }

            const guildIcon =
                interaction.guild.iconURL({
                    size:
                        1024,

                    forceStatic:
                        false
                });

            const botAvatar =
                interaction.client.user
                    .displayAvatarURL({
                        size:
                            1024,

                        forceStatic:
                            false
                    });

            const lasNochesEmbed =
                createEmbed({
                    title:
                        '🌙 The Eternal Kingdom of Las Noches',

                    description:
                        [
                            'Umbra has opened the central records of the kingdom.',
                            '',
                            WIDE_DIVIDER,
                            '',
                            '*Beyond the endless white sands, every Soul, evolution and throne is preserved beneath the eternal moon.*'
                        ].join('\n'),

                    color:
                        LAS_NOCHES_COLOR,

                    thumbnail:
                        guildIcon ??
                        botAvatar,

                    fields,

                    footer: {
                        text:
                            `🌙 Umbra • Guardian of Las Noches • Opened by ${interaction.user.username}`,

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

            lasNochesEmbed.setAuthor({
                name:
                    `${interaction.guild.name} • Central Kingdom Records`,

                iconURL:
                    guildIcon ??
                    botAvatar
            });

            await interaction.editReply({
                embeds: [
                    lasNochesEmbed
                ]
            });
        } catch (error) {
            console.error(
                '❌ Umbra /lasnoches command error:',
                error
            );

            const errorEmbed =
                createErrorEmbed(
                    '❌ Kingdom Records Unavailable',
                    [
                        'Umbra could not open the central records of Las Noches.',
                        '',
                        'Please inspect the Northflank logs and verify that the configured kingdom roles still exist.'
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