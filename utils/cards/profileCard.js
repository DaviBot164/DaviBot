const {
    createCanvas,
    loadImage
} = require('@napi-rs/canvas');

const { getProgress } = require('../leveling');
const { getRank } = require('../../handlers/factionHandler');
const { FACTIONS } = require('../../config/progression');
const brand = require('../../config/brand');

const WIDTH = 1100;
const HEIGHT = 620;

const COLORS = {
    background: '#08090B',
    surface: '#151014',
    crimson: '#9B1C31',
    gold: '#C8A45D',
    white: '#F5F5F5',
    muted: '#AFAFAF',
    border: 'rgba(255,255,255,0.08)'
};

function formatNumber(value) {
    return Number(value || 0).toLocaleString('en-US');
}

function fitText(ctx, value, maxWidth, size = 28, min = 12) {
    const text = String(value ?? '');

    while (size > min) {
        ctx.font = `700 ${size}px sans-serif`;

        if (ctx.measureText(text).width <= maxWidth) {
            break;
        }

        size -= 2;
    }

    return size;
}

function trimText(ctx, value, maxWidth) {
    let text = String(value ?? '');

    if (ctx.measureText(text).width <= maxWidth) {
        return text;
    }

    while (
        text.length &&
        ctx.measureText(`${text}…`).width > maxWidth
    ) {
        text = text.slice(0, -1);
    }

    return `${text}…`;
}

function roundRect(ctx, x, y, width, height, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
}

function drawText(
    ctx,
    value,
    x,
    y,
    size = 20,
    color = COLORS.white,
    weight = 600,
    maxWidth = null
) {
    ctx.font = `${weight} ${size}px sans-serif`;
    ctx.fillStyle = color;

    const text = maxWidth
        ? trimText(ctx, value, maxWidth)
        : String(value ?? '');

    ctx.fillText(text, x, y);
}

function drawStat(ctx, x, y, label, value, accent = COLORS.gold) {
    const width = 242;
    const height = 76;

    roundRect(
        ctx,
        x,
        y,
        width,
        height,
        15,
        'rgba(255,255,255,0.045)'
    );

    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 15);
    ctx.stroke();

    roundRect(ctx, x + 14, y + 17, 3, 14, 2, accent);

    drawText(
        ctx,
        label.toUpperCase(),
        x + 26,
        y + 29,
        13,
        COLORS.muted,
        600
    );

    ctx.font = '700 26px sans-serif';

    const display = trimText(
        ctx,
        formatNumber(value),
        width - 36
    );

    drawText(
        ctx,
        display,
        x + 18,
        y + 62,
        26
    );
}

function getFaction(user) {
    if (user.faction === FACTIONS.SLAYER) {
        return {
            name: 'SLAYER',
            color: '#4A90E2'
        };
    }

    if (user.faction === FACTIONS.DEMON) {
        return {
            name: 'DEMON',
            color: COLORS.crimson
        };
    }

    return {
        name: 'UNCHOSEN',
        color: COLORS.muted
    };
}

function formatDate(value) {
    if (!value) {
        return 'Unknown';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Unknown';
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
    });
}

