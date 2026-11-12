import type { Locator } from "@playwright/test";

import { popularGenres } from "../../src/data/music";
import { expect, meta, signedInAsNewAccount, test } from "../../src/fixtures";
import type { MusicPreferencesPage } from "../../src/pages";
import { t } from "../../src/support/i18n";

test.use(signedInAsNewAccount);

async function namesOf(items: Locator): Promise<string[]> {
  return items.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("aria-label") ?? "")
  );
}

function chip(step: Locator, name: string): Locator {
  return step.getByRole("checkbox", { name, exact: true });
}

/** Unselects `names` one by one; each tap must lower the step's counter. */
async function unselectAll(music: MusicPreferencesPage, step: Locator, names: string[]) {
  for (const [index, name] of names.entries()) {
    await chip(step, name).click();
    await music.expectSelected(step, names.length - index - 1);
  }
}

/**
 * Selects the first `count` chips of the list that aren't in `skip`. A chip that was
 * unselected and isn't in Deezer's popular list leaves the screen, so a test can't count on
 * tapping it again.
 */
async function selectOthers(
  music: MusicPreferencesPage,
  step: Locator,
  items: Locator,
  count: number,
  skip: string[]
) {
  await music.expectOptionsLoaded(step);
  const names = (await namesOf(items)).filter((name) => !skip.includes(name)).slice(0, count);
  for (const name of names) await chip(step, name).click();
  return names;
}

