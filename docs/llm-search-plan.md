# LLM-Powered Semantic Search — Plan & Rationale

_Draft — 2026-07-23. A thinking document, not a spec. Nothing here is built yet._

## TL;DR

The current search embeds each project offline and compares the visitor's
query against those vectors with cosine similarity, all in the browser. It
works for distinctive queries but plateaus on anything that needs *reasoning*
about what a project fundamentally **is**. The next step is to replace the
vector layer with a small **Cloudflare Worker that asks an LLM** to route the
query and write a short hint for each line it draws. At 7 projects this is
*simpler* than what we have, not more complex — the whole embedding / cosine /
threshold layer goes away.

## Background — why the current approach plateaued

The search uses `bge-small-en-v1.5` (a bi-encoder embedding model) to turn both
the query and each project into a vector, then ranks by cosine similarity.

The wall we hit: **embeddings match on topical vibe overlap, not on categorical
understanding.**

- "3d print" ≈ "3d mesh" ≈ "3d model" in vector space, so a query for "3d print"
  ranks the text-to-mesh tool (txt2mesh) above the actual 3D-printed sculpture
  (vision-of-the-hybrid). No amount of reword­ing fixes near-synonyms.
- "coding project" lights up *everything* that mentions Rust / Python / C++ /
  plugins — because code is *involved* in most projects. A bi-encoder cannot
  tell the difference between a project whose **core is software** (the Rust
  glitch device, the two plugins) and one that merely **used code** (the thesis
  that happens to use Python, the artwork made with 3D tools).
- A short query matches a document's overall **gestalt**, not the specific words
  in it. And the longest / most keyword-diverse document drifts toward the
  centre of the vector space and weakly matches *everything*.

