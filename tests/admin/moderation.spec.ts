import { storageStateOf, users } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import type { AdminPage, AdminReportDetailPage, AdminReportsPage } from "../../src/pages";
import { uniqueId, type NewAccount, type RecordaApi } from "../../src/support/api";
import type { App } from "../../src/support/app";
import { t } from "../../src/support/i18n";

/**
 * FL-15: the administrator reviews reports, changes their status, removes a Recorda,
 * suspends and reactivates an account, and reads the audit log.
 *
 * Targets are always users and Recordas created by the test (never the seed accounts), and
 * every reason is unique, so parallel tests never act on or assert each other's data.
 */
test.use({ storageState: storageStateOf(users.admin) });

type Reported = {
  author: NewAccount;
  reporters: [NewAccount, NewAccount];
  recordaId: string;
  songTitle: string;
  reportIds: [string, string];
  descriptions: [string, string];
};

/** A new author publishes a Recorda and two new users report it, the second one last. */
async function reportedRecorda(api: RecordaApi, label: string): Promise<Reported> {
  const [author, first, second] = await Promise.all([
    api.createUser(`${label}-author`),
    api.createUser(`${label}-rep1`),
    api.createUser(`${label}-rep2`)
  ]);
  const songTitle = `Song ${label} ${uniqueId()}`;
  const { recorda_id: recordaId } = await api.createRecorda(author, {
    description: `Recorda ${label} ${uniqueId()}`,
    songTitle
  });
  const descriptions: [string, string] = [`Report one ${uniqueId()}`, `Report two ${uniqueId()}`];
  const reportIds: [string, string] = [
    await api.reportRecorda(first, recordaId, descriptions[0]),
    await api.reportRecorda(second, recordaId, descriptions[1])
  ];
  return { author, reporters: [first, second], recordaId, songTitle, reportIds, descriptions };
}

/** A unique reason, so the audit log and history can be searched for this test's action. */
function reason(action: string): string {
  return `E2E ${action} ${uniqueId()}`;
}

/** Admin home (Denúncias) → the target's row → its detail. */
async function openReportedRecorda(
  app: App,
  adminPage: AdminPage,
  reports: AdminReportsPage,
  detail: AdminReportDetailPage,
  target: Reported
): Promise<void> {
  await app.launch();
  await adminPage.expectLoaded("reports");
  await reports.row("RECORDA", target.recordaId).click();
  await detail.expectLoaded();
}

/** "22/11/2026 às 15:34", whatever the date: the shape `admin.reportDetail.dateTime` gives. */
const dateTime = new RegExp(
  t("admin.reportDetail.dateTime", { date: "\\S+", time: "\\d{1,2}:\\d{2}" })
);

test.describe("Admin access", () => {
  test.use({ storageState: storageStateOf(users.gabriel) });

  test(
    "only administrators can open the moderation area",
    meta({
      description:
        "A regular account opens the app on its Feed with no admin screen, and the admin API " +
        "refuses it; the administrator's own call is accepted.",
      requirement: "RF-44.1"
    }),
    async ({ api, app, adminPage, feedPage }) => {
      await test.step("a regular account lands on the Feed, not on the admin area", async () => {
        await app.launch();
        await feedPage.expectLoaded();
        await expect(adminPage.screen("reports")).toHaveCount(0);
        await expect(adminPage.screen("users")).toHaveCount(0);
        await expect(adminPage.screen("auditLog")).toHaveCount(0);
      });

      await test.step("the admin API refuses a regular account", async () => {
        expect(await api.adminReportsStatus(await api.account(users.gabriel))).toBe(403);
        expect(await api.adminReportsStatus(await api.account(users.admin))).toBe(200);
      });
    }
  );
});

