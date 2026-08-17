# HuntOrbit — Daily Publishing Guide

This is the practical, day-to-day guide for writing and publishing an article. For how the site is built/architected, see `HuntOrbit_Final_Build_Spec.md` instead — this file is just the workflow.

---

## The 60-second version

1. Write your article as a `.md` file in `_posts/`
2. Add 3 images to `assets/images/reviews/`
3. Push to GitHub
4. Done — it publishes immediately if dated today/past, or automatically at **12:05 AM IST** on its date if dated in the future

---

## 1. File naming & location

### Article file
**Location:** `_posts/`
**Filename format:** `YYYY-MM-DD-slug.md`

Example: `_posts/2026-09-01-slack-review.md`

- The date in the filename is a fallback only — the **`date:` field inside the frontmatter is what actually controls the publish date**. Keep both the same to avoid confusing yourself later.
- The slug (the part after the date) becomes the article's URL: `slack-review` → `huntorbit.com/slack-review/`. Use lowercase, hyphen-separated, no special characters.

### Images (3 per article, always)
**Location:** `assets/images/reviews/`
**Naming format:** `{slug}-cover.webp`, `{slug}-thumb.webp`, `{slug}-micro.webp` (same slug as the article filename)

| File | Size | Used for |
|---|---|---|
| `{slug}-cover.webp` | 1200×630px | Article page top image, homepage featured hero (as fallback), OG/Twitter share image |
| `{slug}-thumb.webp` | 900×472px | Homepage/category card grid, homepage featured hero |
| `{slug}-micro.webp` | 96×96px | Footer "Latest posts" thumbnail |

Example for `slack-review`:
```
assets/images/reviews/slack-review-cover.webp
assets/images/reviews/slack-review-thumb.webp
assets/images/reviews/slack-review-micro.webp
```

---

## 2. Article frontmatter template

Copy this exactly into a new `_posts/YYYY-MM-DD-slug.md` file, then fill in the blanks:

```yaml
---
title: "Product Name Review: Your Actual Headline"
product_name: Product Name
category: productivity
tags: [tag1, tag2, tag3]
rating: 4.3
date: 2026-09-01
read_time: 8
excerpt: "One sentence, shown on cards and in search results. Under 160 characters."
description: "SEO meta description. Can be slightly different from excerpt. Under 160 characters."
cover_image: /assets/images/reviews/slack-review-cover.webp
cover_image_alt: "Descriptive alt text — what's literally in the image"
cover_thumb: /assets/images/reviews/slack-review-thumb.webp
cover_micro: /assets/images/reviews/slack-review-micro.webp
verdict_summary: "One or two sentences — the final take, shown in the boxed verdict on the article page."
---

Your article body in Markdown goes here.

## A subheading

Body text. Use `## ` for subheadings, `> ` for a pull-quote/blockquote, `- ` for bullet lists.
```

### Field notes
- **`category`** must be one of the existing slugs in `_data/categories.yml` (currently: `productivity`, `crm`, `dev-tools`, `marketing`, `announcements`) — see Section 4 to add a new one.
- **`product_name`** — only include this for a review of ONE specific product. This is what tells the site to output `Review` schema (with your star rating) instead of generic `Article` schema. **Omit it entirely** for comparison posts (e.g. "X vs Y") or announcement posts, since Review schema only applies to a single reviewed item.
- **`rating`** — omit entirely for non-review posts (announcements, opinion pieces). The star rating simply won't render if this field is missing — that's intentional, not a bug.
- **`verdict_summary`** — omit for non-review posts; the boxed verdict only appears if this is set.
- **`date`** — this is what actually controls scheduling (see Section 3).

---

## 3. Scheduling — how publish timing actually works

- **Date is today or in the past** → publishes on your **next push** to GitHub. Immediate, no waiting.
- **Date is in the future** → the article sits on the site invisibly (built, but excluded by Jekyll) until its date arrives, at which point a scheduled GitHub Action automatically rebuilds the site and it goes live — **no further action needed from you**.
- **The automatic daily publish time is 12:05 AM IST (00:05 IST)** — this is set in `.github/workflows/scheduled-rebuild.yml`. You can pre-write and push an entire month of dated articles today, and they'll each go live on their own date, one by one, with zero manual intervention.
- To force an immediate rebuild without waiting (e.g. to test something right now): GitHub repo → **Actions tab → "Scheduled Pages Rebuild" → Run workflow** button.

### Worked example

If you push an article on **18-08-2026 at 9:00 AM IST**, with `date: 2026-08-19` in its frontmatter, it will publish automatically on **19-08-2026 at 12:05 AM IST** — the exact push time doesn't matter, only the `date:` field does. Visitors will see "Reviewed August 19, 2026" on the article (the frontmatter date is what's displayed, not your push time). Your filename should use that same date for consistency: `_posts/2026-08-19-your-slug.md`.

---

## 4. Adding a brand-new category (only needed occasionally)

1. Add one line to `_data/categories.yml`: `new-slug: Display Name`
2. Create `category/new-slug.md`:
   ```yaml
   ---
   layout: category
   title: New Category Reviews
   category_filter: new-slug
   description: "Hands-on reviews of [type] SaaS tools."
   permalink: /category/new-slug/
   sitemap: false
   ---
   ```
3. Leave `sitemap: false` in place until the category has a handful of real articles (3+ recommended), then delete that line so it's included in `sitemap.xml`. This is deliberate — empty category pages shouldn't be indexed by Google.
4. The category automatically appears in the header dropdown once at least one published post uses it — no extra step needed.

---

## 5. Pre-publish checklist

- [ ] Both filename date and frontmatter `date:` match (or frontmatter date is intentionally different — filename is otherwise ignored)
- [ ] All 3 images exist at the correct paths, matching the slug exactly
- [ ] `cover_image_alt` is a real, descriptive sentence (not "image" or blank) — this matters for SEO and accessibility
- [ ] `excerpt` and `description` are both under ~160 characters
- [ ] `product_name` is set for single-product reviews, omitted for comparisons/announcements
- [ ] `rating` and `verdict_summary` are set for reviews, omitted for non-reviews
- [ ] Category slug matches an existing entry in `_data/categories.yml`
- [ ] Read the article once on the live site after it publishes — check the featured image, rating stars, and category tag all render correctly
