Below is **`mvp‑v2.md`** – a drop‑in replacement for your original build guide.
It preserves the nine vertical slices but **enriches design‑quality requirements**, adds an **edit‑overlay workflow (Phase 7b)**, expands the **Thinking‑Agent schema**, and relaxes perf gates to favour polished, conversion‑ready landing pages.

---

## Overview — what changed & why

Modern landing pages convert best when they surface **five elements** – USP, hero, benefits, social proof, CTA – in a visually engaging hierarchy ([unbounce.com][1], [cxl.com][2]). Users judge that visual appeal in the first **50 ms** ([tandfonline.com][3]).
To hit those benchmarks we now:

* Extend the **Thinking‑Agent** to output richer marketing primitives (`hero_visual`, `social_proof`, `faq_entries`, `primary_cta`).
* Instruct the **Builder‑Agent** to favour visual polish over byte budget (one Google Font allowed, inline SVG icons, Unsplash hero images).
* Introduce an **Edit‑Agent workflow** so humans can refine any element in‑place, mirroring WebSim’s right‑click flow ([htmx.org][4], [github.com][5]).
* Relax Lighthouse Perf pass mark to **≥ 70** while keeping CLS low via `font‑display:swap` ([developers.google.com][6], [web.dev][7]).

---

## Phase‑by‑Phase Instructions

### Phase 0 – Repo / Runtime skeleton (unchanged)

> *Validation:* `turbo run lint test build` passes.

---

### Phase 1 – Domain input + email gate (unchanged)

---

### Phase 2 – **Thinking‑Agent v2**

1. **Prompt delta**
   *Add the following fields to each UI theme:*

   | new key                   | reason                            |
   | ------------------------- | --------------------------------- |
   | `hero_visual`             | precise art direction for Builder |
   | `social_proof` (2 quotes) | ready‑made testimonials           |
   | `faq_entries` (2 × Q/A)   | consistent FAQ section            |
   | `primary_cta`             | exact CTA copy                    |

2. **Schema change** – update the JSON validator.

3. **Output** still limited to **top 3 domains** / **3 ideas** / **3 themes** each.

> *Validation:* `ajv` schema passes; hero\_visual not empty.

---

### Phase 3 – **Builder‑Agent upgrade**

1. **Prompt tweaks**

   ```diff
   + 1. Conversion‑first design
   +    • Render USP headline, hero section, benefits grid, testimonial block, FAQ accordion, single CTA.
   +    • Use theme.hero_visual for hero background (Unsplash API, lazy‑loaded).
   + 5. Design > byte‑budget
   +    • You may import one Google Font with font‑display:swap.
   +    • Inline SVG icons; no raster sprites.
   ```
2. **Assets**

   * Use `https://source.unsplash.com/random/1600x900?{keyword}` per hero ([unsplash.com][8]).
   * Google Font preconnect + swap to keep CLS < 0.1 ([developers.google.com][6], [web.dev][7]).

> *Visual QA checklist*
>
> * hero covers ≥ 60 % vh @ 1440 px,
> * USP ≤ 12 words,
> * CTA equals primary\_cta,
> * Testimonials render with avatar SVG circles.

---

### Phase 4 – Static delivery (minor tweak)

Pre‑cache only above‑the‑fold resources; lazy‑load the rest to balance FCP ([css-tricks.com][9], [web.dev][10]).

---

### Phase 5 – Preview dashboard (add design badge)

Add Lighthouse badge & “Design QA” badge (manual pass/fail).

---

### Phase 6 – Perf & PWA gate

| Metric | Pass now                                                       |
| ------ | -------------------------------------------------------------- |
| Perf   | ≥ 70 (Lighthouse) ([web.dev][10], [developers.google.com][11]) |
| CLS    | < 0.1 (font‑display swap)                                      |
| PWA    | Installable, offline hero                                      |

---

### Phase 7 – Notification email (unchanged)

---

### **Phase 7b – Edit‑Agent (new)**

| File                         | Purpose                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------- |
| `components/EditOverlay.tsx` | wraps hovered element; sends `/api/edit-snippet`                                  |
| `pages/api/edit-snippet.ts`  | queues edit job `{prototypeId,path,html,instruction}`                             |
| `apps/worker/editAgent.ts`   | Sonnet 4 Max prompt:<br>`SYSTEM: "Return only revised HTML"` → writes new version |
| `packages/history`           | diff saved via **diff‑match‑patch** ([github.com][5], [github.com][12])           |

