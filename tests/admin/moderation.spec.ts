import type { Page } from "@playwright/test";

import { storageStateOf, users } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";

test.use({ storageState: storageStateOf(users.admin) });
test.beforeEach(() => {
  test.fixme(
    true,
    "Scaffold only: add the frontend testIDs and a fixture that creates isolated users, Recordas and reports."
  );
});

const TEST_REPORT_GROUP = "admin-report-group-created-by-test";
const TEST_SECOND_REPORT_GROUP = "admin-report-group-second-created-by-test";
const TEST_USER = "e2e-moderation-target";

const adminScreen = (page: Page) => page.getByTestId("admin-screen");

async function openAdmin(page: Page) {
  await page.goto("/");
  await expect(adminScreen(page)).toBeVisible();
}

test.describe("Admin access", () => {
  test.use({ storageState: storageStateOf(users.gabriel) });

  test(
    "regular accounts cannot open administrative screens",
    meta({
      description: "A regular account cannot open the administrative area.",
      requirement: "RF-44.1"
    }),
    async ({ page }) => {
      await page.goto("/");
      await expect(page.getByTestId("admin-screen")).toBeHidden();
    }
  );
});

test(
  "administrators can open the administrative area",
  meta({
    description: "The seeded administrator can open the administrative area.",
    requirement: "RF-44.1"
  }),
  async ({ page }) => {
    await openAdmin(page);
  }
);

test.describe("Report moderation", () => {
  test(
    "open reports are grouped by target with their summary",
    meta({
      description:
        "The reports screen groups open reports by target and shows target type, identifier, open count and latest report date.",
      requirement: "RF-44.2",
      tag: "@mutates"
    }),
    async ({ page }) => {
      await openAdmin(page);
      await page.getByTestId("admin-reports-tab").click();

      const group = page.getByTestId(TEST_REPORT_GROUP);
      await expect(group).toBeVisible();
      await expect(group.getByTestId("report-target-type")).toBeVisible();
      await expect(group.getByTestId("report-target-id")).toBeVisible();
      await expect(group.getByTestId("open-report-count")).toBeVisible();
      await expect(group.getByTestId("latest-report-date")).toBeVisible();
    }
  );

  test(
    "a reported target shows its content and report history",
    meta({
      description:
        "Opening a report group shows the reported content and each report's text, date and reporter.",
      requirement: "RF-44.3",
      tag: "@mutates"
    }),
    async ({ page }) => {
      await openAdmin(page);
      await page.getByTestId("admin-reports-tab").click();
      await page.getByTestId(TEST_REPORT_GROUP).click();

      await expect(page.getByTestId("reported-content")).toBeVisible();
      const report = page.getByTestId("report-history-entry").first();
      await expect(report.getByTestId("report-text")).toBeVisible();
      await expect(report.getByTestId("report-date")).toBeVisible();
      await expect(report.getByTestId("reporter-name")).toBeVisible();
    }
  );

  test(
    "an administrator can resolve or dismiss a report with a reason",
    meta({
      description:
        "The administrator can choose RESOLVED or DISMISSED, and each status change requires a reason no longer than 500 characters.",
      requirement: ["RF-44.4", "RF-44.5", "RF-47.1", "RF-47.2"],
      tag: "@mutates"
    }),
    async ({ page }) => {
      await openAdmin(page);
      await page.getByTestId("admin-reports-tab").click();
      await page.getByTestId(TEST_REPORT_GROUP).click();

      const reason = page.getByTestId("moderation-reason");
      await expect(reason).toHaveAttribute("maxlength", "500");
      await expect(page.getByTestId("resolve-report-button")).toBeDisabled();
      await reason.fill("Reviewed by moderation");
      await page.getByTestId("resolve-report-button").click();
      await expect(page.getByTestId("report-status")).toHaveText("RESOLVED");

      await page.getByTestId(TEST_SECOND_REPORT_GROUP).click();
      await page.getByTestId("moderation-reason").fill("Report does not violate policy");
      await page.getByTestId("dismiss-report-button").click();
      await expect(page.getByTestId("report-status")).toHaveText("DISMISSED");
    }
  );
});

