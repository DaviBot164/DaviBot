const {
    SlashCommandBuilder,
    MessageFlags,
    PermissionFlagsBits
} = require('discord.js');

const {
    createMatch,
    setMatchMessage
} = require('../../database/matches');

const {
    forceCancelMatch
} = require('../../database/matchModeration');

const {
    ensureUser
} = require('../../database/users');

const {
    ensurePlayerStats
} = require('../../database/playerStats');

const {
    buildMatchPanel
} = require('../../utils/matches/matchPanel');

const PVP_CHANNEL_ID = '1551667516458147941';

const FORMATS = [
    { name: '1v1', value: 1 },
    { name: '2v2', value: 2 },
    { name: '3v3', value: 3 },
    { name: '4v4', value: 4 },
    { name: '5v5', value: 5 }
];

function isExpectedError(error) {
    return [
        'already',
        'participating',
        'game name',
        'match format',
        'valid game',
        'busy',
        'try again',
        'permissions'
    ].some(text =>
        String(error.message || '')
            .toLowerCase()
            .includes(text)
    );
}

async function cleanupFailedMatch(match, message) {
    if (!match) return;

    let cancelled = false;

    try {
        await forceCancelMatch(
            match.guildId,
            match.id
        );

        cancelled = true;
    } catch (error) {
        console.error(
            `Match #${match.id} cleanup failed:`,
            error
        );
    }

    if (message && cancelled) {
        await message.delete().catch(error => {
            console.error(
                `Match #${match.id} message cleanup failed:`,
                error
            );
        });
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('match')
        .setDescription('Create a Blood Moon PvP match.')
        .addStringOption(option =>
            option
                .setName('game')
                .setDescription('Game name, e.g. Slayers 2.')
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(100)
        )
        .addIntegerOption(option =>
            option
                .setName('format')
                .setDescription('Choose the match format.')
                .setRequired(true)
                .addChoices(...FORMATS)
        ),

    async execute(interaction) {
        if (!interaction.inGuild()) {
            return interaction.reply({
                content: 'This command is server-only.',
                flags: MessageFlags.Ephemeral
            });
        }

        if (interaction.channelId !== PVP_CHANNEL_ID) {
            return interaction.reply({
                content: `Use this command in <#${PVP_CHANNEL_ID}>.`,
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply({
            flags: MessageFlags.Ephemeral
        });

        let match = null;
        let message = null;

        try {
            const gameName = interaction.options.getString(
                'game',
                true
            ).trim();

            const teamSize = interaction.options.getInteger(
                'format',
                true
            );

            if (!gameName) {
                throw new Error('Enter a valid game name.');
            }

            const channel = interaction.channel;

            if (
                !channel?.isTextBased() ||
                typeof channel.send !== 'function'
            ) {
                throw new Error(
                    'This channel does not support match panels.'
                );
            }

            const me = await interaction.guild.members
                .fetchMe();

            if (
                !me.permissionsIn(channel).has([
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.EmbedLinks
                ])
            ) {
                throw new Error(
                    'Kitsune needs View Channel, Send Messages and Embed Links permissions.'
                );
            }

            const member = await interaction.guild.members
                .fetch(interaction.user.id);

            if (member.user.bot) {
                throw new Error(
                    'Bots cannot create matches.'
                );
            }

            await ensureUser(
                interaction.guildId,
                member.id,
                member.joinedAt
            );

            await ensurePlayerStats(
                interaction.guildId,
                member.id
            );

            match = await createMatch(
                interaction.guildId,
                interaction.channelId,
                member.id,
                gameName,
                teamSize
            );

            message = await channel.send(
                buildMatchPanel(match)
            );

            await setMatchMessage(
                interaction.guildId,
                match.id,
                message.id
            );
        } catch (error) {
            if (!isExpectedError(error)) {
                console.error(
                    'Match creation failed:',
                    error
                );
            }

            await cleanupFailedMatch(match, message);

            return interaction.editReply({
                content: isExpectedError(error)
                    ? `Warning: ${error.message}`
                    : 'Kitsune could not create your match.'
            }).catch(() => null);
        }

        // The match is now successfully saved.
        // A failed confirmation must not cancel it.
        await interaction.editReply({
            content:
                `Match #${match.id} created successfully!\n` +
                `[Open Match Panel](${message.url})`
        }).catch(error => {
            console.error(
                `Match #${match.id} confirmation failed:`,
                error
            );
        });
    }
};
