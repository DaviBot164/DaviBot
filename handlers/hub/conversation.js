'use strict';
const pages=Object.freeze({
 talk:{label:'A little chat',emoji:'💬',lines:['I’m here. What kind of company would you like?'],choices:['good','tired','company','joke','encourage']},
 good:{label:'Doing well',emoji:'☀️',lines:['Good to hear. Let’s give that good mood somewhere to go.','Then we have a good starting point. A little fun sounds fitting.'],choices:['joke','play','company']},
 tired:{label:'I’m tired',emoji:'🌙',lines:['We can keep things quiet. You don’t have to carry the conversation.','A slower pace, then. There’s no rush here.'],choices:['company','encourage','joke']},
 company:{label:'Just company',emoji:'☕',lines:['A quiet corner, a warm drink, and no need to fill every silence. We can stay here a moment.','No grand plans needed. A small story or a silly joke will do nicely.'],choices:['joke','encourage','play','talk']},
 joke:{label:'Make me laugh',emoji:'😄',lines:['The ghost joined voice chat. Somehow, it still had a better microphone than everyone else.','I opened a ticket about my missing motivation. Staff marked it “still investigating.”','The moon asked for a promotion. Apparently, being full once a month counts as experience.'],choices:['joke','company','play']},
 encourage:{label:'A little encouragement',emoji:'✨',lines:['You don’t have to finish everything today. One small step still counts.','A rough round doesn’t erase the things you’ve already learned.','Rest can be part of the plan, too. You can pick things up again.'],choices:['encourage','company','joke']},
 goodbye:{label:'Goodnight',emoji:'👋',lines:['Goodnight. Rest well; the next story can wait.','See you around. Take a little quiet with you.'],choices:['talk','home']}
});
function response(page,variant=0){const entry=pages[page];return entry?entry.lines[variant%entry.lines.length]:null;}
module.exports={pages,response};
