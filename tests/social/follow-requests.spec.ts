import { signedOut } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import { uniqueId, type RecordaApi } from "../../src/support/api";

/**
 * FL-09: follow requests to private accounts, from the requester's side. Every test creates
 * its own accounts, so they are `@mutates`.
 */
test.use({ storageState: signedOut });

/** A private account with one Recorda, and someone who asked to follow it. */
async function pendingRequest(api: RecordaApi, label: string) {
  const [owner, requester] = await Promise.all([
    api.createUser(`${label}-owner`),
    api.createUser(`${label}-asker`)
  ]);
  const { recorda_id: recordaId } = await api.createRecorda(owner, {
    description: `Private ${label} ${uniqueId()}`
  });
  await api.setPrivate(owner, true);
  expect(await api.follow(requester, owner)).toBe("solicitado");
  return { owner, requester, recordaId };
}

test.describe("Follow requests", () => {
  test(
    "an accepted request shows the Recordas at once and tells the requester",
    meta({
      description:
        "The owner accepts the request in the notification center; the requester then sees " +
        "Seguindo and the account's Recordas on its profile, and gets a request-approved " +
        "notification.",
      requirement: "RF-21.2",
      tag: "@mutates"
    }),
    async ({ api, app, notificationsPage, userProfilePage }) => {
      const { owner, requester, recordaId } = await pendingRequest(api, "accept");

      await test.step("the owner accepts the request", async () => {
        await app.launchAs(owner);
        await app.goToNotifications();
        const request = notificationsPage.rows(requester.user.username, "FOLLOW_REQUEST");
        await notificationsPage.acceptButton(request).click();
        await expect(request).toHaveCount(0);
      });

      await test.step("the requester sees the Recordas right away", async () => {
        await app.launchAs(requester);
        await app.goToUserProfile(owner.user.username);
        await userProfilePage.followButton(owner.session.user.user_id).expectState("following");
        await expect(userProfilePage.details.gridItem(recordaId)).toBeVisible();
      });

      await test.step("and is told the request was approved", async () => {
        await app.launch();
        await app.goToNotifications();
        await expect(
          notificationsPage.rows(owner.user.username, "FOLLOW_ACCEPTED")
        ).toBeVisible();
      });
    }
  );

  test(
    "a declined request is dropped without telling the requester",
    meta({
      description:
        "The owner declines the request; the requester gets no notification about it and " +
        "sees Seguir again, still without access to the Recordas.",
      requirement: "RF-21.3",
      tag: "@mutates"
    }),
    async ({ api, app, notificationsPage, userProfilePage }) => {
      const { owner, requester, recordaId } = await pendingRequest(api, "decline");

      await test.step("the owner declines the request", async () => {
        await app.launchAs(owner);
        await app.goToNotifications();
        const request = notificationsPage.rows(requester.user.username, "FOLLOW_REQUEST");
        await notificationsPage.declineButton(request).click();
        await expect(request).toHaveCount(0);
      });

      await test.step("the requester hears nothing and is back to Seguir", async () => {
        expect((await api.notifications(requester)).items).toEqual([]);
        await app.launchAs(requester);
        await app.goToUserProfile(owner.user.username);
        await userProfilePage.followButton(owner.session.user.user_id).expectState("follow");
        await expect(userProfilePage.details.gridItem(recordaId)).toHaveCount(0);
      });
    }
  );

  test(
    "the requester can cancel a pending request",
    meta({
      description:
        "Tapping Solicitado on the private profile cancels the request: the button goes back " +
        "to Seguir, and it is still Seguir after reopening the app.",
      requirement: "RF-21.4",
      tag: "@mutates"
    }),
    async ({ api, app, userProfilePage }) => {
      const { owner, requester } = await pendingRequest(api, "cancel");
      const follow = userProfilePage.followButton(owner.session.user.user_id);

      await app.launchAs(requester);
      await app.goToUserProfile(owner.user.username);
      await follow.expectState("requested");
      await follow.button.click();
      await follow.expectState("follow");

      // Reopening reads the relation from the server again: the request is really gone.
      await app.launch();
      await app.goToUserProfile(owner.user.username);
      await follow.expectState("follow");
    }
  );
});
