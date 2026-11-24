import type { Page } from "@playwright/test";

import { signedOut } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import { todayInSaoPaulo, type ProfilePage } from "../../src/pages";
import { uniqueId, type NewAccount, type RecordaApi } from "../../src/support/api";
import { t } from "../../src/support/i18n";

/**
 * FL-13: the retrospective, opened from the own profile. A test's Recordas are dated today,
 * so the only period offered is the current month (a preview, since it isn't over; the
 * backend offers years only once they end), and the app opens it straight away. To see the
 * period list, `offerAnEmptyPeriod` adds a month without Recordas to the offer. The poster
 * export (RF-39.4) needs the Instagram app or the gallery and is left to native tests.
 */
test.use({ storageState: signedOut });

const today = todayInSaoPaulo();
const RETROSPECTIVE = "**/api/v1/users/me/retrospectives?**";
const AVAILABLE = "**/api/v1/users/me/retrospectives/available";
/** A month before any test account existed: nothing to show for it. */
const EMPTY_MONTH = { year: 2025, month: 1 };

/** Adds EMPTY_MONTH to the periods the backend offers. */
async function offerAnEmptyPeriod(page: Page) {
  await page.route(AVAILABLE, async (route) => {
    const response = await route.fetch();
    const { periods } = (await response.json()) as { periods: unknown[] };
    await route.fulfill({
      response,
      json: {
        periods: [
          ...periods,
          {
            period_type: "MONTHLY",
            ...EMPTY_MONTH,
            label: "Janeiro 2025",
            total_memories: 1,
            is_preview: false
          }
        ]
      }
    });
  });
}

/**
 * Three Recordas today: two by `top` in Rock (one marking `friend`) and one by another artist
 * in Pop; `friend` likes and comments on one of them.
 */
async function monthOfMemories(api: RecordaApi, owner: NewAccount) {
  const tag = uniqueId();
  const top = `Retro Top ${tag}`;
  const friend = await api.createUser("retro-friend");
  await api.follow(owner, friend);
  const first = await api.createRecorda(owner, {
    description: `Retro 1 ${tag}`,
    songArtist: top,
    songGenre: "Rock",
    mentioned: [friend]
  });
  await api.createRecorda(owner, {
    description: `Retro 2 ${tag}`,
    songArtist: `Retro Other ${tag}`,
    songGenre: "Pop"
  });
  await api.createRecorda(owner, {
    description: `Retro 3 ${tag}`,
    songArtist: top,
    songGenre: "Rock"
  });
  await api.follow(friend, owner);
  await api.like(friend, first.recorda_id);
  await api.comment(friend, first.recorda_id, `Retro comment ${tag}`);
  return { top, friend };
}

/** Profile → Abrir retrospectiva: the only period, this month, opens at once. */
async function openThisMonth(profilePage: ProfilePage) {
  await profilePage.retrospective.openButton.click();
  await expect(profilePage.retrospective.viewer).toBeVisible();
}

