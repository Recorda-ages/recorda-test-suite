import { devices, type Page } from "@playwright/test";

import { env } from "../../src/config/env";
import { storageStateOf, users } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import { storageStateFor } from "../../src/support/session";

test.use({ storageState: storageStateOf(users.admin) });

const adminScreen = (page: Page) => page.getByTestId("admin-reports-screen");

async function openAdmin(page: Page) {
  await page.goto("/");
  await expect(adminScreen(page)).toBeVisible();
}

async function openReportGroup(page: Page, rowTestId: string) {
  await page.getByTestId("admin-tab-reports").click();
  const group = page.getByTestId(rowTestId);
  await expect(group).toBeVisible();
  await group.click();
}

async function openUserDetail(
  page: Page,
  user: { user_id: string; username: string },
) {
  await page.getByTestId("admin-tab-users").click();
  await page.getByTestId("admin-users-search").fill(user.username);
  await page.getByTestId(`admin-user-history-${user.user_id}`).click();
  await expect(page.getByTestId("admin-user-detail-screen")).toBeVisible();
}

test.describe("Admin access", () => {
  test.use({ storageState: storageStateOf(users.gabriel) });

  test(
    "regular accounts cannot open administrative screens",
    meta({
      description: "A regular account cannot open the administrative area.",
      requirement: "RF-44.1",
    }),
    async ({ page }) => {
      await page.goto("/");
      await expect(page.getByTestId("admin-reports-screen")).toBeHidden();
    },
  );
});

test(
  "administrators can open the administrative area",
  meta({
    description:
      "The seeded administrator opens the administrative area after signing in.",
    requirement: "RF-44.1",
  }),
  async ({ page }) => {
    await openAdmin(page);
  },
);

test.describe("Report moderation", () => {
  test(
    "open reports are grouped by target with their summary",
    meta({
      description:
        "Open reports are grouped by target and show target type, open count and latest report date.",
      requirement: "RF-44.2",
      tag: "@mutates",
    }),
    async ({ page, moderationData }) => {
      await openAdmin(page);
      await page.getByTestId("admin-tab-reports").click();

      const group = page.getByTestId(moderationData.recordas[0].rowTestId);
      await expect(group).toBeVisible();
      await expect(group).toHaveAttribute(
        "data-testid",
        moderationData.recordas[0].rowTestId,
      );
      await expect(group.getByTestId("report-target-type")).toContainText(
        /RECORDA/i,
      );
      await expect(group.getByTestId("open-report-count")).toContainText("2");
      await expect(group.getByTestId("latest-report-date")).toBeVisible();
    },
  );

  test(
    "a reported target shows its content and report history",
    meta({
      description:
        "Opening a report group shows the reported Recorda and each report's text, date and reporter.",
      requirement: "RF-44.3",
      tag: "@mutates",
    }),
    async ({ page, moderationData }) => {
      const recorda = moderationData.recordas[0];
      await openAdmin(page);
      await openReportGroup(page, recorda.rowTestId);

      await expect(page.getByTestId("admin-report-recorda")).toBeVisible();
      const report = page.getByTestId(
        `admin-report-entry-${recorda.reportIds[0]}`,
      );
      await expect(report.getByTestId("report-text")).toBeVisible();
      await expect(report.getByTestId("report-date")).toBeVisible();
      await expect(report.getByTestId("reporter-name")).toBeVisible();
    },
  );

  test(
    "an administrator can resolve or dismiss a report with a reason",
    meta({
      description:
        "The administrator can resolve or dismiss reports, and each status change requires a reason of at most 500 characters.",
      requirement: ["RF-44.4", "RF-44.5", "RF-47.1", "RF-47.2"],
      tag: "@mutates",
    }),
    async ({ page, moderationData }) => {
      const first = moderationData.recordas[0];
      const second = await moderationData.createSecondRecorda();
      await openAdmin(page);
      await openReportGroup(page, first.rowTestId);

      const statusDialog = page.getByTestId("moderation-status-dialog");
      const reason = statusDialog.getByTestId("moderation-reason");
      await expect(reason).toHaveAttribute("maxlength", "500");
      await page.getByTestId("admin-report-status-RESOLVED").click();
      await expect(
        page.getByTestId("resolve-report-confirm-button"),
      ).toBeDisabled();
      await reason.fill("Reviewed by moderation");
      await page.getByTestId("resolve-report-confirm-button").click();
      await expect(
        page
          .getByTestId(`admin-report-entry-${first.reportIds[0]}`)
          .getByTestId("report-status"),
      ).toContainText(/resolv/i);

      await openReportGroup(page, second.rowTestId);
      const dismissDialog = page.getByTestId("moderation-status-dialog");
      await dismissDialog
        .getByTestId("moderation-reason")
        .fill("Report does not violate policy");
      await page.getByTestId("admin-report-status-DISMISSED").click();
      await page.getByTestId("dismiss-report-confirm-button").click();
      await expect(
        page
          .getByTestId(`admin-report-entry-${second.reportIds[0]}`)
          .getByTestId("report-status"),
      ).toContainText(/descart|dismiss/i);
    },
  );
});