test.describe("Recorda moderation", () => {
  test(
    "an administrator removes a Recorda from its moderation detail",
    meta({
      description:
        "The administrator confirms logical removal of a reported Recorda from the moderation screen.",
      requirement: "RF-45.1",
      tag: "@mutates"
    }),
    async ({ page }) => {
      await openAdmin(page);
      await page.getByTestId("admin-reports-tab").click();
      await page.getByTestId(TEST_REPORT_GROUP).click();
      await page.getByTestId("remove-recorda-button").click();

      const dialog = page.getByTestId("remove-recorda-dialog");
      await expect(dialog).toBeVisible();
      await dialog.getByTestId("moderation-reason").fill("Content violates the community rules");
      await dialog.getByTestId("confirm-removal-button").click();
      await expect(dialog).toBeHidden();
    }
  );

  test(
    "Recorda removal requires a reason and records it in the audit log",
    meta({
      description:
        "Removal cannot be confirmed without a reason, enforces the 500-character limit and records the reason in the audit log.",
      requirement: ["RF-45.2", "RF-47.1", "RF-47.2"],
      tag: "@mutates"
    }),
    async ({ page }) => {
      await openAdmin(page);
      await page.getByTestId("admin-reports-tab").click();
      await page.getByTestId(TEST_REPORT_GROUP).click();
      await page.getByTestId("remove-recorda-button").click();

      const dialog = page.getByTestId("remove-recorda-dialog");
      const reason = dialog.getByTestId("moderation-reason");
      await expect(reason).toHaveAttribute("maxlength", "500");
      await expect(dialog.getByTestId("confirm-removal-button")).toBeDisabled();
      await reason.fill("Content violates the community rules");
      await dialog.getByTestId("confirm-removal-button").click();

      await page.getByTestId("admin-audit-tab").click();
      await expect(page.getByTestId("audit-entry").first()).toContainText(
        "Content violates the community rules"
      );
    }
  );

  test(
    "removing a Recorda resolves its open reports",
    meta({
      description:
        "After removing a reported Recorda, every pending report for that target is shown as resolved.",
      requirement: "RF-45.3",
      tag: "@mutates"
    }),
    async ({ page }) => {
      await openAdmin(page);
      await page.getByTestId("admin-reports-tab").click();
      await page.getByTestId(TEST_REPORT_GROUP).click();
      await page.getByTestId("remove-recorda-button").click();
      const dialog = page.getByTestId("remove-recorda-dialog");
      await dialog.getByTestId("moderation-reason").fill("Content violates the community rules");
      await dialog.getByTestId("confirm-removal-button").click();

      await page.getByTestId("show-resolved-reports").click();
      await expect(page.getByTestId("report-status")).toHaveText("RESOLVED");
    }
  );

  test(
    "a removed Recorda disappears from feed, search and its author's profile",
    meta({
      description:
        "After moderation removes a test Recorda, it is no longer visible in the feed, search results or the author's profile.",
      requirement: "RF-45.4",
      tag: "@mutates"
    }),
    async ({ page }) => {
      await openAdmin(page);
      await page.getByTestId("admin-reports-tab").click();
      await page.getByTestId(TEST_REPORT_GROUP).click();
      const recordaId = await page.getByTestId("reported-recorda-id").textContent();
      if (!recordaId) throw new Error("The test-created report has no Recorda identifier.");
      await page.getByTestId("remove-recorda-button").click();
      const dialog = page.getByTestId("remove-recorda-dialog");
      await dialog.getByTestId("moderation-reason").fill("Content violates the community rules");
      await dialog.getByTestId("confirm-removal-button").click();

      await page.getByTestId("admin-open-author-session").click();
      await page.getByTestId("admin-open-feed").click();
      await expect(page.getByTestId(`feed-post-${recordaId}`)).toHaveCount(0);
      await page.getByTestId("feed-search-button").click();
      await page.getByTestId("search-input").fill(recordaId);
      await expect(page.getByTestId(`search-result-${recordaId}`)).toHaveCount(0);
      await page.getByTestId("open-author-profile").click();
      await expect(page.getByTestId(`profile-recorda-${recordaId}`)).toHaveCount(0);
    }
  );

  test(
    "the removed Recorda's author receives a system notification with the reason",
    meta({
      description:
        "Removing a Recorda notifies its author with CONTENT_REMOVED and the reason, using a system icon without exposing the administrator.",
      requirement: ["RF-42.1", "RF-42.2", "RF-45.5"],
      tag: "@mutates"
    }),
    async ({ page }) => {
      await openAdmin(page);
      await page.getByTestId("admin-reports-tab").click();
      await page.getByTestId(TEST_REPORT_GROUP).click();
      await page.getByTestId("remove-recorda-button").click();
      const dialog = page.getByTestId("remove-recorda-dialog");
      await dialog.getByTestId("moderation-reason").fill("Content violates the community rules");
      await dialog.getByTestId("confirm-removal-button").click();

      await page.getByTestId("admin-open-author-session").click();
      await page.getByTestId("feed-notifications-button").click();
      const notification = page.getByTestId("notification-content-removed");
      await expect(notification).toBeVisible();
      await expect(notification).toContainText("Content violates the community rules");
      await expect(notification.getByTestId("system-notification-icon")).toBeVisible();
      await expect(notification.getByTestId("administrator-name")).toHaveCount(0);
    }
  );
});

