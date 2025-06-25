Below is a copy‑ready “docs package”.
Paste each section into a file with the indicated path inside your repo.
Nothing from our earlier discussion has been removed; all prompts, model choices, folder names, validation steps, and code snippets are included verbatim.

⸻

File: docs/README.md

# AI‑Driven Domain‑to‑Prototype Platform

This monorepo turns a list of domains into fully‑clickable, pre‑cached website prototypes.

* **Thinking‑Agent** (Opus 4 / o3‑pro)  
  ‑ Scores domains and, for the top 3, invents **3 business ideas × 3 UI themes**.  
* **Builder‑Agent** (Sonnet 4 Max)  
  ‑ Expands **idea #1** of each top domain into **3 complete interactive sites** (HTML + CSS + JS + PWA).  
* **Worker** on Fly.io – runs the two agents and stores bundles in R2 / Supabase.  
* **Next.js Frontend** on Vercel (or Pages) – collects domains, shows progress, previews sites.  
* **Cloudflare Pages + Workers** – edge‑serves static bundles at lightning speed.  

See `/docs/phases` for incremental implementation slices.


⸻

File: docs/prompts/thinking_agent_prompt.md

## Thinking‑Agent Prompt  (Opus 4 / o3‑pro · Responses API)

> **System**

You are DomainStrategist v2 – an AI consultant who analyses domains and designs startup ideas.
Return only valid JSON; no commentary, no Markdown.
You may call the tool {“function”:“web.search”,“args”:{“query”:””}} up to 3 times per domain to gather live context.

> **User**  
*(prepend the user’s raw list of 3–10 domains, one per line)*

domains:
thinkingobjects.ai
startclosein.com
interactiveobjects.ai
…

> **Additional instructions**

############################
TASK
	1.	For every domain:
1.1  Use web.search to collect SERP info.
1.2  Assign “seo_score” (0‑10) and “brand_score” (0‑10).
	2.	Select the top 3 domains (highest combined potential).
	3.	For each selected domain, create 3 fundamentally different startup ideas.
Each idea must include:
• idea_rank  (1 = strongest)
• idea_name
• target_persona
• value_prop
• monetization
• gtm
• core_features [exactly 3]
• themes [3 objects]  { name, colors [2‑4 hex], fonts, tone, layout }
	4.	Output exactly:
{
“domains”:[{…}],
“top_domains”:[””,””,””]
}
	5.	Non‑top domains: supply only domain + scores (omit ideas[]).
	6.	JSON only, no stray text. Valid hex colors. Exactly 3 ideas and 3 themes per idea.
############################




⸻

File: docs/prompts/builder_agent_prompt.md

## Builder‑Agent Prompt  (Sonnet 4 Max · Responses API)

Send **one** `themeSpec` at a time.

```jsonc
{
  "system": "You are SiteBuilder v1. Convert structured specifications into fully working static websites ready for instant preview. Output a single JSON bundle exactly matching the schema. Never include commentary, Markdown, or extra keys.",
  "user": {
    "themeSpec": {
      "domain": "thinkingobjects.ai",
      "target_persona": "AI developers...",
      "value_prop": "Simplifies the development of AI-powered smart objects...",
      "startup_concept": "A platform enabling developers to create intelligent, self-learning objects...",
      "core_features": [
        "Visual object AI builder...",
        "Pre‑trained behavior models...",
        "Real‑time learning engine"
      ],
      "theme": {
        "name": "Neural Network",
        "colors": ["#0A0F1C", "#00F5FF", "#FF00A0"],
        "fonts": "Monospace body, geometric sans headers",
        "tone": "Technical yet accessible",
        "layout": "Animated neural‑network hero..."
      }
    }
  },
  "tool_choice": "none",
  "instructions": "## Deliverables\nReturn JSON:\n{\n  \"files\": {\n    \"/index.html\": \"...\",\n    \"/signup.html\": \"...\",\n    \"/onboarding.html\": \"...\",\n    \"/dashboard.html\": \"...\",\n    \"/assets/style.css\": \"...\",\n    \"/assets/app.js\": \"...\",\n    \"/sw.js\": \"...\"\n  }\n}\n\n### Hard requirements\n1. Use theme colors, fonts, tone.\n2. Complete copy – persuasive marketing text.\n3. Interactive feel – working nav, form validate ➜ /onboarding.html, carousel, dashboard toast.\n4. Precache offline via sw.js (<200 KB bundle).\n5. No external assets – embed SVGs, gradients.\n6. Accessibility semantics + ARIA.\n7. Exactly the listed file keys.\n\nBegin."
}

---

### File: **docs/phases/phase0_setup.md**

```markdown
# Phase 0 – Initial Monorepo Setup

