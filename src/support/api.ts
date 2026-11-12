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

export type Language = "pt-BR" | "en" | "es";

export type MusicItem = { deezer_id: number; name: string; picture_url?: string | null };

export type FavoriteTrack = {
  deezer_id: number;
  title: string;
  artist_name: string;
  cover_url?: string;
  preview_url?: string | null;
};

export type MusicPreferences = {
  genres: MusicItem[];
  artists: MusicItem[];
  favorite_track: FavoriteTrack;
};

export type Settings = { is_private: boolean; language: Language };

export type Account = { user_id: string; name: string; username: string; email: string };

export type FollowUser = { user_id: string; username: string; name: string };

export type Notification = {
  notification_id: string;
  type: string;
  sender: { user_id: string; username: string } | null;
};

/** An account a test created for itself, already signed in through the API. */
export type NewAccount = {
  user: TestUser & { name: string; email: string };
  session: LoginResponse;
  preferences: MusicPreferences;
};

const NEW_ACCOUNT_PASSWORD = "E2e@Senha123";

/** Lowercase letters and digits only, so it passes every username rule of the app. */
function uniqueUsername(): string {
  const random = Math.random().toString(36).slice(2, 7);
  return `e2e${Date.now().toString(36)}${random}`;
}

/**
 * Thin client for the Recorda backend, used to arrange state and to verify side effects
 * without going through the UI. Keep it to what tests need; it is not an SDK.
 */
export class RecordaApi {
  constructor(private readonly request: APIRequestContext) {}

  private auth(session: LoginResponse) {
    return { Authorization: `Bearer ${session.access_token}` };
  }

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

  /** HTTP status of a login attempt, for checking that one is refused. */
  async loginStatus(user: Pick<TestUser, "username" | "password">): Promise<number> {
    const response = await this.request.post("/api/v1/auth/login", {
      data: { username: user.username, password: user.password }
    });
    return response.status();
  }

  /** Creates a brand-new account. Use for tests that mutate the user. */
  async register(data: {
    name: string;
    username: string;
    email: string;
    password: string;
    language?: Language;
  }): Promise<LoginResponse> {
    const response = await this.registerResponse(data);
    expect(response, `Could not register "${data.username}"`).toBeOK();
    return (await response.json()) as LoginResponse;
  }

  /** HTTP status of a sign-up attempt, for checking that one is refused. */
  async registerStatus(data: {
    name: string;
    username: string;
    email: string;
    password: string;
  }): Promise<number> {
    return (await this.registerResponse(data)).status();
  }

  private registerResponse(data: Record<string, string>) {
    if (!env.isLocalApi) {
      throw new Error(
        "register() would create a user on the shared deployed backend. Tag the test " +
          "`@mutates` so it only runs against the local stack."
      );
    }
    return this.request.post("/api/v1/auth/register", { data });
  }

  /**
   * Registers a unique account and answers the onboarding, so it opens straight on the
   * Feed. Only for `@mutates` tests: it writes to the backend.
   */
  async createAccount(options: {
    language?: Language;
    preferences: MusicPreferences;
  }): Promise<NewAccount> {
    const username = uniqueUsername();
    const user = {
      username,
      password: NEW_ACCOUNT_PASSWORD,
      role: "USER" as const,
      name: "Conta E2E",
      email: `${username}@e2e.recorda.dev`
    };
    const session = await this.register({
      name: user.name,
      username: user.username,
      email: user.email,
      password: user.password,
      language: options.language
    });
    await this.saveMusicPreferences(session, options.preferences);
    return { user, session, preferences: options.preferences };
  }

  async saveMusicPreferences(session: LoginResponse, preferences: MusicPreferences) {
    const response = await this.request.post("/api/v1/users/me/music-preferences", {
      headers: this.auth(session),
      data: preferences
    });
    expect(response, "Could not save the music preferences").toBeOK();
  }

  async musicPreferences(session: LoginResponse): Promise<MusicPreferences> {
    const response = await this.request.get("/api/v1/users/me/music-preferences", {
      headers: this.auth(session)
    });
    expect(response).toBeOK();
    return (await response.json()) as MusicPreferences;
  }

  async settings(session: LoginResponse): Promise<Settings> {
    const response = await this.request.get("/api/v1/users/me/settings", {
      headers: this.auth(session)
    });
    expect(response).toBeOK();
    return (await response.json()) as Settings;
  }

  async updateSettings(session: LoginResponse, settings: Partial<Settings>): Promise<void> {
    const response = await this.request.patch("/api/v1/users/me/settings", {
      headers: this.auth(session),
      data: settings
    });
    expect(response, "Could not update the settings").toBeOK();
  }

  async account(session: LoginResponse): Promise<Account> {
    const response = await this.request.get("/api/v1/users/me/account", {
      headers: this.auth(session)
    });
    expect(response).toBeOK();
    return (await response.json()) as Account;
  }

  /** Follows `userId`; a private account gets a pending request instead. */
  async follow(session: LoginResponse, userId: string): Promise<string> {
    const response = await this.request.post(`/api/v1/users/${userId}/follow`, {
      headers: this.auth(session)
    });
    expect(response, `Could not follow ${userId}`).toBeOK();
    return ((await response.json()) as { follow_status: string }).follow_status;
  }

  async followers(session: LoginResponse, userId: string): Promise<FollowUser[]> {
    const response = await this.request.get(`/api/v1/users/${userId}/followers`, {
      headers: this.auth(session)
    });
    expect(response).toBeOK();
    return (await response.json()) as FollowUser[];
  }

  async notifications(session: LoginResponse): Promise<Notification[]> {
    const response = await this.request.get("/api/v1/notifications", {
      headers: this.auth(session)
    });
    expect(response).toBeOK();
    return ((await response.json()) as { items: Notification[] }).items;
  }
}
