# QA record

Checked after the pastel redesign on 2 October 2026.

- `npm test`: 8 tests passed.
- `npm run build`: public `dist/` built successfully; no ticket template or credentials included.
- `node --check script.js`, `node --check model.js`: passed.
- Full DOM flow: required selection errors, custom main and second ideas, custom time, conditional Night Drive music, review, edit cleanup, no early request, duplicate-click lock, failure preservation and confirmed state.
- Browser preview: iPhone width 390px, desktop width 1280px and intermediate widths; no horizontal overflow observed.
- Worker dry-run: Wrangler read the static assets and recognized the `RATE_LIMITER` (5 requests / 60 seconds) and `ASSETS` bindings.

The only unrun check is a real Telegram delivery because it requires the owner's bot token and chat ID. The local preview returns a deliberate failure for `/api/confirm` until the Worker is configured, so it never pretends a message was sent.