repo/
├─ apps/
│  ├─ web/        # Next.js frontend
│  └─ worker/     # Fly.io long‑running job runner
├─ packages/
│  ├─ llm/        # OpenAI & Anthropic helpers (Responses API)
│  ├─ db/         # Supabase client wrapper
│  └─ utils/      # misc shared code
├─ infra/
│  ├─ fly/        # fly.toml & Dockerfile
│  └─ cf/         # Cloudflare Pages + Worker
└─ docs/          # ← you are here

1. `pnpm init -w && pnpm add -w typescript turbo eslint prettier`.
2. `turbo.json` pipelines: `lint`, `test`, `build`.
3. Vite or Next.js bootstrap inside `apps/web`.  
4. Verify `turbo run build` runs clean.

**Validation**  
`curl localhost:3000/hello` returns “Hello world”.


⸻

File: docs/phases/phase1_domain_input_email_gate.md

# Phase 1 – Domain Input & Email Gate

## Frontend
* `components/DomainUploader.tsx`
  * `<textarea>` for up to 10 domain strings.
  * `file` field for screenshot (future OCR).
  * Client‑side regex: `/^[a-z0-9.-]+\.[a-z]{2,}$/i`.

* `components/EmailGate.tsx`
  * Renders when `!user.email_confirmed`.
  * Uses Supabase Auth magic‑link.

## API
* `pages/api/start-job.ts`
  ```ts
  export default async function handler(req, res) {
    const { domains } = req.body;
    const { data: job } = await supabase.from('jobs')
      .insert({ user_id: req.user.id, domains, status: 'pending' })
      .select()
      .single();
    res.status(200).json({ jobId: job.id });
  }

DB

create table jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  domains text[] not null,
  status text default 'pending',
  email_sent boolean default false,
  created_at timestamptz default now()
);

Validation
	1.	Enter 5 domains + email → row appears in jobs.
	2.	Redirect to /job/[id] (status page).

---

### File: **docs/phases/phase2_thinking_worker.md**

```markdown
# Phase 2 – Thinking‑Agent Worker

## packages/llm/openai.ts
* Streaming wrapper for `/v1/responses`.
* Parses `text_event` chunks.

## apps/worker/src/index.ts
```ts
import { runThinkingAgent } from './thinkingAgent';
while (true) {
  const job = await nextPendingJob();
  if (!job) { await sleep(5000); continue; }
  await runThinkingAgent(job);
}

apps/worker/src/thinkingAgent.ts
	1.	Build prompt from docs/prompts/thinking_agent_prompt.md.
	2.	Call Opus 4 (Anthropic) or o3‑pro (OpenAI) via helper.
	3.	Write JSON to analysis table:

create table analysis (
  job_id uuid primary key references jobs,
  spec jsonb not null,
  created_at timestamptz default now()
);

	4.	Update jobs.status = 'analysis_complete'.

Validation
	•	Run worker locally with DEBUG domains → one analysis row; JSON passes AJV schema schema/analysis.json.

---

### File: **docs/phases/phase3_builder_agent_slice.md**

```markdown
# Phase 3 – Builder‑Agent Slice (one prototype)

## packages/llm/builderAgent.ts
* `generatePrototype(themeSpec): Promise<Bundle>`
  ```ts
  export async function generatePrototype(spec) {
    const stream = anthropicClient.responses.stream({ model: "claude-sonnet-4", messages: [ ...prompt(spec) ]});
    return assembleBundle(stream);
  }

apps/worker/src/generateBundles.ts
	1.	Select first idea (idea_rank = 1) of each top domain.
	2.	Loop its 3 themes → call generatePrototype.
	3.	Store bundle in R2 under key /bundles/{jobId}/{prototypeId}/{themeName}.json.

Validation
	•	Inspect /tmp/bundle/index.html in browser – nav works offline.
	•	Bundle size < 200 KB.

---

### File: **docs/phases/phase4_static_delivery.md**

```markdown
# Phase 4 – Static Delivery via Cloudflare

## R2 bucket
* Name: `prototype-bundles`

