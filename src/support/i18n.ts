import { readFileSync } from "node:fs";
import path from "node:path";

import { env } from "../config/env";

/**
 * Reads UI copy straight from the frontend's locale files, so text-based locators never
 * drift from the app. Seeded accounts use pt-BR, which is also the app's default.
 */
export const LOCALE = "pt-BR";

/** Languages the app offers (language codes as the frontend stores them). */
export const LOCALES = ["pt-BR", "en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

type Messages = { [key: string]: string | Messages };

const catalogs = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    JSON.parse(
      readFileSync(path.join(env.frontendDir, "src/i18n/locales", `${locale}.json`), "utf8")
    ) as Messages
  ])
) as Record<Locale, Messages>;

function lookup(locale: Locale, key: string): string | Messages | undefined {
  return key
    .split(".")
    .reduce<string | Messages | undefined>(
      (node, part) => (typeof node === "object" ? node[part] : undefined),
      catalogs[locale]
    );
}

/**
 * `tIn("en", "settings.title")` → "Settings". Throws on unknown keys so typos fail loudly.
 *
 * Like i18next, `{{name}}` placeholders are filled from `values`, and a numeric `count`
 * picks the plural key (`_zero` for 0 when it exists, then `_one` / `_other`).
 */
export function tIn(
  locale: Locale,
  key: string,
  values: Record<string, string | number> = {}
): string {
  let value = lookup(locale, key);
  if (value === undefined && typeof values.count === "number") {
    const zero = values.count === 0 ? lookup(locale, `${key}_zero`) : undefined;
    value = zero ?? lookup(locale, `${key}_${new Intl.PluralRules(locale).select(values.count)}`);
  }
  if (typeof value !== "string") {
    throw new Error(`Missing ${locale} translation for "${key}"`);
  }
  return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (placeholder, name: string) =>
    name in values ? String(values[name]) : placeholder
  );
}

/** `t("settings.signOut")` → "Sair". The pt-BR copy, the language of the seeded accounts. */
export function t(key: string, values: Record<string, string | number> = {}): string {
  return tIn(LOCALE, key, values);
}
