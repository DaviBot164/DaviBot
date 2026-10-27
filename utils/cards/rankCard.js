const {serverText}=require("../guildContext");
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { FACTIONS } = require('../../config/progression');
const theme=require('./theme');
const brand=require('../../config/brand');
const WIDTH = 1000;
const HEIGHT = 320;
async function createRankCard(member, faction, rank) {
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');
    const isSlayer = faction === FACTIONS.SLAYER;
    const accent=theme.accent();
    const glow=theme.shade(accent,.24);
    const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, '#08090B');
    gradient.addColorStop(0.55, '#111114');
    gradient.addColorStop(1, glow);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(850, 55, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle =
        'rgba(0, 0, 0, 0.30)';
    ctx.beginPath();
    ctx.roundRect(30, 30, 940, 260, 28);
    ctx.fill();
    ctx.save();ctx.beginPath();ctx.arc(165,160,92,0,Math.PI*2);ctx.clip();
    ctx.fillStyle='#24242b';ctx.fillRect(73,68,184,184);
    try{const avatar=await loadImage(member.user.displayAvatarURL({extension:'png',size:256}));ctx.drawImage(avatar,73,68,184,184);}
    catch{ctx.fillStyle=accent;ctx.font='700 64px sans-serif';ctx.textAlign='center';ctx.fillText(Array.from(member.displayName??member.user.username??'?')[0].toUpperCase(),165,182);ctx.textAlign='left';}
    finally{ctx.restore();}
    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(165, 160, 95, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.font = '600 22px sans-serif';
    ctx.fillText(theme.fit(ctx,`${brand.name} · ${brand.server}`,640,22,16),305,82);
    const displayName=member.displayName??member.user.username??'Member';
    ctx.fillStyle = '#F5F5F5';
    ctx.font = '700 42px sans-serif';
    ctx.fillText(theme.fit(ctx,displayName,640,42,20,700),305,137);
    ctx.fillStyle = '#AFAFAF';
    ctx.font = '500 20px sans-serif';
    ctx.fillText(isSlayer
        ? serverText('SLAYER ASCENSION') : serverText('DEMON ASCENSION'), 307, 175);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 48px sans-serif';
    ctx.fillText(theme.fit(ctx,rank.name,640,48,22,700),305,235);
    ctx.fillStyle = accent;
    ctx.fillRect(305, 257, 500, 3);
    ctx.fillStyle = '#8F8F8F';
    ctx.font = '400 17px sans-serif';
    ctx.fillText(theme.fit(ctx,'A new rank. Keep building your progress.',640,17,14,400),305,285);
    return canvas.toBuffer('image/png');
}
module.exports = {
    createRankCard
};
