import { signedOut } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import type { FeedPage, UserSearchPage } from "../../src/pages";
import { uniqueId } from "../../src/support/api";

/**
 * FL-09: finding people by username and following them. Every test creates its own
 * accounts and follows, so they are `@mutates` and run against the local stack only.
 */
test.use({ storageState: signedOut });

/** Feed → search → types `username` and waits for its result row. */
async function search(feedPage: FeedPage, userSearchPage: UserSearchPage, username: string) {
  await feedPage.searchButton.click();
  await userSearchPage.expectLoaded();
  await userSearchPage.input.fill(username);
}

test.describe("Searching for people", () => {
  test(
    "search finds a person by username, shows the relation and opens the profile",
    meta({
      description:
        "Typing a username lists that person with their avatar, username and the relation: " +
        "Seguir before following, Seguindo after following a public account, Solicitado " +
        "after asking to follow a private one. Tapping the result opens the profile.",
      requirement: ["RF-19.1", "RF-19.2", "RF-19.3"],
      tag: "@mutates"
    }),
    async ({ api, app, feedPage, userSearchPage, userProfilePage }) => {
      const [viewer, open, closed] = await Promise.all([
        api.createUser("search-viewer"),
        api.createUser("search-open"),
        api.createUser("search-closed")
      ]);
      await api.setPrivate(closed, true);
      const openId = open.session.user.user_id;
      const closedId = closed.session.user.user_id;

      await app.launchAs(viewer);

      await test.step("a person not followed yet shows Seguir", async () => {
        await search(feedPage, userSearchPage, open.user.username);
        const row = userSearchPage.resultRow(openId);
        await expect(row).toContainText(open.user.username);
        await expect(row.getByTestId(`user-avatar-fallback-${openId}`)).toBeVisible();
        await userSearchPage.followButton(openId).expectState("follow");
      });

      await test.step("following a public account shows Seguindo", async () => {
        await api.follow(viewer, open);
        await app.launch();
        await search(feedPage, userSearchPage, open.user.username);
        await userSearchPage.followButton(openId).expectState("following");
      });

      await test.step("a request to a private account shows Solicitado", async () => {
        await api.follow(viewer, closed);
        await userSearchPage.input.fill(closed.user.username);
        await userSearchPage.followButton(closedId).expectState("requested");
      });

      await test.step("tapping a result opens the profile", async () => {
        await userSearchPage.input.fill(open.user.username);
        await userSearchPage.resultRow(openId).click();
        await userProfilePage.expectLoaded();
        await expect(userProfilePage.details.username(open.user.username)).toBeVisible();
      });
    }
  );

  test(
    "a private account appears in search but its content stays protected",
    meta({
      description:
        "A private account is found by username like any other, and opening it shows the " +
        "private-account notice instead of its Recordas.",
      requirement: "RF-19.4",
      tag: "@mutates"
    }),
    async ({ api, app, feedPage, userSearchPage, userProfilePage }) => {
      const [viewer, closed] = await Promise.all([
        api.createUser("private-viewer"),
        api.createUser("private-owner")
      ]);
      const { recorda_id: recordaId } = await api.createRecorda(closed, {
        description: `Private ${uniqueId()}`
      });
      await api.setPrivate(closed, true);
      const closedId = closed.session.user.user_id;

      await app.launchAs(viewer);
      await search(feedPage, userSearchPage, closed.user.username);
      await expect(userSearchPage.resultRow(closedId)).toBeVisible();
      await userSearchPage.resultRow(closedId).click();

      await userProfilePage.expectLoaded();
      await expect(userProfilePage.details.privateNotice).toBeVisible();
      await expect(userProfilePage.details.gridItem(recordaId)).toHaveCount(0);
    }
  );
});

