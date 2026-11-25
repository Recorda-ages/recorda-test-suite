import path from "node:path";

import type { Page } from "@playwright/test";

/**
 * Song preview URL for Recordas made by tests. It is not a real host: `servePreview` answers
 * it with a second of silence (tests/fixtures/preview.mp3), so the player has something to
 * load and nothing reaches Deezer.
 *
 * Saved Recordas expose their preview as GET /music/tracks/{deezer id}/preview, which asks
 * Deezer for a fresh link; test Recordas have made-up track ids, so `servePreview` answers
 * that route with this URL too.
 */
export const PREVIEW_URL = "https://preview.e2e.recorda.test/preview.mp3";

const PREVIEW_MP3 = path.resolve(__dirname, "../../tests/fixtures/preview.mp3");

export async function servePreview(page: Page): Promise<void> {
  await page.route(PREVIEW_URL, (route) =>
    route.fulfill({ path: PREVIEW_MP3, contentType: "audio/mpeg" })
  );
  await page.route("**/api/v1/music/tracks/*/preview", (route) =>
    route.fulfill({ json: { preview_url: PREVIEW_URL } })
  );
}
