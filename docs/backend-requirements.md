# Backend requirements (Grow Circle)

**Single document** for the backend / API team: what to **store**, **return** on reads, and how the **web app** maps Circle responses. The authoritative product API reference remains your **`API_DOCUMENTATION.md`**; this file tracks **frontend expectations** and gaps.

**Code anchors:** [`getCircleApiBase()`](src/lib/circle/config.ts), [`circleRequest`](src/lib/circle/client.ts), [`CircleEvent`](src/lib/circle/types.ts), [`circleEventToMeetEvent`](src/lib/circle/mappers.ts), [`MeetEvent`](src/lib/types/index.ts).

**Table of contents:** Base URL · Envelope · List vs detail · Request payload · UI→API mapping · Response shape · Pre-join questions · Host flow · Auth casing · Email OTP · Gaps · Open questions · File map · Related notes

---

## Base URL and paths

- **Base URL:** `NEXT_PUBLIC_CIRCLE_API_BASE` — typically ends with `/api`.
- **Path convention:** Requests use paths **without** a second `/api` prefix (e.g. `{base}/events`, not `{base}/api/events`).

---

## Standard JSON envelope

Most endpoints return:

```json
{
  "success": true,
  "message": "Human-readable status",
  "data": {}
}
```

| Behavior | Detail |
| --- | --- |
| **List endpoints** (e.g. `GET /events`) | `data` is an **array**. **`meta`** may sit next to `data` (`total`, `page`, `limit`, `totalPages`). |
| **Errors** | `success: false` with `message`; client throws `CircleApiError`. |
| **Success** | [`circleRequest`](src/lib/circle/client.ts) returns **only** the inner `data` payload (unwraps the envelope). |

### Typical HTTP status codes

| Action | Method / path | Status |
| --- | --- | --- |
| Create event | `POST /events` | **201** |
| Update event | `PUT /events/:id` | **200** |
| Publish | `PUT /events/:id/publish` | **200** |
| Get by id / slug | `GET /events/:id`, `GET /events/slug/:slug` | **200** |
| List public | `GET /events` | **200** |
| Host’s events | `GET /events/my` (if implemented) | **200** |
| Add question | `POST /events/:id/questions` | **201** |

---

## List vs detail: what the UI needs

| Surface | Route / usage | What the app displays from `MeetEvent` |
| --- | --- | --- |
| **Discover / grid cards** | Explore, merged catalog | `title`, `description` (short, clamped), `price` → `priceCents`, `event_date` → `startsAt`, `cover_image_url` / first gallery image, `category` / `categories`, `tags`, `displayLocation` or city name, `host.username` → host line. **Rich fields** (`more_about`, `house_rules`, etc.) are **not** shown on cards—only on detail. |
| **Event / meet detail (“View event”)** | `/event/[id]`, group, etc. | Full detail: description, `more_about`, `whats_included`, `guest_suggestions`, `allowed_and_notes`, `house_rules`, `event_rules`, `location_type` (label from slug), `faqs`, `refund_policy`, `questions` (pre-join), capacity vs **spots taken** (see below). |

**Requirement:** `GET /events` (list) may return a **subset** of fields; **`GET /events/:id`** and **`GET /events/slug/:slug`** must return **all** persisted host fields so public detail matches host preview.

### Capacity and attendance

| API field (typical) | Maps in app | Used for |
| --- | --- | --- |
| `max_capacity` | `MeetEvent.capacity` | Total spots. |
| `spots_taken` / `spotsTaken` / `registered_count` | `MeetEvent.spotsTaken` | Filled count; “X of Y filled”, “spots left”. |

---

## Event resource — request payload (`POST` / `PUT`)

Bodies use **snake_case**. The host flow uses **`POST /events`** then **`PUT /events/:id`** for fields `POST` may ignore.

### Core fields (matrix)

