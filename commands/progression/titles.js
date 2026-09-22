const {
    SlashCommandBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    MessageFlags
} = require('discord.js');

const {
    getTitles: getUnlockedTitles
} = require('../../database/titles');

const {
    getTitle
} = require('../../config/titles');

const {
    createEmbed
} = require('../../utils/embeds');

function buildTitleMenu(titles) {
    const options = titles
        .map(entry => {
            const title =
                getTitle(
                    entry.titleId
                );

            if (!title) {
                return null;
            }

            return {
                label: title.name,
                value: title.id,
                description:
                    entry.equipped
                        ? 'Currently equipped'
                        : 'Equip this title',
                emoji:
                    entry.equipped
                        ? '🌙'
                        : '🏮'
            };
        })
        .filter(Boolean);

    options.push({
        label: 'Remove Active Title',
        value: 'none',
        description:
            'Unequip your current title.',
        emoji: '✖️'
    });

    return new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(
                    'akane:title:select'
                )
                .setPlaceholder(
                    'Choose a title'
                )
                .addOptions(options)
        );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('titles')
        .setDescription(
            'View and equip your unlocked titles.'
        ),

    async execute(interaction) {
        const titles =
            await getUnlockedTitles(
                interaction.guild.id,
                interaction.user.id
            );

        if (!titles.length) {
            await interaction.reply({
                embeds: [
                    createEmbed(
                        'Soul Titles',
                        [
                            'You have not unlocked any titles yet.',
                            '',
                            'Explore Blood Moon and earn milestones to discover new titles.'
                        ].join('\n')
                    )
                ],
                flags:
                    MessageFlags.Ephemeral
            });

            return;
        }

        const equipped =
            titles.find(
                title =>
                    title.equipped
            );

        const activeTitle =
            equipped
                ? getTitle(
                    equipped.titleId
                )
                : null;

        const embed =
            createEmbed(
                'Soul Titles',
                [
                    `Unlocked: **${titles.length}**`,
                    '',
                    activeTitle
                        ? `Active Title: **${activeTitle.name}**`
                        : 'Active Title: **None**',
                    '',
                    'Choose one of your unlocked titles below.'
                ].join('\n')
            )
                .setFooter({
                    text: 'AKANE • BLOOD MOON'
                });

        await interaction.reply({
            embeds: [embed],
            components: [
                buildTitleMenu(
                    titles
                )
            ],
            flags:
                MessageFlags.Ephemeral
        });
    }
};