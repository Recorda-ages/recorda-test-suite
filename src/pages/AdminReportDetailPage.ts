import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../support/i18n";
import { ReasonDialog } from "./components/ReasonDialog";

export type ReportStatusAction = "RESOLVED" | "DISMISSED" | "OPEN";

/** "Detalhes da denúncia": the reported content, its reports and the moderation history. */
export class AdminReportDetailPage {
  readonly root: Locator;
  readonly backButton: Locator;
  readonly summary: Locator;
  readonly recorda: Locator;
  readonly photo: Locator;
  readonly entries: Locator;
  readonly history: Locator;
  readonly removeRecordaButton: Locator;
  readonly removeDialog: ReasonDialog;

  constructor(private readonly page: Page) {
    this.root = page.getByTestId("admin-report-detail-screen");
    this.backButton = this.root.getByRole("button", { name: t("admin.reportDetail.back") });
    this.summary = this.root.getByTestId("admin-report-detail-summary");
    this.recorda = this.root.getByTestId("admin-report-recorda");
    this.photo = this.root.getByTestId("admin-report-photo");
    this.entries = this.root.getByTestId("admin-report-entries");
    this.history = this.root.getByTestId("admin-report-history");
    this.removeRecordaButton = this.root.getByTestId("admin-report-remove-recorda");
    this.removeDialog = new ReasonDialog(
      page,
      t("admin.reportDetail.removeRecorda.title"),
      t("admin.reportDetail.removeRecorda.confirm")
    );
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.entries).toBeVisible();
  }

  /** One report: its text, date and reporter. */
  entry(reportId: string): Locator {
    return this.root.getByTestId(`admin-report-entry-${reportId}`);
  }

  /** History rows (`admin-report-history-<action_id>`), newest first. */
  historyEntries(): Locator {
    return this.history.locator('[data-testid^="admin-report-history-"]');
  }

  statusButton(status: ReportStatusAction): Locator {
    return this.root.getByTestId(`admin-report-status-${status}`);
  }

  statusDialog(status: ReportStatusAction): ReasonDialog {
    return new ReasonDialog(
      this.page,
      t(`admin.reportDetail.statusActions.${status}.title`),
      t(`admin.reportDetail.statusActions.${status}.confirm`)
    );
  }

  /** Marks every open report of the target as `status`, giving `reason`. */
  async changeStatus(status: ReportStatusAction, reason: string): Promise<void> {
    await this.statusButton(status).click();
    await this.statusDialog(status).confirmWith(reason);
  }

  async removeRecorda(reason: string): Promise<void> {
    await this.removeRecordaButton.click();
    await this.removeDialog.confirmWith(reason);
  }
}
