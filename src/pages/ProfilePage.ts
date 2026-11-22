import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../support/i18n";
import { BottomTabBar } from "./components/BottomTabBar";

export class ProfilePage {
  readonly favoriteSong: Locator;
  readonly root: Locator;
  readonly settingsButton: Locator;
  readonly tabBar: BottomTabBar;

  constructor(page: Page) {
    this.root = page.getByTestId("profile-screen");
    this.favoriteSong = this.root.getByTestId("profile-favorite-song");
    // Icon-only button; its accessible name is the Settings screen title.
    this.settingsButton = this.root.getByRole("button", { name: t("settings.title") });
    this.tabBar = new BottomTabBar(this.root);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async openRecorda(id: string): Promise<void> {
    await this.root.getByTestId(`recorda-grid-item-${id}`).click();
  }

  async openSettings(): Promise<void> {
    await this.settingsButton.click();
  }

  /** Thumbnail of a Recorda in the profile grid. */
  gridItem(recordaId: string): Locator {
    return this.root.getByTestId(`recorda-grid-item-${recordaId}`);
  }
}
