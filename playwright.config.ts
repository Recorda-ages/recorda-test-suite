import { defineConfig, devices } from "@playwright/test";

import { env } from "./src/config/env";
import { webServer } from "./src/config/webServer";
import { storageStateOf, users } from "./src/data/users";
import { LOCALE } from "./src/support/i18n";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: env.isCI,
  // A deployed backend is shared (demos, other people's data): skip tests that write to it.
  grepInvert: env.isLocalApi ? undefined : /@mutates/,
  retries: env.isCI ? 2 : 0,
  workers: env.isCI ? 2 : undefined,
  timeout: 60_000,
  // Shown at the top of the HTML report, so a report always says which build it tested.
  metadata: { target: env.target, baseURL: env.baseURL, apiURL: env.apiURL, backend: env.isLocalApi ? "local" : "deployed" },
  expect: { timeout: 10_000 },
  reporter: env.isCI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: env.baseURL,
    headless: env.headless,
    launchOptions: { slowMo: env.slowMo },
    locale: LOCALE,
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },

  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/
    },
    {
      // Recorda is a mobile app; the web build is tested at a phone viewport.
      name: "mobile-chromium",
      testIgnore: /.*\.setup\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Pixel 7"],
        storageState: storageStateOf(users.gabriel)
      }
    }
  ],

  // Serves the frontend: Expo dev server (E2E_TARGET=dev, default) or a production export
  // (E2E_TARGET=prod). See src/config/webServer.ts.
  // The backend is not started here: run `pnpm stack:up && pnpm stack:seed` first.
  webServer
});
