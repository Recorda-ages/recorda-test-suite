import { signedOut } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";

/**
 * FL-09: the Seguidores / Seguindo lists of your own profile, and removing a follower.
 * Every test creates its own accounts and follows, so they are `@mutates`.
 */
test.use({ storageState: signedOut });

test.describe("Followers and following", () => {
  test(
    "the profile opens the followers and following lists, each with a search",
    meta({
      description:
        "From the profile counters, Seguidores lists who follows the account and Seguindo " +
        "who it follows; typing in the search narrows each list to the matching username.",
      requirement: "RF-22.1",
      tag: "@mutates"
    }),
    async ({ api, app, profilePage, friendsPage }) => {
      const [me, fanA, fanB, idol] = await Promise.all([
        api.createUser("lists-me"),
        api.createUser("lists-fan-a"),
        api.createUser("lists-fan-b"),
        api.createUser("lists-idol")
      ]);
      await api.follow(fanA, me);
      await api.follow(fanB, me);
      await api.follow(me, idol);

      await app.launchAs(me);
      await app.goToProfile();

      await test.step("Seguidores lists both followers", async () => {
        await profilePage.details.count("followers", 2).click();
        await friendsPage.expectLoaded();
        await expect(friendsPage.entry(fanA.user.username)).toBeVisible();
        await expect(friendsPage.entry(fanB.user.username)).toBeVisible();
      });

      await test.step("the search narrows the followers to one", async () => {
        await friendsPage.search.fill(fanB.user.username);
        await expect(friendsPage.entry(fanB.user.username)).toBeVisible();
        await expect(friendsPage.entry(fanA.user.username)).toHaveCount(0);
        await friendsPage.search.fill("");
      });

      await test.step("Seguindo lists who the account follows, also searchable", async () => {
        await friendsPage.tab("following").click();
        await expect(friendsPage.entry(idol.user.username)).toBeVisible();
        await expect(friendsPage.entry(fanA.user.username)).toHaveCount(0);
        await friendsPage.search.fill(`${idol.user.username}-nobody`);
        await expect(friendsPage.entry(idol.user.username)).toHaveCount(0);
      });
    }
  );

  test(
    "removing a follower is silent, and on a private account they must ask again",
    meta({
      description:
        "A private account removes a follower from its Seguidores list after confirming. " +
        "The removed person gets no notification, sees Seguir on the profile again, and " +
        "following again only sends a request.",
      requirement: "RF-22.2",
      tag: "@mutates"
    }),
    async ({ api, app, profilePage, friendsPage, userProfilePage }) => {
      const [me, fan] = await Promise.all([
        api.createUser("remove-me"),
        api.createUser("remove-fan")
      ]);
      await api.follow(fan, me);
      await api.setPrivate(me, true);
      const before = (await api.notifications(fan)).items.length;

      await test.step("the account removes the follower", async () => {
        await app.launchAs(me);
        await app.goToProfile();
        await profilePage.details.count("followers", 1).click();
        await friendsPage.expectLoaded();
        await friendsPage.removeFollower(fan.user.username);
        await expect(friendsPage.entry(fan.user.username)).toHaveCount(0);
        await expect.poll(() => api.followers(me)).toEqual([]);
      });

      await test.step("the removed person is not told and has to ask again", async () => {
        expect((await api.notifications(fan)).items).toHaveLength(before);
        await app.launchAs(fan);
        await app.goToUserProfile(me.user.username);
        const follow = userProfilePage.followButton(me.session.user.user_id);
        await follow.expectState("follow");
        await follow.button.click();
        await follow.expectState("requested");
      });
    }
  );

  test(
    "on a private account only approved followers can see the lists",
    meta({
      description:
        "The followers list of a private account is refused to someone who doesn't follow it " +
        "and given to an approved follower. Other people's profiles have no link to the lists " +
        "in the app, so this is checked on the API the lists use.",
      requirement: "RF-22.3",
      tag: "@mutates"
    }),
    async ({ api }) => {
      const [owner, approved, stranger] = await Promise.all([
        api.createUser("lists-owner"),
        api.createUser("lists-approved"),
        api.createUser("lists-stranger")
      ]);
      await api.follow(approved, owner);
      await api.setPrivate(owner, true);

      expect(await api.followers(approved, owner)).toEqual([approved.user.username]);
      expect(await api.followersStatus(stranger, owner)).toBe(403);
    }
  );
});