async function createProfileCard(
    member,
    user,
    {
        title = null,
        achievementCount = 0,
        stats = null
    } = {}
) {
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    const background = ctx.createLinearGradient(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    background.addColorStop(0, COLORS.background);
    background.addColorStop(0.55, COLORS.surface);
    background.addColorStop(1, '#350A12');

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const glow = ctx.createRadialGradient(
        950, 80, 15,
        950, 80, 280
    );

    glow.addColorStop(0, 'rgba(155,28,49,0.35)');
    glow.addColorStop(1, 'rgba(155,28,49,0)');

    ctx.fillStyle = glow;
    ctx.fillRect(650, 0, 450, 370);

    ctx.fillStyle = 'rgba(200,164,93,0.09)';
    ctx.beginPath();
    ctx.arc(960, 100, 62, 0, Math.PI * 2);
    ctx.fill();

    roundRect(
        ctx,
        22,
        22,
        1056,
        576,
        25,
        'rgba(0,0,0,0.25)'
    );

    roundRect(
        ctx,
        22,
        22,
        7,
        576,
        4,
        COLORS.crimson
    );

    drawText(
        ctx,
        `${brand.server.toUpperCase()} • SOUL PROFILE`,
        58,
        65,
        19,
        COLORS.gold,
        700,
        700
    );

    drawText(
        ctx,
        'AKANE • PLAYER IDENTITY',
        58,
        95,
        13,
        COLORS.muted
    );

    const faction = getFaction(user);

    const rank = user.faction && user.rank
        ? getRank(user.faction, user.rank)
        : null;

    const progress = getProgress(user.level, user.xp);

    const percentage = Math.max(
        0,
        Math.min(100, Number(progress.percentage) || 0)
    );

    const avatar = await loadImage(
        member.user.displayAvatarURL({
            extension: 'png',
            size: 256
        })
    );

    const centerX = 170;
    const centerY = 225;
    const radius = 105;

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(
        avatar,
        centerX - radius,
        centerY - radius,
        radius * 2,
        radius * 2
    );

    ctx.restore();

    ctx.strokeStyle = faction.color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(200,164,93,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 12, 0, Math.PI * 2);
    ctx.stroke();

    const displayName =
        member.displayName &&
        /[\p{L}\p{N}]/u.test(member.displayName)
            ? member.displayName
            : member.user.username;

    const nameSize = fitText(
        ctx,
        displayName,
        550,
        42,
        24
    );

    drawText(
        ctx,
        displayName,
        330,
        151,
        nameSize,
        COLORS.white,
        700,
        550
    );

    drawText(
        ctx,
        `@${member.user.username}`,
        332,
        180,
        17,
        COLORS.muted,
        500,
        550
    );

    if (title) {
        drawText(
            ctx,
            `「 ${title.name.toUpperCase()} 」`,
            332,
            211,
            18,
            COLORS.gold,
            600,
            550
        );
    }

    drawText(
        ctx,
        faction.name,
        332,
        244,
        18,
        faction.color,
        700
    );

    drawText(
        ctx,
        rank ? rank.name.toUpperCase() : 'UNRANKED',
        332,
        273,
        17,
        COLORS.muted,
        600,
        550
    );

    drawText(
        ctx,
        `LEVEL ${formatNumber(user.level)}`,
        332,
        322,
        32,
        COLORS.white,
        700
    );

    const barX = 332;
    const barY = 339;
    const barWidth = 665;
    const barHeight = 15;

    roundRect(
        ctx,
        barX,
        barY,
        barWidth,
        barHeight,
        8,
        '#29292E'
    );

    const filledWidth = barWidth * percentage / 100;

    if (filledWidth > 0) {
        const barGradient = ctx.createLinearGradient(
            barX,
            barY,
            barX + barWidth,
            barY
        );

        barGradient.addColorStop(0, COLORS.crimson);
        barGradient.addColorStop(1, COLORS.gold);

        roundRect(
            ctx,
            barX,
            barY,
            filledWidth,
            barHeight,
            8,
            barGradient
        );
    }

    drawText(
        ctx,
        `${formatNumber(progress.current)} / ${formatNumber(progress.required)} XP`,
        barX,
        377,
        15,
        COLORS.muted
    );

    ctx.textAlign = 'right';

    drawText(
        ctx,
        `${Math.round(percentage)}%`,
        barX + barWidth,
        377,
        15,
        COLORS.gold
    );

    ctx.textAlign = 'left';

    const columns = [47, 306, 565, 824];

    const firstRow = 405;
    const secondRow = 497;

    drawStat(
        ctx,
        columns[0],
        firstRow,
        'Messages',
        user.messages
    );

    drawStat(
        ctx,
        columns[1],
        firstRow,
        'Achievements',
        achievementCount
    );

    drawStat(
        ctx,
        columns[2],
        firstRow,
        'Rank Points',
        user.rankPoints
    );

    drawStat(
        ctx,
        columns[3],
        firstRow,
        'Duel Wins',
        stats?.duelWins || 0,
        '#4CAF50'
    );

    drawStat(
        ctx,
        columns[0],
        secondRow,
        'Duel Losses',
        stats?.duelLosses || 0,
        COLORS.crimson
    );

    drawStat(
        ctx,
        columns[1],
        secondRow,
        'Daily Streak',
        stats?.dailyStreak || 0
    );

    drawStat(
        ctx,
        columns[2],
        secondRow,
        'Event Points',
        stats?.eventPoints || 0
    );

    roundRect(
        ctx,
        columns[3],
        secondRow,
        242,
        76,
        15,
        'rgba(255,255,255,0.045)'
    );

    drawText(
        ctx,
        'JOINED SERVER',
        columns[3] + 18,
        secondRow + 29,
        13,
        COLORS.muted
    );

    drawText(
        ctx,
        formatDate(member.joinedAt),
        columns[3] + 18,
        secondRow + 61,
        24,
        COLORS.white,
        700
    );

    drawText(
        ctx,
        'Forged beneath the Blood Moon.',
        50,
        594,
        14,
        COLORS.muted,
        400
    );

    ctx.textAlign = 'right';

    drawText(
        ctx,
        brand.footer,
        1055,
        594,
        13,
        COLORS.muted,
        500,
        400
    );

    ctx.textAlign = 'left';

    return canvas.toBuffer('image/png');
}

module.exports = {
    createProfileCard
};