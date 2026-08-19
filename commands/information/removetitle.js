const {
    SlashCommandBuilder,
    MessageFlags
} = require('discord.js');

const {
    createSuccessEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const {
    titles: titleDatabase
} = require('../../database');

const TITLE_COLOR = '#D4AF37';

function createTitleRemovedEmbed(
    interaction,
    member,
    removedTitle
) {
    const embed = createSuccessEmbed(
        '🏷️ Active Title Removed',
        [
            `${member} no longer has an active Title.`,
            '',
            'The Title remains unlocked and may be selected again with `/settitle`.'
        ].join('\n')
    );

    return embed
        .setColor(TITLE_COLOR)
        .setThumbnail(
            member.user.displayAvatarURL({
                size: 1024,
                forceStatic: false
            })
        )
        .addFields({
            name: '🏷️ Previous Active Title',
            value: [
                `**${removedTitle.displayName}**`,
                `-# ${removedTitle.rarity} • ${removedTitle.category}`
            ].join('\n')
        })
        .setFooter({
            text:
                `Evelynn • LUNAR SEIREITEI • Removed by ${interaction.user.username}`,
            iconURL:
                interaction.client.user.displayAvatarURL({
                    size: 128,
                    forceStatic: false
                })
        });
}

async function sendError(
    interaction,
    title,
    description
) {
    const payload = {
        embeds: [
            createErrorEmbed(
                title,
                description
            )
        ],
        components: []
    };

    if (interaction.deferred) {
        return interaction
            .editReply(payload)
            .catch(() => null);
    }

    if (interaction.replied) {
        return interaction
            .followUp({
                ...payload,
                flags: MessageFlags.Ephemeral
            })
            .catch(() => null);
    }

    return interaction
        .reply({
            ...payload,
            flags: MessageFlags.Ephemeral
        })
        .catch(() => null);
}

module.exports = {
    category: 'information',

    data:
        new SlashCommandBuilder()
            .setName('removetitle')
            .setDescription(
                'Remove your currently active Title.'
            )
            .setDMPermission(false),

    async execute(interaction) {
        try {
            if (!interaction.inGuild()) {
                await sendError(
                    interaction,
                    '❌ LUNAR SEIREITEI Only Command',
                    'This command can only be used inside LUNAR SEIREITEI.'
                );

                return;
            }

            await interaction.deferReply({
                flags: MessageFlags.Ephemeral
            });

            const member = interaction.member;

            if (!member) {
                await sendError(
                    interaction,
                    '❌ Member Not Found',
                    'Evelynn could not access your member record.'
                );

                return;
            }

            const removedTitle =
                await titleDatabase.clearActiveTitle(
                    interaction.guild.id,
                    member.id
                );

            if (!removedTitle) {
                await sendError(
                    interaction,
                    '❌ No Active Title',
                    'You do not currently have an active Title.'
                );

                return;
            }

            await interaction.editReply({
                embeds: [
                    createTitleRemovedEmbed(
                        interaction,
                        member,
                        removedTitle
                    )
                ]
            });
        } catch (error) {
            console.error(
                '❌ Evelynn /removetitle command error:',
                error
            );

            await sendError(
                interaction,
                '❌ Title Removal Failed',
                'Evelynn could not remove your active Title.'
            );
        }
    }
};