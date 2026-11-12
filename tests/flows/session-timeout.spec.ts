import type { Page } from "@playwright/test";

import { expect, meta, test } from "../../src/fixtures";

/** Hold a real session response at the HTTP boundary, not a fabricated user payload. */
async function holdSessionResponse(page: Page) {
  let release!: () => void;
  let ready!: () => void;
  let delivered!: () => void;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requested = new Promise<void>((resolve) => {
    ready = resolve;
  });
  const completed = new Promise<void>((resolve) => {
    delivered = resolve;
  });
  await page.route("**/api/v1/auth/me", async (route) => {
    try {
      const response = await route.fetch();
      expect(response).toBeOK();
      ready();
      await released;
      await route.fulfill({ response });
    } finally {
      delivered();
    }
  });
  return { requested, release, completed };
}

async function openWithFrozenClock(page: Page) {
  const now = new Date();
  await page.clock.install({ time: now });
  await page.clock.pauseAt(now);
  await page.goto("/");
  await expect(page.getByTestId("splash-screen-container")).toBeVisible();
}

test.describe("Session verification deadline", () => {
  test(
    "a slow session check sends the user to login after three seconds",
    meta({
      description:
        "When session verification exceeds the required three-second deadline, Splash must give way to Login.",
      requirement: "RF-01.7"
    }),
    async ({ page, loginPage }) => {
      // RF-01.7: frontend currently uses 5000 ms instead of the required 3000 ms.
      const pending = await holdSessionResponse(page);
      try {
        await test.step("hold the real session response while Splash is visible", async () => {
          await openWithFrozenClock(page);
          await pending.requested;
        });
        await test.step("crossing the three-second deadline opens Login", async () => {
          test.fail();
          await page.clock.runFor(3001);
          await expect(loginPage.root).toBeVisible({ timeout: 1000 });
        });
      } finally {
        pending.release();
        await pending.completed;
      }
    }
  );

  test(
    "a late valid session response cannot navigate away from login",
    meta({
      description:
        "After the current timeout sends the user to Login, releasing a real successful session response cannot reopen Feed or admin.",
      requirement: "RF-01.7"
    }),
    async ({ page, loginPage, feedPage }) => {
      const pending = await holdSessionResponse(page);
      try {
        await test.step("wait for Login with the session response held", async () => {
          await openWithFrozenClock(page);
          await pending.requested;
          // Current implementation deadline; the separate expected-failure test enforces 3 s.
          await page.clock.runFor(5001);
          await loginPage.expectLoaded();
        });
        await test.step("release the late response and keep Login as the only destination", async () => {
          pending.release();
          await pending.completed;
          await page.clock.runFor(1501);
          await loginPage.expectLoaded();
          await expect(feedPage.root).toBeHidden();
          await expect(page.getByTestId("admin-reports-screen")).toBeHidden();
          await expect(page.getByTestId("splash-screen-container")).toBeHidden();
        });
      } finally {
        pending.release();
      }
    }
  );
});
