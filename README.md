# SECOND ATTEMPT / ATTEMPT #002

A complete mobile-first personal invitation. Plain HTML, CSS and JavaScript; one Cloudflare Worker handles delivery to your private Telegram chat. No framework, database, login, cookies, analytics, external fonts, browser storage or tracking scripts.

## What is ready

- Exact Russian intro and “Why not try again?” headline.
- Main activity and one optional second stop, custom ideas, conditional music, the four October 2026 dates, custom time, pickup, editable review.
- Server-validated Telegram delivery, pending state, failure/retry, success only after a successful Telegram response.
- Separate editable, printable ticket template, excluded from the public build.
- Automated state and endpoint tests. Browser layout/flow checks are recorded in `QA.md`.

**Live deployment requires your Cloudflare account and the two Telegram secrets.** No real credentials are included. The local preview simulates a successful confirmation locally so you can see the complete experience; it never sends a Telegram message. The deployed Worker is the only path that delivers to Telegram.

## 1. Run locally

Install a current Node.js LTS version (22 or later). In this folder:

```sh
npm run dev
```

Open http://127.0.0.1:4173. No dependency installation is needed for this visual preview. Keep the terminal open. Stop with Ctrl+C. Refreshing clears the plan, by design.

Run the automated checks and prepare the public files:

```sh
npm test
npm run build
```

`dist/` contains only the five public application files plus security headers and robots.txt. Never publish the project root: that would expose owner-only files and could expose local secrets.

## 2. Create your Telegram bot

