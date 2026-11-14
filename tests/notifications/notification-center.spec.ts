import { randomUUID } from "node:crypto";

import { signedOut } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import { NotificationsPage } from "../../src/pages";
import type { LoginResponse, RecordaApi } from "../../src/support/api";
import { t } from "../../src/support/i18n";

/**
 * FL-10 — Notificações. Each test creates its own users and triggers notifications through
 * the API (follows, likes, comments, mentions), then checks what the recipient sees in the
 * app. Every test writes to the backend, so they run against the local stack only.
 */
test.use({ storageState: signedOut });

/** A new account that skipped nothing: onboarding done, so it boots into the Feed. */
async function newUser(api: RecordaApi, role: string): Promise<LoginResponse> {
  const username = `e2e-${role}-${randomUUID().slice(0, 8)}`;
  const session = await api.register({
    name: `E2E ${role}`,
    username,
    email: `${username}@e2e.recorda.test`,
    password: "E2e-Password1",
    language: "pt-BR"
  });
  await api.completeOnboarding(session);
  return session;
}

/** The follow request `requester` sent to `recipient`, as the recipient's notification. */
async function followRequestId(
  api: RecordaApi,
  recipient: LoginResponse,
  requester: LoginResponse
): Promise<string> {
  const { items } = await api.notifications(recipient);
  const request = items.find(
    (item) => item.type === "FOLLOW_REQUEST" && item.sender?.user_id === requester.user.user_id
  );
  expect(request?.follow_id, "follow request notification").toBeTruthy();
  return request!.follow_id!;
}

