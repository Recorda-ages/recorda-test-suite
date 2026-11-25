import { signedOut } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import { ReportDialog } from "../../src/pages";
import { uniqueId, type RecordaApi } from "../../src/support/api";
import { t } from "../../src/support/i18n";

/**
 * FL-14: a person reports a Recorda or a profile, with an optional reason, and can't report
 * the same thing twice. Reports are writes, so every test creates its own reporter and
 * target and runs only against the local stack (`@mutates`).
 */
test.use({ storageState: signedOut });

/**
 * A viewer who follows an author with one Recorda, so it shows on the viewer's "Seguindo"
 * feed. That tab lists only followed people, so it doesn't wait on the "Para Você" affinity
 * ranking, which gets slow on a local database full of test users.
 */
async function followedRecorda(api: RecordaApi, label: string) {
  const [author, viewer] = await Promise.all([
    api.createUser(`${label}-author`),
    api.createUser(`${label}-viewer`)
  ]);
  const { recorda_id: recordaId } = await api.createRecorda(author, {
    description: `Report ${label} ${uniqueId()}`
  });
  await api.follow(viewer, author);
  return { author, viewer, recordaId };
}

test.describe("Reporting a Recorda", () => {
  test(
    "a Recorda is reported from its feed card with an optional reason and stays visible",
    meta({
      description:
        "From the card's three-dots menu, the report dialog takes a reason of up to 500 " +
        "characters; sending it confirms the report, and the Recorda is still on the feed.",
      requirement: ["RF-40.1", "RF-40.2", "RF-40.5"],
      tag: "@mutates"
    }),
    async ({ api, app, page, feedPage }) => {
      const { viewer, recordaId } = await followedRecorda(api, "card");
      const dialog = new ReportDialog(page, "recorda");

      await app.launchAs(viewer);
      await feedPage.selectFeedTab("following");
      await expect(feedPage.post("following", recordaId)).toBeVisible();

      await test.step("the card's menu opens the report dialog", async () => {
        await feedPage.openReport("following", recordaId);
        await dialog.expectOpen();
        await expect(dialog.description).toHaveAttribute("maxlength", "500");
      });

      await test.step("sending a reason confirms the report", async () => {
        await dialog.submit(`Motivo ${uniqueId()}`);
        await expect(dialog.feedback("success")).toBeVisible();
      });

      await test.step("the Recorda is still on the feed", async () => {
        await expect(feedPage.post("following", recordaId)).toBeVisible();
      });
    }
  );

  test(
    "a Recorda is reported from the details menu without a reason",
    meta({
      description:
        "From the details screen's three-dots menu, a report can be sent with no reason; " +
        "the details stay open afterwards.",
      requirement: ["RF-40.1", "RF-40.2", "RF-40.5"],
      tag: "@mutates"
    }),
    async ({ api, app, page, feedPage, recordaDetailsPage: details }) => {
      const { viewer, recordaId } = await followedRecorda(api, "details");
      const dialog = new ReportDialog(page, "recorda");

      await app.launchAs(viewer);
      await feedPage.selectFeedTab("following");
      await feedPage.post("following", recordaId).click();
      await details.expectLoaded();

      await details.openReport();
      await dialog.expectOpen();
      await dialog.submit();
      await expect(dialog.feedback("success")).toBeVisible();
      await details.expectLoaded();
    }
  );

  test(
    "reporting the same Recorda twice shows a friendly message",
    meta({
      description:
        "Someone who already reported a Recorda tries again from the feed: the dialog closes " +
        "and says it was already reported, instead of an error.",
      requirement: "RF-40.3",
      tag: "@mutates"
    }),
    async ({ api, app, page, feedPage }) => {
      const { viewer, recordaId } = await followedRecorda(api, "twice");
      await api.reportRecorda(viewer, recordaId, `First ${uniqueId()}`);
      const dialog = new ReportDialog(page, "recorda");

      await app.launchAs(viewer);
      await feedPage.selectFeedTab("following");
      await feedPage.openReport("following", recordaId);
      await dialog.submit(`Again ${uniqueId()}`);
      await expect(dialog.feedback("duplicate")).toBeVisible();
      await expect(dialog.feedback("success")).toHaveCount(0);
    }
  );

  test(
    "the author is not notified of a report and can't see who sent it",
    meta({
      description:
        "After someone reports a Recorda, its author's notification center has nothing from " +
        "the reporter and nothing about the report.",
      requirement: "RF-40.6",
      tag: "@mutates"
    }),
    async ({ api, app, page, feedPage, notificationsPage }) => {
      const { author, viewer, recordaId } = await followedRecorda(api, "silent");
      const dialog = new ReportDialog(page, "recorda");

      await test.step("a follower reports the Recorda", async () => {
        await app.launchAs(viewer);
        await feedPage.selectFeedTab("following");
        await feedPage.openReport("following", recordaId);
        await dialog.submit(`Silent ${uniqueId()}`);
        await expect(dialog.feedback("success")).toBeVisible();
      });

      await test.step("the author sees only the follow, nothing about the report", async () => {
        await app.launchAs(author);
        await app.goToNotifications();
        // The follow is the only thing the viewer did that the author may know about.
        await expect(notificationsPage.rows(viewer.user.username, "NEW_FOLLOWER")).toBeVisible();
        await expect(notificationsPage.rowsOf([viewer.user.username])).toHaveCount(1);
        const { items } = await api.notifications(author);
        expect(items.map((item) => item.type)).toEqual(["NEW_FOLLOWER"]);
      });
    }
  );
});

