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

const pluralRules = new Intl.PluralRules(LOCALE);

function lookup(key: string): string | Messages | undefined {
  return key
    .split(".")
    .reduce<string | Messages | undefined>(
      (node, part) => (typeof node === "object" ? node[part] : undefined),
      messages
    );
}

/**
 * `t("settings.signOut")` → "Sair". Throws on unknown keys so typos fail loudly.
 *
 * Like i18next, `{{name}}` placeholders are filled from `values`, and a numeric `count`
 * picks the plural key (`_zero` for 0 when it exists, then `_one` / `_other`).
 */
export function t(key: string, values: Record<string, string | number> = {}): string {
  let value = lookup(key);
  if (value === undefined && typeof values.count === "number") {
    const zero = values.count === 0 ? lookup(`${key}_zero`) : undefined;
    value = zero ?? lookup(`${key}_${pluralRules.select(values.count)}`);
  }
  if (typeof value !== "string") {
    throw new Error(`Missing ${LOCALE} translation for "${key}"`);
  }
  return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (placeholder, name: string) =>
    name in values ? String(values[name]) : placeholder
  );
}
