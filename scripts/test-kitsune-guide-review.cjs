'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const root=process.argv[2]||path.resolve(__dirname,'..');
const context=require(path.join(root,'utils/guildContext')),model=require(path.join(root,'config/serverSettings'));
const guides=require(path.join(root,'config/setupGuides')),selection=require(path.join(root,'utils/setup/publishPathSelection'));
for(const theme of ['blood-moon','neutral'])for(const extended of [false,true]){
 const s=model.defaults('Test Community');s.theme=theme;s.progression.extended=extended;
 s.channels.supportGuide='111111111111111111';s.channels.openTicket='222222222222222222';s.channels.slayers2='333333333333333333';
 context.run('444444444444444444',s,()=>{
  const verify=JSON.stringify(guides.guide('verification_guide'));
  assert.ok(!verify.includes(s.channels.supportGuide)&&!verify.includes(s.channels.openTicket));
  assert.match(verify,/moderator/);
  for(const key of ['sacred_laws','moon_guide','verification_guide','role_guide','game_guide','support_guide']){
   const spec=guides.guide(key);assert.ok(spec);assert.ok(!JSON.stringify(spec).includes('kitsune help'));
   const fields=spec.fields??[];assert.ok(fields.every(f=>f.name.length<=256&&f.value.length<=1024));
   assert.ok(spec.title.length+(spec.intro??'').length+fields.reduce((n,f)=>n+f.name.length+f.value.length,0)<5800);
  }
  const panel=JSON.stringify(selection.pathSpec());
  for(const faction of ['slayer','demon'])for(const rank of require(path.join(root,'config/progression')).getRanks(faction))assert.ok(panel.includes(rank.name));
  s.pages.verification_guide={title:'Custom',description:'Owner-authored instructions'};
  assert.equal(guides.guide('verification_guide').intro,'Owner-authored instructions');
 });
}
console.log('Guide review: pre-verification support safety, retired-command removal, both themes, dynamic expanded ranks, custom-page preservation and Discord text limits passed. No external calls.');
