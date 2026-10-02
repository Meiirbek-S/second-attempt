var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// model.js
var MAIN = [["cinema", "CINEMA", "Movie first. We'll figure out the rest later."], ["bowling", "BOWLING", "Let's see who's actually competitive."], ["shooting-range", "SHOOTING RANGE", "Let's find out who's got better aim."], ["billiards", "BILLIARDS", "Simple rules. Questionable skills."], ["custom", "YOUR IDEA", "Got a better idea? I'm listening."]];
var SECOND = [["cinema", "CINEMA", "A little big-screen escapism."], ["dinner", "DINNER", "Good food. Better company."], ["night-drive", "NIGHT DRIVE", "Nowhere in a hurry."], ["coffee", "COFFEE", "One more conversation."], ["dessert", "DESSERT", "End on a sweet note."], ["custom", "YOUR IDEA", "I'm still listening."], ["none", "NOTHING \u2014 ONE IS ENOUGH", ""]];
var MUSIC = [["your-bluetooth", "YOUR BLUETOOTH", "You get the aux. No judgment."], ["my-playlist", "MY PLAYLIST", "Trust me."], ["50-50", "50 / 50", "Diplomatic solution."]];
var DATES = ["2026-10-23", "2026-10-24", "2026-10-25", "2026-10-26", "any"];
var TIMES = ["17:00", "18:00", "19:00", "20:00", "other"];
var initialState = /* @__PURE__ */ __name(() => ({ mainActivity: "", mainActivityCustom: "", secondActivity: "", secondActivityCustom: "", music: "", date: "", time: "", customTime: "", pickup: "" }), "initialState");
var normalize = /* @__PURE__ */ __name((s) => s.trim().toLowerCase().replace(/[\s_-]+/g, " "), "normalize");
function activity(s, which) {
  const value = s[which + "Activity"];
  return value === "custom" ? s[which + "ActivityCustom"].trim() : value === "none" ? "" : [...MAIN, ...SECOND].find((x) => x[0] === value)?.[1] || "";
}
__name(activity, "activity");
var hasDrive = /* @__PURE__ */ __name((s) => [activity(s, "main"), activity(s, "second")].some((x) => normalize(x) === "night drive"), "hasDrive");
var steps = /* @__PURE__ */ __name((s) => ["intro", "main", "second", ...hasDrive(s) ? ["music"] : [], "date", "time", "pickup", "review", "confirmed"], "steps");
var displayDate = /* @__PURE__ */ __name((d) => d === "any" ? "Any day works" : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(/* @__PURE__ */ new Date(d + "T12:00:00Z")), "displayDate");
var displayTime = /* @__PURE__ */ __name((s) => s.time === "other" ? s.customTime : s.time, "displayTime");
var timeValid = /* @__PURE__ */ __name((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t), "timeValid");
function validateStep(s, step) {
  if (step === "main" && (!MAIN.some((x) => x[0] === s.mainActivity) || s.mainActivity === "custom" && !s.mainActivityCustom.trim())) return "Pick the main event, or tell me your idea.";
  if (step === "second" && (!SECOND.some((x) => x[0] === s.secondActivity) || s.secondActivity === "custom" && !s.secondActivityCustom.trim())) return "Pick a second stop, or choose one is enough.";
  if (step === "second" && s.secondActivity !== "none" && normalize(activity(s, "main")) === normalize(activity(s, "second"))) return "Let\u2019s make the second stop something different.";
  if (step === "music" && hasDrive(s) && !MUSIC.some((x) => x[0] === s.music)) return "Choose who controls the music.";
  if (step === "date" && !DATES.includes(s.date)) return "Pick a date, or choose any day works.";
  if (step === "time" && (!TIMES.includes(s.time) || !timeValid(displayTime(s)))) return "Choose a time, or enter another time.";
  if (step === "pickup" && !s.pickup.trim()) return "Tell me where to pick you up.";
  return "";
}
__name(validateStep, "validateStep");
function validatePlan(s) {
  for (const step of steps(s)) {
    const error = validateStep(s, step);
    if (error) return { step, error };
  }
  return null;
}
__name(validatePlan, "validatePlan");