test.describe("Reports", () => {
  test(
    "open reports are grouped by target with type, open count and latest date",
    meta({
      description:
        "Two reports of the same Recorda show as one row that says it is a Recorda, pending, " +
        "with 2 reports, identifies it by author and song, and shows the latest report's date.",
      requirement: "RF-44.2",
      tag: "@mutates"
    }),
    async ({ api, app, adminPage, adminReportsPage: reports }) => {
      const target = await reportedRecorda(api, "group");

      await app.launch();
      await adminPage.expectLoaded("reports");
      await expect(reports.statusFilter("open")).toBeVisible();
    
      const row = reports.row("RECORDA", target.recordaId);
      await expect(row).toHaveCount(1);
      await expect(row).toContainText(t("admin.reports.target.recorda").toLocaleUpperCase("pt-BR"));
      await expect(row).toContainText(t("admin.status.open").toLocaleUpperCase("pt-BR"));
      await expect(row).toContainText(t("admin.reports.count", { count: 2 }));
      await expect(row).toContainText(`@${target.author.user.username}`);
      await expect(row).toContainText(target.songTitle);
      await expect(row).toContainText(/\d{2}\/\d{2}\/\d{4}/);
    }
  );

  test(
    "the detail shows the reported Recorda and every report with text, date and reporter",
    meta({
      description:
        "Opening a report group shows the reported photo and each report's description, " +
        "reporter and date.",
      requirement: "RF-44.3",
      tag: "@mutates"
    }),
    async ({ api, app, adminPage, adminReportsPage, adminReportDetailPage: detail }) => {
      const target = await reportedRecorda(api, "detail");
      await openReportedRecorda(app, adminPage, adminReportsPage, detail, target);

      await expect(detail.recorda).toBeVisible();
      await expect(detail.photo).toBeVisible();
      for (const [index, reportId] of target.reportIds.entries()) {
        const entry = detail.entry(reportId);
        await expect(entry).toContainText(target.descriptions[index]!);
        await expect(entry).toContainText(`@${target.reporters[index]!.user.username}`);
        await expect(entry).toContainText(dateTime);
      }
    }
  );

  for (const status of ["RESOLVED", "DISMISSED"] as const) {
    test(
      `marking reports as ${status.toLowerCase()} needs a reason and is recorded`,
      meta({
        description:
          "The status dialog accepts at most 500 characters and can't be confirmed empty. With " +
          "a reason, the reports change status, the detail history shows the action, and the " +
          "audit log records administrator, action, target, reason and time.",
        requirement: ["RF-44.4", "RF-44.5", "RF-47.1", "RF-47.2"],
        tag: "@mutates"
      }),
      async ({
        api,
        app,
        adminPage,
        adminReportsPage: reports,
        adminReportDetailPage: detail,
        adminAuditLogPage: audit
      }) => {
        const target = await reportedRecorda(api, status.toLowerCase());
        const why = reason(status);
        await openReportedRecorda(app, adminPage, reports, detail, target);

        await test.step("the reason is required and limited to 500 characters", async () => {
          const dialog = detail.statusDialog(status);
          await detail.statusButton(status).click();
          await dialog.expectOpen();
          await expect(dialog.reason).toHaveAttribute("maxlength", "500");
          await expect(dialog.confirmButton).toBeDisabled();
          await dialog.cancelButton.click();
          await expect(dialog.reason).toBeHidden();
        });

        await test.step("with a reason, the reports change status", async () => {
          await detail.changeStatus(status, why);
          const label = t(`admin.status.${status.toLowerCase()}`);
          for (const reportId of target.reportIds) {
            await expect(detail.entry(reportId)).toContainText(label);
          }
          await expect(detail.historyEntries().filter({ hasText: why })).toContainText(
            t(`admin.reportDetail.history.statusChangedTo.${status}`)
          );
        });

        await test.step("the audit log records who did what, to what, why and when", async () => {
          await detail.backButton.click();
          await adminPage.tabBar("reports").select("auditLog");
          await audit.expectLoaded();
          await audit.find(why);
          const entry = audit.entriesWith(why);
          await expect(entry).toHaveCount(1);
          await expect(entry).toContainText(users.admin.username);
          await expect(entry).toContainText(t("admin.auditLog.actions.CHANGE_REPORT_STATUS_RECORDA"));
          await expect(entry).toContainText(target.songTitle);
          await expect(entry).toContainText(t("admin.auditLog.reason", { reason: why }));
        });
      }
    );
  }
});

