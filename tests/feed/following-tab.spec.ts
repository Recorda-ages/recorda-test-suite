import { signedOut } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import { uniqueId } from "../../src/support/api";
import { t } from "../../src/support/i18n";

/**
 * FL-07: the Seguindo tab. Every test but the first builds its own accounts and follows, so
 * the list holds exactly what the test arranged.
 */
test.describe("Following tab", () => {
  test(
    "the Feed opens on Para Você, with Seguindo as the other top tab",
    meta({
      description:
        "Signing in lands on the Feed with its two top tabs, Para Você and Seguindo, and " +
        "Para Você in front; tapping Seguindo brings that list forward. The bottom bar has " +
        "the way back to the Feed.",
      requirement: ["RF-14.1", "RF-15.1"]
    }),
    async ({ app, feedPage }) => {
      // gabriel (the default session) follows other seeded people, so both tabs have cards.
      await app.launch();
      await expect(feedPage.feedTab("general")).toBeVisible();
      await expect(feedPage.feedTab("following")).toBeVisible();
      await expect(feedPage.tabBar.tab("feed")).toBeVisible();

      await test.step("Para Você is the tab in front", async () => {
        await expect(feedPage.panel("general")).toBeInViewport();
        await expect(feedPage.panel("following")).not.toBeInViewport();
        await expect(feedPage.posts("general").first()).toBeVisible();
      });

      await test.step("Seguindo comes forward when tapped", async () => {
        await feedPage.selectFeedTab("following");
        await expect(feedPage.panel("following")).toBeInViewport();
        await expect(feedPage.panel("general")).not.toBeInViewport();
        await expect(feedPage.posts("following").first()).toBeVisible();
      });
    }
  );

  test.describe("with arranged accounts", () => {
    test.use({ storageState: signedOut });

    test(
      "a card shows the author, the media, the song, the caption and the actions",
      meta({
        description:
          "A card on Seguindo shows the author's avatar and username, the photo, the song " +
          "title and artist, the caption, and the Curtir and Comentar buttons; its three-dots " +
          "menu offers Denunciar.",
        requirement: "RF-14.2",
        tag: "@mutates"
      }),
      async ({ api, app, page, feedPage }) => {
        const [viewer, author] = await Promise.all([
          api.createUser("card-viewer"),
          api.createUser("card-author")
        ]);
        await api.setAvatar(author);
        const caption = `Card caption ${uniqueId()}`;
        const { recorda_id: id } = await api.createRecorda(author, {
          description: caption,
          songTitle: "Card Song",
          songArtist: "Card Artist"
        });
        await api.follow(viewer, author);

        await app.launchAs(viewer);
        await feedPage.selectFeedTab("following");
        const card = feedPage.post("following", id);

        await test.step("author, media, song and caption", async () => {
          await expect(card.getByTestId("recorda-author-avatar")).toBeVisible();
          await expect(
            card.getByRole("button", {
              name: t("profile.openA11y", { username: author.user.username })
            })
          ).toBeVisible();
          await expect(card.getByTestId("recorda-media-image")).toBeVisible();
          await expect(card).toContainText("Card Song • Card Artist");
          await expect(card).toContainText(caption);
        });

        await test.step("Curtir, Comentar and, in the menu, Denunciar", async () => {
          await expect(card.getByTestId(`like-button-${id}`)).toBeVisible();
          await expect(card.getByRole("button", { name: t("feed.comment") })).toBeVisible();
          await card.getByRole("button", { name: t("feed.more") }).click();
          await expect(
            page
              .getByTestId("recorda-card-menu")
              .getByText(t("publishedRecorda.report"), { exact: true })
          ).toBeVisible();
        });
      }
    );

    test(
      "a card shows the song's cover",
      meta({
        description: "Next to the song title and artist, the card shows the song's cover art.",
        requirement: "RF-14.2",
        tag: "@mutates"
      }),
      async ({ api, app, feedPage }) => {
        // RF-14.2 (gap): RecordaCard never renders song_cover_url.
        test.fail();
        const [viewer, author] = await Promise.all([
          api.createUser("cover-viewer"),
          api.createUser("cover-author")
        ]);
        const cover = `https://cover.e2e.recorda.test/${uniqueId()}.png`;
        const { recorda_id: id } = await api.createRecorda(author, {
          description: "With a cover",
          songCoverUrl: cover
        });
        await api.follow(viewer, author);

        await app.launchAs(viewer);
        await feedPage.selectFeedTab("following");
        await expect(feedPage.post("following", id)).toBeVisible();
        await expect(feedPage.post("following", id).locator(`img[src="${cover}"]`)).toHaveCount(
          1,
          { timeout: 3_000 }
        );
      }
    );

    test(
      "Seguindo lists only followed people, newest first, including approved private accounts",
      meta({
        description:
          "The tab shows the Recordas of a followed public account and of a private one that " +
          "approved the request, newest first, without either following back. A private " +
          "account with a pending request, a public account not followed and the viewer's own " +
          "Recorda are left out.",
        requirement: ["RF-14.3", "RF-14.4"],
        tag: "@mutates"
      }),
      async ({ api, app, feedPage }) => {
        const [viewer, open, approved, pending, stranger] = await Promise.all([
          api.createUser("following-viewer"),
          api.createUser("following-open"),
          api.createUser("following-approved"),
          api.createUser("following-pending"),
          api.createUser("following-stranger")
        ]);
        // Followed while public, then made private: an approved follower of a private account.
        await api.follow(viewer, open);
        await api.follow(viewer, approved);
        await Promise.all([api.setPrivate(approved, true), api.setPrivate(pending, true)]);
        expect(await api.follow(viewer, pending)).toBe("solicitado");

        const post = async (author: typeof viewer, text: string) =>
          (await api.createRecorda(author, { description: `${text} ${uniqueId()}` })).recorda_id;
        // One at a time, so their publication times are in this order.
        const oldest = await post(open, "Oldest");
        const middle = await post(approved, "Middle");
        const newest = await post(open, "Newest");
        const hidden = [await post(pending, "Pending"), await post(stranger, "Stranger")];
        const own = await post(viewer, "Own");

        await app.launchAs(viewer);
        await feedPage.selectFeedTab("following");

        await test.step("followed accounts, newest first", async () => {
          const ids = [newest, middle, oldest].map((id) => `feed-post-${id}`);
          await expect(feedPage.posts("following")).toHaveCount(3);
          for (const [index, testId] of ids.entries()) {
            await expect(feedPage.posts("following").nth(index)).toHaveAttribute(
              "data-testid",
              testId
            );
          }
        });

        await test.step("pending, not followed and own Recordas are not there", async () => {
          for (const id of [...hidden, own]) {
            await expect(feedPage.post("following", id)).toHaveCount(0);
          }
        });
      }
    );

    test(
      "with nobody followed, Seguindo suggests following people",
      meta({
        description:
          "A new account that follows nobody sees, on Seguindo, the empty state telling it " +
          "to follow people to see their Recordas.",
        requirement: "RF-14.5",
        tag: "@mutates"
      }),
      async ({ app, feedPage, newAccount }) => {
        await app.launchAs(newAccount);
        await feedPage.selectFeedTab("following");
        const empty = feedPage.emptyState("following");
        await expect(empty).toContainText(t("feed.emptyState.title"));
        await expect(empty).toContainText(t("feed.emptyState.message"));
        await expect(feedPage.posts("following")).toHaveCount(0);
      }
    );
  });
});
