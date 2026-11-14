import type { Locator } from "@playwright/test";

import { t } from "../../support/i18n";

export type AdminTab = "reports" | "users" | "auditLog";

/**
 * The bottom navigation of the admin area (Denúncias, Usuários, Auditoria).
 *
 * Every admin screen renders its own copy, and the native stack keeps earlier screens
 * mounted on web, so build it from the owning screen's root, never from `page`.
 */
export class AdminTabBar {
  readonly root: Locator;

  constructor(screen: Locator) {
    this.root = screen.getByTestId("admin-bottom-navigation");
  }

  tab(name: AdminTab): Locator {
    return this.root.getByRole("tab", { name: t(`admin.navigation.${name}`) });
  }

  async select(name: AdminTab): Promise<void> {
    await this.tab(name).click();
  }
}