test.describe("Recorda moderation", () => {
  test(
    "an administrator removes a Recorda from its moderation detail",
    meta({
      description:
        "The administrator confirms logical removal of a reported Recorda from the moderation screen.",
      requirement: "RF-45.1",
      tag: "@mutates",
    }),
    async ({ page, moderationData }) => {
      await openAdmin(page);
      await openReportGroup(page, moderationData.recordas[0].rowTestId);
      await page.getByTestId("admin-report-remove-recorda").click();

      const dialog = page.getByTestId("remove-recorda-dialog");
      await expect(dialog).toBeVisible();
      await dialog
        .getByTestId("moderation-reason")
        .fill("Content violates the community rules");
      await dialog.getByTestId("confirm-removal-button").click();
      await expect(dialog).toBeHidden();
    },
  );

  test(
    "Recorda removal requires a reason and records it in the audit log",
    meta({
      description:
        "Removal requires a reason of at most 500 characters and the audit log records it.",
      requirement: ["RF-45.2", "RF-47.1", "RF-47.2"],
      tag: "@mutates",
    }),
    async ({ page, moderationData }) => {
      await openAdmin(page);
      await openReportGroup(page, moderationData.recordas[0].rowTestId);
      await page.getByTestId("admin-report-remove-recorda").click();

      const dialog = page.getByTestId("remove-recorda-dialog");
      const reason = dialog.getByTestId("moderation-reason");
      await expect(reason).toHaveAttribute("maxlength", "500");
      await expect(dialog.getByTestId("confirm-removal-button")).toBeDisabled();
      await reason.fill("Content violates the community rules");
      await dialog.getByTestId("confirm-removal-button").click();

      await page.getByTestId("admin-tab-auditLog").click();
      await expect(
        page
          .getByTestId(/^admin-audit-log-entry-/)
          .first()
          .getByTestId("audit-reason"),
      ).toContainText("Content violates the community rules");
    },
  );

  test(
    "removing a Recorda resolves its open reports",
    meta({
      description:
        "After removal, every report for that target is shown as resolved.",
      requirement: "RF-45.3",
      tag: "@mutates",
    }),
    async ({ page, moderationData }) => {
      const recorda = moderationData.recordas[0];
      await openAdmin(page);
      await openReportGroup(page, recorda.rowTestId);
      await page.getByTestId("admin-report-remove-recorda").click();
      const dialog = page.getByTestId("remove-recorda-dialog");
      await dialog
        .getByTestId("moderation-reason")
        .fill("Content violates the community rules");
      await dialog.getByTestId("confirm-removal-button").click();

      await page.getByTestId("admin-tab-reports").click();
      await page.getByTestId("admin-reports-status-filter-RESOLVED").click();
      const group = page.getByTestId(recorda.rowTestId);
      await expect(group).toBeVisible();
      await expect(
        page
          .getByTestId(`admin-report-entry-${recorda.reportIds[0]}`)
          .getByTestId("report-status"),
      ).toContainText(/resolv/i);
    },
  );

  test(
    "a removed Recorda disappears from the feed and its author's profile",
    meta({
      description:
        "After moderation removes a test Recorda, it is no longer visible in the feed or the author's profile.",
      requirement: "RF-45.4",
      tag: "@mutates",
    }),
    async ({ browser, page, api, moderationData }) => {
      const recorda = moderationData.recordas[0];
      const readerSession = await api.login(users.gabriel);
      const readerContext = await browser.newContext({
        ...devices["Pixel 7"],
        baseURL: env.baseURL,
        storageState: storageStateFor(env.baseURL, readerSession),
      });

      try {
        const readerPage = await readerContext.newPage();
        await readerPage.goto("/");
        await expect(readerPage.getByTestId("feed-screen")).toBeVisible();
        await expect(
          readerPage.getByTestId(`feed-post-${recorda.id}`),
        ).toBeVisible();

        await openAdmin(page);
        await openReportGroup(page, recorda.rowTestId);
        await page.getByTestId("admin-report-remove-recorda").click();
        const dialog = page.getByTestId("remove-recorda-dialog");
        await dialog
          .getByTestId("moderation-reason")
          .fill("Content violates the community rules");
        await dialog.getByTestId("confirm-removal-button").click();

        await readerPage.reload();
        await expect(readerPage.getByTestId("feed-screen")).toBeVisible();
        await expect(
          readerPage.getByTestId(`feed-post-${recorda.id}`),
        ).toHaveCount(0);
        await readerPage.getByTestId("feed-search-button").click();
        await readerPage
          .getByTestId("user-search-input")
          .fill(moderationData.target.user.username);
        const target = readerPage.getByTestId(
          `user-search-result-${moderationData.target.user.user_id}`,
        );
        await expect(target).toBeVisible();
        await target.click();
        await expect(
          readerPage.getByTestId("user-profile-screen"),
        ).toBeVisible();
        await expect(
          readerPage.getByTestId(`recorda-grid-item-${recorda.id}`),
        ).toHaveCount(0);
      } finally {
        await readerContext.close();
      }
    },
  );

  test(
    "the removed Recorda's author receives a system notification with the reason",
    meta({
      description:
        "Removing a Recorda notifies its author with CONTENT_REMOVED and the reason, using a system icon without exposing the administrator.",
      requirement: ["RF-42.1", "RF-42.2", "RF-45.5"],
      tag: "@mutates",
    }),
    async ({ api, browser, page, moderationData }) => {
      const author = await api.login(users.gabriel);
      const { recorda_id: recordaId } = await api.createRecorda(
        author.access_token,
        {
          media_url: "https://example.test/moderation/notification.jpg",
          media_type: "PHOTO",
          description: "E2E content removal notification",
          deezer_track_id: "3135556",
          song_title: "E2E notification test",
          song_artist_name: "Recorda Test",
          song_cover_url: "",
          song_preview_url: null,
          song_genre_name: "Pop",
        },
      );
      await api.reportRecorda(
        moderationData.reporters[0].access_token,
        recordaId,
        "E2E report for content removal notification",
      );

      await openAdmin(page);
      await openReportGroup(page, `admin-report-row-RECORDA-${recordaId}`);
      await page.getByTestId("admin-report-remove-recorda").click();
      const dialog = page.getByTestId("remove-recorda-dialog");
      const reason = "Content violates the community rules";
      await dialog.getByTestId("moderation-reason").fill(reason);
      await dialog.getByTestId("confirm-removal-button").click();

      const authorContext = await browser.newContext({
        ...devices["Pixel 7"],
        baseURL: env.baseURL,
        storageState: storageStateFor(env.baseURL, author),
      });
      try {
        const authorPage = await authorContext.newPage();
        await authorPage.goto("/");
        await expect(authorPage.getByTestId("feed-screen")).toBeVisible();
        await authorPage.getByTestId("feed-notifications-button").click();

        const notification = authorPage
          .getByTestId("notifications-list")
          .getByTestId(/^notification-/)
          .filter({ hasText: reason });
        await expect(notification).toBeVisible();
        await expect(
          notification.locator('[data-testid^="notification-system-icon-"]'),
        ).toBeVisible();
        await expect(notification).not.toContainText(users.admin.username);
      } finally {
        await authorContext.close();
      }
    },
  );

  test(
    "a removed Recorda is absent from content search",
    meta({
      description: "A removed Recorda is not returned by content search.",
      requirement: "RF-45.4",
      tag: "@mutates",
    }),
    async () => {
      test.fixme(
        true,
        "The current search screen searches profiles only; Recorda search is not implemented.",
      );
    },
  );
});

