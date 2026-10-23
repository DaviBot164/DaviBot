// Whole short utterances only; no keyword guessing or stored chat transcripts.
function recognizeBrief(text, session = null) {
 if (/^(?:(?:i am|i feel) )?(?:pretty |really |very )?(?:good|great|well|fine|okay|ok) (?:and )?(?:you|what about you|how about you)$/u.test(text)) return 'brief_reciprocal';
 if (/^(?:(?:i am|i feel) )?not (?:great|so good|very good)(?: right now)?$/u.test(text)) return 'feeling_bad';
 if (/^(?:i am )?(?:just )?(?:chilling|chillin|relaxing|taking it easy)$/u.test(text)) return 'brief_chilling';
 if (/^(?:i )?(?:do not want to|would rather not) get into it$/u.test(text)) return 'brief_privacy';
 if (/^(?:(?:can|could) you )?(?:just )?(?:distract me|help me take my mind off (?:it|things))$/u.test(text)) return 'brief_distraction';
 if (/^that was not what i meant$/u.test(text)) return 'brief_repair';
 if (/^(?:not a joke (?:but |maybe )?(?:a )?question|ask me (?:something easy|an easy question|a simple question))$/u.test(text)) return 'brief_question';
 if (/^(?:any (?:ideas|suggestions)|got any ideas|what could we do)$/u.test(text)) return 'brief_ideas';
 if (/^(?:nothing involving games|no games please|anything except games|something without games)$/u.test(text)) return 'brief_no_games';
 if (/^(?:no|nope) (?:something else|a different idea)(?: please)?$/u.test(text)) return 'brief_other';
 if (/^(?:i do not know )?(?:you go first|your turn first)$/u.test(text)) return 'brief_first';
 if(session?.shortChat?.questionIndex !== undefined && /^(?:music|books|movies|tea|coffee|night|morning)$/u.test(text))return 'brief_answer';
 return null;
}
const questions = [
 {question:'An easy one: music or movies for a quiet evening?',answer:'For my character, atmospheric music. A little mystery suits the fox.'},
 {question:'A simple choice: a quiet night or a lively morning?',answer:'A quiet night fits my moonlit character best.'},
 {question:'Something easy: tea or coffee?',answer:'Tea fits the character: a quiet cup and a little mischief.'}
];
function briefResponse(request) {
 const category=request.category;
 if(!category.startsWith('brief_'))return null;
 const old=request.conversation?.shortChat??{};
 const step=old.step??0;
 const noGames=category==='brief_no_games'||Boolean(old.noGames);
 let questionIndex=null,content;
 switch(category){
  case 'brief_reciprocal': content='Glad you are doing okay. As for me, I am here chatting with you, keeping the fox drama manageable.';break;
  case 'brief_chilling':content='Taking it easy, then. A quiet chat or something to pass the time?';break;
  case 'brief_privacy':content='You do not have to explain it. We can leave that topic alone. Want a light question instead?';break;
  case 'brief_repair':content='I missed what you wanted. Would a simple question be a better distraction?';break;
  case 'brief_no_games':content='No games, understood. We could talk about music, or make up a tiny story together.';break;
  case 'brief_ideas':content='We could talk about a song, invent a tiny story, or try an easy question. Which sounds good?';break;
  case 'brief_other':content=step%2?'Another idea: describe a place you would like to visit, real or imaginary.':'Something different: what is one small thing that made you smile lately?';break;
  case 'brief_distraction':case 'brief_question':
   questionIndex=step%questions.length;content=questions[questionIndex].question;break;
  case 'brief_first':
   if(Number.isInteger(old.questionIndex)&&questions[old.questionIndex]){
    questionIndex=old.questionIndex;content=questions[questionIndex].answer+' What about you?';
   }else content='I can start: a moonlit setting and gentle mischief fit my character. What kind of atmosphere do you like?';
   break;
  case 'brief_answer':content='A good starting point. What do you like about that choice?';break;
 }
 return {payload:{content},category,session:true,question:false,pending:null,shortChat:{step:(step+1)%6,noGames,...(questionIndex===null?{}:{questionIndex})}};
}
module.exports={recognizeBrief,briefResponse};
