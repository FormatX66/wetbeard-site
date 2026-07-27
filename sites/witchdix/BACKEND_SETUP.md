# Witchdix private grimoire backend

## Server environment

Configure these values outside the web root or in the hosting environment. Do not commit secrets.

- `WITCHDIX_ADMIN_PASSWORD` — password for `/admin.php`.
- `OPENAI_API_KEY` — OpenAI API key used only by server-side `api.php`.
- `WITCHDIX_AI_MODEL` — optional; defaults to `gpt-5-mini`.

## Storage

Entries append to `data/grimoire.jsonl`. The API creates a deny-all `.htaccess` in that directory as a second layer of protection. Raw author notes, author hints, and private entries are only returned to an authenticated admin session.

## Publishing

New notes are private by default. Heather can explicitly check **Place the finished catalog entry in the public grimoire** while saving a note.

Public consumers can call:

- `POST api.php` with `{ "action": "public_recent" }`
- `POST api.php` with `{ "action": "public_search", "q": "rosemary protection" }`

Those actions return only public-safe catalog fields (title, category, summary, tags, cross-references, safety note) and never return raw private notes.

## AI behavior

When an OpenAI API key is configured, the server sends the raw note to the Responses API and requests strict structured JSON containing a title, category, concise summary, tags, cross-references, search terms, and an optional practical safety note. If the AI call is unavailable, the note is still saved and a simple local fallback index is generated, so writing is never blocked by the AI service.
