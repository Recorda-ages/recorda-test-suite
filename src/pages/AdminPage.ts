import { expect, type Locator, type Page } from "@playwright/test";

import { AdminTabBar, type AdminTab } from "./components/AdminTabBar";

const SCREEN_TEST_ID: Record<AdminTab, string> = {
  reports: "admin-reports-screen",
  users: "admin-users-route",
  auditLog: "admin-audit-log-screen"
};

/**
 * The admin area: one screen per tab of its bottom navigation. An administrator lands on
 * Denúncias (`reports`) after signing in.
 */
export class AdminPage {
  constructor(private readonly page: Page) {}

  screen(tab: AdminTab = "reports"): Locator {
    return this.page.getByTestId(SCREEN_TEST_ID[tab]);
  }

  /** The bottom navigation of the screen of `tab`. */
  tabBar(tab: AdminTab = "reports"): AdminTabBar {
    return new AdminTabBar(this.screen(tab));
  }

  async expectLoaded(tab: AdminTab = "reports"): Promise<void> {
    await expect(this.screen(tab)).toBeVisible();
  }
}
