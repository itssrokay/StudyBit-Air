# Learning Space coach strategy

The coach should turn accumulated material into one realistic next step, then learn from recorded results. It should be candid about tradeoffs and missing evidence. Watching time and checking a lesson never prove understanding.

## What ships in 0.13

- A conversation surface with a dedicated composer, history, context inspector, and memory shelf.
- A shared, editable profile plus up to 40 explicit memories scoped to Personal, Work, or both. Local keyword retrieval selects up to 12 relevant memories; no embedding database or extra model call is needed.
- AI can propose up to three lasting memories. They remain proposals until the learner accepts them. Memory edits, forgetting, and chat deletion are separate, visible controls. Memories travel with library backups and Wi-Fi sync.
- Each chat chooses a learning space and up to eight inbox captures. Saving a dump never calls AI. Each selected capture supplies at most 1,500 characters. No URL fetch, book upload, hidden course access, or full-thread extraction is implied.
- Recent activity includes aggregate learning and up to eight recorded session summaries. The selected chat provides up to twelve recent messages. General resource notes and photos are excluded. A context inspector exposes the actual bounded payload.
- Responses use the existing OpenAI key and model setup, structured outputs, and `store:false`. The app owns memory and history. This does not claim zero retention of all API operational logs.
- Priority, module focus, and daily plans are validated against existing items. Proposed changes require Apply. Memory suggestions require a separate Remember action. Neither action invents study progress.
- Focus & Balance is derived from live learning records and optional local Android usage events. Only a totals-only summary can be attached to a coach draft. Sending remains an explicit user action. Usage access and attaching an AI summary are separate choices.

## Operating loop

1. Capture without pressure: save raw ideas or links locally.
2. Clarify intent: select relevant captures, a goal, and available time. Ask a question if the coach lacks a useful constraint.
3. Recommend one next action with a reason. Keep alternatives short. Preserve prerequisites and lesson order.
4. Review an actual session against the plan saved before it. Acknowledge a useful detour, challenge avoidance when evidence supports it, and ask about unrecorded learning.
5. End with one recall or application exercise. Offer a durable memory only when explicitly supported by the learner's words.

## Next product steps

- Offer reviewed inbox-to-todo and inbox-to-library proposals through the existing import preview, rather than letting a model fabricate course outlines.
- Add a weekly review based on actual saved activity, with separate consent for any new source or automatic timing.
- Measure recommendation acceptance, plan completion, repeat confusion, and learner-rated usefulness. Evaluate missing activity, mixed YouTube use, changing goals, malicious pasted text, deleted progress, and phone access denial.
- Add more agent tools only when they remove an observed friction. Keep a small typed action registry with validation and reviewed writes. Avoid an autonomous background agent or a vector database until the product needs one.

## Focus & Balance interpretation

70 points come from the selected space's regular daily learning target, 20 from the phone-wide user-selected leisure budget, and 10 from a saved session reflection. Leisure points are full within budget and decline linearly to zero at twice the budget. When usage is unavailable, learning and reflection are normalised over 80 points. No permission penalty, fabricated learning from foreground usage, or public sharing of app names.

Android foreground event estimates can differ from Samsung Digital Wellbeing, especially with missing events, split screen, picture-in-picture, or an incomplete retained window. The seven-day view is labelled as available estimates. There is no background collection service or synced raw usage history.
