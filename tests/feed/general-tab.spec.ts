import { signedOut } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import type { FeedPage } from "../../src/pages";
import {
  uniqueId,
  type MusicPreferences,
  type NewAccount,
  type RecordaApi
} from "../../src/support/api";

/**
 * FL-07: the Para Você tab. It joins, by recency, the Recordas of followed people and of
 * public accounts with Musical Affinity > 0. Affinity counts shared genres and artists, so
 * each test gives its accounts artists nobody else has: "match" shares one with the viewer,
 * everyone else shares nothing.
 */
test.use({ storageState: signedOut });

/** Tastes made of the given artists and three genres nobody else has. */
function tastes(tag: string, artistIds: number[]): MusicPreferences {
  const genreBase = 1_000_000_000 + Math.floor(Math.random() * 400_000_000);
  return {
    genres: [1, 2, 3].map((n) => ({ deezer_id: genreBase + n, name: `E2E ${tag} genre ${n}` })),
    artists: artistIds.map((id) => ({ deezer_id: id, name: `E2E artist ${id}` })),
    favorite_track: { deezer_id: artistIds[0]!, title: `E2E ${tag} song`, artist_name: "E2E" }
  };
}

/** A viewer, and a factory for accounts that do (`shares`) or don't share an artist with it. */
function tasteCircle(api: RecordaApi, label: string) {
  const base = 1_500_000_000 + Math.floor(Math.random() * 400_000_000);
  const viewerArtists = [base, base + 1, base + 2];
  let next = base + 100;
  const tag = `${label}-${uniqueId()}`;
  return {
    viewer: () =>
      api.createUser(`${label}-viewer`, { preferences: tastes(`${tag}-v`, viewerArtists) }),
    account: (name: string, shares: boolean) => {
      const own = [next++, next++, next++];
      const artists = shares ? [viewerArtists[0]!, own[0]!, own[1]!] : own;
      return api.createUser(`${label}-${name}`, { preferences: tastes(`${tag}-${name}`, artists) });
    }
  };
}

async function post(api: RecordaApi, author: NewAccount, text: string): Promise<string> {
  return (await api.createRecorda(author, { description: `${text} ${uniqueId()}` })).recorda_id;
}

/** The Para Você cards, by test id, in the order shown. */
async function expectGeneralFeed(feedPage: FeedPage, recordaIds: string[]): Promise<void> {
  await expect(feedPage.posts("general")).toHaveCount(recordaIds.length);
  for (const [index, id] of recordaIds.entries()) {
    await expect(feedPage.posts("general").nth(index)).toHaveAttribute(
      "data-testid",
      `feed-post-${id}`
    );
  }
}

test.describe("Para Você tab", () => {
  test(
    "Para Você mixes followed people and public accounts with musical affinity, by recency",
    meta({
      description:
        "The tab shows, newest first, the Recordas of a followed account (with no affinity) " +
        "interleaved with those of a public account that shares an artist with the viewer. " +
        "A public account with nothing in common and a private account with affinity that " +
        "the viewer doesn't follow are left out.",
      requirement: "RF-15.2",
      tag: "@mutates"
    }),
    async ({ api, app, feedPage }) => {
      const circle = tasteCircle(api, "mix");
      const [viewer, followed, match, unrelated, privateMatch] = await Promise.all([
        circle.viewer(),
        circle.account("followed", false),
        circle.account("match", true),
        circle.account("unrelated", false),
        circle.account("private", true)
      ]);
      await api.follow(viewer, followed);
      await api.setPrivate(privateMatch, true);

      // One at a time, so their publication times are in this order.
      const followedOld = await post(api, followed, "Followed old");
      const matchPost = await post(api, match, "Match");
      const followedNew = await post(api, followed, "Followed new");
      const hidden = [
        await post(api, unrelated, "Unrelated"),
        await post(api, privateMatch, "Private")
      ];

      await app.launchAs(viewer);
      await expectGeneralFeed(feedPage, [followedNew, matchPost, followedOld]);
      for (const id of hidden) await expect(feedPage.post("general", id)).toHaveCount(0);
    }
  );

  test(
    "a private account's Recordas reach Para Você only once the follow is approved",
    meta({
      description:
        "A private account with musical affinity stays out of Para Você while the viewer's " +
        "request is pending, and its Recorda shows up once the request is approved.",
      requirement: "RF-15.5",
      tag: "@mutates"
    }),
    async ({ api, app, feedPage, notificationsPage }) => {
      const circle = tasteCircle(api, "approval");
      const [viewer, owner] = await Promise.all([
        circle.viewer(),
        circle.account("owner", true)
      ]);
      await api.setPrivate(owner, true);
      const id = await post(api, owner, "Followers only");
      expect(await api.follow(viewer, owner)).toBe("solicitado");

      await test.step("pending: not in Para Você", async () => {
        await app.launchAs(viewer);
        await expect(feedPage.emptyState("general")).toBeVisible();
        await expect(feedPage.post("general", id)).toHaveCount(0);
      });

      await test.step("the owner approves the request", async () => {
        await app.launchAs(owner);
        await app.goToNotifications();
        const request = notificationsPage.rows(viewer.user.username, "FOLLOW_REQUEST");
        await notificationsPage.acceptButton(request).click();
        await expect(request).toHaveCount(0);
      });

      await test.step("approved: the Recorda is in Para Você", async () => {
        await app.launchAs(viewer);
        await expectGeneralFeed(feedPage, [id]);
      });
    }
  );

  test(
    "with nobody to discover, Para Você shows the followed people's Recordas",
    meta({
      description:
        "A viewer whose tastes match nobody, following one account, sees that account's " +
        "Recordas on Para Você instead of an empty tab.",
      requirement: "RF-15.6",
      tag: "@mutates"
    }),
    async ({ api, app, feedPage }) => {
      const circle = tasteCircle(api, "fallback");
      const [viewer, followed] = await Promise.all([
        circle.viewer(),
        circle.account("followed", false)
      ]);
      await api.follow(viewer, followed);
      const older = await post(api, followed, "Older");
      const newer = await post(api, followed, "Newer");

      await app.launchAs(viewer);
      await expectGeneralFeed(feedPage, [newer, older]);
    }
  );
});
