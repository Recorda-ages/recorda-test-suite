import type { MusicPreferences } from "../support/api";

/**
 * Onboarding answers for an account created by a test: three genres, three artists and a
 * song that exist only for that account. Nobody else shares them, not even other test
 * accounts, so a new account has zero Musical Affinity: no suggestions and no discovery
 * posts in the general feed until its preferences change.
 *
 * Each call adds three genres to the local backend's vocabulary (it stores unknown genres by
 * name), which is why this only runs in `@mutates` tests.
 */
export function uniquePreferences(): MusicPreferences {
  const tag = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const base = 900_000_000 + Math.floor(Math.random() * 90_000_000);
  const numbers = [1, 2, 3];
  return {
    genres: numbers.map((n) => ({ deezer_id: base + n, name: `E2E Gênero ${tag}-${n}` })),
    artists: numbers.map((n) => ({ deezer_id: base + 10 + n, name: `E2E Artista ${tag}-${n}` })),
    favorite_track: {
      deezer_id: base + 20,
      title: `E2E Música ${tag}`,
      artist_name: `E2E Artista ${tag}-1`
    }
  };
}

/**
 * Genres that real Deezer lists under these exact names and that seeded users like
 * (gabriel, lucas, pedro…), so picking them gives an account Musical Affinity > 0.
 */
export const popularGenres = ["Pop", "Rock"] as const;
