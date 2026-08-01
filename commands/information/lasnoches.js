const {
    SlashCommandBuilder,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
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
 * Button identifiers.
 */
const PAGE_IDS = {
    highCommand:
        'lasnoches_high_command',

    espada:
        'lasnoches_espada',

    population:
        'lasnoches_population',

    overview:
        'lasnoches_overview'
};

/**
 * Administrative roles displayed
 * inside the Las Noches command.
 */
const STAFF_ROLES = [
    '⚜️ Head Captain',
    '🛡️ Captain',
    '⚔️ Lieutenant'
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
    limit = 10
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
 * Format a Discord timestamp.
 *
 * @param {number|Date|string|null} value
 * @returns {string}
 */
function formatDiscordDate(
    value
) {
    if (!value) {
        return 'Unknown';
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
        return 'Unknown';
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
 * Create the navigation button row.
 *
 * @param {string} activePage
 * @param {boolean} disabled
 * @returns {ActionRowBuilder<ButtonBuilder>}
 */
function createNavigationRow(
    activePage,
    disabled = false
) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    PAGE_IDS.highCommand
                )
                .setLabel(
                    'High Command'
                )
                .setEmoji(
                    '👑'
                )
                .setStyle(
                    activePage ===
                    PAGE_IDS.highCommand
                        ? ButtonStyle.Primary
                        : ButtonStyle.Secondary
                )
                .setDisabled(
                    disabled
                ),

            new ButtonBuilder()
                .setCustomId(
                    PAGE_IDS.espada
                )
                .setLabel(
                    'Espada'
                )
                .setEmoji(
                    '⚔️'
                )
                .setStyle(
                    activePage ===
                    PAGE_IDS.espada
                        ? ButtonStyle.Primary
                        : ButtonStyle.Secondary
                )
                .setDisabled(
                    disabled
                ),

            new ButtonBuilder()
                .setCustomId(
                    PAGE_IDS.population
                )
                .setLabel(
                    'Population'
                )
                .setEmoji(
                    '👁️'
                )
                .setStyle(
                    activePage ===
                    PAGE_IDS.population
                        ? ButtonStyle.Primary
                        : ButtonStyle.Secondary
                )
                .setDisabled(
                    disabled
                ),

            new ButtonBuilder()
                .setCustomId(
                    PAGE_IDS.overview
                )
                .setLabel(
                    'Overview'
                )
                .setEmoji(
                    '📊'
                )
                .setStyle(
                    activePage ===
                    PAGE_IDS.overview
                        ? ButtonStyle.Primary
                        : ButtonStyle.Secondary
                )
                .setDisabled(
                    disabled
                )
        );
}

/**
 * Create the shared base embed.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} title
 * @param {string} pageDescription
 * @returns {import('discord.js').EmbedBuilder}
 */
function createKingdomEmbed(
    interaction,
    title,
    pageDescription
) {
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

    const embed =
        createEmbed({
            title,

            description:
                [
                    pageDescription,
                    '',
                    WIDE_DIVIDER,
                    '',
                    '*Every Soul and throne is preserved beneath the eternal moon of Las Noches.*'
                ].join('\n'),

            color:
                LAS_NOCHES_COLOR,

            thumbnail:
                guildIcon ??
                botAvatar,

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

    embed.setAuthor({
        name:
            `${interaction.guild.name} • Central Kingdom Records`,

        iconURL:
            guildIcon ??
            botAvatar
    });

    return embed;
}/**
 * Build the High Command page.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildHighCommandPage(
    interaction
) {
    const embed =
        createKingdomEmbed(
            interaction,
            '👑 High Command of Las Noches',
            'Umbra has opened the official leadership records of the eternal kingdom.'
        );

    const owner =
        interaction.guild.members.cache.get(
            interaction.guild.ownerId
        );

    embed.addFields({
        name:
            '👑 Ruler of Las Noches',

        value:
            owner
                ? [
                    `${owner}`,
                    `-# ${owner.user.tag}`,
                    `-# Soul ID: ${owner.id}`
                ].join('\n')
                : '🌑 The ruler could not be located.',

        inline:
            false
    });

    for (
        const roleName
        of STAFF_ROLES
    ) {
        const role =
            findGuildRole(
                interaction.guild,
                roleName
            );

        if (!role) {
            embed.addFields({
                name:
                    roleName,

                value:
                    [
                        '⚠️ Role Missing',
                        '-# Umbra could not locate this administrative role.'
                    ].join('\n'),

                inline:
                    false
            });

            continue;
        }

        const members =
            getHumanRoleMembers(
                role
            );

        embed.addFields({
            name:
                roleName,

            value:
                formatMemberList(
                    members,
                    '🌑 Vacant',
                    10
                ),

            inline:
                false
        });
    }

    const leadershipIds =
        new Set();

    if (owner) {
        leadershipIds.add(
            owner.id
        );
    }

    for (
        const roleName
        of STAFF_ROLES
    ) {
        const role =
            findGuildRole(
                interaction.guild,
                roleName
            );

        const members =
            getHumanRoleMembers(
                role
            );

        for (
            const member
            of members
        ) {
            leadershipIds.add(
                member.id
            );
        }
    }

    embed.addFields({
        name:
            '📊 High Command Status',

        value:
            [
                `👑 **Recognized Leaders:** \`${leadershipIds.size}\``,
                `⚜️ **Administrative Divisions:** \`${STAFF_ROLES.length + 1}\``,
                '',
                '-# Lieutenants may moderate members, but they cannot manage the Arrancar Rank hierarchy.'
            ].join('\n'),

        inline:
            false
    });

    return embed;
}

/**
 * Build the Espada hierarchy page.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildEspadaPage(
    interaction
) {
    const embed =
        createKingdomEmbed(
            interaction,
            '⚔️ Espada Throne Records',
            'Umbra has opened the official hierarchy of the strongest Arrancar in Las Noches.'
        );

    let occupiedPositions =
        0;

    let missingRoles =
        0;

    const uniqueEspada =
        new Set();

    for (
        const roleName
        of ESPADA_ROLES
    ) {
        const role =
            findGuildRole(
                interaction.guild,
                roleName
            );

        if (!role) {
            missingRoles +=
                1;

            embed.addFields({
                name:
                    roleName,

                value:
                    [
                        '⚠️ Role Missing',
                        '-# Create this Discord role using the exact configured name.'
                    ].join('\n'),

                inline:
                    true
            });

            continue;
        }

        const members =
            getHumanRoleMembers(
                role
            );

        if (
            members.length === 0
        ) {
            embed.addFields({
                name:
                    roleName,

                value:
                    [
                        '🌑 Vacant',
                        '-# This throne awaits a worthy Soul.'
                    ].join('\n'),

                inline:
                    true
            });

            continue;
        }

        occupiedPositions +=
            1;

        for (
            const member
            of members
        ) {
            uniqueEspada.add(
                member.id
            );
        }

        if (
            members.length === 1
        ) {
            const holder =
                members[0];

            embed.addFields({
                name:
                    roleName,

                value:
                    [
                        `${holder}`,
                        `-# ${holder.user.tag}`,
                        `-# Soul ID: ${holder.id}`
                    ].join('\n'),

                inline:
                    true
            });

            continue;
        }

        embed.addFields({
            name:
                roleName,

            value:
                [
                    `⚠️ **${members.length} holders detected**`,
                    '',
                    formatMemberList(
                        members,
                        '🌑 Vacant',
                        5
                    ),
                    '',
                    '-# Only one Soul should hold each Espada position.'
                ].join('\n'),

            inline:
                true
        });
    }

    const vacantPositions =
        ESPADA_ROLES.length -
        occupiedPositions -
        missingRoles;

    embed.addFields({
        name:
            '📊 Espada Hierarchy Status',

        value:
            [
                `⚔️ **Active Espada Souls:** \`${uniqueEspada.size}\``,
                `👑 **Occupied Thrones:** \`${occupiedPositions} / ${ESPADA_ROLES.length}\``,
                `🌑 **Vacant Thrones:** \`${Math.max(0, vacantPositions)}\``,
                `⚠️ **Missing Roles:** \`${missingRoles}\``
            ].join('\n'),

        inline:
            false
    });

    return embed;
}

/**
 * Build the population page.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildPopulationPage(
    interaction
) {
    const embed =
        createKingdomEmbed(
            interaction,
            '👁️ Population of Las Noches',
            'Umbra has opened the spiritual population records of every evolution and Arrancar class.'
        );

    const evolutionLines = [];

    const evolutionMemberIds =
        new Set();

    let missingEvolutionRoles =
        0;

    for (
        const roleName
        of HOLLOW_EVOLUTION_ROLES
    ) {
        const role =
            findGuildRole(
                interaction.guild,
                roleName
            );

        if (!role) {
            missingEvolutionRoles +=
                1;

            evolutionLines.push(
                `**${roleName}:** \`Role Missing\``
            );

            continue;
        }

        const members =
            getHumanRoleMembers(
                role
            );

        for (
            const member
            of members
        ) {
            evolutionMemberIds.add(
                member.id
            );
        }

        evolutionLines.push(
            `**${roleName}:** \`${members.length}\``
        );
    }

    const hierarchyLines = [];

    const hierarchyMemberIds =
        new Set();

    let missingHierarchyRoles =
        0;

    for (
        const roleName
        of ARRANCAR_HIERARCHY_ROLES
    ) {
        const role =
            findGuildRole(
                interaction.guild,
                roleName
            );

        if (!role) {
            missingHierarchyRoles +=
                1;

            hierarchyLines.push(
                `**${roleName}:** \`Role Missing\``
            );

            continue;
        }

        const members =
            getHumanRoleMembers(
                role
            );

        for (
            const member
            of members
        ) {
            hierarchyMemberIds.add(
                member.id
            );
        }

        hierarchyLines.push(
            `**${roleName}:** \`${members.length}\``
        );
    }

    const espadaMemberIds =
        new Set();

    for (
        const roleName
        of ESPADA_ROLES
    ) {
        const role =
            findGuildRole(
                interaction.guild,
                roleName
            );

        const members =
            getHumanRoleMembers(
                role
            );

        for (
            const member
            of members
        ) {
            espadaMemberIds.add(
                member.id
            );
        }
    }

    embed.addFields(
        {
            name:
                '👁️ Hollow Evolution',

            value:
                evolutionLines.join(
                    '\n'
                ),

            inline:
                true
        },
        {
            name:
                '🌙 Arrancar Hierarchy',

            value:
                hierarchyLines.join(
                    '\n'
                ),

            inline:
                true
        },
        {
            name:
                '📊 Spiritual Census',

            value:
                [
                    `👥 **Evolution Records:** \`${evolutionMemberIds.size}\` unique Souls`,
                    `⚔️ **Manual Hierarchy Records:** \`${hierarchyMemberIds.size}\` unique Souls`,
                    `👑 **Espada Souls:** \`${espadaMemberIds.size}\``,
                    '',
                    `⚠️ **Missing Evolution Roles:** \`${missingEvolutionRoles}\``,
                    `⚠️ **Missing Hierarchy Roles:** \`${missingHierarchyRoles}\``,
                    '',
                    '-# Evolution and Arrancar Rank are independent systems, so one Soul may appear in both records.'
                ].join('\n'),

            inline:
                false
        }
    );

    return embed;
}

/**
 * Build the kingdom overview page.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildOverviewPage(
    interaction
) {
    const embed =
        createKingdomEmbed(
            interaction,
            '📊 Las Noches Kingdom Overview',
            'Umbra has opened the central statistics and structural records of the kingdom.'
        );

    const humanMembers =
        interaction.guild.members.cache.filter(
            member =>
                !member.user.bot
        );

    const botMembers =
        interaction.guild.members.cache.filter(
            member =>
                member.user.bot
        );

    const textChannels =
        interaction.guild.channels.cache.filter(
            channel =>
                channel.isTextBased() &&
                !channel.isThread()
        );

    const voiceChannels =
        interaction.guild.channels.cache.filter(
            channel =>
                channel.isVoiceBased()
        );

    const categories =
        interaction.guild.channels.cache.filter(
            channel =>
                channel.type === 4
        );

    const activeEspadaIds =
        new Set();

    let occupiedEspadaPositions =
        0;

    for (
        const roleName
        of ESPADA_ROLES
    ) {
        const role =
            findGuildRole(
                interaction.guild,
                roleName
            );

        const members =
            getHumanRoleMembers(
                role
            );

        if (
            members.length >
            0
        ) {
            occupiedEspadaPositions +=
                1;
        }

        for (
            const member
            of members
        ) {
            activeEspadaIds.add(
                member.id
            );
        }
    }

    const owner =
        interaction.guild.members.cache.get(
            interaction.guild.ownerId
        );

    embed.addFields(
        {
            name:
                '🌙 Kingdom Identity',

            value:
                [
                    `**Kingdom Name:** ${interaction.guild.name}`,
                    `**Kingdom ID:** \`${interaction.guild.id}\``,
                    `**Ruler:** ${owner || 'Unknown'}`,
                    `**Established:** ${formatDiscordDate(interaction.guild.createdTimestamp)}`
                ].join('\n'),

            inline:
                false
        },
        {
            name:
                '👥 Population',

            value:
                [
                    `**Total Members:** \`${interaction.guild.memberCount}\``,
                    `**Registered Souls:** \`${humanMembers.size}\``,
                    `**Guardians and Bots:** \`${botMembers.size}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '🏰 Kingdom Structure',

            value:
                [
                    `**Categories:** \`${categories.size}\``,
                    `**Text Channels:** \`${textChannels.size}\``,
                    `**Voice Channels:** \`${voiceChannels.size}\``,
                    `**Roles:** \`${interaction.guild.roles.cache.size - 1}\``
                ].join('\n'),

            inline:
                true
        },
        {
            name:
                '⚔️ Espada Status',

            value:
                [
                    `**Active Espada Souls:** \`${activeEspadaIds.size}\``,
                    `**Occupied Thrones:** \`${occupiedEspadaPositions} / ${ESPADA_ROLES.length}\``,
                    `**Vacant Thrones:** \`${ESPADA_ROLES.length - occupiedEspadaPositions}\``
                ].join('\n'),

            inline:
                false
        }
    );

    return embed;
}

/**
 * Build the requested Las Noches page.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} pageId
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildPage(
    interaction,
    pageId
) {
    switch (pageId) {
        case PAGE_IDS.espada:
            return buildEspadaPage(
                interaction
            );

        case PAGE_IDS.population:
            return buildPopulationPage(
                interaction
            );

        case PAGE_IDS.overview:
            return buildOverviewPage(
                interaction
            );

        case PAGE_IDS.highCommand:
        default:
            return buildHighCommandPage(
                interaction
            );
    }
}module.exports = {
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
             * Refresh guild member data so role
             * membership and population records
             * are as current as possible.
             */
            await interaction.guild.members
                .fetch()
                .catch(
                    () => null
                );

            let activePage =
                PAGE_IDS.highCommand;

            const initialEmbed =
                buildPage(
                    interaction,
                    activePage
                );

            const replyMessage =
                await interaction.editReply({
                    embeds: [
                        initialEmbed
                    ],

                    components: [
                        createNavigationRow(
                            activePage
                        )
                    ],

                    fetchReply:
                        true
                });

            const collector =
                replyMessage.createMessageComponentCollector({
                    componentType:
                        ComponentType.Button,

                    time:
                        5 * 60 * 1000
                });

            collector.on(
                'collect',
                async buttonInteraction => {
                    try {
                        if (
                            buttonInteraction.user.id !==
                            interaction.user.id
                        ) {
                            await buttonInteraction.reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Private Kingdom Panel',
                                        'Only the Soul who opened this Las Noches panel may control its navigation.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            });

                            return;
                        }

                        if (
                            !Object.values(
                                PAGE_IDS
                            ).includes(
                                buttonInteraction.customId
                            )
                        ) {
                            return;
                        }

                        activePage =
                            buttonInteraction.customId;

                        const updatedEmbed =
                            buildPage(
                                interaction,
                                activePage
                            );

                        await buttonInteraction.update({
                            embeds: [
                                updatedEmbed
                            ],

                            components: [
                                createNavigationRow(
                                    activePage
                                )
                            ]
                        });
                    } catch (buttonError) {
                        console.error(
                            '❌ Umbra Las Noches navigation error:',
                            buttonError
                        );

                        if (
                            buttonInteraction.deferred ||
                            buttonInteraction.replied
                        ) {
                            await buttonInteraction
                                .followUp({
                                    embeds: [
                                        createErrorEmbed(
                                            '❌ Navigation Failed',
                                            'Umbra could not open the selected kingdom record page.'
                                        )
                                    ],

                                    flags:
                                        MessageFlags.Ephemeral
                                })
                                .catch(
                                    () => null
                                );

                            return;
                        }

                        await buttonInteraction
                            .reply({
                                embeds: [
                                    createErrorEmbed(
                                        '❌ Navigation Failed',
                                        'Umbra could not open the selected kingdom record page.'
                                    )
                                ],

                                flags:
                                    MessageFlags.Ephemeral
                            })
                            .catch(
                                () => null
                            );
                    }
                }
            );

            collector.on(
                'end',
                async () => {
                    await interaction
                        .editReply({
                            components: [
                                createNavigationRow(
                                    activePage,
                                    true
                                )
                            ]
                        })
                        .catch(
                            () => null
                        );
                }
            );
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
                        ],

                        components:
                            []
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