test.describe("Notification center", () => {
  test(
    "the bell shows the unread count and opening the list marks it as read",
    meta({
      description:
        "Two new followers show as 2 unread on the Feed bell, which opens the notification " +
        "center; after opening it the count is gone, also after reopening the app.",
      requirement: ["RF-26.1", "RF-26.5"],
      tag: "@mutates"
    }),
    async ({ api, app, page, feedPage, notificationsPage }) => {
      const recipient = await newUser(api, "bell");
      const followers = [await newUser(api, "fan1"), await newUser(api, "fan2")];
      for (const follower of followers) await api.follow(follower, recipient.user.user_id);

      await test.step("the Feed bell shows 2 unread notifications", async () => {
        await app.launchAs(recipient);
        await feedPage.expectLoaded();
        await expect(feedPage.notificationsBadge).toHaveText("2");
        await expect(feedPage.notificationsButton).toHaveAccessibleName(
          t("feed.notificationsUnread", { count: 2 })
        );
      });

      await test.step("the bell opens the notification center", async () => {
        const markedAsRead = page.waitForResponse(
          (response) => response.url().endsWith("/notifications/read-all") && response.ok()
        );
        await app.goToNotifications();
        for (const follower of followers) {
          await expect(notificationsPage.row(follower.user.username, "NEW_FOLLOWER")).toBeVisible();
        }
        await markedAsRead;
      });

      await test.step("back on the Feed, the bell has no unread count", async () => {
        await notificationsPage.backButton.click();
        await feedPage.expectLoaded();
        await expect(feedPage.notificationsBadge).toBeHidden();
        await expect(feedPage.notificationsButton).toHaveAccessibleName(t("feed.notifications"));
      });

      await test.step("the notifications stay read after reopening the app", async () => {
        await app.launch();
        await feedPage.expectLoaded();
        await expect(feedPage.notificationsButton).toHaveAccessibleName(t("feed.notifications"));
        await expect(feedPage.notificationsBadge).toBeHidden();
        expect((await api.notifications(recipient)).unread_count).toBe(0);
      });
    }
  );

  test(
    "notifications are listed newest first with who acted, what happened and the action",
    meta({
      description:
        "A follow, then a like, then a follow request appear in reverse order, each with the " +
        "actor's avatar initial and username and a description; only the request offers " +
        "Accept and Decline, and the like shows the liked Recorda.",
      requirement: "RF-26.2",
      tag: "@mutates"
    }),
    async ({ api, app, notificationsPage }) => {
      const recipient = await newUser(api, "list");
      const [follower, liker, requester] = [
        await newUser(api, "follower"),
        await newUser(api, "liker"),
        await newUser(api, "requester")
      ];
      const recordaId = await api.createRecorda(recipient, {
        description: `RF-26.2 ${randomUUID()}`
      });
      await api.follow(follower, recipient.user.user_id);
      await api.like(liker, recordaId);
      await api.setPrivate(recipient, true);
      await api.follow(requester, recipient.user.user_id);

      await app.launchAs(recipient);
      await app.goToNotifications();

      const request = notificationsPage.row(requester.user.username, "FOLLOW_REQUEST");
      const like = notificationsPage.row(liker.user.username, "LIKE");
      const follow = notificationsPage.row(follower.user.username, "NEW_FOLLOWER");

      await test.step("the newest notification comes first", async () => {
        await expect(
          notificationsPage.rowsOf([follower, liker, requester].map((user) => user.user.username))
        ).toHaveText([
          new RegExp(NotificationsPage.message(requester.user.username, "FOLLOW_REQUEST")),
          new RegExp(NotificationsPage.message(liker.user.username, "LIKE")),
          new RegExp(NotificationsPage.message(follower.user.username, "NEW_FOLLOWER"))
        ]);
      });

      await test.step("each row shows the actor's avatar", async () => {
        // No profile picture: the avatar falls back to the username's initial.
        for (const row of [request, like, follow]) {
          await expect(row.getByText("E", { exact: true })).toBeVisible();
        }
      });

      await test.step("only the follow request has an action", async () => {
        await expect(notificationsPage.acceptButton(request)).toBeVisible();
        await expect(notificationsPage.declineButton(request)).toBeVisible();
        for (const row of [like, follow]) {
          await expect(notificationsPage.acceptButton(row)).toHaveCount(0);
          await expect(notificationsPage.declineButton(row)).toHaveCount(0);
        }
      });

      await test.step("the like shows the Recorda it is about", async () => {
        await expect(notificationsPage.thumbnail(like)).toBeVisible();
        await expect(notificationsPage.thumbnail(follow)).toHaveCount(0);
      });
    }
  );

  test(
    "follows, requests, likes, comments and mentions notify the account owner",
    meta({
      description:
        "Following a public account, liking and commenting on its Recorda, mentioning it in " +
        "a Recorda and requesting to follow it once private each add a notification for it.",
      requirement: "RF-26.3",
      tag: "@mutates"
    }),
    async ({ api, app, notificationsPage }) => {
      const owner = await newUser(api, "owner");
      const fan = await newUser(api, "fan");
      const friend = await newUser(api, "friend");
      const requester = await newUser(api, "requester");

      await test.step("other people act on the owner's account and Recorda", async () => {
        const recordaId = await api.createRecorda(owner, {
          description: `RF-26.3 ${randomUUID()}`
        });
        await api.follow(fan, owner.user.user_id);
        await api.like(fan, recordaId);
        await api.comment(fan, recordaId, `RF-26.3 ${randomUUID()}`);
        // Only accounts the author follows can be mentioned.
        await api.follow(friend, owner.user.user_id);
        await api.createRecorda(friend, {
          description: `RF-26.3 ${randomUUID()}`,
          mentionedUserIds: [owner.user.user_id]
        });
        await api.setPrivate(owner, true);
        await api.follow(requester, owner.user.user_id);
      });

      await test.step("the owner sees one notification per action", async () => {
        await app.launchAs(owner);
        await app.goToNotifications();
        await expect(notificationsPage.row(fan.user.username, "NEW_FOLLOWER")).toBeVisible();
        await expect(notificationsPage.row(fan.user.username, "LIKE")).toBeVisible();
        await expect(notificationsPage.row(fan.user.username, "COMMENT")).toBeVisible();
        await expect(notificationsPage.row(friend.user.username, "MENTION")).toBeVisible();
        await expect(
          notificationsPage.row(requester.user.username, "FOLLOW_REQUEST")
        ).toBeVisible();
      });
    }
  );

  test(
    "an approved follow request notifies the requester",
    meta({
      description:
        "When a private account accepts a follow request, the person who asked gets a " +
        "notification that the request was approved.",
      requirement: "RF-26.3",
      tag: "@mutates"
    }),
    async ({ api, app, notificationsPage }) => {
      const owner = await newUser(api, "private");
      const requester = await newUser(api, "asker");
      await api.setPrivate(owner, true);
      await api.follow(requester, owner.user.user_id);
      const followId = await followRequestId(api, owner, requester);
      await api.respondToFollowRequest(owner, followId, "accept");

      await app.launchAs(requester);
      await app.goToNotifications();
      await expect(notificationsPage.row(owner.user.username, "FOLLOW_ACCEPTED")).toBeVisible();
    }
  );

  test(
    "follow requests are accepted or declined from the notification list",
    meta({
      description:
        "A private account finds its follow requests in the notification center, accepts " +
        "one (it becomes a new follower) and declines the other (it disappears); only the " +
        "accepted person ends up following.",
      requirement: ["RF-21.1", "RF-26.4"],
      tag: "@mutates"
    }),
    async ({ api, app, notificationsPage }) => {
      const owner = await newUser(api, "private");
      const accepted = await newUser(api, "accepted");
      const declined = await newUser(api, "declined");
      await api.setPrivate(owner, true);
      await api.follow(accepted, owner.user.user_id);
      await api.follow(declined, owner.user.user_id);

      const acceptedRequest = notificationsPage.row(accepted.user.username, "FOLLOW_REQUEST");
      const declinedRequest = notificationsPage.row(declined.user.username, "FOLLOW_REQUEST");

      await test.step("both requests are in the notification center", async () => {
        await app.launchAs(owner);
        await app.goToNotifications();
        await expect(acceptedRequest).toBeVisible();
        await expect(declinedRequest).toBeVisible();
      });

      await test.step("accepting turns the request into a new follower", async () => {
        await notificationsPage.acceptButton(acceptedRequest).click();
        await expect(notificationsPage.row(accepted.user.username, "NEW_FOLLOWER")).toBeVisible();
        await expect(acceptedRequest).toHaveCount(0);
      });

      await test.step("declining removes the request", async () => {
        await notificationsPage.declineButton(declinedRequest).click();
        await expect(declinedRequest).toHaveCount(0);
        await expect(notificationsPage.rowsOf([declined.user.username])).toHaveCount(0);
      });

      await test.step("only the accepted person follows the account", async () => {
        await expect
          .poll(() => api.followers(owner, owner.user.user_id))
          .toEqual([accepted.user.username]);
      });

      await test.step("the list keeps the result after reopening the app", async () => {
        await app.launch();
        await app.goToNotifications();
        await expect(notificationsPage.row(accepted.user.username, "NEW_FOLLOWER")).toBeVisible();
        await expect(notificationsPage.rowsOf([declined.user.username])).toHaveCount(0);
      });
    }
  );

  test(
    "tapping a notification opens the related Recorda or profile",
    meta({
      description:
        "A like notification opens the liked Recorda, and a new-follower notification opens " +
        "the follower's profile.",
      requirement: "RF-26.6",
      tag: "@mutates"
    }),
    async ({ api, app, notificationsPage, recordaDetailPage, userProfilePage }) => {
      const owner = await newUser(api, "author");
      const liker = await newUser(api, "liker");
      const follower = await newUser(api, "follower");
      const description = `RF-26.6 ${randomUUID()}`;
      const recordaId = await api.createRecorda(owner, { description });
      await api.like(liker, recordaId);
      await api.follow(follower, owner.user.user_id);

      await test.step("a like opens the liked Recorda", async () => {
        await app.launchAs(owner);
        await app.goToNotifications();
        await notificationsPage.row(liker.user.username, "LIKE").click();
        await recordaDetailPage.expectLoaded();
        await expect(recordaDetailPage.description).toContainText(description);
      });

      await test.step("a new follower opens the follower's profile", async () => {
        await app.launch();
        await app.goToNotifications();
        await notificationsPage.row(follower.user.username, "NEW_FOLLOWER").click();
        await userProfilePage.expectLoaded();
        await expect(userProfilePage.header).toContainText(`@${follower.user.username}`);
      });
    }
  );
});
