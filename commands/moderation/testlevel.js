const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    AttachmentBuilder
} = require('discord.js');

const {
    createLevelCard
} = require('../../utils/cards/levelCard');

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName(
                'testlevel'
            )
            .setDescription(
                'Preview the Blood Moon level card.'
            )
            .addIntegerOption(option =>
                option
                    .setName('level')
                    .setDescription(
                        'Level to display.'
                    )
                    .setMinValue(1)
                    .setMaxValue(1000)
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ManageGuild
            ),

    async execute(
        interaction
    ) {
        await interaction.deferReply({
            flags:
                MessageFlags.Ephemeral
        });

        try {
            const level =
                interaction.options
                    .getInteger('level') ??
                10;

            const member =
                interaction.member;

            const image =
                await createLevelCard(
                    member,
                    level
                );

            const attachment =
                new AttachmentBuilder(
                    image,
                    {
                        name:
                            'level-preview.png'
                    }
                );

            const debug = [
                `displayName: ${JSON.stringify(
                    member.displayName
                )}`,
                `globalName: ${JSON.stringify(
                    member.user.globalName
                )}`,
                `username: ${JSON.stringify(
                    member.user.username
                )}`
            ].join('\n');

            await interaction.editReply({
                content:
                    `Level ${level} preview\n\`\`\`\n${debug}\n\`\`\``,
                files: [
                    attachment
                ]
            });
        } catch (error) {
            console.error(
                'Level preview failed:',
                error
            );

            await interaction.editReply({
                content:
                    'Akane could not create the Level preview.'
            });
        }
    }
};