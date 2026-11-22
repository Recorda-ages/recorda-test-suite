import { signedOut } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import type { FeedPage, RecordaDetailsPage } from "../../src/pages";
import { type RecordaApi, type TestAccount, uniqueId } from "../../src/support/api";
import { LOCALE, t } from "../../src/support/i18n";

/**
 * FL-08: a Recorda's details, likes and comments.
 *
 * Every test creates its own author (with one Recorda) and a viewer who follows them. Test
 * users have unique music tastes, so the viewer's "Para Você" feed holds exactly that
 * Recorda and the author's feed holds only their own. Nothing is shared with other tests,
 * so they all run in parallel and only against the local stack (`@mutates`).
 */
test.use({ storageState: signedOut });

type Arranged = {
  author: TestAccount;
  viewer: TestAccount;
  recordaId: string;
  description: string;
  songTitle: string;
};

async function arrange(api: RecordaApi, label: string): Promise<Arranged> {
  const [author, viewer] = await Promise.all([
    api.createUser(`${label}-a`),
    api.createUser(`${label}-v`)
  ]);
  const description = `Recorda ${label} ${uniqueId()}`;
  const songTitle = `Song ${uniqueId()}`;
  const recorda = await api.createRecorda(author, { description, songTitle });
  await api.follow(viewer, author);
  return { author, viewer, recordaId: recorda.recorda_id, description, songTitle };
}

/** Feed card → details. */
async function openFromFeed(feedPage: FeedPage, details: RecordaDetailsPage, recordaId: string) {
  const card = feedPage.post("general", recordaId);
  await expect(card).toBeVisible();
  await card.click();
  await details.expectLoaded();
}

const likesPath = (recordaId: string) => `**/api/v1/recordas/${recordaId}/likes`;

