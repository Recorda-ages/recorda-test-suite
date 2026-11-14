import { expect, type Locator, type Page } from "@playwright/test";

/** A published Recorda opened on its own (from a feed card, a profile or a notification). */
export class RecordaDetailPage {
  readonly root: Locator;
  /** "<author> <description>", shown only when the Recorda has a description. */
  readonly description: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("recorda-detail-screen");
    this.description = this.root.getByTestId("recorda-description");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }
}
