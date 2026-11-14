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

/** A profile header as `GET /api/v1/users/{id}/profile` returns it (fields tests read). */
export type Profile = {
  user_id: string;
  name: string;
  username: string;
  profile_picture_url: string | null;
  counts: { recordas: number; followers: number; following: number } | null;
  favorite_song: { title: string; artist_name: string };
  streak: { current_days: number; published_today: boolean } | null;
  can_view_content: boolean;
};

/** Favorite artists and genres, in the order the profile shows them. */
export type MusicTastes = {
  artists: { deezer_id: number; name: string }[];
  genres: { deezer_id: number; name: string }[];
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

  /** Sets the avatar through the API (1×1 PNG), as arrangement for tests that remove it. */
  async setAvatar(as: LoginResponse): Promise<void> {
    this.assertLocal("setAvatar()", "change a user");
    const response = await this.request.put("/api/v1/users/me/avatar", {
      headers: this.auth(as),
      multipart: { file: { name: "avatar.png", mimeType: "image/png", buffer: PIXEL_PNG } }
    });
    expect(response, `Could not set the avatar of "${as.user.username}"`).toBeOK();
  }

  /** Profile of `userId` as `as` sees it; read-only, safe on any backend. */
  async profile(as: LoginResponse, userId = as.user.user_id): Promise<Profile> {
    const response = await this.request.get(`/api/v1/users/${userId}/profile`, {
      headers: this.auth(as)
    });
    expect(response, `Could not read the profile of ${userId}`).toBeOK();
    return (await response.json()) as Profile;
  }

  /** The signed-in user's favorite artists and genres; read-only, safe on any backend. */
  async musicPreferences(as: LoginResponse): Promise<MusicTastes> {
    const response = await this.request.get("/api/v1/users/me/music-preferences", {
      headers: this.auth(as)
    });
    expect(response, `Could not read music preferences of "${as.user.username}"`).toBeOK();
    return (await response.json()) as MusicTastes;
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
