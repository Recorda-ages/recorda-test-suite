import { existsSync } from "node:fs";
import path from "node:path";

// Load `.env` once, without a dotenv dependency (Node >= 20.12). Real env vars win.
const envFile = path.resolve(__dirname, "../../.env");
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const isCI = !!process.env.CI;
// A Linux machine without a display (container, SSH) can't open a browser window.
const hasDisplay =
  process.platform !== "linux" || !!process.env.DISPLAY || !!process.env.WAYLAND_DISPLAY;

const TARGETS = ["dev", "prod"] as const;
export type Target = (typeof TARGETS)[number];
const target = (process.env.E2E_TARGET ?? "prod") as Target;
if (!TARGETS.includes(target)) {
  throw new Error(`E2E_TARGET must be one of ${TARGETS.join(", ")}; got "${target}"`);
}

/** Shared AWS demo backend (`dev` branch, seeded). The default target of the suite. */
export const DEPLOYED_API_URL = "https://77-113-61-139.sslip.io";

const apiURL = process.env.E2E_API_URL ?? DEPLOYED_API_URL;
/** Local Docker backend (seedable, disposable) vs. a shared deployed one. */
const isLocalApi = ["localhost", "127.0.0.1", "::1"].includes(new URL(apiURL).hostname);

// Seed passwords. The local stack uses the seed defaults (overridable with E2E_*_PASSWORD).
// A deployed backend keeps its own in deploy/.env.prod, so it reads separate variables and
// refuses to start without them instead of failing later with confusing 401s.
const PASSWORD_VARS = isLocalApi
  ? { user: "E2E_USER_PASSWORD", admin: "E2E_ADMIN_PASSWORD" }
  : { user: "E2E_DEPLOYED_USER_PASSWORD", admin: "E2E_DEPLOYED_ADMIN_PASSWORD" };

if (!isLocalApi) {
  const missing = Object.values(PASSWORD_VARS).filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(
      `E2E_API_URL points to a deployed backend (${apiURL}). Set ${missing.join(" and ")} ` +
        "in .env to the seed passwords configured on that server (SEED_USER_PASSWORD / " +
        "SEED_ADMIN_PASSWORD in deploy/.env.prod); ask whoever runs the deploy."
    );
  }
}

export const env = {
  /** Which frontend build is tested: production web export (default) or Expo dev server. */
  target,
  baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8081",
  apiURL,
  isLocalApi,
  frontendDir: path.resolve(
    __dirname,
    "../..",
    process.env.E2E_FRONTEND_DIR ?? "../recorda-frontend"
  ),
  userPassword: process.env[PASSWORD_VARS.user] ?? "User@1234",
  adminPassword: process.env[PASSWORD_VARS.admin] ?? "Admin@1234",
  skipWebServer: process.env.E2E_SKIP_WEB_SERVER === "1",
  isCI,
  /** Browser window is visible locally; hidden in CI, without a display or with E2E_HEADLESS=1. */
  headless: isCI || !hasDisplay || process.env.E2E_HEADLESS === "1",
  /** Milliseconds added after every browser action, to follow a run by eye. */
  slowMo: Number(process.env.E2E_SLOW_MO ?? 0)
} as const;

/** Directory where `auth.setup.ts` stores one storage state per account. */
export const AUTH_DIR = path.resolve(__dirname, "../../.auth");
