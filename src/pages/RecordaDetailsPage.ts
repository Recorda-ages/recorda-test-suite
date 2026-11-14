import { expect, type Page } from "@playwright/test";
import { t } from "../support/i18n";

export class RecordaDetailsPage {
  readonly root;
  readonly shareButton;
  constructor(page: Page) {
    this.root = page.getByTestId("recorda-detail-screen");
    this.shareButton = this.root.getByRole("button", {
      name: t("feed.share"),
      exact: true,
    });
  }
  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }
  async share(): Promise<void> {
    await this.shareButton.click();
  }
}
