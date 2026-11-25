import { signedOut } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import { uniqueId } from "../../src/support/api";
import { t } from "../../src/support/i18n";
import { PREVIEW_URL, servePreview } from "../../src/support/media";

/**
 * FL-07: sound in the feed. Autoplay on focus, one song at a time and stopping in the
 * background (RF-16.1–16.3, RF-16.6) need a device and are left to native tests.
 */
test.use({ storageState: signedOut });

test.describe("Feed sound", () => {
  test(
    "a video plays without its own sound",
    meta({
      description:
        "A video Recorda in focus plays muted, even though the clip has an audio track: only " +
        "the song is heard.",
      requirement: "RF-16.4",
      tag: "@mutates"
    }),
    async ({ api, app, page, feedPage }) => {
      const [viewer, author] = await Promise.all([
        api.createUser("video-viewer"),
        api.createUser("video-author")
      ]);
      const { recorda_id: id } = await api.createRecorda(author, {
        description: `Video ${uniqueId()}`,
        video: true,
        songPreviewUrl: PREVIEW_URL
      });
      await api.follow(viewer, author);
      await servePreview(page);

      await app.launchAs(viewer);
      await feedPage.selectFeedTab("following");
      // The player is only mounted once the card takes focus.
      const video = feedPage.post("following", id).locator("video");
      await expect(video).toHaveCount(1);
      await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.muted)).toBe(
        true
      );
    }
  );

  test(
    "the mute toggle is on every card and the choice lasts for the session",
    meta({
      description:
        "Each card with a song has a sound button. Silencing on one card shows Reativar " +
        "música on the others too, and it is still silenced after opening a Recorda and " +
        "coming back to the Feed.",
      requirement: "RF-16.5",
      tag: "@mutates"
    }),
    async ({ api, app, page, feedPage, recordaDetailsPage }) => {
      const [viewer, author] = await Promise.all([
        api.createUser("mute-viewer"),
        api.createUser("mute-author")
      ]);
      const older = await api.createRecorda(author, {
        description: `Older ${uniqueId()}`,
        songPreviewUrl: PREVIEW_URL
      });
      const newer = await api.createRecorda(author, {
        description: `Newer ${uniqueId()}`,
        songPreviewUrl: PREVIEW_URL
      });
      await api.follow(viewer, author);
      await servePreview(page);

      await app.launchAs(viewer);
      await feedPage.selectFeedTab("following");
      const first = feedPage.soundToggle("following", newer.recorda_id);
      const second = feedPage.soundToggle("following", older.recorda_id);

      await test.step("silencing one card silences them all", async () => {
        await expect(first).toHaveAccessibleName(t("feed.sound.mute"));
        await first.click();
        await expect(first).toHaveAccessibleName(t("feed.sound.unmute"));
        await expect(second).toHaveAccessibleName(t("feed.sound.unmute"));
      });

      await test.step("still silenced after opening a Recorda and coming back", async () => {
        await feedPage.post("following", older.recorda_id).click();
        await recordaDetailsPage.expectLoaded();
        await recordaDetailsPage.backButton.click();
        await feedPage.expectLoaded();
        await expect(first).toHaveAccessibleName(t("feed.sound.unmute"));
      });

      await test.step("and the toggle turns the sound back on", async () => {
        await first.click();
        await expect(first).toHaveAccessibleName(t("feed.sound.mute"));
      });
    }
  );
});
