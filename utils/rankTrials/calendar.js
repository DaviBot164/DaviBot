const rankTrialConfig =
    require('../../config/rankTrials');

/**
 * Convert one Date into local calendar parts
 * for the configured Rank Trial timezone.
 *
 * @param {Date} date
 * @param {string} timezone
 * @returns {{
 *     year: number,
 *     month: number,
 *     day: number,
 *     hour: number,
 *     minute: number,
 *     second: number,
 *     weekday: number
 * }}
 */
function getZonedDateParts(
    date,
    timezone =
        rankTrialConfig.timezone
) {
    const formatter =
        new Intl.DateTimeFormat(
            'en-US',
            {
                timeZone:
                    timezone,

                year:
                    'numeric',

                month:
                    '2-digit',

                day:
                    '2-digit',

                hour:
                    '2-digit',

                minute:
                    '2-digit',

                second:
                    '2-digit',

                weekday:
                    'short',

                hourCycle:
                    'h23'
            }
        );

    const parts =
        formatter.formatToParts(
            date
        );

    const values =
        Object.fromEntries(
            parts
                .filter(
                    part =>
                        part.type !==
                        'literal'
                )
                .map(
                    part => [
                        part.type,
                        part.value
                    ]
                )
        );

    const weekdayMap = {
        Sun:
            0,

        Mon:
            1,

        Tue:
            2,

        Wed:
            3,

        Thu:
            4,

        Fri:
            5,

        Sat:
            6
    };

    return {
        year:
            Number(
                values.year
            ),

        month:
            Number(
                values.month
            ),

        day:
            Number(
                values.day
            ),

        hour:
            Number(
                values.hour
            ),

        minute:
            Number(
                values.minute
            ),

        second:
            Number(
                values.second
            ),

        weekday:
            weekdayMap[
                values.weekday
            ]
    };
}

/**
 * Convert local calendar values in a selected
 * timezone into a real UTC JavaScript Date.
 *
 * This avoids depending on an external timezone
 * or scheduling package.
 *
 * @param {{
 *     year: number,
 *     month: number,
 *     day: number,
 *     hour?: number,
 *     minute?: number,
 *     second?: number
 * }} dateParts
 * @param {string} timezone
 * @returns {Date}
 */
function zonedDateTimeToUtc(
    dateParts,
    timezone =
        rankTrialConfig.timezone
) {
    const target = {
        year:
            Number(
                dateParts.year
            ),

        month:
            Number(
                dateParts.month
            ),

        day:
            Number(
                dateParts.day
            ),

        hour:
            Number(
                dateParts.hour ??
                0
            ),

        minute:
            Number(
                dateParts.minute ??
                0
            ),

        second:
            Number(
                dateParts.second ??
                0
            )
    };

    let candidate =
        new Date(
            Date.UTC(
                target.year,
                target.month - 1,
                target.day,
                target.hour,
                target.minute,
                target.second,
                0
            )
        );

    /*
     * Recalculate a few times because the
     * timezone offset may move the initial
     * UTC candidate across a calendar day.
     */
    for (
        let attempt = 0;
        attempt < 4;
        attempt += 1
    ) {
        const actual =
            getZonedDateParts(
                candidate,
                timezone
            );

        const targetTimestamp =
            Date.UTC(
                target.year,
                target.month - 1,
                target.day,
                target.hour,
                target.minute,
                target.second
            );

        const actualTimestamp =
            Date.UTC(
                actual.year,
                actual.month - 1,
                actual.day,
                actual.hour,
                actual.minute,
                actual.second
            );

        const difference =
            targetTimestamp -
            actualTimestamp;

        if (
            difference ===
            0
        ) {
            break;
        }

        candidate =
            new Date(
                candidate.getTime() +
                difference
            );
    }

    return candidate;
}

/**
 * Return the number of days inside one month.
 *
 * Month values use the normal range:
 *
 * 1 = January
 * 12 = December
 *
 * @param {number} year
 * @param {number} month
 * @returns {number}
 */
function getDaysInMonth(
    year,
    month
) {
    return new Date(
        Date.UTC(
            year,
            month,
            0
        )
    ).getUTCDate();
}

