# Backend handoff — quick reference

Detailed **user profile** field matrix and **two-pass audit** steps live in **[backend-requirements.md](./backend-requirements.md)** (User profile resource + Payload/response audit).

The web client maps extended `GET /users/me` fields in [`normalizeCircleProfile`](../src/lib/circle/api.ts) and sends optional `PUT` keys from the profile form as documented there.
