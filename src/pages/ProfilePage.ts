import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../support/i18n";
import { BottomTabBar } from "./components/BottomTabBar";
import { MemoryCalendar, MetricsDashboard, Retrospective } from "./components/Memories";
import { ProfileDetails } from "./components/ProfileDetails";

export class ProfilePage {
  readonly root: Locator;
  readonly settingsButton: Locator;
  readonly tabBar: BottomTabBar;
  readonly details: ProfileDetails;
  readonly calendar: MemoryCalendar;
  readonly metrics: MetricsDashboard;
  readonly retrospective: Retrospective;
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
    this.calendar = new MemoryCalendar(this.root);
    this.metrics = new MetricsDashboard(this.root);
    this.retrospective = new Retrospective(this.root, page);
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

  async openRecorda(id: string): Promise<void> {
    await this.gridItem(id).click();
  }

  /** Thumbnail of a Recorda in the profile grid. */
  gridItem(recordaId: string): Locator {
    return this.root.getByTestId(`recorda-grid-item-${recordaId}`);
  }

  async openSettings(): Promise<void> {
    await this.settingsButton.click();
  }

  /**
   * Opens the avatar menu.
   *
   * On web, react-native-paper's Menu measures its anchor when it opens; pressing while the
   * profile header is still laying out (avatar, counters and music arriving) leaves the menu
   * unopenable until the app reloads. So wait until the avatar button stops moving: the
   * same box on consecutive animation frames.
   */
  async openAvatarMenu(): Promise<void> {
    await expect(this.editAvatarButton).toBeVisible();
    await this.editAvatarButton.evaluate(
      (element) =>
        new Promise<void>((resolve) => {
          let previous = "";
          let stableFrames = 0;
          const check = () => {
            const { x, y, width, height } = element.getBoundingClientRect();
            const current = `${x},${y},${width},${height}`;
            stableFrames = current === previous ? stableFrames + 1 : 0;
            previous = current;
            if (stableFrames >= 10) resolve();
            else requestAnimationFrame(check);
          };
          requestAnimationFrame(check);
        })
    );
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
