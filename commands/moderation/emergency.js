const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const channels =
    require('../../config/channels');

const {
    successEmbed,
    errorEmbed
} = require('../../utils/embeds');

const {
    createEmergency,
    getActiveEmergency,
    saveSnapshot,
    getSnapshots,
    releaseEmergency,
    deleteEmergency
} = require('../../database/emergencyStates');

const {
    resolveCase
} = require('../../database/moderationCases');

const {
    recordModerationAction
} = require('../../handlers/moderationService');

const CONFIRMATION = 'CONFIRM';

const PROTECTED_CHANNELS =
    new Set([
        channels.staffChat,
        channels.staffLogs,
        channels.moderation,
        channels.botControl
    ].filter(Boolean));

function getPermissionState(
    overwrite,
    permission
) {
    if (!overwrite) {
        return null;
    }

    if (
        overwrite.allow.has(
            permission
        )
    ) {
        return true;
    }

    if (
        overwrite.deny.has(
            permission
        )
    ) {
        return false;
    }

    return null;
}

function canLockChannel(channel) {
    if (
        !channel ||
        channel.isThread?.()
    ) {
        return false;
    }

    if (
        !channel.isTextBased?.() ||
        !channel.permissionOverwrites
    ) {
        return false;
    }

    if (
        PROTECTED_CHANNELS.has(
            channel.id
        )
    ) {
        return false;
    }

    return true;
}

async function runLockdown(
    interaction,
    reason
) {
    const guild =
        interaction.guild;

    const existing =
        await getActiveEmergency(
            guild.id
        );

    if (existing) {
        return {
            ok: false,
            title:
                'Emergency Already Active',
            description:
                `Emergency #${existing.id} is already active.`
        };
    }

    const botMember =
        guild.members.me;

    if (
        !botMember?.permissions.has(
            PermissionFlagsBits.ManageChannels
        )
    ) {
        return {
            ok: false,
            title:
                'Emergency Failed',
            description:
                'Akane needs Manage Channels permission.'
        };
    }

    let emergency = null;
    let moderationCase = null;

    const changedChannels = [];

    try {
        moderationCase =
            await recordModerationAction({
                guild,

                userId:
                    null,

                moderatorId:
                    interaction.user.id,

                action:
                    'emergency',

                reason,

                metadata: {
                    operation:
                        'lockdown'
                },

                active:
                    true
            });

        emergency =
            await createEmergency({
                guildId:
                    guild.id,

                moderatorId:
                    interaction.user.id,

                caseId:
                    moderationCase.id,

                mode:
                    'lockdown'
            });

        const everyone =
            guild.roles.everyone;

        const candidates =
            guild.channels.cache
                .filter(
                    canLockChannel
                );

        for (
            const channel
            of candidates.values()
        ) {
            const permissions =
                channel.permissionsFor(
                    botMember
                );

            if (
                !permissions?.has(
                    PermissionFlagsBits
                        .ManageChannels
                )
            ) {
                continue;
            }

            const overwrite =
                channel.permissionOverwrites
                    .cache.get(
                        everyone.id
                    );

            const snapshot = {
                emergencyId:
                    emergency.id,

                guildId:
                    guild.id,

                channelId:
                    channel.id,

                previousSendMessages:
                    getPermissionState(
                        overwrite,
                        PermissionFlagsBits
                            .SendMessages
                    ),

                previousSendMessagesInThreads:
                    getPermissionState(
                        overwrite,
                        PermissionFlagsBits
                            .SendMessagesInThreads
                    ),

                previousAddReactions:
                    getPermissionState(
                        overwrite,
                        PermissionFlagsBits
                            .AddReactions
                    )
            };

            await saveSnapshot(
                snapshot
            );

            await channel
                .permissionOverwrites
                .edit(
                    everyone,
                    {
                        SendMessages:
                            false,

                        SendMessagesInThreads:
                            false,

                        AddReactions:
                            false
                    },
                    {
                        reason:
                            `Emergency lockdown: ${reason}`
                    }
                );

            changedChannels.push({
                channel,
                snapshot
            });
        }

        return {
            ok: true,
            emergency,
            moderationCase,
            changed:
                changedChannels.length
        };
    } catch (error) {
        console.error(
            'Emergency lockdown failed:',
            error
        );

        /*
         * Restore every channel already
         * changed during this attempt.
         */
        for (
            const entry
            of changedChannels.reverse()
        ) {
            try {
                await entry.channel
                    .permissionOverwrites
                    .edit(
                        guild.roles.everyone,
                        {
                            SendMessages:
                                entry.snapshot
                                    .previousSendMessages,

                            SendMessagesInThreads:
                                entry.snapshot
                                    .previousSendMessagesInThreads,

                            AddReactions:
                                entry.snapshot
                                    .previousAddReactions
                        },
                        {
                            reason:
                                'Emergency lockdown rollback'
                        }
                    );
            } catch (
                rollbackError
            ) {
                console.error(
                    `Emergency rollback failed for ${entry.channel.id}:`,
                    rollbackError
                );
            }
        }

        if (emergency) {
            try {
                await deleteEmergency(
                    emergency.id
                );
            } catch (
                cleanupError
            ) {
                console.error(
                    'Emergency DB cleanup failed:',
                    cleanupError
                );
            }
        }

        if (moderationCase) {
            try {
                await resolveCase(
                    guild.id,
                    moderationCase.id,
                    {
                        resolvedBy:
                            interaction.user.id,

                        reason:
                            'Emergency lockdown failed and was rolled back.'
                    }
                );
            } catch (
                cleanupError
            ) {
                console.error(
                    'Emergency case cleanup failed:',
                    cleanupError
                );
            }
        }

        throw error;
    }
}

