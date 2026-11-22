/**
 * Requirements traceability.
 *
 *   pnpm requirements:check   every test has a name, description and known requirement IDs,
 *                             and every requirement belongs to exactly one flow
 *   pnpm requirements:doc     regenerates docs/REQUIREMENTS.md (catalog, flows, coverage)
 *   pnpm flows:issues         writes one GitHub issue body per flow to .build/issues/
 *     -- --create             creates the missing issues with the GitHub CLI (`gh`) and
 *                             records their numbers in src/requirements/flows.ts
 *     -- --update             rewrites the body of the issues that already exist
 *     -- --project            adds the issues to the org project and fills Status, Tipo and
 *                             Épico where they are still empty
 *
 * Reads tests through `playwright test --list --reporter=json`, so nothing is executed.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
import { FLOW_VERIFICATIONS, FLOWS, NOT_IN_FLOWS, type Flow } from "../src/requirements/flows.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const REPO = "Recorda-ages/recorda-test-suite";
const PROJECT = { owner: "Recorda-ages", number: "1" };
/** Field values set on new flow issues in the project (only when the field is empty). */
const PROJECT_DEFAULTS = { Status: "Product Backlog", Tipo: "Task" };
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
  const output = execFileSync(
    process.execPath,
    [path.join(ROOT, "node_modules/@playwright/test/cli.js"), "test", "--list", "--reporter=json"],
    {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      // Listing doesn't touch any backend; the local URL just skips the deployed-password check.
      env: { ...process.env, E2E_API_URL: "http://localhost:8000", E2E_SKIP_WEB_SERVER: "1" }
    }
  );
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

