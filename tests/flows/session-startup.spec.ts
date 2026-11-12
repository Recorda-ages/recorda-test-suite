import { signedOut, storageStateOf, users } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import { STORAGE_KEYS } from "../../src/support/session";

const splashId = "splash-screen-container";

test.describe("Opening without a session", () => {
  test.use({ storageState: signedOut });

  test(
    "splash is the first screen and hands over to login",
    meta({
      description:
        "A fresh launch shows Splash before Login, without exposing authenticated screens.",
      requirement: ["RF-01.2", "RF-01.3"]
    }),
    async ({ page, loginPage, feedPage }) => {
      await test.step("opening the app shows only Splash", async () => {
        await page.goto("/");
        await expect(page.getByTestId(splashId)).toBeVisible();
        await expect(loginPage.root).toBeHidden();
        await expect(feedPage.root).toBeHidden();
      });
      await test.step("Splash hands over to Login", async () => {
        await loginPage.expectLoaded();
        await expect(page.getByTestId(splashId)).toBeHidden();
      });
    }
  );
});

test.describe("Opening with a saved user session", () => {
  test(
    "a saved user session opens the feed and survives reopening",
    meta({
      description:
        "Gabriel reaches Feed through Splash on both launch and reload, without entering credentials.",
      requirement: ["RF-01.2", "RF-01.4", "RF-04.6"]
    }),
    async ({ page, feedPage, loginPage }) => {
      for (const launch of ["first launch", "reopening"]) {
        await test.step(launch, async () => {
          await page.goto("/");
          await expect(page.getByTestId(splashId)).toBeVisible();
          await expect(feedPage.root).toBeHidden();
          await feedPage.expectLoaded();
          await expect(loginPage.root).toBeHidden();
          expect(
            await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEYS.token)
          ).toBeTruthy();
        });
      }
    }
  );
});

test.describe("Opening with a saved administrator session", () => {
  test.use({ storageState: storageStateOf(users.admin) });

  test(
    "a saved administrator session opens only the administrative area",
    meta({
      description:
        "Admin reaches the moderation area after Splash, with no user navigation, including after reopening.",
      requirement: ["RF-01.2", "RF-01.5"]
    }),
    async ({ page, feedPage, profilePage }) => {
      for (const launch of ["first launch", "reopening"]) {
        await test.step(launch, async () => {
          await page.goto("/");
          await expect(page.getByTestId(splashId)).toBeVisible();
          await expect(page.getByTestId("admin-reports-screen")).toBeVisible();
          await expect(page.getByTestId("admin-bottom-navigation")).toBeVisible();
          await expect(feedPage.root).toBeHidden();
          await expect(profilePage.root).toBeHidden();
          for (const tab of ["feed", "profile", "camera"]) {
            await expect(page.getByTestId(`tab-bar-${tab}`)).toHaveCount(0);
          }
        });
      }
    }
  );
});

test.describe("Opening with an unusable session", () => {
  test.use({ storageState: signedOut });

  // An expired JWT fixture; the server must reject it, never trust its stored USER role.
  const expiredToken = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: "expired-session", exp: 1 })).toString("base64url")}.invalid-signature`;
  for (const [kind, token] of [
    ["invalid", "not-a-valid-token"],
    ["expired", expiredToken]
  ] as const) {
    test(
      `an ${kind} session is cleared before returning to login`,
      meta({
        description: `An ${kind} saved token cannot open Feed; authentication storage is cleared and reopening stays signed out.`,
        requirement: "RF-01.6"
      }),
      async ({ page, loginPage, feedPage }) => {
        await page.addInitScript(
          ({ tokenKey, roleKey, token }) => {
            if (!sessionStorage.getItem("session-fixture-installed")) {
              localStorage.setItem(tokenKey, token);
              localStorage.setItem(roleKey, "USER");
              sessionStorage.setItem("session-fixture-installed", "true");
            }
          },
          { tokenKey: STORAGE_KEYS.token, roleKey: STORAGE_KEYS.role, token }
        );
        await test.step("the rejected session returns to Login and clears authentication", async () => {
          await page.goto("/");
          await loginPage.expectLoaded();
          for (const key of Object.values(STORAGE_KEYS)) {
            expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBeNull();
          }
          await expect(feedPage.root).toBeHidden();
        });
        await test.step("reopening remains signed out", async () => {
          await page.reload();
          await loginPage.expectLoaded();
          await expect(feedPage.root).toBeHidden();
        });
      }
    );
  }
});