/**
 * Find the final configured weekday of a month.
 *
 * The Rank Trial config currently uses:
 *
 * 6 = Saturday
 *
 * @param {number} year
 * @param {number} month
 * @param {number} weekday
 * @param {string} timezone
 * @returns {number}
 */
function getLastWeekdayOfMonth(
    year,
    month,
    weekday =
        rankTrialConfig.trialWeekday,
    timezone =
        rankTrialConfig.timezone
) {
    const finalDay =
        getDaysInMonth(
            year,
            month
        );

    for (
        let day = finalDay;
        day >= finalDay - 6;
        day -= 1
    ) {
        const localDate =
            zonedDateTimeToUtc(
                {
                    year,
                    month,
                    day,

                    hour:
                        12,

                    minute:
                        0,

                    second:
                        0
                },
                timezone
            );

        const localParts =
            getZonedDateParts(
                localDate,
                timezone
            );

        if (
            localParts.weekday ===
            weekday
        ) {
            return day;
        }
    }

    throw new Error(
        'Evelynn could not calculate the final Rank Trial weekday.'
    );
}

/**
 * Calculate the official Rank Trial battle
 * start for one year and month.
 *
 * @param {number} year
 * @param {number} month
 * @returns {Date}
 */
function getRankTrialBattleStart(
    year,
    month
) {
    const trialDay =
        getLastWeekdayOfMonth(
            year,
            month,
            rankTrialConfig.trialWeekday,
            rankTrialConfig.timezone
        );

    return zonedDateTimeToUtc(
        {
            year,
            month,

            day:
                trialDay,

            hour:
                rankTrialConfig
                    .battleStartHour,

            minute:
                rankTrialConfig
                    .battleStartMinute,

            second:
                0
        },
        rankTrialConfig.timezone
    );
}

/**
 * Move one local calendar date forward or
 * backward while keeping the desired local
 * announcement time.
 *
 * @param {Date} baseDate
 * @param {number} dayOffset
 * @param {number} hour
 * @param {number} minute
 * @returns {Date}
 */
function shiftLocalCalendarDays(
    baseDate,
    dayOffset,
    hour,
    minute
) {
    const baseParts =
        getZonedDateParts(
            baseDate,
            rankTrialConfig.timezone
        );

    const shiftedCalendarDate =
        new Date(
            Date.UTC(
                baseParts.year,
                baseParts.month - 1,
                baseParts.day +
                    dayOffset,
                12,
                0,
                0
            )
        );

    return zonedDateTimeToUtc(
        {
            year:
                shiftedCalendarDate
                    .getUTCFullYear(),

            month:
                shiftedCalendarDate
                    .getUTCMonth() +
                1,

            day:
                shiftedCalendarDate
                    .getUTCDate(),

            hour,
            minute,

            second:
                0
        },
        rankTrialConfig.timezone
    );
}

/**
 * Build one scheduled announcement date
 * relative to the monthly battle start.
 *
 * @param {Date} battleStart
 * @param {{
 *     daysBefore?: number,
 *     daysAfter?: number,
 *     hour: number,
 *     minute: number
 * }} announcementConfig
 * @returns {Date}
 */
function buildAnnouncementDate(
    battleStart,
    announcementConfig
) {
    const daysBefore =
        Number(
            announcementConfig
                .daysBefore ??
            0
        );

    const daysAfter =
        Number(
            announcementConfig
                .daysAfter ??
            0
        );

    const dayOffset =
        daysAfter -
        daysBefore;

    return shiftLocalCalendarDays(
        battleStart,
        dayOffset,
        announcementConfig.hour,
        announcementConfig.minute
    );
}

/**
 * Build the complete publication schedule
 * for one monthly Rank Trial.
 *
 * @param {number} year
 * @param {number} month
 * @returns {{
 *     year: number,
 *     month: number,
 *     trialKey: string,
 *     battleStart: Date,
 *     publications: Array<{
 *         key: string,
 *         type: string,
 *         scheduledFor: Date,
 *         mentionEveryone: boolean
 *     }>
 * }}
 */
