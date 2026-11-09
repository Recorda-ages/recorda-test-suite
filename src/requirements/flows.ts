/**
 * Test flows: requirements grouped by user journey. Each flow is one GitHub issue in
 * Recorda-ages/recorda-test-suite and usually one spec folder under `tests/`.
 *
 * Flows hold only what a user can do or see in the app: requirements verified through the
 * API or manually are left out automatically (they stay in the catalog). Every other
 * requirement belongs to exactly one flow, or to NOT_IN_FLOWS with a reason;
 * `pnpm requirements:check` enforces it.
 */
import { REQUIREMENTS, REQUIREMENTS_BY_ID, type RequirementId, type Verification } from "./catalog.ts";

/** Verification types that belong in a user-flow issue. */
export const FLOW_VERIFICATIONS: ReadonlySet<Verification> = new Set(["web", "native"]);

/** All requirement IDs of a user story, in catalog order. */
function ofStory(us: number): RequirementId[] {
  const ids = REQUIREMENTS.filter((r) => r.us === us).map((r) => r.id);
  if (!ids.length) throw new Error(`No requirements for US ${us}`);
  return ids;
}

export type Flow = {
  id: string;
  title: string;
  /** The journey, from the user's point of view. */
  goal: string;
  /** Where the specs go. */
  folder: string;
  /** Accounts and data the tests need. */
  data: string;
  /** Writes to the backend: tests must be tagged `@mutates` (local stack only). */
  mutates: boolean;
  requirements: readonly RequirementId[];
  /** Issue number in Recorda-ages/recorda-test-suite, once created. */
  issue?: number;
  /** Value of the "Épico" field in the org project (github.com/orgs/Recorda-ages/projects/1). */
  projectEpic: ProjectEpic;
};

/** Options of the "Épico" single-select field in the org project. */
export type ProjectEpic =
  | "Cadastro e Login"
  | "Recorda"
  | "Feed"
  | "Perfil"
  | "Card Insta"
  | "Painel Administrativo"
  | "Rede Social"
  | "Denuncia"
  | "Métricas";

