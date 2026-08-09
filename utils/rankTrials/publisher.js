const {
    PermissionFlagsBits
} = require('discord.js');

const rankTrialConfig =
    require('../../config/rankTrials');

const {
    rankTrials:
        rankTrialDatabase
} = require('../../database');

const {
    buildOpeningEmbed,
    buildRegistrationReminderEmbed,
    buildFinalReminderEmbed,
    buildBattleStartEmbed,
    buildClosingEmbed
} = require('./embeds');

const {
    buildRankTrialPublicationComponents
} = require('./components');

const {
    synchronizeRankTrialScheduledEvent
} = require('./eventManager');

/**
 * Build the correct Embed for one
 * Rank Trial publication type.
 *
 * @param {string} publicationKey
 * @param {Object} schedule
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildPublicationEmbed(
    publicationKey,
    schedule
) {
    switch (
        publicationKey
    ) {
        case 'opening':
            return buildOpeningEmbed(
                schedule
            );

        case 'registrationReminder':
            return buildRegistrationReminderEmbed(
                schedule
            );

        case 'finalReminder':
            return buildFinalReminderEmbed(
                schedule
            );

        case 'battleStart':
            return buildBattleStartEmbed(
                schedule
            );

        case 'closing':
            return buildClosingEmbed(
                schedule
            );

        default:
            throw new TypeError(
                `Unknown Rank Trial publication key: ${publicationKey}`
            );
    }
}

/**
 * Fetch the configured Rank Trials channel.
 *
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<import('discord.js').TextBasedChannel|null>}
 */
async function fetchRankTrialChannel(
    guild
) {
    const channel =
        await guild.channels
            .fetch(
                rankTrialConfig.channelId
            )
            .catch(
                () => null
            );

    if (
        !channel ||
        !channel.isTextBased()
    ) {
        return null;
    }

    return channel;
}

/**
 * Check whether Umbra has all required
 * permissions in the Rank Trials channel.
 *
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').TextBasedChannel} channel
 * @param {boolean} mentionEveryone
 * @returns {boolean}
 */
function hasRequiredPermissions(
    guild,
    channel,
    mentionEveryone
) {
    const botMember =
        guild.members.me;

    if (!botMember) {
        return false;
    }

    const requiredPermissions = [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks
    ];

    if (
        mentionEveryone
    ) {
        requiredPermissions.push(
            PermissionFlagsBits.MentionEveryone
        );
    }

    const permissions =
        channel.permissionsFor(
            botMember
        );

    return (
        permissions?.has(
            requiredPermissions
        ) ===
        true
    );
}

/**
 * Build the console label used for one
 * publication.
 *
 * @param {string} publicationKey
 * @returns {string}
 */
function getPublicationLabel(
    publicationKey
) {
    switch (
        publicationKey
    ) {
        case 'opening':
            return 'Opening Announcement';

        case 'registrationReminder':
            return 'Registration Reminder';

        case 'finalReminder':
            return 'Final Reminder';

        case 'battleStart':
            return 'Battle Start Announcement';

        case 'closing':
            return 'Closing Notice';

        default:
            return 'Unknown Rank Trial Publication';
    }
}

/**
 * Check whether the selected publication
 * should create or synchronize the Discord
 * Scheduled Event.
 *
 * @param {string} publicationKey
 * @returns {boolean}
 */
function shouldSynchronizeScheduledEvent(
    publicationKey
) {
    return (
        publicationKey ===
            'opening' &&

        rankTrialConfig.enabled ===
            true &&

        rankTrialConfig
            .scheduledEvent
            ?.enabled ===
            true &&

        rankTrialConfig
            .scheduledEvent
            ?.createWithOpeningAnnouncement ===
            true
    );
}/**
 * Create or synchronize the Discord Scheduled
 * Event after the Opening Announcement.
 *
 * Event synchronization failure must not undo
 * an announcement that was already successfully
 * sent and saved in PostgreSQL.
 *
 * @param {import('discord.js').Guild} guild
 * @param {Object} schedule
 * @param {string} publicationKey
 * @returns {Promise<{
 *     attempted: boolean,
 *     status: string,
 *     discordEventId?: string,
 *     reason?: string
 * }>}
 */
