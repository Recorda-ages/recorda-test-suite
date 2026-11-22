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

/** An account created by a test, with its password and a ready-to-use session. */
export type TestAccount = {
  user: TestUser;
  session: LoginResponse;
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

/** What `createUser` returns: the account plus what it was created with. */
export type NewAccount = {
  user: TestUser & { name: string; email: string };
  session: LoginResponse;
  preferences: MusicPreferences;
};

export type Settings = { is_private: boolean; language: Language };

export type AccountDetails = { user_id: string; name: string; username: string; email: string };

export type CreatedRecorda = {
  recorda_id: string;
  user_id: string;
  description: string | null;
  song_title: string;
  song_artist_name: string;
};

export type RecordaComment = {
  comment_id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
};

export type RecordaLikeState = { likes_count: number; is_liked: boolean };

/** Notification kinds, as `GET /api/v1/notifications` returns them. */
export type NotificationType =
  | "COMMENT"
  | "CONTENT_REMOVED"
  | "FOLLOW_ACCEPTED"
  | "FOLLOW_REQUEST"
  | "LIKE"
  | "MENTION"
  | "NEW_FOLLOWER";

export type NotificationList = {
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

export type FollowStatus = "seguindo" | "solicitado";

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


// 1×1 PNG: the smallest media the upload endpoint accepts.
const PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

let uniqueSeq = 0;
/** Unique across parallel workers and repeated runs: time + pid + per-process counter. */
export function uniqueId(): string {
  uniqueSeq += 1;
  return `${Date.now().toString(36)}${process.pid.toString(36)}${uniqueSeq.toString(36)}`;
}

/** A positive integer no seeded or other test user shares (Deezer ids are much smaller). */
function uniqueDeezerId(): number {
  return 2_000_000_000 + Math.floor(Math.random() * 100_000_000);
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

  /**
   * Registers a user that has finished onboarding, so the app opens on the Feed. Unless
   * `preferences` are given, its music tastes are unique, so it has no musical affinity with
   * anyone and its "Para Você" feed only shows its own Recordas and those it follows.
   */
  async createUser(
    label: string,
    options: { language?: Language; preferences?: MusicPreferences } = {}
  ): Promise<NewAccount> {
    const username = `e2e-${label}-${uniqueId()}`;
    const user = {
      username,
      password: env.userPassword,
      role: "USER" as const,
      name: `E2E ${label}`,
      email: `${username}@e2e.recorda.test`
    };
    const session = await this.register({
      name: user.name,
      username,
      email: user.email,
      password: user.password,
      language: options.language ?? "pt-BR"
    });
    const items = (kind: string) =>
      [1, 2, 3].map((n) => ({ deezer_id: uniqueDeezerId(), name: `${username} ${kind} ${n}` }));
    const preferences = options.preferences ?? {
      genres: items("genre"),
      artists: items("artist"),
      favorite_track: {
        deezer_id: uniqueDeezerId(),
        title: `${username} song`,
        artist_name: `${username} artist`
      }
    };
    await this.saveMusicPreferences({ user, session }, preferences);
    return {
      user,
      session: { ...session, user: { ...session.user, onboarding_completed: true } },
      preferences
    };
  }

  async saveMusicPreferences(account: TestAccount, preferences: MusicPreferences): Promise<void> {
    const response = await this.request.post("/api/v1/users/me/music-preferences", {
      headers: this.auth(account.session),
      data: preferences
    });
    expect(response, `Could not save the music preferences of ${account.user.username}`).toBeOK();
  }

  async settings(account: TestAccount): Promise<Settings> {
    const response = await this.request.get("/api/v1/users/me/settings", {
      headers: this.auth(account.session)
    });
    expect(response, `Could not read the settings of ${account.user.username}`).toBeOK();
    return (await response.json()) as Settings;
  }

  async updateSettings(account: TestAccount, settings: Partial<Settings>): Promise<void> {
    const response = await this.request.patch("/api/v1/users/me/settings", {
      headers: this.auth(account.session),
      data: settings
    });
    expect(response, `Could not update the settings of ${account.user.username}`).toBeOK();
  }

  /** Name, username and email as "Minha conta" stores them on the server. */
  async accountDetails(account: TestAccount): Promise<AccountDetails> {
    const response = await this.request.get("/api/v1/users/me/account", {
      headers: this.auth(account.session)
    });
    expect(response, `Could not read the account of ${account.user.username}`).toBeOK();
    return (await response.json()) as AccountDetails;
  }

  /** Publishes a photo Recorda as `author`, without calling Deezer. */
  async createRecorda(
    author: TestAccount,
    data: {
      description: string;
      songTitle?: string;
      songArtist?: string;
      /** People to mark in the Recorda; the author must follow them. */
      mentioned?: TestAccount[];
    }
  ): Promise<CreatedRecorda> {
    const upload = await this.request.post("/api/v1/recordas/media", {
      headers: this.auth(author.session),
      multipart: { file: { name: "pixel.png", mimeType: "image/png", buffer: PIXEL_PNG } }
    });
    expect(upload, "Could not upload the Recorda media").toBeOK();
    const { url } = (await upload.json()) as { url: string };
    const response = await this.request.post("/api/v1/recordas", {
      headers: this.auth(author.session),
      data: {
        media_url: url,
        media_type: "PHOTO",
        description: data.description,
        deezer_track_id: String(uniqueDeezerId()),
        song_title: data.songTitle ?? "E2E Song",
        song_artist_name: data.songArtist ?? "E2E Artist",
        song_genre_name: "Pop",
        mentioned_user_ids: (data.mentioned ?? []).map((account) => account.session.user.user_id)
      }
    });
    expect(response, "Could not create the Recorda").toBeOK();
    return (await response.json()) as CreatedRecorda;
  }

  /**
   * `follower` follows `target`: accepted at once for a public account ("seguindo"), a
   * follow request for a private one ("solicitado").
   */
  async follow(follower: TestAccount, target: TestAccount): Promise<FollowStatus> {
    const response = await this.request.post(
      `/api/v1/users/${target.session.user.user_id}/follow`,
      { headers: this.auth(follower.session) }
    );
    expect(response, `${follower.user.username} could not follow ${target.user.username}`).toBeOK();
    return ((await response.json()) as { follow_status: FollowStatus }).follow_status;
  }

  async setPrivate(account: TestAccount, isPrivate: boolean): Promise<void> {
    await this.updateSettings(account, { is_private: isPrivate });
  }


  async respondToFollowRequest(
    account: TestAccount,
    followId: string,
    action: "accept" | "decline"
  ): Promise<void> {
    const response = await this.request.patch(`/api/v1/follow-requests/${followId}`, {
      headers: this.auth(account.session),
      data: { action }
    });
    expect(response, `Could not ${action} follow request ${followId}`).toBeOK();
  }

  /** Usernames of `of`'s accepted followers, as `viewer` sees them. */
  async followers(viewer: TestAccount, of: TestAccount = viewer): Promise<string[]> {
    const response = await this.request.get(
      `/api/v1/users/${of.session.user.user_id}/followers`,
      { headers: this.auth(viewer.session) }
    );
    expect(response, `Could not list the followers of ${of.user.username}`).toBeOK();
    return ((await response.json()) as { username: string }[]).map((user) => user.username);
  }

  /** First page of `account`'s notifications, newest first. Reading doesn't mark them read. */
  async notifications(account: TestAccount): Promise<NotificationList> {
    const response = await this.request.get("/api/v1/notifications?limit=50", {
      headers: this.auth(account.session)
    });
    expect(response, `Could not list the notifications of ${account.user.username}`).toBeOK();
    return (await response.json()) as NotificationList;
  }

  async like(account: TestAccount, recordaId: string): Promise<RecordaLikeState> {
    const response = await this.request.post(`/api/v1/recordas/${recordaId}/likes`, {
      headers: this.auth(account.session)
    });
    expect(response, "Could not like the Recorda").toBeOK();
    return (await response.json()) as RecordaLikeState;
  }

  /** Like count and whether `account` liked the Recorda, as the server sees them. */
  async likeState(account: TestAccount, recordaId: string): Promise<RecordaLikeState> {
    const response = await this.request.get(`/api/v1/recordas/${recordaId}`, {
      headers: this.auth(account.session)
    });
    expect(response, "Could not read the Recorda").toBeOK();
    const { likes_count, is_liked } = (await response.json()) as RecordaLikeState;
    return { likes_count, is_liked };
  }

  async comment(account: TestAccount, recordaId: string, content: string): Promise<RecordaComment> {
    const response = await this.request.post(`/api/v1/recordas/${recordaId}/comments`, {
      headers: this.auth(account.session),
      data: { content }
    });
    expect(response, "Could not comment on the Recorda").toBeOK();
    return (await response.json()) as RecordaComment;
  }

  async comments(account: TestAccount, recordaId: string): Promise<RecordaComment[]> {
    const response = await this.request.get(`/api/v1/recordas/${recordaId}/comments`, {
      headers: this.auth(account.session)
    });
    expect(response, "Could not list the comments").toBeOK();
    return (await response.json()) as RecordaComment[];
  }

  /** Sets the avatar through the API (1×1 PNG), as arrangement for tests that remove it. */
  async setAvatar(account: TestAccount): Promise<void> {
    const response = await this.request.put("/api/v1/users/me/avatar", {
      headers: this.auth(account.session),
      multipart: { file: { name: "avatar.png", mimeType: "image/png", buffer: PIXEL_PNG } }
    });
    expect(response, `Could not set the avatar of ${account.user.username}`).toBeOK();
  }

  /** `of`'s profile as `viewer` sees it. Read-only, safe on any backend. */
  async profile(viewer: TestAccount, of: TestAccount = viewer): Promise<Profile> {
    const response = await this.request.get(`/api/v1/users/${of.session.user.user_id}/profile`, {
      headers: this.auth(viewer.session)
    });
    expect(response, `Could not read the profile of ${of.user.username}`).toBeOK();
    return (await response.json()) as Profile;
  }

  /** `account`'s favorite artists, genres and song. Read-only, safe on any backend. */
  async musicPreferences(account: TestAccount): Promise<MusicPreferences> {
    const response = await this.request.get("/api/v1/users/me/music-preferences", {
      headers: this.auth(account.session)
    });
    expect(response, `Could not read the music preferences of ${account.user.username}`).toBeOK();
    return (await response.json()) as MusicPreferences;
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

  /** A seeded account with a fresh session, to use with the helpers above. Read-only. */
  async account(user: TestUser): Promise<TestAccount> {
    return { user, session: await this.login(user) };
  }

  /** HTTP status of a login attempt, for checking that one is refused. */
  async loginStatus(user: Pick<TestUser, "username" | "password">): Promise<number> {
    const response = await this.request.post("/api/v1/auth/login", {
      data: { username: user.username, password: user.password }
    });
    return response.status();
  }

  /** HTTP status of a sign-up attempt, for checking that one is refused. */
  async registerStatus(data: {
    name: string;
    username: string;
    email: string;
    password: string;
  }): Promise<number> {
    this.assertLocal("registerStatus()");
    return (await this.request.post("/api/v1/auth/register", { data })).status();
  }

  /** Creates a brand-new account. Use for tests that mutate the user. */
  async register(data: {
    name: string;
    username: string;
    email: string;
    password: string;
    language?: Language;
  }): Promise<LoginResponse> {
    this.assertLocal("register()");
    const response = await this.request.post("/api/v1/auth/register", { data });
    expect(response, `Could not register "${data.username}"`).toBeOK();
    return (await response.json()) as LoginResponse;
  }

  private assertLocal(method: string): void {
    if (!env.isLocalApi) {
      throw new Error(
        `${method} would create a user on the shared deployed backend. Tag the test ` +
          "`@mutates` so it only runs against the local stack."
      );
    }
  }
}