// worker/worker.js
var recent = /* @__PURE__ */ new Map();
var localLimits = /* @__PURE__ */ new Map();
var json = /* @__PURE__ */ __name((status, data, origin) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...origin ? { "Access-Control-Allow-Origin": origin, "Vary": "Origin" } : {} } }), "json");
function validateRequest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("Invalid data");
  const keys = Object.keys(initialState());
  if (Object.keys(value).length !== keys.length || Object.keys(value).some((k) => !keys.includes(k))) throw Error("Unexpected fields");
  for (const key of keys) {
    if (typeof value[key] !== "string" || value[key].length > (key === "pickup" ? 300 : 120) || /[\u0000-\u001f\u007f]/.test(value[key])) throw Error("Invalid field");
  }
  const s = Object.fromEntries(keys.map((k) => [k, value[k].trim()]));
  if (s.mainActivity !== "custom" && s.mainActivityCustom || s.secondActivity !== "custom" && s.secondActivityCustom || s.time !== "other" && s.customTime || !hasDrive(s) && s.music) throw Error("Stale fields");
  if (validatePlan(s)) throw Error("Incomplete plan");
  return s;
}
__name(validateRequest, "validateRequest");
function telegramMessage(s, now = /* @__PURE__ */ new Date()) {
  const rows = ["NEW DATE \u2014 ATTEMPT #002", "MAIN EVENT\n" + activity(s, "main")];
  if (s.mainActivity === "custom") rows.push("MAIN SOURCE\nHer idea");
  if (s.secondActivity !== "none") {
    rows.push("SECOND STOP\n" + activity(s, "second"));
    if (s.secondActivity === "custom") rows.push("SECOND SOURCE\nHer idea");
  }
  rows.push("DATE\n" + displayDate(s.date), "TIME\n" + displayTime(s));
  if (hasDrive(s)) rows.push("MUSIC\n" + (s.music === "your-bluetooth" ? "Her Bluetooth" : MUSIC.find((x) => x[0] === s.music)[1]));
  rows.push("PICKUP\n" + s.pickup, "STATUS\nCONFIRMED", "Submitted:\n" + new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Almaty" }).format(now) + " (Asia/Almaty)");
  return rows.join("\n\n");
}
__name(telegramMessage, "telegramMessage");
async function readLimited(request) {
  if (Number(request.headers.get("Content-Length")) > 4096) throw Error("Body too large");
  const reader = request.body?.getReader();
  if (!reader) throw Error("Missing body");
  let total = 0, chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > 4096) {
      await reader.cancel();
      throw Error("Body too large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}
__name(readLimited, "readLimited");
async function allowedRate(request, env) {
  const key = request.headers.get("CF-Connecting-IP") || "local";
  if (env.RATE_LIMITER) return (await env.RATE_LIMITER.limit({ key })).success;
  const now = Date.now();
  for (const [ip, entry2] of localLimits) if (entry2.expires < now) localLimits.delete(ip);
  const entry = localLimits.get(key) || { count: 0, expires: now + 6e4 };
  entry.count++;
  if (localLimits.size < 1e3 || localLimits.has(key)) localLimits.set(key, entry);
  return entry.count <= 5;
}
__name(allowedRate, "allowedRate");
var worker_default = { async fetch(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== "/api/confirm") return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Not found", { status: 404 });
  const origin = request.headers.get("Origin");
  const allowedOrigin = env.ALLOWED_ORIGIN || url.origin;
  if (!origin || origin !== allowedOrigin) return json(403, { ok: false }, null);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": origin, "Vary": "Origin", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-Submission-ID", "Access-Control-Max-Age": "600" } });
  if (request.method !== "POST") return json(405, { ok: false }, origin);
  if (request.headers.get("Content-Type")?.split(";")[0].trim() !== "application/json") return json(415, { ok: false }, origin);
  const id = request.headers.get("X-Submission-ID") || "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return json(400, { ok: false }, origin);
  try {
    if (!await allowedRate(request, env)) return json(429, { ok: false }, origin);
  } catch {
    return json(503, { ok: false }, origin);
  }
  let state;
  try {
    state = validateRequest(await readLimited(request));
  } catch {
    return json(400, { ok: false }, origin);
  }
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return json(503, { ok: false }, origin);
  const now = Date.now();
  for (const [key, entry] of recent) if (entry.expires < now) recent.delete(key);
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(state)));
  const fingerprint = Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
  const existing = recent.get(id);
  if (existing) {
    if (existing.fingerprint !== fingerprint) return json(409, { ok: false }, origin);
    const ok2 = await existing.promise;
    return json(ok2 ? 200 : 502, { ok: ok2 }, origin);
  }
  if (recent.size >= 1e3) return json(503, { ok: false }, origin);
  const delivery = (async () => {
    try {
      const response = await fetch("https://api.telegram.org/bot" + env.TELEGRAM_BOT_TOKEN + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: telegramMessage(state), link_preview_options: { is_disabled: true } }), signal: AbortSignal.timeout(12e3) });
      const result = await response.json();
      return response.ok && result.ok === true;
    } catch {
      return false;
    }
  })();
  recent.set(id, { fingerprint, promise: delivery, expires: now + 6e5 });
  const ok = await delivery;
  if (!ok) recent.delete(id);
  return json(ok ? 200 : 502, { ok }, origin);
} };
export {
  worker_default as default,
  telegramMessage,
  validateRequest
};
//# sourceMappingURL=worker.js.map
