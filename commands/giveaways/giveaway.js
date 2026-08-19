const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ModalBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const {
    createErrorEmbed
} = require('../../utils/embeds');

/**
 * Official LUNAR SEIREITEI Community Events channel.
 *
 * Events and Giveaways are published
 * inside the same shared activity channel.
 */
const GIVEAWAY_CHANNEL_ID =
    '1535755486505476147';

/**
 * Build the Giveaway creation Modal.
 *
 * @param {string} creatorId
 * @returns {ModalBuilder}
 */
function buildGiveawayModal(
    creatorId
) {
    const modal =
        new ModalBuilder()
            .setCustomId(
                `umbra:giveaway:create:${creatorId}`
            )
            .setTitle(
                '🎁 Create Giveaway'
            );

    const prizeInput =
        new TextInputBuilder()
            .setCustomId(
                'giveaway-prize'
            )
            .setLabel(
                'Giveaway Prize'
            )
            .setPlaceholder(
                'Example: 500 Robux'
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setMinLength(2)
            .setMaxLength(200)
            .setRequired(true);

    const durationInput =
        new TextInputBuilder()
            .setCustomId(
                'giveaway-duration'
            )
            .setLabel(
                'Duration'
            )
            .setPlaceholder(
                'Example: 30m, 2h, 1d'
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setMinLength(2)
            .setMaxLength(20)
            .setRequired(true);

    const winnerCountInput =
        new TextInputBuilder()
            .setCustomId(
                'giveaway-winner-count'
            )
            .setLabel(
                'Number of Winners'
            )
            .setPlaceholder(
                'Example: 1'
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setMinLength(1)
            .setMaxLength(2)
            .setRequired(true);

    const descriptionInput =
        new TextInputBuilder()
            .setCustomId(
                'giveaway-description'
            )
            .setLabel(
                'Giveaway Description'
            )
            .setPlaceholder(
                'Explain the giveaway and any important requirements.'
            )
            .setStyle(
                TextInputStyle.Paragraph
            )
            .setMinLength(5)
            .setMaxLength(1000)
            .setRequired(true);

    const requirementInput =
        new TextInputBuilder()
            .setCustomId(
                'giveaway-requirement'
            )
            .setLabel(
                'Entry Requirement'
            )
            .setPlaceholder(
                'Example: Must have the Verified role'
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setMinLength(2)
            .setMaxLength(200)
            .setRequired(false);

    modal.addComponents(
        new ActionRowBuilder()
            .addComponents(
                prizeInput
            ),

        new ActionRowBuilder()
            .addComponents(
                durationInput
            ),

        new ActionRowBuilder()
            .addComponents(
                winnerCountInput
            ),

        new ActionRowBuilder()
            .addComponents(
                descriptionInput
            ),

        new ActionRowBuilder()
            .addComponents(
                requirementInput
            )
    );

    return modal;
}

module.exports = {
    category:
        'giveaways',

    data:
        new SlashCommandBuilder()
            .setName('giveaway')
            .setDescription(
                'Create and manage LUNAR SEIREITEI giveaways.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ManageGuild
            )
            .setDMPermission(false)

            .addSubcommand(subcommand =>
                subcommand
                    .setName('create')
                    .setDescription(
                        'Open the LUNAR SEIREITEI Giveaway creation form.'
                    )
            ),

    /**
     * Execute the /giveaway command.
     *
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        try {
            if (!interaction.inGuild()) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Server Only Command',
                            'The Giveaway System can only be used inside a server.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const subcommand =
                interaction.options
                    .getSubcommand();

            if (subcommand !== 'create') {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Unknown Giveaway Action',
                            'Evelynn does not recognize this Giveaway action.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const giveawayChannel =
                await interaction.guild.channels
                    .fetch(
                        GIVEAWAY_CHANNEL_ID
                    )
                    .catch(
                        () => null
                    );

            if (
                !giveawayChannel ||
                !giveawayChannel.isTextBased()
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Giveaway Channel Not Found',
                            [
                                'Evelynn could not find the official Community Events channel.',
                                '',
                                `Configured Channel ID: \`${GIVEAWAY_CHANNEL_ID}\``
                            ].join('\n')
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const botMember =
                interaction.guild.members.me;

            const permissions =
                botMember
                    ? giveawayChannel.permissionsFor(
                        botMember
                    )
                    : null;

            if (
                !permissions?.has([
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.EmbedLinks,
                    PermissionFlagsBits.ReadMessageHistory
                ])
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Missing Giveaway Permissions',
                            [
                                `Evelynn cannot publish Giveaways in ${giveawayChannel}.`,
                                '',
                                'Required permissions:',
                                '• View Channel',
                                '• Send Messages',
                                '• Embed Links',
                                '• Read Message History'
                            ].join('\n')
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (
                interaction.replied ||
                interaction.deferred
            ) {
                return;
            }

            const modal =
                buildGiveawayModal(
                    interaction.user.id
                );

            await interaction.showModal(
                modal
            );
        } catch (error) {
            if (error.code === 40060) {
                console.warn(
                    '⚠️ Duplicate Giveaway interaction was ignored.'
                );

                return;
            }

            console.error(
                '❌ Evelynn Giveaway command error:'
            );

            console.error(
                error
            );

            if (
                interaction.replied ||
                interaction.deferred
            ) {
                return;
            }

            await interaction
                .reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Giveaway System Failed',
                            'Evelynn could not open the Giveaway creation form.'
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
};