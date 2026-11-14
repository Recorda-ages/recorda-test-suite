import { readFileSync } from "node:fs";
import path from "node:path";

import { env } from "../config/env";

/**
 * Reads UI copy straight from the frontend's locale files, so text-based locators never
 * drift from the app. Seeded accounts use pt-BR, which is also the app's default.
 */
export const LOCALE = "pt-BR";

type Messages = { [key: string]: string | Messages };

const messages = JSON.parse(
  readFileSync(path.join(env.frontendDir, "src/i18n/locales", `${LOCALE}.json`), "utf8")
) as Messages;

/** Plural category of a count in the locale, as i18next picks `key_one` / `key_other`. */
const pluralRules = new Intl.PluralRules(LOCALE);

function lookup(key: string): string | undefined {
  const value = key
    .split(".")
    .reduce<string | Messages | undefined>(
      (node, part) => (typeof node === "object" ? node[part] : undefined),
      messages
    );
  return typeof value === "string" ? value : undefined;
}

/**
 * `t("settings.signOut")` → "Sair". Throws on unknown keys so typos fail loudly.
 * `{{name}}` placeholders are filled from `params`, as i18next does in the app. With a
 * numeric `count`, plural keys resolve too: `t("profile.streak.days", { count: 1 })` reads
 * `profile.streak.days_one`.
 */
export function t(key: string, params: Record<string, string | number> = {}): string {
  const { count } = params;
  const value =
    lookup(key) ??
    (typeof count === "number"
      ? (lookup(`${key}_${pluralRules.select(count)}`) ?? lookup(`${key}_other`))
      : undefined);
  if (value === undefined) {
    throw new Error(`Missing ${LOCALE} translation for "${key}"`);
  }
  return value.replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder
  );
}
