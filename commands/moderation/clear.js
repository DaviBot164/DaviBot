const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    successEmbed,
    errorEmbed
} = require('../../utils/embeds');

const {
    recordModerationAction
} = require('../../handlers/moderationService');

const MAX_DELETE = 1000;
const BATCH_SIZE = 100;

const BULK_DELETE_AGE =
    14 *
    24 *
    60 *
    60 *
    1000;

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('clear')
            .setDescription(
                'Delete multiple recent messages from this channel.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ManageMessages
            )
            .addIntegerOption(option =>
                option
                    .setName('amount')
                    .setDescription(
                        'Number of messages to delete (1–1000).'
                    )
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(
                        MAX_DELETE
                    )
            )
            .addUserOption(option =>
                option
                    .setName('member')
                    .setDescription(
                        'Only delete messages from this member.'
                    )
            )
            .addStringOption(option =>
                option
                    .setName('reason')
                    .setDescription(
                        'Reason for clearing the messages.'
                    )
                    .setMaxLength(500)
            ),

    async execute(interaction) {
        const amount =
            interaction.options
                .getInteger(
                    'amount',
                    true
                );

        const target =
            interaction.options
                .getUser(
                    'member'
                );

        const reason =
            interaction.options
                .getString(
                    'reason'
                ) ??
            'Messages cleared by staff.';

        const channel =
            interaction.channel;

        if (
            !channel ||
            !channel.isTextBased() ||
            !channel.messages
        ) {
            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds: [
                    errorEmbed(
                        'Clear Failed',
                        'Messages cannot be cleared in this channel.'
                    )
                ]
            });

            return;
        }

        const botMember =
            interaction.guild.members.me;

        const permissions =
            channel.permissionsFor(
                botMember
            );

        if (
            !permissions?.has(
                PermissionFlagsBits.ManageMessages
            )
        ) {
            await interaction.reply({
                flags:
                    MessageFlags.Ephemeral,

                embeds: [
                    errorEmbed(
                        'Clear Failed',
                        'Akane needs Manage Messages permission in this channel.'
                    )
                ]
            });

            return;
        }

        await interaction.deferReply({
            flags:
                MessageFlags.Ephemeral
        });

        try {
            let deleted = 0;
            let before = null;
            let exhausted = false;

            while (
                deleted < amount &&
                !exhausted
            ) {
                const remaining =
                    amount - deleted;

                const fetchLimit =
                    Math.min(
                        BATCH_SIZE,
                        target
                            ? BATCH_SIZE
                            : remaining
                    );

                const messages =
                    await channel.messages
                        .fetch({
                            limit:
                                fetchLimit,

                            ...(before
                                ? {
                                    before
                                }
                                : {})
                        });

                if (!messages.size) {
                    break;
                }

                before =
                    messages.last().id;

                let candidates =
                    messages;

                if (target) {
                    candidates =
                        messages.filter(
                            message =>
                                message
                                    .author
                                    .id ===
                                target.id
                        );
                }

                candidates =
                    candidates.filter(
                        message =>
                            Date.now() -
                                message
                                    .createdTimestamp <
                            BULK_DELETE_AGE
                    );

                if (
                    candidates.size >
                    remaining
                ) {
                    candidates =
                        candidates.first(
                            remaining
                        );
                }

                if (
                    candidates.size
                ) {
                    const removed =
                        await channel.bulkDelete(
                            candidates,
                            true
                        );

                    deleted +=
                        removed.size;
                }

                if (
                    messages.size <
                    fetchLimit
                ) {
                    exhausted = true;
                }

                const oldest =
                    messages.last();

                if (
                    oldest &&
                    Date.now() -
                        oldest.createdTimestamp >=
                        BULK_DELETE_AGE
                ) {
                    exhausted = true;
                }
            }

            const moderationCase =
                await recordModerationAction({
                    guild:
                        interaction.guild,

                    userId:
                        target?.id ??
                        null,

                    moderatorId:
                        interaction.user.id,

                    action:
                        'clear',

                    reason,

                    channelId:
                        interaction.channelId,

                    metadata: {
                        requested:
                            amount,

                        deleted,

                        targetUserId:
                            target?.id ??
                            null
                    },

                    active:
                        false,

                    target:
                        target ??
                        null
                });

            const details = [
                `Deleted: **${deleted}** message${
                    deleted === 1
                        ? ''
                        : 's'
                }`,
                `Requested: **${amount}**`,
                `Case: **#${moderationCase.id}**`
            ];

            if (target) {
                details.push(
                    `Member: ${target}`
                );
            }

            details.push(
                `Reason: ${reason}`
            );

            if (
                deleted < amount
            ) {
                details.push(
                    '',
                    'No more eligible recent messages were found. Discord bulk deletion does not support messages older than 14 days.'
                );
            }

            await interaction.editReply({
                embeds: [
                    successEmbed(
                        'Messages Cleared',
                        details.join('\n')
                    )
                ]
            });
        } catch (error) {
            console.error(
                'Clear command failed:',
                error
            );

            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Clear Failed',
                        'Akane could not finish clearing the messages.'
                    )
                ]
            });
        }
    }
};