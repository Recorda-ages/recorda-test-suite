import path from "node:path";

import { AUTH_DIR, env } from "../config/env";

export type Role = "USER" | "ADMIN";

export type TestUser = {
  username: string;
  password: string;
  role: Role;
};

/**
 * Accounts created by `recorda-backend/scripts/seed.py`. The seed is idempotent and
 * restores these accounts on every run, so tests may rely on them existing.
 *
 * Treat them as read-mostly: a test that changes one of them (password, privacy, follows…)
 * must restore it, or create its own user instead (see `RecordaApi.register`).
 */
export const users = {
  /** Main demo account: onboarding done, follows other seed users, has Recordas. */
  gabriel: { username: "gabriel", password: env.userPassword, role: "USER" },
  /** Public account. */
  ana: { username: "ana", password: env.userPassword, role: "USER" },
  /** Private account; gabriel's follow is approved. */
  marina: { username: "marina", password: env.userPassword, role: "USER" },
  /** Private account; gabriel's follow request is still pending. */
  camila: { username: "camila", password: env.userPassword, role: "USER" },
  admin: { username: "admin", password: env.adminPassword, role: "ADMIN" }
} as const satisfies Record<string, TestUser>;

/** Accounts that get a saved session in the `setup` project. */
export const usersWithSavedSession: TestUser[] = [users.gabriel, users.admin];

/** Path of the saved session of `user`, for `test.use({ storageState: ... })`. */
export function storageStateOf(user: TestUser): string {
  return path.join(AUTH_DIR, `${user.username}.json`);
}

/** No cookies and no localStorage: the app boots signed out. */
export const signedOut = { cookies: [], origins: [] };