test.describe("User moderation", () => {
  test(
    "an administrator searches accounts by username or name and sees their status",
    meta({
      description:
        "Account search accepts a username or a name and shows the matching profile with its status.",
      requirement: "RF-46.1",
      tag: "@mutates",
    }),
    async ({ page, moderationData }) => {
      await openAdmin(page);
      await page.getByTestId("admin-tab-users").click();

      const search = page.getByTestId("admin-users-search");
      await search.fill(moderationData.target.user.username);
      const result = page.getByTestId(
        `admin-user-card-${moderationData.target.user.user_id}`,
      );
      await expect(result).toBeVisible();
      await expect(result.getByTestId("account-status")).toHaveText(
        /ACTIVE|ATIV[AO]/i,
      );
      await search.fill(moderationData.target.user.name);
      await expect(result).toBeVisible();
    },
  );

  test(
    "an administrator cannot suspend another administrator",
    meta({
      description: "A second administrator has a disabled suspension action.",
      requirement: "RF-46.2",
    }),
    async () => {
      test.fixme(
        true,
        "The local seed only provides the signed-in administrator and there is no API to create a second admin.",
      );
    },
  );

  test(
    "suspending an account requires a reason and records the action",
    meta({
      description:
        "Suspension requires a reason of at most 500 characters and the audit log records it.",
      requirement: ["RF-46.3", "RF-47.1", "RF-47.2"],
      tag: "@mutates",
    }),
    async ({ page, moderationData }) => {
      await openAdmin(page);
      await openUserDetail(page, moderationData.target.user);
      await page.getByTestId("suspend-action-trigger").click();

      const dialog = page.getByTestId("suspend-user-dialog");
      const reason = dialog.getByTestId("moderation-reason");
      await expect(reason).toHaveAttribute("maxlength", "500");
      await expect(
        dialog.getByTestId("confirm-suspension-button"),
      ).toBeDisabled();
      await reason.fill("Repeated community guideline violations");
      await dialog.getByTestId("confirm-suspension-button").click();
      await expect(
        page
          .getByTestId("admin-user-detail-screen")
          .getByTestId("account-status"),
      ).toHaveText(/SUSPENDED|SUSPENSA/i);

      await page.getByTestId("admin-tab-auditLog").click();
      await expect(
        page
          .getByTestId(/^admin-audit-log-entry-/)
          .first()
          .getByTestId("audit-reason"),
      ).toContainText("Repeated community guideline violations");
    },
  );

  test(
    "content from a suspended account is hidden from regular users",
    meta({
      description:
        "A regular account cannot see a suspended user's Recordas, profile search result or comments.",
      requirement: "RF-46.4",
      tag: "@mutates",
    }),
    async ({ browser, page, api, moderationData }) => {
      const recorda = moderationData.recordas[0];
      await openAdmin(page);
      await openUserDetail(page, moderationData.target.user);
      await page.getByTestId("suspend-action-trigger").click();
      const dialog = page.getByTestId("suspend-user-dialog");
      await dialog
        .getByTestId("moderation-reason")
        .fill("Suspended for test isolation");
      await dialog.getByTestId("confirm-suspension-button").click();
      await expect(
        page
          .getByTestId("admin-user-detail-screen")
          .getByTestId("account-status"),
      ).toHaveText(/SUSPENDED|SUSPENSA/i);

      const readerSession = await api.login(users.gabriel);
      const readerContext = await browser.newContext({
        ...devices["Pixel 7"],
        baseURL: env.baseURL,
        storageState: storageStateFor(env.baseURL, readerSession),
      });

      try {
        const readerPage = await readerContext.newPage();
        await readerPage.goto("/");
        await expect(readerPage.getByTestId("feed-screen")).toBeVisible();
        await expect(
          readerPage.getByTestId(`feed-post-${recorda.id}`),
        ).toHaveCount(0);
        await readerPage.getByTestId("feed-search-button").click();
        await readerPage
          .getByTestId("user-search-input")
          .fill(moderationData.target.user.username);
        await expect(
          readerPage.getByTestId(
            `user-search-result-${moderationData.target.user.user_id}`,
          ),
        ).toHaveCount(0);
        await expect(
          await api.recordaStatus(readerSession.access_token, recorda.id),
        ).toBe(404);
        await expect(
          await api.recordaCommentsStatus(
            readerSession.access_token,
            recorda.id,
          ),
        ).toBe(404);
      } finally {
        await readerContext.close();
      }
    },
  );

  test(
    "an administrator reactivates a suspended account with a reason",
    meta({
      description:
        "Reactivation requires a reason of at most 500 characters and changes the account status back to active.",
      requirement: ["RF-46.5", "RF-47.1", "RF-47.2"],
      tag: "@mutates",
    }),
    async ({ page, moderationData }) => {
      await openAdmin(page);
      await openUserDetail(page, moderationData.target.user);

      await page.getByTestId("suspend-action-trigger").click();
      const suspendDialog = page.getByTestId("suspend-user-dialog");
      await suspendDialog
        .getByTestId("moderation-reason")
        .fill("Prepare reactivation test");
      await suspendDialog.getByTestId("confirm-suspension-button").click();
      await expect(page.getByTestId("reactivate-action-trigger")).toBeVisible();
      await page.getByTestId("reactivate-action-trigger").click();

      const dialog = page.getByTestId("reactivate-user-dialog");
      const reason = dialog.getByTestId("moderation-reason");
      await expect(reason).toHaveAttribute("maxlength", "500");
      await expect(
        dialog.getByTestId("confirm-reactivation-button"),
      ).toBeDisabled();
      await reason.fill("Account reviewed and restored");
      await dialog.getByTestId("confirm-reactivation-button").click();
      await expect(
        page
          .getByTestId("admin-user-detail-screen")
          .getByTestId("account-status"),
      ).toHaveText(/ACTIVE|ATIV[AO]/i);

      await page.getByTestId("admin-tab-auditLog").click();
      await expect(
        page
          .getByTestId(/^admin-audit-log-entry-/)
          .first()
          .getByTestId("audit-reason"),
      ).toContainText("Account reviewed and restored");
    },
  );
});

