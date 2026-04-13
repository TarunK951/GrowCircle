import createWebStorage from "redux-persist/lib/storage/createWebStorage";

const noopAsync = {
  getItem: (_key: string) => Promise.resolve(null),
  setItem: (_key: string, _value: string) => Promise.resolve(),
  removeItem: (_key: string) => Promise.resolve(),
};

/**
 * Do not import `redux-persist/lib/storage` at load time — it calls into
 * `getStorage`, which logs an error when `localStorage` is missing (Node SSR).
 * Client bundles run in the browser where `window` exists; server uses noop.
 */
export const reduxPersistStorage =
  typeof window !== "undefined"
    ? createWebStorage("local")
    : (noopAsync as ReturnType<typeof createWebStorage>);
