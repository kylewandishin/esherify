# Esherify — Spec

An interactive, in-browser tool that turns a Droste image into an MC Escher-style conformal spiral, with an educational 4-stage walkthrough that mirrors the 3blue1brown video *"What is the Droste effect? — and Escher's mathematician friend"* ([video](https://www.youtube.com/watch?v=ldxFjLJ3rVY)).

Portfolio goal: live demo on Vercel, polished README with hero GIF, math derivation, and exported MP4/GIF artifacts.

---

## 1. The Math (one page)

A Droste image has the property that scaling it by some factor `r > 1` and rotating it by some angle `θ` yields the same image. Define the **Droste period** as the complex number

```
α = ln(r) + i·θ
```

Treating image coordinates as complex numbers `z = x + i·y` (with origin at the chosen center), the transformation pipeline is:

1. **Log map**: `w = log(z)`
   Maps the annulus `r_in ≤ |z| ≤ r_out` to a horizontal strip in `w`-space.
   The Droste self-similarity becomes a horizontal translation of width `ln(r)`.

2. **Skew / twist**: `w' = w · (α / |α|²) · |α|` — equivalently, choose a complex multiplier `β` so that the strip is sheared. Pure Droste = no shear (β real). Escher twist = imaginary part introduced, so that one period of the unrolled spiral coincides with one tile of the original image.

   The classic Escher choice:
   ```
   β = α / (ln(r))      // so horizontal period → α direction
   ```
   This makes the spiral close up properly.

3. **Exp map**: `z' = exp(w')`, then sample the source image at `z'` (with mod-by-α wraparound in log space so the result tiles infinitely).

4. **Animation**: Translate `w` along the real axis by `t · ln(r)` for `t ∈ [0,1]` to produce a seamless zoom loop. Because of step 3's wraparound, `t=0` and `t=1` are pixel-identical.

All four steps run in a single fragment shader: each output pixel computes its `w'`, then samples the image once.

---

## 2. UX — The 4-Stage Guided Walkthrough

The app is a single page with a **stage stepper** at the top (1 → 2 → 3 → 4). Each stage is a full-bleed canvas + a slim caption panel.

### Stage 1 — Upload & Frame
- User drops/uploads an image (or picks a preset).
- Two draggable rectangles appear over the image:
  - **Outer box** (cyan): the full visible region of the Droste pattern.
  - **Inner box** (magenta): the smaller nested copy.
- Rectangles are axis-aligned, resizable from corners, draggable as a whole.
- A small badge shows the live **scale ratio r = outer_width / inner_width**.
- Caption: *"Mark the outer extent and the nested copy. Their ratio is the Droste scale `r`."*

### Stage 2 — Log Space (the "aha")
- The image transforms via `z → log(z)` in real time.
- The annulus between the two boxes becomes a horizontal strip.
- A **tiled preview** below shows the strip repeated horizontally → demonstrates the self-similarity becomes translation.
- Caption: *"The complex log unrolls a spiral into a strip. The Droste property — that the image repeats when scaled by `r` — becomes the strip tiling horizontally with period `ln(r)`."*

### Stage 3 — Twist (introducing α)
- The strip from Stage 2 is now interactive: a slider controls the **twist angle θ** from `0` (pure Droste) to the Escher value `arctan(2π / ln(r))` (or thereabouts — let the user dial it).
- As θ increases, the strip shears; preview re-tiles continuously.
- Caption: *"Multiplying `w` by a complex constant tilts the strip. When the tilt is just right, one tile aligns with the next — this is Escher's trick."*

### Stage 4 — Exponentiate & Loop
- `exp(w')` brings the sheared strip back to a 2D image: the curving Escher spiral.
- The result auto-plays a seamless zoom loop.
- Controls: play/pause, loop duration, **Export GIF**, **Export MP4**.
- Caption: *"`exp` undoes `log`, but the twist remains — the spiral now closes on itself, so zooming in cycles forever."*

### Persistent UI
- Top: stage stepper (clickable; user can revisit).
- Right edge: a 🛈 button revealing a math sidebar with the formulas above.
- Reset / new image button always available.

---

## 3. Tech Stack

| Layer | Choice |
|------|--------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| UI primitives | shadcn/ui (Button, Slider, Dialog, Card) |
| State | Zustand (light, no Redux ceremony) |
| Graphics | WebGL2 fragment shader (raw — no Three.js needed for 2D) |
| Box drag UI | Custom React + pointer events over an overlay canvas |
| GIF export | `gif.js` (worker-based) |
| MP4 export | `@ffmpeg/ffmpeg` (WASM) — record canvas frames, encode |
| Math | Inline; no library needed. Complex ops are 2 floats. |
| Runtime / pkg manager | **Bun** (use `bun` for install, scripts, and the test runner) |
| Deploy | Vercel (Bun build, Next.js standalone output) |
| Tests | Bun's built-in test runner (`bun test`) for the math utils; Playwright smoke test for the 4-stage flow |

---

## 4. File / Component Structure

```
esherify/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  # the whole experience (single page)
│   └── globals.css
├── components/
│   ├── StageStepper.tsx
│   ├── Stage1Frame.tsx           # upload + 2 boxes
│   ├── Stage2Log.tsx             # log-space + tiled strip
│   ├── Stage3Twist.tsx           # twist slider
│   ├── Stage4Loop.tsx            # animation + export
│   ├── BoxEditor.tsx             # draggable/resizable rect overlay
│   ├── ShaderCanvas.tsx          # WebGL2 wrapper, takes shader name + uniforms
│   ├── MathSidebar.tsx
│   └── PresetPicker.tsx
├── lib/
│   ├── complex.ts                # add/mul/log/exp for {re, im}
│   ├── droste.ts                 # boxes → (r, θ, center) → α
│   ├── store.ts                  # zustand: image, boxes, twist, stage
│   └── export/
│       ├── recordCanvas.ts       # captures N frames at fixed dt
│       ├── gifExport.ts          # gif.js wrapper
│       └── mp4Export.ts          # ffmpeg.wasm wrapper
├── shaders/
│   ├── stage1.frag               # passthrough w/ box overlay (overlay is DOM, not shader)
│   ├── stage2-log.frag           # z → log(z); also tiled strip variant
│   ├── stage3-twist.frag         # log + shear, drawn in strip space
│   └── stage4-escher.frag        # full pipeline + time uniform
├── presets/
│   ├── print-gallery.jpg
│   ├── droste-cocoa.jpg
│   └── morimura.jpg              # the Yasumasa Morimura self-portrait
├── public/
│   └── og-image.png              # hero GIF still for social previews
├── README.md
├── package.json
└── tsconfig.json
```

---

## 5. The Shader (stage 4, canonical)

GLSL pseudocode, single fragment shader, runs once per output pixel.

```glsl
#version 300 es
precision highp float;

uniform sampler2D u_image;     // the source droste image
uniform vec2  u_imageSize;     // px
uniform vec2  u_center;        // center of the droste spiral, in image px
uniform float u_lnR;           // ln(r) — real part of α
uniform float u_theta;         // θ     — imag part of α
uniform float u_time;          // [0, 1) for animation loop
uniform vec2  u_outputSize;    // canvas px

in  vec2 v_uv;
out vec4 outColor;

vec2 cmul(vec2 a, vec2 b) {
  return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}
vec2 cdiv(vec2 a, vec2 b) {
  float d = b.x*b.x + b.y*b.y;
  return vec2(a.x*b.x + a.y*b.y, a.y*b.x - a.x*b.y) / d;
}
vec2 clog(vec2 z) { return vec2(0.5*log(z.x*z.x + z.y*z.y), atan(z.y, z.x)); }
vec2 cexp(vec2 w) { return exp(w.x) * vec2(cos(w.y), sin(w.y)); }

void main() {
  // 1. output pixel → complex z, centered
  vec2 pix  = v_uv * u_outputSize;
  vec2 z    = pix - u_outputSize * 0.5;

  // 2. log
  vec2 w    = clog(z);

  // 3. animate by shifting in log domain
  w.x      += u_time * u_lnR;

  // 4. twist: choose β so that horizontal period maps to α direction
  //    β = (ln r + i θ) / ln r
  vec2 alpha = vec2(u_lnR, u_theta);
  vec2 beta  = cdiv(alpha, vec2(u_lnR, 0.0));
  w          = cmul(w, beta);

  // 5. wrap w.x into one period to keep things bounded (optional)
  //    w.x = mod(w.x, u_lnR);

  // 6. exponentiate
  vec2 zp   = cexp(w);

  // 7. sample image, with the center offset put back
  vec2 uv   = (zp + u_center) / u_imageSize;
  outColor  = texture(u_image, fract(uv));  // fract → tiling
}
```

Stages 2 and 3 are simplifications of this (stop at log, stop at twist).

---

## 6. Implementation Phases (Claude Code task list)

Each phase is independently mergeable.

### Phase 0 — Scaffold (½ day)
- Run the git + gh setup from **§7** first (init repo, first commit, push to GitHub, add CI workflow). Every subsequent phase is its own branch + PR.
- Verify Bun: `bun --version` (≥ 1.1). If missing: `curl -fsSL https://bun.sh/install | bash`.
- Scaffold:
  ```bash
  bun create next-app esherify --typescript --tailwind --app --no-eslint --use-bun
  cd esherify
  bun add zustand gif.js
  bun add @ffmpeg/ffmpeg @ffmpeg/util
  bunx shadcn@latest init       # then: bunx shadcn@latest add button slider dialog card
  ```
- Lockfile is `bun.lockb` — commit it.
- Set up `lib/complex.ts` with full unit tests using Bun's test runner (`import { describe, it, expect } from "bun:test"`). Run with `bun test`.
- Set up `ShaderCanvas.tsx` — a generic WebGL2 component that accepts a fragment shader source + uniform record + an `<img>` as texture. This is the foundation for stages 2–4.

### Phase 1 — Stage 1: Upload + Boxes (1 day)
- `BoxEditor.tsx`: two axis-aligned rects on an overlay `<canvas>`, draggable corners + body, snap to image bounds. Pointer events only (no third-party DnD lib).
- Default both boxes to sensible positions on image load.
- Compute and display `r`, center `(cx, cy)`, and θ in real time.
- Store all of this in Zustand.
- Preset picker with the three preset images (commit them under `presets/`).

### Phase 2 — Stage 2: Log Space (1 day)
- `stage2-log.frag`: applies `clog` to centered coords, outputs strip.
- Second `ShaderCanvas` below the main one renders the **tiled** strip (just samples `mod(uv.x, period)`).
- Animate a subtle horizontal scroll on the tiled strip to make the periodicity feel obvious.

### Phase 3 — Stage 3: Twist (½ day)
- Shared slider component for `θ` in `[0, π/2]`.
- `stage3-twist.frag` adds the `β` multiplication.
- "Snap to Escher value" button: sets `θ = atan2(2π, ln(r))` (i.e. the value that makes the spiral close).

### Phase 4 — Stage 4: Full Escher + Animation (1 day)
- `stage4-escher.frag` with the `u_time` uniform.
- `requestAnimationFrame` loop, configurable duration (default 4s).
- Play/pause control.

### Phase 5 — Export (1 day)
- **GIF**: `recordCanvas` samples 60–120 frames over one loop period, feeds them to `gif.js` worker, triggers download. Show a progress bar.
- **MP4**: same frame buffer, but pipe to `ffmpeg.wasm` with `-c:v libx264 -pix_fmt yuv420p`. Larger bundle, but worth it.
- Both export at user-selectable resolution (480, 720, 1080).

### Phase 6 — Math Sidebar + Polish (½ day)
- `MathSidebar.tsx`: collapsible right panel with the formulas (use KaTeX via `react-katex`).
- Per-stage captions in `<aside>` below the canvas.
- Keyboard nav: `←` / `→` between stages.
- Loading skeletons, error states (bad image, WebGL2 unsupported fallback message).

### Phase 7 — README + Deploy (½ day)
- README with: hero GIF (export one from the tool itself), 90-second math explainer, screenshots of each stage, link to the 3b1b video, local dev instructions, deploy URL.
- Deploy to Vercel.
- Add OG image so the link previews nicely on Twitter/LinkedIn.

**Total estimate: ~5–6 working days.**

---

## 7. Git & PR Workflow

The repo is the deliverable. Treat `main` as always-green and always-deployable. Every phase from §6 lives on its own branch and merges via PR through the `gh` CLI.

### One-time setup (during Phase 0, before any code)

```bash
# verify auth
gh auth status

# scaffold + first commit
cd esherify
git init -b main
git add . && git commit -m "chore: initial Next.js scaffold"

# create the GitHub repo and push
gh repo create esherify --public --source=. --remote=origin --push \
  --description "Interactive Droste → Escher conformal map with a 4-stage math walkthrough"
```

Add a minimal CI workflow at `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun test
      - run: bun run build
```

Optional but recommended — require CI to pass before merge:

```bash
gh api repos/{owner}/esherify/branches/main/protection \
  --method PUT \
  -F required_status_checks.strict=true \
  -F required_status_checks.contexts[]=build \
  -F enforce_admins=false \
  -F required_pull_request_reviews.required_approving_review_count=0 \
  -F restrictions= \
  -F allow_force_pushes=false \
  -F allow_deletions=false
```

### Per-phase loop

For each phase in §6, Claude Code follows this rhythm:

**1. Branch from clean main**

```bash
git switch main && git pull
git switch -c phase-N-shortname   # e.g. phase-2-log-space
```

**2. Commit liberally** within the phase. Use Conventional Commits:

- `feat:` user-visible feature
- `fix:` bug fix
- `chore:` scaffolding, deps, config
- `test:` tests only
- `docs:` README/spec changes
- `refactor:` no behavior change

**Commit at every major change**, not just at phase end. Suggested minimums per phase:

| Phase | Required commits (minimum) |
|-------|---------------------------|
| 0 Scaffold | `chore: scaffold next.js + tailwind with bun`, `chore(ci): add bun build+test workflow`, `feat(lib): complex number utils`, `test(lib): complex utils pass`, `feat(canvas): WebGL2 ShaderCanvas component` |
| 1 Frame | `feat(ui): box editor drag`, `feat(ui): box editor resize`, `feat(state): zustand store + α derivation`, `feat(presets): 3 preset images` |
| 2 Log | `feat(shader): log-space transform`, `feat(ui): tiled strip preview` |
| 3 Twist | `feat(shader): twist multiplier`, `feat(ui): twist slider + snap-to-Escher button` |
| 4 Loop | `feat(shader): time uniform + wraparound`, `feat(ui): play/pause + duration controls` |
| 5 Export | `feat(export): GIF via gif.js`, `feat(export): MP4 via ffmpeg.wasm`, `feat(ui): resolution picker + progress` |
| 6 Polish | `feat(ui): math sidebar with KaTeX`, `feat(a11y): keyboard nav between stages` |
| 7 Deploy | `docs: README with hero gif`, `chore: vercel deploy config` |

**3. Push and open the PR via gh**

```bash
git push -u origin phase-N-shortname

gh pr create \
  --base main \
  --title "Phase N: <short title>" \
  --body "$(cat <<'EOF'
## What
One-paragraph summary.

## Checklist (from SPEC.md §6)
- [x] item 1
- [x] item 2

## Screenshots / GIFs
<attach>

## Verification
- [x] `bun test` passes locally
- [x] `bun run build` passes locally
EOF
)"
```

Use `--draft` while a phase is in progress; mark ready when CI is green.

**4. Wait for CI, then squash-merge**

```bash
gh pr checks --watch
gh pr merge --squash --delete-branch
git switch main && git pull
```

**5. Tag the phase**

```bash
git tag -a v0.N.0 -m "Phase N: <title>"
git push --tags
```

### Rules of the road

- **Never push directly to `main`.** Always via PR, even for one-line fixes.
- **Squash-merge** so `main` has one commit per phase and a readable log.
- **If a phase reveals a bug in a prior phase**, open a separate `fix/<thing>` branch off `main` and merge it independently — don't sneak unrelated fixes into a feature PR.
- **Issues track gotchas.** Open a GitHub Issue per item in §8 *before* starting the relevant phase, and close it from the PR with `Closes #N` in the body.
- **If `main` ever breaks**, revert immediately rather than forward-fix:
  ```bash
  gh pr create --base main --head revert-phase-N --title "revert: Phase N"
  # or: gh release delete + git revert <sha> + push to a revert branch + PR
  ```
- **No `--force` pushes** on `main`. Feature branches before merging: fine.

### Authorship rules — STRICT

This is Kyle Wandishin's portfolio piece. Claude Code is a tool, not a contributor. **No fingerprints anywhere.** Every one of the following is forbidden:

- ❌ `Co-Authored-By: Claude <noreply@anthropic.com>` trailers on commits
- ❌ `🤖 Generated with [Claude Code](...)` footers on commits
- ❌ The strings *"Claude"*, *"Anthropic"*, *"AI"*, *"LLM"*, *"generated by"*, *"with the help of"*, *"AI-assisted"*, or any synonym in:
  - commit messages (subject or body)
  - PR titles or bodies
  - issue titles or bodies
  - release notes / CHANGELOG
  - code comments
  - README, docs, or any markdown
  - filenames or paths
  - HTML meta tags or OG descriptions
- ❌ "Built with Claude" / "Made with AI" badges in the README
- ❌ Any reference to this `SPEC.md`'s origin in committed files (the spec itself stays, but no "see SPEC.md, written with...")

Required behavior:

- ✅ Commit author and committer must be Kyle's git identity:
  ```bash
  git config user.name  "Kyle Wandishin"
  git config user.email "kyle@arterial.us"
  ```
  Run this in Phase 0 immediately after `git init` and verify with `git config --get user.email` before the first commit.
- ✅ Commit messages are written *as if Kyle wrote them*: terse, technical, no narrator voice, no "I implemented…" or "Claude added…" — use imperative mood ("add box editor drag handler", not "added" or "implemented by AI").
- ✅ PR descriptions are factual checklists per the template in §7, not prose about how the work was done.
- ✅ If Claude Code's tooling auto-inserts a trailer or footer, strip it before committing. Verify with `git log -1 --format=%B` after each commit.

If any of these slip in, the fix is to `git rebase -i` the offending commits and force-push the *feature branch* (never `main`) before opening the PR. If they reach `main`, the PR gets reverted and re-done on a fresh branch.

### Release at the end

After Phase 7, cut `v1.0.0` and attach a hero GIF/MP4 generated by the tool itself:

```bash
gh release create v1.0.0 \
  --title "Esherify v1.0 — interactive Escher conformal map" \
  --notes-file CHANGELOG.md \
  exports/hero.gif exports/demo.mp4
```

The release page becomes part of the portfolio surface — readable on GitHub without cloning.

---

## 8. Edge Cases & Gotchas to Hand to Claude Code Explicitly

These will save the implementing agent real time:

1. **The complex log branch cut.** `atan(y, x)` returns `(-π, π]`. When sampling the wrapped strip, do `mod(w.y, 2π)` before mapping back via `exp` — otherwise you'll see seams.
2. **Box → α conversion.** Inner and outer boxes share a center? Not necessarily. The center of the spiral is at the **fixed point** of the box-to-box affine map, not the centroid of either box. Compute as: solve `(P - c) = r · R(θ) · (Q - c)` for `c`, where `P`/`Q` are box centers. For axis-aligned boxes of the same aspect, this simplifies to a weighted average.
3. **Image aspect ratio.** Source images aren't square. Convert pixel coords to a square coord system before the math, then back. Keep the `u_imageSize` uniform separate from the canvas size.
4. **Tile sampling needs `fract()`**, not `mod()`. And the texture must be set to `gl.REPEAT` wrap, not `gl.CLAMP_TO_EDGE`.
5. **MP4 loop seamlessness.** Skip the last frame (`t < 1.0`, exclusive) so frame N+1 = frame 0 exactly. Same for GIF.
6. **WebGL2 fallback.** If unsupported, render a still computed in a Web Worker via canvas2d as a courtesy — but you can also just message "use a modern browser" and call it a day.
7. **License the Escher preset carefully.** "Print Gallery" is still under copyright (Escher died 1972; copyright in most jurisdictions runs through ~2042). Use a clearly transformative/educational thumbnail and credit M.C. Escher Foundation. Or substitute a Droste-style photograph you took yourself for the hero. *Flag this to Claude Code so it doesn't blindly ship the image.*

---

## 9. README Outline (for Claude Code to fill in)

```
# Esherify
> Turn any Droste image into an MC Escher spiral, right in your browser.

[hero.gif]

## What is this?
Two-paragraph plain-English explanation, link to the 3b1b video.

## The Math
Embedded KaTeX of the four-step pipeline, mirroring the in-app sidebar.

## Features
- 4-stage guided walkthrough
- Real-time WebGL2 rendering
- Export to GIF + MP4
- 3 preset images

## Try it
[Live demo →](https://esherify.vercel.app)

## Run locally
bun install && bun dev

## Stack
Next.js · TypeScript · WebGL2 · Tailwind · Zustand · ffmpeg.wasm

## Credits
- Inspired by 3blue1brown's video (link)
- Math originally due to Lenstra, de Smit, et al. (2003 Notices of the AMS paper)
```

---

## 10. Prompt to Hand to Claude Code

When you fire up Claude Code, point it at this spec and say:

> Read `SPEC.md` end-to-end. **Use Bun for everything** — `bun create`, `bun install`, `bun add`, `bun test`, `bun run build`, `bunx`. Never `npm`, `npx`, `pnpm`, or `yarn`. Commit `bun.lockb`; do not generate `package-lock.json` or `pnpm-lock.yaml`.
>
> Start with **Phase 0** in §6, following the git/gh workflow in §7 exactly: set the local git identity to `Kyle Wandishin <kyle@arterial.us>`, create the GitHub repo, add the CI workflow, then branch `phase-0-scaffold` for the scaffolding work and merge via `gh pr` when CI is green. Confirm the math utility tests pass before moving on to Phase 1. Use the file structure in §4. Ask me before installing any package not listed in §3.
>
> **Authorship: §7 "Authorship rules — STRICT" is non-negotiable.** Do not add `Co-Authored-By` trailers, "Generated with Claude Code" footers, or any mention of Claude / Anthropic / AI / LLM / "generated" in commits, PRs, issues, releases, comments, README, or any file in the repo. Strip any auto-inserted attribution before committing. Verify each commit message with `git log -1 --format=%B` after creating it.

Then iterate phase by phase, one PR per phase. Don't let it skip the math unit tests — they're cheap and the whole project lives or dies by `clog`/`cexp` correctness. Don't let it push to `main` directly. Don't let it sign anything.
