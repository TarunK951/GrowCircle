# Circle API integration — follow-ups and response gaps

This document lists what the **Grow Circle** frontend expects from the backend, what is handled **only in the client**, and what to verify if data or auth still looks wrong.

## Auth and tokens

| Topic | Behavior in app | If something is still missing |
| --- | --- | --- |
| Expired access token | `circleRequest` / `circleRequestList` / `circleRequestBlob` retry once after `refreshCircleAccessToken()` when the error looks like an auth failure (e.g. 401, “invalid or expired token”). | Confirm `/auth/refresh-token` returns a new pair and that Redux persists `refreshToken`. |
| Opaque / non-JWT access tokens | `CircleSessionBridge` runs a **one-time** refresh when `exp` cannot be decoded from the JWT. | If tokens are never JWTs, rely on the 10‑minute fallback interval + visibility refresh; avoid logging the user out on a single refresh failure unless the refresh token is actually invalid. |
| Logout on refresh failure | `onRefreshFailed` clears the session via the session store. | Backend should return a clear 401 when the **refresh** token is invalid so the user can re-login without silent loops. |

## Event detail page (`GET /events/:id` or equivalent)

The UI maps **`MeetEvent`** from `circleEventToMeetEvent`. Sections only render if the **normalized** event object has data.

| UI section | `MeetEvent` fields | Backend note |
| --- | --- | --- |
| Hero + gallery | `image`, `additionalImages` | Prefer `cover_image_url` and `image_urls` (or camelCase equivalents). URLs must be **HTTPS** and reachable from the browser (CORS not required for `<img>` / `next/image`). |
| Available slots / progress | `spotsTaken`, `capacity` | Mapper accepts `spots_taken`, `spotsTaken`, or `registered_count`. If omitted, spots show as **0** filled. |
| About / included / suggestions / house rules / written rules / location type / FAQ / refund | `moreAbout`, `whatsIncluded`, `guestSuggestions`, `allowedAndNotes`, `houseRules`, `eventRules`, `locationType`, `faqs`, `refundPolicy` | Same as below — see **[backend-requirements.md](./backend-requirements.md)** for API names (`more_about`, `event_rules`, `location_type`, …). If the API **does not** return them for public detail, those blocks stay empty **even though** the host entered them in the wizard locally. **Persist and return these fields** if guests should see them without the host’s browser session. |
| Pre-join questions | `questions` on the event (mapped to `preJoinQuestions`) | `GET /events/:id` should include the same question definitions as used at apply time. |

### Naming conventions

The mapper accepts **snake_case** and **camelCase** for several fields (e.g. `cover_image_url` / `coverImageUrl`, `image_urls` / `imageUrls`). If your API uses different names, extend `circleEventToMeetEvent` in `src/lib/circle/mappers.ts`.

## Host wizard vs guest view

- After publish, the host’s browser may still show rich data from **local/session** state (`publishHostedEvent`).
- Another user (or the same user on another device) only sees what **`GET /events/:id`** (and catalog list endpoints) return.
- **Gap to close on the backend:** store and return long-form fields (about, included, rules, FAQs, refund text) on the event resource so public detail matches the host experience.

## Images

- **Next.js `Image`:** `next.config.ts` allows Unsplash, Google avatars, `**.amazonaws.com`, and `**.cloudfront.net`. Other hostnames may still work with `unoptimized` on cards/detail; for new CDNs, add `remotePatterns` or use stable HTTPS URLs.
- **Stock placeholder URL:** `meetEventGalleryUrls` filters the default Unsplash placeholder used when the API has no real cover—so an empty or placeholder-only response may show the gray “no image” state.

## “Before you join” modal

- Rendered with a **portal to `document.body`** so it is not clipped by transformed ancestors. If behavior regresses, check for duplicate overlays or z-index conflicts with `z-[200]`.

## Optional next steps (product / API)

1. **Contract test** or snapshot: sample JSON for `GET /events/:id` including all extended fields the product promises.
2. **ETag / caching:** if guests see stale images after the host updates cover, ensure CDN URLs change or cache headers are correct.
3. **Apply flow:** confirm `POST .../applications/.../apply` error bodies use `message` so toasts stay readable (already assumed by `CircleApiError`).

---

*Last updated from the integration work on token retry, modal portal, image handling, and extended event mapping.*