function flowProblems(): string[] {
  const problems: string[] = [];
  const owners = new Map<string, string[]>();
  const flowIds = new Set<string>();
  for (const flow of FLOWS) {
    if (flowIds.has(flow.id)) problems.push(`duplicate flow id ${flow.id}`);
    flowIds.add(flow.id);
    for (const id of flow.requirements) {
      if (!REQUIREMENTS_BY_ID.has(id)) problems.push(`${flow.id}: unknown requirement "${id}"`);
      owners.set(id, [...(owners.get(id) ?? []), flow.id]);
    }
  }
  for (const r of REQUIREMENTS) {
    if (!FLOW_VERIFICATIONS.has(r.verification)) continue; // API/manual: never in a flow
    const flows = owners.get(r.id) ?? [];
    const excluded = r.id in NOT_IN_FLOWS;
    if (excluded && flows.length) problems.push(`${r.id}: in NOT_IN_FLOWS but also in ${flows.join(", ")}`);
    if (!excluded && flows.length === 0) problems.push(`${r.id}: not in any flow (src/requirements/flows.ts)`);
    if (flows.length > 1) problems.push(`${r.id}: in more than one flow (${flows.join(", ")})`);
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
  const problems = [...problemsOf(tests), ...flowProblems()];
  const covered = coverage(tests);
  if (problems.length) {
    console.error(`✗ ${problems.length} problem(s) in ${tests.length} test(s):\n`);
    problems.forEach((problem) => console.error(`  - ${problem}`));
    process.exit(1);
  }
  console.log(`✓ ${tests.length} test(s), all with name, description and known requirement ids.`);
  const inFlows = FLOWS.reduce((n, flow) => n + flow.requirements.length, 0);
  console.log(`✓ ${inFlows} user-flow requirements in ${FLOWS.length} flows, each in exactly one (API/manual left out).`);
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
  const problems = [...problemsOf(tests), ...flowProblems()];
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

  out.push(
    "## Fluxos de teste",
    "",
    "Os requisitos agrupados por jornada do usuário. Cada fluxo tem uma issue em",
    `[${REPO}](https://github.com/${REPO}/issues) e uma pasta de specs sugerida.`,
    "",
    "| Fluxo | Issue | Requisitos | Web (Playwright) | Cobertos | Lacunas | Escreve dados |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...FLOWS.map((flow) => {
      const reqs = flow.requirements.map((id) => REQUIREMENTS_BY_ID.get(id)!);
      const testable = reqs.filter((r) => r.verification === "web");
      const done = reqs.filter((r) => covered.has(r.id)).length;
      const issue = flow.issue ? `[#${flow.issue}](https://github.com/${REPO}/issues/${flow.issue})` : "—";
      return `| ${flow.id} ${flow.title} | ${issue} | ${reqs.length} | ${testable.length} | ${done} | ${reqs.filter((r) => r.gap).length} | ${flow.mutates ? "sim (`@mutates`)" : "não"} |`;
    }),
    "",
    "Os fluxos contêm só requisitos de jornada do usuário (verificação *web* ou *nativo*).",
    "Ficam fora:",
    "",
    `- **Verificação API ou manual** (${(REQUIREMENTS as readonly Requirement[]).filter((r) => !FLOW_VERIFICATIONS.has(r.verification)).length}): ` +
      (REQUIREMENTS as readonly Requirement[]).filter((r) => !FLOW_VERIFICATIONS.has(r.verification)).map((r) => r.id).join(", ") +
      ".",
    ...Object.entries(NOT_IN_FLOWS).map(([id, reason]) => `- **${id}**: ${reason}`),
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

// ── issues ─────────────────────────────────────────────────────────────────────────────────

const VERIFICATION_NOTE: Record<Verification, string> = {
  web: "web",
  api: "API",
  native: "nativo (fora do Playwright)",
  manual: "manual"
};

function issueTitle(flow: Flow) {
  return `[E2E] ${flow.id} — ${flow.title}`;
}

function issueBody(flow: Flow, covered: Map<string, ListedTest[]>) {
  const reqs = flow.requirements.map((id) => REQUIREMENTS_BY_ID.get(id)!);
  const testable = reqs.filter((r) => r.verification === "web");
  const outOfReach = reqs.filter((r) => r.verification === "native");
  const gaps = reqs.filter((r) => r.gap);
  const stories = [...new Set(reqs.map((r) => r.us).filter((us) => us !== null))].map((us) => {
    const story = USER_STORIES[us as keyof typeof USER_STORIES];
    return `[US ${us} — ${story.title}](${issueUrl(story.issue.repo, story.issue.number)})`;
  });
  const status = (r: Requirement) => {
    const tests = covered.get(r.id) ?? [];
    if (tests.length) return `✅ ${tests.map((t) => t.title).join("; ")}`;
    if (r.gap) return "⚠️ lacuna";
    return "—";
  };
  const row = (r: Requirement) =>
    `| \`${r.id}\` | ${cell(r.text)}${r.gap ? `<br>⚠️ ${cell(r.gap)}` : ""} | ${VERIFICATION_NOTE[r.verification]} | ${cell(status(r))} |`;

  return [
    "<!-- Gerada por `pnpm flows:issues` a partir de src/requirements/flows.ts. -->",
    "",
    "## Objetivo",
    "",
    flow.goal,
    "",
    `**User Stories:** ${stories.join(", ") || "—"}`,
    "",
    "## Requisitos a cobrir",
    "",
    `${testable.length} de ${reqs.length} requisitos são verificáveis pela interface web com Playwright.`,
    "",
    "| ID | Requisito | Verificação | Testes |",
    "| --- | --- | --- | --- |",
    ...reqs.map(row),
    "",
    "## Como testar",
    "",
    `- **Pasta:** \`${flow.folder}\``,
    `- **Dados:** ${flow.data}`,
    flow.mutates
      ? "- **Escreve dados:** sim. Marque os testes com `@mutates`: eles rodam só em `pnpm test:local` (nunca no backend compartilhado)."
      : "- **Escreve dados:** não. Os testes podem rodar também contra o backend publicado.",
    gaps.length
      ? `- **Lacunas (${gaps.map((r) => r.id).join(", ")}):** escreva o teste com o comportamento decidido e marque-o com \`test.fail()\` e um comentário com o ID.`
      : null,
    outOfReach.length
      ? `- **Nativos (${outOfReach.map((r) => r.id).join(", ")}):** exigem aparelho (câmera, galeria, Instagram, áudio); não escreva testes web para eles, ficam para teste nativo.`
      : null,
    `- Siga [docs/GUIDELINES.md](https://github.com/${REPO}/blob/dev/docs/GUIDELINES.md); requisitos completos em [docs/REQUIREMENTS.md](https://github.com/${REPO}/blob/dev/docs/REQUIREMENTS.md).`,
    "",
    "## Pronto quando",
    "",
    "- [ ] Todo requisito web acima tem ao menos um teste que percorre o fluxo pela interface (ou `test.fail()` se for lacuna)",
    "- [ ] Cada teste declara nome, descrição e requisito: `test(name, meta({ description, requirement }), body)`",
    "- [ ] `pnpm typecheck` e `pnpm requirements:check` passam",
    "- [ ] Os specs passam com `--repeat-each=3`",
    "- [ ] `docs/REQUIREMENTS.md` regenerado com `pnpm requirements:doc`",
    ""
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function gh(args: string[]) {
  return execFileSync("gh", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function recordIssueNumber(flowId: string, number: number) {
  const file = path.join(ROOT, "src/requirements/flows.ts");
  const source = readFileSync(file, "utf8");
  const anchor = `    id: "${flowId}",\n`;
  if (!source.includes(anchor)) throw new Error(`Could not find ${flowId} in flows.ts`);
  writeFileSync(file, source.replace(anchor, `${anchor}    issue: ${number},\n`));
}

function issues(flags: string[]) {
  const tests = listTests();
  const covered = coverage(tests);
  const dir = path.join(ROOT, ".build/issues");
  mkdirSync(dir, { recursive: true });
  for (const flow of FLOWS) {
    const file = path.join(dir, `${flow.id}.md`);
    writeFileSync(file, issueBody(flow, covered));
    const where = flow.issue ? `#${flow.issue}` : "not created";
    console.log(`${flow.id}  ${where.padEnd(12)} ${path.relative(ROOT, file)}  ${issueTitle(flow)}`);
  }

  if (flags.includes("--create")) {
    for (const flow of FLOWS.filter((f) => !f.issue)) {
      const existing = JSON.parse(
        gh(["issue", "list", "--repo", REPO, "--state", "all", "--search", `"${flow.id}" in:title`, "--json", "number,title"])
      ) as { number: number; title: string }[];
      const match = existing.find((issue) => issue.title.startsWith(`[E2E] ${flow.id} `));
      const number = match
        ? match.number
        : Number(
            gh(["issue", "create", "--repo", REPO, "--title", issueTitle(flow), "--body-file", path.join(dir, `${flow.id}.md`)])
              .split("/")
              .pop()
          );
      recordIssueNumber(flow.id, number);
      console.log(`${match ? "found" : "created"} #${number} ${issueTitle(flow)}`);
    }
    console.log("Issue numbers recorded in src/requirements/flows.ts; run pnpm requirements:doc.");
  }

  if (flags.includes("--project")) syncProject();

  if (flags.includes("--update")) {
    for (const flow of FLOWS.filter((f) => f.issue)) {
      gh(["issue", "edit", String(flow.issue), "--repo", REPO, "--title", issueTitle(flow), "--body-file", path.join(dir, `${flow.id}.md`)]);
      console.log(`updated #${flow.issue} ${issueTitle(flow)}`);
    }
  }
}

type ProjectField = { id: string; name: string; options?: { id: string; name: string }[] };

function syncProject() {
  const project = JSON.parse(gh(["project", "view", PROJECT.number, "--owner", PROJECT.owner, "--format", "json"])) as { id: string };
  const fields = (
    JSON.parse(gh(["project", "field-list", PROJECT.number, "--owner", PROJECT.owner, "--format", "json", "--limit", "100"])) as {
      fields: ProjectField[];
    }
  ).fields;
  const items = (
    JSON.parse(gh(["project", "item-list", PROJECT.number, "--owner", PROJECT.owner, "--format", "json", "--limit", "2000"])) as {
      items: ({ id: string; content?: { url?: string } } & Record<string, unknown>)[];
    }
  ).items;

  const setOption = (itemId: string, fieldName: string, value: string) => {
    const field = fields.find((f) => f.name === fieldName);
    const option = field?.options?.find((o) => o.name === value);
    if (!field || !option) throw new Error(`Project has no option "${value}" in field "${fieldName}"`);
    gh(["project", "item-edit", "--id", itemId, "--project-id", project.id, "--field-id", field.id, "--single-select-option-id", option.id]);
  };

  for (const flow of FLOWS.filter((f) => f.issue)) {
    const url = `https://github.com/${REPO}/issues/${flow.issue}`;
    let item = items.find((i) => i.content?.url === url);
    const added = !item;
    if (!item) {
      item = JSON.parse(gh(["project", "item-add", PROJECT.number, "--owner", PROJECT.owner, "--url", url, "--format", "json"])) as {
        id: string;
      };
    }
    // item-list exposes single-select values under the lowercased field name, but gh lowercases
    // byte by byte and mangles accents ("Épico" becomes "\uFFFD\uFFFDpico"), so compare keys
    // on their ASCII letters only.
    const asciiKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, "");
    const current = (name: string) => {
      if (added) return undefined;
      const key = Object.keys(item!).find((k) => asciiKey(k) === asciiKey(name));
      return key ? item![key] : undefined;
    };
    const wanted: Record<string, string> = { ...PROJECT_DEFAULTS, "Épico": flow.projectEpic };
    const set = Object.entries(wanted).filter(([name]) => !current(name));
    for (const [name, value] of set) setOption(item.id, name, value);
    const summary = set.map(([name, value]) => `${name}=${value}`).join(", ") || "already filled";
    console.log(`${added ? "added  " : "present"} #${flow.issue} ${flow.id}  ${summary}`);
  }
}

const mode = process.argv[2];
if (mode === "check") check();
else if (mode === "doc") doc();
else if (mode === "issues") issues(process.argv.slice(3));
else {
  console.error("usage: requirements.ts check | doc | issues [--create] [--update]");
  process.exit(2);
}
