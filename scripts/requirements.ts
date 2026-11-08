/**
 * Requirements traceability.
 *
 *   pnpm requirements:check   every test has a name, description and known requirement IDs
 *   pnpm requirements:doc     regenerates docs/REQUIREMENTS.md (catalog + test coverage)
 *
 * Reads tests through `playwright test --list --reporter=json`, so nothing is executed.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";

import {
  DECISIONS,
  EPICS,
  OPEN_QUESTIONS,
  OUT_OF_SCOPE,
  REQUIREMENTS,
  REQUIREMENTS_BY_ID,
  USER_STORIES,
  type EpicId,
  type Requirement,
  type Status,
  type Verification
} from "../src/requirements/catalog.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const EXEMPT_PROJECTS = new Set(["setup"]);

type ListedTest = {
  title: string;
  file: string;
  line: number;
  description?: string;
  requirements: string[];
  tags: string[];
};

type JsonSuite = {
  specs?: {
    title: string;
    file: string;
    line: number;
    tags: string[];
    tests: { projectName: string; annotations: { type: string; description?: string }[] }[];
  }[];
  suites?: JsonSuite[];
};

function listTests(): ListedTest[] {
  const output = execFileSync(path.join(ROOT, "node_modules/.bin/playwright"), ["test", "--list", "--reporter=json"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    // Listing doesn't touch any backend; the local URL just skips the deployed-password check.
    env: { ...process.env, E2E_API_URL: "http://localhost:8000", E2E_SKIP_WEB_SERVER: "1" }
  });
  const report = JSON.parse(output) as { suites: JsonSuite[]; errors?: { message: string }[] };
  if (report.errors?.length) {
    throw new Error(report.errors.map((error) => error.message).join("\n"));
  }

  const tests = new Map<string, ListedTest>();
  const walk = (suite: JsonSuite) => {
    for (const spec of suite.specs ?? []) {
      for (const run of spec.tests) {
        if (EXEMPT_PROJECTS.has(run.projectName)) continue;
        const key = `${spec.file}:${spec.line}:${spec.title}`;
        if (tests.has(key)) continue; // same test in another project
        tests.set(key, {
          title: spec.title,
          file: `tests/${spec.file}`,
          line: spec.line,
          description: run.annotations.find((a) => a.type === "description")?.description,
          requirements: run.annotations.filter((a) => a.type === "requirement").map((a) => a.description ?? ""),
          tags: spec.tags
        });
      }
    }
    suite.suites?.forEach(walk);
  };
  report.suites.forEach(walk);
  return [...tests.values()];
}

function problemsOf(tests: ListedTest[]): string[] {
  const problems: string[] = [];
  const titles = new Map<string, string>();
  for (const test of tests) {
    const where = `${test.file}:${test.line} "${test.title}"`;
    if (!test.title.trim()) problems.push(`${where}: missing name`);
    if (!test.description?.trim()) problems.push(`${where}: missing description`);
    if (!test.requirements.length) problems.push(`${where}: missing requirement id`);
    for (const id of test.requirements) {
      if (!REQUIREMENTS_BY_ID.has(id)) problems.push(`${where}: unknown requirement "${id}"`);
    }
    const previous = titles.get(test.title);
    if (previous) problems.push(`${where}: same name as ${previous}`);
    titles.set(test.title, `${test.file}:${test.line}`);
  }
  return problems;
}

function coverage(tests: ListedTest[]) {
  const byRequirement = new Map<string, ListedTest[]>();
  for (const test of tests) {
    for (const id of test.requirements) {
      byRequirement.set(id, [...(byRequirement.get(id) ?? []), test]);
    }
  }
  return byRequirement;
}

// ── check ──────────────────────────────────────────────────────────────────────────────────

function check() {
  const tests = listTests();
  const problems = problemsOf(tests);
  const covered = coverage(tests);
  if (problems.length) {
    console.error(`✗ ${problems.length} problem(s) in ${tests.length} test(s):\n`);
    problems.forEach((problem) => console.error(`  - ${problem}`));
    process.exit(1);
  }
  console.log(`✓ ${tests.length} test(s), all with name, description and known requirement ids.`);
  console.log(`  Requirements covered: ${covered.size}/${REQUIREMENTS.length}`);
  for (const epic of Object.keys(EPICS) as EpicId[]) {
    const ids = REQUIREMENTS.filter((r) => r.epic === epic).map((r) => r.id);
    const done = ids.filter((id) => covered.has(id)).length;
    console.log(`  ${epic.padEnd(4)} ${String(done).padStart(3)}/${String(ids.length).padEnd(3)} ${EPICS[epic]}`);
  }
}

// ── doc ────────────────────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<Status, string> = {
  implemented: "implementada",
  "in-progress": "em andamento",
  "no-story": "sem US"
};

const VERIFICATION_LABEL: Record<Verification, string> = {
  web: "web",
  api: "API",
  native: "nativo",
  manual: "manual"
};

const issueUrl = (repo: string, number: number) =>
  `https://github.com/Recorda-ages/recorda-${repo}/issues/${number}`;

const cell = (text: string) => text.replaceAll("|", "\\|");

function requirementTable(requirements: readonly Requirement[], covered: Map<string, ListedTest[]>) {
  const rows = requirements.map((r) => {
    const tests = (covered.get(r.id) ?? []).map((t) => `[${cell(t.title)}](../${t.file}#L${t.line})`).join("<br>");
    const notes = [
      r.source ? `<br>_Fonte: ${cell(r.source)}_` : "",
      r.gap ? `<br>⚠️ ${cell(r.gap)}` : ""
    ].join("");
    return `| ${r.id} | ${cell(r.text)}${notes} | ${VERIFICATION_LABEL[r.verification]} | ${tests || "—"} |`;
  });
  return ["| ID | Requisito | Verificação | Testes |", "| --- | --- | --- | --- |", ...rows].join("\n");
}

function doc() {
  const tests = listTests();
  const problems = problemsOf(tests);
  if (problems.length) {
    console.error("Fix these first (pnpm requirements:check):");
    problems.forEach((problem) => console.error(`  - ${problem}`));
    process.exit(1);
  }
  const covered = coverage(tests);
  const out: string[] = [];

  out.push(
    "# Requisitos do Recorda",
    "",
    "> Gerado por `pnpm requirements:doc` a partir de",
    "> [src/requirements/catalog.ts](../src/requirements/catalog.ts). Não edite à mão: altere o",
    "> catálogo e gere de novo.",
    "",
    "Fontes: Termo de Abertura do Projeto (2026/2) e os Épicos e User Stories das issues de",
    "[recorda-frontend](https://github.com/Recorda-ages/recorda-frontend/issues) e",
    "[recorda-backend](https://github.com/Recorda-ages/recorda-backend/issues) (snapshot de 2026-11-08).",
    "",
    "## Como ler",
    "",
    "- **`RF-<US>.<n>`**: requisito funcional = critério de aceitação *n* da User Story *US*.",
    "- **`RF-T<n>`**: requisito do Termo de Abertura ainda sem User Story.",
    "- **`RNF-<n>`**: requisito não funcional.",
    "- **Verificação**: como esta suíte pode verificar o requisito. *web*: pela interface web;",
    "  *API*: pela API do backend; *nativo*: exige aparelho (câmera, galeria, permissões,",
    "  Instagram, áudio em segundo plano), fora do alcance do Playwright; *manual*: julgamento",
    "  visual ou de design.",
    "- **Status da US**: estado da issue (fechada = *implementada*, o que não significa testada).",
    "- Todo teste declara nome, descrição e o(s) ID(s) que verifica: veja",
    "  [GUIDELINES.md](GUIDELINES.md#2-anatomy-of-a-spec).",
    ""
  );

  const totals = (Object.keys(EPICS) as EpicId[]).map((epic) => {
    const reqs = REQUIREMENTS.filter((r) => r.epic === epic);
    const count = (v: Verification) => reqs.filter((r) => r.verification === v).length;
    const done = reqs.filter((r) => covered.has(r.id)).length;
    return `| ${epic} | ${EPICS[epic]} | ${reqs.length} | ${count("web")} | ${count("api")} | ${count("native")} | ${count("manual")} | ${done} |`;
  });
  const automatable = REQUIREMENTS.filter((r) => r.verification === "web" || r.verification === "api").length;
  const all: readonly Requirement[] = REQUIREMENTS;
  const gaps = all.filter((r) => r.gap);
  out.push(
    "## Resumo",
    "",
    `${REQUIREMENTS.length} requisitos, ${automatable} verificáveis por esta suíte (web ou API), ` +
      `${covered.size} cobertos por ${tests.length} teste(s). ${gaps.length} decididos mas ainda não ` +
      "atendidos pelo código (⚠️).",
    "",
    "| Épico | Nome | Requisitos | Web | API | Nativo | Manual | Cobertos |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...totals,
    "",
    "## Decisões",
    "",
    "Perguntas já respondidas pelo time e refletidas nos requisitos.",
    "",
    "| Data | Decisão | Requisitos |",
    "| --- | --- | --- |",
    ...DECISIONS.map((d) => `| ${d.date} | ${cell(d.decision)} | ${d.requirements.join(", ") || "—"} |`),
    "",
    "## Lacunas conhecidas",
    "",
    "Requisitos decididos que o código atual ainda não atende. Um teste para eles deve falhar",
    "até a implementação (marque-o com `test.fail()` e um comentário apontando o ID).",
    "",
    ...gaps.map((r) => `- **${r.id}**: ${r.gap}`),
    "",
    "## Pontos em aberto",
    "",
    "Contradições e lacunas encontradas entre o Termo, as User Stories e o código. Precisam de",
    "decisão do time antes de virarem teste.",
    "",
    ...OPEN_QUESTIONS.map((question) => `- ${question}`),
    "",
    "## Fora do escopo",
    "",
    "Itens do Termo de Abertura sem User Story, deixados fora dos requisitos por decisão do time.",
    "Não se esperam testes para eles. Os itens que o próprio Termo exclui estão em RNF-07.",
    "",
    ...OUT_OF_SCOPE.map((item) => `- ${item}`),
    ""
  );

  for (const epic of Object.keys(EPICS) as EpicId[]) {
    const reqs: readonly Requirement[] = REQUIREMENTS.filter((r) => r.epic === epic);
    out.push(`## ${epic} — ${EPICS[epic]}`, "");
    const stories = Object.entries(USER_STORIES).filter(([, us]) => us.epic === epic);
    if (stories.length) {
      for (const [number, us] of stories) {
        out.push(
          `### US ${number} — ${us.title}`,
          "",
          `[${us.issue.repo}#${us.issue.number}](${issueUrl(us.issue.repo, us.issue.number)}) · ${STATUS_LABEL[us.status]}`,
          "",
          requirementTable(
            reqs.filter((r) => r.us === Number(number)),
            covered
          ),
          ""
        );
      }
    } else {
      out.push(requirementTable(reqs, covered), "");
    }
  }

  out.push(
    "## Testes",
    "",
    "| Teste | Descrição | Requisitos |",
    "| --- | --- | --- |",
    ...tests.map(
      (t) => `| [${cell(t.title)}](../${t.file}#L${t.line}) | ${cell(t.description ?? "")} | ${t.requirements.join(", ")} |`
    ),
    ""
  );

  const target = path.join(ROOT, "docs/REQUIREMENTS.md");
  writeFileSync(target, out.join("\n"));
  console.log(`Wrote ${path.relative(ROOT, target)}: ${REQUIREMENTS.length} requirements, ${tests.length} tests, ${covered.size} covered.`);
}

const mode = process.argv[2];
if (mode === "check") check();
else if (mode === "doc") doc();
else {
  console.error("usage: requirements.ts check | doc");
  process.exit(2);
}
