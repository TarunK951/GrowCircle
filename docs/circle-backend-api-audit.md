# Circle API — App-facing contract audit

This document describes every **non-admin** HTTP API the GrowCircle web app expects from the Circle backend. Admin routes (`/admin/*`) are documented separately in [circle-backend-admin-api.md](./circle-backend-admin-api.md) if present.

**Source of truth in this repo:** `src/lib/circle/` (client, API modules) and `src/lib/circle/types.ts`.

**Extended app features:** The app also calls endpoints documented in the backend `API_REFERENCE` for saved events, notification preferences, payment history, host profile, ratings, support tickets, payout accounts, and booking summary — see **§14+** below.

---

## Base URL and health

- **API base:** `NEXT_PUBLIC_CIRCLE_API_BASE` (e.g. `https://…/api` — no trailing slash). All paths below are relative to this base unless noted.
- **Default (GrowCircle):** If the env var is unset, `src/lib/circle/config.ts` uses **`https://circle-backend-production-e6c9.up.railway.app/api`** so local dev works without extra configuration.
- **Health (not under `/api`):** The client strips a trailing `/api` from the base and requests `GET /health` at server origin. Expected JSON: `{ status: string, timestamp?: string }`.

---

## Response conventions

### `circleRequest` (most endpoints)

Implemented in `src/lib/circle/client.ts`:

- On success JSON, if the body is `{ success: true, data: T }`, the client **returns `T` only** (unwraps `data`).
- If `success === false`, the client throws with `message`.
- If the body has **no** `data` property (e.g. raw `T` at top level), the client returns the parsed JSON as `T` (legacy / passthrough).

Backends should prefer a consistent **`{ success: boolean, message?: string, data?: T }`** envelope for mutating and typed reads.

### `circleRequestList` (paginated lists)

Used for endpoints that return **`{ success?, data: T[], meta }`**. The client requires `data` to be an array (falls back to `[]`) and merges `meta` with defaults if missing.

`meta` shape (`CircleListMeta`):

| Field        | Type   |
| ------------ | ------ |
| `total`      | number |
| `page`       | number |
| `limit`      | number |
| `totalPages` | number |

### Special cases

- **`GET /events` (public list):** Implemented with raw `fetch` in `listPublicEvents`. Expects top-level **`data`** (array) and **`meta`** (not nested inside `data`).
- **Binary:** `circleRequestBlob` — successful non-JSON body as `Blob` (CSV export, invoice PDF).

### Authorization

Where noted, requests send **`Authorization: Bearer <accessToken>`**. No admin scope in this document.

### Session refresh (app client)

- **`circleRequest`** (`src/lib/circle/client.ts`) refreshes near-expired JWTs before requests and retries once on many 401/403 auth failures after **`POST /auth/refresh-token`**.
- **RTK Query (`circleApi`):** After Redux **`applyTokenRefresh`**, a listener invalidates tagged queries (`PublicEvents`, `HostedEvents`, `MyApplications`, `Notifications`, `UnreadCount`) so cached errors are cleared and active screens refetch without a full page reload. Authenticated `queryFn`s resolve the token via **`ensureCircleAccessToken()`** (dynamic import to avoid store circularity).

---

## 1. Auth

| Method | Path | Body | Response (`data` unwrap) |
| ------ | ---- | ---- | ------------------------ |
| POST | `/auth/send-otp` | `{ phone }` | opaque / message only |
| POST | `/auth/verify-otp` | `{ phone, otp }` | `VerifyOtpData` |
| POST | `/auth/complete-profile` | `{ username, email, dob }` | `CircleProfile` |
| POST | `/auth/refresh-token` | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| POST | `/auth/logout` | `{ refreshToken }` | opaque |

**`VerifyOtpData`:** `accessToken`, `refreshToken`, `user` (`CircleAuthUser`), optional `isNewUser`, `isProfileComplete`.

**`CircleAuthUser`:** `id`, `phone`, optional `username`, `email`, `verification_tier`, `is_profile_complete`.

**Google OAuth (browser):** Backend exposes `GET /auth/google` (redirect). The app implements **`/auth/google/callback`** (`src/app/(auth)/auth/google/callback/page.tsx`) and parses tokens from query, hash, or `data` param per backend contract — align redirect URI and token shape with the Circle backend.

---

## 2. Users (profile)

| Method | Path | Body | Response |
| ------ | ---- | ---- | -------- |
| GET | `/users/me` | — | `CircleProfile` |
| PUT | `/users/me` | Partial `{ username?, email?, avatar_url? }` | `CircleProfile` |

