const PET='(?:handsome|sweetheart|darling|dear)';
function withoutPetNames(content) {
 return content.replace(new RegExp(`^Of course, ${PET}[.!]\\s*`,'iu'),'')
  .replace(new RegExp(`^${PET}[,.!…]+\\s*`,'iu'),'')
  .replace(new RegExp(`,\\s*${PET}\\b`,'giu'),'')
  .replace(new RegExp(`\\b${PET},\\s*`,'giu'),'')
  .replace(/\s+([,.!?])/gu,'$1').replace(/\s{2,}/gu,' ').trim();
}
function applySpeechStyle(response,tone,request) {
 if(!response.payload?.content)return response;
 let content=withoutPetNames(response.payload.content);
 const owner=tone==='owner';
 const suppressed=request.category==='nickname_boundary'||request.conversation?.noPetNames;
 if(owner){
  content=content.replace(/^Davi[,.!…]+\s*/u,'').replace(/,\s*Davi(?=[,.!?])/gu,'');
  content=content.replace(/^Of course[.!…]+\s*/u,'');
 }
 if(request.conversation?.preferredName && ['hi','returning','thanks'].includes(request.category))content=request.conversation.preferredName+', '+content;
 content=content ? content[0].toUpperCase()+content.slice(1) : 'I am listening.';
 let ownerAddressUsed=false;
 if(owner && !suppressed && (request.conversation?.ownerTurns??0)%5===4 && !response.payload.embeds){
  content='Davi, '+(content.startsWith('I ')?content:content[0].toLowerCase()+content.slice(1));
  ownerAddressUsed=true;
 }
 return {...response,payload:{...response.payload,content},ownerStyle:owner,ownerAddressUsed};
}
module.exports={withoutPetNames,applySpeechStyle};
