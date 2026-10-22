const publicPools={
 day_ordinary:['A quiet day, then. We do not need a big story to keep talking. What have you been listening to lately?','Nothing unusual, understood. Want to talk about music or games?','An ordinary day, then. Was there anything you enjoyed, even something small?'],
 day_okay:['An okay day, then. Anything stand out, or was it fairly ordinary?','Fair enough. Not every day needs a dramatic story. What have you been up to?','An ordinary day can be welcome. Was there a good moment in it?'],
 day_tasks:['Extra tasks kept coming, then. That sounds like a lot to carry through the day.','More work on top of everything else. I am following.','That sounds like the tasks kept piling up. I am listening.'],
 day_no_break:['And there was barely a pause between it all. That sounds draining.','No real break, then. I can see why the day felt long.','You hardly had a chance to stop. That adds to what you were describing.'],
 day_explanation:['That helps me follow why you felt so worn out.','I see the connection now. The tiredness makes sense in that context.','Understood. You are explaining what made the day so tiring.'],
 day_relief:['Glad talking about it helped a little. It does not all have to be solved right now.','A little lighter after saying it out loud, then.','I am glad it helped to put it into words.'] ,
 normal_chat:['No jokes, then. How has today been?','An ordinary conversation is fine. How was your day?','All right. I will leave the performance aside. How are things today?'],
 day_tiring:['That sounds like a draining day. Was it work, studying, or something else?','A long day, then. What made it so tiring?','Sounds like today took a lot out of you. What was the hardest part?'],
 day_work:['Work, then. Was it the workload or dealing with people?','A demanding day at work can leave very little energy. What was it like?','Got it, mostly work. Was today unusually busy?'],
 day_study:['Studying, then. Was it the amount of work or getting stuck on something?','Schoolwork can be a lot. Was there one part that wore you out?','Got it. Was it a long session, or a difficult topic?'],
 day_people:['People, then. You can say as much or as little about it as you want.','Sounds like the social side was tiring. What happened?','Understood. You do not have to name anyone. What made it difficult?'],
 day_easing:['A little better counts. We can keep the conversation easy.','Glad it feels a little lighter now.','That is good to hear. No need to pretend everything is perfect.']
};
const ownerPools={
 normal_chat:['Of course... no jokes. How has today been?','We can keep it simple. I am listening. How was your day?','A quiet conversation sounds nice. How are things today?'],
 day_tiring:['That sounds exhausting. What made today so heavy?','A tiring day, then. Was it work, or something else?','You do not have to make it sound better than it was. What happened today?'],
 day_work:['Work, then... was there too much to do, or was it the people?','I see. Was today at work harder than usual?','That sounds like a lot to carry home from work. What was the tiring part?'],
 day_easing:['A little better... I am glad. We can keep this quiet.','That is good to hear. You do not have to rush into being cheerful.','A lighter moment, then. I am glad you told me.']
};
module.exports={pools:{public:publicPools,owner:{...publicPools,...ownerPools},mae:{...publicPools}},explanations:{
 day_ordinary:'You said nothing special happened. I followed the ordinary-day conversation without inventing an event.',
 day_okay:'You described your day as okay. I acknowledged that without assuming you felt upset.',
 day_tasks:'You described extra tasks being assigned to you.',
 day_no_break:'You added that there was little or no time for a break.',
 day_explanation:'You connected the earlier details to feeling tired.',
 day_relief:'You said talking about it helped a little.',
 normal_chat:'You asked for an ordinary conversation without jokes, so I asked about your day.',
 day_tiring:'You described a tiring day, so I asked what made it difficult.',
 day_work:'You said work was the reason the day was tiring. I asked about that.',
 day_study:'You said studying was the tiring part, so I followed that topic.',
 day_people:'You mentioned people as the reason, so I left room to explain without naming anyone.',
 day_easing:'You said you felt a little better. I acknowledged the change without assuming everything was fixed.'
}};