## Cloudflare Worker (infra/cf/worker.ts)
```ts
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/site/")) {
      const key = url.pathname.replace("/site/", "");
      const obj = await env.BUNDLES.get(key, { cacheTtl: 31536000 });
      if (!obj) return new Response("404", { status: 404 });
      return new Response(obj.body, {
        headers: { "Content-Type": "text/html", "Cache-Control": "public, max-age=31536000, immutable" }
      });
    }
    return new Response("Bad route", { status: 404 });
  }
}

Validation

curl -I https://edge.example.com/site/job123/themeA/index.html
→ 200, cache-control: immutable, TTFB < 200 ms.

---

### File: **docs/phases/phase5_preview_dashboard.md**

```markdown
# Phase 5 – Preview Dashboard

* `app/(dashboard)/job/[id]/page.tsx`
  * Supabase realtime on `analysis` + `jobs`.
  * Shows `<PrototypeCard>` with iFrame thumbnail:
    ```tsx
    <iframe
      src={`https://edge.example.com/site/${bundleKey}/index.html`}
      sandbox="allow-scripts allow-same-origin"
    />
    ```
* Paywall overlay if not entitled.

### Validation
1. Status spinner until `jobs.status = 'bundles_ready'`.
2. Click thumbnail → full-screen preview loads instantly.


⸻

File: docs/phases/phase6_perf_sw.md

# Phase 6 – PWA & Performance

* Builder bundles already include `sw.js`.
* Add workbox‑inject to append file list:
  ```js
  self.__WB_MANIFEST = [ '/', '/signup.html', '/onboarding.html', '/dashboard.html',
                         '/assets/style.css', '/assets/app.js' ];

	•	Lighthouse CI (packages/ci/lh.config.js) fails if Perf < 90.

Validation

lhci autorun --url https://edge.example.com/site/.../index.html

---

### File: **docs/phases/phase7_email_notify.md**

```markdown
# Phase 7 – Email Notification

* Supabase Edge Function `notify_user.ts`
  ```ts
  export const onAnalysisComplete = supabaseFunctions
    .onRowUpdate('jobs', r => r.status.eq('bundles_ready'))
    .invoke(async ({ new: job }) => {
       if (job.email_sent) return;
       await postmark.sendEmailWithTemplate({ TemplateId, To: job.user_email, TemplateModel: {...} });
       await supabase.from('jobs').update({ email_sent: true }).eq('id', job.id);
    });

Validation
	•	Insert jobs row with bundles_ready; email arrives; flag flips.

---

### File: **docs/phases/phase8_paywall.md**

```markdown
# Phase 8 – Paywall

* `packages/paywall/useEntitlement.ts`
  ```ts
  export function useEntitlement(protoId) {
    const { data } = useSWR(`/api/entitlement?pid=${protoId}`);
    return data?.unlocked;
  }

	•	/api/stripe-webhook marks user_prototypes(unlocked=true).

Validation
	1.	Preview second prototype (locked) → overlay.
	2.	Stripe test checkout → overlay disappears.

---

### File: **docs/phases/phase9_ci_cd.md**

```markdown
# Phase 9 – CI / CD / Observability

* **.github/workflows/ci.yml**
  * Jobs: lint → unit → build → lhci → cypress.
* **Deploy steps**
  ```yaml
  - name: Deploy worker
    run: fly deploy --remote-only --app $FLY_APP --config infra/fly/fly.toml
  - name: Deploy CF Pages
    run: wrangler pages deploy ./bundles --project-name=$CF_PAGES

	•	Grafana dashboard pulling:
	•	Fly queue depth
	•	R2 egress
	•	Cloudflare Worker sub‑requests

Validation
	•	PR → all checks green; staging URL comment.

---

### File: **docs/.env.example**

```dotenv
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_KEY=...
ANTHROPIC_KEY=...
DUCKDUCKGO_SCRAPER_URL=https://ddg.example.com
FLY_API_TOKEN=...
POSTMARK_KEY=...
CF_ACCOUNT_ID=...
CF_R2_ACCESS_KEY_ID=...
CF_R2_SECRET_ACCESS_KEY=...
STRIPE_SECRET=...


⸻

How to use with Cursor / Sonnet 4 Max

	1.	Create the directory skeleton above.
	2.	Paste one file at a time into Cursor; ask Sonnet 4 Max to “scaffold the code referenced in this doc”.
	3.	Run the validation checklist at the bottom of each phase doc.
	4.	Commit green slice before moving on.

Everything—prompts, model routing, APIs, code snippets, env vars, validation steps—is now captured in modular markdown files ready to drop into your repo.