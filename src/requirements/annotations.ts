import type { TestInfo } from "@playwright/test";

import { REQUIREMENTS_BY_ID, type RequirementId } from "./catalog";

/** Annotation types that carry a test's metadata into reports and `--list` output. */
export const ANNOTATION = {
  description: "description",
  requirement: "requirement"
} as const;

/**
 * Mandatory metadata of every E2E test, next to its name (the test title):
 * `test("name", meta({ description, requirement }), body)`.
 */
export type TestMeta = {
  /** What the test verifies and why, in one or two sentences. */
  description: string;
  /** Requirement(s) from `src/requirements/catalog.ts` that this test verifies. */
  requirement: RequirementId | readonly [RequirementId, ...RequirementId[]];
  tag?: `@${string}` | `@${string}`[];
};

/**
 * Test details for `test(name, meta({...}), body)`: tags plus description and requirement
 * annotations, which show up in the HTML report and in `playwright test --list`.
 */
export function meta({ description, requirement, tag }: TestMeta) {
  if (!description.trim()) throw new Error("E2E test with an empty description");
  const ids: readonly string[] = typeof requirement === "string" ? [requirement] : requirement;
  for (const id of ids) {
    if (!REQUIREMENTS_BY_ID.has(id)) {
      throw new Error(`Unknown requirement "${id}" (see src/requirements/catalog.ts)`);
    }
  }
  return {
    tag,
    annotation: [
      { type: ANNOTATION.description, description },
      ...ids.map((id) => ({ type: ANNOTATION.requirement, description: id }))
    ]
  };
}

/** Projects whose tests prepare the run instead of verifying requirements. */
const EXEMPT_PROJECTS = new Set(["setup"]);

/** Throws when a test was declared without `meta()` (description + requirement). */
export function assertHasMetadata(testInfo: TestInfo): void {
  if (EXEMPT_PROJECTS.has(testInfo.project.name)) return;
  const types = new Set(testInfo.annotations.map((annotation) => annotation.type));
  const missing = Object.values(ANNOTATION).filter((type) => !types.has(type));
  if (missing.length) {
    throw new Error(
      `"${testInfo.title}" has no ${missing.join(" / ")}. Declare tests with ` +
        "test(name, meta({ description, requirement }), body) (docs/GUIDELINES.md §2)."
    );
  }
}