test.describe("Recorda details, likes and comments", () => {
  test(
    "a feed card and a profile thumbnail both open the Recorda details",
    meta({
      description:
        "Tapping a Recorda card in the feed, or its thumbnail in the author's profile grid, " +
        "opens the details screen of that Recorda.",
      requirement: "RF-17.1",
      tag: "@mutates"
    }),
    async ({ api, app, feedPage, profilePage, recordaDetailsPage: details }) => {
      const { author, viewer, recordaId } = await arrange(api, "open");

      await test.step("a viewer taps the card in the feed", async () => {
        await app.launchAs(viewer);
        await openFromFeed(feedPage, details, recordaId);
        await expect(details.author(author.user.username)).toBeVisible();
      });

      await test.step("the author taps the thumbnail in their profile", async () => {
        await app.launchAs(author);
        await app.goToProfile();
        await profilePage.gridItem(recordaId).click();
        await details.expectLoaded();
        await expect(details.author(author.user.username)).toBeVisible();
      });
    }
  );

  test(
    "the details show the whole Recorda, with memory date, place and tagged people",
    meta({
      description:
        "The details show media, author, full description, song and comments, plus the " +
        "Memory Date, Place and tagged users decided for the Recorda.",
      requirement: "RF-17.2",
      tag: "@mutates"
    }),
    async ({ api, app, feedPage, recordaDetailsPage: details }) => {
      // RF-17.2 gap: the Recorda model has no Memory Date, Place nor tags yet.
      test.fail();
      const { author, viewer, recordaId, description, songTitle } = await arrange(api, "show");
      const comment = `Comment ${uniqueId()}`;
      await api.comment(author, recordaId, comment);

      await test.step("the viewer opens the Recorda", async () => {
        await app.launchAs(viewer);
        await openFromFeed(feedPage, details, recordaId);
      });

      await test.step("author, song, full description and comments are shown", async () => {
        await expect(details.author(author.user.username)).toBeVisible();
        await expect(details.root.getByText(songTitle)).toBeVisible();
        await expect(details.description).toContainText(description);
        await details.openComments();
        await expect(details.comment(comment)).toBeVisible();
      });

      await test.step("memory date, place and tagged users are shown", async () => {
        // TODO(frontend): testIDs to be added with the memory fields.
        await expect(details.root.getByTestId("recorda-memory-date")).toBeVisible();
        await expect(details.root.getByTestId("recorda-location")).toBeVisible();
        await expect(details.root.getByTestId("recorda-tagged-users")).toBeVisible();
      });
    }
  );

  test(
    "the feed card and the details offer like, comment and share",
    meta({
      description:
        "Feed cards and the details screen have a like button; the details also let the " +
        "user open the comments and share the Recorda.",
      requirement: ["RF-17.4", "RF-23.1"],
      tag: "@mutates"
    }),
    async ({ api, app, page, feedPage, recordaDetailsPage: details }) => {
      const { viewer, recordaId } = await arrange(api, "actions");

      await test.step("the feed card has a like button", async () => {
        await app.launchAs(viewer);
        await expect(feedPage.likeButton("general", recordaId)).toBeVisible();
      });

      await test.step("the details have like, comment and share", async () => {
        await openFromFeed(feedPage, details, recordaId);
        await expect(details.likeButton).toBeVisible();
        await expect(details.commentButton).toBeVisible();
        await expect(details.shareButton).toBeVisible();
      });

      await test.step("comment opens the comments sheet", async () => {
        await details.openComments();
        await expect(details.commentInput).toBeVisible();
        await details.root.getByTestId("comments-backdrop").click();
        await expect(details.commentsSheet).toBeHidden();
      });

      await test.step("share opens the share card", async () => {
        await details.shareButton.click();
        await expect(page.getByTestId("share-card-screen")).toBeVisible();
      });
    }
  );

  test(
    "the three-dots menu offers only delete on your Recorda and only report on others'",
    meta({
      description:
        "On someone else's Recorda the menu reports (no delete); on your own it deletes " +
        "(no report). Neither offers editing. Checked on the feed card and on the details.",
      requirement: "RF-17.5",
      tag: "@mutates"
    }),
    async ({ api, app, page, feedPage, recordaDetailsPage: details }) => {
      const { author, viewer, recordaId } = await arrange(api, "menu");
      const cardMore = () =>
        feedPage.post("general", recordaId).getByRole("button", { name: t("feed.more") });
      const cardMenu = feedPage.cardMenu();
      const cardOption = (key: string) =>
        cardMenu.getByRole("button", { name: t(key), exact: true });
      const closeCardMenu = async () => {
        await page.getByTestId("recorda-card-menu-backdrop").click();
        await expect(cardMenu).toBeHidden();
      };

      await test.step("someone else's card: report, no delete", async () => {
        await app.launchAs(viewer);
        await cardMore().click();
        await expect(cardOption("publishedRecorda.report")).toBeVisible();
        await expect(cardOption("publishedRecorda.delete")).toHaveCount(0);
        // "Não interessado" (disabled) and "Denunciar": nothing else, so no edit.
        await expect(cardMenu.getByRole("button")).toHaveCount(2);
        await closeCardMenu();
      });

      await test.step("someone else's details: report, no delete", async () => {
        await openFromFeed(feedPage, details, recordaId);
        await details.openMenu();
        await expect(details.otherMenu).toBeVisible();
        await expect(details.reportOption).toBeVisible();
        await expect(details.deleteRecordaOption).toHaveCount(0);
        await expect(details.otherMenu.getByRole("button")).toHaveCount(2);
      });

      await test.step("own card: delete, no report", async () => {
        await app.launchAs(author);
        await cardMore().click();
        await expect(cardOption("publishedRecorda.delete")).toBeVisible();
        await expect(cardMenu.getByRole("button")).toHaveCount(1);
        await closeCardMenu();
      });

      await test.step("own details: delete, no report", async () => {
        await openFromFeed(feedPage, details, recordaId);
        await details.openMenu();
        await expect(details.deleteRecordaOption).toBeVisible();
        await expect(details.reportOption).toHaveCount(0);
        await expect(details.notInterestedOption).toHaveCount(0);
      });
    }
  );

  test(
    "liking toggles at once, shows the count and matches the server",
    meta({
      description:
        "The like count is shown on the card and the details. Liking updates it before the " +
        "server answers, the server keeps the result, and liking again undoes it.",
      requirement: ["RF-23.2", "RF-23.3"],
      tag: "@mutates"
    }),
    async ({ api, app, page, feedPage, recordaDetailsPage: details }) => {
      const { viewer, recordaId } = await arrange(api, "like");
      const fan = await api.createUser("like-f");
      await api.like(fan, recordaId);
      const likeResponse = (method: "POST" | "DELETE") =>
        page.waitForResponse(
          (r) => r.url().endsWith(`/recordas/${recordaId}/likes`) && r.request().method() === method
        );

      await test.step("card and details show the current count", async () => {
        await app.launchAs(viewer);
        await expect(
          feedPage
            .post("general", recordaId)
            .getByText(t("feed.likesCount", { count: 1 }), { exact: true })
        ).toBeVisible();
        await openFromFeed(feedPage, details, recordaId);
        await expect(details.likesCount(1)).toBeVisible();
      });

      await test.step("liking updates the count before the server answers", async () => {
        let release!: () => void;
        const serverAnswer = new Promise<void>((resolve) => (release = resolve));
        await page.route(likesPath(recordaId), async (route) => {
          await serverAnswer;
          await route.continue();
        });
        const liked = likeResponse("POST");
        await details.likeButton.click();
        await expect(details.likesCount(2)).toBeVisible();
        release();
        expect((await liked).ok()).toBe(true);
        await page.unroute(likesPath(recordaId));
        expect(await api.likeState(viewer, recordaId)).toEqual({ likes_count: 2, is_liked: true });
      });

      await test.step("the like is still there after reopening the app", async () => {
        await app.launchAs(viewer);
        await openFromFeed(feedPage, details, recordaId);
        await expect(details.likesCount(2)).toBeVisible();
      });

      await test.step("liking again removes the like", async () => {
        const unliked = likeResponse("DELETE");
        await details.likeButton.click();
        await expect(details.likesCount(1)).toBeVisible();
        expect((await unliked).ok()).toBe(true);
        expect(await api.likeState(viewer, recordaId)).toEqual({
          likes_count: 1,
          is_liked: false
        });
      });
    }
  );

  test(
    "the author is notified of other people's likes but not of their own",
    meta({
      description:
        "A like from someone else shows up in the author's notifications; the author liking " +
        "their own Recorda does not notify them.",
      requirement: "RF-23.4",
      tag: "@mutates"
    }),
    async ({ api, app, page, feedPage, notificationsPage, recordaDetailsPage: details }) => {
      const { author, viewer, recordaId } = await arrange(api, "likentf");
      const likeResponse = () =>
        page.waitForResponse(
          (r) => r.url().endsWith(`/recordas/${recordaId}/likes`) && r.request().method() === "POST"
        );

      await test.step("a viewer likes the Recorda", async () => {
        await app.launchAs(viewer);
        await openFromFeed(feedPage, details, recordaId);
        const liked = likeResponse();
        await details.likeButton.click();
        expect((await liked).ok()).toBe(true);
      });

      await test.step("the author likes their own Recorda", async () => {
        await app.launchAs(author);
        await openFromFeed(feedPage, details, recordaId);
        const liked = likeResponse();
        await details.likeButton.click();
        expect((await liked).ok()).toBe(true);
        await details.backButton.click();
        await feedPage.expectLoaded();
      });

      await test.step("only the viewer's like is in the author's notifications", async () => {
        await app.goToNotifications();
        await expect(notificationsPage.rows(viewer.user.username, "LIKE")).toHaveCount(1);
        await expect(notificationsPage.rowsOfType("LIKE")).toHaveCount(1);
        await expect(notificationsPage.rows(author.user.username, "LIKE")).toHaveCount(0);
      });
    }
  );

  test(
    "comments are a flat list in the order they were written",
    meta({
      description:
        "The details list the comments oldest first, with a field to write a new one that " +
        "lands at the end; comments have no replies nor likes.",
      requirement: ["RF-24.1", "RF-24.2"],
      tag: "@mutates"
    }),
    async ({ api, app, feedPage, recordaDetailsPage: details }) => {
      const { author, viewer, recordaId } = await arrange(api, "list");
      const first = `First ${uniqueId()}`;
      const second = `Second ${uniqueId()}`;
      const third = `Third ${uniqueId()}`;
      await api.comment(author, recordaId, first);
      await api.comment(viewer, recordaId, second);

      await test.step("the existing comments are listed oldest first", async () => {
        await app.launchAs(viewer);
        await openFromFeed(feedPage, details, recordaId);
        await details.openComments();
        await expectInOrder(details, [first, second]);
      });

      await test.step("a new comment is added at the end", async () => {
        await details.sendComment(third);
        await expectInOrder(details, [first, second, third]);
        await expect(details.commentInput).toHaveValue("");
        expect((await api.comments(viewer, recordaId)).map((c) => c.content)).toEqual([
          first,
          second,
          third
        ]);
      });

      await test.step("comments can't be liked", async () => {
        await expect(
          details.commentsSheet.getByRole("button", { name: t("feed.like"), exact: true })
        ).toHaveCount(0);
      });
    }
  );

  test(
    "each comment shows avatar, username, text and date",
    meta({
      description:
        "A comment row shows who wrote it (avatar and username), what they wrote and when.",
      requirement: "RF-24.3",
      tag: "@mutates"
    }),
    async ({ api, app, feedPage, recordaDetailsPage: details }) => {
      // RF-24.3 gap: comment rows don't show the date yet.
      test.fail();
      const { author, viewer, recordaId } = await arrange(api, "row");
      const text = `Row ${uniqueId()}`;
      const created = await api.comment(author, recordaId, text);
      const date = new Intl.DateTimeFormat(LOCALE, {
        day: "2-digit",
        month: "long",
        timeZone: "America/Sao_Paulo"
      }).format(new Date(created.created_at));

      await app.launchAs(viewer);
      await openFromFeed(feedPage, details, recordaId);
      await details.openComments();

      const avatar = details.commentsSheet.getByRole("button", {
        name: t("profile.openA11y", { username: author.user.username })
      });
      await expect(avatar).toBeVisible();
      await expect(
        details.commentsSheet.getByText(author.user.username, { exact: true })
      ).toBeVisible();
      await expect(details.comment(text)).toBeVisible();
      await expect(details.commentsSheet.getByText(date)).toBeVisible();
    }
  );

  test(
    "a comment can't be longer than 500 characters",
    meta({
      description:
        "The comment field stops at 500 characters, and a 500-character comment is saved whole.",
      requirement: "RF-24.4",
      tag: "@mutates"
    }),
    async ({ api, app, feedPage, recordaDetailsPage: details }) => {
      const { viewer, recordaId } = await arrange(api, "max");
      const prefix = `Max ${uniqueId()}`;
      const text = `${prefix} `.padEnd(500, "x");

      await app.launchAs(viewer);
      await openFromFeed(feedPage, details, recordaId);
      await details.openComments();

      await test.step("typing past 500 characters is ignored", async () => {
        await details.commentInput.fill(text);
        await details.commentInput.pressSequentially("yz");
        await expect(details.commentInput).toHaveValue(text);
      });

      await test.step("the 500-character comment is saved", async () => {
        await details.sendCommentButton.click();
        await expect(details.comment(prefix)).toBeVisible();
        await expect
          .poll(async () => (await api.comments(viewer, recordaId)).map((c) => c.content))
          .toEqual([text]);
      });
    }
  );

  test(
    "the author is notified of new comments",
    meta({
      description:
        "A comment written by someone else shows up in the Recorda author's notifications.",
      requirement: "RF-24.6",
      tag: "@mutates"
    }),
    async ({ api, app, feedPage, notificationsPage, recordaDetailsPage: details }) => {
      const { author, viewer, recordaId } = await arrange(api, "cmtntf");
      const text = `Hello ${uniqueId()}`;

      await test.step("a viewer comments", async () => {
        await app.launchAs(viewer);
        await openFromFeed(feedPage, details, recordaId);
        await details.openComments();
        await details.sendComment(text);
        await expect(details.comment(text)).toBeVisible();
      });

      await test.step("the author sees it in the notifications", async () => {
        await app.launchAs(author);
        await app.goToNotifications();
        await expect(notificationsPage.rows(viewer.user.username, "COMMENT")).toHaveCount(1);
      });
    }
  );

  test(
    "the comment author deletes their comment after confirming",
    meta({
      description:
        "Only your own comments show a delete button on someone else's Recorda; deleting asks " +
        "for confirmation, cancelling keeps the comment and confirming removes it on the server.",
      requirement: ["RF-25.1", "RF-25.3"],
      tag: "@mutates"
    }),
    async ({ api, app, feedPage, recordaDetailsPage: details }) => {
      const { author, viewer, recordaId } = await arrange(api, "delown");
      const others = await api.comment(author, recordaId, `Author ${uniqueId()}`);
      const mine = `Mine ${uniqueId()}`;

      await test.step("the viewer comments", async () => {
        await app.launchAs(viewer);
        await openFromFeed(feedPage, details, recordaId);
        await details.openComments();
        await details.sendComment(mine);
        await expect(details.comment(mine)).toBeVisible();
      });

      const myComment = (await api.comments(viewer, recordaId)).find((c) => c.content === mine);
      expect(myComment, "the new comment is saved").toBeDefined();
      const deleteMine = details.deleteCommentButton(myComment!.comment_id);

      await test.step("only the viewer's own comment can be deleted", async () => {
        await expect(deleteMine).toBeVisible();
        await expect(details.deleteCommentButton(others.comment_id)).toHaveCount(0);
      });

      await test.step("cancelling keeps the comment", async () => {
        await deleteMine.click();
        await expect(details.deleteCommentDialog).toBeVisible();
        await details.cancelDeleteCommentButton.click();
        await expect(details.deleteCommentDialog).toBeHidden();
        await expect(details.comment(mine)).toBeVisible();
      });

      await test.step("confirming deletes it", async () => {
        await deleteMine.click();
        await expect(details.deleteCommentDialog).toBeVisible();
        await details.confirmDeleteCommentButton.click();
        await expect(details.deleteCommentDialog).toBeHidden();
        await expect(details.comment(mine)).toHaveCount(0);
        await expect(details.comment(others.content)).toBeVisible();
        expect((await api.comments(author, recordaId)).map((c) => c.content)).toEqual([
          others.content
        ]);
      });
    }
  );

  test(
    "the Recorda author deletes someone else's comment for everyone",
    meta({
      description:
        "The author of a Recorda can delete any comment on it; once confirmed, the comment is " +
        "gone for its writer too.",
      requirement: ["RF-25.2", "RF-25.3"],
      tag: "@mutates"
    }),
    async ({ api, app, feedPage, recordaDetailsPage: details }) => {
      const { author, viewer, recordaId } = await arrange(api, "delany");
      const text = `Viewer ${uniqueId()}`;
      const comment = await api.comment(viewer, recordaId, text);

      await test.step("the author deletes the viewer's comment", async () => {
        await app.launchAs(author);
        await openFromFeed(feedPage, details, recordaId);
        await details.openComments();
        await expect(details.comment(text)).toBeVisible();
        await details.deleteCommentButton(comment.comment_id).click();
        await expect(details.deleteCommentDialog).toBeVisible();
        await details.confirmDeleteCommentButton.click();
        await expect(details.comment(text)).toHaveCount(0);
      });

      await test.step("the viewer no longer sees it", async () => {
        await app.launchAs(viewer);
        await openFromFeed(feedPage, details, recordaId);
        await details.openComments();
        await expect(
          details.commentsSheet.getByText(t("publishedRecorda.noComments"))
        ).toBeVisible();
        await expect(details.comment(text)).toHaveCount(0);
        expect(await api.comments(viewer, recordaId)).toEqual([]);
      });
    }
  );
});

/** The comments are on screen, each one below the previous. */
async function expectInOrder(details: RecordaDetailsPage, texts: string[]): Promise<void> {
  const tops: number[] = [];
  for (const text of texts) {
    const comment = details.comment(text);
    await expect(comment).toBeVisible();
    tops.push((await comment.boundingBox())!.y);
  }
  expect(tops, `comments out of order: ${texts.join(" → ")}`).toEqual(
    [...tops].sort((a, b) => a - b)
  );
}
