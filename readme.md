# 📦 Message Bubble Renderer API

API to generate message bubble images in the style of WhatsApp/Telegram/iMessage, with support for **replies**, **avatars (URL/Base64)**, color styles, and advanced options.

---

## 🚀 Endpoint

```
POST /render
Content-Type: application/json
Accept: image/png
```

---

## 🔧 Parameters

### Main fields

| Field       | Type                     | Required            | Description                                                                       |
| ----------- | ------------------------ | ------------------- | --------------------------------------------------------------------------------- |
| `mode`      | `"normal"` \| `"reply"`  | ✅                  | Defines whether the bubble is simple (`normal`) or a reply (`reply`).             |
| `side`      | `"left"` \| `"right"`    | ❌ (default `left`) | Side of the bubble arrow (received or sent message).                              |
| `style`     | `string`                 | ❌                  | Palette name (e.g., `whatsappDark`, `telegramLight`). Defaults to `whatsappDark`. |
| `override`  | `object`                 | ❌                  | Allows overriding individual palette colors (hex).                                |
| `msgAuthor` | `string`                 | ✅                  | Name of the message author (used in avatar initials).                             |
| `bodyText`  | `string`                 | ✅                  | Message text.                                                                     |
| `timeText`  | `string`                 | ❌                  | Text shown as timestamp (e.g., `"12:37"`).                                        |
| `avatarSrc` | `string` (URL or Base64) | ❌                  | Avatar of the author (falls back to initials if load fails).                      |

### Additional fields for `mode: reply`

| Field          | Type     | Required | Description                             |
| -------------- | -------- | -------- | --------------------------------------- |
| `replyAuthor`  | `string` | ✅       | Author of the quoted/original message.  |
| `replySnippet` | `string` | ✅       | Snippet of the quoted/original message. |

### Layout / Fonts

| Field          | Type     | Default | Description                                                        |
| -------------- | -------- | ------- | ------------------------------------------------------------------ |
| `width`        | `number` | `400`   | Canvas width.                                                      |
| `avatarSize`   | `number` | `64`    | Avatar size in pixels.                                             |
| `bubbleRadius` | `number` | `16`    | Border radius of the bubble.                                       |
| `fonts`        | `object` | -       | Custom fonts (`authorFont`, `quotedFont`, `bodyFont`, `timeFont`). |

---

## 🎨 Available Styles

```ts
whatsappDark,
	whatsappLight,
	telegramDark,
	telegramLight,
	iMessageDark,
	iMessageLight,
	businessDark,
	businessLight;
```

Each style provides:

- `bubbleColor`
- `textColor`
- `quotedBarColor`
- `quotedHeaderColor`
- `quotedTextColor`
- `timeColor`
- `authorColor`

---

## ✅ Example - Normal

```bash
curl -X POST http://localhost:3000/render \
  -H "Content-Type: application/json" \
  --data '{
    "mode": "normal",
    "side": "left",
    "style": "whatsappDark",
    "bodyText": "all set!",
    "timeText": "12:37",
    "msgAuthor": "Eduardo",
    "avatarSrc": "https://i.pravatar.cc/128"
  }' \
  --output bubble.png
```

---

## ✅ Example - Reply

```bash
curl -X POST http://localhost:3000/render \
  -H "Content-Type: application/json" \
  --data '{
    "mode": "reply",
    "side": "left",
    "style": "telegramDark",
    "replyAuthor": "Dad",
    "replySnippet": "Guilherme will arrive at 2PM",
    "bodyText": "sounds good!",
    "timeText": "12:37",
    "msgAuthor": "Eduardo",
    "avatarSrc": "https://i.pravatar.cc/128"
  }' \
  --output reply.png
```

---

## ⚠️ Error Responses

- **400 Bad Request**
  Invalid payload or missing required fields.

  ```json
  {
  	"error": "Bad Request",
  	"details": {
  		"fieldErrors": { "bodyText": ["bodyText is required"] }
  	}
  }
  ```

- **422 Unprocessable Entity**
  Invalid content (e.g., `bodyText` only whitespace, or failed to load `avatarSrc`).

  ```json
  {
  	"error": "Unprocessable Entity",
  	"message": "Failed to load avatarSrc image"
  }
  ```

- **500 Internal Server Error**
  Unexpected server error.

---

## 🛠️ Usage Notes

- To use the image directly in HTML/React, convert the binary to **Base64** and use it in `<img src="data:image/png;base64,...">`.
- Pure **Base64** avatars are also supported.
- For advanced customization, use `override` to tweak individual colors without creating a new palette.

---

## 🩺 Healthcheck

```
GET /health
200 OK
{"ok": true}
```
