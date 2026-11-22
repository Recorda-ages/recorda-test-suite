import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../../support/i18n";

/**
 * The admin "Motivo" dialog (`ReasonDialog`), used to change report status, remove a Recorda,
 * and suspend or reactivate an account. It is a Modal, so it is located from `page` by its
 * title; only one is open at a time.
 */
export class ReasonDialog {
  readonly root: Locator;
  readonly reason: Locator;
  readonly cancelButton: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page, title: string, confirmLabel: string) {
    this.root = page
      .getByRole("dialog")
      .filter({ has: page.getByText(title, { exact: true }) });
    this.reason = this.root.getByLabel(t("admin.reasonDialog.label"), { exact: true });
    this.cancelButton = this.root.getByRole("button", {
      name: t("admin.reasonDialog.cancel"),
      exact: true
    });
    this.confirmButton = this.root.getByRole("button", { name: confirmLabel, exact: true });
  }

  async expectOpen(): Promise<void> {
    await expect(this.reason).toBeVisible();
  }

  /** Types the reason and confirms. Waits for the dialog to close. */
  async confirmWith(reason: string): Promise<void> {
    await this.reason.fill(reason);
    await this.confirmButton.click();
    await expect(this.reason).toBeHidden();
  }
}
