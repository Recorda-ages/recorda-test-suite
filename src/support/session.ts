import type { LoginResponse } from "./api";

/**
 * Keys the web build uses in localStorage (see `recorda-frontend/src/features/auth/session.ts`
 * and `src/services/storage/secureStorage.ts`). On web, expo-secure-store is replaced by
 * localStorage, so a session is just these two entries.
 */
export const STORAGE_KEYS = {
  token: "auth_token",
  role: "role"
} as const;

/** Builds a Playwright storage state equivalent to a signed-in browser. */
export function storageStateFor(baseURL: string, session: LoginResponse) {
  return {
    cookies: [],
    origins: [
      {
        origin: new URL(baseURL).origin,
        localStorage: [
          { name: STORAGE_KEYS.token, value: session.access_token },
          { name: STORAGE_KEYS.role, value: session.user.role }
        ]
      }
    ]
  };
}
