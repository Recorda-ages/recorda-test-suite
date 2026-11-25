import path from "node:path";

import type { Page } from "@playwright/test";

import { expect, meta, test } from "../../src/fixtures";
import { t } from "../../src/support/i18n";
import { PREVIEW_URL, servePreview } from "../../src/support/media";

/**
 * FL-05: creating a Recorda on the web build. The camera is native, so media comes from the
 * gallery button (a file input on web); Chromium gets a fake camera so the camera screen opens
 * past its permission prompt. Capture, permissions, video limits and the preview player
 * (RF-06.2, 06.3, 06.5, 06.6, 07.3) need a device and are left to native tests.
 *
 * Except for the Deezer test, the song search is answered by `stubSongSearch`, so results
 * don't depend on Deezer. These tests only read: the web build can't publish (see RF-09.4).
 */
test.use({
  permissions: ["camera", "microphone"],
  launchOptions: {
    args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"]
  }
});

const PHOTO = path.resolve(__dirname, "../fixtures/avatar.png");
const SONG_SEARCH = "**/api/v1/music/tracks/search**";
const COVER_URL = "https://cover.e2e.recorda.test/cover.png";
const SONG = { id: 9_100_000_001, title: "E2E Memory Song", artist: "E2E Band", album: "E2E Album" };

/** Answers the song search with one known track, whose cover and preview are served locally. */
async function stubSongSearch(page: Page): Promise<void> {
  await servePreview(page);
  await page.route(COVER_URL, (route) => route.fulfill({ path: PHOTO }));
  await page.route(SONG_SEARCH, (route) =>
    route.fulfill({
      json: [{ ...SONG, cover_url: COVER_URL, preview_url: PREVIEW_URL, genre_id: 132 }]
    })
  );
}

