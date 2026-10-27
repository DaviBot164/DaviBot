const {serverText}=require("../guildContext");
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { getProgress } = require('../leveling');
const { getRank } = require('../../handlers/factionHandler');
const { FACTIONS } = require('../../config/progression');
const brand = require('../../config/brand');
const theme=require('./theme');
const WIDTH = 1100;
const HEIGHT = 700;
const COLORS = Object.freeze({
    background: '#090A0E',
    panel: '#13141B',
    white: '#F2F0F2',
    muted: '#AAA6B1',
    gold: '#D5B779',
    crimson:'#B42D48',
    get accent(){return theme.accent();},
    blue: '#70A9EF',
    green: '#7CC9A0',
    border: 'rgba(255,255,255,0.08)'
});
function number(value) {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}
function formatNumber(value) {
    return number(value).toLocaleString('en-US');
}
function rounded(ctx, x, y, width, height, radius, fill) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fillStyle = fill;
    ctx.fill();
}
function panel(ctx, x, y, width, height) {
    rounded(ctx, x, y, width, height, 16, COLORS.panel);
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.stroke();
}
function fittedText(ctx, value, maxWidth, size, weight) {
    const characters = Array.from(String(value ?? '').replace(/[\r\n\t]+/gu, ' '));
    let fontSize = size;
    const minSize = Math.min(size, 14);
    ctx.font = `${weight} ${fontSize}px sans-serif`;
    while (fontSize > minSize &&
        ctx.measureText(characters.join('')).width > maxWidth) {
        fontSize -= 1;
        ctx.font = `${weight} ${fontSize}px sans-serif`;
    }
    if (ctx.measureText(characters.join('')).width <= maxWidth) {
        return characters.join('');
    }
    while (characters.length &&
        ctx.measureText(`${characters.join('')}…`).width > maxWidth) {
        characters.pop();
    }
    return characters.length ? `${characters.join('')}…` : '';
}
function text(ctx, value, x, y, width, size = 20, color = COLORS.white, weight = 600, align = 'left') {
    ctx.save();
    const display = fittedText(ctx, value, width, size, weight);
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(display, x, y);
    ctx.restore();
}
function label(ctx, value, x, y, width) {
    text(ctx, value, x, y, width, 16, COLORS.muted, 600);
}
function stat(ctx, x, y, labelText, value, accent = COLORS.gold) {
    const width = 244;
    panel(ctx, x, y, width, 76);
    rounded(ctx, x + 16, y + 19, 3, 13, 1, accent);
    label(ctx, labelText.toUpperCase(), x + 28, y + 30, width - 44);
    text(ctx, value, x + 18, y + 61, width - 36, 25);
}
function getFaction(user) {
    if (user.faction === FACTIONS.SLAYER) {
        return { name: serverText('Slayer'), color: COLORS.blue };
    }
    if (user.faction === FACTIONS.DEMON) {
        return { name: serverText('Demon'), color: COLORS.crimson };
    }
    return { name: 'Not chosen', color: COLORS.muted };
}
function formatDate(value) {
    if (!value)
        return 'Unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return 'Unknown';
    return date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
    });
}
async function drawAvatar(ctx, member, accent) {
    const x = 64;
    const y = 99;
    const size = 142;
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#25212B';
    ctx.fillRect(x, y, size, size);
    try {
        const avatar = await loadImage(member.displayAvatarURL({
            extension: 'png',
            size: 256
        }));
        ctx.drawImage(avatar, x, y, size, size);
    }
    catch (error) {
        const initial = Array.from(member.user.username || '?')[0].toUpperCase();
        text(ctx, initial, centerX, centerY + 18, size - 24, 52, COLORS.gold, 700, 'center');
        console.error('Profile avatar could not be loaded:', error.message);
    }
    finally {
        ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2 + 5, 0, Math.PI * 2);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.stroke();
}
async function createProfileCard(member, user, { title = null, achievementCount = 0, stats = null } = {}) {
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');
    const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    background.addColorStop(0, COLORS.background);
    background.addColorStop(1,theme.shade(theme.accent(),.18));
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const glow = ctx.createRadialGradient(1040, 0, 0, 1040, 0, 430);
    glow.addColorStop(0,theme.accent()+'2b');
    glow.addColorStop(1,theme.accent()+'00');
    ctx.fillStyle = glow;
    ctx.fillRect(600, 0, 500, 430);
    const faction = getFaction(user);
    const rank = user.faction && user.rank
        ? getRank(user.faction, user.rank)
        : null;
    const progress = getProgress(user.level, user.xp);
    const current = number(progress.current);
    const required = number(progress.required);
    const remaining = Math.max(0, required - current);
    const percentage = Math.min(100, Math.max(0, number(progress.percentage)));
    const serverName = String(brand.server ?? brand.serverName ?? serverText('Blood Moon'));
    text(ctx, serverName.toUpperCase(), 40, 43, 650, 17, COLORS.gold, 700);
    text(ctx, 'SOUL PROFILE', 1060, 43, 300, 12, COLORS.muted, 600, 'right');
    // Identity: avatar, name and equipped title.
    panel(ctx, 40, 70, 1020, 198);
    await drawAvatar(ctx, member, faction.color);
    const displayName = member.displayName &&
        /[\p{L}\p{N}]/u.test(member.displayName)
        ? member.displayName
        : member.user.username;
    text(ctx, displayName, 240, 122, 785, 36, COLORS.white, 700);
    text(ctx, `@${member.user.username}`, 242, 151, 780, 17, COLORS.muted, 500);
    text(ctx, title?.name ?? 'No title equipped', 242, 183, 780, 19, title ? COLORS.gold : COLORS.muted, 500);
    label(ctx, 'PATH', 242, 218, 200);
    text(ctx, faction.name, 242, 245, 270, 21, faction.color, 700);
    label(ctx, 'RANK', 570, 218, 440);
    text(ctx, rank?.name ?? 'Unranked', 570, 245, 450, 21, COLORS.white, 700);
    // Level and XP have their own uninterrupted section.
    panel(ctx, 40, 284, 1020, 142);
    label(ctx, 'SERVER PROGRESSION', 60, 310, 500);
    text(ctx, `Level ${formatNumber(user.level)}`, 60, 346, 550, 30, COLORS.white, 700);
    text(ctx, `${formatNumber(remaining)} XP to next level`, 1040, 345, 420, 16, COLORS.muted, 500, 'right');
    const barX = 60;
    const barY = 363;
    const barWidth = 980;
    const barHeight = 12;
    rounded(ctx, barX, barY, barWidth, barHeight, 6, '#292631');
    if (percentage > 0) {
        const fill = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        fill.addColorStop(0, COLORS.accent);
        fill.addColorStop(1, COLORS.gold);
        // Clip the fill so very small values keep the rounded bar shape.
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, 6);
        ctx.clip();
        ctx.fillStyle = fill;
        ctx.fillRect(barX, barY, barWidth * percentage / 100, barHeight);
        ctx.restore();
    }
    text(ctx, `${formatNumber(current)} / ${formatNumber(required)} XP`, 60, 405, 740, 15, COLORS.muted, 500);
    text(ctx, `${Math.round(percentage)}%`, 1040, 405, 150, 15, COLORS.gold, 600, 'right');
    label(ctx, 'ACTIVITY & PROGRESSION', 42, 453, 650);
    const columns = [40, 299, 558, 817];
    stat(ctx, columns[0], 466, 'Messages', formatNumber(user.messages));
    stat(ctx, columns[1], 466, 'Achievements', formatNumber(achievementCount));
    stat(ctx, columns[2], 466, 'Rank Points', formatNumber(user.rankPoints));
    stat(ctx, columns[3], 466, 'Daily Streak', formatNumber(stats?.dailyStreak));
    stat(ctx, columns[0], 556, 'Duel Wins', formatNumber(stats?.duelWins), COLORS.green);
    stat(ctx, columns[1], 556, 'Duel Losses', formatNumber(stats?.duelLosses), COLORS.crimson);
    stat(ctx, columns[2], 556, 'Event Points', formatNumber(stats?.eventPoints));
    stat(ctx, columns[3], 556, 'Joined Server', formatDate(member.joinedAt), COLORS.blue);
    text(ctx, serverText('Your journey beneath the Blood Moon.'), 42, 674, 550, 13, COLORS.muted, 400);
    text(ctx, brand.footer ?? serverText('Kitsune • Blood Moon'), 1059, 674, 430, 13, COLORS.muted, 500, 'right');
    return canvas.toBuffer('image/png');
}
module.exports = { createProfileCard };
