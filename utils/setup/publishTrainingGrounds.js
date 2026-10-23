const { buildGuide } = require('./guidePresentation');
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
    daily: 'kitsune:training:daily',
    profile: 'kitsune:training:profile',
    achievements: 'kitsune:training:achievements',
    quests: 'kitsune:training:quests'
});

function buildTrainingPanel(guild = null) {
    const embed = buildGuide(guild ?? {iconURL:()=>null},{
        title:'🦊 KITSUNE • MISSION CONTROL',
        intro:'**Your next little victory starts here.**\nCollect a drop, clear a mission, and make your progress visible.',
        fields:[
            {name:'🌙 Daily Drop',value:'Claim XP every 24 hours. Keep a 24–48 hour rhythm to continue your streak. Bonus drops at 3 / 7 / 14 / 30 days; the track repeats every 30 claims.',inline:false},
            {name:'📜 Mission Board',value:'Three missions per cycle: 15 and 30 XP-eligible messages, plus your daily drop. Collect all three rewards for an extra **+50 XP**.',inline:false},
            {name:'🎴 Profile & achievements',value:'Check your level, faction, battle statistics and milestones with the buttons below.',inline:false}
        ],quote:'Small steps count. Empty spam does not.'
    });

    const firstRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(TRAINING_IDS.daily)
                .setLabel('Daily Drop')
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
    .setLabel('Missions')
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
                    hashtext('kitsune_training_panel'),
                    hashtext($1::text)
                )
            `,
            [guild.id]
        );

        const { rows } = await client.query(
            `
                SELECT channel_id, message_id
                FROM kitsune_training_panels
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
                    buildTrainingPanel(guild)
                );

                await client.query('COMMIT');
                committed = true;

                return updated;
            }
        }

        createdMessage = await channel.send(
            buildTrainingPanel(guild)
        );

        await client.query(
            `
                INSERT INTO kitsune_training_panels (
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
