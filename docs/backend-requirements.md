# Backend requirements (Grow Circle)

**Audience:** API / backend owners and web client implementers.  
**Code anchors:** [`getCircleApiBase()`](../src/lib/circle/config.ts), [`circleRequest`](../src/lib/circle/client.ts), [`normalizeCircleProfile`](../src/lib/circle/api.ts), [`circleEventToMeetEvent`](../src/lib/circle/mappers.ts).

---

## Standard JSON envelope

Most endpoints return `{ "success": true, "message": "…", "data": … }`. The web client unwraps **`data`** for successful responses (see [`circleRequest`](../src/lib/circle/client.ts)).

---

## User profile resource (`/users/me`)

### Field matrix

| Field (snake_case on wire) | Typical type | GET | PUT | Persist | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | string | Yes | — | Yes | Required |
| `phone` | string \| null | Yes | Varies | Yes | OAuth users may have `null` until linked |
| `username` | string \| null | Yes | Yes | Yes | Display name (web validates format) |
| `email` | string \| null | Yes | Varies | Yes | Often read-only after OAuth |
| `dob` | string \| null | Yes | Yes | Yes | `YYYY-MM-DD` |
| `avatar_url` | string \| null | Yes | Yes | Yes | |
| `verification_tier` | number | Yes | — | Yes | |
| `is_profile_complete` | boolean | Yes | — | Yes | Product flag |
| `is_globally_banned` | boolean | Yes | — | Yes | |
| `created_at` | string | Yes | — | Yes | ISO |
| `bio` | string \| null | Yes | Yes* | Yes* | Web maps + sends when supported |
| `city` | string \| null | Yes | Yes* | Yes* | |
| `dietary_preference` | string \| null | Yes | Yes* | Yes* | |
| `emergency_contact_name` | string \| null | Yes | Yes* | Yes* | |
| `emergency_contact_phone` | string \| null | Yes | Yes* | Yes* | |
| `email_verified` | boolean | Yes | — | Yes | Read-only in web UI |
| `google_id` | string \| null | Yes | — | Yes | Usually not shown in UI |
| `last_active_at` | string \| null | Yes | — | Yes | |
| `profile_completion_score` | number | Yes | — | Yes | Reconcile with `is_profile_complete` |
| `updated_at` | string \| null | Yes | — | Yes | ISO |

\* **PUT:** Web sends `bio`, `city`, `dietary_preference`, `emergency_contact_name`, `emergency_contact_phone` with `username` / `dob` as applicable. Backend should document which keys are accepted and whether empty string clears a field.

### CamelCase aliases

The web normalizer accepts common camelCase aliases for several fields (e.g. `dietaryPreference`, `emergencyContactName`). Prefer **snake_case** in official docs.

---

## Payload / response audit (run twice after changes)

**Pass A — Response**

1. Capture a real `GET /users/me` JSON (`data` object).
2. For each key: confirm [`normalizeCircleProfile`](../src/lib/circle/api.ts) maps it into [`CircleProfile`](../src/lib/circle/types.ts) or document intentional omission.
3. For each key: confirm the profile UI shows it, uses read-only metadata, or is intentionally hidden.

**Pass B — Payload**

1. List each profile form field and its JSON key on `PUT /users/me`.
2. Confirm the backend persists and returns the same fields on the next `GET`.
3. Re-run after backend or frontend changes.

**Events:** Event list vs detail and host payloads should be audited the same way against [`circleEventToMeetEvent`](../src/lib/circle/mappers.ts) and [`EventMeetDetail`](../src/components/events/EventMeetDetail.tsx).

---

## Related

- [backend-team-handoff-gaps.md](backend-team-handoff-gaps.md) — gaps for backend coordination (if present).
