# Stories and games

After deployment, open `/kitsune open` and select **Stories & games**. English is the default. English/Georgian language buttons affect only this member's activities in the current server; language changes do not reset a story.

The first pack contains two authored branching stories with seven endings, inventory gates, a translated choice journal, scene-specific Kitsune comments and hints. Lost Lanterns has normal and strong suspense. Choices are untimed. The two games have four authored questions each, rotating answer positions and explanations. No activity grants server XP, ranks or roles; no external AI service is used.

Every interaction saves in `kitsune_play`, keyed by guild and user. Restarting or switching an unfinished story requires confirmation. The ending collection survives restarts. Language, intensity and game score persist. A new story replaces the one active checkpoint; this is stated before confirmation. Old buttons cannot apply an action to a newer revision. Private activity views edit in place.

The table is created during normal database startup. Do not manually delete existing player data. The existing Conversation / Kitsune guide module toggle controls activities. The public hub may be refreshed with `/kitsune publish` if you want its static button list updated; `/kitsune open` always renders the current menu.