test.describe("Reporting a profile", () => {
  test(
    "another person's profile is reported with a reason",
    meta({
      description:
        "From someone else's profile, the three-dots menu opens the profile report dialog, " +
        "which takes a reason of up to 500 characters and confirms the report.",
      requirement: ["RF-41.1", "RF-41.3"],
      tag: "@mutates"
    }),
    async ({ api, app, page, userProfilePage }) => {
      const [target, reporter] = await Promise.all([
        api.createUser("profile-target"),
        api.createUser("profile-reporter")
      ]);
      const dialog = new ReportDialog(page, "user");

      await app.launchAs(reporter);
      await app.goToUserProfile(target.user.username);
      await userProfilePage.openReport();
      await dialog.expectOpen();
      await expect(dialog.description).toHaveAttribute("maxlength", "500");
      await dialog.submit(`Perfil ${uniqueId()}`);
      await expect(dialog.feedback("success")).toBeVisible();
    }
  );

  test(
    "your own profile can't be reported",
    meta({
      description:
        "The signed-in person's own profile has no three-dots menu and no report option.",
      requirement: "RF-41.2",
      tag: "@mutates"
    }),
    async ({ api, app, profilePage }) => {
      const me = await api.createUser("self");

      await app.launchAs(me);
      await app.goToProfile();
      await expect(profilePage.root.getByRole("button", { name: t("feed.more") })).toHaveCount(0);
      await expect(profilePage.root.getByText(t("profile.report"))).toHaveCount(0);
    }
  );

  test(
    "reporting the same profile twice shows a friendly message",
    meta({
      description:
        "Someone who already reported a profile tries again: the dialog closes and says it " +
        "was already reported, instead of an error.",
      requirement: "RF-41.4",
      tag: "@mutates"
    }),
    async ({ api, app, page, userProfilePage }) => {
      const [target, reporter] = await Promise.all([
        api.createUser("twice-target"),
        api.createUser("twice-reporter")
      ]);
      await api.reportUser(reporter, target, `First ${uniqueId()}`);
      const dialog = new ReportDialog(page, "user");

      await app.launchAs(reporter);
      await app.goToUserProfile(target.user.username);
      await userProfilePage.openReport();
      await dialog.submit();
      await expect(dialog.feedback("duplicate")).toBeVisible();
    }
  );
});
