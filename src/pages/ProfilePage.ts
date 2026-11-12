import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../support/i18n";
import { BottomTabBar } from "./components/BottomTabBar";

export class ProfilePage {
  readonly root: Locator;
  readonly settingsButton: Locator;
  readonly tabBar: BottomTabBar;

  constructor(page: Page) {
    this.root = page.getByTestId("profile-screen");
    // Icon-only button; its accessible name is the Settings screen title.
    this.settingsButton = this.root.getByRole("button", { name: t("settings.title") });
    this.tabBar = new BottomTabBar(this.root);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async openSettings(): Promise<void> {
    await this.settingsButton.click();
  }

  favoriteSong(song: { title: string; artistName: string }): Locator {
    return this.root.getByLabel(
      t("profile.favoriteSongA11y", { title: song.title, artist: song.artistName }),
      { exact: true }
    );
  }

  favoriteArtist(name: string): Locator {
    return this.root.getByLabel(t("profile.favoriteArtistA11y", { name }), { exact: true });
  }

  favoriteGenre(name: string): Locator {
    return this.root.getByLabel(t("profile.favoriteGenreA11y", { name }), { exact: true });
  }
}