test.describe("Removing a Recorda", () => {
  test(
    "removing a Recorda needs a reason, resolves its reports and is audited",
    meta({
      description:
        "The removal dialog accepts at most 500 characters and can't be confirmed empty. " +
        "Removing takes the Recorda down, resolves both open reports and adds a " +
        "removal entry to the audit log.",
      requirement: ["RF-45.1", "RF-45.2", "RF-45.3", "RF-47.1", "RF-47.2"],
      tag: "@mutates"
    }),
    async ({
      api,
      app,
      adminPage,
      adminReportsPage: reports,
      adminReportDetailPage: detail,
      adminAuditLogPage: audit
    }) => {
      const target = await reportedRecorda(api, "remove");
      const why = reason("removal");
      await openReportedRecorda(app, adminPage, reports, detail, target);

      await test.step("the reason is required and limited to 500 characters", async () => {
        await detail.removeRecordaButton.click();
        await detail.removeDialog.expectOpen();
        await expect(detail.removeDialog.reason).toHaveAttribute("maxlength", "500");
        await expect(detail.removeDialog.confirmButton).toBeDisabled();
        await detail.removeDialog.cancelButton.click();
        await expect(detail.removeDialog.reason).toBeHidden();
      });

      await test.step("removing takes the Recorda down and resolves its reports", async () => {
        await detail.removeRecorda(why);
        await expect(detail.historyEntries().filter({ hasText: why })).toContainText(
          t("admin.reportDetail.history.REMOVE_RECORDA")
        );
        await expect(detail.recorda).toHaveCount(0);
        for (const reportId of target.reportIds) {
          await expect(detail.entry(reportId)).toContainText(t("admin.status.resolved"));
        }
      });

      await test.step("the audit log records the removal with its reason", async () => {
        await detail.backButton.click();
        await adminPage.tabBar("reports").select("auditLog");
        await audit.expectLoaded();
        await audit.find(why);
        const entry = audit.entriesWith(why);
        await expect(entry).toHaveCount(1);
        await expect(entry).toContainText(users.admin.username);
        await expect(entry).toContainText(t("admin.auditLog.actions.REMOVE_RECORDA"));
        await expect(entry).toContainText(t("admin.auditLog.reason", { reason: why }));
      });
    }
  );

  test(
    "a removed Recorda disappears for everyone and its author is told why",
    meta({
      description:
        "After removal, a follower can no longer open the Recorda or see it on the author's " +
        "profile. The author gets a system notification with the song and the reason, without " +
        "naming the administrator; tapping it marks it read and opens nothing.",
      requirement: ["RF-45.4", "RF-45.5", "RF-42.1", "RF-42.2", "RF-42.3"],
      tag: "@mutates"
    }),
    async ({
      api,
      app,
      page,
      adminPage,
      adminReportsPage: reports,
      adminReportDetailPage: detail,
      notificationsPage,
      userProfilePage
    }) => {
      const target = await reportedRecorda(api, "gone");
      const follower = await api.createUser("gone-fan");
      await api.follow(follower, target.author);
      expect(await api.recordaStatus(follower, target.recordaId)).toBe(200);
      const why = reason("removal");

      await test.step("the administrator removes the Recorda", async () => {
        await openReportedRecorda(app, adminPage, reports, detail, target);
        await detail.removeRecorda(why);
        await expect(detail.historyEntries().filter({ hasText: why })).toBeVisible();
      });

      await test.step("a follower can't open it or see it on the author's profile", async () => {
        expect(await api.recordaStatus(follower, target.recordaId)).toBe(404);
        await app.launchAs(follower);
        await app.goToUserProfile(target.author.user.username);
        await expect(userProfilePage.details.gridItem(target.recordaId)).toHaveCount(0);
      });

      await test.step("the author gets a system notification with the reason", async () => {
        await app.launchAs(target.author);
        await app.goToNotifications();
        const message = t("notifications.types.CONTENT_REMOVED", {
          song: target.songTitle,
          reason: why
        });
        const row = notificationsPage.list
          .locator('[data-testid^="notification-"]')
          .filter({ hasText: message });
        await expect(row).toHaveCount(1);
        await expect(row.getByTestId(/^notification-system-icon-/)).toBeVisible();
        await expect(row).not.toContainText(users.admin.username);

        await row.click();
        await notificationsPage.expectLoaded();
        await expect(page.getByTestId("recorda-detail-screen")).toHaveCount(0);
        await expect
          .poll(async () => {
            const { items } = await api.notifications(target.author);
            return items.find((item) => item.type === "CONTENT_REMOVED")?.is_read;
          })
          .toBe(true);
      });
    }
  );
});

