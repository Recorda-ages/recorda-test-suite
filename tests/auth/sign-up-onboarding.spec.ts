import { signedOut } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import type { SignUpData } from "../../src/pages";
import { uniqueId } from "../../src/support/api";
import { t } from "../../src/support/i18n";

/**
 * FL-03: a new person signs up, is signed in automatically and goes through the three
 * onboarding steps before reaching the Feed.
 *
 * Every test signs up a brand-new user through the UI, so they all write to the backend
 * and run only against the local stack (`@mutates`).
 */
test.use({ storageState: signedOut });

const PASSWORD = "Senha@1234";

function newUser(label: string): SignUpData {
  const username = `e2e-${label}-${uniqueId()}`;
  return {
    name: `E2E ${label}`,
    username,
    email: `${username}@e2e.recorda.test`,
    password: PASSWORD
  };
}

/** "<title>, <artist>" (the song's accessible name) → its parts. */
function splitSongLabel(label: string): { title: string; artist: string } {
  const separator = label.lastIndexOf(", ");
  return { title: label.slice(0, separator), artist: label.slice(separator + 2) };
}

test.describe("Sign up and onboarding", () => {
  test(
    "a new account goes through the three onboarding steps before the Feed",
    meta({
      description:
        "After signing up, the user is signed in and taken to onboarding instead of the Feed, " +
        "picks artists, genres and one song across three numbered steps, lands on the Feed, " +
        "and sees the chosen song highlighted on their profile.",
      requirement: ["RF-02.5", "RF-03.1", "RF-03.2", "RF-03.3", "RF-03.6"],
      tag: "@mutates"
    }),
    async ({ app, signUpPage, onboardingPage, feedPage, profilePage }) => {
      const { artists, genres, music } = onboardingPage;
      let song = "";

      await test.step("a new person signs up", async () => {
        await app.goToSignUp();
        await signUpPage.signUp(newUser("flow"));
      });

      await test.step("onboarding opens on step 1 instead of the Feed", async () => {
        await artists.expectLoaded();
        await expect(artists.stepLabel).toBeVisible();
        await expect(feedPage.root).toBeHidden();
      });

      await test.step("step 1: picks three artists from the chips", async () => {
        await artists.selectFirst(3);
        await expect(artists.selectionCount).toHaveText(t("onboarding.selectedCount", { count: 3 }));
        await artists.next.click();
      });

      await test.step("step 2: picks three genres from the chips", async () => {
        await genres.expectLoaded();
        await expect(genres.stepLabel).toBeVisible();
        await genres.selectFirst(3);
        await expect(genres.selectionCount).toHaveText(t("onboarding.selectedCount", { count: 3 }));
        await genres.next.click();
      });

      await test.step("step 3: picks one favorite song and finishes", async () => {
        await music.expectLoaded();
        await expect(music.stepLabel).toBeVisible();
        song = await music.selectFirstSong();
        await expect(music.finish).toBeEnabled();
        await music.finish.click();
      });

      await test.step("lands on the Feed, signed in", async () => {
        await feedPage.expectLoaded();
      });

      await test.step("the favorite song is highlighted on the profile", async () => {
        await app.goToProfile();
        await expect(profilePage.favoriteSong).toHaveAttribute(
          "aria-label",
          t("profile.favoriteSongA11y", splitSongLabel(song))
        );
      });
    }
  );
});