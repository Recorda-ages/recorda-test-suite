import { randomUUID } from "node:crypto";

import type { LoginResponse, RecordaApi } from "./api";

export type ModerationRecorda = {
  id: string;
  reportIds: string[];
  rowTestId: string;
};

export type ModerationData = {
  target: LoginResponse;
  recordas: [ModerationRecorda];
  reporters: [LoginResponse, LoginResponse];
  createSecondRecorda: () => Promise<ModerationRecorda>;
};

const PASSWORD = "E2E-moderation-password-2026";

export async function createModerationData(
  api: RecordaApi,
): Promise<ModerationData> {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 12);
  const target = await register(
    api,
    `e2e_target_${suffix}`,
    `E2E Moderation Target ${suffix}`,
  );
  const reporters = await Promise.all([
    register(api, `e2e_reporter_a_${suffix}`, "E2E Reporter A"),
    register(api, `e2e_reporter_b_${suffix}`, "E2E Reporter B"),
  ]);
  const createReportedRecorda = async (key: string) => {
    const { recorda_id: id } = await api.createRecorda(target.access_token, {
      media_url: `https://example.test/moderation/${suffix}-${key}.jpg`,
      media_type: "PHOTO",
      description: `E2E moderation fixture ${suffix} ${key}`,
      deezer_track_id: "3135556",
      song_title: `E2E moderation ${key}`,
      song_artist_name: "Recorda Test",
      song_cover_url: "",
      song_preview_url: null,
      song_genre_name: "Pop",
    });
    const reports = await Promise.all(
      reporters.map((reporter, reporterIndex) =>
        api.reportRecorda(
          reporter.access_token,
          id,
          `E2E report ${reporterIndex + 1} for ${key} ${suffix}`,
        ),
      ),
    );
    return {
      id,
      reportIds: reports.map((report) => report.report_id),
      rowTestId: `admin-report-row-RECORDA-${id}`,
    };
  };
  const firstRecorda = await createReportedRecorda("first");
  let secondRecorda: Promise<ModerationRecorda> | undefined;

  return {
    target,
    recordas: [firstRecorda],
    reporters,
    createSecondRecorda: () => {
      secondRecorda ??= createReportedRecorda("second");
      return secondRecorda;
    },
  };
}

async function register(api: RecordaApi, username: string, name: string) {
  return api.register({
    name,
    username,
    email: `${username}@example.test`,
    password: PASSWORD,
    language: "pt-BR",
  });
}