test.describe("Audit log", () => {
  test(
    "the audit log shows chronological moderation actions with administrator, target, reason and timestamp",
    meta({
      description:
        "Audit entries identify the administrator, action, target, reason and timestamp and cannot be edited or deleted.",
      requirement: ["RF-47.1", "RF-47.2"],
      tag: "@mutates",
    }),
    async ({ page, moderationData }) => {
      const first = moderationData.recordas[0];
      const second = await moderationData.createSecondRecorda();
      await openAdmin(page);
      await openReportGroup(page, first.rowTestId);
      await page.getByTestId("admin-report-status-RESOLVED").click();
      const resolveDialog = page.getByTestId("moderation-status-dialog");
      await resolveDialog
        .getByTestId("moderation-reason")
        .fill("Audit log resolve fixture");
      await page.getByTestId("resolve-report-confirm-button").click();

      await openReportGroup(page, second.rowTestId);
      await page.getByTestId("admin-report-status-DISMISSED").click();
      const dismissDialog = page.getByTestId("moderation-status-dialog");
      await dismissDialog
        .getByTestId("moderation-reason")
        .fill("Audit log dismiss fixture");
      await page.getByTestId("dismiss-report-confirm-button").click();
      await page.getByTestId("admin-tab-auditLog").click();

      const entries = page.getByTestId(/^admin-audit-log-entry-/);
      const entry = entries.first();
      await expect(entry.getByTestId("audit-administrator")).toBeVisible();
      await expect(entry.getByTestId("audit-action")).toBeVisible();
      await expect(entry.getByTestId("audit-target")).toBeVisible();
      await expect(entry.getByTestId("audit-reason")).toBeVisible();
      await expect(entry.getByTestId("audit-timestamp")).toBeVisible();
      await expect(entry.getByTestId("edit-audit-entry")).toHaveCount(0);
      await expect(entry.getByTestId("delete-audit-entry")).toHaveCount(0);
      const previousEntry = entries.nth(1);
      await expect(previousEntry).toBeVisible();
      await expect(entry.getByTestId("audit-reason")).toContainText(
        "Audit log dismiss fixture",
      );
      await expect(previousEntry.getByTestId("audit-reason")).toContainText(
        "Audit log resolve fixture",
      );
    },
  );

  test(
    "the audit history is paginated and can be filtered by administrator and period",
    meta({
      description:
        "The audit panel supports chronological pagination and filters by administrator and period.",
      requirement: "RF-47.3",
      tag: "@mutates",
    }),
    async ({ page, api, moderationData }) => {
      const admin = await api.login(users.admin);
      let status: "OPEN" | "RESOLVED" = "OPEN";
      for (let index = 1; index <= 21; index += 1) {
        status = status === "OPEN" ? "RESOLVED" : "OPEN";
        await api.changeReportStatus(
          admin.access_token,
          moderationData.recordas[0].id,
          status,
          `Audit pagination fixture ${index}`,
        );
      }

      await openAdmin(page);
      await page.getByTestId("admin-tab-auditLog").click();
      await page.getByTestId("admin-audit-period-filter-lastMonth").click();
      await page
        .getByTestId(`admin-audit-admin-filter-${admin.user.user_id}`)
        .click();

      const list = page.getByTestId("admin-audit-log-list");
      await expect(page.getByText("Audit pagination fixture 21")).toBeVisible();
      await list.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
        element.dispatchEvent(new Event("scroll", { bubbles: true }));
      });
      await expect(page.getByText("Audit pagination fixture 1")).toBeVisible();
    },
  );
});

test(
  "opening a content removal notification marks it read without opening the removed Recorda",
  meta({
    description:
      "Opening a CONTENT_REMOVED notification marks it read and does not open the removed Recorda.",
    requirement: "RF-42.3",
    tag: "@mutates",
  }),
  async () => {
    test.fixme(
      true,
      "The notifications screen currently marks every notification read on entry; single-item read behavior is deferred.",
    );
  },
);