1. In Telegram, open the official **@BotFather** account (https://t.me/BotFather).
2. Send `/newbot`, choose a name and a unique bot username, and copy the token privately.
3. Open your new bot's chat and press **Start**, or send `/start`. Bots cannot initiate a private conversation before you start them.
4. Keep the token out of screenshots, frontend files, source control and shared chat messages.

Official guide: https://core.telegram.org/bots/tutorial#obtain-your-bot-token

## 3. Find your private Telegram chat ID

After sending `/start` to the bot, use the included helper. It prompts for the token without echoing it, calls Telegram's `getUpdates`, and prints only private chat IDs and names:

```sh
python3 telegram-chat-id.py
```

Choose your own private chat. This requires no third-party “ID finder” bot. If no result appears, send another message to your bot and retry. Use a dedicated new bot with no webhook; an existing webhook prevents `getUpdates` from working. Avoid using a group chat for private pickup details.

Reference: https://core.telegram.org/bots/api#getupdates

## 4. Deploy frontend and Worker together (recommended)

The included `wrangler.jsonc` serves `dist/` and routes `/api/confirm` to the Worker. This is one deployment, one URL, and no CORS configuration is necessary. Use Wrangler 4.36 or later for the native rate-limit binding.

```sh
npx wrangler login
npm run build
npx wrangler deploy
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
```

Each `secret put` command securely prompts for its value. The initial deploy creates the Worker and refuses submissions until both secrets are set. Do not share the invitation until the live test below succeeds. You can change `name` in `wrangler.jsonc` before deploying if the default is unavailable.

Wrangler prints the actual HTTPS `workers.dev` URL. Open that URL and complete the live test. The frontend already calls `/api/confirm`; there is no URL to paste when deployed together. To publish edits, run `npm run deploy`.

The configuration declares a native Cloudflare rate-limit binding, five attempts per IP per minute per Cloudflare location. `namespace_id` is an account-local identifier; choose another positive numeric string if `1002` is already used for another limit in your account. This does not require a database. Cloudflare counters are approximate and location-local.

Official references:
- Static assets: https://developers.cloudflare.com/workers/static-assets/
- Secrets: https://developers.cloudflare.com/workers/configuration/secrets/
- Rate limits: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/

### Test the real Worker locally

Copy `.dev.vars.example` to `.dev.vars`, enter your real token and private chat ID there, then run:

```sh
npm run build
npx wrangler dev
```

Use the exact local URL printed by Wrangler. `.dev.vars` is ignored by Git and excluded from the build. **Confirming here sends a real Telegram message.** Use a harmless test pickup label, not someone's actual address. Do not enable request-body logging.

## 5. Separate frontend hosting (optional)

The recommended single-Worker deployment is simpler. If you host `dist/` elsewhere:

1. Change `SUBMISSION_ENDPOINT` in `config.js` to the exact HTTPS Worker URL ending in `/api/confirm`.
2. Set Worker environment variable `ALLOWED_ORIGIN` to the frontend's exact origin, such as `https://your-invitation.example`, with no trailing slash or path. Add it in Cloudflare's Worker settings or via `npx wrangler secret put ALLOWED_ORIGIN`.
3. In `build.mjs`, add that exact Worker origin after `'self'` in `connect-src`. Do not use a wildcard.
4. Rebuild and deploy `dist/` only. Ensure the frontend host applies the generated `_headers`, or configure equivalent headers there.
5. Keep `worker/worker.js` and its `../model.js` import together when deploying the Worker. Do not copy just `worker.js` into a dashboard editor.

The Worker accepts only the configured origin (its own by default), JSON POST requests, expected fields, valid choices, bounded strings and bodies, and valid submission IDs. CORS is an abuse barrier, not authentication: non-browser clients can forge an Origin header. The native rate limit provides additional basic protection.

## 6. Live submission checklist

1. Open the deployed HTTPS URL on your phone.
2. Choose Bowling + Night Drive; choose music, a date, time and harmless pickup text.
3. Check every value in the review. Verify that no message arrives before pressing LOOKS GOOD.
4. Press LOOKS GOOD once. Verify one clean message appears in your private bot chat, then the site shows IT'S A DATE.
5. Test the no-second-stop route; the review should say PLAN and omit MUSIC.
6. To test a real failure without altering production secrets, use local `wrangler dev` with an invalid token. Check that TRY AGAIN preserves all selections. Restore the token before retesting.

The automated endpoint tests use a mocked Telegram response; they do not send messages and are not a substitute for this live credential test.

## 7. Customize content

| Change | File |
| --- | --- |
| Exact intro / page titles / short copy | `script.js` |
| Main and second activities and descriptions | `model.js`: `MAIN`, `SECOND` |
| Music choices | `model.js`: `MUSIC` |
| Allowed dates | `model.js`: `DATES`, and calendar labels/day numbers in `script.js` |
| Time choices | `model.js`: `TIMES` |
| Color, typography, spacing, mobile layouts | `style.css` |
| Delivery URL | `config.js` |
| Telegram message / timestamp timezone | `worker/worker.js`: `telegramMessage` |
| Browser title, description, favicon, header/footer | `index.html` |

The frontend and Worker share the same option definitions and validation model. Rebuild and redeploy both after changing allowed values. Currently the standard main-event menu intentionally omits Night Drive, matching the brief; selecting YOUR IDEA and entering “Night Drive” (case-insensitive, spaces/hyphens accepted) activates music as a main event. Night Drive is also a normal second-stop choice.

All choices are held in a single in-memory object. The second stop is one scalar value, so a third activity is impossible. Changing an activity clears irrelevant custom text, duplicate second activities and obsolete music. Choosing a normal time clears custom time. Review values and custom text are escaped before HTML rendering; Telegram uses plain text without HTML/Markdown parsing.

## 8. Prepare your final ticket later

Edit `ticket-data.js` after booking. You can set activity 1, optional activity 2, date, event time, pickup time, location, names, notes, status and serial number.

While `npm run dev` is running, open http://127.0.0.1:4173/ticket.html. Use PRINT / SAVE PDF, or take a screenshot for WhatsApp. In the print dialog, enable background graphics, disable browser headers/footers and select landscape. `ticket.js` exports `renderTicket(data)` for reuse. The barcode is decorative; no QR code or scan action is implied.

The invitation does not link to this template, automatically generate a booked ticket, or send one to the recipient. The build excludes `ticket*` files. Keep populated templates local and personally send the finished result when ready.

## Privacy and operational limits

- No plan or pickup location is written to localStorage, sessionStorage, cookies or a database. No third-party requests occur before confirmation. Form autocomplete is disabled, although browsers ultimately control autofill behavior.
- Successful confirmation clears the frontend plan. The Worker transiently handles the submitted content only to send it to Telegram. No personal request data is logged by this code. Wrangler observability is disabled in the supplied production config.
- Recent submission IDs and payload hashes are held temporarily in Worker memory for best-effort duplicate suppression. This includes concurrent clicks and retries handled by the same isolate. It is **not global exactly-once delivery**: a timeout after Telegram accepts a message, an isolate restart, or requests reaching different isolates can produce a duplicate. Strict delivery deduplication would require shared persistent state, intentionally excluded by the brief.
- Both frontend and Telegram calls have timeouts. Telegram API errors and missing secrets return failures; the frontend keeps the plan for retry. After a rate limit, wait a minute before retrying.
- The URL is unlisted, with noindex metadata and robots exclusions. As requested, there is no login: anyone who receives the URL can open it. This is private-by-sharing, not access-controlled. Do not place the final ticket or real pickup details in public source files.
- Telegram is the final data destination; Cloudflare necessarily processes the request in transit. Data already delivered to your Telegram account follows Telegram's retention and account controls.

## File map

```text
index.html / style.css / script.js   Invitation UI
model.js / config.js                Shared choices, validation, public endpoint
worker/worker.js                    Secure Telegram endpoint
wrangler.jsonc                      Single Cloudflare deployment
build.mjs / dev.mjs                  Public build and honest local preview
ticket*.{html,css,js}                Owner-only reusable ticket
telegram-chat-id.py                  Private chat-ID helper
.dev.vars.example                   Placeholder local secrets
tests/worker.test.mjs                Automated logic and endpoint tests
QA.md                               Checks and remaining live verification
```
