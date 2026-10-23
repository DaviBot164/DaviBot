// Targeted response repairs; never pretend to explain an arbitrary unseen passage.
function recognizeExplanationRepair(text) {
 // These are about comprehension, not an accusation that the answer is wrong.
 if(/^(?:(?:that|the|your|this) (?:explanation|answer|reply|response)|it|that) (?:went|goes) (?:straight |right )?over my head$/u.test(text))return 'answer_confusing';
 if(/^(?:i am )?not saying (?:(?:it|that|your (?:answer|reply|explanation)) (?:is|was)|its) wrong (?:but |and )?i (?:just )?(?:did not|do not|could not) (?:get|understand|follow) (?:it|that|the explanation)$/u.test(text))return 'answer_confusing';
 if(/^(?:(?:can|could|would) you (?:please )?)?(?:put|say|explain) (?:it|that|your answer|your explanation) in (?:simpler|simple|plain|easier) (?:words|english|terms)(?: please)?$/u.test(text))return 'simplify';
 // Confidence alone is not proof of sarcasm. Ask until the speaker clarifies it.
 if(/^(?:wow |oh )?(?:yes |yeah )?(?:i )?(?:totally|definitely|completely) (?:understood|get|got) (?:it|everything|all of that)$/u.test(text))return 'ambiguous_praise';
 if(/^(?:that was sarcasm|i (?:was|am) being sarcastic)(?: by the way)? (?:but |and )?i (?:am (?:still )?confused|still do not (?:get|understand) it)$/u.test(text))return 'sarcasm_clear';
 if (/^(?:that|your|the) (?:answer|reply|response) (?:was|is) (?:(?:really|very|so) )?(?:bad|wrong|unhelpful|confusing) (?:but |and )?not you$/u.test(text)) return 'answer_feedback';
 if (/^(?:(?:can|could|would) you (?:please )?)?(?:try (?:explaining|saying) (?:it|that|your answer) (?:(?:a bit|a little|slightly) )?(?:differently|another way)|(?:explain|say) (?:it|that|your answer) (?:(?:a bit|a little|slightly) )?(?:differently|in another way))(?: please)?$/u.test(text)) return 'explain_fresh';
 if (/^(?:that|the|your) (?:answer|reply|response) (?:was|is) not (?:very |really )?(?:helpful|useful|clear) (?:but |and )?i am not (?:blaming|insulting|attacking) you$/u.test(text)) return 'answer_feedback';
 if(/^(?:(?:can|could|would) you (?:please )?)?explain (?:it|that|your answer) without (?:repeating yourself|repeating (?:it|that|the same thing)|saying the same thing)$/u.test(text))return 'explain_fresh';
 if(/^(?:(?:that is|thats|that's|it is|this is) (?:still |just )?(?:the )?same (?:answer|reply|explanation)|you (?:are )?(?:still )?repeating yourself)$/u.test(text))return 'repetition_feedback';
 if(/^(?:i am not insulting you|not an insult|i am not attacking you) (?:but |and )?i am (?:just )?asking for (?:a )?(?:better|clearer|simpler) (?:explanation|answer)$/u.test(text))return 'explain_fresh';
 return null;
}
const versions={
 study_start:['Start with one small task rather than the whole subject.','One task first.'],
 study_step:['Read a short section and check one idea from it.','One section, one question.'],
 study_breakdown:['Reduce the task to one sentence or one exercise.','Make the task smaller.'],
 study_alternative:['Explain one idea aloud, then check the part you could not explain.','Explain one idea aloud.'],
 pick:['That choice was random; it was not a recommendation based on the options.','The choice was random.'],
 answer_confusing:['I need the specific part that confused you before I can explain that part.','Which sentence should I clarify?'],
 answer_feedback:['Point to the mistake or missing detail so I can address that part.','Which part needs changing?']
};
function repairExplanation(request) {
 const topic=request.context;
 const previous=request.conversation??{};
 const step=previous.explanationStep??0;
 let content;
 if(!topic)content='Which answer do you mean? Paste the sentence or step you want explained.';
 else if(request.category==='repetition_feedback')content='That did not give you a different explanation. Point to one sentence or step, so I can address that part.';
 else if(versions[topic])content=versions[topic][Math.min(step,versions[topic].length-1)];
 else content='Paste the sentence or step you want explained. I need that detail to try a different explanation.';
 if(step>=2 && request.category!=='repetition_feedback')content='We are circling the same point. A specific sentence or example would help me change the explanation.';
 return {payload:{content},category:topic??'clarify',question:false,session:true,explanationStep:Math.min(3,step+1)};
}
module.exports={recognizeExplanationRepair,repairExplanation};
