const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const {
    createEmbed
} = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('path')
        .setDescription(
            'Choose your path beneath the Blood Moon.'
        ),

    async execute(interaction) {
        const embed = createEmbed(
            'Choose Your Path',
            [
                'The Blood Moon watches as two paths stand before you.',
                '',
                '🥷 **Slayer Path**',
                'Rise through the Slayer ranks and prove your strength.',
                '',
                '🩸 **Demon Path**',
                'Embrace the night and ascend through the Demon ranks.',
                '',
                '*Choose carefully. Your path defines your progression.*'
            ].join('\n')
        )
            .setFooter({
                text: 'AKANE • BLOOD MOON'
            });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        'akane:path:slayer'
                    )
                    .setLabel(
                        'Slayer Path'
                    )
                    .setEmoji('🥷')
                    .setStyle(
                        ButtonStyle.Primary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        'akane:path:demon'
                    )
                    .setLabel(
                        'Demon Path'
                    )
                    .setEmoji('🩸')
                    .setStyle(
                        ButtonStyle.Danger
                    )
            );

        await interaction.reply({
            embeds: [embed],
            components: [buttons]
        });
    }
};