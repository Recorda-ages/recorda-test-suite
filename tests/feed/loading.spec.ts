import { signedOut } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import { uniqueId, type RecordaApi } from "../../src/support/api";

/**
 * FL-07: pages, loading and network errors. The feed asks for 20 Recordas per page
 * (GET /feed/{general|following}, then `?cursor=` for the next one). Pull-to-refresh
 * (RF-18.2) is a touch gesture and is left to native tests.
 */
const PAGE_SIZE = 20;
/** A later page of Seguindo (the first one has no cursor). */
const nextFollowingPage = (url: URL) =>
  url.pathname.endsWith("/feed/following") && url.searchParams.has("cursor");
const GENERAL_FEED = "**/api/v1/feed/general**";

/** A viewer following one account with more Recordas than fit on a page. */
async function longFeed(api: RecordaApi, label: string, count = PAGE_SIZE + 3) {
  const [viewer, author] = await Promise.all([
    api.createUser(`${label}-viewer`),
    api.createUser(`${label}-author`)
  ]);
  await api.follow(viewer, author);
  const ids: string[] = [];
  // One at a time, so the newest is the last one created.
  for (let n = 0; n < count; n++) {
    ids.push((await api.createRecorda(author, { description: `${label} ${n} ${uniqueId()}` })).recorda_id);
  }
  return { viewer, newestFirst: ids.reverse() };
}

test.describe("Feed loading", () => {
  test(
    "while the first page loads there is an indicator, and a failure offers to try again",
    meta({
      description:
        "Para Você shows Carregando feed... while its request is pending. When it fails, the " +
        "tab says the feed couldn't be loaded and offers Tentar novamente, which loads it.",
      requirement: ["RF-18.3", "RNF-05"]
    }),
    async ({ app, page, feedPage }) => {
      // gabriel (the default session) has Recordas on Para Você.
      let release!: () => void;
      const held = new Promise<void>((resolve) => (release = resolve));
      await page.route(GENERAL_FEED, async (route) => {
        await held;
        await route.fulfill({ status: 503, json: { detail: "E2E: feed unavailable" } });
      });

      await test.step("loading indicator while the request is pending", async () => {
        await app.launch();
        await expect(feedPage.loading("general")).toBeVisible();
      });

      await test.step("the failure offers to try again", async () => {
        release();
        // The app retries once by itself before showing the error.
        await expect(feedPage.loadError("general")).toBeVisible({ timeout: 15_000 });
        await expect(feedPage.retryButton("general")).toBeVisible();
      });

      await test.step("trying again loads the feed", async () => {
        await page.unroute(GENERAL_FEED);
        await feedPage.retryButton("general").click();
        await expect(feedPage.posts("general").first()).toBeVisible();
        await expect(feedPage.loadError("general")).toHaveCount(0);
      });
    }
  );

  test.describe("with a long feed", () => {
    test.use({ storageState: signedOut });

    test(
      "the next page loads near the end of the list, and its failure can be retried",
      meta({
        description:
          "Seguindo first asks for one page of 20 Recordas. Scrolling to the end asks for the " +
          "next page; when that fails, the end of the list says so, and Tentar novamente " +
          "brings in the remaining Recordas down to the oldest.",
        requirement: ["RF-18.1", "RF-18.3", "RNF-05"],
        tag: "@mutates"
      }),
      async ({ api, app, page, feedPage }) => {
        const { viewer, newestFirst } = await longFeed(api, "pages");
        const oldest = feedPage.post("following", newestFirst.at(-1)!);
        const firstPage = page.waitForResponse(
          (response) =>
            new URL(response.url()).pathname.endsWith("/feed/following") &&
            !nextFollowingPage(new URL(response.url()))
        );

        await test.step("one page at first", async () => {
          await app.launchAs(viewer);
          await feedPage.selectFeedTab("following");
          const { items, next_cursor } = (await (await firstPage).json()) as {
            items: unknown[];
            next_cursor: string | null;
          };
          expect(items).toHaveLength(PAGE_SIZE);
          expect(next_cursor).not.toBeNull();
          await expect(feedPage.post("following", newestFirst[0]!)).toBeVisible();
          await expect(oldest).toHaveCount(0);
        });

        await test.step("the next page fails near the end", async () => {
          await page.route(nextFollowingPage, (route) =>
            route.fulfill({ status: 503, json: { detail: "E2E: next page unavailable" } })
          );
          // The list renders cards in batches, so the end moves as it scrolls.
          await expect(async () => {
            await feedPage.scrollToEnd("following");
            await expect(feedPage.loadMoreError("following")).toBeVisible({ timeout: 2_000 });
          }).toPass({ timeout: 20_000 });
          await expect(oldest).toHaveCount(0);
        });

        await test.step("trying again brings the rest", async () => {
          await page.unroute(nextFollowingPage);
          await feedPage.retryButton("following").click();
          await expect(async () => {
            await feedPage.scrollToEnd("following");
            await expect(oldest).toBeVisible({ timeout: 2_000 });
          }).toPass({ timeout: 20_000 });
          await expect(feedPage.loadMoreError("following")).toHaveCount(0);
        });
      }
    );

    test(
      "switching tabs keeps each tab's scroll position",
      meta({
        description:
          "After scrolling down Seguindo, going to Para Você and back returns to the same " +
          "place in the list instead of the top.",
        requirement: "RF-18.4",
        tag: "@mutates"
      }),
      async ({ api, app, feedPage }) => {
        const { viewer, newestFirst } = await longFeed(api, "scroll", 8);
        await app.launchAs(viewer);
        await feedPage.selectFeedTab("following");
        await expect(feedPage.post("following", newestFirst[0]!)).toBeVisible();

        await feedPage.scrollDown("following", 900);
        await expect.poll(() => feedPage.scrollTop("following")).toBeGreaterThan(0);
        const position = await feedPage.scrollTop("following");

        await feedPage.selectFeedTab("general");
        await expect(feedPage.panel("general")).toBeInViewport();
        await feedPage.selectFeedTab("following");
        await expect(feedPage.panel("following")).toBeInViewport();
        expect(await feedPage.scrollTop("following")).toBe(position);
      }
    );
  });
});
