# 1.6.2 Home Not Found SEO Fix

## Problem

The production homepage returns HTTP `200` and exposes `robots=index, follow`, but the HTML also contains the default Next.js not-found fallback text:

```text
404: This page could not be found.
```

This text appears in the App Router RSC payload as the default `notFound` tree, not as visible homepage content. It creates avoidable SEO risk because crawlers can see contradictory homepage signals.

## Change

Add a custom root `app/not-found.tsx` so the App Router no longer serializes the default English 404 fallback into the homepage payload.

The custom page should:

- Use Chinese site-appropriate copy.
- Link back to `/`.
- Keep actual 404 pages marked `noindex, nofollow`.
- Avoid the exact default phrase `404: This page could not be found.`.

## Acceptance

- `npm run build` passes.
- Homepage HTML does not contain `404: This page could not be found.`.
- Homepage HTML does not contain `noindex`.
- Homepage robots remains `index, follow`.

## Verification

2026-07-06:

- `npm run build`: passed.
- Local production server `http://127.0.0.1:3106/`: `200`.
- Local homepage HTML:
  - `404: This page could not be found.` count: `0`
  - `noindex` count: `0`
  - robots meta: `index, follow`
  - canonical: `https://www.skill-cn.com`