test.describe("User moderation", () => {
  test(
    "an administrator searches accounts by username or name and sees their status",
    meta({
      description:
        "The account search accepts a username or a name and shows the matching profile with ACTIVE or SUSPENDED status.",
      requirement: "RF-46.1",
      tag: "@mutates"
    }),
    async ({ page }) => {
      await openAdmin(page);
      await page.getByTestId("admin-users-tab").click();

      const search = page.getByTestId("admin-user-search");
      await search.fill(TEST_USER);
      await expect(page.getByTestId("admin-user-result").first()).toBeVisible();
      await expect(page.getByTestId("account-status")).toHaveText(/^(ACTIVE|SUSPENDED)$/);
      await search.fill("E2E Moderation Target");
      await expect(page.getByTestId("admin-user-result").first()).toBeVisible();
    }
  );

  test(
    "an administrator cannot suspend another administrator",
    meta({
      description:
        "Searching for an administrator shows a disabled suspension action.",
      requirement: "RF-46.2"
    }),
    async ({ page }) => {
      await openAdmin(page);
      await page.getByTestId("admin-users-tab").click();
      await page.getByTestId("admin-user-search").fill(users.admin.username);
      await page.getByTestId("admin-user-result").click();
      await expect(page.getByTestId("suspend-user-button")).toBeDisabled();
    }
  );

  test(
    "suspending an account requires a reason and records the action",
    meta({
      description:
        "The suspension dialog requires a reason of at most 500 characters and the audit log records the suspension and reason.",
      requirement: ["RF-46.3", "RF-47.1", "RF-47.2"],
      tag: "@mutates"
    }),
    async ({ page }) => {
      await openAdmin(page);
      await page.getByTestId("admin-users-tab").click();
      await page.getByTestId("admin-user-search").fill(TEST_USER);
      await page.getByTestId("admin-user-result").click();
      await page.getByTestId("suspend-user-button").click();

      const dialog = page.getByTestId("suspend-user-dialog");
      const reason = dialog.getByTestId("moderation-reason");
      await expect(reason).toHaveAttribute("maxlength", "500");
      await expect(dialog.getByTestId("confirm-suspension-button")).toBeDisabled();
      await reason.fill("Repeated community guideline violations");
      await dialog.getByTestId("confirm-suspension-button").click();
      await expect(page.getByTestId("account-status")).toHaveText("SUSPENDED");

      await page.getByTestId("admin-audit-tab").click();
      await expect(page.getByTestId("audit-entry").first()).toContainText(
        "Repeated community guideline violations"
      );
    }
  );

  test(
    "content from a suspended account is hidden from regular users",
    meta({
      description:
        "A regular account cannot see the suspended user's Recordas, comments or profile.",
      requirement: "RF-46.4",
      tag: "@mutates"
    }),
    async ({ page }) => {
      await openAdmin(page);
      await page.getByTestId("admin-users-tab").click();
      await page.getByTestId("admin-user-search").fill(TEST_USER);
      await page.getByTestId("admin-user-result").click();
      await page.getByTestId("admin-open-suspended-user-session").click();

      await expect(page.getByTestId("suspended-user-profile")).toHaveCount(0);
      await expect(page.getByTestId("suspended-user-recorda")).toHaveCount(0);
      await expect(page.getByTestId("suspended-user-comment")).toHaveCount(0);
    }
  );

  test(
    "an administrator reactivates a suspended account with a reason",
    meta({
      description:
        "Reactivation requires a reason of at most 500 characters and changes the account status back to ACTIVE.",
      requirement: "RF-46.5",
      tag: "@mutates"
    }),
    async ({ page }) => {
      await openAdmin(page);
      await page.getByTestId("admin-users-tab").click();
      await page.getByTestId("admin-user-search").fill(TEST_USER);
      await page.getByTestId("admin-user-result").click();
      await page.getByTestId("reactivate-user-button").click();

      const dialog = page.getByTestId("reactivate-user-dialog");
      const reason = dialog.getByTestId("moderation-reason");
      await expect(reason).toHaveAttribute("maxlength", "500");
      await expect(dialog.getByTestId("confirm-reactivation-button")).toBeDisabled();
      await reason.fill("Account reviewed and restored");
      await dialog.getByTestId("confirm-reactivation-button").click();
      await expect(page.getByTestId("account-status")).toHaveText("ACTIVE");
      await page.getByTestId("admin-audit-tab").click();
      await expect(page.getByTestId("audit-entry").first()).toContainText(
        "Account reviewed and restored"
      );
    }
  );
});

