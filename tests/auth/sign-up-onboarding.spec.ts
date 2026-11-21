import { signedOut, users } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import type { OnboardingPage, SignUpData, SignUpPage } from "../../src/pages";
import type { App } from "../../src/support/app";
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
/** Email of the seeded `gabriel` account (recorda-backend/app/db/development_seed_data.py). */
const SEEDED_EMAIL = "gabriel@recorda.com";

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

/** Signs up a brand-new user and waits on onboarding step 1. */
async function signUpToOnboarding(
  app: App,
  signUpPage: SignUpPage,
  onboardingPage: OnboardingPage,
  label: string
): Promise<void> {
  await app.goToSignUp();
  await signUpPage.signUp(newUser(label));
  await onboardingPage.artists.expectLoaded();
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

  test(
    "the sign-up form asks only for name, username, email and password",
    meta({
      description:
        "Sign Up shows exactly the Name, Username, Email and Password fields, with no " +
        "password confirmation and no terms checkbox.",
      requirement: "RF-02.1"
    }),
    async ({ app, signUpPage }) => {
      await app.goToSignUp();

      await expect(signUpPage.name).toBeVisible();
      await expect(signUpPage.username).toBeVisible();
      await expect(signUpPage.email).toBeVisible();
      await expect(signUpPage.password).toBeVisible();
      await expect(signUpPage.root.getByTestId("input-confirm-password")).toHaveCount(0);
      await expect(signUpPage.root.getByRole("checkbox")).toHaveCount(0);
    }
  );

  test(
    "a username or email already in use is rejected on its own field",
    meta({
      description:
        "Signing up with the username of a seeded account, or with its email, keeps the " +
        "user on Sign Up and shows the error under that field only.",
      requirement: "RF-02.2",
      tag: "@mutates"
    }),
    async ({ app, signUpPage, onboardingPage }) => {
      await test.step("a username that already exists", async () => {
        await app.goToSignUp();
        await signUpPage.signUp({ ...newUser("dup-user"), username: users.gabriel.username });

        await expect(signUpPage.fieldError("username")).toBeVisible();
        await expect(signUpPage.fieldError("email")).toHaveCount(0);
        await expect(onboardingPage.artists.root).toBeHidden();
      });

      await test.step("an email that already exists", async () => {
        await app.goToSignUp();
        await signUpPage.signUp({ ...newUser("dup-mail"), email: SEEDED_EMAIL });

        await expect(signUpPage.fieldError("email")).toBeVisible();
        await expect(signUpPage.fieldError("username")).toHaveCount(0);
        await expect(onboardingPage.artists.root).toBeHidden();
      });
    }
  );

  test(
    "each invalid field shows its own error before anything is sent",
    meta({
      description:
        "Submitting an empty form shows a specific message under every field, and an " +
        "invalid email shows the email-format message; the user stays on Sign Up.",
      requirement: "RF-02.3"
    }),
    async ({ app, signUpPage }) => {
      await app.goToSignUp();

      await test.step("an empty form flags every field", async () => {
        await signUpPage.submit.click();

        await expect(signUpPage.fieldError("name")).toHaveText(t("auth.validation.nameRequired"));
        await expect(signUpPage.fieldError("username")).toHaveText(
          t("auth.validation.usernameRequired")
        );
        await expect(signUpPage.fieldError("email")).toHaveText(t("auth.validation.emailRequired"));
        await expect(signUpPage.fieldError("password")).toBeVisible();
      });

      await test.step("a malformed email gets the format message", async () => {
        await signUpPage.fill({ email: "nao-e-um-email" });
        await signUpPage.submit.click();

        await expect(signUpPage.fieldError("email")).toHaveText(t("auth.validation.emailInvalid"));
        await signUpPage.expectLoaded();
      });
    }
  );

  test(
    "a password shorter than 8 characters is not accepted",
    meta({
      description:
        "A 7-character password shows the minimum-length message and keeps the user on " +
        "Sign Up; with 8 characters the message goes away.",
      requirement: "RF-02.4"
    }),
    async ({ app, signUpPage }) => {
      const minLength = t("auth.validation.passwordMinLength", { min: 8 });
      await app.goToSignUp();

      await test.step("7 characters are rejected", async () => {
        await signUpPage.fill({ ...newUser("short-pw"), password: "1234567" });
        await signUpPage.submit.click();

        await expect(signUpPage.fieldError("password")).toHaveText(minLength);
        await signUpPage.expectLoaded();
      });

      await test.step("8 characters clear the error", async () => {
        await signUpPage.password.fill("12345678");
        await signUpPage.name.click();

        await expect(signUpPage.fieldError("password")).toHaveCount(0);
      });
    }
  );

  test(
    "each onboarding step needs its minimum choices to move on",
    meta({
      description:
        "Next stays disabled until 3 artists and then 3 genres are picked, and Finish stays " +
        "disabled until a favorite song is picked.",
      requirement: "RF-03.4",
      tag: "@mutates"
    }),
    async ({ app, signUpPage, onboardingPage }) => {
      const { artists, genres, music } = onboardingPage;
      await signUpToOnboarding(app, signUpPage, onboardingPage, "minimum");

      await test.step("artists: 2 are not enough, 3 are", async () => {
        await expect(artists.next).toBeDisabled();
        await artists.selectFirst(2);
        await expect(artists.next).toBeDisabled();
        await artists.chips.nth(2).click();
        await expect(artists.next).toBeEnabled();
        await artists.next.click();
      });

      await test.step("genres: 2 are not enough, 3 are", async () => {
        await genres.expectLoaded();
        await expect(genres.next).toBeDisabled();
        await genres.selectFirst(2);
        await expect(genres.next).toBeDisabled();
        await genres.chips.nth(2).click();
        await expect(genres.next).toBeEnabled();
        await genres.next.click();
      });

      await test.step("music: Finish needs one song", async () => {
        await music.expectLoaded();
        await expect(music.finish).toBeDisabled();
        await music.selectFirstSong();
        await expect(music.finish).toBeEnabled();
      });
    }
  );

  test(
    "going back to a previous step keeps what was selected",
    meta({
      description:
        "Returning from genres to artists, and from music to genres, shows the same number " +
        "of choices already selected, so nothing has to be picked again.",
      requirement: "RF-03.7",
      tag: "@mutates"
    }),
    async ({ app, signUpPage, onboardingPage }) => {
      const { artists, genres, music } = onboardingPage;
      const threeSelected = t("onboarding.selectedCount", { count: 3 });
      await signUpToOnboarding(app, signUpPage, onboardingPage, "back");

      await test.step("picks 3 artists and 3 genres, reaching music", async () => {
        await artists.selectFirst(3);
        await artists.next.click();
        await genres.expectLoaded();
        await genres.selectFirst(3);
        await genres.next.click();
        await music.expectLoaded();
      });

      await test.step("back to genres: the 3 genres are still selected", async () => {
        await music.back.click();
        await genres.expectLoaded();
        await expect(genres.selectionCount).toHaveText(threeSelected);
        await expect(genres.next).toBeEnabled();
      });

      await test.step("back to artists: the 3 artists are still selected", async () => {
        await genres.back.click();
        await artists.expectLoaded();
        await expect(artists.selectionCount).toHaveText(threeSelected);
        await expect(artists.next).toBeEnabled();
      });
    }
  );
});
