import { expect, type APIRequestContext } from "@playwright/test";

import { env } from "../config/env";
import type { TestUser } from "../data/users";

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user: {
    user_id: string;
    name: string;
    username: string;
    role: string;
    onboarding_completed: boolean;
    language: string;
  };
};

export type RecordaCreate = {
  media_url: string;
  media_type: "PHOTO" | "VIDEO";
  description: string;
  deezer_track_id: string;
  song_title: string;
  song_artist_name: string;
  song_cover_url: string;
  song_preview_url: string | null;
  song_genre_name: string;
};

export type ReportStatus = "OPEN" | "RESOLVED" | "DISMISSED";

/**
 * Thin client for the Recorda backend, used to arrange state and to verify side effects
 * without going through the UI. Keep it to what tests need; it is not an SDK.
 */
export class RecordaApi {
  constructor(private readonly request: APIRequestContext) {}

  async health(): Promise<void> {
    const response = await this.request.get("/api/v1/health");
    expect(response, "Backend health check failed").toBeOK();
  }

  async login(
    user: Pick<TestUser, "username" | "password">,
  ): Promise<LoginResponse> {
    const response = await this.request.post("/api/v1/auth/login", {
      data: { username: user.username, password: user.password },
    });
    expect(
      response,
      `Login failed for "${user.username}". Did you run the seed?`,
    ).toBeOK();
    return (await response.json()) as LoginResponse;
  }

  /** Creates a brand-new account. Use for tests that mutate the user. */
  async register(data: {
    name: string;
    username: string;
    email: string;
    password: string;
    language?: "pt-BR" | "en" | "es";
  }): Promise<LoginResponse> {
    if (!env.isLocalApi) {
      throw new Error(
        "register() would create a user on the shared deployed backend. Tag the test " +
          "`@mutates` so it only runs against the local stack.",
      );
    }
    const response = await this.request.post("/api/v1/auth/register", { data });
    expect(response, `Could not register "${data.username}"`).toBeOK();
    return (await response.json()) as LoginResponse;
  }

  async createRecorda(
    accessToken: string,
    data: RecordaCreate,
  ): Promise<{ recorda_id: string }> {
    this.assertLocalMutation("create a Recorda");
    const response = await this.request.post("/api/v1/recordas", {
      data,
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(response, "Could not create the moderation test Recorda").toBeOK();
    return (await response.json()) as { recorda_id: string };
  }

  async reportRecorda(
    accessToken: string,
    recordaId: string,
    description: string,
  ): Promise<{ report_id: string }> {
    this.assertLocalMutation("create a report");
    const response = await this.request.post(
      `/api/v1/recordas/${recordaId}/reports`,
      {
        data: { description },
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    expect(response, `Could not report Recorda "${recordaId}"`).toBeOK();
    return (await response.json()) as { report_id: string };
  }

  async changeReportStatus(
    accessToken: string,
    recordaId: string,
    status: ReportStatus,
    reason: string,
  ): Promise<void> {
    this.assertLocalMutation("change a report status");
    const response = await this.request.patch(
      `/api/v1/admin/reports/RECORDA/${recordaId}/status`,
      {
        data: { reason, status },
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    expect(
      response,
      `Could not change reports for Recorda "${recordaId}"`,
    ).toBeOK();
  }

  async recordaStatus(accessToken: string, recordaId: string): Promise<number> {
    const response = await this.request.get(`/api/v1/recordas/${recordaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.status();
  }

  async recordaCommentsStatus(
    accessToken: string,
    recordaId: string,
  ): Promise<number> {
    const response = await this.request.get(
      `/api/v1/recordas/${recordaId}/comments`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    return response.status();
  }

  private assertLocalMutation(action: string): void {
    if (!env.isLocalApi) {
      throw new Error(
        `Cannot ${action} on a shared backend. Tag the test \`@mutates\` so it only runs locally.`,
      );
    }
  }
}
