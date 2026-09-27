const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const LEGACY_IDS =
    Object.freeze({
        section:
            'akane:legacy:section',

        previous:
            'akane:legacy:previous',

        next:
            'akane:legacy:next'
    });

const LEGACY_SECTIONS =
    Object.freeze({
        overview: {
            label: 'Overview',
            description:
                'View the Blood Moon legacy overview.',
            emoji: '🌙'
        },

        achievements: {
            label: 'Achievements',
            description:
                'View achievement unlock records.',
            emoji: '🏆'
        },

        titles: {
            label: 'Titles',
            description:
                'View title unlock records.',
            emoji: '📜'
        },

        ranks: {
            label: 'Legacy Ranks',
            description:
                'View achievement rank distribution.',
            emoji: '🌕'
        }
    });

function buildLegacyMenu(
    selected = 'overview'
) {
    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                LEGACY_IDS.section
            )
            .setPlaceholder(
                'Choose a legacy record'
            )
            .addOptions(
                Object.entries(
                    LEGACY_SECTIONS
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
                            value === selected
                    })
                )
            );

    return new ActionRowBuilder()
        .addComponents(
            menu
        );
}

function buildLegacyPagination({
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
                    LEGACY_IDS.previous
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
                    LEGACY_IDS.next
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

function buildLegacyComponents({
    section = 'overview',
    page = 0,
    totalPages = 1
} = {}) {
    const components = [
        buildLegacyMenu(
            section
        )
    ];

    const pagination =
        buildLegacyPagination({
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
    LEGACY_IDS,
    LEGACY_SECTIONS,
    buildLegacyMenu,
    buildLegacyPagination,
    buildLegacyComponents
};