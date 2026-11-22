import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../support/i18n";

export type AuditPeriod = "all" | "today" | "lastMonth";

/** "Registro de Auditoria": every moderation action, newest first. */
export class AdminAuditLogPage {
  readonly root: Locator;
  readonly search: Locator;
  readonly list: Locator;
  readonly entries: Locator;
  readonly empty: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("admin-audit-log-screen");
    this.search = this.root.getByTestId("admin-audit-log-search");
    this.list = this.root.getByTestId("admin-audit-log-list");
    this.entries = this.list.locator('[data-testid^="admin-audit-log-entry-"]');
    this.empty = this.root.getByTestId("admin-audit-log-empty");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  /** "Todas" / "Hoje" / "Último mês". */
  periodFilter(period: AuditPeriod): Locator {
    return this.root.getByRole("radio", {
      name: t(`admin.auditLog.filters.${period}`),
      exact: true
    });
  }

  /** An administrator filter chip (its label is the admin's username). */
  adminFilter(username: string): Locator {
    return this.root.getByRole("radio", { name: username, exact: true });
  }

  /** Entries that mention `text` (a reason, a username…). */
  entriesWith(text: string): Locator {
    return this.entries.filter({ hasText: text });
  }

  async find(text: string): Promise<void> {
    await this.search.fill(text);
  }
}
