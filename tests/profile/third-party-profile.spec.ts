import { users } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import { t } from "../../src/support/i18n";

/**
 * FL-11 — someone else's profile, seen by `gabriel` (project default session). Read-only:
 * the seed gives gabriel an approved follow on the private `marina` and a pending request
 * to the private `camila`; `ana` is public.
 */
test.describe("Someone else's profile", () => {
  const visible = [
    { label: "a public profile", owner: users.ana },
    { label: "a private profile with an approved follow", owner: users.marina }
  ];

  for (const { label, owner } of visible) {
    test(
      `${label} shows the header, counters and Recordas`,
      meta({
        description:
          "Opened from the search, the profile shows the owner's name, @username, streak and " +
          "favorite song, the Recordas/followers/following counters and the Recordas grid, " +
          "with no private-account notice.",
        requirement: "RF-29.1"
      }),
      async ({ api, app, userProfilePage }) => {
        const gabriel = await api.account(users.gabriel);
        const profile = await api.profile(gabriel, await api.account(owner));
        expect(profile.can_view_content, "seed: gabriel can see this profile").toBe(true);
        const details = userProfilePage.details;

        await app.launch();
        await app.goToUserProfile(owner.username);

        await test.step("header", async () => {
          await expect(details.name(profile.name)).toBeVisible();
          await expect(details.username(profile.username)).toBeVisible();
          await expect(details.streakIndicators).toHaveCount(1);
          await expect(details.favoriteSong).toBeVisible();
        });

        await test.step("counters", async () => {
          const counts = profile.counts!;
          await expect(details.count("recordas", counts.recordas)).toBeVisible();
          await expect(details.count("followers", counts.followers)).toBeVisible();
          await expect(details.count("following", counts.following)).toBeVisible();
        });

        await test.step("Recordas, without the private notice", async () => {
          await expect(details.gridItems).toHaveCount(profile.counts!.recordas);
          await expect(details.privateNotice).toHaveCount(0);
        });
      }
    );
  }

  test(
    "a private profile without approval hides counters and Recordas behind a notice",
    meta({
      description:
        "A private account whose follow request is pending shows its name, @username and " +
        "favorite song, but no counters and no Recordas; each of the three tabs shows the " +
        "private-account notice instead of its content.",
      requirement: "RF-29.2"
    }),
    async ({ api, app, userProfilePage }) => {
      const gabriel = await api.account(users.gabriel);
      const profile = await api.profile(gabriel, await api.account(users.camila));
      expect(profile.can_view_content, "seed: gabriel's request is pending").toBe(false);
      const details = userProfilePage.details;

      await app.launch();
      await app.goToUserProfile(users.camila.username);

      await test.step("name, username and favorite song stay visible", async () => {
        await expect(details.name(profile.name)).toBeVisible();
        await expect(details.username(profile.username)).toBeVisible();
        await expect(details.favoriteSong).toHaveAccessibleName(
          t("profile.favoriteSongA11y", {
            title: profile.favorite_song.title,
            artist: profile.favorite_song.artist_name
          })
        );
      });

      await test.step("counters and Recordas are hidden", async () => {
        await expect(details.counts).toHaveCount(0);
        await expect(details.grid).toHaveCount(0);
        await expect(details.gridItems).toHaveCount(0);
      });

      await test.step("the three tabs stay, each with the private notice", async () => {
        await expect(details.tabs).toHaveText([
          t("profile.tabs.recordas"),
          t("profile.tabs.metrics"),
          t("profile.tabs.calendar")
        ]);
        await expect(details.privateNotice).toContainText(t("profile.private.title"));

        await details.selectTab("metrics");
        await expect(details.privateNotice).toContainText(t("profile.private.title"));
        await expect(details.metricsContent).toHaveCount(0);

        await details.selectTab("calendar");
        await expect(details.privateNotice).toContainText(t("profile.private.title"));
        await expect(details.calendarContent).toHaveCount(0);
      });
    }
  );

  test(
    "a private profile without approval still shows the streak",
    meta({
      description:
        "A private account whose follow request is pending shows its name, favorite song " +
        "and streak indicator, as RF-29.2 and backend decision D-06 say.",
      requirement: "RF-29.2"
    }),
    async ({ app, userProfilePage }) => {
      // RF-29.2 (gap): the frontend StreakBadge hides the streak when can_view_content is
      // false, provisionally (recorda-frontend docs/issue-260.md), while the requirement and
      // the backend (D-06) show it. Open question in the catalog until the team decides.
      test.fail();
      await app.launch();
      await app.goToUserProfile(users.camila.username);
      await expect(userProfilePage.details.favoriteSong).toBeVisible();
      await expect(userProfilePage.details.streakIndicators).toHaveCount(1);
    }
  );

});
