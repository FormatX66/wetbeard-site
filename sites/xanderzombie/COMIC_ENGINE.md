# Xander Zombie — AI Comic Engine

## Goal
Xander can send photos, memes, screenshots, fragments of dialogue, or plain-language prompts. The private studio preserves those source items, uses AI to understand the idea, fits it into the established canon of a teenage zombie, and proposes a new comic strip/page without silently rewriting established story facts.

## Pipeline
1. **Inbox** — accept one or more source images plus an optional prompt/comment.
2. **Interpret** — multimodal AI extracts the joke, characters, setting, mood, useful visual details, and any requested story beat.
3. **Canon pass** — retrieve the current story bible, recent episodes, characters, unresolved threads, recurring jokes, and realm-passport crossover state.
4. **Writer pass** — generate a structured episode proposal: title, continuity note, 3–8 panels, captions, dialogue, visual direction, optional choice/branch, tags, and callbacks.
5. **Art pass** — generate original comic imagery based on the episode plan and permitted source material. Memes are treated as inspiration/context rather than copied artwork. User-supplied photos can be used as references when appropriate.
6. **Lettering/layout** — compose panels, speech balloons, captions, gutters, issue/page metadata, and mobile reel crops.
7. **Review** — generated work is a draft. Xander can approve, revise prompt/dialogue, regenerate an individual panel, or discard it.
8. **Publish** — approved episode is appended to the public comic feed and added to canon/search indexes.

## Canon model
Keep `story-bible.json` as the authoritative continuity source. AI may propose canon changes but only an approved episode can add facts. Store each approved episode with its source prompt, summary, characters, locations, continuity additions, callbacks, tags, panel script, image assets, and publication timestamp.

## Core tone
A teenage boy happens to be a zombie. The comedy comes from teenage life continuing despite being undead: parents, chores, school, friends, food, embarrassment, rules, crushes, boredom, and bizarre supernatural problems. Keep Xander a person first and a zombie second. Darkly funny rather than relentlessly grim or gory.

## Backend design
- `/studio/` private creator UI
- authenticated upload endpoint for images and prompts
- server-side OpenAI API calls; never expose API keys in browser JavaScript
- structured JSON for episode plans
- persistent draft/approved episode storage
- semantic/full-text search over canon and previous episodes before writing a new one
- generated asset directory separated from raw private uploads
- publish action explicitly required

## Suggested AI jobs
- **Vision/intake:** summarize supplied photo/meme/prompt and identify usable story ingredients.
- **Continuity editor:** retrieve relevant canon and flag contradictions.
- **Comic writer:** produce structured panel script.
- **Image generator:** render original panels with a stable Xander character reference/style guide.
- **Editor:** check dialogue length, panel readability, continuity, and whether the joke lands.

## Output formats
Every approved story should be renderable as both:
- a traditional comic page for the website;
- a vertical reel/strip for phones and social sharing.

The same episode data drives both layouts so story canon does not fork.