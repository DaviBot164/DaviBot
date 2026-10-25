// Independent action roles. Knowing who helped never proves who explained or sent a link.
const people=Object.freeze({davi:{person:'davi',name:'Davi'},ash:{person:'ash',name:'Ash'},mae:{person:'mae',name:'Mae'},'my friend':{person:'friend',name:'your friend'},'a friend':{person:'friend',name:'your friend'}});
const names='(?:davi|ash|mae|my friend|a friend)';
function recognizeHelpActions(text,memory){
 if(memory?.topic!=='help')return null;
 const clarification=recognizeHelpClarification(text,memory);
 if(clarification)return clarification;
 const answer=recognizeActionAnswer(text,memory);
 if(answer)return answer;
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
  core.recalledRole=data.role;
  const group=core.actionGroups?.[data.role];
  const actor=group?.length?{name:group.map(row=>row.name).join(' and ')}:core.actions[data.role];
  return {core,content:actor?actor.name+(data.role==='explainedRules'?' explained the rules.':' sent you the link.'):'You have not said who '+(data.role==='explainedRules'?'explained the rules.':'sent the link.')};
 }
 core.pendingQuestion=null;core.answeredQuestion=null;core.pendingPersonCorrection=null;
 if(memory.pendingReport&&Object.hasOwn(data.facts,memory.pendingReport.role))core.pendingReport=null;
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
 if(['helper_correct','person_scope','report_confirm'].includes(data.mode))return helpClarificationResponse(data,memory);
 if(data.mode.startsWith('answer_'))return actionAnswerResponse(data,memory);
 if(data.mode==='report_cancel'){core.pendingReport=null;return {core,content:memory.pendingReport?'That report is withdrawn. The confirmed helper and action facts remain unchanged.':'There is no pending report. The confirmed helper and action facts remain unchanged.'};}
 if(data.mode==='report_unbound')return {core,content:'Which report did you check? The earlier report is no longer pending, so I will not replace a confirmed fact from that alone.'};
 if(data.mode==='uncertain'){if(data.report)core.pendingReport=data.report;return {core,content:'That is an unconfirmed report. I will keep it separate from what you have already told me.'};}
 if(data.mode==='conditional')return {core,content:'That is a possible future action, not something that has happened. I will keep the existing facts.'};
 if(data.mode==='clarify_actor'){core.pendingAction={role:data.role};return {core,content:'Who do you mean? Please name the person for that action.'};}
 const existing=group(memory,data.role);
 if(data.mode==='query'){core.pendingQuestion={role:data.role,actor:data.actor,additive:true};core.answeredQuestion=null;return {core,content:existing.some(row=>row.person===data.actor.person)?data.actor.name+' '+label+'.':'You have not said whether '+data.actor.name+' '+label+'.'};}
 const actors=data.mode==='remove'?existing.filter(row=>row.person!==data.actor.person):data.mode==='add'?[...existing.filter(row=>row.person!==data.actor.person),data.actor]:[data.actor];
 core.actionGroups[data.role]=actors;
 core.actions[data.role]=actors[0]??null;
 core.lastAction={role:data.role,actor:data.actor};core.pendingAction=null;core.pendingQuestion=null;core.answeredQuestion=null;core.pendingPersonCorrection=null;
 if(memory.pendingReport?.role===data.role)core.pendingReport=null;
 if(data.mode!=='remove')core.lastActor=data.actor;
 if(data.role==='explainedRules'&&actors.length){core.helpStage='explained';core.helpTopic='server_rules';}
 return {core,content:data.mode==='remove'?data.actor.name+' is no longer recorded as the person who '+label+'.':actors.map(row=>row.name).join(' and ')+' '+label+'.'};
}

