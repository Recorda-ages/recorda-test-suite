import { expect, type Locator, type Page } from "@playwright/test";

import { t } from "../support/i18n";

/** "Criar Recorda": the camera, opened from the bottom bar. */
export class CameraStep {
  readonly root: Locator;
  /** The viewfinder. */
  readonly stage: Locator;
  readonly captureButton: Locator;
  readonly galleryButton: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("camera-screen");
    this.stage = this.root.getByTestId("camera-stage");
    this.captureButton = this.root.getByTestId("camera-capture-button");
    this.galleryButton = this.root.getByTestId("camera-gallery-button");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }
}

/** The picked or captured media, before choosing the song. */
export class MediaPreviewStep {
  readonly root: Locator;
  readonly confirmButton: Locator;
  readonly discardButton: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("preview-screen");
    this.confirmButton = this.root.getByTestId("preview-confirm-button");
    this.discardButton = this.root.getByTestId("preview-discard-button");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }
}

/** "Música": Deezer search; each result is a radio named "<title>, <artist>". */
export class MusicSearchStep {
  readonly root: Locator;
  readonly search: Locator;
  readonly results: Locator;
  readonly hint: Locator;
  readonly error: Locator;
  readonly retryButton: Locator;
  readonly nextButton: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("recorda-music-screen");
    this.search = this.root.getByLabel(t("recordaMusic.search"), { exact: true });
    this.results = this.root.getByRole("radio");
    this.hint = this.root.getByText(t("recordaMusic.hint"), { exact: true });
    this.error = this.root.getByText(t("recordaMusic.searchError"), { exact: true });
    this.retryButton = this.root.getByRole("button", {
      name: t("recordaMusic.retry"),
      exact: true
    });
    this.nextButton = this.root.getByTestId("recorda-music-next-button");
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  result(title: string, artist: string): Locator {
    return this.root.getByRole("radio", { name: `${title}, ${artist}`, exact: true });
  }
}

/** The last step: media with the song over it, description, mentions and Publicar. */
export class RecordaComposerStep {
  readonly root: Locator;
  readonly media: Locator;
  readonly songCover: Locator;
  readonly description: Locator;
  readonly mentionSearch: Locator;
  readonly publishButton: Locator;
  readonly publishError: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("recorda-details-screen");
    this.media = this.root.getByTestId("recorda-details-media");
    this.songCover = this.root.getByTestId("recorda-details-song-cover");
    this.description = this.root.getByLabel(t("recordaDetails.descriptionLabel"), {
      exact: true
    });
    this.mentionSearch = this.root.getByLabel(t("recordaDetails.mentions.search"), {
      exact: true
    });
    // Its label follows the upload: Publicar → Enviando mídia... → Publicando... / Tentar novamente.
    this.publishButton = this.root.getByRole("button", {
      name: new RegExp(
        [
          "recordaDetails.publish",
          "recordaDetails.publishUploading",
          "recordaDetails.publishCreating",
          "recordaDetails.publishRetry"
        ]
          .map((key) => `^${t(key).replace(/\./g, "\\.")}$`)
          .join("|")
      )
    });
    this.publishError = this.root.getByTestId("recorda-publish-error");
    this.backButton = this.root.getByRole("button", {
      name: t("recordaDetails.back"),
      exact: true
    });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  /** "Marcar amigos (N)": opens the list of followed people; N is how many are marked. */
  mentionsButton(count: number): Locator {
    return this.root.getByRole("button", {
      name: t("recordaDetails.mentions.label", { count }),
      exact: true
    });
  }

  /** A followed person in the mention list (a checkbox named "@username"). */
  mentionOption(username: string): Locator {
    return this.root.getByRole("checkbox", { name: `@${username}`, exact: true });
  }
}

/** The steps of creating a Recorda, in order. */
export class CreateRecordaPage {
  readonly camera: CameraStep;
  readonly preview: MediaPreviewStep;
  readonly music: MusicSearchStep;
  readonly composer: RecordaComposerStep;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.camera = new CameraStep(page);
    this.preview = new MediaPreviewStep(page);
    this.music = new MusicSearchStep(page);
    this.composer = new RecordaComposerStep(page);
  }

  /** Picks `file` with the gallery button (on web, a file input) and confirms the preview. */
  async pickFromGallery(file: string): Promise<void> {
    const chooser = this.page.waitForEvent("filechooser");
    await this.camera.galleryButton.click();
    await (await chooser).setFiles(file);
    await this.preview.expectLoaded();
    await this.preview.confirmButton.click();
    await this.music.expectLoaded();
  }

  /** Searches, picks the result and goes on to the composer. */
  async chooseSong(query: string, title: string, artist: string): Promise<void> {
    await this.music.search.fill(query);
    await this.music.result(title, artist).click();
    await this.music.nextButton.click();
    await this.composer.expectLoaded();
  }
}
