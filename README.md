# Profile

An Astro Nano-based personal site

## Editing content

- Blog posts live in `src/content/blog/<slug>/index.md`.
- Projects live in `src/content/projects/<slug>/index.md`.
- Work entries live in `src/content/work/<company>.md`.
- Site-wide name, email, social links, and homepage counts live in `src/consts.ts`.

To add a blog post, create a folder like `src/content/blog/my-new-post/index.md`:

```md
---
title: "My New Post"
description: "A short summary for cards and SEO."
date: "2026-05-11"
---

Write the post here.
```

That file automatically becomes `/blog/my-new-post`.

## Commands

```bash
npm install
npm run dev
npm run build
```

This project is built from the MIT-licensed Astro Nano template.
