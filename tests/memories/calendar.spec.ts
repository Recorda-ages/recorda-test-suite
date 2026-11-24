import { signedOut } from "../../src/data/users";
import { expect, meta, test } from "../../src/fixtures";
import { monthTitle, todayInSaoPaulo } from "../../src/pages";
import { uniqueId, type RecordaApi } from "../../src/support/api";
import { t } from "../../src/support/i18n";
import { PREVIEW_URL, servePreview } from "../../src/support/media";

/**
 * FL-13: the Calendário tab of the own profile. Recordas made by a test are dated today, so
 * the tests that need several days use gabriel's seeded Recordas instead (14 and 7 Feb 2026,
 * in São Paulo). Swiping between a day's Recordas (RF-37.9) is a touch gesture and is left
 * to native tests.
 */
const today = todayInSaoPaulo();

/** The previous month of `year`/`month`. */
function previous(year: number, month: number) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

/** A day of this month other than today. */
const otherDay = `${today.iso.slice(0, 8)}${String(today.day === 1 ? 2 : 1).padStart(2, "0")}`;

/** "HH:mm" of a timestamp in São Paulo. */
function saoPauloTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(new Date(iso.endsWith("Z") || iso.includes("+") ? iso : `${iso}Z`));
}

/** A new account with `count` Recordas published today, oldest first. */
async function postedToday(api: RecordaApi, label: string, count: number) {
  const account = await api.createUser(label);
  const captions: string[] = [];
  const ids: string[] = [];
  const times: string[] = [];
  for (let n = 0; n < count; n++) {
    const caption = `${label} memory ${n + 1} ${uniqueId()}`;
    captions.push(caption);
    const recorda = await api.createRecorda(account, {
      description: caption,
      songTitle: `${label} song ${n + 1}`,
      songArtist: "Calendar Artist",
      songPreviewUrl: PREVIEW_URL
    });
    ids.push(recorda.recorda_id);
    times.push(saoPauloTime(recorda.created_at));
  }
  return { account, captions, ids, times };
}