We did squeeze real gains out of the embedding approach first (see "Work already
done" below) — after tuning, 11–12 of 14 test queries route correctly. But the
remaining failures are structural to the technique, and two things we now want
are simply outside what a bi-encoder can do:

1. **Categorical reasoning** — "show me the coding projects" = the ones that
   *are* software, not the ones where code appears.
2. **Generated hints on the lines** — a short, meaningful "why this matches"
   label per line, not a raw cosine number.

Both are generative-LLM features.

## The decision

Add a **generative LLM at query time**, running **serverless** (chosen over an
in-browser LLM, a facet/tag rules layer, or continuing to tune embeddings).

Rationale: the site is a static GitHub Pages deploy and media already lives on
Cloudflare R2, so a Cloudflare Worker is low-friction and keeps the page load
tiny. With only 7 projects we can hand the LLM **all** of them each query, so it
always "sees everything" and can reason about the whole set. This removes the
need for vectors entirely.

## Target architecture

```
Visitor types a query
   │
   ▼
js/search.js ── fetch POST ──▶ Cloudflare Worker
                                 ├─ loads a catalog of all 7 projects
                                 │  (id, title, one-line essence, category)
                                 ├─ asks an LLM to pick the genuinely relevant
                                 │  ones and reason categorically about intent
                                 └─ returns JSON: [{ id, relevance, label }]
   ◀──────────────────────────────┘
draw a line to each returned project,
labelled with the LLM's short hint
```

- **Site**: stays on GitHub Pages, unchanged deploy.
- **Worker**: separate Cloudflare deploy (`wrangler`), independent of Pages.
- **No secrets on the client.** The Worker is the only thing that talks to the LLM.

## Components to build

1. **`search-worker/`** (new folder in this repo)
   - `wrangler.toml` — Workers AI binding (`[ai]`), routes, name.
   - `src/index.js` — CORS locked to `joel.tenenberg.net`, `OPTIONS` preflight,
     query-length cap, edge-cache identical queries, one isolated `askLLM()`
     function so the model is trivial to swap.
   - Validates returned ids against the known catalog and drops any the model
     hallucinates.

2. **`npm run search-index`** (new small script)
   - Emits `search-index.json` (id + title + trimmed essence + category) from the
     existing project files, so there is still **one source of truth**. Adding a
     project stays a one-command refresh. The Worker fetches + caches this.
   - Can reuse the essence text we already wrote in each `embedding.md`.

3. **Rewire `js/search.js`**
   - `runQuery` becomes a `fetch` to the Worker.
   - Remove the transformers.js CDN import, the model download, `cosSim`, and the
     `ABS_FLOOR` / `REL_THRESH` thresholds.
   - Lines display the LLM's **hint label** instead of a cosine number.
   - Graceful "search unavailable" if the Worker is unreachable.

4. **Deploy (your steps)**
   - `wrangler dev` to test locally, then `wrangler deploy`.
   - Commit the client changes; GitHub Pages redeploys itself.
   - Once happy: delete `embeddings.json`, `scripts/generate-embeddings.js`,
     `scripts/test-search.js`, and drop the `@xenova/transformers` devDependency.

## Response contract (draft)

```jsonc
// POST /  { "query": "coding project" }
{
  "matches": [
    { "id": "handheld-pixelsorter", "relevance": 0.95, "label": "Rust glitch device" },
    { "id": "c4d2gs",               "relevance": 0.85, "label": "Cinema 4D plugin" },
    { "id": "txt2mesh",             "relevance": 0.85, "label": "C4D + Unreal plugins" }
  ]
}
```

- `id` — must be one of the 7 known project ids; Worker drops anything else.
- `relevance` — 0–1, drives line thickness (maps to the existing `norm`).
- `label` — ≤ 4 words, shown on the line. This is the "meaningful hint".
- Empty `matches` → client shows the existing no-results state (an honest
  "nothing here matches" is a valid answer).

## The LLM prompt (the crux)

This is where the behaviour we actually want gets encoded. Rough shape:

> You are the search brain for a design/engineering portfolio. Here are the 7
> projects with a short essence and a category for each: `<catalog>`. The
> visitor asked: `"<query>"`. Return ONLY the projects that are genuinely
> relevant to their intent — it is fine to return few, or none. Reason about
> what the query *means*, not just word overlap. For example, "a coding project"
> means the project's **core is software**, not merely that some code was used;
> the thesis uses Python but is research, not a coding project. Rank by
> relevance and give each a ≤4-word label saying why it fits. Respond as strict
> JSON: `{ "matches": [{ "id", "relevance", "label" }] }`.

Tuning this prompt (and the per-project `category` field) is the main ongoing
knob — replacing the old job of tuning embedding text + thresholds.

## Decisions (2026-07-23)

- **LLM = Cloudflare Workers AI**, run **fail-closed on the free tier** — chosen
  specifically to kill the runaway-cost fear. Past the daily free allocation it
  returns errors instead of billing, so it *cannot* run up a surprise bill. Model
  e.g. Llama 3.3 via `env.AI.run`. No extra API key, stays in the existing
  Cloudflare account, plenty smart for ranking 7 items + short labels.
  - _Alternative if hints ever feel flat:_ **Claude Haiku** (Anthropic API) for
    sharper reasoning/JSON — ~10 isolated lines of change, needs an
    `ANTHROPIC_API_KEY` secret, and should be paired with a monthly spend cap on
    the key (e.g. $5) so it also fails closed. ~a fraction of a cent per query.
- **Worker URL = free `*.workers.dev`** to start (zero DNS). Can move to
  `search.tenenberg.net` later.
- **In-browser LLM was considered and set aside** — the only zero-endpoint,
  zero-cost option, but the ~0.5–1 GB first load + WebGPU-only requirement aren't
  worth it once the endpoint is properly capped (see below).

## Abuse & cost controls (fail-closed by design)

The whole point: someone spamming the endpoint should top out at *mildly
annoying*, never *expensive*. Layered so the flood is stopped for free long
before it reaches the model, and the absolute ceiling is a number we choose.

1. **Fail-closed ceiling.** Workers AI free tier returns errors past its daily
   allocation instead of billing — no paid overage opted in. Max spend ≈ $0.
   (If we ever switch to Haiku: a dedicated key in a workspace with a monthly
   spend cap, e.g. $5, so it also just stops.)
2. **Edge rate limiting.** A Cloudflare rate-limit rule / Workers rate-limit
   binding caps requests per IP per minute at the edge — blocked requests never
   run the Worker or the LLM, so they cost nothing.
3. **Cache identical queries** (normalised: lowercased/trimmed) for ~24h via the
   Cache API / KV. Repeat-spam of the same query hits cache after the first call.
4. **Global daily counter** (KV or Durable Object): cap total LLM calls/day
   (e.g. 500–1,000). A hard ceiling even against a distributed botnet — worst
   case ≈ $1–2/day *if* every other layer failed and we were on a paid plan.
5. **Input hardening / no free-LLM abuse.** Cap query length (~200 chars). The
   user's text is inserted as *data to classify*, never as instructions, and the
   Worker only returns JSON validated against the 7 known project ids — anything
   else is discarded, so it is useless as a stolen general-purpose LLM.
6. **In reserve:** Cloudflare Turnstile (invisible for most visitors) if it ever
   actually gets targeted. Not needed at launch.

**Latency note:** an LLM call is ~0.5–2s vs instant cosine — show a loading
state on submit, draw the lines on response.

## What the LLM route lets us delete

- `embeddings.json`
- `scripts/generate-embeddings.js`, `scripts/test-search.js`
- the in-browser `@xenova/transformers` model download (~35 MB)
- the cosine + threshold logic in `search.js`

Net: the search gets *smarter* and the client gets *lighter*.

## Work already done (context for later)

Before deciding to go the LLM route, we improved the embedding approach — this
is still live and is a fine fallback if the LLM plan is shelved:

- **Rewrote all 7 `embedding.md` files** from actually viewing the images/models.
  Each now carries three layers in natural prose — topical, visual (what it
  looks like), and meta ("who made this" → about). Removed the old
  keyword-stuffing repetition and negations, which actively hurt mean-pooled
  vectors.
- **Fixed the BGE query prefix.** `bge` is asymmetric: queries need
  `"Represent this sentence for searching relevant passages: "`; passages do not.
  This was missing and was the main cause of the original "everything scores
  ~0.5" complaint. Applied in `js/search.js` and `scripts/test-search.js`.
- **Swapped `bge-base-en-v1.5` → `bge-small-en-v1.5`** (~⅓ the download, same
  behaviour at this scale) in the generate / search / test scripts.
- **Test snapshot (14 queries):** most route correctly and with a clear gap —
  gaussian splatting, text to 3d, handheld device, running dog, AI video, master
  thesis, glitch art, author, contact all land on the right project. The stubborn
  failure is **"3d print" → txt2mesh** (the near-synonym problem above), which is
  exactly why we're moving to an LLM.

> Note: these embedding changes are currently uncommitted in the working tree.
> Decide whether to commit them as a fallback or revert once the LLM search
> lands.

## Open questions to ideate on

- **Hints on the line**: ≤4-word label baked into the stroke (current line style)?
  Or a longer reason on hover/tooltip? Or both — short on the line, sentence on hover?
- **Zero-match UX**: lean into a confident "nothing here matches" vs. always
  showing a best guess.
- **Follow-up / conversation**: should the input support a second, refining
  query ("more like the physical one")? The LLM makes this cheap.
- **Personality**: the hints could have a voice (dry, curatorial, playful) — it's
  a portfolio, the tone is part of the work.
- **Keep the keyword autocomplete?** It's independent of this and still useful.
- **Workers AI vs Haiku**: start on Workers AI; revisit if hint quality or
  reasoning feels flat.
- **Move the Worker to a custom subdomain** once the shape is settled.
