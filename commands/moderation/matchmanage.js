const {serverText}=require("../../utils/guildContext");
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getMatch } = require('../../database/matches');
const { forceCancelMatch } = require('../../database/matchModeration');
const { resolveMatchDispute } = require('../../database/matchResults');
const { refreshMatchPanel } = require('../../utils/matches/refreshMatchPanel');
const ACTIONS = [
    { name: 'Cancel Match', value: 'cancel' },
    { name: 'Crimson Wins', value: 'crimson' },
    { name: 'Azure Wins', value: 'azure' }
];
module.exports = {
    data: new SlashCommandBuilder()
        .setName('matchmanage')
        .setDescription(serverText('Manage Blood Moon PvP matches.'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option => option
        .setName('action')
        .setDescription('Choose a moderation action.')
        .setRequired(true)
        .addChoices(...ACTIONS))
        .addStringOption(option => option
        .setName('match_id')
        .setDescription('The match ID.')
        .setRequired(true)),
    async execute(interaction) {
        if (!interaction.inGuild()) {
            return interaction.reply({
                content: 'This command is server-only.',
                flags: MessageFlags.Ephemeral
            });
        }
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                content: 'You need Manage Server permission.',
                flags: MessageFlags.Ephemeral
            });
        }
        await interaction.deferReply({
            flags: MessageFlags.Ephemeral
        });
        const action = interaction.options.getString('action', true);
        const matchId = interaction.options.getString('match_id', true).trim();
        if (!/^[1-9]\d*$/.test(matchId)) {
            return interaction.editReply({
                content: '⚠️ Invalid match ID.'
            });
        }
        try {
            const match = await getMatch(interaction.guildId, matchId);
            if (!match) {
                throw new Error('Match not found.');
            }
            if (action === 'cancel') {
                await forceCancelMatch(interaction.guildId, matchId);
            }
            else {
                await resolveMatchDispute(interaction.guildId, matchId, action);
            }
            let panelUpdated = false;
            try {
                panelUpdated = await refreshMatchPanel(interaction.client, interaction.guildId, matchId);
            }
            catch (error) {
                console.error('Match panel refresh failed:', error);
            }
            const result = action === 'cancel'
                ? 'Match cancelled. All players released.'
                : `Dispute resolved. ${action === 'crimson'
                    ? 'Crimson'
                    : 'Azure'} wins.`;
            await interaction.editReply({
                content: `✅ Match #${matchId}: ${result}\n` +
                    (panelUpdated
                        ? 'Public panel updated.'
                        : 'Database updated, but the public panel could not be refreshed.')
            });
        }
        catch (error) {
            const expected = [
                'not found',
                'already closed',
                'not disputed',
                'must be complete',
                'missing their player profile'
            ].some(value => String(error.message)
                .toLowerCase()
                .includes(value));
            if (!expected) {
                console.error('Match moderation failed:', error);
            }
            await interaction.editReply({
                content: expected
                    ? `⚠️ ${error.message}`
                    : '⚠️ Kitsune could not manage this match.'
            });
        }
    }
};