**`CircleProfile`:** `id`, `phone`, optional `username`, `email`, `dob`, `avatar_url`, `verification_tier`, `is_profile_complete`, `is_globally_banned`, `created_at`.

---

## 3. Events

| Method | Path | Auth | Notes |
| ------ | ---- | ---- | ----- |
| GET | `/events` | optional | Query: `page`, `limit`, `status`, `search`. Returns `{ success?, message?, data: CircleEvent[], meta }` at top level. |
| GET | `/events/slug/:slug` | optional Bearer | `CircleEvent` |
| GET | `/events/:id` | optional Bearer | `CircleEvent` |
| POST | `/events` | Bearer | Body: **`CircleEventCreateBody`** (snake_case wire fields; see `src/lib/circle/types.ts`). Returns `CircleEvent`. |
| PUT | `/events/:id` | Bearer | Body: **`CircleEventUpdateBody`** (`Partial<CircleEventCreateBody>`). Returns `CircleEvent`. |
| PUT | `/events/:id/publish` | Bearer | Returns `CircleEvent` |
| PUT | `/events/:id/cancel` | Bearer | — |
| DELETE | `/events/:id` | Bearer | — |
| GET | `/events/my` | Bearer | `CircleEvent[]` (hosted) |
| POST | `/events/:id/broadcast` | Bearer | Body: `subject`, `message`, optional `targetStatuses[]` |
| GET | `/events/:id/export/csv` | Bearer | CSV blob |

**`CircleEvent` (high level):** `id`, `title`, `description`, `max_capacity`, `price` (often a **decimal string** on read, e.g. `"520.00"`; numeric on write is accepted), `event_date`, optional `start_time` / `end_time`, `timezone`, `location`, `latitude` / `longitude`, `slug`, `cover_image_url`, `image_urls`, `status`, `visibility`, `category`, `tags`, refund/waitlist/registration fields, `faqs`, `more_about`, `whats_included`, `guest_suggestions`, `allowed_and_notes`, `house_rules`, `event_rules`, `location_type`, `tax_percentage`, `currency`, `terms_required`, `contact_email`, `contact_phone`, nested `host` (`CircleEventHost`), optional `questions` (`CircleEventQuestion[]`), and list metadata fields such as **`host_id`**, **`is_featured`**, **`created_at`**, **`updated_at`**, **`deleted_at`** when returned by the API.

**Example `GET /events?page=1&limit=20` envelope (shape):**

```json
{
  "success": true,
  "message": "Events list",
  "data": [
    {
      "id": "…",
      "title": "Summer Rooftop Meetup",
      "description": "Short description shown in listings.",
      "max_capacity": 80,
      "price": "499.00",
      "event_date": "2026-07-20T14:00:00.000Z",
      "start_time": "2026-07-20T14:00:00.000Z",
      "end_time": "2026-07-20T22:00:00.000Z",
      "timezone": "Asia/Kolkata",
      "location": "12 MG Road, Bengaluru, Karnataka",
      "latitude": 12.9716,
      "longitude": 77.5946,
      "visibility": "public",
      "min_age": 18,
      "min_verification_tier": 1,
      "waitlist_enabled": true,
      "refund_full_before_hours": 48,
      "refund_partial_before_hours": 24,
      "refund_partial_percentage": 50,
      "cover_image_url": "https://example.com/covers/rooftop.jpg",
      "image_urls": ["https://example.com/gallery/1.jpg"],
      "category": "Social",
      "tags": ["networking", "outdoor"],
      "faqs": [{ "q": "Is there parking?", "a": "Street parking nearby." }],
      "more_about": "Longer story for the detail page.",
      "whats_included": ["Welcome drink", "Snacks"],
      "guest_suggestions": ["Bring a light jacket"],
      "allowed_and_notes": "Accessibility notes.",
      "house_rules": { "dos": ["Respect staff"], "donts": ["No outside alcohol"] },
      "event_rules": "Age policy and conduct.",
      "location_type": "rooftop",
      "refund_policy": "Full refund if cancelled 48+ hours before start.",
      "tax_percentage": "18.00",
      "currency": "INR",
      "terms_required": true,
      "contact_email": "host@example.com",
      "contact_phone": "+919876543210",
      "registration_opens_at": "2026-06-01T00:00:00.000Z",
      "registration_closes_at": "2026-07-19T23:59:59.000Z",
      "host": { "id": "…", "username": "hostuser", "avatar_url": null }
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
}
```