function recognizeActionAnswer(text,memory){
 const pending=memory.pendingQuestion;
 if(pending){
  if(/^(?:not sure|i do not know(?: yet)?)$/u.test(text))return {mode:'answer_unsure'};
  if(/^yes but i mean the rules not the link$/u.test(text))return {mode:'answer_scope'};
  let m=text.match(/^(yes|no)(?: (he|she|they) (?:did|did not))?$/u);
  if(m){const yes=m[1]==='yes';
   if(m[2]&&(m[2]==='she'&&pending.actor.person!=='mae'||m[2]==='he'&&!['ash','davi'].includes(pending.actor.person)))return {mode:'answer_mismatch',yes};
   if(yes&&/did not$/u.test(text)||!yes&&/ did$/u.test(text))return {mode:'answer_mismatch',yes};
   return {mode:'answer_commit',yes};
  }
  if(/^not yet (?:he|she|they) will later$/u.test(text))return {mode:'answer_commit',yes:false,future:true};
  m=text.match(new RegExp('^i mean ('+names+')$','u'));
  if(m)return {mode:'answer_actor',actor:people[m[1]]};
 }
 if(/^no i was mistaken$/u.test(text)&&memory.answeredQuestion)return {mode:'answer_retract'};
 const only=text.match(new RegExp('^no only ('+names+')$','u'));
 if(only&&memory.recalledRole)return {mode:'replace',role:memory.recalledRole,actor:people[only[1]]};
 return null;
}
function actionAnswerResponse(data,memory){
 const core={...memory};
 const pending=memory.pendingQuestion;
 if(data.mode==='answer_unsure')return {core,content:'That is still uncertain. I will keep the current facts and leave that question open.'};
 if(data.mode==='answer_scope')return {core,content:'Do you mean Mae explained the rules, rather than sent the link? I will not change either fact until that is clear.'};
 if(data.mode==='answer_mismatch'){core.pendingQuestion={...pending,clarifyYes:data.yes};return {core,content:'Do you mean '+pending.actor.name+', or someone else? Please name the person.'};}
 if(data.mode==='answer_actor'){
  core.pendingQuestion={...pending,actor:data.actor};
  if(typeof pending.clarifyYes==='boolean')return actionAnswerResponse({mode:'answer_commit',yes:pending.clarifyYes},core);
  return {core,content:'You mean '+data.actor.name+'. Are you confirming that action? I have not changed the existing facts.'};
 }
 const question=data.mode==='answer_retract'?memory.answeredQuestion:pending;
 if(!question)return {core,content:'Which action are you confirming?'};
 const yes=data.mode==='answer_retract'?false:data.yes;
 const result=revisionResponse({mode:yes?'add':'remove',role:question.role,actor:question.actor},memory);
 result.core.pendingQuestion=null;result.core.answeredQuestion={role:question.role,actor:question.actor,yes};
 if(data.future)result.content+=' A future plan is not a completed action.';
 return result;
}

function recognizeHelpClarification(text,memory){
 if(/^(?:that person was wrong|forget that report)$/u.test(text))return {mode:'report_cancel'};
 let m=text.match(new RegExp('^i mean ('+names+') helped me not ('+names+')$','u'));
 if(m)return {mode:'helper_correct',actor:people[m[1]]};
 m=text.match(new RegExp('^i mean ('+names+') (sent (?:me )?the link|explained (?:them|the rules)) not ('+names+')$','u'));
 if(m)return {mode:'replace',role:m[2].startsWith('sent')?'sentLink':'explainedRules',actor:people[m[1]]};
 m=text.match(new RegExp('^it was not ('+names+') it was ('+names+')$','u'));
 if(m)return {mode:'person_scope',from:people[m[1]],actor:people[m[2]]};
 if(memory.pendingPersonCorrection&&['i mean who sent the link','i mean who explained the rules'].includes(text))return {mode:'replace',role:text.includes('sent')?'sentLink':'explainedRules',actor:memory.pendingPersonCorrection.actor};
 if(text==='i mean who helped me'&&memory.pendingPersonCorrection)return {mode:'helper_correct',actor:memory.pendingPersonCorrection.actor};
 m=text.match(new RegExp('^someone said ('+names+') explained (?:them|the rules) but i am not sure$','u'));
 if(m)return {mode:'uncertain',report:{role:'explainedRules',actor:people[m[1]]}};
 m=text.match(new RegExp('^i checked it was ('+names+')$','u'));
 if(m)return memory.pendingReport?{mode:'report_confirm',role:memory.pendingReport.role,actor:people[m[1]]}:{mode:'report_unbound'};
 return null;
}
function helpClarificationResponse(data,memory){
 const core={...memory};
 if(data.mode==='person_scope'){
  core.pendingPersonCorrection={from:data.from,actor:data.actor};
  return {core,content:'Do you mean who helped you, who explained the rules, or who sent the link? I will leave the current facts unchanged until that is clear.'};
 }
 if(data.mode==='helper_correct'){
  core.person=data.actor.person;core.helperName=data.actor.name;core.lastActor=data.actor;core.pendingPersonCorrection=null;
  return {core,content:data.actor.name+' helped you, understood. The explanation and link-sending records stay separate.'};
 }
 const result=revisionResponse({mode:'replace',role:data.role,actor:data.actor},memory);result.core.pendingReport=null;return result;
}
module.exports={recognizeHelpActions,helpActionsResponse};
