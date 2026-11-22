import { env } from "../../src/config/env";
import { readFile } from "node:fs/promises";
import { recordas, seedVideoUrl } from "../../src/data/recordas";
import { expect, meta, test } from "../../src/fixtures";

// All tests use gabriel's saved session and read existing seed content only.
test.describe("Sharing a Recorda", () => {
  test(
    "recorda details open the sharing interface",
    meta({
      description:
        "The user opens their seeded photo from Profile and reaches the sharing screen through its details.",
      requirement: "RF-10.1",
    }),
    async ({ app, shareCardPage }) => {
      await test.step("open a saved photo and share it from details", async () => {
        await app.launch();
        const details = await app.goToRecorda(recordas.photo);
        await expect(details.shareButton).toBeVisible();
        await details.share();
        await shareCardPage.expectLoaded();
      });
    },
  );

  for (const kind of ["photo", "video"] as const) {
    for (const preset of ["light", "mint", "teal", "dark"]) {
      test(
        `${kind} exports a portrait PNG with the ${preset} preset`,
        meta({
          description:
            "A real browser download contains a decoded, nonempty PNG in Stories aspect ratio after selecting a preset.",
          requirement: ["RF-10.2", "RF-11.5"],
        }),
        async ({ app, page }, testInfo) => {
          await app.launch();
          const share = await app.goToShareCard(recordas[kind]);
          await expect(share.downloadButton).toBeEnabled();
          await test.step("choose a preset and download the generated card", async () => {
            await share.selectPreset(preset);
            const download = await share.download();
            expect(await download.failure()).toBeNull();
            expect(download.suggestedFilename()).toBe("recorda-card.png");
            const saved = testInfo.outputPath(`${kind}-${preset}.png`);
            await download.saveAs(saved);
            const png = await readFile(saved);
            expect([...png.subarray(0, 8)]).toEqual([
              137, 80, 78, 71, 13, 10, 26, 10,
            ]);
            const dimensions = await page.evaluate(async (data) => {
              const response = await fetch(`data:image/png;base64,${data}`);
              const bitmap = await createImageBitmap(await response.blob());
              const size = { width: bitmap.width, height: bitmap.height };
              bitmap.close();
              return size;
            }, png.toString("base64"));
            expect(dimensions.width).toBeGreaterThan(0);
            expect(dimensions.height).toBeGreaterThan(dimensions.width);
            expect(dimensions.width * 16).toBe(dimensions.height * 9);
            await testInfo.attach("exported card", {
              path: saved,
              contentType: "image/png",
            });
          });
        },
      );
    }
  }

  test(
    "video sharing displays the first frame as a static image",
    meta({
      description:
        "The preview is compared with an independently decoded first frame of the real seeded video, and the download is a still PNG, not a video.",
      requirement: "RF-10.4",
    }),
    async ({ app, page }, testInfo) => {
      await app.launch();
      const share = await app.goToShareCard(recordas.video);
      await expect(share.downloadButton).toBeEnabled();
      await expect(share.media).toBeVisible();
      const comparison = await share.media.evaluate(async (element, url) => {
        const image =
          element instanceof HTMLImageElement
            ? element
            : element.querySelector("img");
        if (!image) throw new Error("Static preview image is missing");
        await image.decode();
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.muted = true;
        try {
          await new Promise<void>((resolve, reject) => {
            video.requestVideoFrameCallback(() => resolve());
            video.onerror = () =>
              reject(new Error("Seed video could not be decoded"));
            video.src = url;
            video.load();
          });
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas unavailable");
          context.drawImage(video, 0, 0);
          const expected = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          ).data;
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0);
          const actual = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          ).data;
          let difference = 0;
          for (let i = 0; i < actual.length; i++)
            difference += Math.abs(actual[i]! - expected[i]!);
          return {
            source: image.currentSrc,
            difference: difference / actual.length,
            width: image.naturalWidth,
            height: image.naturalHeight,
            expectedWidth: video.videoWidth,
            expectedHeight: video.videoHeight,
          };
        } finally {
          video.removeAttribute("src");
          video.load();
        }
      }, seedVideoUrl);
      expect(comparison.source).toMatch(/^data:image\/png/);
      expect(comparison.width).toBe(comparison.expectedWidth);
      expect(comparison.height).toBe(comparison.expectedHeight);
      expect(comparison.difference).toBeLessThan(1);
      await test.step("the downloaded card is a still PNG", async () => {
        const download = await share.download();
        expect(download.suggestedFilename()).toBe("recorda-card.png");
        const png = await readFile(await download.path());
        expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
      });
    },
  );

  test(
    "the exported video card shows the first frame cropped, not stretched",
    meta({
      description:
        "The media region of the downloaded PNG matches the seeded video's first frame laid out like the preview (cover), and not a later frame.",
      requirement: "RF-10.4",
    }),
    async ({ app, page }, testInfo) => {
      await app.launch();
      const share = await app.goToShareCard(recordas.video);
      await expect(share.downloadButton).toBeEnabled();
      // RF-10.4 (gap): the web capture (html2canvas-pro) ignores contentFit="cover" and
      // stretches non-portrait media to fill the card. Remove test.fail() once it crops.
      test.fail();
      await test.step("verify the first frame inside the exported PNG", async () => {
        const canvasBox = await share.exportCanvas.boundingBox();
        const mediaBox = await share.exportMedia.boundingBox();
        expect(canvasBox).not.toBeNull();
        expect(mediaBox).not.toBeNull();
        const download = await share.download();
        const saved = testInfo.outputPath("video-first-frame.png");
        await download.saveAs(saved);
        const png = await readFile(saved);
        const { firstFrame, laterFrame } = await page.evaluate(
          async ({ data, url, canvasBox, mediaBox }) => {
            const exported = await createImageBitmap(
              await (await fetch(`data:image/png;base64,${data}`)).blob(),
            );
            const video = document.createElement("video");
            video.crossOrigin = "anonymous";
            video.muted = true;
            const GRID = 8;
            const scale = exported.width / canvasBox.width;
            const width = Math.round(mediaBox.width * scale);
            const height = Math.round(mediaBox.height * scale);
            // An interior region below the song label and above the logo and bottom
            // gradient: only media pixels, no cover, text or border.
            const region = {
              x: Math.round(width * 0.25),
              y: Math.round(height * 0.3),
              w: Math.round(width * 0.5),
              h: Math.round(height * 0.3),
            };
            /** Averages `source`'s region into a GRID×GRID thumbnail. */
            const thumbnail = (source: CanvasImageSource, sx: number, sy: number) => {
              const small = document.createElement("canvas");
              small.width = GRID;
              small.height = GRID;
              const context = small.getContext("2d")!;
              context.imageSmoothingQuality = "high";
              context.drawImage(source, sx, sy, region.w, region.h, 0, 0, GRID, GRID);
              return context.getImageData(0, 0, GRID, GRID).data;
            };
            /** The video frame at `time`, laid out like the card (cover-fit in the media box). */
            const frameAt = async (time: number) => {
              await new Promise<void>((resolve, reject) => {
                video.onerror = () => reject(new Error("Seed video could not be decoded"));
                if (time === 0) {
                  video.requestVideoFrameCallback(() => resolve());
                  video.src = url;
                  video.load();
                } else {
                  video.onseeked = () => resolve();
                  video.currentTime = time;
                }
              });
              const canvas = document.createElement("canvas");
              canvas.width = width;
              canvas.height = height;
              const fit = Math.max(width / video.videoWidth, height / video.videoHeight);
              canvas
                .getContext("2d")!
                .drawImage(
                  video,
                  (width - video.videoWidth * fit) / 2,
                  (height - video.videoHeight * fit) / 2,
                  video.videoWidth * fit,
                  video.videoHeight * fit,
                );
              return thumbnail(canvas, region.x, region.y);
            };
            const distance = (a: Uint8ClampedArray, b: Uint8ClampedArray) => {
              let total = 0;
              for (let i = 0; i < a.length; i++) total += Math.abs(a[i]! - b[i]!);
              return total / a.length;
            };
            try {
              const actual = thumbnail(
                exported,
                Math.round((mediaBox.x - canvasBox.x) * scale) + region.x,
                Math.round((mediaBox.y - canvasBox.y) * scale) + region.y,
              );
              const first = await frameAt(0);
              const later = await frameAt(Math.min(3, video.duration / 2));
              return { firstFrame: distance(actual, first), laterFrame: distance(actual, later) };
            } finally {
              exported.close();
              video.removeAttribute("src");
              video.load();
            }
          },
          {
            data: png.toString("base64"),
            url: seedVideoUrl,
            canvasBox: canvasBox!,
            mediaBox: mediaBox!,
          },
        );
        // Coarse thumbnails absorb resampling and sub-pixel offsets; a blank card, the
        // wrong media or a later frame does not match.
        expect(firstFrame).toBeLessThan(12);
        expect(firstFrame * 2).toBeLessThan(laterFrame);
        await testInfo.attach("exported first frame", {
          path: saved,
          contentType: "image/png",
        });
      });
    },
  );

  test(
    "video card generation shows progress and stays on the device",
    meta({
      description:
        "Both thumbnail preparation and final PNG capture show progress. The actual browser export completes without contacting the backend for processing.",
      requirement: "RF-10.5",
    }),
    async ({ app, page, shareCardPage }) => {
      await app.launch();
      const details = await app.goToRecorda(recordas.video);
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const writes: string[] = [];
      const observe = (request: import("@playwright/test").Request) => {
        if (!["GET", "HEAD", "OPTIONS"].includes(request.method()))
          writes.push(request.url());
      };
      page.on("request", observe);
      await page.route(seedVideoUrl, async (route) => {
        const response = await route.fetch();
        await gate;
        await route.fulfill({ response });
      });
      try {
        await details.share();
        const share = shareCardPage;
        await share.expectLoaded();
        await expect(share.mediaProgress).toBeVisible();
        await expect(share.downloadButton).toBeDisabled();
        release();
        await expect(share.mediaProgress).toBeHidden();
        await expect(share.media).toBeVisible();
        await expect(share.downloadButton).toBeEnabled();
        await test.step("capture the final card locally with visible progress", async () => {
          await page.clock.install();
          await page.clock.pauseAt(new Date());
          const apiCalls: string[] = [];
          const observeApi = (request: import("@playwright/test").Request) => {
            if (request.url().startsWith(env.apiURL))
              apiCalls.push(request.url());
          };
          page.on("request", observeApi);
          // The real capture waits for a short rendering timer. Freezing that timer
          // exposes its progress state without replacing the renderer or its result.
          const downloaded = share.download({ force: true });
          try {
            await expect(share.exportProgress).toBeVisible();
            await expect(share.downloadButton).toBeDisabled();
            await expect(share.storiesButton).toBeDisabled();
            await page.clock.resume();
            const result = await downloaded;
            expect(await result.failure()).toBeNull();
            await expect(share.exportProgress).toBeHidden();
            await expect(share.downloadButton).toBeEnabled();
            expect(apiCalls).toEqual([]);
            expect(writes).toEqual([]);
          } finally {
            await page.clock.resume();
            await downloaded.catch(() => {});
            page.off("request", observeApi);
          }
        });
      } finally {
        release();
        page.off("request", observe);
      }
    },
  );

  test(
    "presets form a horizontal scrollable list below the card",
    meta({
      description:
        "The selector is positioned below the preview and remains horizontally scrollable when a narrow viewport creates overflow.",
      requirement: "RF-11.1",
    }),
    async ({ app, page }) => {
      await app.launch();
      const share = await app.goToShareCard(recordas.photo);
      const card = await share.card.boundingBox();
      const list = await share.presets.boundingBox();
      expect(card).not.toBeNull();
      expect(list).not.toBeNull();
      expect(list!.y).toBeGreaterThanOrEqual(card!.y + card!.height);
      await page.setViewportSize({ width: 180, height: 851 });
      const scrolling = await share.presets.evaluate((element) => {
        element.scrollLeft = element.scrollWidth;
        return {
          offset: element.scrollLeft,
          overflow: getComputedStyle(element).overflowX,
        };
      });
      expect(["auto", "scroll"]).toContain(scrolling.overflow);
      expect(scrolling.offset).toBeGreaterThan(0);
    },
  );

  test(
    "exactly three predefined presets are offered",
    meta({
      description:
        "The selector must offer exactly three styles, as required by US 11; the current frontend offers four.",
      requirement: "RF-11.2",
    }),
    async ({ app }) => {
      await app.launch();
      const share = await app.goToShareCard(recordas.photo);
      await expect(share.options.first()).toBeVisible();
      // RF-11.2: the frontend currently offers light, mint, teal and dark.
      test.fail();
      await expect(share.options).toHaveCount(3);
    },
  );

  test(
    "selecting a preset immediately changes the visible card",
    meta({
      description:
        "Changing styles updates both the selected radio and the rendered card without leaving the sharing screen.",
      requirement: ["RF-11.2", "RF-11.4"],
    }),
    async ({ app, page }) => {
      await app.launch();
      const share = await app.goToShareCard(recordas.photo);
      await expect(share.downloadButton).toBeEnabled();
      await share.card.evaluate(async (element) => {
        await Promise.all(
          Array.from(element.querySelectorAll("img"), (image) =>
            image.decode(),
          ),
        );
        await document.fonts.ready;
      });
      await share.selectPreset("teal");
      const bounds = await share.card.boundingBox();
      expect(bounds).not.toBeNull();
      // A small strip at the top center contains only the preset gradient.
      const clip = {
        x: bounds!.x + bounds!.width / 2 - 10,
        y: bounds!.y + 10,
        width: 20,
        height: 12,
      };
      const background = () => page.screenshot({ clip });
      const before = await background();
      await share.selectPreset("dark");
      await expect(share.preset("dark")).toBeChecked();
      await expect(share.preset("teal")).not.toBeChecked();
      await expect
        .poll(async () => (await background()).equals(before))
        .toBe(false);
    },
  );

  test(
    "sharing offers Instagram Stories and image download actions",
    meta({
      description:
        "After opening the card from Recorda details, both export actions are visible and available; native integrations remain outside this suite.",
      requirement: "RF-12.1",
    }),
    async ({ app }) => {
      await app.launch();
      const share = await app.goToShareCard(recordas.photo);
      await expect(share.storiesButton).toBeVisible();
      await expect(share.downloadButton).toBeVisible();
      await expect(share.storiesButton).toBeEnabled();
      await expect(share.downloadButton).toBeEnabled();
    },
  );
});
