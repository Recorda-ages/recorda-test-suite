import { randomUUID } from "node:crypto";
import path from "node:path";

import { signedOut, users } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import type { LoginResponse, RecordaApi } from "../../src/support/api";
import { t } from "../../src/support/i18n";

/**
 * FL-11 — the signed-in user's own profile. Reading it uses the seeded `gabriel` (project
 * default session); anything that changes the account (avatar, Recordas, streak) uses a
 * user created by the test, so those tests are `@mutates` and run on the local stack only.
 */

const AVATAR_FIXTURE = path.join(__dirname, "../fixtures/avatar.png");
/** Page size of the profile grid (backend default of `GET /users/{id}/recordas`). */
const GRID_PAGE_SIZE = 24;

/** A new account that skipped nothing: onboarding done, so it boots into the Feed. */
async function newUser(api: RecordaApi, role: string): Promise<LoginResponse> {
  const username = `e2e-${role}-${randomUUID().slice(0, 8)}`;
  const session = await api.register({
    name: `E2E ${role}`,
    username,
    email: `${username}@e2e.recorda.test`,
    password: "E2e-Password1",
    language: "pt-BR"
  });
  await api.completeOnboarding(session);
  return session;
}

test.describe("Own profile", () => {
  test(
    "the profile shows identity, avatar, counters, one streak and music",
    meta({
      description:
        "The header shows the account's name, @username, picture, Recordas/followers/" +
        "following counters, a single streak indicator, the favorite song and the first " +
        "favorite artist and genre, all matching what the backend has for the account.",
      requirement: ["RF-28.1", "RF-35.3"]
    }),
    async ({ api, app, profilePage }) => {
      const gabriel = await api.login(users.gabriel);
      const profile = await api.profile(gabriel);
      const tastes = await api.musicPreferences(gabriel);
      const details = profilePage.details;

      await app.launch();
      await app.goToProfile();

      await test.step("identity and picture", async () => {
        await expect(details.name(profile.name)).toBeVisible();
        await expect(details.username(profile.username)).toBeVisible();
        await expect(details.avatar).toBeVisible();
        await expect(details.avatarFallback).toHaveCount(0);
      });

      await test.step("Recordas, followers and following counters", async () => {
        const counts = profile.counts!;
        await expect(details.count("recordas", counts.recordas)).toBeVisible();
        await expect(details.count("followers", counts.followers)).toBeVisible();
        await expect(details.count("following", counts.following)).toBeVisible();
      });

      await test.step("exactly one streak indicator, with the account's streak", async () => {
        const days = profile.streak!.current_days;
        await expect(details.streakIndicators).toHaveCount(1);
        const value =
          days > 0 ? t("profile.streak.days", { count: days }) : t("profile.streak.none");
        await expect(details.streakIndicators).toHaveAccessibleName(
          t("profile.streak.a11y", { value })
        );
      });

      await test.step("favorite song, artist and genre chips", async () => {
        const song = profile.favorite_song;
        await expect(details.favoriteSong).toHaveAccessibleName(
          t("profile.favoriteSongA11y", { title: song.title, artist: song.artist_name })
        );
        // The header shows the first favorite artist and genre only (frontend #253 review).
        await expect(details.artistChips).toHaveCount(1);
        await expect(details.artistChips).toHaveAccessibleName(
          t("profile.favoriteArtistA11y", { name: tastes.artists[0]!.name })
        );
        await expect(details.genreChips).toHaveCount(1);
        await expect(details.genreChips).toHaveAccessibleName(
          t("profile.favoriteGenreA11y", { name: tastes.genres[0]!.name })
        );
      });
    }
  );

  test(
    "the Recordas, Métricas and Calendário tabs switch the content below the header",
    meta({
      description:
        "The profile keeps three tabs in a fixed order; each shows its own content (the " +
        "Recordas grid, the metrics cards, the memory calendar) and Recordas comes back.",
      requirement: "RF-28.4"
    }),
    async ({ app, profilePage }) => {
      const details = profilePage.details;
      await app.launch();
      await app.goToProfile();

      await expect(details.tabs).toHaveText([
        t("profile.tabs.recordas"),
        t("profile.tabs.metrics"),
        t("profile.tabs.calendar")
      ]);

      await test.step("Recordas is first and shows the grid", async () => {
        await expect(details.gridItems.first()).toBeVisible();
      });

      await test.step("Métricas shows the metrics instead of the grid", async () => {
        await details.selectTab("metrics");
        await expect(details.metricsContent).toBeVisible();
        await expect(details.grid).toHaveCount(0);
      });

      await test.step("Calendário shows the memory calendar", async () => {
        await details.selectTab("calendar");
        await expect(details.calendarContent).toBeVisible();
        await expect(details.metricsContent).toHaveCount(0);
      });

      await test.step("Recordas brings the grid back", async () => {
        await details.selectTab("recordas");
        await expect(details.gridItems.first()).toBeVisible();
        await expect(details.calendarContent).toHaveCount(0);
      });
    }
  );

  test.describe("changes to the account", () => {
    test.use({ storageState: signedOut });

    test(
      "publishing today shows a single active streak of one day",
      meta({
        description:
          "After a new account publishes its first Recorda, the profile shows one streak " +
          "indicator, highlighted as active, reading one day.",
        requirement: "RF-35.3",
        tag: "@mutates"
      }),
      async ({ api, app, profilePage }) => {
        const user = await newUser(api, "streak");
        await api.createRecorda(user, { description: `RF-35.3 ${randomUUID()}` });

        await app.launchAs(user);
        await app.goToProfile();

        const indicators = profilePage.details.streakIndicators;
        await expect(indicators).toHaveCount(1);
        await expect(indicators).toHaveAccessibleName(
          t("profile.streak.a11y", { value: t("profile.streak.days", { count: 1 }) })
        );
        await expect(indicators).toHaveAttribute("data-testid", "profile-streak-active");
      }
    );

    test(
      "the grid loads the next page of Recordas when scrolling to the end",
      meta({
        description:
          "With one Recorda more than a page, the grid first shows a full page without the " +
          "oldest Recorda, and scrolling to the end loads it.",
        requirement: "RF-28.3",
        tag: "@mutates"
      }),
      async ({ api, app, profilePage }) => {
        const user = await newUser(api, "grid");
        const recordaIds: string[] = [];
        for (let i = 0; i <= GRID_PAGE_SIZE; i++) {
          recordaIds.push(await api.createRecorda(user, { description: `RF-28.3 #${i}` }));
        }
        const [oldest] = recordaIds;
        const details = profilePage.details;

        await app.launchAs(user);
        await app.goToProfile();

        await test.step("the first page is full and newest first", async () => {
          await expect(details.gridItems).toHaveCount(GRID_PAGE_SIZE);
          await expect(details.gridItems.first()).toHaveAttribute(
            "data-testid",
            `recorda-grid-item-${recordaIds.at(-1)}`
          );
          await expect(details.gridItem(oldest!)).toHaveCount(0);
        });

        await test.step("scrolling to the end loads the oldest Recorda", async () => {
          await details.scrollToLastRecorda();
          await expect(details.gridItem(oldest!)).toBeVisible();
          await expect(details.gridItems).toHaveCount(GRID_PAGE_SIZE + 1);
        });
      }
    );

    test(
      "removing the avatar brings back the default picture",
      meta({
        description:
          "An account with a profile picture removes it from the avatar menu after " +
          "confirming; the default icon replaces it and stays after reopening the app.",
        requirement: "RF-28.2",
        tag: "@mutates"
      }),
      async ({ api, app, profilePage }) => {
        const user = await newUser(api, "noavatar");
        await api.setAvatar(user);
        const details = profilePage.details;

        await app.launchAs(user);
        await app.goToProfile();
        await expect(details.avatar).toBeVisible();

        await test.step("remove the picture and confirm", async () => {
          await profilePage.removeAvatar();
          await expect(details.avatarFallback).toBeVisible();
          await expect(details.avatar).toHaveCount(0);
        });

        await test.step("the default picture stays after reopening the app", async () => {
          await app.launch();
          await app.goToProfile();
          await expect(details.avatarFallback).toBeVisible();
          await expect(details.avatar).toHaveCount(0);
          expect((await api.profile(user)).profile_picture_url).toBeNull();
        });
      }
    );

    test(
      "choosing a picture from the gallery sets it as the avatar",
      meta({
        description:
          "In the web build, an account without a picture picks an image from the gallery; " +
          "it replaces the default icon and stays after reopening the app.",
        requirement: "RF-28.2",
        tag: "@mutates"
      }),
      async ({ api, app, profilePage }) => {
        // RF-28.2 gap, web build only (the upload works in Expo Go): `profileService.uploadAvatar`
        // wraps the picked image in `File` from expo-file-system, which has no web support
        // (console: "expo-file-system is not supported on web"); no PUT /users/me/avatar is
        // made and the default icon stays.
        test.fail();
        const user = await newUser(api, "avatar");
        const details = profilePage.details;

        await app.launchAs(user);
        await app.goToProfile();
        await expect(details.avatarFallback).toBeVisible();

        await test.step("pick an image from the gallery", async () => {
          await profilePage.chooseAvatarFromGallery(AVATAR_FIXTURE);
          await expect(details.avatar).toBeVisible();
        });

        await test.step("the new picture stays after reopening the app", async () => {
          await expect
            .poll(async () => (await api.profile(user)).profile_picture_url)
            .not.toBeNull();
          await app.launch();
          await app.goToProfile();
          await expect(details.avatar).toBeVisible();
          await expect(details.avatarFallback).toHaveCount(0);
        });
      }
    );
  });
});
