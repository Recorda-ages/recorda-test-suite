import { uniquePreferences } from "../../src/data/music";
import { expect, meta, signedInAsNewAccount, test } from "../../src/fixtures";
import { t } from "../../src/support/i18n";

test.use(signedInAsNewAccount);

test.describe("Account privacy", () => {
  test(
    "switching to a private account asks first and applies at once",
    meta({
      description:
        "A new account starts public. Cancelling the confirmation keeps it public; confirming " +
        "makes it private on the server right away, and switching back makes it public again.",
      requirement: "RF-32.1",
      tag: "@mutates"
    }),
    async ({ app, api, newAccount, settingsPage }) => {
      const isPrivate = async () => (await api.settings(newAccount.session)).is_private;

      await app.launch();
      await app.goToSettings();

      await test.step("a new account is public", async () => {
        await expect(settingsPage.privacySwitch).not.toBeChecked();
        await expect(settingsPage.privacySupport("public")).toBeVisible();
      });

      await test.step("cancelling the confirmation keeps it public", async () => {
        await settingsPage.changePrivacy("private", "cancel");
        await expect(settingsPage.privacySwitch).not.toBeChecked();
        expect(await isPrivate()).toBe(false);
      });

      await test.step("confirming makes it private immediately", async () => {
        await settingsPage.changePrivacy("private", "confirm");
        await expect(settingsPage.privacySwitch).toBeChecked();
        await expect(settingsPage.privacySupport("private")).toBeVisible();
        await expect.poll(isPrivate).toBe(true);
      });

      await test.step("it can be made public again", async () => {
        await settingsPage.changePrivacy("public", "confirm");
        await expect(settingsPage.privacySwitch).not.toBeChecked();
        await expect(settingsPage.privacySupport("public")).toBeVisible();
        await expect.poll(isPrivate).toBe(false);
      });
    }
  );

  test(
    "going public accepts every pending follow request and notifies each requester",
    meta({
      description:
        "Two people asked to follow a private account. Making it public accepts both requests " +
        "at once, says how many were accepted, and each requester gets a FOLLOW_ACCEPTED " +
        "notification.",
      requirement: "RF-32.2",
      tag: "@mutates"
    }),
    async ({ app, api, newAccount, settingsPage }) => {
      const owner = newAccount.session;
      const requesters = await test.step("two people ask to follow a private account", async () => {
        await api.updateSettings(owner, { is_private: true });
        const created = await Promise.all([
          api.createAccount({ preferences: uniquePreferences() }),
          api.createAccount({ preferences: uniquePreferences() })
        ]);
        for (const requester of created) {
          expect(await api.follow(requester.session, owner.user.user_id)).toBe("solicitado");
        }
        expect(await api.followers(owner, owner.user.user_id)).toEqual([]);
        return created;
      });

      await app.launch();
      await app.goToSettings();
      await expect(settingsPage.privacySwitch).toBeChecked();

      await test.step("making the account public accepts both requests", async () => {
        await settingsPage.changePrivacy("public", "confirm");
        await expect(
          settingsPage.root.getByText(t("settings.accepted_other", { count: 2 }))
        ).toBeVisible();
        const followers = (await api.followers(owner, owner.user.user_id)).map(
          (follower) => follower.username
        );
        expect(followers.sort()).toEqual(requesters.map(({ user }) => user.username).sort());
      });

      await test.step("each requester is told the request was accepted", async () => {
        for (const requester of requesters) {
          const notifications = await api.notifications(requester.session);
          expect(notifications).toContainEqual(
            expect.objectContaining({
              type: "FOLLOW_ACCEPTED",
              sender: expect.objectContaining({ username: newAccount.user.username })
            })
          );
        }
      });
    }
  );
});