async function synchronizeScheduledEventAfterPublication(
    guild,
    schedule,
    publicationKey
) {
    if (
        !shouldSynchronizeScheduledEvent(
            publicationKey
        )
    ) {
        return {
            attempted:
                false,

            status:
                'not-required'
        };
    }

    try {
        const result =
            await synchronizeRankTrialScheduledEvent(
                guild,
                schedule
            );

        const discordEventId =
            result.discordEvent
                ?.id;

        if (
            result.status ===
                'created' ||
            result.status ===
                'recreated' ||
            result.status ===
                'updated' ||
            result.status ===
                'synchronized'
        ) {
            console.log(
                '======================================'
            );

            console.log(
                '📅 Rank Trial Scheduled Event Ready'
            );

            console.log(
                `🗓️ Trial Cycle: ${schedule.trialKey}`
            );

            console.log(
                `🔄 Event Result: ${result.status}`
            );

            console.log(
                `🆔 Discord Event ID: ${discordEventId ?? 'Unavailable'}`
            );

            console.log(
                `🏰 Server: ${guild.name}`
            );

            console.log(
                '======================================'
            );
        } else {
            console.warn(
                '======================================'
            );

            console.warn(
                '⚠️ Rank Trial announcement was published, but the Scheduled Event was not prepared.'
            );

            console.warn(
                `🗓️ Trial Cycle: ${schedule.trialKey}`
            );

            console.warn(
                `🔄 Event Result: ${result.status}`
            );

            console.warn(
                `📖 Reason: ${result.reason ?? 'No reason was provided.'}`
            );

            console.warn(
                `🏰 Server: ${guild.name}`
            );

            console.warn(
                '======================================'
            );
        }

        return {
            attempted:
                true,

            status:
                result.status,

            discordEventId,

            reason:
                result.reason
        };
    } catch (error) {
        console.error(
            '======================================'
        );

        console.error(
            '❌ Rank Trial Scheduled Event integration failed.'
        );

        console.error(
            `🗓️ Trial Cycle: ${schedule.trialKey}`
        );

        console.error(
            `🏰 Server: ${guild.name}`
        );

        console.error(
            error
        );

        console.error(
            '======================================'
        );

        return {
            attempted:
                true,

            status:
                'failed',

            reason:
                error instanceof Error
                    ? error.message
                    : String(
                        error
                    )
        };
    }
}

/**
 * Publish one monthly Rank Trial announcement.
 *
 * PostgreSQL reservation happens before the
 * Discord message is sent.
 *
 * The unique database constraint prevents
 * duplicate publications after restart,
 * redeploy or simultaneous scheduler checks.
 *
 * @param {import('discord.js').Client<true>} client
 * @param {import('discord.js').Guild} guild
 * @param {Object} schedule
 * @param {{
 *     key: string,
 *     type: string,
 *     scheduledFor: Date,
 *     mentionEveryone: boolean
 * }} publication
 * @returns {Promise<{
 *     status: 'published'|'duplicate'|'failed',
 *     messageId?: string,
 *     reason?: string,
 *     scheduledEvent?: {
 *         attempted: boolean,
 *         status: string,
 *         discordEventId?: string,
 *         reason?: string
 *     }
 * }>}
 */
