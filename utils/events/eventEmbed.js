const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const {
    createEmbed
} = require('../embeds');

/**
 * Build the main Evelynn Event embed.
 *
 * @param {Object} eventData
 * @param {import('discord.js').User} host
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildEventEmbed(
    eventData,
    host
) {
    const participantCount =
        eventData.participants instanceof Set
            ? eventData.participants.size
            : 0;

    const maxPlayers =
        Number.isInteger(
            eventData.maxPlayers
        )
            ? eventData.maxPlayers
            : 0;

    const participantDisplay =
        maxPlayers > 0
            ? `${participantCount} / ${maxPlayers}`
            : `${participantCount}`;

    const statusConfig = {
        Active: {
            icon:
                '🟢',

            label:
                'Open'
        },

        Ended: {
            icon:
                '🏁',

            label:
                'Finished'
        },

        Cancelled: {
            icon:
                '🔴',

            label:
                'Cancelled'
        }
    };

    const currentStatus =
        statusConfig[
            eventData.status
        ] ||
        statusConfig.Active;

    return createEmbed({
        title:
            `🎉 ${eventData.title}`,

        description:
            [
                eventData.description,
                '',
                '━━━━━━━━━━━━━━━━━━━━',
                '',
                '🕒 **Event Time**',
                `${eventData.time}`,
                '',
                '👥 **Players**',
                `\`${participantDisplay}\``,
                '',
                '🎁 **Reward**',
                `${eventData.reward}`,
                '',
                '━━━━━━━━━━━━━━━━━━━━',
                '',
                `⚔️ **Host:** ${host}`,
                `${currentStatus.icon} **Status:** ${currentStatus.label}`,
                '',
                `🆔 **Event ID:** \`${eventData.id}\``,
                '',
                '━━━━━━━━━━━━━━━━━━━━',
                '',
                '*Every battle becomes part of the chronicles of LUNAR SEIREITEI.*'
            ].join('\n'),

        thumbnail:
            host.displayAvatarURL({
                extension:
                    'png',

                size:
                    512,

                forceStatic:
                    false
            })
    });
}

/**
 * Build the buttons shown beneath an Event.
 *
 * @param {Object} eventData
 * @returns {ActionRowBuilder}
 */
function buildEventButtons(
    eventData
) {
    const participantCount =
        eventData.participants instanceof Set
            ? eventData.participants.size
            : 0;

    const maxPlayers =
        Number.isInteger(
            eventData.maxPlayers
        )
            ? eventData.maxPlayers
            : 0;

    const eventClosed =
        eventData.status !==
        'Active';

    const eventFull =
        maxPlayers > 0 &&
        participantCount >=
            maxPlayers;

    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `umbra:event:join:${eventData.id}`
                )
                .setLabel(
                    eventFull
                        ? 'Event Full'
                        : 'Join Event'
                )
                .setEmoji(
                    '✅'
                )
                .setStyle(
                    ButtonStyle.Success
                )
                .setDisabled(
                    eventClosed ||
                    eventFull
                ),

            new ButtonBuilder()
                .setCustomId(
                    `umbra:event:leave:${eventData.id}`
                )
                .setLabel(
                    'Leave Event'
                )
                .setEmoji(
                    '❌'
                )
                .setStyle(
                    ButtonStyle.Secondary
                )
                .setDisabled(
                    eventClosed
                ),

            new ButtonBuilder()
                .setCustomId(
                    `umbra:event:participants:${eventData.id}`
                )
                .setLabel(
                    'Participants'
                )
                .setEmoji(
                    '👥'
                )
                .setStyle(
                    ButtonStyle.Primary
                )
        );
}

/**
 * Build an Embed containing the
 * Event participant list.
 *
 * @param {Object} eventData
 * @param {string|null} thumbnail
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildParticipantsEmbed(
    eventData,
    thumbnail =
        null
) {
    const participantIds =
        eventData.participants instanceof Set
            ? Array.from(
                eventData.participants
            )
            : [];

    const visibleParticipants =
        participantIds.slice(
            0,
            50
        );

    const participantLines =
        visibleParticipants.map(
            (
                userId,
                index
            ) => {
                let medal =
                    '▫️';

                if (
                    index ===
                    0
                ) {
                    medal =
                        '🥇';
                } else if (
                    index ===
                    1
                ) {
                    medal =
                        '🥈';
                } else if (
                    index ===
                    2
                ) {
                    medal =
                        '🥉';
                }

                return (
                    `${medal} ${index + 1}. <@${userId}>`
                );
            }
        );

    if (
        participantIds.length >
        50
    ) {
        participantLines.push(
            '',
            `…and ${participantIds.length - 50} more Souls.`
        );
    }

    const participantList =
        participantLines.length >
        0
            ? participantLines.join(
                '\n'
            )
            : 'No Souls have joined this Event yet.';

    const maxPlayers =
        Number.isInteger(
            eventData.maxPlayers
        )
            ? eventData.maxPlayers
            : 0;

    const participantDisplay =
        maxPlayers > 0
            ? `${participantIds.length} / ${maxPlayers}`
            : `${participantIds.length}`;

    const statusConfig = {
        Active:
            '🟢 Open',

        Ended:
            '🏁 Finished',

        Cancelled:
            '🔴 Cancelled'
    };

    const status =
        statusConfig[
            eventData.status
        ] ||
        eventData.status ||
        'Unknown';

    return createEmbed({
        title:
            `👥 Participants • ${eventData.title}`,

        description:
            [
                `📜 **Players:** \`${participantDisplay}\``,
                `📍 **Status:** ${status}`,
                `🆔 **Event ID:** \`${eventData.id}\``,
                '',
                '━━━━━━━━━━━━━━━━━━━━',
                '',
                participantList
            ].join('\n'),

        thumbnail
    });
}

module.exports = {
    buildEventEmbed,
    buildEventButtons,
    buildParticipantsEmbed
};