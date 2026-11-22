import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../support/i18n";

/** Step 1: favorite artists (popular artists load without searching). */
export class OnboardingArtistsStep {
  readonly root: Locator;
  readonly stepLabel: Locator;
  readonly search: Locator;
  readonly chips: Locator;
  readonly selectionCount: Locator;
  readonly back: Locator;
  readonly next: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("onboarding-artists-screen");
    this.stepLabel = this.root.getByText(t("onboarding.artists.step"));
    this.search = this.root.getByLabel(t("onboarding.artists.search"));
    this.chips = this.root.getByRole("checkbox");
    this.selectionCount = this.root.getByTestId("onboarding-selection-count");
    this.back = this.root.getByTestId("onboarding-artists-back-button");
    this.next = this.root.getByTestId("onboarding-artists-next-button");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.chips.first()).toBeVisible();
  }

  /** Selects the first `count` options shown, whatever Deezer returns. */
  async selectFirst(count: number): Promise<void> {
    for (let index = 0; index < count; index++) {
      await this.chips.nth(index).click();
    }
  }
}

/** Step 2: favorite genres. */
export class OnboardingGenresStep {
  readonly root: Locator;
  readonly stepLabel: Locator;
  readonly chips: Locator;
  readonly selectionCount: Locator;
  readonly back: Locator;
  readonly next: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("onboarding-genres-screen");
    this.stepLabel = this.root.getByText(t("onboarding.genres.step"));
    this.chips = this.root.getByRole("checkbox");
    this.selectionCount = this.root.getByTestId("onboarding-selection-count");
    this.back = this.root.getByTestId("onboarding-genres-back-button");
    this.next = this.root.getByTestId("onboarding-genres-next-button");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.chips.first()).toBeVisible();
  }

  async selectFirst(count: number): Promise<void> {
    for (let index = 0; index < count; index++) {
      await this.chips.nth(index).click();
    }
  }
}

/** Step 3: exactly one favorite song. */
export class OnboardingMusicStep {
  readonly root: Locator;
  readonly stepLabel: Locator;
  readonly search: Locator;
  readonly songs: Locator;
  readonly back: Locator;
  readonly finish: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("onboarding-music-screen");
    this.stepLabel = this.root.getByText(t("onboarding.music.step"));
    this.search = this.root.getByLabel(t("onboarding.music.search"));
    this.songs = this.root.getByRole("radio");
    this.back = this.root.getByTestId("onboarding-music-back-button");
    this.finish = this.root.getByTestId("onboarding-music-finish-button");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.songs.first()).toBeVisible();
  }

  /** Selects a song and returns its accessible name ("<title>, <artist>"). */
  async selectFirstSong(): Promise<string> {
    const song = this.songs.first();
    const label = (await song.getAttribute("aria-label")) ?? "";
    await song.click();
    return label;
  }
}

/** The three onboarding steps, shown right after sign-up. */
export class OnboardingPage {
  readonly artists: OnboardingArtistsStep;
  readonly genres: OnboardingGenresStep;
  readonly music: OnboardingMusicStep;

  constructor(page: Page) {
    this.artists = new OnboardingArtistsStep(page);
    this.genres = new OnboardingGenresStep(page);
    this.music = new OnboardingMusicStep(page);
  }

  /** Completes all steps with the minimum valid choices. Returns the song chosen. */
  async completeWithMinimumChoices(): Promise<string> {
    await this.artists.expectLoaded();
    await this.artists.selectFirst(3);
    await this.artists.next.click();

    await this.genres.expectLoaded();
    await this.genres.selectFirst(3);
    await this.genres.next.click();

    await this.music.expectLoaded();
    const song = await this.music.selectFirstSong();
    await this.music.finish.click();
    return song;
  }
}
