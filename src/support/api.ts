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

/** Notification kinds, as `GET /api/v1/notifications` returns them. */
export type NotificationType =
  | "COMMENT"
  | "CONTENT_REMOVED"
  | "FOLLOW_ACCEPTED"
  | "FOLLOW_REQUEST"
  | "LIKE"
  | "MENTION"
  | "NEW_FOLLOWER";

export type NotificationPage = {
  items: {
    notification_id: string;
    type: NotificationType;
    is_read: boolean;
    follow_id: string | null;
    recorda_id: string | null;
    sender: { user_id: string; username: string } | null;
  }[];
  unread_count: number;
};

/** Smallest valid PNG (1×1), enough for the backend's media upload. */
const PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

/**
 * Thin client for the Recorda backend, used to arrange state and to verify side effects
 * without going through the UI. Keep it to what tests need; it is not an SDK.
 *
 * Calls made on behalf of a user take that user's `LoginResponse` (from `login` or
 * `register`) as the first argument.
 */
export class RecordaApi {
  constructor(private readonly request: APIRequestContext) {}

  async health(): Promise<void> {
    const response = await this.request.get("/api/v1/health");
    expect(response, "Backend health check failed").toBeOK();
  }

  async login(user: Pick<TestUser, "username" | "password">): Promise<LoginResponse> {
    const response = await this.request.post("/api/v1/auth/login", {
      data: { username: user.username, password: user.password }
    });
    expect(response, `Login failed for "${user.username}". Did you run the seed?`).toBeOK();
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
    this.assertLocal("register()", "create a user");
    const response = await this.request.post("/api/v1/auth/register", { data });
    expect(response, `Could not register "${data.username}"`).toBeOK();
    return (await response.json()) as LoginResponse;
  }

  /** Saves a minimal music selection, so the account lands on the Feed instead of onboarding. */
  async completeOnboarding(as: LoginResponse): Promise<void> {
    this.assertLocal("completeOnboarding()", "change a user");
    const items = (names: string[]) => names.map((name, i) => ({ deezer_id: i + 1, name }));
    const response = await this.request.post("/api/v1/users/me/music-preferences", {
      headers: this.auth(as),
      data: {
        genres: items(["Pop", "Rock", "Jazz"]),
        artists: items(["Artist A", "Artist B", "Artist C"]),
        favorite_track: { deezer_id: 1, title: "Song", artist_name: "Artist A" }
      }
    });
    expect(response, `Could not complete onboarding of "${as.user.username}"`).toBeOK();
  }

  async setPrivate(as: LoginResponse, isPrivate: boolean): Promise<void> {
    this.assertLocal("setPrivate()", "change a user");
    const response = await this.request.patch("/api/v1/users/me/settings", {
      headers: this.auth(as),
      data: { is_private: isPrivate }
    });
    expect(response, `Could not change privacy of "${as.user.username}"`).toBeOK();
  }

  /** Follows `userId`; a private account gets a request instead ("solicitado"). */
  async follow(as: LoginResponse, userId: string): Promise<"seguindo" | "solicitado"> {
    this.assertLocal("follow()", "create a follow");
    const response = await this.request.post(`/api/v1/users/${userId}/follow`, {
      headers: this.auth(as)
    });
    expect(response, `"${as.user.username}" could not follow ${userId}`).toBeOK();
    return ((await response.json()) as { follow_status: "seguindo" | "solicitado" }).follow_status;
  }

  async respondToFollowRequest(
    as: LoginResponse,
    followId: string,
    action: "accept" | "decline"
  ): Promise<void> {
    this.assertLocal("respondToFollowRequest()", "change a follow");
    const response = await this.request.patch(`/api/v1/follow-requests/${followId}`, {
      headers: this.auth(as),
      data: { action }
    });
    expect(response, `Could not ${action} follow request ${followId}`).toBeOK();
  }

  /** Usernames of the accepted followers of `userId`, as seen by `as`. */
  async followers(as: LoginResponse, userId: string): Promise<string[]> {
    const response = await this.request.get(`/api/v1/users/${userId}/followers`, {
      headers: this.auth(as)
    });
    expect(response, `Could not list followers of ${userId}`).toBeOK();
    return ((await response.json()) as { username: string }[]).map((user) => user.username);
  }

  /** Publishes a photo Recorda (1×1 PNG, fixed song) and returns its id. */
  async createRecorda(
    as: LoginResponse,
    data: { description: string; mentionedUserIds?: string[] }
  ): Promise<string> {
    this.assertLocal("createRecorda()", "publish a Recorda");
    const upload = await this.request.post("/api/v1/recordas/media", {
      headers: this.auth(as),
      multipart: { file: { name: "pixel.png", mimeType: "image/png", buffer: PIXEL_PNG } }
    });
    expect(upload, "Could not upload the Recorda media").toBeOK();
    const { url } = (await upload.json()) as { url: string };

    const response = await this.request.post("/api/v1/recordas", {
      headers: this.auth(as),
      data: {
        media_url: url,
        media_type: "PHOTO",
        description: data.description,
        deezer_track_id: "3135556",
        song_title: "Harder, Better, Faster, Stronger",
        song_artist_name: "Daft Punk",
        // Given, so the backend doesn't look the genre up on Deezer.
        song_genre_name: "Electro",
        mentioned_user_ids: data.mentionedUserIds ?? []
      }
    });
    expect(response, `"${as.user.username}" could not publish a Recorda`).toBeOK();
    return ((await response.json()) as { recorda_id: string }).recorda_id;
  }

  async like(as: LoginResponse, recordaId: string): Promise<void> {
    this.assertLocal("like()", "like a Recorda");
    const response = await this.request.post(`/api/v1/recordas/${recordaId}/likes`, {
      headers: this.auth(as)
    });
    expect(response, `"${as.user.username}" could not like ${recordaId}`).toBeOK();
  }

  async comment(as: LoginResponse, recordaId: string, content: string): Promise<void> {
    this.assertLocal("comment()", "comment on a Recorda");
    const response = await this.request.post(`/api/v1/recordas/${recordaId}/comments`, {
      headers: this.auth(as),
      data: { content }
    });
    expect(response, `"${as.user.username}" could not comment on ${recordaId}`).toBeOK();
  }

  /** First page of the user's notifications, newest first. Reading does not mark them read. */
  async notifications(as: LoginResponse): Promise<NotificationPage> {
    const response = await this.request.get("/api/v1/notifications?limit=50", {
      headers: this.auth(as)
    });
    expect(response, `Could not list notifications of "${as.user.username}"`).toBeOK();
    return (await response.json()) as NotificationPage;
  }

  private auth(as: LoginResponse): Record<string, string> {
    return { Authorization: `Bearer ${as.access_token}` };
  }

  private assertLocal(method: string, action: string): void {
    if (!env.isLocalApi) {
      throw new Error(
        `${method} would ${action} on the shared deployed backend. Tag the test ` +
          "`@mutates` so it only runs against the local stack."
      );
    }
  }
}
