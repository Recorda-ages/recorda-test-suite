import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../support/i18n";

/** "Detalhes da Recorda" (`PublishedRecordaScreen` → `RecordaDetailView`). */
export class RecordaDetailsPage {
  readonly root: Locator;
  readonly backButton: Locator;
  readonly moreButton: Locator;
  readonly likeButton: Locator;
  readonly commentButton: Locator;
  readonly shareButton: Locator;
  readonly description: Locator;

  /** Third-party Recorda: popover inside the screen. */
  readonly otherMenu: Locator;
  readonly reportOption: Locator;
  readonly notInterestedOption: Locator;
  /** Own Recorda: a Modal, rendered outside the screen root. */
  readonly deleteRecordaOption: Locator;

  readonly commentsSheet: Locator;
  readonly commentInput: Locator;
  readonly sendCommentButton: Locator;

  /** Delete-comment confirmation (a Modal, outside the screen root). */
  readonly deleteCommentDialog: Locator;
  readonly confirmDeleteCommentButton: Locator;
  readonly cancelDeleteCommentButton: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("recorda-detail-screen");
    this.backButton = this.root.getByRole("button", { name: t("publishedRecorda.back") });
    this.moreButton = this.root.getByRole("button", { name: t("feed.more") });
    this.likeButton = this.root.getByRole("button", { name: t("feed.like"), exact: true });
    this.commentButton = this.root.getByRole("button", { name: t("feed.comment"), exact: true });
    this.shareButton = this.root.getByRole("button", { name: t("feed.share"), exact: true });
    this.description = this.root.getByTestId("recorda-description");

    this.otherMenu = this.root.getByTestId("recorda-menu");
    this.reportOption = page.getByRole("button", { name: t("publishedRecorda.report") });
    this.notInterestedOption = page.getByRole("button", {
      name: t("publishedRecorda.notInterested")
    });
    this.deleteRecordaOption = page.getByRole("button", {
      name: t("publishedRecorda.delete"),
      exact: true
    });

    this.commentsSheet = this.root.getByTestId("comments-sheet");
    this.commentInput = this.commentsSheet.getByRole("textbox", {
      name: t("publishedRecorda.writeComment")
    });
    this.sendCommentButton = this.commentsSheet.getByRole("button", {
      name: t("publishedRecorda.send")
    });

    // No testID: the dialog is recognised by its title; a hidden Modal isn't rendered, so its
    // buttons can be located from the page without matching anything else.
    this.deleteCommentDialog = page.getByText(t("recordaView.deleteDialog.title"), {
      exact: true
    });
    this.confirmDeleteCommentButton = page.getByRole("button", {
      name: t("recordaView.deleteDialog.confirm"),
      exact: true
    });
    this.cancelDeleteCommentButton = page.getByRole("button", {
      name: t("recordaView.deleteDialog.cancel"),
      exact: true
    });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  /** "N curtida(s)" under the actions. */
  likesCount(count: number): Locator {
    return this.root.getByText(t("publishedRecorda.likes", { count }), { exact: true });
  }

  /** The author's username button over the media. */
  author(username: string): Locator {
    return this.root.getByRole("button", { name: t("profile.openA11y", { username }) }).first();
  }

  /** The text of a comment in the open sheet (comment rows have no testID). */
  comment(text: string): Locator {
    return this.commentsSheet.getByText(text, { exact: false });
  }

  deleteCommentButton(commentId: string): Locator {
    return this.commentsSheet.getByTestId(`delete-comment-${commentId}`);
  }

  async openComments(): Promise<void> {
    await this.commentButton.click();
    await expect(this.commentsSheet).toBeVisible();
  }

  async sendComment(text: string): Promise<void> {
    await this.commentInput.fill(text);
    await this.sendCommentButton.click();
  }

  async openMenu(): Promise<void> {
    await this.moreButton.click();
  }
}