**Host wizard (`src/app/(marketing)/host-a-meet/wizard.tsx`)** builds **`CircleEventCreateBody`**: core scheduling, pricing, media, visibility, refunds, registration window, long-form fields, `house_rules`, `event_rules`, `location_type`, tax/currency, lat/lng, then **`POST /events`**, pre-join questions via **`/events/:id/questions`**, and **`PUT /events/:id/publish`**.

---

## 4. Event questions

| Method | Path | Body | Response |
| ------ | ---- | ---- | -------- |
| GET | `/events/:eventId/questions` | — | `CircleEventQuestion[]` |
| POST | `/events/:eventId/questions` | `CircleEventQuestionInput` | `CircleEventQuestion` |
| PUT | `/events/:eventId/questions/:questionId` | partial input | `CircleEventQuestion` |
| DELETE | `/events/:eventId/questions/:questionId` | — | — |

**`CircleEventQuestion`:** `id`, `question_text`, `question_type`, optional `options`, `is_required`, `is_base`, `sort_order`.

The join UI only surfaces `single_select` and `multi_select` for guest answers; other types may be ignored until extended.

---

## 5. Applications & payments

| Method | Path | Body | Response |
| ------ | ---- | ---- | -------- |
| POST | `/applications/events/:eventId/apply` | `{ answers: { question_id, answer }[] }` | `ApplyToEventData` |
| GET | `/applications/events/:eventId` | query: `status`, `page`, `limit` | list + meta → `CircleEventApplicationRow[]` |
| PUT | `/applications/events/:eventId/select` | `{ application_ids: string[] }` | `SelectApplicationsData` (`selected`, `rejected`) |
| PUT | `/applications/:applicationId/cancel` | — | `CancelApplicationData` |
| PUT | `/applications/:applicationId/uninvite` | `{ reason }` | `UninviteApplicationData` |
| GET | `/applications/me` | — | `CircleMyApplication[]` |
| GET | `/applications/:applicationId/waitlist-position` | — | `WaitlistPositionData` |
| POST | `/applications/:applicationId/accept-offer` | — | `AcceptOfferData` |
| GET | `/applications/:applicationId/booking-summary` | — | booking breakdown (tax, totals) |
| GET | `/payments/:paymentId` | — | `CirclePaymentDetails` |
| GET | `/payments/my/history` | query: `page`, `limit` | paginated payment rows |

**Apply / accept-offer payment:** `CircleRazorpayOrderPayload` — the app expects Razorpay order fields (see **Gaps**). Amount must be a **number** suitable for Checkout (typically smallest currency unit for INR).

**`CircleMyApplication`:** includes `event` summary, `payment` with optional `id` for invoice and payment modal.

---

## 6. Check-in

| Method | Path | Body | Response |
| ------ | ---- | ---- | -------- |
| POST | `/checkin/:applicationId/generate` | — | `CheckinGenerateData` (`otp`, `expiresInSeconds`, `message`) |
| POST | `/checkin/:applicationId/verify` | `{ otp }` | `CheckinVerifyData` |
| GET | `/checkin/event/:eventId/status` | — | `CheckinEventStatusData` |

**`CheckinEventStatusData`:** `total`, `checkedIn`, `pending`, `attendees` (`CheckinAttendee[]` with `applicationId`, `user`, `isCheckedIn`, `checkedInAt`).

---

## 7. Tickets

| Method | Path | Auth | Response |
| ------ | ---- | ---- | -------- |
| GET | `/tickets/:applicationId` | Bearer | `CircleTicketDetail` — path uses **application id** |
| GET | `/tickets/:applicationId/qr` | Bearer | `CircleTicketQrData` (`qr_code` — image URL or data URL for `<img src>`) |
| GET | `/tickets/verify/:token` | none | `CircleTicketVerifyPublic` |

---

## 8. Invoices

| Method | Path | Auth | Response |
| ------ | ---- | ---- | -------- |
| GET | `/invoices/application/:applicationId` | Bearer | PDF `Blob` |

---

## 9. Notifications

| Method | Path | Response |
| ------ | ---- | -------- |
| GET | `/notifications?page&limit` | list + meta → `CircleApiNotification[]` |
| GET | `/notifications/unread-count` | `CircleUnreadCountData` (`count`) |
| PUT | `/notifications/read-all` | — |
| PUT | `/notifications/:id/read` | `CircleApiNotification` |

---

## 10. Reports (user)

| Method | Path | Body | Response |
| ------ | ---- | ---- | -------- |
| POST | `/reports` | `CircleSubmitReportBody` | `CircleReportRow` |
| GET | `/reports/my` | — | `CircleReportRow[]` |

---

## 11. Blacklists (host)

