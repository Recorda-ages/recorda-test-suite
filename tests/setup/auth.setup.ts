import { mkdirSync, writeFileSync } from "node:fs";

import { env, AUTH_DIR } from "../../src/config/env";
import { storageStateOf, usersWithSavedSession } from "../../src/data/users";
import { expect, test } from "../../src/fixtures";
import { storageStateFor } from "../../src/support/session";

/**
 * Runs once before the browser projects. Logs each account in through the API (fast, no
 * browser) and saves a storage state with the token in localStorage, which is exactly what
 * the web build reads on boot. Signing in through the UI is covered by `sign-in.spec.ts`.
 */
test.beforeAll(() => mkdirSync(AUTH_DIR, { recursive: true }));

test("backend is up", async ({ api }) => {
  await api.health();
});

// The API URL is baked into the bundle at build time, so check the served build really calls
// the backend this run is configured for (and not, say, a stale local URL).
test("web build calls the configured backend", async ({ request }) => {
  test.skip(env.target !== "prod", "the dev server reads EXPO_PUBLIC_API_URL when it starts");
  const html = await (await request.get(env.baseURL)).text();
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((m) => m[1]!);
  expect(scripts.length, "no <script> in index.html").toBeGreaterThan(0);
  const bundles = await Promise.all(
    scripts.map(async (src) => (await request.get(new URL(src, env.baseURL).href)).text())
  );
  expect(
    bundles.some((code) => code.includes(env.apiURL)),
    `the served bundle does not contain ${env.apiURL}`
  ).toBe(true);
});

for (const user of usersWithSavedSession) {
  test(`save session for ${user.username}`, async ({ api }) => {
    const session = await api.login(user);
    writeFileSync(storageStateOf(user), JSON.stringify(storageStateFor(env.baseURL, session)));
  });
}
