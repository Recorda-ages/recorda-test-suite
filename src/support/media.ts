import path from "node:path";

import type { Page } from "@playwright/test";

/**
 * Song preview URL for Recordas made by tests. It is not a real host: `servePreview` answers
 * it with a second of silence (tests/fixtures/preview.mp3), so the player has something to
 * load and nothing reaches Deezer.
 */
export const PREVIEW_URL = "https://preview.e2e.recorda.test/preview.mp3";

const PREVIEW_MP3 = path.resolve(__dirname, "../../tests/fixtures/preview.mp3");

export async function servePreview(page: Page): Promise<void> {
  await page.route(PREVIEW_URL, (route) =>
    route.fulfill({ path: PREVIEW_MP3, contentType: "audio/mpeg" })
  );
}