test.describe("Create a Recorda", () => {
  test(
    "Criar Recorda opens the camera from the bottom bar",
    meta({
      description:
        "The bottom bar's Criar Recorda opens a screen with the camera viewfinder and the " +
        "central capture button.",
      requirement: "RF-06.1"
    }),
    async ({ app, feedPage, createRecordaPage }) => {
      const { camera } = createRecordaPage;
      await app.launch();
      await expect(feedPage.tabBar.tab("camera")).toHaveAccessibleName(t("feed.tabBar.camera"));
      await feedPage.tabBar.select("camera");
      await camera.expectLoaded();
      await expect(camera.stage).toBeVisible();
      await expect(camera.captureButton).toHaveAccessibleName(t("camera.capture"));
    }
  );

  test(
    "the song search finds Deezer tracks by song, artist or album",
    meta({
      description:
        "With the real Deezer behind the backend, searching by a song name, by an artist and " +
        "by an album each lists matching tracks with title, artist and cover.",
      requirement: ["RF-07.1", "RF-07.2", "RF-T01"]
    }),
    async ({ app, feedPage, createRecordaPage }) => {
      const { music } = createRecordaPage;
      await app.launch();
      await feedPage.tabBar.select("camera");
      await createRecordaPage.pickFromGallery(PHOTO);
      await expect(music.hint).toBeVisible();

      for (const [by, query] of [
        ["song", "Instant Crush"],
        ["artist", "Daft Punk"],
        ["album", "Random Access Memories"]
      ] as const) {
        await test.step(`by ${by}: "${query}"`, async () => {
          await music.search.fill(query);
          const match = music.result(
            "Instant Crush (feat. Julian Casablancas)",
            "Daft Punk"
          );
          await expect(match).toBeVisible({ timeout: 20_000 });
          // The cover loads once the result is on screen.
          await match.scrollIntoViewIfNeeded();
          await expect(match.locator("img")).toHaveCount(1);
        });
      }
    }
  );

  test(
    "song search results carry the genre",
    meta({
      description: "Each track the song search returns comes with its Deezer genre.",
      requirement: "RF-07.1"
    }),
    async ({ app, page, feedPage, createRecordaPage }) => {
      // RF-07.1 (gap): GET /music/tracks/search always returns genre_id null.
      test.fail();
      await app.launch();
      await feedPage.tabBar.select("camera");
      await createRecordaPage.pickFromGallery(PHOTO);
      const response = page.waitForResponse(SONG_SEARCH);
      await createRecordaPage.music.search.fill("Daft Punk");
      const tracks = (await (await response).json()) as { genre_id: number | null }[];
      expect(tracks.length).toBeGreaterThan(0);
      expect(tracks.filter((track) => track.genre_id === null)).toEqual([]);
    }
  );

  test(
    "a failed song search offers to try again",
    meta({
      description:
        "When the music service is unavailable, the search says it couldn't find songs and " +
        "offers Tentar novamente, which shows the results once the service is back.",
      requirement: "RF-07.6"
    }),
    async ({ app, page, feedPage, createRecordaPage }) => {
      const { music } = createRecordaPage;
      await app.launch();
      await feedPage.tabBar.select("camera");
      await createRecordaPage.pickFromGallery(PHOTO);

      await page.route(SONG_SEARCH, (route) =>
        route.fulfill({ status: 503, json: { detail: "E2E: Deezer unavailable" } })
      );
      await music.search.fill(SONG.title);
      // The app retries once by itself before showing the error.
      await expect(music.error).toBeVisible({ timeout: 15_000 });

      await page.unroute(SONG_SEARCH);
      await stubSongSearch(page);
      await music.retryButton.click();
      await expect(music.result(SONG.title, SONG.artist)).toBeVisible();
      await expect(music.error).toHaveCount(0);
    }
  );

  test(
    "the next step needs a song, which then comes filled in and can't be changed there",
    meta({
      description:
        "Próximo stays disabled until a song is picked. The last step then shows the photo " +
        "with the song's cover, title and artist over it and a description field, with the " +
        "song as plain text (no field to edit it) and Publicar enabled.",
      requirement: ["RF-07.4", "RF-08.1", "RF-08.3", "RF-08.4"]
    }),
    async ({ app, page, feedPage, createRecordaPage }) => {
      const { music, composer } = createRecordaPage;
      await stubSongSearch(page);
      await app.launch();
      await feedPage.tabBar.select("camera");
      await createRecordaPage.pickFromGallery(PHOTO);

      await test.step("Próximo needs a song", async () => {
        await expect(music.nextButton).toBeDisabled();
        await music.search.fill(SONG.title);
        await music.result(SONG.title, SONG.artist).click();
        // TODO(frontend): react-native-web 0.21 doesn't map accessibilityState.checked to
        // aria-checked, so the picked result is seen through Próximo instead.
        await expect(music.nextButton).toBeEnabled();
        await music.nextButton.click();
        await composer.expectLoaded();
      });

      await test.step("one screen: media, song over it and description", async () => {
        await expect(composer.media).toBeVisible();
        await expect(composer.songCover).toBeVisible();
        await expect(composer.root.getByText(SONG.title, { exact: true })).toBeVisible();
        await expect(composer.root.getByText(SONG.artist, { exact: true })).toBeVisible();
        await expect(composer.description).toBeEditable();
      });

      await test.step("the song is not editable here, and Publicar is enabled", async () => {
        // The description is the only text field on the screen until mentions are opened.
        await expect(composer.root.getByRole("textbox")).toHaveCount(1);
        await expect(composer.publishButton).toHaveAccessibleName(t("recordaDetails.publish"));
        await expect(composer.publishButton).toBeEnabled();
      });
    }
  );

  test(
    "the description is optional and capped at 2200 characters",
    meta({
      description:
        "Publicar is enabled with an empty description, and typing past 2200 characters " +
        "keeps only the first 2200.",
      requirement: "RF-08.2"
    }),
    async ({ app, page, feedPage, createRecordaPage }) => {
      const { composer } = createRecordaPage;
      await stubSongSearch(page);
      await app.launch();
      await feedPage.tabBar.select("camera");
      await createRecordaPage.pickFromGallery(PHOTO);
      await createRecordaPage.chooseSong(SONG.title, SONG.title, SONG.artist);

      await expect(composer.description).toHaveValue("");
      await expect(composer.publishButton).toBeEnabled();
      await composer.description.fill("a".repeat(2300));
      await expect(composer.description).toHaveValue("a".repeat(2200));
    }
  );

  test(
    "publishing has no visibility choice",
    meta({
      description:
        "The last step has no visibility selector: no public/private switch, radio or field; " +
        "who sees the Recorda follows the account's privacy.",
      requirement: "RF-09.2"
    }),
    async ({ app, page, feedPage, createRecordaPage }) => {
      const { composer } = createRecordaPage;
      await stubSongSearch(page);
      await app.launch();
      await feedPage.tabBar.select("camera");
      await createRecordaPage.pickFromGallery(PHOTO);
      await createRecordaPage.chooseSong(SONG.title, SONG.title, SONG.artist);

      await expect(composer.root.getByRole("switch")).toHaveCount(0);
      await expect(composer.root.getByRole("radio")).toHaveCount(0);
      await expect(composer.root.getByRole("combobox")).toHaveCount(0);
      await expect(composer.root.getByText(/visibilidade|público|pública|privad/i)).toHaveCount(0);
    }
  );

  for (const [requirement, field] of [
    ["RF-08.5", "Data da Memória"],
    ["RF-08.6", "Local"]
  ] as const) {
    test(
      `the last step asks for the memory's ${requirement === "RF-08.5" ? "date" : "place"}`,
      meta({
        description: `The last step has a ${field} field for when or where the moment happened.`,
        requirement
      }),
      async ({ app, page, feedPage, createRecordaPage }) => {
        // RF-08.5 / RF-08.6 (gap): the Recorda has no memory date or place yet.
        test.fail();
        await stubSongSearch(page);
        await app.launch();
        await feedPage.tabBar.select("camera");
        await createRecordaPage.pickFromGallery(PHOTO);
        await createRecordaPage.chooseSong(SONG.title, SONG.title, SONG.artist);
        await expect(createRecordaPage.composer.root.getByLabel(field)).toBeVisible({
          timeout: 3_000
        });
      }
    );
  }

  test(
    "followed people can be marked in the Recorda",
    meta({
      description:
        "Marcar amigos lists the accounts the author follows; checking one marks it, shown " +
        "as a chip and in the button's count.",
      requirement: "RF-08.7",
      tag: "@mutates"
    }),
    async ({ api, app, page, feedPage, createRecordaPage, newAccount }) => {
      const { composer } = createRecordaPage;
      const friend = await api.createUser("mention-friend");
      await api.follow(newAccount, friend);
      await stubSongSearch(page);

      await app.launchAs(newAccount);
      await feedPage.tabBar.select("camera");
      await createRecordaPage.pickFromGallery(PHOTO);
      await createRecordaPage.chooseSong(SONG.title, SONG.title, SONG.artist);

      await composer.mentionsButton(0).click();
      await composer.mentionSearch.fill(friend.user.username);
      await composer.mentionOption(friend.user.username).click();
      await expect(composer.mentionsButton(1)).toBeVisible();
      await expect(composer.root.getByText(`@${friend.user.username}`)).toHaveCount(2);
    }
  );

  test(
    "a failed upload keeps the draft and can be retried",
    meta({
      description:
        "When sending the media fails, the screen says so and Publicar becomes Tentar " +
        "novamente, with the photo, the song, the description and the marked friend still " +
        "there, so nothing has to be captured or typed again.",
      requirement: "RF-09.5",
      tag: "@mutates"
    }),
    async ({ api, app, page, feedPage, createRecordaPage, newAccount }) => {
      const { composer } = createRecordaPage;
      const friend = await api.createUser("retry-friend");
      await api.follow(newAccount, friend);
      await stubSongSearch(page);
      await page.route("**/api/v1/recordas/media", (route) =>
        route.fulfill({ status: 503, json: { detail: "E2E: upload unavailable" } })
      );

      await app.launchAs(newAccount);
      await feedPage.tabBar.select("camera");
      await createRecordaPage.pickFromGallery(PHOTO);
      await createRecordaPage.chooseSong(SONG.title, SONG.title, SONG.artist);
      await composer.description.fill("Kept after a failure");
      await composer.mentionsButton(0).click();
      await composer.mentionSearch.fill(friend.user.username);
      await composer.mentionOption(friend.user.username).click();

      await composer.publishButton.click();
      await expect(composer.publishError).toHaveText(t("recordaDetails.publishError.upload"));
      await expect(composer.publishButton).toHaveAccessibleName(t("recordaDetails.publishRetry"));
      await expect(composer.publishButton).toBeEnabled();
      await expect(composer.media).toBeVisible();
      await expect(composer.root.getByText(SONG.title, { exact: true })).toBeVisible();
      await expect(composer.description).toHaveValue("Kept after a failure");
      await expect(composer.mentionsButton(1)).toBeVisible();
    }
  );

  test(
    "a published Recorda shows the upload progress and appears on the author's profile",
    meta({
      description:
        "Publicar shows Enviando mídia... while the photo uploads, then returns to the Feed; " +
        "the new Recorda is on the author's profile right away and on a follower's Seguindo.",
      requirement: "RF-09.4",
      tag: "@mutates"
    }),
    async ({ api, app, page, feedPage, profilePage, createRecordaPage, newAccount }) => {
      // RF-09.4 / RF-09.5 (gap, web only): uploadRecordaMedia (recorda-frontend/src/features/
      // recorda-publish/api) builds the file with expo-file-system's File, which has no web
      // support, so the upload fails before any request is sent.
      test.fail();
      const { composer } = createRecordaPage;
      await stubSongSearch(page);
      let release!: () => void;
      const held = new Promise<void>((resolve) => (release = resolve));
      await page.route("**/api/v1/recordas/media", async (route) => {
        await held;
        await route.continue();
      });

      await app.launchAs(newAccount);
      await feedPage.tabBar.select("camera");
      await createRecordaPage.pickFromGallery(PHOTO);
      await createRecordaPage.chooseSong(SONG.title, SONG.title, SONG.artist);
      const caption = `Published from the web ${Date.now()}`;
      await composer.description.fill(caption);
      await composer.publishButton.click();

      await expect(composer.publishButton).toHaveAccessibleName(
        t("recordaDetails.publishUploading"),
        { timeout: 5_000 }
      );
      release();
      await feedPage.expectLoaded();
      await app.goToProfile();
      await expect(profilePage.details.gridItems).toHaveCount(1);
    }
  );
});
