# Announcements

Use `/announce channel:… title:… text:…`. Only these three fields are required.

- `color`: optional six-digit HEX, with or without `#`; e.g. `#B18CFF`. Omit to use the server's card color.
- `image`: optional PNG/JPEG/WebP uploaded attachment, up to 8 MB.
- `member`: optional first recipient. In the private preview, select 0–10 server members; clear the selection for no user pings.
- `everyone`: optional explicit @everyone ping, checked against both the publisher and bot's permissions.

The private preview never pings. Publish and Cancel expire two minutes after the preview opens; changing recipients does not extend the window. Selected members and channel permissions are rechecked before sending. Arbitrary roles and mentions written in the announcement body are not authorized to notify anyone. A failed send is never retried automatically.

Publishers need Manage Server and View Channel/Send Messages in the destination. The bot needs View Channel, Send Messages and Embed Links. Text and announcement channels are supported; this command does not crosspost to follower servers.

Run `node deploy-commands.js` after deployment to refresh the optional fields and descriptions.
