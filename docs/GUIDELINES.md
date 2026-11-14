# Writing E2E tests for Recorda

These rules keep the suite fast, readable and stable. When a rule gets in your way, raise
it with the team instead of working around it quietly.

## 1. What belongs here

E2E tests cover **user journeys across screens and the real backend**: sign in → feed →
settings → sign out, create a Recorda → see it on the profile, follow someone → see their
posts.

They do **not** repeat what the other layers already test:

| Check                                      | Where it belongs                         |
| ------------------------------------------ | ---------------------------------------- |
| A component's states, validation messages  | `recorda-frontend/tests` (Jest + RNTL)   |
| An endpoint's status codes and payloads    | `recorda-backend/tests` (pytest)         |
| A screen working with the real API, end to end | **here**                             |

Rule of thumb: if the test needs only one screen and mocked data, it is not an E2E test.

## 2. Anatomy of a spec

Every test starts from a requirement. Find it in
[REQUIREMENTS.md](REQUIREMENTS.md) (generated from `src/requirements/catalog.ts`), then
declare the test with its three mandatory fields: **name**, **description** and
**requirement ID**.

```ts
import { users } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";   // never from "@playwright/test"

test.describe("Feature or journey", () => {
  test(
    "invalid credentials show one generic error",              // name
    meta({
      description:                                              // what and why, 1–2 sentences
        "A wrong password and an unknown username both keep the user on Login with the " +
        "same message, so the error never reveals which field is wrong.",
      requirement: "RF-04.3"                                    // or ["RF-04.1", "RF-04.5"]
    }),
    async ({ app, loginPage }) => {
      await test.step("what the user does or sees", async () => {
        await app.launch();
        await loginPage.expectLoaded();
      });
    }
  );
});
```

The fields are enforced three ways:

- An unknown requirement ID is a **type error** (`pnpm typecheck`).
- A test declared without `meta()` **fails when it runs**, with a message pointing here.
- **`pnpm requirements:check`** lists every test without running it and fails on a missing
  name, description or ID, an unknown ID, or a duplicated name. It also prints coverage per
  epic.

Rules for the requirement field:

- Reference the **most specific** requirement the test proves (`RF-04.3`, not "US 4"). A
  flow test may list several.
- Only reference what the test **asserts**. Visiting a screen on the way doesn't count.
- If the behavior has no requirement, don't invent an ID: add it to the catalog (or to
  `OPEN_QUESTIONS` if the stories disagree), regenerate the doc, and get it agreed.
- Requirements marked *native* or *manual* can't be proven by this suite; don't write
  web tests that pretend to.
- Requirements with a **known gap** (⚠️ in `REQUIREMENTS.md`, `gap` in the catalog) are
  decided but not implemented yet. Their test should describe the decided behavior and be
  marked `test.fail()` with a comment naming the ID. Playwright then reports it as an
  expected failure, and as an error once the code is fixed: that's the signal to remove
  `test.fail()` and the `gap` from the catalog.
- After adding or changing tests, run `pnpm requirements:doc` so the coverage columns in
  `REQUIREMENTS.md` stay current.

- **Name tests by behavior**, not implementation: "invalid credentials show an error",
  not "test 401".
- **Use `test.step`** in flows. Step names appear in the report and the trace, so a failure
  reads like "failed at: confirming sign-out returns to login".
- **Assert in the spec, act in the page object.** Page objects expose locators and actions;
  `expectLoaded()` is the only assertion they own.
- **Tag with `@mutates`** every test that writes to the backend (creates users, posts,
  likes, follows, changes settings). They run against the local stack only and are skipped
  on the shared deployed backend. Signing in and out doesn't count: it writes nothing.
- One spec file per feature or journey: `tests/<feature>/<name>.spec.ts`, multi-screen
  journeys in `tests/flows/`.

## 3. Fixtures

Destructure only what you use; fixtures are lazy.

| Fixture                     | Use it for                                                    |
| --------------------------- | ------------------------------------------------------------- |
| `app`                       | `launch()`, `launchAs(session)`, `signInThroughUi(user)`, `goToProfile()`, `goToUserProfile(username)`, `goToSettings()` |
| `loginPage`, `feedPage`, `profilePage`, `userProfilePage`, `userSearchPage`, `settingsPage` | Locators and actions of one screen |
| `api`                       | Arrange data and check side effects through the backend       |
| `page`                      | Raw Playwright access, when nothing above fits                |

Add a fixture when **three or more specs** need the same setup. Until then, a helper inside
the spec is fine.

### Authentication

Sessions come from **storage state**, not from a login fixture:

- `tests/setup/auth.setup.ts` logs each account in through the API and saves
  `.auth/<username>.json`. It runs before every browser project.
- The `mobile-chromium` project starts **signed in as `gabriel`** by default.
- Change it per file:

  ```ts
  import { signedOut, storageStateOf, users } from "../../src/data/users";

  test.use({ storageState: signedOut });                    // login screen
  test.use({ storageState: storageStateOf(users.admin) });  // admin area
  ```

- To add an account, put it in `usersWithSavedSession` in `src/data/users.ts`.
- A user created by the test (`api.register`) has no saved session: start the file
  `signedOut` and open the app with `app.launchAs(session)`.
- Sign in through the UI **only** in tests about signing in (`tests/auth/`). Everywhere
  else, a saved session is faster and keeps login problems from failing unrelated tests.

## 4. Locators

Priority order:

1. **`getByTestId`** for structure: screens, lists, cards, inputs. react-native-web renders
   `testID` as `data-testid`, so every `testID` in the frontend is usable.
2. **`getByRole(role, { name: t("…") })`** for buttons and tabs without a testID, with the
   name taken from the locale files.
