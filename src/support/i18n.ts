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

/** `t("settings.signOut")` → "Sair". Throws on unknown keys so typos fail loudly. */
export function t(key: string, locale: "pt-BR" | "en" | "es" = LOCALE): string {
  const localizedMessages =
    locale === LOCALE
      ? messages
      : (JSON.parse(
          readFileSync(path.join(env.frontendDir, "src/i18n/locales", `${locale}.json`), "utf8")
        ) as Messages);
  const value = key
    .split(".")
    .reduce<string | Messages | undefined>(
      (node, part) => (typeof node === "object" ? node[part] : undefined),
      localizedMessages
    );
  if (typeof value !== "string") {
    throw new Error(`Missing ${locale} translation for "${key}"`);
  }
  return value;
}
