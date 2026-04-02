#!/usr/bin/env node

/**
 * AFRC Weekly Content Pipeline
 * Generates WhatsApp reminder, ice breaker, and Instagram caption for Almost Friday Run Club SF
 *
 * Usage:
 *   node generate.js
 *   node generate.js --location "Embarcadero" --weather "foggy" --attendance 34 --last-week "someone fell at the hill turnaround"
 *   node generate.js --mode whatsapp   (generate only one piece)
 *   node generate.js --save            (save output to /outputs folder)
 */

const https = require("https");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// ─── Config ────────────────────────────────────────────────────────────────

const MODEL = "claude-sonnet-4-20250514";
const OUTPUT_DIR = path.join(__dirname, "outputs");

const SYSTEM_PROMPT = `You are the content voice for Almost Friday Run Club (AFRC), a Thursday morning running community in San Francisco. You generate three pieces of weekly content with consistent tone and voice.

TONE & VOICE:
- Chaotic fun energy — playful, a little unhinged, never try-hard
- Witty without being cringe. Self-aware but not ironically hollow.
- Think: a friend who's excited about running but also makes fun of themselves for being excited about running
- Never corporate. Never "let's go team 💪". Never inspirational quote energy.
- Emojis: use sparingly and only when they add something real
- Lean into the "almost Friday" premise when it fits naturally

AUDIENCE:
- SF runners, casually fit, probably tech-adjacent
- Mix of regulars and new members
- People who want to show up but need a nudge

OUTPUT FORMAT — always return valid JSON with exactly these keys:
{
  "whatsapp": "...",
  "icebreaker": "...",
  "caption": "...",
  "hashtags": "..."
}

WHATSAPP RULES:
- 4–7 lines max, conversational, line breaks for rhythm
- Must include: Thursday, 7am, and the location
- Hook options: lean into "Almost Friday" name, SF weather, FOMO framing, self-deprecating running humor
- No bullet points

ICE BREAKER RULES:
- One sentence. A hot take or unpopular opinion that sparks genuine debate while running
- Running-adjacent OR totally unrelated — both work
- Accessible to new members, no insider knowledge required
- Format: "Hot take: ..." or "Unpopular opinion: ..."

INSTAGRAM CAPTION RULES:
- 2–4 lines. Must feel like a genuine moment, not a brand post
- Slightly chaotic, a little proud, zero corporate energy
- Reference weather/struggle/group dynamic/almost Friday where natural
- Do NOT include hashtags in the caption — return them separately in the hashtags field

HASHTAGS RULES:
- Always include: #AlmostFridayRunClub #SFRunClub
- Add 2–4 from: #RunClub #ThursdayRun #SanFrancisco #MorningRun #RunCommunity #CityRunning #SFBayArea
- Return as a single string to paste into first comment`;

// ─── Helpers ────────────────────────────────────────────────────────────────

function callClaude(userPrompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const req = https.request(
      {
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) return reject(new Error(parsed.error.message));
            const text = parsed.content?.[0]?.text || "";
            // Strip markdown code fences if present
            const clean = text.replace(/```json\n?|\n?```/g, "").trim();
            resolve(JSON.parse(clean));
          } catch (e) {
            reject(new Error(`Failed to parse Claude response: ${e.message}\nRaw: ${data}`));
          }
        });
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function printDivider() {
  console.log("\n" + "─".repeat(60) + "\n");
}

function printOutput(result, mode) {
  printDivider();

  if (!mode || mode === "whatsapp") {
    console.log("📱  WHATSAPP REMINDER\n");
    console.log(result.whatsapp);
    printDivider();
  }

  if (!mode || mode === "icebreaker") {
    console.log("🎤  ICE BREAKER\n");
    console.log(result.icebreaker);
    printDivider();
  }

  if (!mode || mode === "caption") {
    console.log("📸  INSTAGRAM CAPTION\n");
    console.log(result.caption);
    console.log("\n— First comment hashtags —");
    console.log(result.hashtags);
    printDivider();
  }
}

