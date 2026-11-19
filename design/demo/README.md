# README demo (stageshow)

`learning-space-demo.gif` is the animated demo at the top of the repo README: share a post → **Save to read** → it lands in Library → tick → **Marked as read.** Built with the stageshow skill (`.agents/skills/stageshow`), following DESIGN.md.

## Re-render

1. Copy `scene.tsx` → `.agents/skills/stageshow/examples/learning-space/index.tsx` and `learning-space.css` beside it.
2. Copy `record.html` and `record.tsx` into `.agents/skills/stageshow/playground/`.
3. In `.agents/skills/stageshow`: `npm install`, then `npx vite playground --config playground/vite.config.ts --port 5190`.
4. Check it: `node scripts/film.mjs "http://127.0.0.1:5190/?capture=learning-space" --out shots/loop.png --every 700 --count 18 --gate` must end `rehearsal passed`.
5. Record frame-exact (virtual clock, 25 fps, 2x): `node record-frames.cjs ./frames 11 25`. One loop is 219 frames (8.76 s).
6. Encode the first 219 frames:
   `ffmpeg -framerate 25 -i frames/f%04d.png -frames:v 219 -vf "scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" -loop 0 learning-space-demo.gif`