test.describe("Retrospective", () => {
  test(
    "the profile lists the monthly and yearly retrospectives and opens one",
    meta({
      description:
        "With only this month to show, Abrir retrospectiva on the own profile opens its story " +
        "at once. With more periods it lists them, this month marked as a preview with its " +
        "Recorda count, and picking it opens its story.",
      requirement: "RF-39.1",
      tag: "@mutates"
    }),
    async ({ api, app, page, profilePage, newAccount }) => {
      await monthOfMemories(api, newAccount);
      const { retrospective } = profilePage;
      await app.launchAs(newAccount);
      await app.goToProfile();

      await test.step("with one period, the button opens its story", async () => {
        await openThisMonth(profilePage);
        await expect(retrospective.step).toHaveText(retrospective.stepText(1, 6));
        await expect(retrospective.viewer).toContainText(
          t("retrospective.total.title", { count: 3 })
        );
        await retrospective.closeButton.click();
        await expect(retrospective.viewer).toBeHidden();
      });

      await test.step("with more, it lists them and opens the one picked", async () => {
        await offerAnEmptyPeriod(page);
        await app.launch();
        await app.goToProfile();
        await retrospective.openButton.click();
        const month = retrospective.period(today.year, today.month);
        await expect(month).toContainText(t("retrospectiveFlow.monthly"));
        await expect(month).toContainText(t("retrospective.recordasCount", { count: 3 }));
        await expect(month).toContainText(t("retrospectiveFlow.preview"));
        await expect(retrospective.period(EMPTY_MONTH.year, EMPTY_MONTH.month)).toBeVisible();
        await month.click();
        await expect(retrospective.viewer).toContainText(
          t("retrospective.total.title", { count: 3 })
        );
      });
    }
  );

  test(
    "the story shows total, artists, genres, marked friends, engagement and the best streak",
    meta({
      description:
        "Stepping through the month's story: 3 Recordas, the top artist, the genres led by " +
        "Rock, the marked friend with 1 marking, then 1 like, 1 comment and a best streak of " +
        "1 day, ending on the summary.",
      requirement: "RF-39.3",
      tag: "@mutates"
    }),
    async ({ api, app, profilePage, newAccount }) => {
      const { top, friend } = await monthOfMemories(api, newAccount);
      const { retrospective } = profilePage;
      const { viewer } = retrospective;
      const slide = async (step: number, check: () => Promise<void>) => {
        await expect(retrospective.step).toHaveText(retrospective.stepText(step, 6));
        await check();
        await retrospective.nextZone.click();
      };

      await app.launchAs(newAccount);
      await app.goToProfile();
      await openThisMonth(profilePage);

      await slide(1, () =>
        expect(viewer).toContainText(t("retrospective.total.title", { count: 3 }))
      );
      await slide(2, async () => {
        await expect(viewer).toContainText(t("retrospective.artists.eyebrow"));
        await expect(viewer).toContainText(top);
      });
      await slide(3, async () => {
        await expect(viewer).toContainText(t("retrospective.genres.title"));
        await expect(viewer).toContainText("Rock");
      });
      await slide(4, async () => {
        await expect(viewer).toContainText(t("retrospective.tagged.title"));
        await expect(viewer).toContainText(friend.user.username);
        await expect(viewer).toContainText(t("retrospective.tagged.count", { count: 1 }));
      });
      await slide(5, async () => {
        await expect(viewer).toContainText(t("retrospective.engagement.title"));
        await expect(viewer).toContainText(t("retrospective.engagement.days", { count: 1 }));
      });
      await expect(retrospective.step).toHaveText(retrospective.stepText(6, 6));
      await expect(retrospective.summary).toBeVisible();
    }
  );

  test(
    "slides advance every 5 seconds, can be tapped back and forth and paused by holding",
    meta({
      description:
        "The story opens full screen with one progress segment per slide. After 5 seconds " +
        "it moves to the next slide by itself; tapping the right and left sides moves " +
        "forward and back; holding pauses it until released.",
      requirement: "RF-39.2",
      tag: "@mutates"
    }),
    async ({ api, app, page, profilePage, newAccount }) => {
      await monthOfMemories(api, newAccount);
      const { retrospective } = profilePage;
      const at = (step: number) =>
        expect(retrospective.step).toHaveText(retrospective.stepText(step, 6));
      // The page's clock, so 5 seconds can pass on demand.
      await page.clock.install();

      await app.launchAs(newAccount);
      await app.goToProfile();
      await openThisMonth(profilePage);
      await expect(retrospective.viewer).toBeInViewport({ ratio: 1 });
      await expect(retrospective.progressSegments).toHaveCount(6);

      await test.step("advances by itself after 5 seconds", async () => {
        await at(1);
        await page.clock.runFor(4_000);
        await at(1);
        await page.clock.runFor(1_100);
        await at(2);
      });

      await test.step("taps move forward and back", async () => {
        await retrospective.nextZone.click();
        await at(3);
        await retrospective.previousZone.click();
        await at(2);
      });

      await test.step("holding pauses until released", async () => {
        const box = (await retrospective.nextZone.boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.clock.runFor(8_000);
        await at(2);
        await page.mouse.up();
        await page.clock.runFor(5_100);
        await at(3);
      });
    }
  );

  test(
    "loading, error and an unavailable period each have their own state",
    meta({
      description:
        "While the month's retrospective loads the sheet shows a spinner; when it fails it " +
        "says so and Tentar novamente opens it; a period with nothing to show says there are " +
        "no Recordas in it.",
      requirement: "RF-39.5",
      tag: "@mutates"
    }),
    async ({ api, app, page, profilePage, newAccount }) => {
      await monthOfMemories(api, newAccount);
      const { retrospective } = profilePage;
      await app.launchAs(newAccount);
      await app.goToProfile();

      await test.step("loading, then an error with Tentar novamente", async () => {
        let release!: () => void;
        const held = new Promise<void>((resolve) => (release = resolve));
        await page.route(RETROSPECTIVE, async (route) => {
          await held;
          await route.fulfill({ status: 500, json: { detail: "E2E: unavailable" } });
        });
        await retrospective.openButton.click();
        await expect(retrospective.sheetLoading).toBeVisible();
        release();
        await expect(retrospective.sheetMessage).toContainText(
          t("retrospectiveFlow.detailsError"),
          { timeout: 15_000 }
        );
        await page.unroute(RETROSPECTIVE);
        await retrospective.sheetMessage
          .getByRole("button", { name: t("retrospectiveFlow.retry") })
          .click();
        await expect(retrospective.viewer).toBeVisible();
        await retrospective.closeButton.click();
        await expect(retrospective.viewer).toBeHidden();
      });

      await test.step("a period with nothing to show", async () => {
        await offerAnEmptyPeriod(page);
        await app.launch();
        await app.goToProfile();
        await retrospective.openButton.click();
        await retrospective.period(EMPTY_MONTH.year, EMPTY_MONTH.month).click();
        await expect(retrospective.sheetMessage).toContainText(
          t("retrospectiveFlow.emptyPeriod")
        );
      });
    }
  );
});
