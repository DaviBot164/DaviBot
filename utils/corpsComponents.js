const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const CORPS_IDS =
    Object.freeze({
        section:
            'akane:corps:section',

        previous:
            'akane:corps:previous',

        next:
            'akane:corps:next'
    });

const CORPS_SECTIONS =
    Object.freeze({
        overview: {
            label: 'Overview',
            description:
                'Blood Moon rank overview.',
            emoji: '🌙'
        },

        slayer: {
            label: 'Slayer Corps',
            description:
                'View all Slayer ranks.',
            emoji: '⚔️'
        },

        hashira: {
            label: 'Hashira',
            description:
                'View Hashira members.',
            emoji: '🔥'
        },

        kinoe: {
            label: 'Kinoe',
            description:
                'View Kinoe members.',
            emoji: '🍃'
        },

        mizunoe: {
            label: 'Mizunoe',
            description:
                'View Mizunoe members.',
            emoji: '🌊'
        },

        slayer_rank: {
            label: 'Slayer',
            description:
                'View Slayer members.',
            emoji: '🗡️'
        },

        demon: {
            label: 'Demon Order',
            description:
                'View all Demon ranks.',
            emoji: '🩸'
        },

        upper_moon: {
            label: 'Upper Moon',
            description:
                'View Upper Moon members.',
            emoji: '🌙'
        },

        lower_moon: {
            label: 'Lower Moon',
            description:
                'View Lower Moon members.',
            emoji: '🌑'
        },

        demon_rank: {
            label: 'Demon',
            description:
                'View Demon members.',
            emoji: '🩸'
        }
    });

function buildCorpsMenu(
    selected = 'overview'
) {
    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                CORPS_IDS.section
            )
            .setPlaceholder(
                'Choose a faction or rank'
            )
            .addOptions(
                Object.entries(
                    CORPS_SECTIONS
                ).map(
                    ([
                        value,
                        section
                    ]) => ({
                        label:
                            section.label,

                        description:
                            section.description,

                        emoji:
                            section.emoji,

                        value,

                        default:
                            value ===
                            selected
                    })
                )
            );

    return new ActionRowBuilder()
        .addComponents(
            menu
        );
}

function buildCorpsPagination({
    page,
    totalPages
}) {
    if (totalPages <= 1) {
        return null;
    }

    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    CORPS_IDS.previous
                )
                .setLabel('Previous')
                .setEmoji('◀️')
                .setStyle(
                    ButtonStyle.Secondary
                )
                .setDisabled(
                    page <= 0
                ),

            new ButtonBuilder()
                .setCustomId(
                    CORPS_IDS.next
                )
                .setLabel('Next')
                .setEmoji('▶️')
                .setStyle(
                    ButtonStyle.Secondary
                )
                .setDisabled(
                    page >=
                        totalPages - 1
                )
        );
}

function buildCorpsComponents({
    section = 'overview',
    page = 0,
    totalPages = 1
} = {}) {
    const components = [
        buildCorpsMenu(
            section
        )
    ];

    const pagination =
        buildCorpsPagination({
            page,
            totalPages
        });

    if (pagination) {
        components.push(
            pagination
        );
    }

    return components;
}

module.exports = {
    CORPS_IDS,
    CORPS_SECTIONS,
    buildCorpsMenu,
    buildCorpsPagination,
    buildCorpsComponents
};