const intents = Object.freeze({
    hello:'hi', thanks:'thanks', listen:'decline_advice', chat:'chat_open',
    tired:'tired', sad:'feeling_bad', happy:'feeling_good', bored:'bored',
    help:'help_offer', study:'study_start', joke:'joke', compliment:'reaction_affection',
    praise_me:'nice', tease_me:'roast', secret:'secret', advice:'tip',
    explain:'explain', shorten:'simplify', apology:'reaction_apology',
    insult:'reaction_insult', dismiss:'reaction_dismissive'
});
module.exports = Object.freeze({
    enabled:true, intents, maxPhraseLength:160, maxAliasesPerGuild:300,
    maxUnknownPerGuild:500, unknownRetentionDays:30, recordCooldownMs:30_000,
    cacheTtlMs:60_000, failureBackoffMs:30_000, maxCachedGuilds:50,
    maxRateKeys:2000
});
