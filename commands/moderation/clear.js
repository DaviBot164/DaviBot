const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, Collection } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { recordModerationAction } = require('../../handlers/moderationService');
const { markDeletion, forgetDeletion } = require('../../utils/logTracking');

const MAX_DELETE = 1000;
const BULK_DELETE_AGE = 14 * 24 * 60 * 60 * 1000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete multiple recent messages from this channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option => option.setName('amount')
            .setDescription('Number of messages to delete (1–1000).')
            .setRequired(true).setMinValue(1).setMaxValue(MAX_DELETE))
        .addUserOption(option => option.setName('member')
            .setDescription('Only delete messages from this member.'))
        .addStringOption(option => option.setName('reason')
            .setDescription('Reason for clearing the messages.').setMaxLength(500)),

    async execute(interaction) {
        const channel = interaction.channel;
        if (!interaction.inGuild() || !interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ content: 'You need Manage Messages permission in this server.', flags: MessageFlags.Ephemeral });
        }
        if (!channel?.isTextBased() || !channel.messages || typeof channel.bulkDelete !== 'function') {
            return interaction.reply({ content: 'Messages cannot be cleared in this channel.', flags: MessageFlags.Ephemeral });
        }
        const permissions = channel.permissionsFor(interaction.guild.members.me);
        if (!permissions?.has([
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages
        ])) {
            return interaction.reply({ content: 'Akane needs View Channel, Read Message History and Manage Messages.', flags: MessageFlags.Ephemeral });
        }
        const amount = interaction.options.getInteger('amount', true);
        const target = interaction.options.getUser('member');
        const reason = interaction.options.getString('reason') ?? 'Messages cleared by staff.';
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        let deleted = 0;
        try {
            let before;
            while (deleted < amount) {
                const remaining = amount - deleted;
                const limit = target ? 100 : Math.min(100, remaining);
                const messages = await channel.messages.fetch({ limit, ...(before ? { before } : {}) });
                if (!messages.size) break;
                const oldest = messages.last();
                before = oldest.id;
                const recent = messages.filter(message =>
                    (!target || message.author?.id === target.id) &&
                    Date.now() - message.createdTimestamp < BULK_DELETE_AGE
                );
                // Collection.first(n) returns an array; keep a Collection here.
                const candidates = new Collection([...recent].slice(0, remaining));
                if (candidates.size) {
                    for (const id of candidates.keys()) markDeletion(interaction.guildId, id);
                    try {
                        const removed = await channel.bulkDelete(candidates, true);
                        deleted += removed.size;
                        for (const id of candidates.keys()) {
                            if (!removed.has(id)) forgetDeletion(interaction.guildId, id);
                        }
                    } catch (error) {
                        for (const id of candidates.keys()) forgetDeletion(interaction.guildId, id);
                        throw error;
                    }
                }
                if (messages.size < limit || Date.now() - oldest.createdTimestamp >= BULK_DELETE_AGE) break;
            }
            const moderationCase = await recordModerationAction({
                guild: interaction.guild, userId: target?.id ?? null,
                moderatorId: interaction.user.id, action: 'clear', reason,
                channelId: interaction.channelId, active: false, target,
                metadata: { requested: amount, deleted, targetUserId: target?.id ?? null }
            });
            const details = [
                `Deleted: **${deleted}** message${deleted === 1 ? '' : 's'}`,
                `Requested: **${amount}**`, `Case: **#${moderationCase.id}**`,
                ...(target ? [`Member: ${target}`] : []), `Reason: ${reason}`,
                ...(deleted < amount ? ['No more eligible recent messages were found. Messages older than 14 days were not deleted.'] : [])
            ];
            return interaction.editReply({ embeds: [successEmbed('Messages Cleared', details.join('\n'))], allowedMentions: { parse: [] } });
        } catch (error) {
            console.error('Clear command failed:', error);
            return interaction.editReply({
                embeds: [errorEmbed('Clear Failed', `Confirmed deleted: ${deleted}. Akane could not finish the operation or record its case. Check the runtime logs before retrying.`)],
                allowedMentions: { parse: [] }
            });
        }
    }
};
