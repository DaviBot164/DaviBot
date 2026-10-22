// Scope-aware member language. Reporting abuse is not committing it.
const slur='(?:nigger|nigga|n1gger|n1gga|nigg3r)';
function recognizeMemberBoundary(text,raw=text) {
 const reported=new RegExp(`^(?:someone|somebody|my friend|a member|they|he|she) (?:called me (?:a racial slur|${slur})|(?:told|said to) me (?:to )?(?:shut (?:the fuck )?up|fuck off|stfu))$`,'u');
 if(reported.test(text))return 'abuse_report';
 if(/["“”]/u.test(raw)||/\b(?:said|says|told|called|quoted|quote)\b/u.test(text))return null;
 if(/^(?:i am|im) (?:gay|bisexual|straight)$/u.test(text))return 'identity_disclosure';
 // A personal orientation is not an insult or a fact we can infer about a bot.
 if(/^(?:you are|you|your) (?:(?:so|really|very) )?gay$/u.test(text))return 'orientation_question';
 if (/^(?:you (?:are|were) not|you should not|do not|never call)\b/u.test(text)) return null;
 if(new RegExp(`^(?:(?:(?:why )?(?:you|your)|why are you|are you|shut (?:the fuck )?up|fuck you)\\b.*\\b${slur}\\b.*|(?:a |an )?${slur})$`,'u').test(text))return 'racial_boundary';
 if(/^(?:bla(?:h)? ){1,5}/u.test(text))text=text.replace(/^(?:bla(?:h)? ){1,5}/u,'');
 if(/^(?:shut (?:the fuck )?up|get the fuck out)(?: (?:you|motherfucker|ass|asshole|hoe|oe|bitch|idiot))*$/u.test(text))return 'reaction_dismissive';
 if(/^(?:you are|you|your) (?:(?:so|really|very|pretty|just) )+(?:bad|terrible|awful)(?: at this)?$/u.test(text))return 'reaction_insult';
 if(/^(?:all that attitude and still no (?:useful|helpful|decent) (?:answer|reply)|nobody asked for your opinion|no one asked for your opinion)$/u.test(text))return 'verbal_challenge';
 if(/^you (?:are not|aint|ain't|will never) (?:getting|get) (?:any )?love(?: with that attitude)?$/u.test(text))return 'personal_taunt';
 if(/^(?:kos omak)(?: (?:2x|again))?$/u.test(text))return 'reaction_insult';
 return null;
}
module.exports={recognizeMemberBoundary};
