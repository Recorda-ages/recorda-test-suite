import path from "node:path";

import type { PlaywrightTestConfig } from "@playwright/test";

import { env } from "./env";

type WebServer = NonNullable<PlaywrightTestConfig["webServer"]>;

const SUITE_DIR = path.resolve(__dirname, "../..");
/** Output of `expo export` for the prod target. Rebuilt on every prod run. */
export const WEB_BUILD_DIR = path.join(SUITE_DIR, ".build/web");

const port = new URL(env.baseURL).port || "8081";

// pnpm exports its settings as npm_config_* variables; npm (via `npx`) warns about the ones it
// doesn't know ("Unknown env config ..."). Playwright merges this env over process.env and
// Node drops `undefined` entries when spawning, so this removes them from the web server only.
const withoutPnpmConfig = Object.fromEntries(
  Object.keys(process.env)
    .filter((key) => key.toLowerCase().startsWith("npm_config_"))
    .map((key) => [key, undefined])
) as unknown as Record<string, string>; // WebServer.env is typed string-only

// The frontend repo is npm-managed, hence `npx` for Expo commands run inside it.
// EXPO_PUBLIC_* values are inlined into the bundle, so the API URL is set here.
const expoEnv = {
  ...withoutPnpmConfig,
  CI: "1", // non-interactive Expo CLI
  BROWSER: "none",
  EXPO_PUBLIC_API_URL: env.apiURL
};

/**
 * `dev`: Expo dev server (Metro). Fast to iterate, unminified, `__DEV__ === true`.
 * Reuses a dev server you already have running on the same port.
 */
const devServer: WebServer = {
  command: `npx expo start --web --port ${port}`,
  cwd: env.frontendDir,
  url: env.baseURL,
  reuseExistingServer: !env.isCI,
  timeout: 180_000,
  stdout: "ignore",
  stderr: "pipe",
  env: expoEnv
};

/**
 * `prod`: the static bundle users would get (`expo export`, minified, `__DEV__ === false`,
 * dev-only mock flags ignored), served as a single-page app.
 *
 * `--clear` is required: Metro caches transformed modules without keying on EXPO_PUBLIC_*
 * values, so without it a build can silently keep the API URL of a previous run.
 *
 * Never reuses a running server: if something already listens on the port (e.g. a dev
 * server), the run fails instead of silently testing the wrong build.
 */
const prodServer: WebServer = {
  command: [
    // Two Metro workers keep peak memory around 1.3 GB; the default (one per core) can get
    // the build OOM-killed on an 8 GB laptop with an editor open.
    `npx expo export --platform web --clear --max-workers 2 --output-dir "${WEB_BUILD_DIR}"`,
    `"${path.join(SUITE_DIR, "node_modules/.bin/serve")}" "${WEB_BUILD_DIR}" --single --no-clipboard --no-request-logging --listen ${port}`
  ].join(" && "),
  cwd: env.frontendDir,
  url: env.baseURL,
  reuseExistingServer: false,
  timeout: 300_000,
  stdout: "ignore",
  stderr: "pipe",
  env: { ...expoEnv, NODE_ENV: "production" }
};

export const webServer: WebServer | undefined = env.skipWebServer
  ? undefined
  : env.target === "prod"
    ? prodServer
    : devServer;
