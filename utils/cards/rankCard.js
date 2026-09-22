const {
    createCanvas,
    loadImage
} = require('@napi-rs/canvas');

const {
    FACTIONS
} = require('../../config/progression');

const WIDTH = 1000;
const HEIGHT = 320;

async function createRankCard(
    member,
    faction,
    rank
) {
    const canvas = createCanvas(
        WIDTH,
        HEIGHT
    );

    const ctx = canvas.getContext('2d');

    const isSlayer =
        faction === FACTIONS.SLAYER;

    const accent = isSlayer
        ? '#C8A45D'
        : '#B91C1C';

    const glow = isSlayer
        ? '#493C24'
        : '#4A0B12';

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
        '#111114'
    );

    gradient.addColorStop(
        1,
        glow
    );

    ctx.fillStyle = gradient;
    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    ctx.globalAlpha = 0.15;
    ctx.fillStyle = accent;

    ctx.beginPath();
    ctx.arc(
        850,
        55,
        150,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.globalAlpha = 1;

    ctx.fillStyle =
        'rgba(0, 0, 0, 0.30)';

    ctx.beginPath();
    ctx.roundRect(
        30,
        30,
        940,
        260,
        28
    );
    ctx.fill();

    const avatar = await loadImage(
        member.user.displayAvatarURL({
            extension: 'png',
            size: 256
        })
    );

    ctx.save();

    ctx.beginPath();
    ctx.arc(
        165,
        160,
        92,
        0,
        Math.PI * 2
    );
    ctx.clip();

    ctx.drawImage(
        avatar,
        73,
        68,
        184,
        184
    );

    ctx.restore();

    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;

    ctx.beginPath();
    ctx.arc(
        165,
        160,
        95,
        0,
        Math.PI * 2
    );
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.font = '600 22px sans-serif';

    ctx.fillText(
        'BLOOD MOON • AKANE',
        305,
        82
    );

    const displayName =
        member.displayName.length > 20
            ? `${member.displayName.slice(0, 20)}…`
            : member.displayName;

    ctx.fillStyle = '#F5F5F5';
    ctx.font = '700 42px sans-serif';

    ctx.fillText(
        displayName,
        305,
        137
    );

    ctx.fillStyle = '#AFAFAF';
    ctx.font = '500 20px sans-serif';

    ctx.fillText(
        isSlayer
            ? 'SLAYER ASCENSION'
            : 'DEMON ASCENSION',
        307,
        175
    );

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 48px sans-serif';

    ctx.fillText(
        rank.name.toUpperCase(),
        305,
        235
    );

    ctx.fillStyle = accent;

    ctx.fillRect(
        305,
        257,
        500,
        3
    );

    ctx.fillStyle = '#8F8F8F';
    ctx.font = '400 17px sans-serif';

    ctx.fillText(
        isSlayer
            ? 'Your blade rises beneath the Blood Moon.'
            : 'Your blood grows stronger beneath the Blood Moon.',
        305,
        285
    );

    return canvas.toBuffer(
        'image/png'
    );
}

module.exports = {
    createRankCard
};