/** Flows as written below, before API and manual requirements are filtered out. */
const DECLARED_FLOWS: readonly Flow[] = [
  {
    id: "FL-01",
    issue: 1,
    title: "Abertura do app e sessão",
    projectEpic: "Cadastro e Login",
    goal:
      "Ao abrir o app, a Splash verifica a sessão salva e leva cada pessoa ao lugar certo " +
      "(Login, Feed ou área administrativa); a sessão sobrevive a reaberturas e termina no logout.",
    folder: "tests/flows/",
    data: "Sessões salvas de gabriel e admin; sessão inválida simulada no localStorage; atraso da API simulado com page.route.",
    mutates: false,
    requirements: [...ofStory(1), "RF-04.6", "RF-04.7", ...ofStory(36), "RNF-04"]
  },
  {
    id: "FL-02",
    issue: 2,
    title: "Login",
    projectEpic: "Cadastro e Login",
    goal: "Uma pessoa já cadastrada entra com usuário e senha e é roteada conforme o tipo de conta.",
    folder: "tests/auth/",
    data: "Contas do seed: gabriel (comum) e admin; começa sem sessão (signedOut).",
    mutates: false,
    requirements: ["RF-04.1", "RF-04.2", "RF-04.3", "RF-04.4", "RF-04.5"]
  },
  {
    id: "FL-03",
    issue: 3,
    title: "Cadastro e onboarding",
    projectEpic: "Cadastro e Login",
    goal:
      "Uma pessoa nova cria a conta, é autenticada automaticamente e escolhe artistas, gêneros e " +
      "música favorita antes de chegar ao Feed.",
    folder: "tests/auth/",
    data: "Usuário novo por teste (username/email únicos com timestamp); conta existente do seed para testar unicidade.",
    mutates: true,
    requirements: [...ofStory(2), ...ofStory(3)]
  },
  {
    id: "FL-04",
    issue: 4,
    title: "Recuperação de senha",
    projectEpic: "Cadastro e Login",
    goal: "Quem esqueceu a senha a redefine informando o email e a nova senha, e entra com ela.",
    folder: "tests/auth/",
    data: "Usuário criado pelo teste (nunca altere a senha das contas do seed).",
    mutates: true,
    requirements: ofStory(5)
  },
  {
    id: "FL-05",
    issue: 5,
    title: "Criação e publicação de Recorda",
    projectEpic: "Recorda",
    goal:
      "A pessoa escolhe a mídia, associa uma música do Deezer, preenche os detalhes (descrição, " +
      "Data da Memória, Local, marcações) e publica; a Recorda aparece no perfil e nos feeds.",
    folder: "tests/recorda-creation/",
    data:
      "Usuário criado pelo teste; mídia de fixture enviada pelo seletor de arquivo (a câmera é nativa); " +
      "Deezer real ou respostas simuladas com page.route para os cenários de erro.",
    mutates: true,
    requirements: [...ofStory(6), ...ofStory(7), ...ofStory(8), ...ofStory(9), "RF-T01"]
  },
  {
    id: "FL-06",
    issue: 6,
    title: "Card de compartilhamento",
    projectEpic: "Card Insta",
    goal: "A partir de uma Recorda, a pessoa gera o card 9:16, escolhe um preset e o exporta.",
    folder: "tests/share/",
    data: "Recorda do seed (foto e vídeo). Exportação para Instagram e galeria é nativa.",
    mutates: false,
    requirements: [...ofStory(10), ...ofStory(11), ...ofStory(12)]
  },
  {
    id: "FL-07",
    issue: 7,
    title: "Feed",
    projectEpic: "Feed",
    goal:
      "A pessoa navega pelas abas Geral e Seguindo, vê os cards certos na ordem certa, carrega " +
      "mais itens e se recupera de erros de rede.",
    folder: "tests/feed/",
    data:
      "gabriel (segue outros perfis do seed); conta privada com e sem follow aprovado; " +
      "usuário novo sem follows para o estado vazio; erros de rede com page.route.",
    mutates: false,
    requirements: [...ofStory(14), ...ofStory(15), ...ofStory(16), ...ofStory(18), "RNF-05"]
  },
  {
    id: "FL-08",
    issue: 8,
    title: "Detalhes da Recorda, curtidas e comentários",
    projectEpic: "Rede Social",
    goal:
      "A pessoa abre uma Recorda, curte, comenta, exclui comentários e usa o menu de três pontos " +
      "conforme a Recorda seja sua ou de outra pessoa.",
    folder: "tests/recorda-details/",
    data: "Recordas do seed; usuários criados pelo teste para curtidas e comentários (conteúdo único por teste).",
    mutates: true,
    requirements: [...ofStory(17), ...ofStory(23), ...ofStory(24), ...ofStory(25)]
  },
  {
    id: "FL-09",
    issue: 9,
    title: "Busca, seguir e rede de seguidores",
    projectEpic: "Rede Social",
    goal:
      "A pessoa encontra outras pelo username ou pelas sugestões por afinidade, segue, pede para " +
      "seguir contas privadas e gerencia seguidores e seguindo.",
    folder: "tests/social/",
    data: "Dois ou mais usuários criados pelo teste (um público, um privado); perfis do seed para busca e sugestões.",
    mutates: true,
    requirements: [
      ...ofStory(19),
      ...ofStory(20),
      "RF-21.2",
      "RF-21.3",
      "RF-21.4",
      ...ofStory(22),
      ...ofStory(27)
    ]
  },
  {
    id: "FL-10",
    issue: 10,
    title: "Notificações",
    projectEpic: "Rede Social",
    goal:
      "A pessoa é avisada de seguidores, solicitações, curtidas, comentários e marcações, resolve " +
      "solicitações na própria lista e navega até o conteúdo.",
    folder: "tests/notifications/",
    data: "Usuários criados pelo teste que geram as ações pela API (fixture api) antes de abrir a tela.",
    mutates: true,
    requirements: ["RF-21.1", ...ofStory(26)]
  },
  {
    id: "FL-11",
    issue: 11,
    title: "Perfil pessoal e de terceiros",
    projectEpic: "Perfil",
    goal:
      "A pessoa vê e administra o próprio perfil (avatar, grade, streak) e abre perfis de outras " +
      "pessoas, vendo só o que a privacidade permite.",
    folder: "tests/profile/",
    data: "gabriel e perfis do seed (públicos e privados); usuário criado pelo teste para avatar e streak.",
    mutates: true,
    requirements: [...ofStory(28), ...ofStory(29), ...ofStory(35)]
  },
  {
    id: "FL-12",
    issue: 12,
    title: "Configurações, preferências e conta",
    projectEpic: "Perfil",
    goal:
      "Nas Configurações, a pessoa muda privacidade, preferências musicais, idioma e dados da " +
      "conta, ou exclui a conta.",
    folder: "tests/settings/",
    data: "Usuário criado pelo teste (privacidade, senha e exclusão alteram a conta).",
    mutates: true,
    requirements: [...ofStory(31), ...ofStory(32), ...ofStory(33), ...ofStory(34), "RNF-02"]
  },
  {
    id: "FL-13",
    issue: 13,
    title: "Memórias: calendário, métricas e retrospectiva",
    projectEpic: "Métricas",
    goal:
      "No perfil, a pessoa revisita as memórias no calendário, acompanha métricas por período e " +
      "abre a retrospectiva do mês ou do ano.",
    folder: "tests/memories/",
    data: "gabriel (tem Recordas no seed); usuário novo para estados vazios; datas no fuso America/Sao_Paulo.",
    mutates: false,
    requirements: [...ofStory(37), ...ofStory(38), ...ofStory(39), "RNF-06"]
  },
  {
    id: "FL-14",
    issue: 14,
    title: "Denúncias",
    projectEpic: "Denuncia",
    goal: "A pessoa denuncia uma Recorda ou um perfil, com justificativa, sem poder repetir a denúncia.",
    folder: "tests/reports/",
    data: "Usuário criado pelo teste denunciando Recordas e perfis do seed.",
    mutates: true,
    requirements: [...ofStory(40), ...ofStory(41)]
  },
  {
    id: "FL-15",
    issue: 15,
    title: "Moderação administrativa",
    projectEpic: "Painel Administrativo",
    goal:
      "O administrador analisa denúncias, remove Recordas, suspende e reativa contas e consulta a " +
      "auditoria; o autor é notificado da remoção.",
    folder: "tests/admin/",
    data: "admin do seed; usuários e Recordas criados pelo teste como alvos (nunca modere as contas do seed).",
    mutates: true,
    requirements: [...ofStory(44), ...ofStory(45), ...ofStory(46), ...ofStory(47), ...ofStory(42)]
  }
];

/** Requirements no E2E flow can prove, and why. */
export const FLOWS: readonly Flow[] = DECLARED_FLOWS.map((flow) => ({
  ...flow,
  requirements: flow.requirements.filter((id) => FLOW_VERIFICATIONS.has(REQUIREMENTS_BY_ID.get(id)!.verification))
}));

/** User-flow (web/native) requirements that still don't fit any flow, and why. */
export const NOT_IN_FLOWS: Readonly<Partial<Record<RequirementId, string>>> = {
  "RNF-01": "Execução em iOS e Android: é uma propriedade do app inteiro, para teste nativo (ex.: Maestro)."
};