| Field | `POST` | `PUT` | Sent by app? | Notes |
| --- | --- | --- | --- | --- |
| `title` | Yes | Optional | Yes | |
| `description` | Yes | Optional | Yes | Short listing copy (cards + header). |
| `max_capacity` | Yes | Optional | Yes | |
| `price` | Yes | Optional | Yes | Number in requests; document string vs number in API doc. |
| `event_date` | Yes | Optional | Yes | ISO 8601 instant. |
| `location` | Yes | Optional | Yes | Single string (venue + address). |
| `cover_image_url` | Yes | Optional | Yes | When set. |
| `image_urls` | Often via `PUT` | Yes | Yes | Gallery (optional). |
| `visibility` | Yes | Optional | Yes | `public` / `private`. |
| `waitlist_enabled` | Optional | Optional | Yes | |
| `timezone` | Varies | Yes | Yes | IANA, e.g. `Asia/Kolkata`. |
| `category` | Varies | Yes | Yes | Primary label. |
| `tags` | Varies | Yes | Yes | `string[]`. |
| `faqs` | Varies | Yes | Yes | `{ q, a }[]`. |
| `min_age`, `min_verification_tier` | Optional | Optional | No | Server defaults in UI. |
| `refund_*` hours / % | Optional | Optional | No | Server defaults unless exposed in UI later. |
| `start_time` / `end_time` | Varies | Varies | No | App uses `event_date` primarily. |

### Rich content fields

| Field | Type | Sent by app? | UI purpose |
| --- | --- | --- | --- |
| `more_about` | string | Yes (when non-empty) | Long “About this meet”. |
| `whats_included` | string[] | Yes | Things available / included. |
| `guest_suggestions` | string[] | Yes | Tips for guests. |
| `allowed_and_notes` | string | Yes | Allowed items, accessibility, parking. |
| `house_rules` | `{ dos: string[], donts: string[] }` | Yes | Do / don’t **bullets**. |
| `event_rules` | string | Yes | Written rules (policies, age, refunds). |
| `location_type` | string | Yes | Venue kind slug — see [`HOST_LOCATION_TYPE_OPTIONS`](src/lib/hostLocationTypes.ts). Not street address (`location`). |
| `refund_policy` | string | Yes (host Preview) | Host refund copy. |

> **Clearing:** App often **omits** empty keys. Define whether `PUT` with `[]` or empty string clears stored values.

---

## UI label → API field (host wizard & host Preview)

| Host-facing label | API field |
| --- | --- |
| Short description | `description` |
| More about | `more_about` |
| What’s included / available | `whats_included` |
| Suggestions | `guest_suggestions` |
| Notes (allowed, accessibility) | `allowed_and_notes` |
| Do’s / Don’ts bullets | `house_rules.dos`, `house_rules.donts` |
| Written rules | `event_rules` |
| Type of location | `location_type` |
| FAQs | `faqs` |
| Refund copy (Preview) | `refund_policy` |

---

## Event response (GET one event)

Responses are **snake_case** (mapper accepts camelCase aliases for some keys).

### Identity, scheduling, listing

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string (UUID) | |
| `host_id` | string | |
| `title`, `description` | string | |
| `slug` | string | |
| `status` | string | e.g. `draft`, `published`. |
| `visibility` | string | |
| `event_date` | string (ISO) | |
| `start_time`, `end_time` | string or null | |
| `timezone` | string | |
| `location` | string | “Where” line. |
| `location_type` | string | Optional slug. |
| `latitude`, `longitude` | number or null | |
| `max_capacity` | number | |
| `price` | string **or** number | **Accept both.** |
| `cover_image_url`, `image_urls` | string / array / null | |
| `category`, `tags`, `categories` | mixed | |
| `is_featured` | boolean | |
| `min_age`, `min_verification_tier` | number or null | |
| `waitlist_enabled` | boolean | |
| `registration_opens_at`, `registration_closes_at` | string or null | |
| `refund_full_before_hours`, `refund_partial_before_hours`, `refund_partial_percentage` | number | |
| `tax_percentage`, `currency`, `terms_required` | varies | |
| `contact_email`, `contact_phone`, `commission_override` | varies | |
| `created_at`, `updated_at`, `deleted_at` | string or null | |

### Rich content (detail `GET` — required for full guest UX)

| Field | Type |
| --- | --- |
| `more_about` | string or null |
| `whats_included` | string[] or null |
| `guest_suggestions` | string[] or null |
| `allowed_and_notes` | string or null |
| `house_rules` | `{ dos, donts }` or null |
| `event_rules` | string or null |
| `faqs` | `{ q, a }[]` or null |
| `refund_policy` | string or null |

### Host, questions, counts

