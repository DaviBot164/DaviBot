// Reuse the built-in, quote-aware addressing contract; never parse identity from user text.
const {namedAddress}=require('./addressing');
const speakers=Object.freeze({
 owner:Object.freeze({role:'owner',address:'Davi'}),
 member:Object.freeze({role:'member',address:null}),
 mae:Object.freeze({role:'friend',address:'Davi',person:'Mae',owner:false}),
 ash:Object.freeze({role:'friend',address:'Ash',person:'Ash',owner:false})
});
function speakerFor(persona){if(!Object.hasOwn(speakers,persona))throw Error('Unknown simulation persona');return speakers[persona];}
function prepareDialogue(raw){
 const call=namedAddress(raw);
 return JSON.stringify({addressee:'Kitsune',dialogue:call?(call[1]||'Kitsune'):raw});
}
module.exports={speakerFor,prepareDialogue};