test.describe("Accounts", () => {
  test(
    "an administrator finds an account, suspends it with a reason and reactivates it",
    meta({
      description:
        "Searching by username shows the account as active. Suspending needs a reason of at " +
        "most 500 characters and hides its profile and Recordas from other users; reactivating " +
        "with a reason makes it active and visible again.",
      requirement: ["RF-46.1", "RF-46.3", "RF-46.4", "RF-46.5"],
      tag: "@mutates"
    }),
    async ({ api, app, adminPage, adminUsersPage: usersPage }) => {
      const [target, viewer] = await Promise.all([
        api.createUser("suspend"),
        api.createUser("suspend-viewer")
      ]);
      const { recorda_id: recordaId } = await api.createRecorda(target, {
        description: `Suspend ${uniqueId()}`
      });
      const userId = target.session.user.user_id;
      const moderation = usersPage.moderation(userId);

      await test.step("search finds the account, shown as active", async () => {
        await app.launch();
        await adminPage.expectLoaded("reports");
        await adminPage.tabBar("reports").select("users");
        await usersPage.expectLoaded();
        await usersPage.find(target.user.username);
        await expect(usersPage.card(userId)).toContainText(`@${target.user.username}`);
        await expect(usersPage.status(userId, "active")).toBeVisible();
      });

      await test.step("suspending needs a reason of at most 500 characters", async () => {
        await moderation.suspendButton.click();
        await usersPage.suspendDialog.expectOpen();
        await expect(usersPage.suspendDialog.reason).toHaveAttribute("maxlength", "500");
        await expect(usersPage.suspendDialog.confirmButton).toBeDisabled();
        await usersPage.suspendDialog.confirmWith(reason("suspension"));
        await expect(usersPage.status(userId, "suspended")).toBeVisible();
      });

      await test.step("other users no longer see the account or its Recordas", async () => {
        await expect.poll(() => api.profileStatus(viewer, target)).toBe(404);
        expect(await api.recordaStatus(viewer, recordaId)).toBe(404);
      });

      await test.step("reactivating with a reason makes it active and visible again", async () => {
        await moderation.reactivateButton.click();
        await usersPage.reactivateDialog.confirmWith(reason("reactivation"));
        await expect(usersPage.status(userId, "active")).toBeVisible();
        await expect.poll(() => api.profileStatus(viewer, target)).toBe(200);
        expect(await api.recordaStatus(viewer, recordaId)).toBe(200);
      });
    }
  );
});

test.describe("Audit log", () => {
  test(
    "the audit log lists actions newest first and filters by period and administrator",
    meta({
      description:
        "A suspension and then a reactivation show in the audit log with the reactivation " +
        "first, and both stay listed when filtering by today, by the last month and by the " +
        "administrator who did them.",
      requirement: "RF-47.3",
      tag: "@mutates"
    }),
    async ({ api, app, adminPage, adminUsersPage: usersPage, adminAuditLogPage: audit }) => {
      const target = await api.createUser("audit");
      const tag = `E2E audit ${uniqueId()}`;
      const userId = target.session.user.user_id;

      await test.step("the administrator suspends and then reactivates an account", async () => {
        await app.launch();
        await adminPage.expectLoaded("reports");
        await adminPage.tabBar("reports").select("users");
        await usersPage.find(target.user.username);
        await usersPage.moderation(userId).suspendButton.click();
        await usersPage.suspendDialog.confirmWith(`${tag} suspension`);
        await expect(usersPage.status(userId, "suspended")).toBeVisible();
        await usersPage.moderation(userId).reactivateButton.click();
        await usersPage.reactivateDialog.confirmWith(`${tag} reactivation`);
        await expect(usersPage.status(userId, "active")).toBeVisible();
      });

      await test.step("the log lists the reactivation before the suspension", async () => {
        await adminPage.tabBar("users").select("auditLog");
        await audit.expectLoaded();
        await audit.find(tag);
        await expect(audit.entriesWith(tag)).toHaveCount(2);
        await expect(audit.entriesWith(tag).nth(0)).toContainText(
          t("admin.auditLog.actions.REACTIVATE_USER")
        );
        await expect(audit.entriesWith(tag).nth(1)).toContainText(
          t("admin.auditLog.actions.SUSPEND_USER")
        );
      });

      for (const period of ["today", "lastMonth"] as const) {
        await test.step(`filtering by ${period} keeps both entries`, async () => {
          await audit.periodFilter(period).click();
          await expect(audit.entriesWith(tag)).toHaveCount(2);
        });
      }

      await test.step("filtering by the administrator keeps both entries", async () => {
        await audit.periodFilter("all").click();
        await audit.adminFilter(users.admin.username).click();
        await expect(audit.entriesWith(tag)).toHaveCount(2);
      });
    }
  );
});