function saveOutput(result, context) {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const date = new Date().toISOString().split("T")[0];
  const filename = path.join(OUTPUT_DIR, `afrc-${date}.json`);

  const toSave = { date, context, ...result };
  fs.writeFileSync(filename, JSON.stringify(toSave, null, 2));
  console.log(`\n✓ Saved to ${filename}`);

  // Also save a plain text version
  const txtFile = path.join(OUTPUT_DIR, `afrc-${date}.txt`);
  const txt = [
    `AFRC Weekly Content — ${date}`,
    "=".repeat(40),
    "",
    "📱 WHATSAPP REMINDER",
    result.whatsapp,
    "",
    "🎤 ICE BREAKER",
    result.icebreaker,
    "",
    "📸 INSTAGRAM CAPTION",
    result.caption,
    "",
    "— First comment hashtags —",
    result.hashtags,
  ].join("\n");

  fs.writeFileSync(txtFile, txt);
  console.log(`✓ Plain text saved to ${txtFile}`);
}

function buildPrompt(ctx) {
  const parts = ["Generate all three pieces of AFRC weekly content."];

  if (ctx.location) parts.push(`Location: ${ctx.location}`);
  if (ctx.weather) parts.push(`Weather: ${ctx.weather}`);
  if (ctx.attendance) parts.push(`Attendance: ${ctx.attendance} people showed up`);
  if (ctx.lastWeek) parts.push(`Callback from last week: ${ctx.lastWeek}`);
  if (ctx.theme) parts.push(`Theme or occasion: ${ctx.theme}`);
  if (ctx.extra) parts.push(`Additional context: ${ctx.extra}`);

  if (parts.length === 1) {
    parts.push("No extra context provided — generate solid defaults with SF Thursday morning energy.");
  }

  return parts.join("\n");
}

// ─── Arg parsing ────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const ctx = {};
  let mode = null;
  let save = false;
  let interactive = true;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--location":    ctx.location   = args[++i]; interactive = false; break;
      case "--weather":     ctx.weather    = args[++i]; interactive = false; break;
      case "--attendance":  ctx.attendance = args[++i]; interactive = false; break;
      case "--last-week":   ctx.lastWeek   = args[++i]; interactive = false; break;
      case "--theme":       ctx.theme      = args[++i]; interactive = false; break;
      case "--extra":       ctx.extra      = args[++i]; interactive = false; break;
      case "--mode":        mode           = args[++i]; break;
      case "--save":        save           = true; break;
      case "--no-prompt":   interactive    = false; break;
    }
  }

  return { ctx, mode, save, interactive };
}

// ─── Interactive mode ────────────────────────────────────────────────────────

async function promptContext() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log("\n🏃  AFRC Weekly Content Generator\n");
  console.log("Answer what you know — hit enter to skip any field.\n");

  const location   = await ask(rl, "📍 Run location (e.g. Embarcadero, Crissy Field): ");
  const weather    = await ask(rl, "🌁 Weather vibe (e.g. foggy, sunny, cold): ");
  const attendance = await ask(rl, "👟 How many people showed up: ");
  const lastWeek   = await ask(rl, "😂 Anything funny from last week's run: ");
  const theme      = await ask(rl, "🎯 Any theme or special occasion this week: ");

  rl.close();

  return {
    location:   location.trim()   || null,
    weather:    weather.trim()    || null,
    attendance: attendance.trim() || null,
    lastWeek:   lastWeek.trim()   || null,
    theme:      theme.trim()      || null,
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable not set.");
    console.error("Run: export ANTHROPIC_API_KEY=your_key_here");
    process.exit(1);
  }

  const { ctx, mode, save, interactive } = parseArgs();

  // Collect context interactively if no flags were passed
  const context = interactive ? await promptContext() : ctx;

  console.log("\nGenerating content...");

  const prompt = buildPrompt(context);
  const result = await callClaude(prompt);

  printOutput(result, mode);

  if (save) saveOutput(result, context);

  console.log("Done. Tweak anything? Re-run with --extra \"make the caption more unhinged\" or similar.\n");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
