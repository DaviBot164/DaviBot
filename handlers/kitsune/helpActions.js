// Independent action roles. Knowing who helped never proves who explained or sent a link.
const people=Object.freeze({davi:{person:'davi',name:'Davi'},ash:{person:'ash',name:'Ash'},mae:{person:'mae',name:'Mae'},'my friend':{person:'friend',name:'your friend'},'a friend':{person:'friend',name:'your friend'}});
const names='(?:davi|ash|mae|my friend|a friend)';
function recognizeHelpActions(text,memory){
 if(memory?.topic!=='help')return null;
 const pair=text.match(new RegExp('^('+names+') explained (?:them|the rules) ('+names+') (?:just )?sent (?:me )?the link$','u'));
 if(pair)return {mode:'record',facts:{explainedRules:people[pair[1]],sentLink:people[pair[2]]}};
 const explained=text.match(new RegExp('^('+names+') explained (?:them|the rules)$','u'));
 if(explained)return {mode:'record',facts:{explainedRules:people[explained[1]]}};
 const sent=text.match(new RegExp('^('+names+') (?:just )?sent (?:me )?the link$','u'));
 if(sent)return {mode:'record',facts:{sentLink:people[sent[1]]}};
 if(/^who explained (?:them|the rules)$/u.test(text))return {mode:'recall',role:'explainedRules',actorKey:memory.actions?.explainedRules?.person??null};
 if(/^who sent (?:me )?the link$/u.test(text))return {mode:'recall',role:'sentLink',actorKey:memory.actions?.sentLink?.person??null};
 return null;
}
function helpActionsResponse(data,memory){
 const core={...memory,actions:{...(memory.actions??{}),...(data.facts??{})}};
 if(data.mode==='recall'){
  const actor=core.actions[data.role];
  return {core,content:actor?actor.name+(data.role==='explainedRules'?' explained the rules.':' sent you the link.'):'You have not said who '+(data.role==='explainedRules'?'explained the rules.':'sent the link.')};
 }
 const lines=[];
 if(data.facts.explainedRules){lines.push(data.facts.explainedRules.name+' explained the rules');core.helpStage='explained';core.helpTopic='server_rules';core.lastActor=data.facts.explainedRules;}
 if(data.facts.sentLink){lines.push(data.facts.sentLink.name+' sent you the link');core.lastActor=data.facts.sentLink;}
 return {core,content:lines.join('; ')+'.'};
}
module.exports={recognizeHelpActions,helpActionsResponse};
