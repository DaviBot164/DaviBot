// Shared prompts and bounded answer slots; no personal details or raw transcript storage.
module.exports=Object.freeze([
 Object.freeze({question:'For a fictional scene: a forest path or a seaside view?',open:'What sound would fit a calm seaside scene?',own:'A quiet forest path suits my fox style: a little mystery, without a crowd.',answers:Object.freeze([
  Object.freeze({key:'seaside',forms:Object.freeze(['seaside','a seaside view','seaside view','the seaside','the sea','beach']),reply:'A seaside view, then. What do you like about that scene?'}),
  Object.freeze({key:'forest',forms:Object.freeze(['forest','a forest path','forest path','the forest']),reply:'A forest path, then. What would make that scene peaceful?'})
 ])}),
 Object.freeze({question:'Which makes a calmer scene: soft rain or a clear night sky?',open:'How could a fictional night scene feel peaceful?',own:'A clear night sky fits my moonlit style, though soft rain makes a good backdrop.',answers:Object.freeze([
  Object.freeze({key:'rain',forms:Object.freeze(['rain','soft rain','the rain']),reply:'Soft rain, then. A gentle background for a quiet scene.'}),
  Object.freeze({key:'sky',forms:Object.freeze(['sky','night sky','a clear night sky','clear night sky']),reply:'A clear night sky, then. A calm setting with room for a little mystery.'})
 ])}),
 Object.freeze({question:'A light one: a piano melody or a guitar tune for a film scene?',open:'What title would fit a calm instrumental track?',own:'A quiet piano melody fits my style, with a little dramatic tension.',answers:Object.freeze([
  Object.freeze({key:'piano',forms:Object.freeze(['piano','a piano melody','piano melody']),reply:'A piano melody, then. It can give the scene a gentle atmosphere.'}),
  Object.freeze({key:'guitar',forms:Object.freeze(['guitar','a guitar tune','guitar tune']),reply:'A guitar tune, then. A warm soundtrack for the scene.'})
 ])})
]);
