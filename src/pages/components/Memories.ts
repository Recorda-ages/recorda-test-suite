import { expect, type Locator, type Page } from "@playwright/test";

import { LOCALE, t } from "../../support/i18n";

/** "Novembro 2026": the calendar's title for a month, as the app formats it. */
export function monthTitle(year: number, month: number): string {
  const name = new Intl.DateTimeFormat(LOCALE, { month: "long" }).format(
    new Date(year, month - 1, 1, 12)
  );
  return t("memoriesCalendar.grid.monthTitle", {
    month: name.charAt(0).toLocaleUpperCase(LOCALE) + name.slice(1),
    year
  });
}

/** Today in São Paulo, the calendar's time zone: `{ year, month, day, iso: "YYYY-MM-DD" }`. */
export function todayInSaoPaulo() {
  const iso = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date()
  );
  const [year, month, day] = iso.split("-").map(Number) as [number, number, number];
  return { year, month, day, iso };
}

/** The Calendário tab of the own profile: month header and the 7-column grid. */
export class MemoryCalendar {
  readonly title: Locator;
  readonly summary: Locator;
  readonly previousMonth: Locator;
  readonly nextMonth: Locator;
  readonly weekdays: Locator;
  private readonly screen: Locator;

  constructor(screen: Locator) {
    this.title = screen.getByTestId("calendar-month-title");
    this.summary = screen.getByTestId("calendar-month-summary");
    this.previousMonth = screen.getByTestId("calendar-previous-month");
    this.nextMonth = screen.getByTestId("calendar-next-month");
    this.weekdays = screen.getByTestId("calendar-weekday");
    this.screen = screen;
  }

  /** A day cell (`date` is "YYYY-MM-DD"); a button only when it has Recordas. */
  day(date: string): Locator {
    return this.screen.getByTestId(`calendar-day-${date}`);
  }

  thumbnail(date: string): Locator {
    return this.screen.getByTestId(`calendar-day-thumbnail-${date}`);
  }

  /** "+N" on a day with more than one Recorda. */
  badge(date: string): Locator {
    return this.screen.getByTestId(`calendar-day-badge-${date}`);
  }

  /** Steps back month by month until the title shows `year`/`month`. */
  async goToMonth(year: number, month: number): Promise<void> {
    const target = monthTitle(year, month);
    await expect(async () => {
      if ((await this.title.textContent()) !== target) await this.previousMonth.click();
      await expect(this.title).toHaveText(target, { timeout: 1_000 });
    }).toPass({ timeout: 30_000 });
  }
}

/** The full-screen viewer of one day's Recordas (a Modal, located from `page`). */
export class DayMemoriesViewer {
  readonly root: Locator;
  readonly closeButton: Locator;
  readonly segments: Locator;
  readonly musicPill: Locator;
  readonly musicToggle: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("day-memories-viewer");
    this.closeButton = this.root.getByTestId("day-memories-close");
    this.segments = this.root.locator('[data-testid^="day-pagination-segment-"]');
    this.musicPill = this.root.getByTestId("music-preview-pill");
    this.musicToggle = this.root.getByTestId("music-preview-toggle");
  }

  slide(recordaId: string): Locator {
    return this.root.getByTestId(`day-memory-slide-${recordaId}`);
  }

  /** The slide shown, found by its caption. */
  slideWith(caption: string): Locator {
    return this.root.locator('[data-testid^="day-memory-slide-"]').filter({ hasText: caption });
  }

  /** Taps the left (previous) or right (next) half of the screen. */
  async tap(side: "previous" | "next"): Promise<void> {
    const box = await this.root.boundingBox();
    if (!box) throw new Error("The day viewer is not on screen");
    const x = side === "previous" ? box.x + box.width * 0.2 : box.x + box.width * 0.8;
    await this.root.page().mouse.click(x, box.y + box.height / 2);
  }
}

/** The Métricas tab: period filter, then the cards or the empty state. */
export class MetricsDashboard {
  readonly total: Locator;
  readonly topArtists: Locator;
  readonly topGenres: Locator;
  readonly streak: Locator;
  readonly streakValue: Locator;
  readonly empty: Locator;
  readonly createButton: Locator;

  constructor(private readonly screen: Locator) {
    this.total = screen.getByTestId("total-recordas-value");
    this.topArtists = screen.getByTestId("top-artists-card");
    this.topGenres = screen.getByTestId("top-genres-card");
    this.streak = screen.getByTestId("daily-streak-card");
    this.streakValue = screen.getByTestId("daily-streak-value");
    this.empty = screen.getByText(t("memoriesMetrics.empty"), { exact: true });
    this.createButton = screen.getByRole("button", {
      name: t("memoriesMetrics.create"),
      exact: true
    });
  }

  period(id: "last_30_days" | "last_90_days" | "last_year" | "all_time"): Locator {
    return this.screen.getByRole("button", {
      name: t(`memoriesMetrics.periods.${id}`),
      exact: true
    });
  }

  artistRow(position: number): Locator {
    return this.screen.getByTestId(`top-artist-row-${position}`);
  }

  genreRow(position: number): Locator {
    return this.screen.getByTestId(`top-genre-row-${position}`);
  }
}

/** The retrospective: the period sheet, then the Story Viewer (both outside the screen). */
export class Retrospective {
  readonly openButton: Locator;
  readonly sheet: Locator;
  readonly sheetLoading: Locator;
  readonly sheetMessage: Locator;
  readonly viewer: Locator;
  readonly step: Locator;
  readonly progressSegments: Locator;
  readonly previousZone: Locator;
  readonly nextZone: Locator;
  readonly closeButton: Locator;
  readonly summary: Locator;
  private readonly page: Page;

  constructor(screen: Locator, page: Page) {
    this.openButton = screen.getByTestId("retrospective-button");
    this.sheet = page.getByTestId("retrospective-flow");
    this.sheetLoading = page.getByTestId("retrospective-flow-loading");
    this.sheetMessage = page.getByTestId("retrospective-flow-message");
    this.viewer = page.getByTestId("retrospective-screen");
    // "Etapa N de M"
    this.step = this.viewer.getByText(
      new RegExp(`^${t("retrospective.step", { current: "\\d+", total: "\\d+" })}$`)
    );
    this.progressSegments = this.viewer.locator('[data-testid^="story-progress-segment-"]');
    this.previousZone = this.viewer.getByTestId("retrospective-previous");
    this.nextZone = this.viewer.getByTestId("retrospective-next");
    this.closeButton = this.viewer.getByTestId("retrospective-close");
    this.summary = this.viewer.getByTestId("retrospective-summary");
    this.page = page;
  }

  /** A period in the sheet; `month` is omitted for a yearly one. */
  period(year: number, month?: number): Locator {
    const kind = month ? "MONTHLY" : "YEARLY";
    return this.page.getByTestId(`retrospective-period-${kind}-${year}-${month ?? 0}`);
  }

  stepText(current: number, total: number): string {
    return t("retrospective.step", { current, total });
  }
}