async function publishRankTrialAnnouncement(
    client,
    guild,
    schedule,
    publication
) {
    const publicationLabel =
        getPublicationLabel(
            publication.key
        );

    const channel =
        await fetchRankTrialChannel(
            guild
        );

    if (!channel) {
        console.error(
            '======================================'
        );

        console.error(
            '❌ Rank Trials channel was not found.'
        );

        console.error(
            `📍 Configured Channel ID: ${rankTrialConfig.channelId}`
        );

        console.error(
            `🏰 Server: ${guild.name}`
        );

        console.error(
            '======================================'
        );

        return {
            status:
                'failed',

            reason:
                'Rank Trials channel was not found.'
        };
    }

    if (
        !hasRequiredPermissions(
            guild,
            channel,
            publication.mentionEveryone
        )
    ) {
        console.error(
            '======================================'
        );

        console.error(
            '❌ Umbra is missing Rank Trials channel permissions.'
        );

        console.error(
            `📍 Channel: ${channel.name}`
        );

        console.error(
            `📣 Mention Everyone Required: ${publication.mentionEveryone}`
        );

        console.error(
            `🏰 Server: ${guild.name}`
        );

        console.error(
            '======================================'
        );

        return {
            status:
                'failed',

            reason:
                'Umbra is missing required channel permissions.'
        };
    }

    /*
     * Atomically reserve the publication.
     *
     * If PostgreSQL returns null, another
     * process or previous deployment already
     * reserved or published this announcement.
     */
    const reservation =
        await rankTrialDatabase
            .reservePublication({
                guildId:
                    guild.id,

                trialKey:
                    schedule.trialKey,

                publicationType:
                    publication.type,

                channelId:
                    channel.id,

                scheduledFor:
                    publication.scheduledFor
            });

    if (!reservation) {
        console.log(
            `ℹ️ Rank Trial ${publicationLabel} already exists for ${schedule.trialKey}.`
        );

        return {
            status:
                'duplicate',

            reason:
                'Publication already exists in PostgreSQL.'
        };
    }    try {
        const embed =
            buildPublicationEmbed(
                publication.key,
                schedule
            );

        embed.setAuthor({
            name:
                rankTrialConfig
                    .branding
                    .authorName,

            iconURL:
                client.user.displayAvatarURL({
                    size:
                        256,

                    forceStatic:
                        false
                })
        });

        const guildIcon =
            guild.iconURL({
                size:
                    128,

                forceStatic:
                    false
            });

        embed.setFooter({
            text:
                rankTrialConfig
                    .branding
                    .footerText,

            iconURL:
                guildIcon ??
                client.user.displayAvatarURL({
                    size:
                        128,

                    forceStatic:
                        false
                })
        });

        const components =
            buildRankTrialPublicationComponents(
                publication.key
            );

        const sentMessage =
            await channel.send({
                content:
                    publication.mentionEveryone
                        ? '@everyone'
                        : undefined,

                embeds:
                    [embed],

                components,

                allowedMentions: {
                    parse:
                        publication.mentionEveryone
                            ? ['everyone']
                            : []
                }
            });

        const completedPublication =
            await rankTrialDatabase
                .completePublication(
                    reservation.id,
                    sentMessage.id
                );

        if (
            !completedPublication
        ) {
            throw new Error(
                'Rank Trial publication was sent, but PostgreSQL completion failed.'
            );
        }

        const scheduledEventResult =
            await synchronizeScheduledEventAfterPublication(
                guild,
                schedule,
                publication.key
            );

        console.log(
            '======================================'
        );

        console.log(
            '⚔️ Automatic Rank Trial Announcement Published'
        );

        console.log(
            `📖 Type: ${publicationLabel}`
        );

        console.log(
            `🗓️ Trial: ${schedule.trialKey}`
        );

        console.log(
            `📍 Channel: ${channel.name}`
        );

        console.log(
            `💬 Message ID: ${sentMessage.id}`
        );

        console.log(
            `🏰 Server: ${guild.name}`
        );

        console.log(
            `📣 Mention Everyone: ${publication.mentionEveryone}`
        );

        console.log(
            `🧩 Components: ${components.length}`
        );

        if (
            scheduledEventResult
                .attempted
        ) {
            console.log(
                `📅 Scheduled Event: ${scheduledEventResult.status}`
            );

            if (
                scheduledEventResult
                    .discordEventId
            ) {
                console.log(
                    `🆔 Scheduled Event ID: ${scheduledEventResult.discordEventId}`
                );
            }
        }

        console.log(
            '💾 Publication saved permanently in PostgreSQL.'
        );

        console.log(
            '======================================'
        );

        return {
            status:
                'published',

            messageId:
                sentMessage.id,

            scheduledEvent:
                scheduledEventResult
        };
    } catch (error) {
        /*
         * Remove only the unfinished publication
         * reservation.
         *
         * Once completePublication succeeds,
         * releasePublication will no longer
         * delete the row.
         */
        await rankTrialDatabase
            .releasePublication(
                reservation.id
            )
            .catch(
                releaseError => {
                    console.error(
                        '❌ Failed to release Rank Trial publication reservation:'
                    );

                    console.error(
                        releaseError
                    );
                }
            );

        console.error(
            '======================================'
        );

        console.error(
            '❌ Automatic Rank Trial publication failed.'
        );

        console.error(
            `📖 Type: ${publicationLabel}`
        );

        console.error(
            `🗓️ Trial: ${schedule.trialKey}`
        );

        console.error(
            `🏰 Server: ${guild.name}`
        );

        console.error(
            error
        );

        console.error(
            '======================================'
        );

        return {
            status:
                'failed',

            reason:
                error instanceof Error
                    ? error.message
                    : String(
                        error
                    )
        };
    }
}/**
 * Publish one announcement in every active
 * configured Las Noches guild.
 *
 * @param {import('discord.js').Client<true>} client
 * @param {Object} schedule
 * @param {Object} publication
 * @param {string[]} guildIds
 * @returns {Promise<Array<{
 *     guildId: string,
 *     status: string,
 *     messageId?: string,
 *     reason?: string,
 *     scheduledEvent?: Object
 * }>>}
 */
async function publishRankTrialToGuilds(
    client,
    schedule,
    publication,
    guildIds
) {
    const results =
        [];

    for (
        const guildId of
        guildIds
    ) {
        const guild =
            client.guilds.cache.get(
                guildId
            ) ??
            await client.guilds
                .fetch(
                    guildId
                )
                .catch(
                    () => null
                );

        if (!guild) {
            results.push({
                guildId,

                status:
                    'failed',

                reason:
                    'Guild could not be fetched.'
            });

            continue;
        }

        const result =
            await publishRankTrialAnnouncement(
                client,
                guild,
                schedule,
                publication
            );

        results.push({
            guildId:
                guild.id,

            ...result
        });
    }

    return results;
}

module.exports = {
    buildPublicationEmbed,
    fetchRankTrialChannel,
    hasRequiredPermissions,
    getPublicationLabel,
    shouldSynchronizeScheduledEvent,
    synchronizeScheduledEventAfterPublication,
    publishRankTrialAnnouncement,
    publishRankTrialToGuilds
};