const { pool } = require('./connection');
const { calculateLevel } = require('../utils/leveling');

const CYCLE_MS = 24 * 60 * 60 * 1000;

const QUESTS = Object.freeze({
    active_soul: {
        name: 'Active Soul',
        required: 15,
        reward: 75
    },
    dedicated_warrior: {
        name: 'Dedicated Warrior',
        required: 30,
        reward: 125
    },
    blood_moon_devotion: {
        name: 'Blood Moon Devotion',
        required: 1,
        reward: 50
    }
});

async function getQuestState(client, guildId, userId) {
    await client.query(
        `
            INSERT INTO akane_daily_quests (
                guild_id,
                user_id
            )
            VALUES ($1, $2)
            ON CONFLICT (guild_id, user_id)
            DO NOTHING
        `,
        [guildId, userId]
    );

    const { rows } = await client.query(
        `
            SELECT *
            FROM akane_daily_quests
            WHERE guild_id = $1
              AND user_id = $2
            FOR UPDATE
        `,
        [guildId, userId]
    );

    const state = rows[0];

    const { rows: timeRows } = await client.query(
        'SELECT NOW() AS current_time'
    );

    const now = timeRows[0].current_time;

    if (
        now.getTime() -
        state.cycle_started_at.getTime() >= CYCLE_MS
    ) {
        const { rows: resetRows } = await client.query(
            `
                UPDATE akane_daily_quests
                SET
                    cycle_id = gen_random_uuid(),
                    cycle_started_at = NOW(),
                    eligible_messages = 0,
                    daily_claimed = FALSE,
                    claimed_rewards = '{}'::text[],
                    updated_at = NOW()
                WHERE guild_id = $1
                  AND user_id = $2
                RETURNING *
            `,
            [guildId, userId]
        );

        return resetRows[0];
    }

    return state;
}

async function runQuestOperation(
    guildId,
    userId,
    callback
) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query(
            `
                SELECT level, xp
                FROM akane_users
                WHERE guild_id = $1
                  AND user_id = $2
                FOR UPDATE
            `,
            [guildId, userId]
        );

        if (!rows.length) {
            throw new Error(
                'Player profile does not exist.'
            );
        }

        const state = await getQuestState(
            client,
            guildId,
            userId
        );

        const result = await callback(
            client,
            state,
            rows[0]
        );

        await client.query('COMMIT');

        return result;
    } catch (error) {
        await client.query('ROLLBACK')
            .catch(() => null);

        throw error;
    } finally {
        client.release();
    }
}

function mapQuests(state) {
    return Object.entries(QUESTS).map(([id, quest]) => {
        const current = id === 'blood_moon_devotion'
            ? Number(state.daily_claimed)
            : state.eligible_messages;

        return {
            id,
            name: quest.name,
            current: Math.min(current, quest.required),
            required: quest.required,
            reward: quest.reward,
            completed: current >= quest.required,
            claimed: state.claimed_rewards.includes(id)
        };
    });
}

async function getDailyQuests(guildId, userId) {
    return runQuestOperation(
        guildId,
        userId,
        async (client, state) => ({
            quests: mapQuests(state),
            cycleId: state.cycle_id,
            cycleStartedAt: state.cycle_started_at,
            nextResetAt: new Date(
                state.cycle_started_at.getTime() + CYCLE_MS
            )
        })
    );
}

async function recordQuestMessage(guildId, userId) {
    return runQuestOperation(
        guildId,
        userId,
        async client => {
            await client.query(
                `
                    UPDATE akane_daily_quests
                    SET
                        eligible_messages = eligible_messages + 1,
                        updated_at = NOW()
                    WHERE guild_id = $1
                      AND user_id = $2
                `,
                [guildId, userId]
            );

            return true;
        }
    );
}

async function recordDailyClaim(guildId, userId) {
    return runQuestOperation(
        guildId,
        userId,
        async client => {
            await client.query(
                `
                    UPDATE akane_daily_quests
                    SET
                        daily_claimed = TRUE,
                        updated_at = NOW()
                    WHERE guild_id = $1
                      AND user_id = $2
                `,
                [guildId, userId]
            );

            return true;
        }
    );
}

async function claimQuestReward(
    guildId,
    userId,
    questId,
    cycleId
) {
    if (!Object.hasOwn(QUESTS, questId)) {
        throw new Error('Unknown daily quest.');
    }

    if (
        typeof cycleId !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cycleId)
    ) {
        return {
            claimed: false,
            reason: 'invalid_cycle'
        };
    }

    return runQuestOperation(
        guildId,
        userId,
        async (client, state, user) => {
            if (state.cycle_id !== cycleId) {
                return {
                    claimed: false,
                    reason: 'expired'
                };
            }

            const quest = QUESTS[questId];

            const current = questId === 'blood_moon_devotion'
                ? Number(state.daily_claimed)
                : state.eligible_messages;

            if (state.claimed_rewards.includes(questId)) {
                return {
                    claimed: false,
                    reason: 'already_claimed'
                };
            }

            if (current < quest.required) {
                return {
                    claimed: false,
                    reason: 'incomplete'
                };
            }

            const progress = calculateLevel(
                user.level,
                user.xp + quest.reward
            );

            await client.query(
                `
                    UPDATE akane_users
                    SET
                        level = $3,
                        xp = $4,
                        updated_at = NOW()
                    WHERE guild_id = $1
                      AND user_id = $2
                `,
                [
                    guildId,
                    userId,
                    progress.level,
                    progress.xp
                ]
            );

            await client.query(
                `
                    UPDATE akane_daily_quests
                    SET
                        claimed_rewards = array_append(
                            claimed_rewards,
                            $3
                        ),
                        updated_at = NOW()
                    WHERE guild_id = $1
                      AND user_id = $2
                `,
                [guildId, userId, questId]
            );

            return {
                claimed: true,
                questId,
                reward: quest.reward,
                previousLevel: user.level,
                level: progress.level,
                levelsGained: progress.levelsGained
            };
        }
    );
}

module.exports = {
    QUESTS,
    getDailyQuests,
    recordQuestMessage,
    recordDailyClaim,
    claimQuestReward
};