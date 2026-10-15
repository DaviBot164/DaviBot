
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const { pool } = require('../../database/connection');
const channels = require('../../config/channels');
const brand = require('../../config/brand');
const { createEmbed } = require('../embeds');

const TRAINING_IDS = Object.freeze({
    daily: 'akane:training:daily',
    profile: 'akane:training:profile',
    achievements: 'akane:training:achievements',
    quests: 'akane:training:quests'
});

function buildTrainingPanel() {
    const embed = createEmbed(
        '🥋 BLOOD MOON • TRAINING GROUNDS',
        [
            '*Every warrior begins somewhere.*',
            '',
            'Train your soul, strengthen your resolve,',
            'and forge your legacy beneath the Blood Moon.',
            '',
            '🌙 **Daily Reward**',
            'Claim XP and build your daily streak.',
            '',
            '🎴 **Soul Profile**',
            'View your level, rank, and progression.',
            '',
            '🏆 **Achievements**',
            'Discover the milestones you have unlocked.',
            '',
            '📜 **Daily Quests**',
            'New challenges are coming soon.',
            '',
            '━━━━━━━━━━━━━━━━━━━━',
            '*Your journey begins here, warrior.*'
        ].join('\n')
    ).setFooter({
        text: brand.footer
    });

    const firstRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(TRAINING_IDS.daily)
                .setLabel('Claim Daily')
                .setEmoji('🌙')
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId(TRAINING_IDS.profile)
                .setLabel('Soul Profile')
                .setEmoji('🎴')
                .setStyle(ButtonStyle.Primary)
        );

    const secondRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(TRAINING_IDS.achievements)
                .setLabel('Achievements')
                .setEmoji('🏆')
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
    .setCustomId(TRAINING_IDS.quests)
    .setLabel('Daily Quests')
    .setEmoji('📜')
    .setStyle(ButtonStyle.Secondary)
        );

    return {
        embeds: [embed],
        components: [firstRow, secondRow]
    };
}

async function publishTrainingGrounds(guild) {
    const channel = await guild.channels.fetch(
        channels.training
    );

    if (
        !channel?.isTextBased() ||
        typeof channel.send !== 'function' ||
        !channel.messages?.fetch
    ) {
        throw new Error(
            'Training Grounds channel is unavailable.'
        );
    }

    const client = await pool.connect();
    let createdMessage = null;
    let committed = false;

    try {
        await client.query('BEGIN');

        await client.query(
            `
                SELECT pg_advisory_xact_lock(
                    hashtext('akane_training_panel'),
                    hashtext($1::text)
                )
            `,
            [guild.id]
        );

        const { rows } = await client.query(
            `
                SELECT channel_id, message_id
                FROM akane_training_panels
                WHERE guild_id = $1
                FOR UPDATE
            `,
            [guild.id]
        );

        const existing = rows[0];

        if (existing) {
            if (existing.channel_id !== channel.id) {
                throw new Error(
                    'Training panel belongs to another channel.'
                );
            }

            let message;

            try {
                message = await channel.messages.fetch(
                    existing.message_id
                );
            } catch (error) {
                if (error.code !== 10008) {
                    throw error;
                }
            }

            if (message) {
                const updated = await message.edit(
                    buildTrainingPanel()
                );

                await client.query('COMMIT');
                committed = true;

                return updated;
            }
        }

        createdMessage = await channel.send(
            buildTrainingPanel()
        );

        await client.query(
            `
                INSERT INTO akane_training_panels (
                    guild_id,
                    channel_id,
                    message_id
                )
                VALUES ($1, $2, $3)
                ON CONFLICT (guild_id)
                DO UPDATE SET
                    channel_id = EXCLUDED.channel_id,
                    message_id = EXCLUDED.message_id,
                    updated_at = NOW()
            `,
            [
                guild.id,
                channel.id,
                createdMessage.id
            ]
        );

        await client.query('COMMIT');
        committed = true;

        return createdMessage;
    } catch (error) {
        if (!committed) {
            await client.query('ROLLBACK')
                .catch(() => null);
        }

        if (createdMessage && !committed) {
            await createdMessage.delete()
                .catch(() => {
                    console.error(
                        'Training panel cleanup failed:',
                        createdMessage.id
                    );
                });
        }

        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    TRAINING_IDS,
    buildTrainingPanel,
    publishTrainingGrounds
};