async function runRelease(
    interaction,
    reason
) {
    const guild =
        interaction.guild;

    const emergency =
        await getActiveEmergency(
            guild.id
        );

    if (!emergency) {
        return {
            ok: false,
            title:
                'No Emergency Active',
            description:
                'There is no active emergency lockdown to release.'
        };
    }

    const snapshots =
        await getSnapshots(
            emergency.id
        );

    const botMember =
        guild.members.me;

    const restored = [];

    try {
        for (
            const snapshot
            of snapshots
        ) {
            const channel =
                guild.channels.cache.get(
                    snapshot.channelId
                );

            if (
                !channel ||
                !channel.permissionOverwrites
            ) {
                continue;
            }

            const permissions =
                channel.permissionsFor(
                    botMember
                );

            if (
                !permissions?.has(
                    PermissionFlagsBits
                        .ManageChannels
                )
            ) {
                throw new Error(
                    `Missing ManageChannels in ${channel.id}`
                );
            }

            await channel
                .permissionOverwrites
                .edit(
                    guild.roles.everyone,
                    {
                        SendMessages:
                            snapshot
                                .previousSendMessages,

                        SendMessagesInThreads:
                            snapshot
                                .previousSendMessagesInThreads,

                        AddReactions:
                            snapshot
                                .previousAddReactions
                    },
                    {
                        reason:
                            `Emergency release: ${reason}`
                    }
                );

            restored.push(
                snapshot
            );
        }

        const releaseCase =
            await recordModerationAction({
                guild,

                userId:
                    null,

                moderatorId:
                    interaction.user.id,

                action:
                    'emergency',

                reason,

                metadata: {
                    operation:
                        'release',

                    emergencyId:
                        emergency.id,

                    restoredChannels:
                        restored.length
                },

                active:
                    false
            });

        if (emergency.caseId) {
            await resolveCase(
                guild.id,
                emergency.caseId,
                {
                    resolvedBy:
                        interaction.user.id,

                    reason
                }
            );
        }

        await releaseEmergency(
            emergency.id,
            interaction.user.id
        );

        return {
            ok: true,
            emergency,
            releaseCase,
            restored:
                restored.length
        };
    } catch (error) {
        console.error(
            'Emergency release failed:',
            error
        );

        /*
         * Re-apply lockdown to channels
         * already restored so the emergency
         * remains internally consistent.
         */
        for (
            const snapshot
            of restored.reverse()
        ) {
            const channel =
                guild.channels.cache.get(
                    snapshot.channelId
                );

            if (
                !channel ||
                !channel.permissionOverwrites
            ) {
                continue;
            }

            try {
                await channel
                    .permissionOverwrites
                    .edit(
                        guild.roles.everyone,
                        {
                            SendMessages:
                                false,

                            SendMessagesInThreads:
                                false,

                            AddReactions:
                                false
                        },
                        {
                            reason:
                                'Emergency release rollback'
                        }
                    );
            } catch (
                rollbackError
            ) {
                console.error(
                    `Emergency release rollback failed for ${snapshot.channelId}:`,
                    rollbackError
                );
            }
        }

        throw error;
    }
}

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('emergency')
            .setDescription(
                'Emergency server lockdown controls.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.Administrator
            )

            .addSubcommand(
                subcommand =>
                    subcommand
                        .setName(
                            'lockdown'
                        )
                        .setDescription(
                            'Lock public text channels during an emergency.'
                        )
                        .addStringOption(
                            option =>
                                option
                                    .setName(
                                        'confirm'
                                    )
                                    .setDescription(
                                        'Type CONFIRM to activate the lockdown.'
                                    )
                                    .setRequired(
                                        true
                                    )
                                    .setMaxLength(
                                        20
                                    )
                        )
                        .addStringOption(
                            option =>
                                option
                                    .setName(
                                        'reason'
                                    )
                                    .setDescription(
                                        'Reason for activating emergency lockdown.'
                                    )
                                    .setMaxLength(
                                        500
                                    )
                        )
            )

            .addSubcommand(
                subcommand =>
                    subcommand
                        .setName(
                            'release'
                        )
                        .setDescription(
                            'Restore channels after an emergency lockdown.'
                        )
                        .addStringOption(
                            option =>
                                option
                                    .setName(
                                        'confirm'
                                    )
                                    .setDescription(
                                        'Type CONFIRM to release the lockdown.'
                                    )
                                    .setRequired(
                                        true
                                    )
                                    .setMaxLength(
                                        20
                                    )
                        )
                        .addStringOption(
                            option =>
                                option
                                    .setName(
                                        'reason'
                                    )
                                    .setDescription(
                                        'Reason for releasing emergency lockdown.'
                                    )
                                    .setMaxLength(
                                        500
                                    )
                        )
            ),

    async execute(interaction) {
        const subcommand =
            interaction.options
                .getSubcommand();

        const confirmation =
            interaction.options
                .getString(
                    'confirm',
                    true
                );

        if (
            confirmation !==
            CONFIRMATION
        ) {
            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds: [
                    errorEmbed(
                        'Confirmation Required',
                        'Type **CONFIRM** exactly to use Emergency Control.'
                    )
                ]
            });

            return;
        }

        const reason =
            interaction.options
                .getString(
                    'reason'
                ) ??
            (
                subcommand ===
                'lockdown'
                    ? 'Emergency lockdown activated by staff.'
                    : 'Emergency lockdown released by staff.'
            );

        await interaction.deferReply({
            flags:
                MessageFlags.Ephemeral
        });

        try {
            if (
                subcommand ===
                'lockdown'
            ) {
                const result =
                    await runLockdown(
                        interaction,
                        reason
                    );

                if (!result.ok) {
                    await interaction.editReply({
                        embeds: [
                            errorEmbed(
                                result.title,
                                result.description
                            )
                        ]
                    });

                    return;
                }

                await interaction.editReply({
                    embeds: [
                        successEmbed(
                            'Emergency Lockdown Active',
                            [
                                `Locked channels: **${result.changed}**`,
                                `Emergency: **#${result.emergency.id}**`,
                                `Case: **#${result.moderationCase.id}**`,
                                `Reason: ${reason}`,
                                '',
                                'Staff control channels remain available.'
                            ].join('\n')
                        )
                    ]
                });

                return;
            }

            const result =
                await runRelease(
                    interaction,
                    reason
                );

            if (!result.ok) {
                await interaction.editReply({
                    embeds: [
                        errorEmbed(
                            result.title,
                            result.description
                        )
                    ]
                });

                return;
            }

            await interaction.editReply({
                embeds: [
                    successEmbed(
                        'Emergency Lockdown Released',
                        [
                            `Restored channels: **${result.restored}**`,
                            `Emergency: **#${result.emergency.id}**`,
                            `Case: **#${result.releaseCase.id}**`,
                            `Reason: ${reason}`
                        ].join('\n')
                    )
                ]
            });
        } catch (error) {
            console.error(
                'Emergency command failed:',
                error
            );

            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Emergency Control Failed',
                        'Akane could not safely complete the emergency operation.'
                    )
                ]
            });
        }
    }
};