| Method | Path | Body | Response |
| ------ | ---- | ---- | -------- |
| POST | `/blacklists` | `{ user_id, event_id, reason }` | `CircleBlacklistRow` |
| DELETE | `/blacklists/:userId` | — | — |
| GET | `/blacklists/my` | — | `CircleBlacklistRow[]` |

---

## 12. Settlements (host)

| Method | Path | Response |
| ------ | ---- | -------- |
| GET | `/events/settlements/my` | `CircleSettlementRow[]` |
| GET | `/events/:eventId/settlement` | `CircleSettlementRow` — UI treats **404** as “no settlement yet”. |

---

## 13. Media

| Method | Path | Body | Response |
| ------ | ---- | ---- | -------- |
| POST | `/media/upload-url` | `{ fileName, fileType, folder }` | `{ uploadUrl, fileUrl or publicUrl, key or fileKey }` (variants) |
| DELETE | `/media` | `{ key, fileKey }` — client sends **both** with the same object key string so backends that expect either field work | — |

Upload uses `PUT` to `uploadUrl` (S3-style presigned) from the browser.

---

## 14. Extended — Saved events, prefs, host, ratings, support, payouts

Used when the Circle API is configured (`isCircleApiConfigured()`). See modules in `src/lib/circle/`.

| Method | Path | Notes |
| ------ | ---- | ----- |
| GET | `/saved-events` | Paginated list |
| POST | `/saved-events/:eventId` | Toggle save |
| GET | `/notification-preferences` | Per-type email/push/in_app |
| PUT | `/notification-preferences` | Batch update |
| GET | `/host-profile/me` | Host profile |
| PUT | `/host-profile/me` | Update display, bio, socials, etc. |
| GET | `/host-profile/me/onboarding` | Onboarding progress |
| GET | `/host-profile/me/dashboard` | Host stats |
| GET | `/host-profile/me/revenue?days=` | Revenue series |
| POST | `/ratings` | Guest rates host (`event_id`, `rating`, `comment`) |
| POST | `/support/tickets` | Create ticket |
| GET | `/support/tickets` | List my tickets |
| GET | `/payout-accounts` | List |
| POST | `/payout-accounts` | Add bank/UPI |
| PUT | `/payout-accounts/:id/primary` | Set primary |
| DELETE | `/payout-accounts/:id` | Remove |

---

## Gaps and backend alignment notes

1. **Envelope consistency:** Prefer `{ success, data }` everywhere `circleRequest` is used so unwrap behavior is predictable.
2. **Razorpay:** The UI does not POST payment proof to the backend after Checkout; confirm capture via **webhook** or document a future client endpoint. Order payloads may arrive as **snake_case** (`order_id`); the app normalizes to camelCase where implemented.
3. **Refresh token:** `POST /auth/refresh-token` is called on a timer when the user is logged in via Circle (see `CircleSessionBridge`).
4. **Profile page:** When the API is configured, the profile screen loads and saves via `GET/PUT /users/me` (display name ↔ `username`).
5. **Multi-select questions:** Encoded as JSON string in `answer` where needed; see join flow.
6. **Verify profile page:** Still a mock flow; real tier verification would use backend/admin processes beyond this doc.

---

## Second-pass verification (app UI)

| Area | Key components | Fields / endpoints exercised |
| ---- | -------------- | ---------------------------- |
| Auth | `CirclePhoneAuth` | send-otp, verify-otp, complete-profile, Google redirect URL |
| Profile | `profile/page` | GET/PUT `/users/me` when API configured |
| Explore / event | `EventMeetActions`, `CircleCatalogSync` | list events, get questions, apply, Razorpay |
| Bookings guest | `BookingsHub` | applications/me, payments, waitlist, cancel, accept-offer, check-in OTP, invoice blob, tickets, booking-summary |
| Bookings host | `CircleHostMeetSection` | list applications, select, uninvite, check-in verify, blacklists, settlements |
| Host wizard | `host-a-meet/wizard` | create/publish event, media upload, add questions |
| Notifications | `AppShell`, notifications page | unread-count, list, mark read |
| Reports | `reports/page` | submit, list mine |
| Public ticket | `tickets/verify/[token]` | verify public |
| Saved | `saved/page` | saved-events API when configured |
| Settings | `settings/page` | notification-preferences + local prefs |
| Payments | `payments/page` | payment history |
| Host | `host-profile/page` | host profile, dashboard, payouts |
| Support | `support/page` | support tickets |
| Reviews | `reviews/page` | POST ratings when API on |

Admin routes are **out of scope** for this file; see [circle-backend-admin-api.md](./circle-backend-admin-api.md).
