# AI‑Driven Domain‑to‑Prototype Platform

This monorepo turns a list of domains into fully‑clickable, pre‑cached website prototypes.

* **Thinking‑Agent** (Opus 4 / o3‑pro)  
  ‑ Scores domains and, for the top 3, invents **3 business ideas × 3 UI themes**.  
* **Builder‑Agent** (Sonnet 4 Max)  
  ‑ Expands **idea #1** of each top domain into **3 complete interactive sites** (HTML + CSS + JS + PWA).  
* **Worker** on Fly.io – runs the two agents and stores bundles in R2 / Supabase.  
* **Next.js Frontend** on Vercel (or Pages) – collects domains, shows progress, previews sites.  
* **Cloudflare Pages + Workers** – edge‑serves static bundles at lightning speed.  

See `/docs/phases` for incremental implementation slices. 