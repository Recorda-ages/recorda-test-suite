import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../support/i18n";
import { BottomTabBar } from "./components/BottomTabBar";
import { ProfileDetails } from "./components/ProfileDetails";

export class ProfilePage {
  readonly root: Locator;
  readonly settingsButton: Locator;
  readonly tabBar: BottomTabBar;
  readonly details: ProfileDetails;
  /** The avatar is a button on the own profile; it opens the avatar menu. */
  readonly editAvatarButton: Locator;
  // The menu and the dialog render in portals, outside `root`.
  readonly avatarMenuGallery: Locator;
  readonly avatarMenuRemove: Locator;
  readonly removeAvatarDialog: Locator;
  readonly confirmRemoveAvatarButton: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("profile-screen");
    // Icon-only button; its accessible name is the Settings screen title.
    this.settingsButton = this.root.getByRole("button", { name: t("settings.title") });
    this.tabBar = new BottomTabBar(this.root);
    this.details = new ProfileDetails(this.root);
    this.editAvatarButton = this.root.getByRole("button", { name: t("profile.editAvatarA11y") });
    this.avatarMenuGallery = page.getByTestId("avatar-menu-gallery");
    this.avatarMenuRemove = page.getByTestId("avatar-menu-remove");
    this.removeAvatarDialog = page.getByTestId("remove-avatar-dialog");
    this.confirmRemoveAvatarButton = this.removeAvatarDialog.getByRole("button", {
      name: t("profile.removeAvatarConfirm")
    });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async openSettings(): Promise<void> {
    await this.settingsButton.click();
  }

  /**
   * Opens the avatar menu.
   *
   * The only fixed wait in the suite (team decision, see docs/GUIDELINES.md "Known frontend
   * gaps"): on web, a press within ~0.5 s of the profile mounting leaves the menu unopenable
   * until the app reloads. react-native-paper's Menu `show()` awaits a measurement of its
   * portal content that never resolves, so `visible` stays true and later presses change
   * nothing. No DOM, network, font or idle signal marks the end of that window, and a
   * retry can't recover once it has happened.
   * TODO(frontend): remove the wait once AvatarPickerMenu opens reliably right away.
   */
  async openAvatarMenu(): Promise<void> {
    await this.root.page().waitForTimeout(1_000);
    await this.editAvatarButton.click();
    await expect(this.avatarMenuGallery).toBeVisible();
  }

  /** Avatar → "Escolher da galeria" → picks `file` in the browser's file chooser. */
  async chooseAvatarFromGallery(file: string): Promise<void> {
    await this.openAvatarMenu();
    const fileChooser = this.root.page().waitForEvent("filechooser");
    await this.avatarMenuGallery.click();
    await (await fileChooser).setFiles(file);
  }

  /** Avatar → "Remover foto" → confirms the dialog. */
  async removeAvatar(): Promise<void> {
    await this.openAvatarMenu();
    await this.avatarMenuRemove.click();
    await expect(this.removeAvatarDialog).toBeVisible();
    await this.confirmRemoveAvatarButton.click();
  }
}