test.describe("Following", () => {
  test(
    "following a public account takes effect at once",
    meta({
      description:
        "Another person's profile has a Seguir button; tapping it makes it Seguindo right " +
        "away, the viewer is in the account's followers, and its Recordas show.",
      requirement: ["RF-20.1", "RF-20.2"],
      tag: "@mutates"
    }),
    async ({ api, app, userProfilePage }) => {
      const [viewer, open] = await Promise.all([
        api.createUser("follow-viewer"),
        api.createUser("follow-open")
      ]);
      const { recorda_id: recordaId } = await api.createRecorda(open, {
        description: `Public ${uniqueId()}`
      });
      const follow = userProfilePage.followButton(open.session.user.user_id);

      await app.launchAs(viewer);
      await app.goToUserProfile(open.user.username);
      await follow.expectState("follow");

      await follow.button.click();
      await follow.expectState("following");
      await expect.poll(() => api.followers(open)).toEqual([viewer.user.username]);
      await expect(userProfilePage.details.gridItem(recordaId)).toBeVisible();
    }
  );

  test(
    "following a private account sends a request and notifies the owner",
    meta({
      description:
        "Tapping Seguir on a private account turns the button into Solicitado without " +
        "following yet, and the owner gets a follow-request notification.",
      requirement: "RF-20.3",
      tag: "@mutates"
    }),
    async ({ api, app, userProfilePage }) => {
      const [viewer, closed] = await Promise.all([
        api.createUser("request-viewer"),
        api.createUser("request-owner")
      ]);
      await api.setPrivate(closed, true);
      const follow = userProfilePage.followButton(closed.session.user.user_id);

      await app.launchAs(viewer);
      await app.goToUserProfile(closed.user.username);
      await follow.button.click();
      await follow.expectState("requested");

      expect(await api.followers(closed)).toEqual([]);
      await expect
        .poll(async () =>
          (await api.notifications(closed)).items.some(
            (item) =>
              item.type === "FOLLOW_REQUEST" && item.sender?.username === viewer.user.username
          )
        )
        .toBe(true);
    }
  );

  test(
    "unfollowing removes the follow without telling the other person",
    meta({
      description:
        "Unfollowing from the profile turns the button back into Seguir, takes the viewer " +
        "out of the followers, and adds no notification for the other person.",
      requirement: "RF-20.5",
      tag: "@mutates"
    }),
    async ({ api, app, userProfilePage }) => {
      const [viewer, open] = await Promise.all([
        api.createUser("unfollow-viewer"),
        api.createUser("unfollow-open")
      ]);
      await api.follow(viewer, open);
      const before = (await api.notifications(open)).items.length;
      const follow = userProfilePage.followButton(open.session.user.user_id);

      await app.launchAs(viewer);
      await app.goToUserProfile(open.user.username);
      await follow.expectState("following");
      await follow.unfollow();
      await follow.expectState("follow");

      await expect.poll(() => api.followers(open)).toEqual([]);
      expect((await api.notifications(open)).items).toHaveLength(before);
    }
  );

  test(
    "unfollowing needs no confirmation",
    meta({
      description:
        "Tapping Seguindo unfollows at once, as US 20 says, without a confirmation dialog.",
      requirement: "RF-20.5",
      tag: "@mutates"
    }),
    async ({ api, app, userProfilePage }) => {
      // RF-20.5 (gap): the frontend asks "Deixar de seguir?" first (UnfollowDialog, chosen in
      // recorda-frontend docs/issue-255.md); US 20 says no confirmation. Open question.
      test.fail();
      const [viewer, open] = await Promise.all([
        api.createUser("noconfirm-viewer"),
        api.createUser("noconfirm-open")
      ]);
      await api.follow(viewer, open);
      const follow = userProfilePage.followButton(open.session.user.user_id);

      await app.launchAs(viewer);
      await app.goToUserProfile(open.user.username);
      await follow.button.click();
      await follow.expectState("follow");
      await expect(follow.unfollowDialog).toHaveCount(0);
    }
  );
});
