# HuntOrbit — Final Build Spec & Operations Reference

**Status:** Live in production at `https://huntorbit.com` — launch week complete, all known issues resolved as of this revision.
**Purpose of this document:** This is the single source of truth for how HuntOrbit is built, hosted, and operated. It is written to be understood without any prior conversation history — a new developer, or a future version of an AI assistant, should be able to read this document alone and fully understand, maintain, extend, or debug the site. For the daily article-writing workflow specifically, see `Daily_Publishing_Guide.md` instead.

---

## 1. What this site is

HuntOrbit is a SaaS product review blog — hands-on reviews with star ratings, published as flat Markdown files. There is no database, no backend, no user accounts, and no forms anywhere on the site. Content is written as Markdown, pushed to a GitHub repository, and built into static HTML by GitHub Pages' native Jekyll pipeline.

---

## 2. Full technology & hosting stack

| Layer | What's used | Notes |
|---|---|---|
| Static site generator | Jekyll (via GitHub Pages' native "Deploy from a branch" build) | No local Ruby/Jekyll/gem install required or used. All authoring is done by hand-editing files and pushing. |
| Hosting | GitHub Pages | Repo: `github.com/jiten14/huntorbit` |
| DNS + CDN + caching | Cloudflare (free plan) | Nameservers point from the registrar to Cloudflare. Cloudflare proxies all traffic (orange-cloud/proxied, not "DNS only"). |
| Domain registrar | GoDaddy | Domain purchased there; nameservers delegated to Cloudflare. |
| SSL/HTTPS | Provided by Cloudflare at the edge | GitHub's own "Enforce HTTPS" toggle may show as unavailable/unchecked in GitHub Pages settings — this is expected and harmless, since Cloudflare terminates SSL before traffic ever reaches GitHub. Do not treat this as a bug. |
| Email | Zoho Mail (free plan, web-only access) | `connect@huntorbit.com`. Free tier has no IMAP/POP — webmail only (mail.zoho.com). |
| Analytics | Google Analytics (GA4) | gtag snippet added directly in `_includes/head.html`. |
| Search Console | Verified and sitemap submitted | Verification method and exact tag: check `_includes/head.html` for the verification meta tag if present, or check Search Console's own record of verification method used. |
| Automated scheduling | GitHub Actions (one workflow) | See Section 9. |

---

## 3. DNS / Cloudflare configuration (as set up)

- **Nameservers:** Domain's nameservers at GoDaddy point to Cloudflare's assigned nameservers (not GoDaddy's own DNS).
- **A records** (apex domain `huntorbit.com`, proxied/orange-cloud): 4 records pointing to GitHub Pages' IPs:
  ```
  185.199.108.153
  185.199.109.153
  185.199.110.153
  185.199.111.153
  ```
- **Why A records and not a CNAME at the root:** standard DNS does not allow a CNAME record to coexist with the required NS/SOA records at a zone's apex (root domain). A CNAME only works for a subdomain (e.g. `docs.huntorbit.com`), never for `huntorbit.com` itself. GoDaddy's "CNAME with value @" option is domain *forwarding* (a redirect), not a real apex CNAME, and is not what's used here.
- **Proxy status:** Proxy (orange cloud) is ON for the A records — this is required for Cloudflare's caching and security features to apply. Setting it to "DNS only" (grey cloud) would bypass Cloudflare entirely and restore GitHub Pages' original ~10-minute fixed cache TTL problem.
- **Cache Rule** (Rules → Cache Rules in Cloudflare dashboard):
  - Field: **URI Path**, Operator: **starts with**, Value: `/assets/`
  - Cache eligibility: Eligible for cache
  - Edge TTL: Override origin → 1 month
  - Browser TTL: Override origin → 1 month
  - This caches all CSS/JS/images aggressively while leaving HTML pages on Cloudflare's default (shorter) caching, so content edits still show up quickly.
- **Known caveat:** if a placeholder image is ever replaced with a real one under the *exact same filename*, visitors with a cached copy won't see the update for up to a month. Always rename the file (e.g. add `-v2`) when swapping an image that's meant to look different, rather than overwriting the same filename.

---

## 4. Repository file structure

```
huntorbit/
├── .github/workflows/
│   └── scheduled-rebuild.yml     # Daily auto-publish trigger — see Section 9
├── _config.yml                    # Site-wide settings
├── _data/
│   └── categories.yml             # category-slug → display-name mapping
├── _includes/
│   ├── head.html                  # <head> content: SEO meta, OG/Twitter, favicons, fonts, GA tag, includes schema.html
│   ├── header.html                # Site nav, logo, category dropdown (auto-populated)
│   ├── footer.html                # 2-col footer grid + bottom bar, social icons
│   ├── card.html                  # Reusable review card (homepage grid, category pages)
│   ├── rating.html                # Star rating renderer — gracefully renders nothing if no rating
│   └── schema.html                # Dynamic JSON-LD structured data — see Section 8
├── _layouts/
│   ├── default.html               # Base wrapper: head + header + {{ content }} + footer
│   ├── home.html                  # Homepage: featured hero + card grid
│   ├── post.html                  # Article page: breadcrumb, meta, body, verdict box, share bar
│   ├── page.html                  # Shared static-page layout (Write for Us, Privacy, Terms)
│   └── category.html              # Category archive: filtered card grid
├── _posts/                        # All articles live here — see Daily_Publishing_Guide.md
├── category/                      # One small file per category (see Section 4a)
│   ├── productivity.md
│   ├── crm.md
│   ├── dev-tools.md
│   ├── marketing.md
│   └── announcements.md
├── assets/
│   ├── css/style.css              # Entire site's styling, mobile-first
│   ├── js/main.js                 # Mobile nav toggle + category dropdown interaction
│   └── images/
│       ├── brand/social-default.webp   # Fallback OG/Twitter image when a page has no cover_image
│       └── reviews/                     # All article cover/thumb/micro images
├── index.html                     # Homepage entry point (layout: home)
├── write-for-us.md, privacy.md, terms.md   # Static pages (layout: page)
├── favicon.svg, favicon.ico, favicon-16x16.png, favicon-32x32.png,
│   favicon-48x48.png, apple-touch-icon.png,
│   android-chrome-192x192.png, android-chrome-512x512.png
├── llms.txt                       # Auto-generated (Liquid-templated) AI-crawler index — see Section 10
├── robots.txt                     # Crawler allow/block list — see Section 11
├── Gemfile                        # Documents intended gems (github-pages + jekyll-sitemap); not required for the GitHub-native build to work
├── docs/                          # Human/developer reference docs (this file + Daily_Publishing_Guide.md).
│                                     Excluded from the Jekyll build via _config.yml `exclude:` — see
│                                     Section 13, issue #11 if this folder ever breaks the build.
└── README.md                      # Public-facing repo description
```

### 4a. Category archive pages
Each file in `category/` is a tiny static page with front matter only (no body content needed) — `category.html` layout does all the work by filtering `site.posts` where `post.category` matches `category_filter`. To add a new category, see Section 4 of `Daily_Publishing_Guide.md`.

---

## 5. Brand system

### Colors — "Midnight Navy"
| Token | Hex | Use |
|---|---|---|
| Primary | `#1F2D50` | Header text, logo, links, footer background |
| Background | `#FAF9F6` | Page background (warm off-white) |
| Text | `#14141A` | Body text (near-black) |
| Muted text | `#5F5E5A` | Excerpts, meta info |
| Card border | `#E4E1D8` | Hairline borders |
| Gold accent | `#C9A227` | Star ratings only |

### Typography
- **Headings:** Fraunces (serif, 500/600 weight), loaded via Google Fonts
- **Body:** Work Sans (400/500 weight)

### Logo
- **Icon:** an original "compass/arrow" mark — a two-tone kite/needle shape inside a circular ring, symbolizing "guide/direction." This is **original artwork**, not a reproduction of any third-party trademark.
- **Wordmark:** "Hunt" (full opacity) + "Orbit" (~70% opacity), Fraunces 600.
- **Geometry reference** (for regenerating icons at any size, in a 0–48 viewBox coordinate space): ring is a circle at center (24,24) radius ~21–22; the needle is two triangles — `(31.8,16.2), (26.8,26.8), (16.2,31.8)` at full opacity, and `(31.8,16.2), (16.2,31.8), (21.2,21.2)` at ~40% opacity — with a small center dot. This exact coordinate set is used consistently across the favicon, header logo, footer logo, and all article cover-image corner badges.

### Favicon set
All of these exist at the repo root and are linked in `_includes/head.html`: `favicon.svg` (primary, modern browsers), `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png`, `apple-touch-icon.png` (180×180), `android-chrome-192x192.png`, `android-chrome-512x512.png`.

---

## 6. Content model (frontmatter field reference)

Full field list for a post in `_posts/`:

| Field | Required? | Purpose |
|---|---|---|
| `title` | Yes | Page title, H1, SEO title |
| `product_name` | Only for single-product reviews | Triggers `Review` schema instead of `Article` schema. Omit for comparisons/announcements. |
| `category` | Yes | Must match a slug in `_data/categories.yml` |
| `tags` | Optional | Not currently used for filtering, informational only |
| `rating` | Only for reviews | Out of 5, supports `.5` increments. Omitting it hides the star rating everywhere automatically (no error). |
| `date` | Yes | Controls both display date and publish scheduling (see Section 9) |
| `read_time` | Optional | Minutes, shown in article meta row if present |
| `excerpt` | Yes | Card/homepage description text, ~≤160 chars |
| `description` | Yes | SEO meta description, ~≤160 chars |
| `cover_image` | Yes | 1200×630px, path under `/assets/images/reviews/` |
| `cover_image_alt` | Yes | Real descriptive alt text |
| `cover_thumb` | Recommended | 900×472px — used for card grids instead of the full cover, smaller download |
| `cover_micro` | Recommended | 96×96px — used for the tiny footer thumbnail |
| `verdict_summary` | Only for reviews | Populates the boxed verdict on the article page; omitted → no box shown |

Static pages (`write-for-us.md`, `privacy.md`, `terms.md`) use `layout: page` with `title`, `label`, `description`, `intro`, `permalink`, and optionally `cta_title`/`cta_text`/`cta_url`/`cta_label` for a call-to-action box.

---

## 7. Layout/include responsibilities (quick reference)

- **`default.html`** — every page passes through this. Includes `head.html`, `header.html`, the page's own content, `footer.html`, and `main.js`.
- **`home.html`** — takes the single most recent post as the "featured" hero (uses `cover_thumb` for performance), and renders every other post as a grid using `card.html`.
- **`post.html`** — full article template: breadcrumb, category tag, title, rating/date/read-time meta row, full-width cover image, Markdown body, conditional verdict box, and the share bar (X/LinkedIn/Facebook share-intent links + a JS-powered "Copy link" button using `navigator.clipboard`).
- **`category.html`** — reuses the homepage's card grid pattern, filtered to one category, no featured hero. Shows a "no reviews yet" message if empty.
- **`page.html`** — shared by Write for Us, Privacy, and Terms: title block + prose + optional CTA box.
- **`header.html`** — the category dropdown is **fully automatic**: it uses `{% assign grouped = site.posts | group_by: "category" %}` so it only ever shows categories that currently have at least one published post, with live post counts. Nothing to maintain manually here.
- **`footer.html`** — 2-column grid (logo+about text | latest 5 posts with thumbnails) then a 3-part bottom bar (copyright / legal links / social icons). Social links pull from `_config.yml`'s `social:` block.

---

## 8. SEO & structured data (`_includes/schema.html`)

Every page gets JSON-LD structured data, varying by `page.layout`:
- **Every page:** `Organization` schema (name, url, logo, sameAs social links)
- **Homepage (`home`):** adds `WebSite` schema
- **Posts with `product_name` set:** adds `Review` schema (itemReviewed as SoftwareApplication with `operatingSystem: Web` + `applicationCategory` — both required for Google's minimum-2-properties rule) + `BreadcrumbList`
- **Posts without `product_name`** (comparisons, announcements): adds generic `Article` schema instead of `Review` + `BreadcrumbList`
- **Category pages (`category`):** adds `CollectionPage` schema
- **Static pages (`page`):** adds `WebPage` schema

**Important distinction learned during setup:** `Organization`/`WebSite` schema being valid is different from it being "eligible for a rich result" — Google's Rich Results Test only flags types tied to a visible rich-snippet feature (Review, Article, Breadcrumb, FAQ). It's normal and expected for the homepage to show "no items detected" in that specific tool even with correct markup; use `validator.schema.org` to confirm raw validity instead.

Also present sitewide: canonical URL tag (`<link rel="canonical">` via `page.url | absolute_url`), Open Graph tags, Twitter Card tags — all in `_includes/head.html`.

---

## 9. Automated scheduled publishing

**File:** `.github/workflows/scheduled-rebuild.yml`

**What it does:** GitHub Pages only rebuilds on a push, and Jekyll excludes future-dated posts from the build by default. This workflow runs on a daily cron schedule and calls GitHub's Pages Build API directly (`POST /repos/{repo}/pages/builds`) — no commit needed — forcing a fresh build that picks up any post whose `date` has now arrived.

**Critical detail — timezone:** `_config.yml` sets `timezone: Asia/Kolkata`, so Jekyll's own "is this post's date in the future" check is evaluated in IST, not UTC. The cron schedule (which GitHub only accepts in UTC) must be offset accordingly:
- Correct cron: **`35 18 * * *`** (18:35 UTC = **00:05 IST** daily)
- **Do not** set this to `5 0 * * *` (00:05 UTC) — that fires at 05:35 IST, a 5.5-hour publish delay. This exact mistake happened once during initial setup and was corrected; the workflow file has an inline comment warning about it.

**Practical result:** articles can be pre-written and pushed with any future date, and each will go live automatically at 12:05 AM IST on its own date, with zero manual action. To force an immediate rebuild instead of waiting: **Actions tab → "Scheduled Pages Rebuild" → Run workflow** button (the `workflow_dispatch` trigger exists for exactly this).

---

## 10. `llms.txt`

Located at the repo root, but unlike a plain static file, it has YAML front matter (`layout: null`, `permalink: /llms.txt`) so Jekyll processes it through Liquid before outputting plain text. It loops over `site.posts` and categories automatically, so new articles and categories appear in it on the next build with zero manual editing. Realistic expectation: as of 2026, major AI crawlers mostly still read HTML directly rather than this file — it's low-effort hygiene, not a growth lever.

---

## 11. `robots.txt` bot policy

Explicitly **allowed**: Googlebot, Bingbot, Anthropic's crawlers (ClaudeBot, Claude-User, Claude-SearchBot, anthropic-ai), OpenAI's crawlers (GPTBot, ChatGPT-User, OAI-SearchBot), Perplexity's crawlers (PerplexityBot, Perplexity-User), and SEO/brand tools (AhrefsBot, SemrushBot, Meta-ExternalAgent).

Explicitly **blocked**: CCBot, Bytespider, Diffbot, MJ12bot, DotBot, PetalBot, Amazonbot (known aggressive content scrapers).

Everything else defaults to allowed. Includes a `Sitemap:` directive pointing to `https://huntorbit.com/sitemap.xml`.

**Honest limitation:** `robots.txt` is a voluntary request, not enforcement — a genuinely malicious scraper can ignore it entirely. Real protection against that comes from Cloudflare's edge-level bot management, which is active since proxy is on (Section 3).

---

## 12. `sitemap.xml`

Auto-generated by the `jekyll-sitemap` plugin (`plugins: [jekyll-sitemap]` in `_config.yml`) — zero-config, regenerates on every build, automatically includes every new post.

**Category archive pages are deliberately excluded** via `sitemap: false` in each `category/*.md` file's front matter. This is intentional: empty or thin category-listing pages shouldn't be proactively submitted to Google. Once a given category has a healthy number of real articles (3+ is a reasonable bar), remove the `sitemap: false` line from that specific category file to include it going forward. This does **not** affect article URLs at all — those are governed entirely by `permalink: /:title/` in `_config.yml` and have never included `/category/` in the path.

---

## 13. Known issues encountered & their permanent fixes (troubleshooting log)

If something breaks in a way that resembles these, check here first before debugging from scratch:

1. **Homepage/grid images invisible / broken triangle shapes** → An early version of the logo's SVG polygon coordinates were accidentally collinear (zero-area "triangle"). Fixed by using the coordinate set documented in Section 5. If a future icon variant looks blank, check for collinear points first.
2. **Site suddenly shows zero articles ("blank" homepage) despite a successful build** → Almost certainly a timezone mismatch between a post's `date` and Jekyll's future-post exclusion. Confirm `timezone: Asia/Kolkata` is still present in `_config.yml`, and that the affected post's `date` has actually arrived in IST.
3. **New/edited image doesn't show up for a returning visitor** → Cloudflare's 1-month cache TTL on `/assets/` is doing its job. Rename the file rather than overwriting the same filename when the content should visibly change.
4. **GitHub's "Enforce HTTPS" checkbox appears broken/unavailable** → Expected with Cloudflare proxying — see Section 2. Not a real problem.
5. **Google Rich Results Test shows "no items detected" on the homepage** → Expected for `Organization`/`WebSite` schema — see Section 8. Not a bug.
6. **A Review-schema page fails Rich Results validation citing missing properties** → `itemReviewed` needs at least 2 of `offers`/`aggregateRating`/`applicationCategory`/`operatingSystem`. This site always sets both `applicationCategory` and `operatingSystem: Web` — if a new post's schema fails this, check `product_name` and `category` are both actually set correctly in that post's front matter.
7. **A GoDaddy CNAME record with a value of `@` "worked" on a different subdomain but not for the root domain** → That's DNS forwarding (a redirect), not a real apex CNAME — DNS spec doesn't allow CNAME at a zone's root. The root domain must use the 4 A records documented in Section 3.
8. **Scheduled article didn't publish exactly at midnight IST** → Check the cron value in `.github/workflows/scheduled-rebuild.yml` is `35 18 * * *`, not `5 0 * * *` — see Section 9's critical detail.
9. **Homepage `<title>` tag shows a stray leading `| HuntOrbit`** → Caused by `index.html` setting `title: ""` (empty string) in front matter — Liquid treats empty string as truthy, so `head.html`'s `{% if page.title %}` check still fired. Fixed two ways at once: `index.html` no longer sets a `title` field at all (falls back to `site.title` cleanly), and `head.html`'s check was hardened to `{% if page.title and page.title != "" %}` so this can't silently recur on any future page that accidentally sets an empty title.
10. **Homepage shows an empty "Latest reviews" heading with no cards underneath** → Happens whenever there's only 1 total post (it becomes the featured hero, leaving zero posts for the grid). Fixed in `_layouts/home.html` by wrapping the "Latest reviews" heading and grid in `{% if rest.size > 0 %}` — with only one article, the homepage now cleanly shows just the featured card and nothing else. This resolves itself automatically and permanently as soon as a 2nd+ post exists; no manual toggling needed.
11. **Site build fails entirely with `Liquid syntax error ... 'if' tag was never closed` pointing at a file in `docs/`** → Jekyll runs Liquid over every Markdown file in the repo by default, including reference documentation. Since files like this Build Spec and the Daily Publishing Guide contain literal example Liquid syntax (e.g. `{% if page.rating %}`) inside code fences purely as text for a human to read, Jekyll tries to actually parse it as real template code and fails. Fixed permanently by adding `exclude: [docs/]` to `_config.yml`, which stops Jekyll from touching that folder at all — the files still sit in the repo normally and render fine as plain Markdown when viewed directly on GitHub. **If any new documentation file is ever added outside `docs/`, or a new top-level docs folder is created, add it to this same `exclude:` list before pushing**, or it will break the entire site build, not just fail to render that one file.

---

## 14. Business/content decisions on record

- **Monetization:** Sponsored reviews are accepted at a **$49 lifetime rate** (per the original business decision). This number is intentionally **not** published anywhere on the live site yet — Write for Us mentions sponsored reviews exist, without a price, pending a future decision to surface it.
- **Content policy:** No fabricated/AI-generated "realistic" screenshots of real third-party products are ever used — this would misrepresent real software and contradicts the site's own "real screenshots" promise on the Write for Us page. Placeholder article cover images use original, brand-consistent abstract icon artwork (see Section 5) until real hands-on screenshots are captured and swapped in.
- **Contact:** No contact form exists anywhere on the site by design. The footer's "Contact" link is a direct `mailto:connect@huntorbit.com` link.

---

## 15. Social profiles (live, not placeholders)

Configured in `_config.yml` under `social:` and confirmed live: GitHub (repo, not account: `github.com/jiten14/huntorbit`), X, LinkedIn, YouTube. All four resolve to real, branded HuntOrbit profiles.
