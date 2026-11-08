# recorda-test-suite

End-to-end tests for Recorda, using [Playwright](https://playwright.dev). They drive the
**web build** of `recorda-frontend` (Expo + react-native-web) at a phone viewport, against a
real `recorda-backend` with the demo data.

By default, `pnpm test` builds the **production web bundle** of your frontend checkout and
runs it against the **deployed AWS backend**. The local Docker stack is used for tests that
write data, and when you need a backend change that isn't deployed yet.

```text
Playwright (Pixel 7, Chromium, pt-BR)
   │
   ▼
recorda-frontend   expo export --platform web, served on http://localhost:8081
   │                (or the Expo dev server, with E2E_TARGET=dev)
   ▼
recorda-backend    https://77-113-61-139.sslip.io   AWS, shared demo        (default)
                   http://localhost:8000            Docker, seeded locally  (test:local)
```

## Requirements

- Node.js 22.13+
- pnpm 10+ (`corepack enable` picks the version pinned in `package.json`)
- The frontend repo next to this one (or set `E2E_FRONTEND_DIR` in `.env`):

  ```text
  PUCRS/
  ├── recorda-backend/     only needed for the local stack
  ├── recorda-frontend/
  └── recorda-test-suite/
  ```

- Docker, only for the local stack.

## Setup

```bash
# 1. This repo
pnpm install
pnpm exec playwright install chromium
cp .env.example .env     # then fill in E2E_DEPLOYED_USER_PASSWORD / _ADMIN_PASSWORD

# 2. Frontend dependencies (the suite builds and serves the app for you)
(cd ../recorda-frontend && npm ci)   # the frontend repo uses npm

# 3. Only for the local stack: start API + Postgres and load the demo data
pnpm stack:up
pnpm stack:seed
```

## Running

| Command                | Frontend         |
| ---------------------- | ---------------- |
| `pnpm test`            | Production build |
| `pnpm test:local`      | Dev server       |
| `pnpm test:local:prod` | Production build |

These follow the same defaults (production build + AWS) unless you set `E2E_TARGET` /
`E2E_API_URL`:

| Command              | What it does                                  |
| -------------------- | --------------------------------------------- |
| `pnpm test:smoke`    | Only tests tagged `@smoke`                    |
| `pnpm test:ui`       | Playwright UI mode (watch, time-travel debug) |
| `pnpm test:headless` | Full suite without opening windows            |
| `pnpm test:watch`    | One window at a time, slowed down to follow   |
| `pnpm test:debug`    | Step through with the inspector               |
| `pnpm report`        | Open the last HTML report                     |
| `pnpm codegen`       | Record locators against the running app       |
| `pnpm typecheck`     | TypeScript check                              |
| `pnpm requirements:check` | Every test has name, description, requirement; coverage per epic |
| `pnpm requirements:doc`   | Regenerate `docs/REQUIREMENTS.md` (catalog + coverage) |
| `pnpm stack:down`    | Stop the local backend containers             |

For a quick loop against the local stack in UI mode, combine them:
`E2E_TARGET=dev E2E_API_URL=http://localhost:8000 pnpm test:ui`.

## Which build is tested

| `E2E_TARGET`     | Frontend served by                                    | Use it                       |
| ---------------- | ----------------------------------------------------- | ---------------------------- |
| `prod` (default) | `expo export --platform web` into `.build/web`, served as a static SPA: minified, `__DEV__` false | Default, before merging, CI |
| `dev`            | `expo start --web`: Metro dev server, `__DEV__` true  | While writing tests and code |

The production build is rebuilt from scratch on every run (`--clear`, ~35 s), so it always
tests the current checkout with the current API URL baked in. A setup check fails the run
if the served bundle doesn't contain `E2E_API_URL`. It never reuses a server already running
on the port: stop your dev server first, or the run fails with "port already used".
Dev-only flags such as `EXPO_PUBLIC_MEMORY_CALENDAR_MOCK` have no effect in `prod`.

The dev server is reused if one is already running on `E2E_BASE_URL`. To manage it yourself,
run `npm run web` in the frontend with `EXPO_PUBLIC_API_URL` set, and `E2E_SKIP_WEB_SERVER=1`.

Neither target tests the native iOS/Android apps, which Playwright can't drive. The HTML
report shows the target and backend under *Metadata*.

## Which backend is used

| Backend            | `E2E_API_URL`                    | Notes                                    |
| ------------------ | -------------------------------- | ---------------------------------------- |
| Deployed (default) | `https://77-113-61-139.sslip.io` | Shared AWS demo backend, read-only tests |
| Local              | `http://localhost:8000`          | Docker, seeded by `pnpm stack:seed`; all tests run |

The deployed backend is the `dev` branch on AWS, seeded with the same demo accounts:

- **Passwords:** set `E2E_DEPLOYED_USER_PASSWORD` and `E2E_DEPLOYED_ADMIN_PASSWORD` in
  `.env` to the seed passwords configured on the server (`deploy/.env.prod`). The run refuses
  to start without them. Local runs ignore them. Never commit them.
- **Read-only:** other people use it for demos, so tests tagged `@mutates` are skipped, and
  `api.register()` throws. The suite never seeds it. Run `pnpm test:local` to cover those.
- **Version drift:** updating the server is manual, so it can lag behind `dev`. On
  2026-11-08 it was missing `GET /api/v1/users/me/metrics` (PR #156). A failure there may
  mean "not deployed yet" rather than a bug; compare `/openapi.json` with your local backend.
- **CORS:** it accepts `http://localhost:8081` (the default `E2E_BASE_URL`). Another port
  needs adding to `CORS_ORIGINS` on the server.

## Visible browser

Locally the app opens in a visible Chromium window (one per worker, so up to four at a
time). It stays headless in CI, on machines without a display, or with `E2E_HEADLESS=1`.
`E2E_SLOW_MO=<ms>` slows each action down; `pnpm test:watch` combines it with a single
worker so you can follow one flow from start to finish.

With the dev server, the first test of a run takes ~30 s while Metro bundles the app; later
tests are fast.

## Layout

```text
playwright.config.ts      projects, webServer, timeouts, artifacts
src/
  config/env.ts           every environment variable, with defaults
  data/users.ts           seeded accounts + saved-session paths
  fixtures/index.ts       `test` / `meta` / `expect`: import these in every spec
  pages/                  page objects (one per screen) + shared components
  requirements/
    catalog.ts            requirement IDs (from the charter + Epics/US issues)
    annotations.ts        `meta()`: name/description/requirement metadata + guard
  support/
    api.ts                backend client (arrange data, verify side effects)
    app.ts                multi-screen navigation (launch, sign in, go to settings…)
    i18n.ts               `t("key")` reads UI copy from the frontend's locale files
    session.ts            localStorage keys and storage-state builder
scripts/requirements.ts   requirements:check / requirements:doc
docs/
  GUIDELINES.md           how to write tests
  REQUIREMENTS.md         generated requirements + traceability (don't edit by hand)
tests/
  setup/auth.setup.ts     saves a logged-in session per account (runs first)
  auth/                   sign-in, sign-up, password recovery
  flows/                  multi-screen user journeys
```

Read **[docs/GUIDELINES.md](docs/GUIDELINES.md)** before writing a test. Every test verifies
a requirement from **[docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)**.
