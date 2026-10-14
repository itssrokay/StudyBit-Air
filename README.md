# Learning Space

A private, account-backed personal learning dashboard. Built with React, Vinext, Cloudflare Workers, and D1 through Sites.

## What works

- A daily lesson plan with a configurable budget (45 minutes initially).
- A ranked library of courses, videos, articles, and topics.
- Course-order prerequisites, explicit priorities, focus goals, deadlines, and pinning.
- Lesson completion, course progress, focus timer, resource and lesson notes, and activity history.
- Course import from a pasted syllabus or JSON. YouTube video links use oEmbed metadata; other links are saved for manual labeling.
- Editable import previews, prior-completion import, archive/restore, backup export and full backup restore.
- Account-specific D1 storage, authenticated APIs, optimistic revision checks, and unsaved-change warnings.
- An optional server-side OpenAI coach and AI syllabus organizer with structured, validated outputs and explicit review before applying priorities.

Sample courses are illustrative. They are not purchased course content. Seed progress has no completion timestamps and does not contribute to study history.

## Local development

Requirements: Node >=22.13, npm, Git. Run `npm run install:ci` when dependencies are absent.

Set `d1` to `DB` in `.openai/hosting.json`. Generate migrations with `npm run db:generate` after schema changes. Build once with `npm run build`, then apply each pending migration once:

```
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_tan_zaladane.sql
npm run dev
```

Portable preview uses dispatch-owned mock sign-in on loopback. Production uses Sites authentication. Data is keyed by stable authenticated user ID, not email.

## Checks

```
npx tsc --noEmit
node --experimental-strip-types --test tests/learning.test.mjs
npm run build
```

Tests cover time budgets, prerequisites, pinning, completion, archive exclusion, timezone rollover, import parsing, unsafe URLs, and duplicate IDs.

## Ranking

Resource score = priority × 12 + goal importance × 4 + focus bonus 12 + started bonus 6 + deadline bonus (6/14/20 within 30/7/3 days). Completed and archived resources are excluded. Only the next unfinished lesson from each resource is eligible. Pinning an eligible lesson adds 1,000. Each further lesson from the same resource gets a 30-point variety penalty. Whole lessons must fit the remaining time. The plan is recomputed as progress or priorities change.

Learning time is the estimated duration of lessons marked complete, grouped by the selected timezone. The timer is a focus aid; it does not independently create activity. Undoing completion removes its logged time.

## Importing

A syllabus uses one lesson per line:

```
Introduction | 10 min
Components | 18 min | https://example.com/lesson | done
```

JSON resource shape:

```json
{
  "title": "My course",
  "provider": "Udemy",
  "kind": "course",
  "lessons": [
    {"title": "Introduction", "minutes": 10, "done": true},
    {"title": "First project", "minutes": 25, "done": false}
  ]
}
```

Imports preserve prior completion without fabricating study timestamps. Full exported backups go through Settings → Restore a backup. Restore replaces the complete library after confirmation.

Paid platform login/progress synchronization, full YouTube playlist extraction, video downloading, and PDF extraction are not included. The dashboard never claims to have read protected course content.

## Optional AI

No API key is required for the dashboard. To connect AI, enable the OpenAI Developers plugin in Codex and configure `OPENAI_API_KEY` as a Sites server secret using its supported key workflow. `OPENAI_MODEL` optionally selects a compatible Responses API model; the default is `gpt-4.1-mini`. Redeploy after changing runtime environment values. Do not put keys in browser storage, Git, or the hosting manifest.

The server calls the [Responses API with Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), sets `store: false`, limits inputs and outputs, validates returned suggestions, and sends only goal/settings/resource summaries for coaching. Course syllabus text is sent only when requesting AI import. Notes and API keys are not exposed to the client. AI errors preserve the library. Priorities are applied only after reviewing the response.

## Publishing

The exact Site identity is tracked in `.openai/hosting.json`. Use the Sites skill source-workflow helper to push and package, then save/deploy that exact pushed commit with the owner-private operation. Migrations are applied by Sites during deployment. Preserve private access.
