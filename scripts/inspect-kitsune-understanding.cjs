#!/usr/bin/env node
'use strict';
// Local diagnostic: no bot login, DB import, message send or saved transcript.
const {inspectUnderstanding,prepareInput}=require('../handlers/kitsune/language');
const {contextualCategory}=require('../handlers/kitsune/context');
const {understandingResult,topicAnchor}=require('../handlers/kitsune/understandingResult');
const args=process.argv.slice(2);
let topic=null;
if(args[0]==='--topic'){
 args.shift();topic=args.shift();
 if(!topicAnchor(topic)){console.error('Use a supported topic, such as day_work or study_start.');process.exit(2);}
}
const text=args.join(' ');
if(!text){console.error('Usage: node scripts/inspect-kitsune-understanding.cjs [--topic day_work] "sentence without kitsune prefix"');process.exit(2);}
const report=inspectUnderstanding(text);
if(topic){
 const category=contextualCategory(text,{category:topic,topicCategory:topic},prepareInput(text));
 report.contextualCategory=category;
 report.effectiveUnderstanding=category?understandingResult(category,{source:'context',rule:'contextual_followup'}):report.understanding;
}
console.log(JSON.stringify(report,null,2));
