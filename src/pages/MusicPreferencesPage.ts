import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../support/i18n";

/**
 * "Editar preferências musicais": the three onboarding steps (artists, genres, favorite
 * song) reused as a wizard from Settings.
 *
 * Selected chips are not observable as `aria-checked` (react-native-web 0.21 drops
 * `accessibilityState`), so a selection is read from the step's counter.
 */
export class MusicPreferencesPage {
  readonly artistsStep: Locator;
  readonly genresStep: Locator;
  readonly musicStep: Locator;
  readonly backButton: Locator;
  readonly artists: Locator;
  readonly genres: Locator;
  readonly songs: Locator;
  readonly nextFromArtists: Locator;
  readonly nextFromGenres: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.artistsStep = page.getByTestId("onboarding-artists-screen");
    this.genresStep = page.getByTestId("onboarding-genres-screen");
    this.musicStep = page.getByTestId("onboarding-music-screen");
    this.backButton = this.artistsStep.getByTestId("onboarding-artists-back-button");
    this.artists = this.artistsStep.getByRole("checkbox");
    this.genres = this.genresStep.getByRole("checkbox");
    this.songs = this.musicStep.getByRole("radio");
    this.nextFromArtists = this.artistsStep.getByTestId("onboarding-artists-next-button");
    this.nextFromGenres = this.genresStep.getByTestId("onboarding-genres-next-button");
    this.saveButton = this.musicStep.getByTestId("onboarding-music-finish-button");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.artistsStep).toBeVisible();
  }

  artist(name: string): Locator {
    return this.artistsStep.getByRole("checkbox", { name, exact: true });
  }

  genre(name: string): Locator {
    return this.genresStep.getByRole("checkbox", { name, exact: true });
  }

  /**
   * Waits until a step has Deezer's popular items on screen. Until then the artists step shows
   * only a spinner and the genres step only the account's own genres.
   */
  async expectOptionsLoaded(step: Locator): Promise<void> {
    await expect(step).toBeVisible();
    await expect(step.getByRole("progressbar")).toHaveCount(0);
  }

  /** "3 selecionados" under a step's list. */
  selectionCount(step: Locator): Locator {
    return step.getByTestId("onboarding-selection-count");
  }

  /** The counter is hidden while nothing is selected. */
  async expectSelected(step: Locator, count: number): Promise<void> {
    if (count === 0) {
      await expect(this.selectionCount(step)).toBeHidden();
      return;
    }
    const key = count === 1 ? "onboarding.selectedCount_one" : "onboarding.selectedCount_other";
    await expect(this.selectionCount(step)).toHaveText(t(key, { count }));
  }
}