HTMX’s `hx-swap-oob` lets you hot‑swap updated fragments without reload ([htmx.org][13], [htmx.org][4]).

> *Validation:* right‑click “Make background blue” → snippet updates, new version in DB.

---

### Phase 8 – Paywall (unchanged)

Locked prototypes respect new edit versions.

---

### Phase 9 – CI/CD

* **Percy** snapshot added for visual regression on every PR ([unsplash.com][14]).
* Lighthouse run continues but threshold lowered.

---

## New JSON snippets

### Thinking‑Agent output (excerpt)

```json
{
  "theme": {
    "name": "Neural Network",
    "colors": ["#0A0F1C", "#00F5FF", "#FF00A0"],
    "fonts": "Monospace body, geometric sans headers",
    "tone": "Technical yet accessible",
    "layout": "Animated neural network hero",
    "hero_visual": "Wide Jeep trail shot with neon overlay mesh",
    "social_proof": [
      "“FeetOnJeep tripled my print sales in a month.” – Alex M.",
      "“Finally a platform just for off‑road shooters!” – Dana P."
    ],
    "faq_entries": [
      { "q": "Is FeetOnJeep free?", "a": "Yes, we take a 5% commission only on sales." },
      { "q": "Can I map private trails?", "a": "Absolutely—maps are share‑scope controlled." }
    ],
    "primary_cta": "Start Sharing Today"
  }
}
```

### Builder‑Agent output (bundle skeleton)

```json
{
  "files": {
    "/index.html": "<!doctype html>…",
    "/assets/style.css": "body{--clr-primary:#00F5FF}…",
    "/assets/app.js": "import('/sw.js');…",
    "/sw.js": "self.addEventListener('install',…)"
  }
}
```

---

### Migration checklist

1. Update `packages/schema` for new fields.
2. Regenerate AJV types.
3. Revise Builder prompt & unit snapshot.
4. Implement edit overlay & queue (Phase 7b).
5. Tighten Phase 6 thresholds.
6. Smoke‑test: **Input 3 domains → get 3 quality landing pages with testimonials & FAQ; hero image lazy‑loads; right‑click edit works.**

Copy the full content above into **`mvp‑v2.md`** in your repo root and feed each slice to **Sonnet 4 Max** in order.

[1]: https://unbounce.com/landing-pages/elements-of-a-winning-landing-page/?utm_source=chatgpt.com "The 5 Essential Elements of a Winning Landing Page - Unbounce"
[2]: https://cxl.com/blog/how-to-build-a-high-converting-landing-page/?utm_source=chatgpt.com "Anatomy of a High Converting Landing Page: 5 Steps to Design One"
[3]: https://www.tandfonline.com/doi/abs/10.1080/01449290500330448?utm_source=chatgpt.com "You have 50 milliseconds to make a good first impression!"
[4]: https://htmx.org/attributes/hx-swap-oob/?utm_source=chatgpt.com "</> htmx ~ hx-swap-oob Attribute"
[5]: https://github.com/google/diff-match-patch?utm_source=chatgpt.com "google/diff-match-patch - GitHub"
[6]: https://developers.google.com/web/updates/2016/02/font-display?utm_source=chatgpt.com "Controlling Font Performance with font-display | Blog"
[7]: https://web.dev/font-display/?utm_source=chatgpt.com "Ensure text remains visible during webfont load | Lighthouse"
[8]: https://unsplash.com/developers?utm_source=chatgpt.com "Unsplash Image API | Free HD Photo API"
[9]: https://css-tricks.com/easy-dark-mode-and-multiple-color-themes-in-react/?utm_source=chatgpt.com "Easy Dark Mode (and Multiple Color Themes!) in React - CSS-Tricks"
[10]: https://web.dev/lighthouse-total-blocking-time/?utm_source=chatgpt.com "Total Blocking Time | Lighthouse - Chrome for Developers"
[11]: https://developers.google.com/web/tools/lighthouse/audits/first-contentful-paint?utm_source=chatgpt.com "First Contentful Paint | Lighthouse - Chrome for Developers"
[12]: https://github.com/google/diff-match-patch/wiki/API?utm_source=chatgpt.com "API · google/diff-match-patch Wiki - GitHub"
[13]: https://htmx.org/docs/?utm_source=chatgpt.com "</> htmx ~ Documentation"
[14]: https://unsplash.com/documentation?utm_source=chatgpt.com "Unsplash API Documentation | Free HD Photo API"
