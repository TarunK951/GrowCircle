/**
 * localStorage keys used by this app (for debugging, support, and reset).
 *
 * - Redux Persist (auth): `growcircle-auth` — see `src/lib/store/store.ts`
 * - Zustand persist (session): `connectsphere-session` — see `src/stores/session-store.ts`
 *
 * To clear local app state in dev tools: Application → Local Storage → remove one or both keys.
 * Auth uses Redux `persistor.purge()` on full reset flows when implemented.
 */
export const REDUX_PERSIST_AUTH_KEY = "growcircle-auth";
export const ZUSTAND_SESSION_KEY = "connectsphere-session";