| Field | Type | Notes |
| --- | --- | --- |
| `host` | object | `id`, `username`, `avatar_url` — cards + detail. |
| `questions` | array | Pre-join: `question_text`, `question_type`, `options`, … |
| `spots_taken` / `registered_count` | number | Filled seats. |

### Example: detail response fragment

```json
{
  "id": "…",
  "title": "…",
  "description": "Short blurb for cards",
  "more_about": "Longer story for detail page",
  "max_capacity": 16,
  "spots_taken": 0,
  "price": "520.00",
  "event_date": "2026-02-21T05:40:00.000Z",
  "timezone": "Asia/Kolkata",
  "location": "Venue name, full address",
  "location_type": "indoor_venue",
  "cover_image_url": "https://…",
  "image_urls": ["https://…"],
  "category": "Meet",
  "tags": ["outdoors"],
  "whats_included": ["Tea"],
  "guest_suggestions": ["Comfortable shoes"],
  "allowed_and_notes": "Wheelchair access…",
  "house_rules": { "dos": ["…"], "donts": ["…"] },
  "event_rules": "18+ only. …",
  "faqs": [{ "q": "Parking?", "a": "Street on weekends." }],
  "refund_policy": "Full refund up to 48h before…",
  "host": { "id": "…", "username": "satyatarun951", "avatar_url": "…" },
  "questions": []
}
```

---

## Pre-join questions API

- **Body:** `question_text`, `question_type` (`text` | `single_select` | `multi_select`), `is_required`, optional `sort_order`.
- **`single_select` / `multi_select`:** **`options`** with ≥ two strings.

This app creates **`single_select`** with `options`, `is_required: true`, `sort_order`.

---

## Host flow summary (what gets sent)

1. `POST /events` — core + optional rich fields.  
2. `PUT /events/:id` — timezone, category, tags, **all rich fields**, `faqs`, …  
3. `POST /events/:id/questions` — each pre-join question.  
4. `PUT /events/:id/publish` — publish.

---

## Authentication (non-event nuance)

- Token endpoints may return **camelCase** (`accessToken`, `refreshToken`); client normalizes.  
- **`/users/me`:** **snake_case** (`avatar_url`, `is_profile_complete`, …).

---

## App-local email OTP (not Circle API)

Next.js: `/api/auth/email-otp/send`, `/api/auth/email-otp/verify` (local accounts only).

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Email delivery; if unset, OTP logged (dev only). |
| `EMAIL_FROM` | From address. |
| `EMAIL_OTP_SECRET` / `AUTH_SECRET` | OTP hashing. |
| `EMAIL_OTP_DEV_RETURN` | Dev-only; **never** in production. |

Storage: `data/email-otp.json` — use Redis for multi-instance.

---

## Gaps and backend actions

1. Document all **`POST`/`PUT`** keys the app sends or confirm strip behavior.  
2. Document **`price`** as number vs decimal string (request + response).  
3. Document **list vs detail** field sets on `GET`.  
4. **`faqs` / arrays:** empty `PUT` semantics.  
5. **`event_date` vs `start_time` / `end_time`:** canonical rule.  
6. **Persistence:** `GET` must return stored rich fields for guests.

---

## Open questions (for `API_DOCUMENTATION.md`)

1. **`tags`:** shape and deduplication.  
2. **Create vs update:** fields ignored on `POST`.  
3. **`questions` on list:** yes/no.

---

## Frontend file map

| Area | File |
| --- | --- |
| Host wizard | [`src/app/(marketing)/host-a-meet/wizard.tsx`](src/app/(marketing)/host-a-meet/wizard.tsx) |
| Host Preview | [`src/app/(app)/bookings/host/[eventId]/page.tsx`](src/app/(app)/bookings/host/[eventId]/page.tsx) |
| Discover cards | [`src/components/events/EventCard.tsx`](src/components/events/EventCard.tsx) |
| Event detail | [`src/components/events/EventMeetDetail.tsx`](src/components/events/EventMeetDetail.tsx) |
| Mapper | [`src/lib/circle/mappers.ts`](src/lib/circle/mappers.ts) |
| Location slugs | [`src/lib/hostLocationTypes.ts`](src/lib/hostLocationTypes.ts) |

---

## Related operational notes

Day-to-day integration follow-ups (token refresh, images, modals) live in **[circle-api-integration-notes.md](./circle-api-integration-notes.md)**. **Contract and field requirements** are **this file only** (`backend-requirements.md`).
