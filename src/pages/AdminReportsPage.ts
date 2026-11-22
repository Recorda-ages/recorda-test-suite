import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../support/i18n";

export type ReportTargetType = "RECORDA" | "USER";
export type ReportStatusFilter = "open" | "resolved" | "dismissed";

/** "Denúncias": reports grouped by target, where an administrator lands after signing in. */
export class AdminReportsPage {
  readonly root: Locator;
  readonly list: Locator;
  readonly empty: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("admin-reports-screen");
    this.list = this.root.getByTestId("admin-reports-list");
    this.empty = this.root.getByTestId("admin-reports-empty");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  /**
   * The row of one reported target (all its reports grouped). The list is newest first and
   * has no search against the real API (`supportsReportSearch` is false), so a target a test
   * just reported is on the first page.
   */
  row(targetType: ReportTargetType, targetId: string): Locator {
    return this.root.getByTestId(`admin-report-row-${targetType}-${targetId}`);
  }

  /** "Pendentes" / "Resolvidas" / "Descartadas". */
  statusFilter(status: ReportStatusFilter): Locator {
    return this.root.getByRole("radio", {
      name: t(`admin.reports.filters.${status}`),
      exact: true
    });
  }
}
