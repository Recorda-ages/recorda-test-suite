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
  readonly searchButton: Locator;
  readonly tabBar: BottomTabBar;

  constructor(page: Page) {
    this.root = page.getByTestId("feed-screen");
    this.notificationsButton = this.root.getByTestId("feed-notifications-button");
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

  emptyState(variant: FeedVariant): Locator {
    return this.root.getByTestId(`feed-${variant}-empty-state`);
  }

  async selectFeedTab(variant: FeedVariant): Promise<void> {
    await this.feedTab(variant).click();
  }
}
