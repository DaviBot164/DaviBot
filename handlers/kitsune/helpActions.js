// Independent action roles. Knowing who helped never proves who explained or sent a link.
const people=Object.freeze({davi:{person:'davi',name:'Davi'},ash:{person:'ash',name:'Ash'},mae:{person:'mae',name:'Mae'},'my friend':{person:'friend',name:'your friend'},'a friend':{person:'friend',name:'your friend'}});
const names='(?:davi|ash|mae|my friend|a friend)';
function recognizeHelpActions(text,memory){
 if(memory?.topic!=='help')return null;
 const plain=new RegExp('^('+names+') (?:explained (?:them|the rules)|(?:just )?sent (?:me )?the link)$','u').test(text);
 const revision=plain?null:recognizeRevision(text,memory);
 if(revision)return revision;
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
 if(data.mode!=='record'&&data.mode!=='recall')return revisionResponse(data,memory);
 const core={...memory,actions:{...(memory.actions??{}),...(data.facts??{})}};
 if(data.mode==='recall'){
  const group=core.actionGroups?.[data.role];
  const actor=group?.length?{name:group.map(row=>row.name).join(' and ')}:core.actions[data.role];
  return {core,content:actor?actor.name+(data.role==='explainedRules'?' explained the rules.':' sent you the link.'):'You have not said who '+(data.role==='explainedRules'?'explained the rules.':'sent the link.')};
 }
 core.actionGroups={...(memory.actionGroups??{})};
 for(const [role,actor]of Object.entries(data.facts)){core.actionGroups[role]=[actor];core.lastAction={role,actor};}
 const lines=[];
 if(data.facts.explainedRules){lines.push(data.facts.explainedRules.name+' explained the rules');core.helpStage='explained';core.helpTopic='server_rules';core.lastActor=data.facts.explainedRules;}
 if(data.facts.sentLink){lines.push(data.facts.sentLink.name+' sent you the link');core.lastActor=data.facts.sentLink;}
 return {core,content:lines.join('; ')+'.'};
}

function group(memory,role){return memory.actionGroups?.[role]??(memory.actions?.[role]?[memory.actions[role]]:[]);}
function recognizeRevision(text,memory){
 if(!memory.person)return null;
 if(!memory.actions&&/^(?:he|she|they) explained (?:it|them) simply$/u.test(text))return null;
 const t=text.replace(/^(?:nah|no) /u,'');
 if(/\b(?:explain|explained) (?:me )?(?:the link|it)\b|\b(?:send|sent) (?:me )?(?:the rules|them)\b/u.test(t))return null;
 const subject='('+names+'|he|she|they)';
 const act='(explained|sent) (?:me )?(?:the rules|them|the link|it)(?: simply)?';
 const roleFor=verb=>verb==='explained'?'explainedRules':'sentLink';
 const result=(mode,role,who,extra={})=>{
  let actor=people[who];
  if(!actor){
   const candidates=[memory.lastActor,...group(memory,role),memory.person&&{person:memory.person,name:memory.helperName??people[memory.person]?.name}].filter(Boolean);
   const compatible=candidates.filter(row=>who==='she'?row.person==='mae':who==='he'?['ash','davi'].includes(row.person):true);
   actor=compatible[0];
   if(!actor)return {mode:'clarify_actor',role};
  }
  return {mode,role,actor,...extra};
 };
 let m=t.match(new RegExp('^'+subject+' (?:did not|never) (explain|send) (?:me )?(?:the rules|them|the link|it)(?: ('+names+') did)?$','u'));
 if(m)return m[3]?result('replace',roleFor(m[2]==='explain'?'explained':'sent'),m[3]):result('remove',roleFor(m[2]==='explain'?'explained':'sent'),m[1]);
 m=t.match(new RegExp('^'+subject+' '+act+'(?: (too))?(?: not ('+names+'))?$','u'));
 if(m){const role=roleFor(m[2]);return result(m[3]?'add':'replace',role,m[1]);}
 m=t.match(new RegExp('^i mean ('+names+')$','u'));
 if(m&&(memory.pendingAction||memory.lastAction))return result('replace',(memory.pendingAction??memory.lastAction).role,m[1]);
 m=t.match(new RegExp('^did ('+names+') (explain|send) (?:me )?(?:the rules|them|the link|it)(?: too)?$','u'));
 if(m)return result('query',roleFor(m[2]==='explain'?'explained':'sent'),m[1]);
 if(new RegExp('^someone said ('+names+') (?:explained the rules|sent (?:me )?the link)(?: but i am not sure)?$','u').test(t))return {mode:'uncertain'};
 if(new RegExp('^if ('+names+') (?:sends (?:another|a|the) link|explains the rules) i (?:will|ill) (?:read it|listen)$','u').test(t))return {mode:'conditional'};
 return null;
}
function revisionResponse(data,memory){
 const core={...memory,actions:{...(memory.actions??{})},actionGroups:{...(memory.actionGroups??{})}};
 const label=data.role==='explainedRules'?'explained the rules':'sent you the link';
 if(data.mode==='uncertain')return {core,content:'That is an unconfirmed report. I will keep it separate from what you have already told me.'};
 if(data.mode==='conditional')return {core,content:'That is a possible future action, not something that has happened. I will keep the existing facts.'};
 if(data.mode==='clarify_actor'){core.pendingAction={role:data.role};return {core,content:'Who do you mean? Please name the person for that action.'};}
 const existing=group(memory,data.role);
 if(data.mode==='query')return {core,content:existing.some(row=>row.person===data.actor.person)?data.actor.name+' '+label+'.':'You have not said whether '+data.actor.name+' '+label+'.'};
 const actors=data.mode==='remove'?existing.filter(row=>row.person!==data.actor.person):data.mode==='add'?[...existing.filter(row=>row.person!==data.actor.person),data.actor]:[data.actor];
 core.actionGroups[data.role]=actors;
 core.actions[data.role]=actors[0]??null;
 core.lastAction={role:data.role,actor:data.actor};core.pendingAction=null;
 if(data.mode!=='remove')core.lastActor=data.actor;
 if(data.role==='explainedRules'&&actors.length){core.helpStage='explained';core.helpTopic='server_rules';}
 return {core,content:data.mode==='remove'?data.actor.name+' is no longer recorded as the person who '+label+'.':actors.map(row=>row.name).join(' and ')+' '+label+'.'};
}
module.exports={recognizeHelpActions,helpActionsResponse};
