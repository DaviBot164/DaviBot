# Built-in person questions

Who is Mae/Ash/Davi/Daviti and do you know those names now use a built-in identity lookup before generic question fallback. Daviti resolves to Davi; Mae remains a distinct person, with her preferred address shown as Mae (Davi). Replies link the existing configured Discord ID and remain short. A lookup does not grant rights, change speaker identity, establish current membership or create a new knowledge record.

The normal explicit addressing, reply-to-bot and active-context boundaries apply. The live reply handler still disables mentions, so an ID link does not ping the person. Arbitrary unknown names still use remembered server knowledge where available. Quoted/reported whole sentences do not match the anchored known-name rule.

Existing unknown rows are not deleted by this update. Remove the stale who is mae row with /kitsune dismiss phrase:who is mae; later recognized questions will no longer be collected as unknown. Do not teach that question an unrelated action meaning. Built-in meanings retain priority over learned aliases.

No slash schema, database, dependency or saved-record changes. Deploy after offline checks; command registration is unnecessary. Offline tests cover short linked replies across speaker tones, Davi/Daviti normalization, active-context and no-ambient boundaries. No real Discord or database calls are made.
