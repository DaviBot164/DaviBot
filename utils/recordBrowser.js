const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');

const { errorEmbed } = require('./embeds');

function paginate(records, page = 0, size = 8) {
    const totalPages = Math.max(1, Math.ceil(records.length / size));
    const safePage = Math.min(Math.max(page, 0), totalPages - 1);
    const start = safePage * size;

    return {
        records: records.slice(start, start + size),
        page: safePage,
        totalPages,
        start,
        total: records.length
    };
}

function buildControls(prefix, sections, state, view) {
    const rows = [
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`${prefix}:section`)
                .setPlaceholder('Choose a section')
                .addOptions(
                    sections.map(section => ({
                        ...section,
                        default: section.value === state.section
                    }))
                )
        )
    ];

    if (view.choices?.length) {
        rows.push(
            new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`${prefix}:item`)
                    .setPlaceholder(view.placeholder || 'Choose a record')
                    .addOptions(
                        view.choices.map(choice => ({
                            ...choice,
                            default: choice.value === state.item
                        }))
                    )
            )
        );
    }

    if (view.totalPages > 1) {
        rows.push(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`${prefix}:previous`)
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(view.page <= 0),
                new ButtonBuilder()
                    .setCustomId(`${prefix}:next`)
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(view.page >= view.totalPages - 1)
            )
        );
    }

    return rows;
}

async function openRecordBrowser(interaction, {
    sections,
    initialSection = 'overview',
    load,
    render
}) {
    if (!interaction.inGuild()) {
        await interaction.reply({
            content: 'Use this command inside a server.',
            flags: MessageFlags.Ephemeral
        });

        return;
    }

    await interaction.deferReply();

    try {
        const data = await load();
        const prefix = `akane:view:${interaction.id}`;
        const state = {
            section: initialSection,
            item: null,
            page: 0
        };

        function payload() {
            const view = render(data, state);

            state.page = view.page ?? 0;

            return {
                embeds: [view.embed],
                components: buildControls(prefix, sections, state, view),
                allowedMentions: { parse: [] }
            };
        }

        const reply = await interaction.editReply(payload());
        const collector = reply.createMessageComponentCollector({
            filter: component =>
                component.customId.startsWith(`${prefix}:`),
            time: 5 * 60_000
        });

        let queue = Promise.resolve();
        let ended = false;

        collector.on('collect', component => {
            const task = async () => {
                try {
                    if (component.user.id !== interaction.user.id) {
                        await component.reply({
                            content: `Run /${interaction.commandName} to open your own view.`,
                            flags: MessageFlags.Ephemeral
                        });

                        return;
                    }

                    await component.deferUpdate();

                    if (ended) {
                        return;
                    }

                    if (component.customId === `${prefix}:section`) {
                        const section = component.values[0];

                        if (!sections.some(entry => entry.value === section)) {
                            return;
                        }

                        state.section = section;
                        state.item = null;
                        state.page = 0;
                    } else if (component.customId === `${prefix}:item`) {
                        const view = render(data, state);
                        const item = component.values[0];

                        if (!view.choices?.some(entry => entry.value === item)) {
                            return;
                        }

                        state.item = item;
                        state.page = 0;
                    } else if (component.customId === `${prefix}:previous`) {
                        state.page -= 1;
                    } else if (component.customId === `${prefix}:next`) {
                        state.page += 1;
                    }

                    await interaction.editReply(payload());
                } catch (error) {
                    console.error('Record navigation failed:', error);

                    await component.followUp({
                        content: 'Akane could not update this view.',
                        flags: MessageFlags.Ephemeral
                    }).catch(() => null);
                }
            };

            queue = queue.then(task).catch(error => {
                console.error('Record browser failed:', error);
            });
        });

        collector.on('end', () => {
            ended = true;

            queue = queue.then(() =>
                interaction.editReply({
                    components: []
                }).catch(() => null)
            );
        });
    } catch (error) {
        console.error(`${interaction.commandName} failed:`, error);

        await interaction.editReply({
            embeds: [
                errorEmbed(
                    'Records Unavailable',
                    'Akane could not load these records. Please try again.'
                )
            ],
            components: []
        });
    }
}

module.exports = {
    paginate,
    openRecordBrowser
};