// Stable, text-free contract shared by recognition, parsing and session memory.
const {musicTopics}=require('./musicConversation');
const {gameTopics}=require('./gameConversation');
const moods=Object.freeze({feeling_bad:'low',feeling_good:'positive',feeling_neutral:'neutral',tired:'tired',mental_tired:'mentally_tired',lonely:'lonely',bored:'bored',hungry:'hungry',mood_recovered:'improved',mood_lowered:'low'});
const dayTopics=new Set(['day_more_time','day_reaction_worry','day_limits','day_pressure','day_overload','day_fairness','day_okay','day_ordinary','day_tiring','day_work','day_work_stress','day_study','day_people','day_privacy','day_tasks','day_no_break','day_explanation','day_relief','day_easing','effort_stuck','effort_continue','feeling_bad','tired','mental_tired','bad_day_context']);
const studyTopics=new Set(['study_start','study_step','study_breakdown','study_alternative','study_understanding']);
const continuations=new Set(['pause','flow_hold','flow_resume','brief_both','brief_depends','brief_mood','brief_pick','brief_first','advice_resume','yes','no','agree','thanks','reaction_thanks','feedback_understood','feedback_better','context_echo','context_changed','context_hesitant','uncertain','decline_advice','rude','tone_gentle','tone_serious','tone_reset','repair','repair_answer','why','really','explain','simplify','explain_fresh','explain_serious','repetition_feedback','intent_clear','disavow_insult','question_clarification']);
function topicAnchor(category){return dayTopics.has(category)||studyTopics.has(category)||musicTopics.has(category)||gameTopics.has(category)?category:null;}
function nextTopic(previous, request, response){
 if(request.category==='light_topic')return topicAnchor(response.category);
 if(['topic_change','restart_chat','stop'].includes(request.category))return null;
 const direct=topicAnchor(request.category);
 if(direct)return direct;
 if(continuations.has(request.category))return previous?.topicCategory??topicAnchor(previous?.category)??null;
 return topicAnchor(response.category);
}
function understandingResult(category, options={}){
 let mood=moods[category]??null;
 let target=null,polarity='unspecified',reported=false,intent=category??'unknown',topic=null;
 if(category?.startsWith('flow_')){intent='contextual_continuation';topic='conversation';}
 if(category?.startsWith('brief_')){intent='casual_conversation';topic='conversation';}
 if(mood){target='self';polarity='affirmed';intent='share_state';topic='wellbeing';}
 if(/^day_/u.test(category??'') || /^effort_/u.test(category??'')){target='self';intent='share_experience';topic=['day_work','day_work_stress','day_tasks'].includes(category)?'work':category==='day_study'?'study':category==='day_people'?'people':'day';}
 if(musicTopics.has(category)){intent=['music_preferences','music_curiosity'].includes(category)?'discuss_preference':'share_interest';topic='music';target=['music_preferences','music_curiosity'].includes(category)?'kitsune':'self';}
 if(gameTopics.has(category)){intent=category==='game_chat'?'start_topic':category==='game_preferences'?'discuss_preference':'share_interest';topic='games';target=category==='game_preferences'?'kitsune':'self';}
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
 if(['topic_change','light_topic','restart_chat'].includes(category)){intent='reset_topic';topic='conversation';}
 const recovered=options.recovery;
 if(recovered?.kind==='state'){target=recovered.data.target;intent='share_state';topic='wellbeing';polarity=['negated','recovered'].includes(recovered.data.time)?'negated':'affirmed';
  if(target==='self')mood=recovered.data.time==='past'||recovered.data.time==='negated'?null:recovered.data.time==='recovered'?'improved':recovered.data.state==='tired'?'tired':recovered.data.state==='upset'?'low':recovered.data.state;
 }
 if(['answer_scope','answer_repair','answer_short'].includes(recovered?.kind)){intent='clarify_answer';target='answer';topic='explanation';}
 if(recovered?.kind==='reconciled'){intent='reconcile';topic='conversation';}
 if(recovered?.kind==='jealous_question'){intent='ask_personality';target='kitsune';topic='social';}
 if(recovered?.kind==='quote_correction'){intent='report_speech';reported=true;target=recovered.data.davi?'davi':'kitsune';}
 if(recovered?.kind==='reported_bot'||recovered?.kind==='report_davi'){intent='report_speech';reported=true;target=recovered.kind==='report_davi'?'davi':'kitsune';}
 if(recovered?.kind==='defend_bot'||recovered?.kind==='defend_davi'){intent='deny_insult';polarity='negated';target=recovered.kind==='defend_davi'?'davi':'kitsune';}
 if(recovered?.kind==='verbal_feedback'){intent='clarify_answer';target='answer';topic='explanation';}
 if(recovered?.kind==='intent_reassure'){intent='reconcile';topic='conversation';}
 if(['answer_missed','retry_calm'].includes(recovered?.kind)){intent='clarify_answer';target='answer';topic='explanation';}
 if(recovered?.kind==='intent_clarify'){intent='deny_insult';target='kitsune';polarity='negated';}
 if(recovered?.kind==='report_person'){intent='report_speech';reported=true;target=null;}
 if(recovered?.kind==='nonpersonal_question'){intent='request_question';topic='conversation';}
 if(recovered?.kind?.startsWith('light_')){intent='light_conversation';topic='fictional_scene';target=recovered.kind==='light_reciprocal'?'kitsune':'self';}
 if(['help_actions','help_started','help_corrected','help_recall','help_detail','help_past_confusion','help_explained','help_understood','help_grateful'].includes(recovered?.kind)){intent='discuss_help';topic='explanation';target=recovered.data.helperKey??options.person??'helper';}
 if(recovered?.kind==='help_actions'){const mode=recovered.data.mode;intent=mode==='recall'?'recall_action':mode==='query'?'query_action':['uncertain','conditional','answer_unsure','report_cancel'].includes(mode)?'discuss_action':['clarify_actor','answer_mismatch','answer_scope','answer_actor','person_scope','report_unbound'].includes(mode)?'clarify_action':mode==='remove'||mode==='answer_retract'||mode==='answer_commit'&&!recovered.data.yes?'remove_action':'record_action';target=mode==='recall'?recovered.data.actorKey:recovered.data.actor?.person??null;topic='help';}
 if(recovered?.kind==='game_update'||recovered?.kind==='game_continuation'){intent='discuss_game';topic='games';target=recovered.data.form==='reciprocal'?'kitsune':'self';if(recovered.data.form==='disappointed')mood='disappointed';if(recovered.data.form==='not_angry')polarity='negated';}
 if(recovered?.kind==='help_understanding'){intent='discuss_help';topic='help';target='self';}
 if(recovered?.kind==='social_boundary'){intent='clarify_social_scope';topic='social';target=recovered.data.person??null;}
 if(recovered?.kind==='light_title'){intent='discuss_fictional_title';target='title';topic='fictional_scene';}
 const unknown=!category||['fallback','reaction_question','clarify'].includes(category);
 return Object.freeze({version:1,category:category??null,status:unknown?(category?'needs_clarification':'unmatched'):'matched',intent,target,topic,mood,polarity,reported,listening:['decline_advice','music_curiosity'].includes(category)||Boolean(options.declineAdvice),source:options.source??'rules',rule:options.rule??(unknown?'unmatched':'category_contract')});
}
module.exports={understandingResult,topicAnchor,nextTopic};
