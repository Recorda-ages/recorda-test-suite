import { signedOut } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import { uniqueId } from "../../src/support/api";
import { t } from "../../src/support/i18n";

/**
 * FL-13: the Métricas tab of the own profile. It opens on the last 30 days.
 */
test.describe("Memory metrics", () => {
  test.describe("with Recordas published today", () => {
    test.use({ storageState: signedOut });

    test(
      "the most recurring artist, the genre ranking and today's streak",
      meta({
        description:
          "With three Recordas today, two by one artist in Rock and one by another in Pop, " +
          "Métricas shows 3 Recordas, the first artist on top with 2 Recordas, Rock at 67% and " +
          "Pop at 33% with their bars, and a streak of 1 day.",
        requirement: ["RF-38.1", "RF-38.2", "RF-38.3"],
        tag: "@mutates"
      }),
      async ({ api, app, profilePage, newAccount }) => {
        const tag = uniqueId();
        const top = `Top Artist ${tag}`;
        const other = `Other Artist ${tag}`;
        for (const [artist, genre] of [
          [top, "Rock"],
          [other, "Pop"],
          [top, "Rock"]
        ] as const) {
          await api.createRecorda(newAccount, {
            description: `${artist} ${uniqueId()}`,
            songArtist: artist,
            songGenre: genre
          });
        }
        const { metrics } = profilePage;

        await app.launchAs(newAccount);
        await app.goToProfile();
        await profilePage.details.selectTab("metrics");
        await expect(metrics.total).toHaveText("3");

        await test.step("the most recurring artist comes first", async () => {
          await expect(metrics.artistRow(1)).toContainText(top);
          await expect(metrics.artistRow(1)).toContainText(
            t("memoriesMetrics.widgets.topArtists.countPlural", { count: 2 })
          );
          await expect(metrics.artistRow(2)).toContainText(other);
        });

        await test.step("genres ranked with percentage bars", async () => {
          await expect(metrics.genreRow(1)).toContainText("Rock");
          await expect(metrics.genreRow(1)).toContainText("67%");
          // TODO(frontend): react-native-web 0.21 drops accessibilityValue, so the bar is
          // measured: its fill covers 67% of the track.
          const fill = profilePage.root.getByTestId("top-genre-fill-1");
          await expect
            .poll(() =>
              fill.evaluate((bar) => {
                const track = bar.parentElement!.getBoundingClientRect().width;
                return Math.round((bar.getBoundingClientRect().width / track) * 100);
              })
            )
            .toBe(67);
          await expect(metrics.genreRow(2)).toContainText("Pop");
          await expect(metrics.genreRow(2)).toContainText("33%");
        });

        await test.step("a streak of one day", async () => {
          await expect(metrics.streakValue).toHaveText("1");
          await expect(metrics.streak).toContainText(t("memoriesMetrics.widgets.streak.daySingular"));
        });
      }
    );

    test(
      "the genre ranking shows how many Recordas each genre has",
      meta({
        description: "Next to each genre's percentage, the ranking shows its Recorda count.",
        requirement: "RF-38.2",
        tag: "@mutates"
      }),
      async ({ api, app, profilePage, newAccount }) => {
        // RF-38.2 (gap): TopGenresRankingCard shows only the name and the percentage.
        test.fail();
        await api.createRecorda(newAccount, { description: `Rock ${uniqueId()}`, songGenre: "Rock" });
        await api.createRecorda(newAccount, { description: `Rock ${uniqueId()}`, songGenre: "Rock" });

        await app.launchAs(newAccount);
        await app.goToProfile();
        await profilePage.details.selectTab("metrics");
        await expect(profilePage.metrics.genreRow(1)).toContainText("Rock");
        await expect(profilePage.metrics.genreRow(1)).toContainText(/\b2\b/, { timeout: 3_000 });
      }
    );

    test(
      "without Recordas in the period there is an empty state",
      meta({
        description:
          "A new account's Métricas says there are no Recordas in the period yet, suggests " +
          "registering a memory and offers Criar Recorda, with no metric cards.",
        requirement: "RF-38.6",
        tag: "@mutates"
      }),
      async ({ app, profilePage, newAccount }) => {
        const { metrics } = profilePage;
        await app.launchAs(newAccount);
        await app.goToProfile();
        await profilePage.details.selectTab("metrics");
        await expect(metrics.empty).toBeVisible();
        await expect(metrics.createButton).toBeVisible();
        await expect(metrics.total).toHaveCount(0);
      }
    );
  });

  test(
    "the period filter switches between 30 days, 90 days, 1 year and all history",
    meta({
      description:
        "gabriel's two seeded Recordas are from February 2026: the last 30 and 90 days are " +
        "empty, while 1 year and Todo o histórico show both, with no active streak.",
      requirement: ["RF-38.5", "RF-38.3"]
    }),
    async ({ app, profilePage }) => {
      // Seeded on 7 and 14 Feb 2026 (recorda-backend/app/db/development_seed_data.py).
      const { metrics } = profilePage;
      await app.launch();
      await app.goToProfile();
      await profilePage.details.selectTab("metrics");

      for (const period of ["last_30_days", "last_90_days"] as const) {
        await test.step(`${period}: empty`, async () => {
          await metrics.period(period).click();
          await expect(metrics.empty).toBeVisible();
        });
      }
      for (const period of ["last_year", "all_time"] as const) {
        await test.step(`${period}: both Recordas`, async () => {
          await metrics.period(period).click();
          await expect(metrics.total).toHaveText("2");
        });
      }
      await expect(metrics.streak).toContainText(t("memoriesMetrics.widgets.streak.none"));
    }
  );
});
