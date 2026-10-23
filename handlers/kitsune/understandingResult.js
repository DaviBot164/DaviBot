// Stable, text-free contract shared by recognition, parsing and session memory.
const moods=Object.freeze({feeling_bad:'low',feeling_good:'positive',feeling_neutral:'neutral',tired:'tired',mental_tired:'mentally_tired',lonely:'lonely',bored:'bored',hungry:'hungry',mood_recovered:'improved',mood_lowered:'low'});
const dayTopics=new Set(['day_pressure','day_overload','day_fairness','day_okay','day_ordinary','day_tiring','day_work','day_work_stress','day_study','day_people','day_privacy','day_tasks','day_no_break','day_explanation','day_relief','day_easing','effort_stuck','effort_continue','feeling_bad','tired','mental_tired','bad_day_context']);
const studyTopics=new Set(['study_start','study_step','study_breakdown','study_alternative','study_understanding']);
const continuations=new Set(['yes','no','agree','thanks','reaction_thanks','feedback_understood','feedback_better','context_echo','context_changed','context_hesitant','uncertain','decline_advice','rude','tone_gentle','tone_serious','tone_reset','repair','repair_answer','why','really','explain','simplify','explain_fresh','explain_serious','repetition_feedback','intent_clear','disavow_insult','question_clarification']);
function topicAnchor(category){return dayTopics.has(category)||studyTopics.has(category)?category:null;}
function nextTopic(previous, request, response){
 if(['topic_change','restart_chat','stop'].includes(request.category))return null;
 const direct=topicAnchor(request.category);
 if(direct)return direct;
 if(continuations.has(request.category))return previous?.topicCategory??topicAnchor(previous?.category)??null;
 return topicAnchor(response.category);
}
function understandingResult(category, options={}){
 const mood=moods[category]??null;
 let target=null,polarity='unspecified',reported=false,intent=category??'unknown',topic=null;
 if(mood){target='self';polarity='affirmed';intent='share_state';topic='wellbeing';}
 if(/^day_/u.test(category??'') || /^effort_/u.test(category??'')){target='self';intent='share_experience';topic=['day_work','day_work_stress','day_tasks'].includes(category)?'work':category==='day_study'?'study':category==='day_people'?'people':'day';}
 if(studyTopics.has(category)){intent='study_help';topic='study';target='task';}
 if(['answer_feedback','answer_confusing','critique_clear','repair_answer','simplify','explain_fresh','explain_serious','repetition_feedback'].includes(category)){intent='clarify_answer';target='answer';topic='explanation';}
 if(['reaction_insult','reaction_dismissive','racial_boundary','personal_taunt','verbal_challenge','joke_challenge'].includes(category)){intent='directed_challenge';target='kitsune';polarity='affirmed';}
 if(['disavow_insult','reaction_reassurance'].includes(category)){intent='deny_insult';target='kitsune';polarity='negated';}
 if(category==='tension_clear'){intent='deny_tension';target='self';polarity='negated';}
 if(category?.startsWith('reported_')||category==='abuse_report'){intent='report_speech';reported=true;target=category==='abuse_report'?'self':category==='reported_davi_quote'?'davi':'kitsune';}
 if(category==='reaction_davi_insult'){intent='directed_challenge';target='davi';polarity='affirmed';}
 if(['davi','mae','member'].includes(category)){target=category;intent='ask_about_person';}
 if(category==='pick'){target='options';intent='choose';}
 if(category==='directed_taunt_request'){target='third_party';intent='request_directed_taunt';}
 if(category==='identity_disclosure'){target='self';intent='share_identity';}
 if(category==='orientation_question'){target='kitsune';intent='ask_identity';}
 if(category==='decline_advice'){intent='request_listening';target='self';topic='conversation';}
 if(category==='advice_resume'||category==='tip'){intent='request_advice';target='self';}
 if(category?.startsWith('tone_')){intent='change_tone';topic='conversation';}
 if(category==='topic_change'||category==='restart_chat'){intent='reset_topic';topic='conversation';}
 const unknown=!category||['fallback','reaction_question','clarify'].includes(category);
 return Object.freeze({version:1,category:category??null,status:unknown?(category?'needs_clarification':'unmatched'):'matched',intent,target,topic,mood,polarity,reported,listening:category==='decline_advice'||Boolean(options.declineAdvice),source:options.source??'rules',rule:options.rule??(unknown?'unmatched':'category_contract')});
}
module.exports={understandingResult,topicAnchor,nextTopic};