function buildMonthlyRankTrialSchedule(
    year,
    month
) {
    const battleStart =
        getRankTrialBattleStart(
            year,
            month
        );

    const announcementEntries = [
        {
            key:
                'opening',

            config:
                rankTrialConfig
                    .announcements
                    .opening
        },
        {
            key:
                'registrationReminder',

            config:
                rankTrialConfig
                    .announcements
                    .registrationReminder
        },
        {
            key:
                'finalReminder',

            config:
                rankTrialConfig
                    .announcements
                    .finalReminder
        },
        {
            key:
                'battleStart',

            config:
                rankTrialConfig
                    .announcements
                    .battleStart
        },
        {
            key:
                'closing',

            config:
                rankTrialConfig
                    .announcements
                    .closing
        }
    ];

    const publications =
        announcementEntries
            .filter(
                entry =>
                    entry.config
                        .enabled
            )
            .map(
                entry => ({
                    key:
                        entry.key,

                    type:
                        rankTrialConfig
                            .publicationTypes[
                                entry.key
                            ],

                    scheduledFor:
                        buildAnnouncementDate(
                            battleStart,
                            entry.config
                        ),

                    mentionEveryone:
                        entry.config
                            .mentionEveryone ===
                        true
                })
            )
            .sort(
                (
                    first,
                    second
                ) =>
                    first.scheduledFor
                        .getTime() -
                    second.scheduledFor
                        .getTime()
            );

    return {
        year,
        month,

        trialKey:
            `${year}-${String(
                month
            ).padStart(
                2,
                '0'
            )}`,

        battleStart,
        publications
    };
}

/**
 * Return the current year and month inside
 * the configured THE Ⅹ SINS timezone.
 *
 * @param {Date} now
 * @returns {{
 *     year: number,
 *     month: number
 * }}
 */
function getCurrentRankTrialMonth(
    now =
        new Date()
) {
    const localParts =
        getZonedDateParts(
            now,
            rankTrialConfig.timezone
        );

    return {
        year:
            localParts.year,

        month:
            localParts.month
    };
}

/**
 * Calculate the next month after a selected
 * year and month.
 *
 * @param {number} year
 * @param {number} month
 * @returns {{
 *     year: number,
 *     month: number
 * }}
 */
function getNextMonth(
    year,
    month
) {
    if (
        month ===
        12
    ) {
        return {
            year:
                year + 1,

            month:
                1
        };
    }

    return {
        year,

        month:
            month + 1
    };
}

/**
 * Return the currently relevant Rank Trial
 * schedule.
 *
 * Before the current month's closing notice,
 * the current schedule is returned.
 *
 * After it has passed, the next month's
 * schedule is returned.
 *
 * @param {Date} now
 * @returns {ReturnType<typeof buildMonthlyRankTrialSchedule>}
 */
function getRelevantRankTrialSchedule(
    now =
        new Date()
) {
    const currentMonth =
        getCurrentRankTrialMonth(
            now
        );

    const currentSchedule =
        buildMonthlyRankTrialSchedule(
            currentMonth.year,
            currentMonth.month
        );

    const finalPublication =
        currentSchedule
            .publications[
                currentSchedule
                    .publications
                    .length -
                1
            ];

    if (
        !finalPublication ||
        now.getTime() <=
            finalPublication
                .scheduledFor
                .getTime()
    ) {
        return currentSchedule;
    }

    const nextMonth =
        getNextMonth(
            currentMonth.year,
            currentMonth.month
        );

    return buildMonthlyRankTrialSchedule(
        nextMonth.year,
        nextMonth.month
    );
}

/**
 * Convert one Date into a Discord timestamp.
 *
 * @param {Date} date
 * @param {'t'|'T'|'d'|'D'|'f'|'F'|'R'} style
 * @returns {string}
 */
function toDiscordTimestamp(
    date,
    style =
        'F'
) {
    const unixTimestamp =
        Math.floor(
            date.getTime() /
            1000
        );

    return `<t:${unixTimestamp}:${style}>`;
}

module.exports = {
    getZonedDateParts,
    zonedDateTimeToUtc,
    getDaysInMonth,
    getLastWeekdayOfMonth,
    getRankTrialBattleStart,
    shiftLocalCalendarDays,
    buildAnnouncementDate,
    buildMonthlyRankTrialSchedule,
    getCurrentRankTrialMonth,
    getNextMonth,
    getRelevantRankTrialSchedule,
    toDiscordTimestamp
};