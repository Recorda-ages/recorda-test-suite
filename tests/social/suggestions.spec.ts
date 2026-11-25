import { signedOut } from "../../src/data/users";
import type { Page } from "@playwright/test";

import { expect, meta, test } from "../../src/fixtures";
import type { FeedPage, UserSearchPage } from "../../src/pages";
import { uniqueId, type MusicPreferences, type RecordaApi } from "../../src/support/api";

/**
 * FL-09: profiles suggested by Musical Affinity on the search screen (before typing).
 *
 * Affinity counts shared genres and artists (artists by Deezer id). The viewer gets six
 * artists nobody else has; "close" shares three of them and "far" one, so the backend ranks
 * close above far and nobody else (seed or other test users) has anything in common.
 */
test.use({ storageState: signedOut });

/** Tastes with `artistIds` and three genres nobody else has. */
function tastes(tag: string, artistIds: number[]): MusicPreferences {
  const genreBase = 1_000_000_000 + Math.floor(Math.random() * 400_000_000);
  return {
    genres: [1, 2, 3].map((n) => ({ deezer_id: genreBase + n, name: `E2E ${tag} genre ${n}` })),
    artists: artistIds.map((id) => ({ deezer_id: id, name: `E2E artist ${id}` })),
    favorite_track: { deezer_id: artistIds[0]!, title: `E2E ${tag} song`, artist_name: "E2E" }
  };
}

/**
 * Feed → search, waiting for the suggestions request. It scores every account one by one
 * (user_service.suggest_by_affinity), so it is slow on a local database full of test users.
 */
async function openSuggestions(page: Page, feedPage: FeedPage, userSearchPage: UserSearchPage) {
  const loaded = page.waitForResponse("**/api/v1/users/suggestions**", { timeout: 45_000 });
  await feedPage.searchButton.click();
  await userSearchPage.expectLoaded();
  await loaded;
}

/** The viewer plus people with known affinity to it. */
async function tasteNeighbours(api: RecordaApi, label: string) {
  const base = 1_500_000_000 + Math.floor(Math.random() * 400_000_000);
  const mine = [0, 1, 2, 3, 4, 5].map((n) => base + n);
  const others = (offset: number) => [0, 1, 2].map((n) => base + 1000 + offset + n);
  const tag = `${label}-${uniqueId()}`;
  const [viewer, close, far, followed, requested] = await Promise.all([
    api.createUser(`${label}-viewer`, { preferences: tastes(`${tag}-v`, mine) }),
    api.createUser(`${label}-close`, { preferences: tastes(`${tag}-c`, mine.slice(0, 3)) }),
    api.createUser(`${label}-far`, {
      preferences: tastes(`${tag}-f`, [mine[0]!, ...others(0).slice(1)])
    }),
    api.createUser(`${label}-followed`, { preferences: tastes(`${tag}-fo`, mine.slice(0, 3)) }),
    api.createUser(`${label}-requested`, { preferences: tastes(`${tag}-r`, mine.slice(0, 3)) })
  ]);
  return { viewer, close, far, followed, requested };
}

test.describe("Suggested profiles", () => {
  test(
    "suggestions are ordered by musical affinity and skip followed, requested and yourself",
    meta({
      description:
        "Before typing, the search shows suggested profiles: the person sharing more artists " +
        "comes before the one sharing fewer, while someone already followed, someone with a " +
        "pending request and the viewer themself are left out.",
      requirement: ["RF-27.1", "RF-27.2"],
      tag: "@mutates"
    }),
    async ({ api, app, page, feedPage, userSearchPage }) => {
      const { viewer, close, far, followed, requested } = await tasteNeighbours(api, "rank");
      await api.follow(viewer, followed);
      await api.setPrivate(requested, true);
      expect(await api.follow(viewer, requested)).toBe("solicitado");
      const id = (account: { session: { user: { user_id: string } } }) =>
        account.session.user.user_id;

      await app.launchAs(viewer);
      await openSuggestions(page, feedPage, userSearchPage);

      await test.step("the closer match comes first", async () => {
        await expect(userSearchPage.suggestionItems()).toHaveCount(2);
        await expect(userSearchPage.suggestionItems().nth(0)).toHaveAttribute(
          "data-testid",
          `suggested-profile-${id(close)}`
        );
        await expect(userSearchPage.suggestionItems().nth(1)).toHaveAttribute(
          "data-testid",
          `suggested-profile-${id(far)}`
        );
      });

      await test.step("followed, requested and the viewer are not suggested", async () => {
        await expect(userSearchPage.suggestion(id(followed))).toHaveCount(0);
        await expect(userSearchPage.suggestion(id(requested))).toHaveCount(0);
        await expect(userSearchPage.suggestion(id(viewer))).toHaveCount(0);
      });
    }
  );

  test(
    "each suggestion shows the person and a follow action",
    meta({
      description:
        "A suggestion shows the person's username and avatar, and its follow toggle follows " +
        "them from the search screen.",
      requirement: "RF-27.3",
      tag: "@mutates"
    }),
    async ({ api, app, page, feedPage, userSearchPage }) => {
      const { viewer, close } = await tasteNeighbours(api, "card");
      const closeId = close.session.user.user_id;

      await app.launchAs(viewer);
      await openSuggestions(page, feedPage, userSearchPage);

      const suggestion = userSearchPage.suggestion(closeId);
      await expect(suggestion).toHaveAccessibleName(close.user.username);
      await expect(userSearchPage.suggestions).toContainText(close.user.username);
      await userSearchPage.suggestionFollow(closeId).click();
      await expect.poll(() => api.followers(close)).toEqual([viewer.user.username]);
    }
  );

  test(
    "each suggestion shows the genres and artists in common",
    meta({
      description:
        "A suggestion names what the viewer and the suggested person have in common, as US 27 " +
        "asks.",
      requirement: "RF-27.3",
      tag: "@mutates"
    }),
    async ({ api, app, page, feedPage, userSearchPage }) => {
      // RF-27.3 (gap): GET /users/suggestions returns common_genres and common_artists, but
      // SuggestedProfiles shows only avatar, username and the follow toggle.
      test.fail();
      const { viewer, close } = await tasteNeighbours(api, "common");

      await app.launchAs(viewer);
      await openSuggestions(page, feedPage, userSearchPage);
      await expect(userSearchPage.suggestion(close.session.user.user_id)).toBeVisible();
      await expect(userSearchPage.suggestions).toContainText(close.preferences.artists[0]!.name, {
        timeout: 3_000
      });
    }
  );
});
