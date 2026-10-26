// Small explicit preference flags, not an inferred fact store or a language model.
function nextPreferences(previous={},raw=''){
 const text=String(raw).replace(/"[^"\n]*"|“[^”\n]*”|`[^`\n]*`/gu,'').toLowerCase().replace(/[’']/g,'').replace(/\s+/g,' ').trim();
 const next={...previous};
 if(/^(?:someone|he|she|they|my friend) (?:said|says|told)\b/u.test(text))return next;
 if(/\b(?:start over|lets reset|fresh start|reset the conversation)\b/u.test(text))return{};
 const noAdvice=/\b(?:(?:dont|do not|no more) (?:give me )?(?:advice|tips)|(?:dont|do not) need (?:advice|tips)|just listen|not asking for advice)/u.test(text);
 if(noAdvice)next.listening=true;
 else if(/\b(?:give me|got any|any small|one small|now .*?|want|need) (?:a |one |small )?(?:tip|advice)\b/u.test(text))next.listening=false;
 if(/\b(?:keep (?:your )?replies short|keep it short|short replies|shorter please|be brief)\b/u.test(text))next.short=true;
 if(/\b(?:more detail|explain in detail|longer explanation)\b/u.test(text))next.short=false;
 if(/\b(?:no fox metaphors|dont mention tails|without fox metaphors)\b/u.test(text))next.noMetaphors=true;
 if(/\b(?:fox metaphors are fine|you can mention tails)\b/u.test(text))next.noMetaphors=false;
 if(/\b(?:dont ask questions unless needed|no questions|stop asking questions)\b/u.test(text))next.noQuestions=true;
 if(/\b(?:you can ask questions|questions are fine|ask me a question)\b/u.test(text))next.noQuestions=false;
 return next;
}
function guidance(preferences){
 const lines=[];
 if(preferences.listening)lines.push('Listening requested: acknowledge the specific event; no advice, tactics, plans or invitation to request tips. Do not ask another question merely to fill the reply.');
 if(preferences.short)lines.push('Short replies requested: one compact sentence unless the user now explicitly asks for necessary detail. Preserve the meaning.');
 if(preferences.noMetaphors)lines.push('No fox metaphors or tail descriptions: use plain, natural words.');
 if(preferences.noQuestions)lines.push('Avoid questions unless a missing detail is necessary to answer. Acknowledge or contribute a relevant observation instead.');
 return lines.length?'\nEXPLICIT CONVERSATION PREFERENCES (narrow app-detected cues; follow the actual dialogue if a cue is incomplete):\n'+lines.join('\n'):'';
}
module.exports={nextPreferences,guidance};
