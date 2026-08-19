const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const {
    createErrorEmbed,
    createModerationEmbed
} = require('../../utils/embeds');

const {
    hasBotPermission,
    canModerate,
    getModerationError,
    handleModerationCommandError
} = require('../../utils/moderation');

const {
    sendModLog
} = require('../../utils/modLogs');

module.exports = {
    category: 'moderation',

    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription(
            'Temporarily silence a Soul within the Order.'
        )

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription(
                    'Select the Soul you want to timeout'
                )
                .setRequired(true)
        )

        .addIntegerOption(option =>
            option
                .setName('duration')
                .setDescription(
                    'Select the timeout duration'
                )
                .setRequired(true)
                .addChoices(
                    {
                        name: '1 minute',
                        value: 1
                    },
                    {
                        name: '5 minutes',
                        value: 5
                    },
                    {
                        name: '10 minutes',
                        value: 10
                    },
                    {
                        name: '30 minutes',
                        value: 30
                    },
                    {
                        name: '1 hour',
                        value: 60
                    },
                    {
                        name: '6 hours',
                        value: 360
                    },
                    {
                        name: '12 hours',
                        value: 720
                    },
                    {
                        name: '1 day',
                        value: 1440
                    },
                    {
                        name: '3 days',
                        value: 4320
                    },
                    {
                        name: '7 days',
                        value: 10080
                    },
                    {
                        name: '28 days',
                        value: 40320
                    }
                )
        )

        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription(
                    'Reason for the timeout'
                )
                .setMaxLength(500)
                .setRequired(false)
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        )

        .setDMPermission(false),

    /**
     * Execute the /timeout command.
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
                            '❌ Order Only Command',
                            'This command can only be used inside a server.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const member =
                interaction.options.getMember(
                    'user'
                );

            const durationMinutes =
                interaction.options.getInteger(
                    'duration',
                    true
                );

            const reason =
                interaction.options.getString(
                    'reason'
                ) ||
                'No reason was provided.';

            const botMember =
                interaction.guild.members.me;

            if (!member) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Soul Not Found',
                            'This Soul is not currently a member of LUNAR SEIREITEI.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (
                !botMember ||
                !hasBotPermission(
                    botMember,
                    PermissionFlagsBits.ModerateMembers
                )
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Missing Evelynn Permission',
                            'Evelynn requires the **Moderate Members** permission to apply a timeout.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const moderationError =
                getModerationError({
                    interaction,
                    target:
                        member,
                    botMember
                });

            if (moderationError) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Timeout Failed',
                            moderationError
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (!canModerate(member)) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Timeout Failed',
                            'Evelynn cannot timeout this Soul. Check its permissions and role position.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            if (
                member.isCommunicationDisabled()
            ) {
                await interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Timeout Already Active',
                            'This Soul already has an active timeout. Use `/untimeout` before applying a new timeout.'
                        )
                    ],

                    flags:
                        MessageFlags.Ephemeral
                });

                return;
            }

            const durationMilliseconds =
                durationMinutes *
                60 *
                1_000;

            const durationText =
                formatDuration(
                    durationMinutes
                );

            await interaction.deferReply();

            await member.timeout(
                durationMilliseconds,
                `${reason} | Shadow Warden: ${interaction.user.tag}`
            );

            const timeoutEndsAt =
                Math.floor(
                    (
                        Date.now() +
                        durationMilliseconds
                    ) /
                    1_000
                );

            const embed =
                createModerationEmbed({
                    action:
                        '⏳ Soul Silenced',

                    user:
                        member.user,

                    moderator:
                        interaction.user,

                    reason,

                    duration:
                        durationText
                });

            embed.addFields(
                {
                    name:
                        '🕒 Timeout Ends',

                    value:
                        `<t:${timeoutEndsAt}:F>\n` +
                        `(<t:${timeoutEndsAt}:R>)`,

                    inline:
                        false
                },
                {
                    name:
                        '🌙 LUNAR SEIREITEI Status',

                    value:
                        'This Soul has temporarily lost the ability to communicate within LUNAR SEIREITEI.',

                    inline:
                        false
                }
            );

            await interaction.editReply({
                embeds: [
                    embed
                ]
            });

            await sendModLog({
                guild:
                    interaction.guild,

                action:
                    '⏳ Soul Silenced',

                user:
                    member.user,

                moderator:
                    interaction.user,

                reason,

                fields: [
                    {
                        name:
                            '⏱️ Duration',

                        value:
                            durationText,

                        inline:
                            true
                    },
                    {
                        name:
                            '🕒 Timeout Ends',

                        value:
                            `<t:${timeoutEndsAt}:F>\n` +
                            `(<t:${timeoutEndsAt}:R>)`,

                        inline:
                            false
                    },
                    {
                        name:
                            '🌙 LUNAR SEIREITEI Status',

                        value:
                            'This Soul has temporarily lost the ability to communicate within LUNAR SEIREITEI.',

                        inline:
                            false
                    }
                ]
            });
        } catch (error) {
            await handleModerationCommandError({
                interaction,
                error,

                commandName:
                    'timeout',

                title:
                    '❌ Timeout Failed',

                description:
                    'Evelynn encountered an unexpected error while trying to timeout this Soul.'
            });
        }
    }
};

/**
 * Convert minutes into a readable duration.
 *
 * @param {number} minutes
 * @returns {string}
 */
function formatDuration(minutes) {
    if (minutes < 60) {
        return (
            `${minutes} minute` +
            `${minutes === 1 ? '' : 's'}`
        );
    }

    if (minutes < 1440) {
        const hours =
            minutes / 60;

        return (
            `${hours} hour` +
            `${hours === 1 ? '' : 's'}`
        );
    }

    const days =
        minutes / 1440;

    return (
        `${days} day` +
        `${days === 1 ? '' : 's'}`
    );
}