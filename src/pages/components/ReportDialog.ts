import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../../support/i18n";

export type ReportTarget = "recorda" | "user";

/**
 * "Denunciar Recorda" / "Denunciar perfil" (`ReportDialog`, a Modal located from `page`),
 * plus the snackbar that reports the outcome after it closes.
 */
export class ReportDialog {
  readonly root: Locator;
  readonly description: Locator;
  readonly cancelButton: Locator;
  readonly submitButton: Locator;
  private readonly page: Page;

  constructor(page: Page, target: ReportTarget) {
    this.page = page;
    this.root = page
      .getByRole("dialog")
      .filter({ has: page.getByText(t(`moderation.report.title.${target}`), { exact: true }) });
    this.description = this.root.getByLabel(t("moderation.report.descriptionLabel"), {
      exact: true
    });
    this.cancelButton = this.root.getByRole("button", {
      name: t("moderation.report.cancel"),
      exact: true
    });
    this.submitButton = this.root.getByRole("button", {
      name: t("moderation.report.submit"),
      exact: true
    });
  }

  async expectOpen(): Promise<void> {
    await expect(this.description).toBeVisible();
  }

  /** Sends the report, with `description` or without one. Waits for the dialog to close. */
  async submit(description?: string): Promise<void> {
    if (description !== undefined) await this.description.fill(description);
    await this.submitButton.click();
    await expect(this.description).toBeHidden();
  }

  /** The outcome snackbar: `success`, `duplicate` or `unavailable`. */
  feedback(kind: "success" | "duplicate" | "unavailable"): Locator {
    return this.page.getByText(t(`moderation.report.feedback.${kind}`), { exact: true });
  }
}
