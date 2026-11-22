import { expect, type Page } from "@playwright/test";
import { t } from "../support/i18n";

export class ShareCardPage {
  readonly root;
  readonly card;
  readonly media;
  readonly presets;
  readonly options;
  readonly downloadButton;
  readonly storiesButton;
  readonly mediaProgress;
  readonly exportProgress;
  readonly exportCanvas;
  readonly exportMedia;
  constructor(private readonly page: Page) {
    this.root = page.getByTestId("share-card-screen");
    this.card = this.root.getByTestId("share-card-card");
    this.media = this.root.getByTestId("share-card-media");
    this.presets = this.root.getByTestId("share-card-presets");
    this.options = this.presets.getByRole("radio");
    this.downloadButton = this.root.getByRole("button", {
      name: t("shareCard.download"),
      exact: true,
    });
    this.storiesButton = this.root.getByRole("button", {
      name: t("shareCard.instagramStories"),
      exact: true,
    });
    this.mediaProgress = this.root.getByTestId("share-card-media-progress");
    this.exportCanvas = this.root.getByTestId("share-card-export-canvas");
    this.exportMedia = this.root.getByTestId("share-card-export-media");
    this.exportProgress = this.root.getByTestId("share-card-export-progress");
  }
  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }
  preset(id: string) {
    return this.presets.getByTestId(`share-card-preset-${id}`);
  }
  async selectPreset(id: string): Promise<void> {
    await this.preset(id).click();
  }
  async download(options: { force?: boolean } = {}) {
    // Web feedback is a blocking alert. Dismiss it without asserting native RF-12.6.
    this.page.once("dialog", (dialog) => void dialog.dismiss());
    const downloaded = this.page.waitForEvent("download");
    await this.downloadButton.click(options);
    return downloaded;
  }
}
