# HuntOrbit

**[HuntOrbit](https://huntorbit.com)** is a SaaS product review blog — hands-on reviews, honest verdicts, no fluff. This repository is the full source for the site: every review, layout, and style rule that powers [huntorbit.com](https://huntorbit.com) lives here as plain Markdown and Liquid templates.

> 🔗 Live site: **[huntorbit.com](https://huntorbit.com)**

## What this is

HuntOrbit reviews SaaS products — productivity tools, CRMs, marketing platforms, developer tools — based on actual hands-on use, not rewritten marketing copy. Every review includes a star rating, a plain-language verdict, and enough specifics (pricing tiers, feature limits, real trade-offs) to actually help someone decide. Companies interested in a sponsored, in-depth review can find details on the [Write for Us](https://huntorbit.com/write-for-us/) page.

## Why this repo is structured the way it is

The whole site is intentionally static — no database, no backend, no contact forms:

- **Content** — every review is a single Markdown file in [`_posts/`](./_posts), with frontmatter for title, category, star rating, cover image, and SEO metadata. Publishing a new review is just adding a file and pushing.
- **Hosting** — built with Jekyll and served free by GitHub Pages, using GitHub's native "Deploy from a branch" build. No local Jekyll/Ruby install is required to contribute; files are authored and pushed directly.
- **Design** — one shared CSS file ([`assets/css/style.css`](./assets/css/style.css)) and a small set of reusable layouts/includes (`_layouts/`, `_includes/`) drive the homepage grid, article pages, category archives, and the static pages (Privacy, Terms, Write for Us).
- **SEO** — every page ships canonical URLs, Open Graph/Twitter tags, and dynamic JSON-LD structured data (Organization, Review, Article, BreadcrumbList) via [`_includes/schema.html`](./_includes/schema.html).

## Repo structure

```
huntorbit/
├── _config.yml           # Site settings
├── _data/categories.yml  # Category display-name mapping
├── _posts/                # All published reviews (Markdown)
├── _layouts/               # Page templates (home, post, category, static page)
├── _includes/              # Reusable components (header, footer, card, schema)
├── category/                # One lightweight archive page per category
├── assets/                   # CSS, JS, and review cover images
├── write-for-us.md, privacy.md, terms.md
└── favicon files, README.md
```

## Contact

Questions, corrections, or pitching a review? Reach out at [connect@huntorbit.com](mailto:connect@huntorbit.com), or see the contribution guidelines on [huntorbit.com/write-for-us](https://huntorbit.com/write-for-us/).

---

*Article content is © HuntOrbit. Site structure and code are shared here for transparency into how the site is built and run.*