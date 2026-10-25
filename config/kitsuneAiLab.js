// Evaluation only. This flag never enables AI in public message handling.
module.exports=Object.freeze({model:'openai/gpt-oss-20b',maxTurns:10,maxInput:1500,maxReply:1500,maxSessions:16,ttlMs:10*60_000,timeoutMs:15_000,dailyRequests:30,historyMessages:12,historyChars:6000,maxCompletionTokens:1024});
