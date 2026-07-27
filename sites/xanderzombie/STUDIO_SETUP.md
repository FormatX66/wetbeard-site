# Xander Zombie creator studio

## Private studio

`/studio.php` accepts photos, memes, screenshots, and prompts. Raw uploads stay under the deny-all `data/` tree. Nothing becomes public canon until **PUBLISH TO CANON** is used.

## Server environment

Configure outside the web root / through the hosting environment:

- `XANDER_STUDIO_PASSWORD` — private studio password.
- `OPENAI_API_KEY` — used only by server-side PHP.
- `XANDER_WRITER_MODEL` — optional; defaults to `gpt-5.6-luna`.
- `XANDER_IMAGE_MODEL` — optional; defaults to `gpt-image-2`.

## Workflow

1. Upload up to 8 JPEG/PNG/WebP images (10 MB each max) and/or write a prompt.
2. The writer receives `story-bible.json`, recent approved episodes, and the supplied images/prompt.
3. It returns a structured 3–8 panel episode plan.
4. Edit/save the plan in the studio.
5. Optionally generate an original portrait comic page.
6. Publish explicitly. Published episodes append to `data/episodes.jsonl` and become visible through `comic-api.php?action=public_list`.
7. `index.html` provides the comic/page reader; `reel.php` renders the same approved episode data vertically for phone/social viewing.

The hand-built opening is Issue 01. The first studio-published episode begins at Issue 02.