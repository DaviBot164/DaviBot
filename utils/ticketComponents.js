const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder
} = require('discord.js');

const {
    TICKET_CATEGORIES
} = require('../config/tickets');

const TICKET_COMPONENT_IDS =
    Object.freeze({
        open:
            'akane:ticket:open',

        category:
            'akane:ticket:category',

        close:
            'akane:ticket:close',

        reopen:
            'akane:ticket:reopen',

        delete:
            'akane:ticket:delete'
    });

function buildTicketPanelComponents() {
    return [
        new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        TICKET_COMPONENT_IDS.open
                    )
                    .setLabel(
                        'Open Ticket'
                    )
                    .setEmoji('🎫')
                    .setStyle(
                        ButtonStyle.Primary
                    )
            )
    ];
}

function buildTicketCategoryComponents() {
    const options =
        Object.values(
            TICKET_CATEGORIES
        )
            .map(category => ({
                label:
                    category.name,

                value:
                    category.id,

                description:
                    category.description,

                emoji:
                    category.emoji
            }));

    return [
        new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(
                        TICKET_COMPONENT_IDS
                            .category
                    )
                    .setPlaceholder(
                        'Choose a ticket category'
                    )
                    .addOptions(
                        options
                    )
            )
    ];
}

function buildOpenTicketComponents() {
    return [
        new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        TICKET_COMPONENT_IDS.close
                    )
                    .setLabel(
                        'Close Ticket'
                    )
                    .setEmoji('🔒')
                    .setStyle(
                        ButtonStyle.Danger
                    )
            )
    ];
}

function buildClosedTicketComponents() {
    return [
        new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        TICKET_COMPONENT_IDS.reopen
                    )
                    .setLabel(
                        'Reopen'
                    )
                    .setEmoji('🔓')
                    .setStyle(
                        ButtonStyle.Success
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        TICKET_COMPONENT_IDS.delete
                    )
                    .setLabel(
                        'Delete'
                    )
                    .setEmoji('🗑️')
                    .setStyle(
                        ButtonStyle.Danger
                    )
            )
    ];
}

module.exports = {
    TICKET_COMPONENT_IDS,
    buildTicketPanelComponents,
    buildTicketCategoryComponents,
    buildOpenTicketComponents,
    buildClosedTicketComponents
};