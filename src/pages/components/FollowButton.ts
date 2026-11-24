import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../../support/i18n";

export type FollowState = "follow" | "requested" | "following";

const LABEL_KEY: Record<FollowState, string> = {
  follow: "follow.follow",
  requested: "follow.requested",
  following: "follow.following"
};

/**
 * The follow button (`follow-button-<userId>`) shown on profiles and search results. Its
 * text is the relation: "Seguir", "Solicitado" or "Seguindo". Tapping "Seguindo" opens the
 * unfollow confirmation (a Modal, located from `page`).
 */
export class FollowButton {
  readonly button: Locator;
  readonly unfollowDialog: Locator;
  readonly confirmUnfollowButton: Locator;

  constructor(scope: Locator, page: Page, userId: string) {
    this.button = scope.getByTestId(`follow-button-${userId}`);
    this.unfollowDialog = page.getByTestId("unfollow-dialog");
    this.confirmUnfollowButton = this.unfollowDialog.getByRole("button", {
      name: t("follow.unfollowConfirm"),
      exact: true
    });
  }

  /** The label starts the button's text ("Seguir" is followed by a "+" icon glyph). */
  async expectState(state: FollowState): Promise<void> {
    await expect(this.button).toHaveText(new RegExp(`^${t(LABEL_KEY[state])}`));
  }

  /** "Seguindo" → confirm "Deixar de seguir". */
  async unfollow(): Promise<void> {
    await this.button.click();
    await this.confirmUnfollowButton.click();
    await expect(this.unfollowDialog).toBeHidden();
  }
}
