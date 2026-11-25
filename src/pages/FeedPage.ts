import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../support/i18n";
import { BottomTabBar } from "./components/BottomTabBar";

/** "general" is the "Para Você" tab (internal id `geral`); it is the one shown first. */
export type FeedVariant = "general" | "following";

const TAB_KEY: Record<FeedVariant, string> = {
  general: "feed.tabs.geral",
  following: "feed.tabs.following"
};

export class FeedPage {
  readonly root: Locator;
  readonly notificationsButton: Locator;
  /** Unread count on the bell; not rendered when everything is read. */
  readonly notificationsBadge: Locator;
  readonly searchButton: Locator;
  readonly tabBar: BottomTabBar;

  constructor(page: Page) {
    this.root = page.getByTestId("feed-screen");
    this.notificationsButton = this.root.getByTestId("feed-notifications-button");
    this.notificationsBadge = this.notificationsButton.getByTestId("feed-notifications-badge");
    this.searchButton = this.root.getByTestId("feed-search-button");
    this.tabBar = new BottomTabBar(this.root);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  feedTab(variant: FeedVariant): Locator {
    return this.root.getByRole("tab", { name: t(TAB_KEY[variant]) });
  }

  panel(variant: FeedVariant): Locator {
    return this.root.getByTestId(`${variant}-feed-panel`);
  }

  /** Recorda cards of a feed tab (`feed-post-<recorda_id>`). */
  posts(variant: FeedVariant): Locator {
    return this.panel(variant).locator('[data-testid^="feed-post-"]');
  }

  /** One Recorda card of a feed tab. */
  post(variant: FeedVariant, recordaId: string): Locator {
    return this.panel(variant).getByTestId(`feed-post-${recordaId}`);
  }

  /** Like button of a card (`like-button-<recorda_id>`). */
  likeButton(variant: FeedVariant, recordaId: string): Locator {
    return this.post(variant, recordaId).getByTestId(`like-button-${recordaId}`);
  }

  /** Three-dots menu of a card (a Modal, outside the screen root). */
  cardMenu(): Locator {
    return this.root.page().getByTestId("recorda-card-menu");
  }

  /** The scrollable list of a tab (a FlatList; on web its root is the scroll container). */
  list(variant: FeedVariant): Locator {
    return this.panel(variant).getByTestId(`${variant}-feed-list`);
  }

  /** "Carregando feed...", while the first page loads. */
  loading(variant: FeedVariant): Locator {
    return this.panel(variant).getByText(t("feed.loading"), { exact: true });
  }

  /** The first page failed: the message, with "Tentar novamente" next to it. */
  loadError(variant: FeedVariant): Locator {
    return this.panel(variant).getByText(t("feed.loadError"), { exact: true });
  }

  /** A later page failed: the message at the end of the list. */
  loadMoreError(variant: FeedVariant): Locator {
    return this.panel(variant).getByText(t("feed.loadMoreError"), { exact: true });
  }

  retryButton(variant: FeedVariant): Locator {
    return this.panel(variant).getByRole("button", { name: t("feed.retry"), exact: true });
  }

  /** Mute/unmute toggle over a card's media; only shown when the Recorda has a preview. */
  soundToggle(variant: FeedVariant, recordaId: string): Locator {
    return this.post(variant, recordaId).getByTestId(`recorda-sound-toggle-${recordaId}`);
  }

  // Scrolling sets `scrollTop`: react-native-web replaces the list node's `scrollTo` with
  // its own (x, y) signature.

  /** Scrolls a tab's list to its end, which asks for the next page. */
  async scrollToEnd(variant: FeedVariant): Promise<void> {
    await this.list(variant).evaluate((list) => {
      list.scrollTop = list.scrollHeight;
    });
  }

  async scrollDown(variant: FeedVariant, pixels: number): Promise<void> {
    await this.list(variant).evaluate((list, by) => {
      list.scrollTop += by;
    }, pixels);
  }

  async scrollTop(variant: FeedVariant): Promise<number> {
    return this.list(variant).evaluate((list) => list.scrollTop);
  }

  /** The three-dots button of a card. */
  moreButton(variant: FeedVariant, recordaId: string): Locator {
    return this.post(variant, recordaId).getByRole("button", { name: t("feed.more") });
  }

  /** Card → three dots → "Denunciar". Opens the report dialog. */
  async openReport(variant: FeedVariant, recordaId: string): Promise<void> {
    await this.moreButton(variant, recordaId).click();
    await this.cardMenu()
      .getByRole("button", { name: t("publishedRecorda.report"), exact: true })
      .click();
  }

  emptyState(variant: FeedVariant): Locator {
    return this.root.getByTestId(`feed-${variant}-empty-state`);
  }

  async selectFeedTab(variant: FeedVariant): Promise<void> {
    await this.feedTab(variant).click();
  }
}
