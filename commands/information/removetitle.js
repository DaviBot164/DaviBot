const {
    SlashCommandBuilder,
    MessageFlags
} = require('discord.js');

const {
    createSuccessEmbed,
    createErrorEmbed
} = require('../../utils/embeds');

const {
    titles:
        titleDatabase
} = require('../../database');

const TITLE_COLOR =
    '#D4AF37';

function createTitleRemovedEmbed({
    interaction,
    member,
    removedTitle
}) {
    const embed =
        createSuccessEmbed(
            '🏷️ Active Title Removed',
            [
                `${member} no longer has an active Title.`,
                '',
                'The Title remains unlocked and may be selected again with `/settitle`.'
            ].join('\n')
        );

    embed
        .setColor(
            TITLE_COLOR
        )
        .setThumbnail(
            member.user.displayAvatarURL({
                size:
                    1024,

                forceStatic:
                    false
            })
        )
        .addFields({
            name:
                '📜 Previous Active Title',

            value: [
                `**${removedTitle.displayName}**`,
                `-# ${removedTitle.rarity} • ${removedTitle.category}`
            ].join('\n'),

            inline:
                false
        })
        .setFooter({
            text:
                `Evelynn • THE Ⅹ SINS • Removed by ${interaction.user.username}`,

            iconURL:
                interaction.client.user
                    .displayAvatarURL({
                        size:
                            128,

                        forceStatic:
                            false
                    })
        });

    return embed;
}

async function sendError(
    interaction,
    title,
    message
) {
    const payload = {
        embeds: [
            createErrorEmbed(
                title,
                message
            )
        ]
    };

    if (interaction.deferred) {
        await interaction
            .editReply(
                payload
            )
            .catch(
                () => null
            );

        return;
    }

    if (interaction.replied) {
        await interaction
            .followUp({
                ...payload,

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
            ...payload,

            flags:
                MessageFlags.Ephemeral
        })
        .catch(
            () => null
        );
}module.exports = {
    category:
        'information',

    data:
        new SlashCommandBuilder()
            .setName(
                'removetitle'
            )
            .setDescription(
                'Remove your currently active Title.'
            )
            .setDMPermission(
                false
            ),

    async execute(
        interaction
    ) {
        try {
            if (
                !interaction.inGuild()
            ) {
                await sendError(
                    interaction,
                    '❌ THE Ⅹ SINS Only Command',
                    'This command can only be used inside THE Ⅹ SINS.'
                );

                return;
            }

            await interaction.deferReply({
                flags:
                    MessageFlags.Ephemeral
            });

            const member =
                interaction.member;

            if (!member) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Member Not Found',
                            'Evelynn could not access your member record.'
                        )
                    ]
                });

                return;
            }

            const activeTitle =
                await titleDatabase
                    .getActiveTitle(
                        interaction.guild.id,
                        member.id
                    );

            if (!activeTitle) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ No Active Title',
                            'You do not currently have an active Title.'
                        )
                    ]
                });

                return;
            }

            const removedTitle =
                await titleDatabase
                    .clearActiveTitle(
                        interaction.guild.id,
                        member.id
                    );

            if (!removedTitle) {
                await interaction.editReply({
                    embeds: [
                        createErrorEmbed(
                            '❌ Title Removal Failed',
                            'Evelynn could not remove your active Title.'
                        )
                    ]
                });

                return;
            }

            await interaction.editReply({
                embeds: [
                    createTitleRemovedEmbed({
                        interaction,
                        member,
                        removedTitle
                    })
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