test.describe("Audit log", () => {
  test(
    "the audit log shows chronological moderation actions with administrator, target, reason and UTC timestamp",
    meta({
      description:
        "Audit entries are immutable records that identify the administrator, action, target, reason and UTC timestamp.",
      requirement: ["RF-47.1", "RF-47.2"],
      tag: "@mutates"
    }),
    async ({ page }) => {
      await openAdmin(page);
      await page.getByTestId("admin-audit-tab").click();

      const entry = page.getByTestId("audit-entry").first();
      await expect(entry.getByTestId("audit-administrator")).toBeVisible();
      await expect(entry.getByTestId("audit-action")).toBeVisible();
      await expect(entry.getByTestId("audit-target")).toBeVisible();
      await expect(entry.getByTestId("audit-reason")).toBeVisible();
      await expect(entry.getByTestId("audit-timestamp-utc")).toBeVisible();
      await expect(entry.getByTestId("edit-audit-entry")).toHaveCount(0);
      await expect(entry.getByTestId("delete-audit-entry")).toHaveCount(0);
      await expect(page.getByTestId("audit-entry").nth(1)).toBeVisible();
    }
  );

  test(
    "the audit history is paginated and can be filtered by administrator and period",
    meta({
      description:
        "The audit panel supports chronological pagination and filters by administrator and date range.",
      requirement: "RF-47.3",
      tag: "@mutates"
    }),
    async ({ page }) => {
      await openAdmin(page);
      await page.getByTestId("admin-audit-tab").click();

      await page.getByTestId("audit-administrator-filter").fill(users.admin.username);
      await page.getByTestId("audit-period-start").fill("2026-01-01");
      await page.getByTestId("audit-period-end").fill("2026-12-31");
      await page.getByTestId("apply-audit-filters").click();
      await expect(page.getByTestId("audit-entry").first()).toBeVisible();
      await page.getByTestId("audit-next-page").click();
      await expect(page.getByTestId("audit-page-indicator")).toContainText("2");
    }
  );
});

test.describe("Removal notification", () => {
  test(
    "opening a content removal notification marks it read without opening the removed Recorda",
    meta({
      description:
        "Opening the CONTENT_REMOVED notification marks it as read and keeps the user out of the removed Recorda.",
      requirement: "RF-42.3",
      tag: "@mutates"
    }),
    async ({ page }) => {
      await page.goto("/");
      await page.getByTestId("feed-notifications-button").click();
      const notification = page.getByTestId("notification-content-removed");
      await expect(notification).toHaveAttribute("data-read", "false");
      await notification.click();
      await expect(notification).toHaveAttribute("data-read", "true");
      await expect(page.getByTestId("recorda-detail-screen")).toBeHidden();
    }
  );
});