test.describe("Memory calendar", () => {
  test.describe("with Recordas published today", () => {
    test.use({ storageState: signedOut });

    test(
      "the month grid runs Sunday to Saturday and marks today's Recordas",
      meta({
        description:
          "The calendar opens on the current month in São Paulo, with seven weekday columns " +
          "from Sunday to Saturday. Today shows the thumbnail of its first Recorda and +2 for " +
          "the other two; a day without Recordas is a plain dark cell that can't be opened.",
        requirement: ["RF-37.1", "RF-37.2", "RF-37.4", "RF-37.5"],
        tag: "@mutates"
      }),
      async ({ api, app, profilePage }) => {
        const { account } = await postedToday(api, "grid", 3);
        const { calendar } = profilePage;

        await app.launchAs(account);
        await app.goToProfile();
        await profilePage.details.selectTab("calendar");

        await test.step("current month, Sunday to Saturday", async () => {
          await expect(calendar.title).toHaveText(monthTitle(today.year, today.month));
          await expect(calendar.weekdays).toHaveCount(7);
          await expect(calendar.weekdays.first()).toHaveAccessibleName("domingo");
          await expect(calendar.weekdays.last()).toHaveAccessibleName("sábado");
          await expect(calendar.summary).toHaveText(
            t("memoriesCalendar.grid.summary", {
              memories: t("memoriesCalendar.grid.memories", { count: 3 }),
              days: t("memoriesCalendar.grid.days", { count: 1 })
            })
          );
        });

        await test.step("today: thumbnail and +2", async () => {
          await expect(calendar.day(today.iso)).toHaveRole("button");
          await expect(calendar.thumbnail(today.iso)).toBeVisible();
          await expect(calendar.badge(today.iso)).toHaveText(
            t("memoriesCalendar.grid.extraMemories", { extra: 2 })
          );
        });

        await test.step("a day without Recordas has no thumbnail", async () => {
          await expect(calendar.day(otherDay)).toBeVisible();
          await expect(calendar.day(otherDay)).not.toHaveRole("button");
          await expect(calendar.thumbnail(otherDay)).toHaveCount(0);
          await expect(calendar.badge(otherDay)).toHaveCount(0);
        });
      }
    );

    test(
      "the header moves between months",
      meta({
        description:
          "The previous-month arrow shows last month's grid, without today's Recordas, and " +
          "the next-month arrow comes back to them.",
        requirement: "RF-37.6",
        tag: "@mutates"
      }),
      async ({ api, app, profilePage }) => {
        const { account } = await postedToday(api, "months", 1);
        const { calendar } = profilePage;
        const last = previous(today.year, today.month);

        await app.launchAs(account);
        await app.goToProfile();
        await profilePage.details.selectTab("calendar");
        await expect(calendar.thumbnail(today.iso)).toBeVisible();

        await calendar.previousMonth.click();
        await expect(calendar.title).toHaveText(monthTitle(last.year, last.month));
        await expect(calendar.summary).toHaveText(t("memoriesCalendar.grid.summaryEmpty"));
        await expect(calendar.thumbnail(today.iso)).toHaveCount(0);

        await calendar.nextMonth.click();
        await expect(calendar.title).toHaveText(monthTitle(today.year, today.month));
        await expect(calendar.thumbnail(today.iso)).toBeVisible();
      }
    );

    test(
      "a day opens full screen with time, caption and the song, and closes back to the grid",
      meta({
        description:
          "Tapping today opens the day viewer on its first Recorda, with one segment per " +
          "Recorda, the São Paulo time it was published and the caption, and the song pill " +
          "playing the preview, with a button to pause and resume it. The X closes it, back on " +
          "the same month's grid.",
        requirement: ["RF-37.7", "RF-37.8", "RF-37.10", "RF-37.12"],
        tag: "@mutates"
      }),
      async ({ api, app, page, profilePage, dayViewer }) => {
        const { account, captions, ids, times } = await postedToday(api, "viewer", 2);
        const { calendar } = profilePage;
        await servePreview(page);

        await app.launchAs(account);
        await app.goToProfile();
        await profilePage.details.selectTab("calendar");
        await calendar.day(today.iso).click();

        await test.step("the first Recorda, with its time and caption", async () => {
          await expect(dayViewer.root).toBeVisible();
          await expect(dayViewer.segments).toHaveCount(2);
          const slide = dayViewer.slide(ids[0]!);
          await expect(slide).toContainText(captions[0]!);
          await expect(slide).toContainText(times[0]!);
        });

        await test.step("the song pill plays the preview and its button pauses it", async () => {
          const { musicToggle } = dayViewer;
          await expect(dayViewer.musicPill).toContainText("viewer song 1");
          await expect(musicToggle).toBeEnabled();
          await expect(musicToggle).toHaveAccessibleName(t("memoriesCalendar.viewer.pause"));
          await musicToggle.click();
          await expect(musicToggle).toHaveAccessibleName(t("memoriesCalendar.viewer.play"));
          await musicToggle.click();
          await expect(musicToggle).toHaveAccessibleName(t("memoriesCalendar.viewer.pause"));
        });

        await test.step("X closes back to the grid", async () => {
          await dayViewer.closeButton.click();
          await expect(dayViewer.root).toBeHidden();
          await expect(calendar.title).toHaveText(monthTitle(today.year, today.month));
          await expect(calendar.day(today.iso)).toBeVisible();
        });
      }
    );

    test(
      "a month without Recordas says so",
      meta({
        description:
          "A new account's calendar has no active day and the header says there are no " +
          "memories this month.",
        requirement: "RF-37.13",
        tag: "@mutates"
      }),
      async ({ app, profilePage, newAccount }) => {
        await app.launchAs(newAccount);
        await app.goToProfile();
        await profilePage.details.selectTab("calendar");
        await expect(profilePage.calendar.summary).toHaveText(
          t("memoriesCalendar.grid.summaryEmpty")
        );
        await expect(profilePage.calendar.day(today.iso)).not.toHaveRole("button");
      }
    );

    test(
      "a month without Recordas invites to publish one",
      meta({
        description:
          "The empty calendar offers a way to create a Recorda, as US 37 asks, like the " +
          "empty Métricas tab does.",
        requirement: "RF-37.13",
        tag: "@mutates"
      }),
      async ({ app, profilePage, newAccount }) => {
        // RF-37.13 (gap): the empty calendar only says "Nenhuma memória neste mês".
        test.fail();
        await app.launchAs(newAccount);
        await app.goToProfile();
        await profilePage.details.selectTab("calendar");
        await expect(profilePage.calendar.summary).toBeVisible();
        await expect(
          profilePage.root.getByRole("button", { name: t("memoriesMetrics.create") })
        ).toBeVisible({ timeout: 3_000 });
      }
    );
  });

  test(
    "the viewer goes to the previous and next day with memories",
    meta({
      description:
        "On gabriel's 14 Feb 2026 Recorda, tapping the left side goes to the previous day " +
        "with memories (7 Feb) without closing the viewer, and the right side comes back.",
      requirement: "RF-37.11"
    }),
    async ({ app, profilePage, dayViewer }) => {
      // Seeded: gabriel-trilha on 14 Feb 2026, gabriel-viagem on 7 Feb 2026.
      const trail = "Uma trilha, uma vista incrível e a música certa.";
      const trip = "Alguns segundos de uma viagem que merece ser lembrada.";
      await app.launch();
      await app.goToProfile();
      await profilePage.details.selectTab("calendar");
      await profilePage.calendar.goToMonth(2026, 2);
      await profilePage.calendar.day("2026-02-14").click();

      await expect(dayViewer.slideWith(trail)).toBeVisible();
      await dayViewer.tap("previous");
      await expect(dayViewer.slideWith(trip)).toBeVisible();
      await expect(dayViewer.root).toBeVisible();
      await dayViewer.tap("next");
      await expect(dayViewer.slideWith(trail)).toBeVisible();
    }
  );
});
