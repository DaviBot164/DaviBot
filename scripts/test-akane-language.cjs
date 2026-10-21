'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const root = process.argv[2] || path.resolve(__dirname, '..');
const load = p => require(path.join(root, p));
const { recognize } = load('handlers/akane/language.js');
let checks = 0;
for (const [text, expected] of [
 ['idk','uncertain'],['tbh idk','uncertain'],['ngl im tired rn','tired'],
 ['wsym','explain'],['wym','explain'],['wdym','explain'],['wbu','mood'],
 ['hru','mood'],['wyd','curious'],['brb','pause'],['gn','goodnight'],
 ['gm','morning'],['gtg','stop'],['ikr','agree'],['i disagree','disagree'],
 ['tbh you are stupid',null],['my girlfriend is here',null],
 ['the word idk appears here',null],['idk but you are stupid',null],
 ['i am not sad',null],['not tired',null],['discord',null],
 ['tbh',null],['ngl',null],['არ ვიცი','uncertain'],['მოვიწყინე','bored'],
 ['I AM BORED!!!','bored'],['i am back','returning'],['im tired','tired'],
 ['lol','laugh'],['thank u','thanks'],['good night','goodnight']
]) {assert.equal(recognize(text),expected,text); checks++;}
const config = load('config/akaneConversation.js');
for (const [tone, categories] of Object.entries(config.pools)) {
 for (const [category,pool] of Object.entries(categories)) {
  assert.ok(pool.length, `${tone}/${category}`);
  for(const text of pool) {assert.equal(typeof text,'string'); assert.ok(text.length > 0 && text.length < 1800); checks++;}
 }
}
// Parser isolation: no Discord, database or network calls.
let session;
const parserPath = path.join(root,'handlers/akane/parser.js');
const original = Module._load;
Module._load = function(request,parent,isMain) {
 if (parent?.filename === parserPath) {
  if(request === './settings') return { OWNER_ID:'owner', dialogue:{maeId:'mae'}, reactionPools:{insult:['x']} };
  if(request === './state') return { getSession:()=>session };
  if(request === '../../config/akaneReactions') return {detectReaction:t=>t.includes('stupid')?'insult':null};
 }
 return original.apply(this,arguments);
};
let parseRequest;
try { ({parseRequest}=require(parserPath)); } finally {Module._load=original;}
const msg=(content,reference)=>({content,reference,mentions:{}});
session=null;
assert.equal(parseRequest(msg('idk'),100),null); checks++;
session={messageId:'latest',category:'nice',question:false,implicitUntil:200};
assert.equal(parseRequest(msg('tbh idk'),100).category,'uncertain'); checks++;
assert.equal(parseRequest(msg('wdym'),100).context,'nice'); checks++;
assert.equal(parseRequest(msg('idk',{messageId:'someone-else'}),100),null); checks++;
assert.equal(parseRequest(msg('idk'),201),null); checks++;
assert.equal(parseRequest(msg('yes'),100).category,'clarify'); checks++;
session.question=true;
assert.equal(parseRequest(msg('yes'),100).category,'yes'); checks++;
assert.equal(parseRequest(msg('akane tbh you are stupid'),100).category,'reaction_insult'); checks++;
assert.equal(parseRequest(msg('unrelated chat'),100),null); checks++;
console.log(`${checks} offline slang and parser checks passed.`);
