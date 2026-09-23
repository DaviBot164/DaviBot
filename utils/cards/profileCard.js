const {
    createCanvas,
    loadImage
} = require('@napi-rs/canvas');

const {
    getProgress
} = require('../leveling');

const {
    getRank
} = require('../../handlers/factionHandler');

const {
    FACTIONS
} = require('../../config/progression');

const brand =
    require('../../config/brand');

const WIDTH = 1100;
const HEIGHT = 440;

function formatNumber(
    value
) {
    return Number(
        value || 0
    ).toLocaleString(
        'en-US'
    );
}

function getCardName(
    member
) {
    const displayName =
        member.displayName?.trim();

    if (
        displayName &&
        /[\p{L}\p{N}]/u.test(
            displayName
        )
    ) {
        return displayName;
    }

    return member.user.username;
}

function fitText(
    ctx,
    text,
    maxWidth,
    startSize,
    minSize
) {
    let size =
        startSize;

    while (
        size > minSize
    ) {
        ctx.font =
            `700 ${size}px sans-serif`;

        if (
            ctx.measureText(
                text
            ).width <= maxWidth
        ) {
            break;
        }

        size -= 2;
    }

    return size;
}

async function createProfileCard(
    member,
    user,
    {
        title = null,
        achievementCount = 0
    } = {}
) {
    const canvas =
        createCanvas(
            WIDTH,
            HEIGHT
        );

    const ctx =
        canvas.getContext('2d');

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            WIDTH,
            HEIGHT
        );

    gradient.addColorStop(
        0,
        '#08090B'
    );

    gradient.addColorStop(
        0.55,
        '#151014'
    );

    gradient.addColorStop(
        1,
        '#3A0A13'
    );

    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    const moonGlow =
        ctx.createRadialGradient(
            930,
            55,
            20,
            930,
            55,
            210
        );

    moonGlow.addColorStop(
        0,
        'rgba(155, 28, 49, 0.35)'
    );

    moonGlow.addColorStop(
        1,
        'rgba(155, 28, 49, 0)'
    );

    ctx.fillStyle =
        moonGlow;

    ctx.fillRect(
        700,
        0,
        400,
        300
    );

    ctx.fillStyle =
        'rgba(0, 0, 0, 0.30)';

    ctx.beginPath();

    ctx.roundRect(
        30,
        30,
        1040,
        380,
        30
    );

    ctx.fill();

    ctx.fillStyle =
        '#9B1C31';

    ctx.beginPath();

    ctx.roundRect(
        30,
        30,
        7,
        380,
        4
    );

    ctx.fill();

    const avatar =
        await loadImage(
            member.user
                .displayAvatarURL({
                    extension: 'png',
                    size: 256
                })
        );

    ctx.save();

    ctx.beginPath();

    ctx.arc(
        170,
        195,
        105,
        0,
        Math.PI * 2
    );

    ctx.clip();

    ctx.drawImage(
        avatar,
        65,
        90,
        210,
        210
    );

    ctx.restore();

    ctx.strokeStyle =
        '#9B1C31';

    ctx.lineWidth = 6;

    ctx.beginPath();

    ctx.arc(
        170,
        195,
        108,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    const faction =
        user.faction ===
        FACTIONS.SLAYER
            ? 'SLAYER'
            : user.faction ===
                FACTIONS.DEMON
                ? 'DEMON'
                : 'UNCHOSEN';

    const rank =
        user.faction &&
        user.rank
            ? getRank(
                user.faction,
                user.rank
            )
            : null;

    const progress =
        getProgress(
            user.level,
            user.xp
        );

    ctx.fillStyle =
        '#C8A45D';

    ctx.font =
        '600 20px sans-serif';

    ctx.fillText(
        `${brand.server.toUpperCase()} • PROFILE`,
        330,
        65
    );

    const displayName =
        getCardName(
            member
        );

    const nameSize =
        fitText(
            ctx,
            displayName,
            650,
            43,
            28
        );

    ctx.fillStyle =
        '#F5F5F5';

    ctx.font =
        `700 ${nameSize}px sans-serif`;

    ctx.fillText(
        displayName,
        330,
        118
    );

    if (title) {
        ctx.fillStyle =
            '#C8A45D';

        ctx.font =
            '600 19px sans-serif';

        ctx.fillText(
            `「 ${title.name.toUpperCase()} 」`,
            332,
            151
        );
    }

    ctx.fillStyle =
        '#AFAFAF';

    ctx.font =
        '500 18px sans-serif';

    ctx.fillText(
        `${faction} • ${
            rank
                ? rank.name.toUpperCase()
                : 'UNRANKED'
        }`,
        332,
        title
            ? 182
            : 158
    );

    const levelY =
        title
            ? 240
            : 220;

    ctx.fillStyle =
        '#FFFFFF';

    ctx.font =
        '700 48px sans-serif';

    ctx.fillText(
        `LEVEL ${user.level}`,
        330,
        levelY
    );

    const barX = 330;
    const barY =
        levelY + 24;

    const barWidth = 620;
    const barHeight = 16;

    ctx.fillStyle =
        '#29292E';

    ctx.beginPath();

    ctx.roundRect(
        barX,
        barY,
        barWidth,
        barHeight,
        8
    );

    ctx.fill();

    const progressWidth =
        barWidth *
        (
            progress.percentage /
            100
        );

    if (
        progressWidth > 0
    ) {
        ctx.fillStyle =
            '#9B1C31';

        ctx.beginPath();

        ctx.roundRect(
            barX,
            barY,
            progressWidth,
            barHeight,
            8
        );

        ctx.fill();
    }

    ctx.fillStyle =
        '#AFAFAF';

    ctx.font =
        '500 16px sans-serif';

    ctx.fillText(
        `${formatNumber(
            progress.current
        )} / ${formatNumber(
            progress.required
        )} XP`,
        barX,
        barY + 42
    );

    ctx.fillStyle =
        '#F5F5F5';

    ctx.font =
        '600 17px sans-serif';

    ctx.fillText(
        `MESSAGES  ${formatNumber(
            user.messages
        )}`,
        330,
        355
    );

    ctx.fillText(
        `ACHIEVEMENTS  ${formatNumber(
            achievementCount
        )}`,
        545,
        355
    );

    ctx.fillText(
        `RANK POINTS  ${formatNumber(
            user.rankPoints
        )}`,
        790,
        355
    );

    ctx.fillStyle =
        '#77777D';

    ctx.font =
        '400 16px sans-serif';

    ctx.fillText(
        'Forged beneath the Blood Moon.',
        330,
        392
    );

    return canvas.toBuffer(
        'image/png'
    );
}

module.exports = {
    createProfileCard
};