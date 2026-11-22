import type { Locator } from "@playwright/test";

import { t } from "../../support/i18n";

export type ProfileTab = "recordas" | "metrics" | "calendar";

/**
 * What the own profile (`ProfilePage`) and someone else's (`UserProfilePage`) share: the
 * header (avatar, identity, streak, music chips, counters) and the Recordas / Métricas /
 * Calendário tabs. Build it from the owning screen's root, like `BottomTabBar`, because the
 * native stack keeps earlier screens mounted.
 */
export class ProfileDetails {
  readonly header: Locator;
  /** The picture, when the account has one. */
  readonly avatar: Locator;
  /** The default person icon, when it has none. */
  readonly avatarFallback: Locator;
  /** Recordas, followers and following; not rendered when the viewer can't see them. */
  readonly counts: Locator;
  /**
   * Every streak indicator in the header, active or not. Exact testIDs: the hint below the
   * chips ("Publique hoje…") is `profile-streak-hint`, which is not an indicator.
   */
  readonly streakIndicators: Locator;
  readonly favoriteSong: Locator;
  readonly artistChips: Locator;
  readonly genreChips: Locator;

  readonly tabs: Locator;
  readonly grid: Locator;
  readonly gridItems: Locator;
  readonly gridEmpty: Locator;
  /** "Esta conta é privada": replaces each tab's content when the viewer can't see it. */
  readonly privateNotice: Locator;
  /**
   * The period filter of the Métricas tab, shown whether or not the period has Recordas
   * (the cards give way to an empty state when it has none).
   */
  readonly metricsContent: Locator;
  /** The month title of the Calendário tab. */
  readonly calendarContent: Locator;

  constructor(private readonly screen: Locator) {
    this.header = screen.getByTestId("profile-header");
    this.avatar = this.header.getByTestId("profile-avatar");
    this.avatarFallback = this.header.getByTestId("profile-avatar-fallback");
    this.counts = this.header.getByTestId("profile-counts");
    this.streakIndicators = this.header.locator(
      '[data-testid="profile-streak-active"], [data-testid="profile-streak-inactive"]'
    );
    this.favoriteSong = this.header.getByTestId("profile-favorite-song");
    // Chips with a picture also render `<chip testID>-image`.
    this.artistChips = this.header.locator(
      '[data-testid^="profile-favorite-artist-"]:not([data-testid$="-image"])'
    );
    this.genreChips = this.header.locator(
      '[data-testid^="profile-favorite-genre-"]:not([data-testid$="-image"])'
    );

    // By testID: the bottom tab bar is a tablist too.
    this.tabs = screen.locator('[data-testid^="profile-tab-"]');
    this.grid = screen.getByTestId("recorda-grid");
    this.gridItems = this.grid.locator('[data-testid^="recorda-grid-item-"]');
    this.gridEmpty = screen.getByTestId("recorda-grid-empty");
    this.privateNotice = screen.getByTestId("profile-private-notice");
    this.metricsContent = screen.getByRole("button", {
      name: t("memoriesMetrics.periods.all_time"),
      exact: true
    });
    this.calendarContent = screen.getByTestId("calendar-month-title");
  }

  /** "Gabriel Reis", inside the header (the third-party top bar repeats the name). */
  name(name: string): Locator {
    return this.header.getByText(name, { exact: true });
  }

  /** "@gabriel". */
  username(username: string): Locator {
    return this.header.getByText(`@${username}`, { exact: true });
  }

  /** A counter by what it reads, e.g. `count("followers", 5)` → "5 Seguidores". */
  count(kind: "recordas" | "followers" | "following", value: number): Locator {
    const label = t(`profile.counts.${kind}`, { count: value });
    return this.counts.getByLabel(`${value} ${label}`, { exact: true });
  }

  tab(name: ProfileTab): Locator {
    return this.screen.getByTestId(`profile-tab-${name}`);
  }

  gridItem(recordaId: string): Locator {
    return this.grid.getByTestId(`recorda-grid-item-${recordaId}`);
  }

  async selectTab(name: ProfileTab): Promise<void> {
    await this.tab(name).click();
  }

  /**
   * Scrolls to the last loaded Recorda. Near the end of the scroll the screen requests the
   * next page of the grid, as when a person scrolls down.
   */
  async scrollToLastRecorda(): Promise<void> {
    await this.gridItems.last().scrollIntoViewIfNeeded();
  }
}