3. **Never** CSS classes (`.r-alignItems-1awozwy` is generated), DOM shape (`div > div`) or
   `nth()` on unrelated elements.

**Missing testID?** Add it in `recorda-frontend` in the same task (a one-line PR), using the
existing `kebab-case` style (`feed-screen`, `like-button-<id>`). Don't build a fragile
locator to avoid touching the frontend. Leave a `TODO(frontend)` if it can't be done yet.

### Scope everything to the screen root

On web, `@react-navigation/native-stack` **keeps earlier screens mounted**. After
Feed → Profile, the DOM holds two `tab-bar-profile` elements. Locators built from `page`
then fail strict mode, or worse, match a screen the user can't see.

```ts
// ✅ inside the page object
this.root = page.getByTestId("profile-screen");
this.settingsButton = this.root.getByRole("button", { name: t("settings.title") });
this.tabBar = new BottomTabBar(this.root);

// ❌
this.tabBar = new BottomTabBar(page);
```

The exception is **modals and dialogs** (`Modal` renders in a portal outside the screen),
which are located from `page` (see `SettingsPage.signOutDialog`).

### Text and language

Seeded accounts use **pt-BR**, and the app switches to the account's language after login.
The browser locale is pinned to `pt-BR` to match. Never hard-code copy: use
`t("settings.signOut")`, which reads `recorda-frontend/src/i18n/locales/pt-BR.json`, so a
copy change doesn't break tests and a removed key fails loudly.

## 5. Waiting

- **Web-first assertions only**: `await expect(locator).toBeVisible()`. They retry until the
  timeout.
- **Never** `page.waitForTimeout()`. If you need it, the test is missing an assertion on the
  state you are waiting for.
- A screen transition is finished when the new screen's `expectLoaded()` passes. Page object
  actions that navigate should be followed by it, as `App` does.
- The Splash stays on screen for at least 1.5 s. `app.launch()` already waits for it.
- To wait for the backend, wait for what the user sees (a card appears), or use
  `page.waitForResponse("**/api/v1/feed/**")` when the UI gives no signal.

## 6. Navigation

The app has **no URL routing**: every `page.goto("/")` boots at the Splash. Reach screens
through the UI, and put routes used more than once in `src/support/app.ts`
(`goToSettings()` = tab bar → profile → cog).

Reloading the page restarts the app. That is the right way to test "the session survives /
is cleared after reopening the app".

## 7. Test data

- The backend seed is **idempotent** and restores its fixtures on every run. Run
  `pnpm stack:seed` before a local session or in CI. The deployed backend is seeded by
  whoever runs the deploy; never seed or modify it from the suite.
- Seeded accounts are **shared by parallel workers**. A test may read their data freely, but:
  - **Changes that other tests can see** (privacy, password, follows, deleting a Recorda) need
    a dedicated user: create one with `api.register({ username: \`e2e-${Date.now()}\`, … })`.
  - Content a test creates (comments, likes, Recordas) must be **unique** (timestamp or
    `testInfo.testId` in the text) and must be the only thing the test asserts on.
- Signing out is safe on shared accounts: tokens are stateless JWTs and sign-out only
  clears the browser's localStorage.
- Don't assert exact counts of seeded content ("20 posts"). Assert presence ("at least one
  card") or arrange the exact data yourself.

## 8. Independence

- Every test must pass **alone, in any order, in parallel** (`fullyParallel: true`). Check
  with `pnpm exec playwright test path/to/spec --repeat-each=5`.
- No shared variables between tests, and no `test.describe.serial` unless the journey really
  can't be split. Prefer one long test with steps.
- Each test gets a fresh browser context; there is nothing to clean up in the browser.

## 9. Debugging failures

- `pnpm test:ui`: time-travel through every action.
- Failures keep a **trace, screenshot and video** in `test-results/`.
  `pnpm exec playwright show-trace test-results/<test>/trace.zip` shows DOM snapshots, network
  calls and console logs at each step.
- `pnpm codegen` records locators against the running app (check they follow §4).

## 10. Before opening a PR

- [ ] `pnpm typecheck` passes
- [ ] `pnpm requirements:check` passes, and `docs/REQUIREMENTS.md` is regenerated (`pnpm requirements:doc`)
- [ ] New specs pass with `--repeat-each=3`
- [ ] `pnpm test` (production build + AWS) passes
- [ ] `pnpm test:local` passes, if you added or changed `@mutates` tests
- [ ] No `waitForTimeout`, no `test.only`, no hard-coded copy
- [ ] Locators are scoped to a screen root and use testIDs or roles
- [ ] Any testID you added to the frontend is linked in the PR

## Known frontend gaps

Fixing these makes tests simpler. Remove an item when it lands.

- `AuthFormError` has no `testID`; `LoginPage.formError` uses the live region instead.
- `BottomTabBar` uses `accessibilityState.selected`, which react-native-web 0.21 does not
  output as `aria-selected`, so the active tab can't be asserted. This is an accessibility
  bug too: screen readers on web don't announce the active tab.
- No React Navigation `linking` config, so screens can't be opened directly by URL.
- On web, pressing the profile avatar within ~0.5 s of the profile opening leaves the avatar
  menu unopenable until the app reloads (react-native-paper's `Menu.show()` waits on a
  measurement that never resolves). `ProfilePage.openAvatarMenu()` waits 1 s before the
  press: the suite's only `waitForTimeout`, agreed as an exception until this is fixed.
- Changing the avatar doesn't work in the **web build only** (it works in Expo Go):
  `profileService.uploadAvatar` builds the upload with `File` from `expo-file-system`,
  which has no web support ("expo-file-system is not supported on web"), so no request is
  sent. The web test for `RF-28.2` has a `test.fail()` until the web build supports it.
