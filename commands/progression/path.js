const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const channels =
    require('../../config/channels');

const brand =
    require('../../config/brand');

const {
    createEmbed,
    successEmbed,
    errorEmbed
} = require('../../utils/embeds');

function buildPathComponents() {
    return [
        new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        'akane:path:slayer'
                    )
                    .setLabel(
                        'Become a Slayer'
                    )
                    .setEmoji('⚔️')
                    .setStyle(
                        ButtonStyle.Primary
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        'akane:path:demon'
                    )
                    .setLabel(
                        'Become a Demon'
                    )
                    .setEmoji('🩸')
                    .setStyle(
                        ButtonStyle.Danger
                    )
            )
    ];
}

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('path')
            .setDescription(
                'Publish the Blood Moon path selection panel.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.ManageGuild
            ),

    async execute(interaction) {
        await interaction.deferReply({
            flags:
                MessageFlags.Ephemeral
        });

        const channel =
            interaction.guild.channels.cache.get(
                channels.slayers2
            );

        if (!channel?.isTextBased()) {
            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Channel Unavailable',
                        'The configured Slayers 2 channel could not be found.'
                    )
                ]
            });

            return;
        }

        const embed =
            createEmbed(
                'Choose Your Path',
                [
                    'The Blood Moon watches as two paths stand before you.',
                    '',
                    '⚔️ **Slayer Path**',
                    'Join the Demon Slayer Corps, grow stronger and rise through the Slayer ranks.',
                    '',
                    '🩸 **Demon Path**',
                    'Embrace the night, grow in power and ascend through the Demon ranks.',
                    '',
                    '**Choose carefully. Your path defines your progression.**'
                ].join('\n')
            )
                .setFooter({
                    text:
                        brand.footer
                });

        try {
            await channel.send({
                embeds: [
                    embed
                ],
                components:
                    buildPathComponents()
            });

            await interaction.editReply({
                embeds: [
                    successEmbed(
                        'Path Panel Published',
                        `The path selection panel was published in ${channel}.`
                    )
                ]
            });
        } catch (error) {
            console.error(
                'Path panel publish failed:',
                error
            );

            await interaction.editReply({
                embeds: [
                    errorEmbed(
                        'Publish Failed',
                        'Akane could not publish the path selection panel.'
                    )
                ]
            });
        }
    }
};