test.describe("Editing music preferences", () => {
  test(
    "the editor opens with the current artists, genres and song selected",
    meta({
      description:
        "Each step of the editor starts with the account's current choices: its three artists " +
        "and three genres lead the list and count as selected (unselecting each one lowers the " +
        "counter), and its favorite song comes first, ready to save.",
      requirement: "RF-31.1",
      tag: "@mutates"
    }),
    async ({ app, newAccount, musicPreferencesPage: music }) => {
      const artists = newAccount.preferences.artists.map((artist) => artist.name);
      const genres = newAccount.preferences.genres.map((genre) => genre.name);

      await app.launch();
      await app.goToMusicPreferences();

      await test.step("artists", async () => {
        await music.expectSelected(music.artistsStep, 3);
        await music.expectOptionsLoaded(music.artistsStep);
        expect((await namesOf(music.artists)).slice(0, 3).sort()).toEqual([...artists].sort());
        await unselectAll(music, music.artistsStep, artists);
        await selectOthers(music, music.artistsStep, music.artists, 3, artists);
        await music.nextFromArtists.click();
      });

      await test.step("genres", async () => {
        await music.expectSelected(music.genresStep, 3);
        await music.expectOptionsLoaded(music.genresStep);
        expect((await namesOf(music.genres)).slice(0, 3).sort()).toEqual([...genres].sort());
        await unselectAll(music, music.genresStep, genres);
        await selectOthers(music, music.genresStep, music.genres, 3, genres);
        await music.nextFromGenres.click();
      });

      await test.step("favorite song", async () => {
        const { title, artist_name } = newAccount.preferences.favorite_track;
        await expect(music.songs.first()).toHaveAccessibleName(`${title}, ${artist_name}`);
        await expect(music.saveButton).toBeEnabled();
      });
    }
  );

  test(
    "saving needs at least three artists, three genres and exactly one song",
    meta({
      description:
        "With two artists or two genres the step can't move on; with three again it can. The " +
        "song is a single choice, and saving stores exactly the one picked.",
      requirement: "RF-31.2",
      tag: "@mutates"
    }),
    async ({ app, api, newAccount, musicPreferencesPage: music, settingsPage }) => {
      const artists = newAccount.preferences.artists.map((artist) => artist.name);
      const genres = newAccount.preferences.genres.map((genre) => genre.name);

      await app.launch();
      await app.goToMusicPreferences();

      await test.step("two artists are not enough", async () => {
        await chip(music.artistsStep, artists[0]!).click();
        await music.expectSelected(music.artistsStep, 2);
        await expect(music.nextFromArtists).toBeDisabled();
        await selectOthers(music, music.artistsStep, music.artists, 1, artists);
        await music.expectSelected(music.artistsStep, 3);
        await expect(music.nextFromArtists).toBeEnabled();
        await music.nextFromArtists.click();
      });

      await test.step("two genres are not enough", async () => {
        await chip(music.genresStep, genres[0]!).click();
        await music.expectSelected(music.genresStep, 2);
        await expect(music.nextFromGenres).toBeDisabled();
        await selectOthers(music, music.genresStep, music.genres, 1, genres);
        await music.expectSelected(music.genresStep, 3);
        await expect(music.nextFromGenres).toBeEnabled();
        await music.nextFromGenres.click();
      });

      const picked = await test.step("one song is picked and saved", async () => {
        const song = music.songs.nth(1);
        const name = (await song.getAttribute("aria-label")) ?? "";
        await song.click();
        await music.saveButton.click();
        await expect(settingsPage.notice).toHaveText(t("settings.musicPreferences.updated"));
        return name;
      });

      await test.step("the account keeps exactly that song", async () => {
        const { favorite_track } = await api.musicPreferences(newAccount.session);
        expect(`${favorite_track.title}, ${favorite_track.artist_name}`).toBe(picked);
      });
    }
  );

  test(
    "new preferences show on the profile, in suggestions and in the feed",
    meta({
      description:
        "An account whose tastes match nobody has no suggestions and no discovery posts. After " +
        "replacing its artists, genres and song with popular ones, the profile shows the new " +
        "choices, and the search suggestions and the general feed start showing people and posts.",
      requirement: "RF-31.3",
      tag: "@mutates"
    }),
    async ({
      app,
      api,
      page,
      newAccount,
      feedPage,
      profilePage,
      settingsPage,
      userSearchPage,
      musicPreferencesPage: music
    }) => {
      const oldArtists = newAccount.preferences.artists.map((artist) => artist.name);
      const oldGenres = newAccount.preferences.genres.map((genre) => genre.name);

      const openSuggestions = async () => {
        const loaded = page.waitForResponse("**/api/v1/users/suggestions**");
        await feedPage.searchButton.click();
        await userSearchPage.expectLoaded();
        await loaded;
      };

      await test.step("matching nobody, there is nothing to discover", async () => {
        await app.launch();
        await expect(feedPage.emptyState("general")).toBeVisible();
        await openSuggestions();
        await expect(userSearchPage.suggestions).toHaveCount(0);
        await userSearchPage.backButton.click();
        await feedPage.expectLoaded();
      });

      const chosen = await test.step("replace every artist, genre and the song", async () => {
        await app.goToMusicPreferences();

        await unselectAll(music, music.artistsStep, oldArtists);
        const artists = await selectOthers(music, music.artistsStep, music.artists, 3, oldArtists);
        await music.expectSelected(music.artistsStep, 3);
        await music.nextFromArtists.click();

        await unselectAll(music, music.genresStep, oldGenres);
        for (const name of popularGenres) await chip(music.genresStep, name).click();
        const [third] = await selectOthers(music, music.genresStep, music.genres, 1, [
          ...oldGenres,
          ...popularGenres
        ]);
        await music.expectSelected(music.genresStep, 3);
        await music.nextFromGenres.click();

        await music.songs.nth(1).click();
        await music.saveButton.click();
        await expect(settingsPage.notice).toHaveText(t("settings.musicPreferences.updated"));
        return { artists, genres: [...popularGenres, third!] };
      });

      const saved = await test.step("the account has the new preferences", async () => {
        const preferences = await api.musicPreferences(newAccount.session);
        expect(preferences.artists.map((artist) => artist.name).sort()).toEqual(
          [...chosen.artists].sort()
        );
        expect(preferences.genres.map((genre) => genre.name).sort()).toEqual(
          [...chosen.genres].sort()
        );
        expect(preferences.favorite_track.title).not.toBe(
          newAccount.preferences.favorite_track.title
        );
        return preferences;
      });

      const expectProfileShowsNewTastes = async () => {
        const song = saved.favorite_track;
        await expect(
          profilePage.favoriteSong({ title: song.title, artistName: song.artist_name })
        ).toBeVisible();
        const [firstArtist, ...otherArtists] = chosen.artists.map((name) =>
          profilePage.favoriteArtist(name)
        );
        await expect(otherArtists.reduce((any, item) => any.or(item), firstArtist!)).toBeVisible();
        const [firstGenre, ...otherGenres] = chosen.genres.map((name) =>
          profilePage.favoriteGenre(name)
        );
        await expect(otherGenres.reduce((any, item) => any.or(item), firstGenre!)).toBeVisible();
        for (const name of oldArtists) {
          await expect(profilePage.favoriteArtist(name)).toHaveCount(0);
        }
      };

      await test.step("the profile shows them, also after reopening the app", async () => {
        await settingsPage.backButton.click();
        await profilePage.expectLoaded();
        await expectProfileShowsNewTastes();
        await app.launch();
        await app.goToProfile();
        await expectProfileShowsNewTastes();
      });

      await test.step("suggestions now list people with the same tastes", async () => {
        await app.launch();
        await openSuggestions();
        await expect(
          userSearchPage.suggestions.locator('[data-testid^="suggested-profile-"]').first()
        ).toBeVisible();
        await userSearchPage.backButton.click();
      });

      await test.step("the general feed now shows posts to discover", async () => {
        await feedPage.expectLoaded();
        await expect(feedPage.posts("general").first()).toBeVisible();
      });
    }
  );
});
