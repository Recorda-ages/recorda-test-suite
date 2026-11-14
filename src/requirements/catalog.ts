/**
 * Requirements catalog: the single source of truth for requirement IDs.
 *
 * Built from the project charter (Termo de Abertura, 2026/2) and the Epics / User Stories in
 * the GitHub issues of Recorda-ages/recorda-frontend and recorda-backend (snapshot of
 * 2026-11-08). `docs/REQUIREMENTS.md` is generated from this file: `pnpm requirements:doc`.
 *
 * IDs
 * - `RF-<US>.<n>`: functional requirement = acceptance criterion n of user story <US>.
 * - `RF-T<n>`:     functional requirement from the charter with no user story yet.
 * - `RNF-<n>`:     non-functional requirement.
 *
 * Never renumber an ID that tests reference: add new ones at the end of a story instead.
 * Requirement text is in Portuguese, like the issues it comes from.
 */

export const EPICS = {
  E2: "Autenticação, cadastro e onboarding",
  E3: "Criação e publicação de Recordas",
  E4: "Feed",
  E5: "Interações sociais",
  E6: "Perfil e configurações",
  E7: "Memórias e estatísticas",
  E8: "Compartilhamento de cards",
  E9: "Denúncias",
  E10: "Administração e moderação",
  TA: "Termo de Abertura (sem User Story)",
  NF: "Requisitos não funcionais"
} as const;

export type EpicId = keyof typeof EPICS;

type Repo = "frontend" | "backend";
type Issue = { repo: Repo; number: number };

/**
 * `implemented`: the user story issue is closed (not the same as verified by a test).
 * `in-progress`: the issue is still open. `no-story`: only in the charter.
 */
export type Status = "implemented" | "in-progress" | "no-story";

export const USER_STORIES = {
  1: { epic: "E2", title: "Visualização da Splash Screen", issue: { repo: "frontend", number: 2 }, status: "implemented" },
  2: { epic: "E2", title: "Cadastro de Usuário", issue: { repo: "frontend", number: 31 }, status: "implemented" },
  3: { epic: "E2", title: "Onboarding e Preferências Musicais", issue: { repo: "frontend", number: 53 }, status: "implemented" },
  4: { epic: "E2", title: "Autenticação de Usuário", issue: { repo: "frontend", number: 112 }, status: "implemented" },
  5: { epic: "E2", title: "Recuperação de Senha", issue: { repo: "frontend", number: 113 }, status: "implemented" },
  6: { epic: "E3", title: "Captura e Seleção de Mídia", issue: { repo: "frontend", number: 62 }, status: "implemented" },
  7: { epic: "E3", title: "Busca e Associação da Música", issue: { repo: "frontend", number: 69 }, status: "implemented" },
  8: { epic: "E3", title: "Detalhes da Recorda", issue: { repo: "frontend", number: 76 }, status: "implemented" },
  9: { epic: "E3", title: "Publicação da Recorda", issue: { repo: "frontend", number: 84 }, status: "implemented" },
  10: { epic: "E8", title: "Geração Base do Card Visual", issue: { repo: "frontend", number: 199 }, status: "implemented" },
  11: { epic: "E8", title: "Presets", issue: { repo: "frontend", number: 201 }, status: "implemented" },
  12: { epic: "E8", title: "Exportação", issue: { repo: "frontend", number: 203 }, status: "implemented" },
  14: { epic: "E4", title: "Feed: Aba Seguindo", issue: { repo: "frontend", number: 158 }, status: "implemented" },
  15: { epic: "E4", title: "Feed: Aba Geral", issue: { repo: "frontend", number: 161 }, status: "implemented" },
  16: { epic: "E4", title: "Reprodução Automática", issue: { repo: "frontend", number: 165 }, status: "implemented" },
  17: { epic: "E4", title: "Detalhes da Recorda (feed)", issue: { repo: "frontend", number: 167 }, status: "implemented" },
  18: { epic: "E4", title: "Carregamento Progressivo", issue: { repo: "frontend", number: 171 }, status: "implemented" },
  19: { epic: "E5", title: "Busca de Usuários", issue: { repo: "frontend", number: 173 }, status: "implemented" },
  20: { epic: "E5", title: "Sistema de Seguidores", issue: { repo: "frontend", number: 176 }, status: "implemented" },
  21: { epic: "E5", title: "Solicitações para Seguir", issue: { repo: "frontend", number: 179 }, status: "implemented" },
  22: { epic: "E5", title: "Gerenciamento de Seguidores", issue: { repo: "frontend", number: 181 }, status: "implemented" },
  23: { epic: "E5", title: "Curtir uma Recorda", issue: { repo: "frontend", number: 184 }, status: "implemented" },
  24: { epic: "E5", title: "Comentários", issue: { repo: "frontend", number: 187 }, status: "implemented" },
  25: { epic: "E5", title: "Excluir Comentário", issue: { repo: "frontend", number: 190 }, status: "implemented" },
  26: { epic: "E5", title: "Central de Notificações", issue: { repo: "frontend", number: 193 }, status: "implemented" },
  27: { epic: "E5", title: "Sugestões por Afinidade", issue: { repo: "frontend", number: 196 }, status: "implemented" },
  28: { epic: "E6", title: "Perfil pessoal", issue: { repo: "backend", number: 117 }, status: "in-progress" },
  29: { epic: "E6", title: "Perfil de terceiros", issue: { repo: "backend", number: 118 }, status: "in-progress" },
  31: { epic: "E6", title: "Editar preferências musicais", issue: { repo: "backend", number: 119 }, status: "implemented" },
  32: { epic: "E6", title: "Configurações e privacidade", issue: { repo: "backend", number: 120 }, status: "implemented" },
  33: { epic: "E6", title: "Idioma da conta e do aparelho", issue: { repo: "backend", number: 121 }, status: "implemented" },
  34: { epic: "E6", title: "Gerenciar conta", issue: { repo: "backend", number: 122 }, status: "implemented" },
  35: { epic: "E6", title: "Streak de publicações", issue: { repo: "backend", number: 123 }, status: "in-progress" },
  36: { epic: "E6", title: "Logout", issue: { repo: "backend", number: 124 }, status: "implemented" },
  37: { epic: "E7", title: "Calendário de Memórias", issue: { repo: "frontend", number: 278 }, status: "in-progress" },
  38: { epic: "E7", title: "Métricas e Estatísticas Pessoais", issue: { repo: "frontend", number: 279 }, status: "in-progress" },
  39: { epic: "E7", title: "Retrospectiva Musical de Período", issue: { repo: "frontend", number: 280 }, status: "in-progress" },
  40: { epic: "E9", title: "Denúncia de Recorda", issue: { repo: "frontend", number: 222 }, status: "implemented" },
  41: { epic: "E9", title: "Denúncia de Perfil de Usuário", issue: { repo: "frontend", number: 223 }, status: "implemented" },
  42: { epic: "E9", title: "Notificação ao Autor sobre Remoção de Conteúdo", issue: { repo: "frontend", number: 240 }, status: "implemented" },
  44: { epic: "E10", title: "Visualização e Gestão de Denúncias", issue: { repo: "frontend", number: 224 }, status: "implemented" },
  45: { epic: "E10", title: "Moderação e Remoção de Recordas", issue: { repo: "frontend", number: 225 }, status: "implemented" },
  46: { epic: "E10", title: "Moderação de Usuários (Suspensão e Reativação)", issue: { repo: "frontend", number: 226 }, status: "implemented" },
  47: { epic: "E10", title: "Log de Auditoria", issue: { repo: "frontend", number: 227 }, status: "implemented" }
} as const satisfies Record<number, { epic: EpicId; title: string; issue: Issue; status: Status }>;

export type UserStoryNumber = keyof typeof USER_STORIES;

/**
 * How the requirement can be verified by this suite (web build + real backend):
 * - `web`:    through the web UI.
 * - `api`:    through the backend API (`api` fixture); the UI can't observe it on web.
 * - `native`: needs a device (camera, gallery, permissions, Instagram, background audio).
 * - `manual`: visual/design judgement or out of reach of automation.
 */
export type Verification = "web" | "api" | "native" | "manual";

export type Requirement = {
  id: string;
  /** Owning user story; `null` for charter-only and non-functional requirements. */
  us: UserStoryNumber | null;
  epic: EpicId;
  text: string;
  verification: Verification;
  /** Where it was stated or decided, besides the user story issue. */
  source?: string;
  /** Known gap: decided, but the current code doesn't meet it yet. */
  gap?: string;
};

const req = <const Id extends string>(
  id: Id,
  us: UserStoryNumber,
  text: string,
  verification: Verification,
  extra: { source?: string; gap?: string } = {}
) => ({ id, us, epic: USER_STORIES[us].epic as EpicId, text, verification, ...extra }) as const;

const DECIDED = "Decisão do time, 2026-11-08";
const MEMORY_FIELDS_GAP = "Não implementado: o model recorda não tem Data da Memória, Local nem marcações.";

export const REQUIREMENTS = [
  // ── E2 · US 1 — Splash Screen ────────────────────────────────────────────────────────────
  req("RF-01.1", 1, "Exibir a Splash Screen com a identidade visual (fundo escuro, logo) conforme os protótipos do Figma.", "manual"),
  req("RF-01.2", 1, "A Splash Screen é obrigatoriamente a primeira etapa ao abrir o aplicativo.", "web"),
  req("RF-01.3", 1, "Sem sessão salva, a Splash encaminha para o Login.", "web"),
  req("RF-01.4", 1, "Com sessão válida de conta comum, a Splash encaminha para o Feed.", "web"),
  req("RF-01.5", 1, "Com sessão válida de administrador, a Splash encaminha para a área administrativa, sem acesso a Feed, Perfil ou Criar Recorda.", "web"),
  req("RF-01.6", 1, "Sessão inválida ou expirada é apagada e o usuário vai para o Login.", "web"),
  req("RF-01.7", 1, "Se a verificação de sessão demorar mais que 3 s, o app segue para o Login; uma resposta tardia nunca causa uma segunda navegação.", "web", {
    source: `${DECIDED}: 3 s é o valor correto.`,
    gap: "O código usa 5 s (SPLASH_TIMEOUT_MS em recorda-frontend/src/features/splash/screens/SplashScreen.tsx)."
  }),

  // ── E2 · US 2 — Cadastro ─────────────────────────────────────────────────────────────────
  req("RF-02.1", 2, "A tela de Cadastro tem exatamente os campos Nome, Username, Email e Senha, sem confirmação de senha nem aceite de termos.", "web"),
  req("RF-02.2", 2, "Username e email são únicos no sistema.", "web"),
  req("RF-02.3", 2, "Todos os campos são validados antes do registro, com mensagens de erro específicas por campo.", "web"),
  req("RF-02.4", 2, "A senha tem no mínimo 8 caracteres.", "web"),
  req("RF-02.5", 2, "Após o cadastro, o usuário é autenticado automaticamente e encaminhado ao Onboarding, nunca direto ao Feed.", "web"),
  req("RF-02.6", 2, "Não são coletados dados além dos necessários ao funcionamento da conta.", "manual"),
  req("RF-02.7", 2, "Contas de administrador não podem ser criadas pelo cadastro.", "api"),

  // ── E2 · US 3 — Onboarding ───────────────────────────────────────────────────────────────
  req("RF-03.1", 3, "Imediatamente após o cadastro, o app conduz o usuário ao Onboarding.", "web"),
  req("RF-03.2", 3, "O Onboarding tem três passos (artistas, gêneros e música favorita) com dados do Deezer, e o indicador de progresso reflete os três passos.", "web"),
  req("RF-03.3", 3, "Cada passo exibe um grid de opções selecionáveis (chips).", "web"),
  req("RF-03.4", 3, "É preciso selecionar no mínimo 3 artistas e 3 gêneros para prosseguir, e exatamente 1 música favorita.", "web"),
  req("RF-03.5", 3, "Artistas e gêneros formam o Perfil Musical, única fonte da Afinidade Musical.", "api"),
  req("RF-03.6", 3, "A Música Favorita não participa da Afinidade Musical e aparece em destaque no cabeçalho do Perfil Pessoal.", "web"),
  req("RF-03.7", 3, "É possível voltar ao passo anterior sem perder as seleções.", "web"),

  // ── E2 · US 4 — Autenticação ─────────────────────────────────────────────────────────────
  req("RF-04.1", 4, "A tela de Login tem os campos Usuário e Senha e é a mesma para usuários comuns e administradores.", "web"),
  req("RF-04.2", 4, "As credenciais são validadas no backend, que retorna também o tipo de conta.", "api"),
  req("RF-04.3", 4, "Credenciais inválidas exibem uma única mensagem genérica, sem revelar qual campo está incorreto.", "web"),
  req("RF-04.4", 4, "Administradores são roteados para a área administrativa, sem acesso à navegação do app comum.", "web"),
  req("RF-04.5", 4, "Usuários comuns são roteados para o Feed.", "web"),
  req("RF-04.6", 4, "A sessão é persistida no dispositivo: reabrir o app não exige novo login.", "web"),
  req("RF-04.7", 4, "Não há expiração de sessão por inatividade; a sessão dura até o token expirar.", "api"),

  // ── E2 · US 5 — Recuperação de senha ─────────────────────────────────────────────────────
  req("RF-05.1", 5, "A tela Recuperar Senha tem os campos Email, Nova Senha e Confirmar Senha e o botão Redefinir Senha.", "web"),
  req("RF-05.2", 5, "Nova Senha e Confirmar Senha devem ser idênticas e ter no mínimo 8 caracteres.", "web"),
  req("RF-05.3", 5, "A senha da conta com o email informado é substituída diretamente, sem email nem token de verificação.", "web"),
  req("RF-05.4", 5, "Email sem conta exibe o mesmo erro genérico das outras falhas, sem confirmar a existência da conta.", "web"),

  // ── E3 · US 6 — Mídia ────────────────────────────────────────────────────────────────────
  req("RF-06.1", 6, "A tela Criar Recorda é acessível pela barra inferior e tem visor de câmera e botão central de captura.", "web"),
  req("RF-06.2", 6, "Ao entrar na tela, a câmera abre diretamente (prioridade sobre a galeria).", "native"),
  req("RF-06.3", 6, "É possível capturar mídia em tempo real ou selecioná-la da galeria.", "native"),
  req("RF-06.4", 6, "Cada Recorda tem exatamente uma foto ou um vídeo.", "api"),
  req("RF-06.5", 6, "Permissões de câmera e galeria são pedidas em runtime, com mensagem e atalho para as configurações quando negadas.", "native"),
  req("RF-06.6", 6, "Vídeos têm duração máxima (proposta: 60 s) e são comprimidos antes do upload.", "native"),

  // ── E3 · US 7 — Música ───────────────────────────────────────────────────────────────────
  req("RF-07.1", 7, "O campo Música abre um buscador do Deezer que retorna faixa, artista, álbum, gênero e capa.", "web"),
  req("RF-07.2", 7, "A busca funciona por nome de música, artista ou álbum.", "web"),
  req("RF-07.3", 7, "É possível ouvir o preview de 30 s de um resultado antes de confirmar.", "native"),
  req("RF-07.4", 7, "A publicação é associada a uma música específica.", "web"),
  req("RF-07.5", 7, "É persistido o identificador da faixa no Deezer, nunca a URL do preview.", "api"),
  req("RF-07.6", 7, "Indisponibilidade da API de música é tratada com opção de tentar novamente.", "web"),

  // ── E3 · US 8 — Detalhes da Recorda (criação) ────────────────────────────────────────────
  req("RF-08.1", 8, "Uma única tela mostra o preview da mídia com capa, título e artista da música sobrepostos e um campo de descrição.", "web"),
  req("RF-08.2", 8, "A descrição é opcional, com limite de 2200 caracteres.", "web"),
  req("RF-08.3", 8, "A música vem preenchida e não é editável nesta tela.", "web"),
  req("RF-08.4", 8, "Publicar só fica habilitado com a música associada.", "web"),
  req("RF-08.5", 8, "A tela de detalhes permite informar a Data da Memória (quando o momento aconteceu).", "web", { source: `${DECIDED}: obrigatório implementar.`, gap: MEMORY_FIELDS_GAP }),
  req("RF-08.6", 8, "A tela de detalhes permite informar o Local da memória.", "web", { source: `${DECIDED}: obrigatório implementar.`, gap: MEMORY_FIELDS_GAP }),
  req("RF-08.7", 8, "A tela de detalhes permite marcar outros usuários na Recorda.", "web", { source: `${DECIDED}: obrigatório implementar; Termo: marcação de amigos.`, gap: MEMORY_FIELDS_GAP }),

  // ── E3 · US 9 — Publicação ───────────────────────────────────────────────────────────────
  req("RF-09.1", 9, "A Recorda é composta por mídia, música, descrição opcional, Data da Memória, Local e marcações.", "api", { source: `${DECIDED}: Data da Memória, Local e marcações voltam ao escopo.`, gap: MEMORY_FIELDS_GAP }),
  req("RF-09.2", 9, "A visibilidade não é escolhida na publicação: deriva da privacidade da conta, sem seletor nem campo por publicação.", "web"),
  req("RF-09.3", 9, "A Data de Publicação é registrada automaticamente.", "api"),
  req("RF-09.4", 9, "Após publicar, a Recorda aparece imediatamente no perfil do autor e fica disponível aos feeds conforme a visibilidade da conta.", "web"),
  req("RF-09.5", 9, "Há indicador de progresso no upload e, em caso de falha, é possível tentar novamente sem perder os dados nem recapturar a mídia.", "web"),
  req("RF-09.6", 9, "Usuários marcados são notificados da marcação.", "web", { source: `${DECIDED}; US 26.`, gap: MEMORY_FIELDS_GAP }),

  // ── E8 · US 10–12 — Card de compartilhamento ─────────────────────────────────────────────
  req("RF-10.1", 10, "A partir da tela de detalhes há a interface Compartilhar Recorda.", "web"),
  req("RF-10.2", 10, "O card é uma imagem na proporção 9:16 (Stories).", "web"),
  req("RF-10.3", 10, "O card contém a mídia, a identidade visual do app e capa e nome da música.", "manual"),
  req("RF-10.4", 10, "Para vídeos, o card usa o primeiro quadro: o resultado é sempre uma imagem estática.", "web"),
  req("RF-10.5", 10, "A geração ocorre no dispositivo, com indicador de progresso.", "web"),
  req("RF-11.1", 11, "Os presets aparecem como lista horizontal rolável abaixo do card.", "web"),
  req("RF-11.2", 11, "É possível alternar entre 3 presets pré-definidos.", "web"),
  req("RF-11.3", 11, "Os presets respeitam a marca (tons de verde e fundo escuro).", "manual"),
  req("RF-11.4", 11, "O card é atualizado em tempo real conforme o preset selecionado.", "web"),
  req("RF-11.5", 11, "O card exportado é sempre vertical (9:16).", "web"),
  req("RF-12.1", 12, "A interface oferece botões de ação para compartilhamento.", "web"),
  req("RF-12.2", 12, "O compartilhamento aciona a intent específica do Instagram Stories.", "native"),
  req("RF-12.3", 12, "É possível baixar o card para a galeria do dispositivo.", "native"),
  req("RF-12.4", 12, "Sem Instagram instalado, há tratamento de erro e compartilhamento genérico do sistema.", "native"),
  req("RF-12.5", 12, "O download pede permissão de escrita na galeria, com tratamento para negação.", "native"),
  req("RF-12.6", 12, "Há confirmação visual de conclusão.", "native"),

  // ── E4 · US 14 — Feed Seguindo ───────────────────────────────────────────────────────────
  req("RF-14.1", 14, "A aba Seguindo é uma das duas abas superiores do Feed (com Geral), acessível pela barra inferior.", "web"),
  req("RF-14.2", 14, "Os cards mostram avatar e username do autor, mídia, música (título, artista e capa), descrição e as ações Curtir, Comentar e Denunciar.", "web"),
  req("RF-14.3", 14, "A aba lista apenas Recordas de quem o usuário segue, da mais recente para a mais antiga.", "web"),
  req("RF-14.4", 14, "Só aparecem Recordas de autores com conta pública ou que aprovaram a solicitação de seguir; não é preciso seguir mutuamente.", "web"),
  req("RF-14.5", 14, "O estado vazio orienta a seguir perfis ou criar a primeira Recorda.", "web"),

  // ── E4 · US 15 — Feed Geral ──────────────────────────────────────────────────────────────
  req("RF-15.1", 15, "A aba Geral é a aba padrão ao abrir o Feed.", "web"),
  req("RF-15.2", 15, "A aba Geral une, por recência, as Recordas de quem o usuário segue e Recordas públicas de perfis não seguidos com Afinidade Musical maior que zero.", "web"),
  req("RF-15.3", 15, "A Afinidade Musical decide só a elegibilidade dos itens de descoberta, não a ordenação.", "api"),
  req("RF-15.4", 15, "A Afinidade Musical usa apenas artistas e gêneros do onboarding; nenhum dado comportamental entra no cálculo.", "api"),
  req("RF-15.5", 15, "Recordas restritas a seguidores só aparecem para seguidores aprovados.", "web"),
  req("RF-15.6", 15, "Sem itens de descoberta elegíveis, a aba exibe as Recordas de quem o usuário segue.", "web"),

  // ── E4 · US 16 — Reprodução automática ───────────────────────────────────────────────────
  req("RF-16.1", 16, "Ao entrar em foco no scroll, em qualquer aba, a Recorda toca automaticamente o preview de 30 s.", "native"),
  req("RF-16.2", 16, "Apenas uma Recorda toca por vez; ao sair de foco, a reprodução para.", "native"),
  req("RF-16.3", 16, "O preview reinicia em loop enquanto a Recorda estiver em foco.", "native"),
  req("RF-16.4", 16, "Vídeos são sempre exibidos sem som; só a música emite áudio.", "web"),
  req("RF-16.5", 16, "Há um controle visível para silenciar/reativar, e a escolha persiste durante a sessão.", "web"),
  req("RF-16.6", 16, "Ao sair da tela ou minimizar o app, o áudio para.", "native"),

  // ── E4 · US 17 — Detalhes da Recorda ─────────────────────────────────────────────────────
  req("RF-17.1", 17, "Tocar num card do feed ou numa miniatura do perfil abre a tela Detalhes da Recorda.", "web"),
  req("RF-17.2", 17, "A tela mostra mídia, avatar e username do autor, relato completo, música, Data da Memória, Local, marcações e comentários.", "web", { gap: MEMORY_FIELDS_GAP }),
  req("RF-17.3", 17, "A música continua tocando na transição do feed para os detalhes, sem reiniciar.", "native"),
  req("RF-17.4", 17, "A tela oferece curtir, comentar e compartilhar.", "web"),
  req("RF-17.5", 17, "O menu de três pontos oferece só excluir na própria Recorda e só denunciar na de outra pessoa; não há edição.", "web"),

  // ── E4 · US 18 — Carregamento progressivo ────────────────────────────────────────────────
  req("RF-18.1", 18, "O feed carrega em páginas, buscando mais itens perto do fim da lista.", "web"),
  req("RF-18.2", 18, "Há pull-to-refresh nas duas abas.", "native"),
  req("RF-18.3", 18, "Há indicador de carregamento e tratamento de erro de rede com opção de tentar novamente.", "web"),
  req("RF-18.4", 18, "A posição de rolagem e o estado de reprodução são preservados ao alternar entre Geral e Seguindo.", "web"),

  // ── E5 · US 19 — Busca de usuários ───────────────────────────────────────────────────────
  req("RF-19.1", 19, "É possível buscar usuários por username.", "web"),
  req("RF-19.2", 19, "Os resultados mostram avatar, username e o estado da relação (seguindo, solicitado ou nenhuma).", "web"),
  req("RF-19.3", 19, "Tocar num resultado abre o perfil do usuário.", "web"),
  req("RF-19.4", 19, "Perfis privados aparecem na busca, mas o conteúdo continua protegido.", "web"),

  // ── E5 · US 20 — Seguir ──────────────────────────────────────────────────────────────────
  req("RF-20.1", 20, "O perfil de terceiros tem um botão primário Seguir.", "web"),
  req("RF-20.2", 20, "Seguir uma conta pública é efetivado imediatamente.", "web"),
  req("RF-20.3", 20, "Seguir uma conta privada cria uma solicitação (estado Solicitado) e notifica o alvo.", "web"),
  req("RF-20.4", 20, "A relação é assimétrica: seguir não implica ser seguido.", "api"),
  req("RF-20.5", 20, "É possível deixar de seguir a qualquer momento, sem confirmação nem notificação ao outro lado.", "web"),
  req("RF-20.6", 20, "Não é possível seguir a si mesmo nem enviar solicitação duplicada.", "api"),

  // ── E5 · US 21 — Solicitações para seguir ────────────────────────────────────────────────
  req("RF-21.1", 21, "As solicitações recebidas são acessíveis pela central de notificações.", "web"),
  req("RF-21.2", 21, "Ao aceitar, o solicitante passa a ver as Recordas imediatamente e é notificado da aprovação.", "web"),
  req("RF-21.3", 21, "Ao recusar, a solicitação é descartada sem notificar o solicitante.", "web"),
  req("RF-21.4", 21, "Quem enviou uma solicitação pendente pode cancelá-la.", "web"),

  // ── E5 · US 22 — Gerenciar seguidores ────────────────────────────────────────────────────
  req("RF-22.1", 22, "O perfil dá acesso às listas de Seguidores e Seguindo, com busca em cada lista.", "web"),
  req("RF-22.2", 22, "É possível remover um seguidor, sem notificá-lo; em conta privada ele precisa solicitar de novo.", "web"),
  req("RF-22.3", 22, "Em conta privada, só seguidores aprovados veem as listas.", "web"),

  // ── E5 · US 23 — Curtir ──────────────────────────────────────────────────────────────────
  req("RF-23.1", 23, "Os cards do feed e a tela de detalhes têm o botão de curtir.", "web"),
  req("RF-23.2", 23, "Curtir alterna entre curtido e não curtido, com resposta visual imediata e reconciliação com o servidor.", "web"),
  req("RF-23.3", 23, "A Recorda exibe a contagem de curtidas.", "web"),
  req("RF-23.4", 23, "O autor é notificado das curtidas, exceto das próprias.", "web"),

  // ── E5 · US 24 — Comentários ─────────────────────────────────────────────────────────────
  req("RF-24.1", 24, "A tela de detalhes lista os comentários e tem um campo para escrever um novo.", "web"),
  req("RF-24.2", 24, "Os comentários são uma lista plana por data de criação, sem respostas nem curtidas.", "web"),
  req("RF-24.3", 24, "Cada comentário mostra avatar, username, texto e data.", "web"),
  req("RF-24.4", 24, "Comentários têm no máximo 500 caracteres.", "web"),
  req("RF-24.5", 24, "Só comenta quem tem permissão para ver a Recorda.", "api"),
  req("RF-24.6", 24, "O autor da Recorda é notificado de novos comentários.", "web"),

  // ── E5 · US 25 — Excluir comentário ──────────────────────────────────────────────────────
  req("RF-25.1", 25, "O autor do comentário pode excluí-lo.", "web"),
  req("RF-25.2", 25, "O autor da Recorda pode excluir qualquer comentário dela.", "web"),
  req("RF-25.3", 25, "A exclusão pede confirmação e vale imediatamente para todos.", "web"),

  // ── E5 · US 26 — Notificações ────────────────────────────────────────────────────────────
  req("RF-26.1", 26, "O cabeçalho do Feed tem um sino que abre as notificações.", "web"),
  req("RF-26.2", 26, "A lista mostra o histórico recente, do mais novo ao mais antigo, com ícone do autor da ação, descrição e ação opcional.", "web"),
  req("RF-26.3", 26, "Geram notificação: novo seguidor, solicitação recebida, solicitação aprovada, curtida, comentário e marcação.", "web"),
  req("RF-26.4", 26, "Solicitações para seguir podem ser aceitas ou recusadas na própria lista.", "web"),
  req("RF-26.5", 26, "O sino mostra o contador de não lidas, e abrir a lista marca todas como lidas.", "web"),
  req("RF-26.6", 26, "Tocar numa notificação leva ao conteúdo relacionado.", "web"),

  // ── E5 · US 27 — Sugestões ───────────────────────────────────────────────────────────────
  req("RF-27.1", 27, "A busca exibe perfis sugeridos ordenados por Afinidade Musical.", "web"),
  req("RF-27.2", 27, "Ficam de fora perfis já seguidos, solicitações pendentes e o próprio usuário.", "web"),
  req("RF-27.3", 27, "Cada sugestão mostra avatar, username, gêneros/artistas em comum e a ação de seguir.", "web"),

  // ── E6 · US 28 — Perfil pessoal ──────────────────────────────────────────────────────────
  req("RF-28.1", 28, "O perfil mostra nome, username, avatar, contadores, uma única streak, música favorita e chips de artistas e gêneros.", "web"),
  req("RF-28.2", 28, "É possível trocar e remover o avatar.", "web", {
    gap: "Só no build web: trocar o avatar não envia nada, porque profileService.uploadAvatar (recorda-frontend/src/features/profile/services/profileService.ts) usa File do expo-file-system, sem suporte no web. No app (Expo Go) a troca funciona; remover funciona nas duas plataformas."
  }),
  req("RF-28.3", 28, "O perfil mostra a grade paginada das próprias Recordas.", "web"),
  req("RF-28.4", 28, "O perfil mantém as abas Recordas, Métricas e Calendário.", "web"),

  // ── E6 · US 29 — Perfil de terceiros ─────────────────────────────────────────────────────
  req("RF-29.1", 29, "Perfil público, ou com follow aprovado, mostra cabeçalho, contadores e conteúdo.", "web"),
  req("RF-29.2", 29, "Perfil privado sem aprovação mostra nome, username, streak e música, oculta contadores e Recordas e mantém as três abas com aviso de restrição.", "web"),

  // ── E6 · US 31 — Editar preferências musicais ────────────────────────────────────────────
  req("RF-31.1", 31, "A edição abre com as escolhas atuais selecionadas.", "web"),
  req("RF-31.2", 31, "Salvar exige no mínimo 3 artistas e 3 gêneros e exatamente uma música.", "web"),
  req("RF-31.3", 31, "Preferências atualizadas refletem no perfil, nas sugestões e no feed.", "web"),

  // ── E6 · US 32 — Configurações e privacidade ─────────────────────────────────────────────
  req("RF-32.1", 32, "É possível alternar entre conta pública e privada, com confirmação e efeito imediato.", "web"),
  req("RF-32.2", 32, "Ao tornar a conta pública, todos os pedidos pendentes são aceitos na mesma transação e cada solicitante é notificado.", "web"),
  req("RF-32.3", 32, "As Configurações dão acesso a Minha conta, preferências musicais, idioma e logout.", "web"),

  // ── E6 · US 33 — Idioma ──────────────────────────────────────────────────────────────────
  req("RF-33.1", 33, "Português, inglês e espanhol podem ser escolhidos com efeito imediato.", "web"),
  req("RF-33.2", 33, "Antes do login vale a preferência local; após autenticar prevalece o idioma da conta, que também é gravado no aparelho.", "web"),

  // ── E6 · US 34 — Gerenciar conta ─────────────────────────────────────────────────────────
  req("RF-34.1", 34, "É possível editar nome, username e email; o email muda após validar formato e unicidade, sem link de confirmação.", "web"),
  req("RF-34.2", 34, "A senha é opcional e só muda com Nova senha e Repetir nova senha preenchidas e iguais, sem pedir a senha atual.", "web"),
  req("RF-34.3", 34, "Excluir a conta pede confirmação (Cancelar/Excluir) e aplica exclusão lógica sem anonimização.", "web"),

  // ── E6 · US 35 — Streak ──────────────────────────────────────────────────────────────────
  req("RF-35.1", 35, "Só contam para a streak dias com pelo menos uma Recorda publicada, pela data de publicação.", "api"),
  req("RF-35.2", 35, "Curtidas, comentários e outras ações não contam. Só contam Recordas ativas: excluir a única Recorda de um dia tira esse dia da streak (regra da US 38).", "api", {
    source: `${DECIDED}: seguir a US 38, que substitui o critério original da US 35.`,
    gap: "A streak do perfil inclui Recordas excluídas (list_publication_times em recorda-backend/app/repositories/recorda_repository.py), enquanto a de Métricas já as exclui."
  }),
  req("RF-35.3", 35, "O perfil mostra apenas um indicador de streak.", "web"),

  // ── E6 · US 36 — Logout ──────────────────────────────────────────────────────────────────
  req("RF-36.1", 36, "Sair pede confirmação.", "web"),
  req("RF-36.2", 36, "Ao confirmar, a sessão e os dados em memória são limpos, o app vai para o Login e o idioma local do aparelho é preservado.", "web"),

  // ── E7 · US 37 — Calendário de memórias ──────────────────────────────────────────────────
  req("RF-37.1", 37, "A aba Calendário mostra uma grade mensal de 7 colunas (domingo a sábado) calculada no fuso de São Paulo.", "web"),
  req("RF-37.2", 37, "Dias com publicações mostram a miniatura da primeira Recorda do dia.", "web"),
  req("RF-37.3", 37, "O número do dia fica legível sobre a miniatura (gradiente e sombra).", "manual"),
  req("RF-37.4", 37, "Dias com mais de uma Recorda mostram o indicador +N.", "web"),
  req("RF-37.5", 37, "Dias sem publicações aparecem em estilo escuro, sem miniatura.", "web"),
  req("RF-37.6", 37, "O cabeçalho permite navegar entre meses, atualizando a grade.", "web"),
  req("RF-37.7", 37, "Tocar num dia ativo abre o visualizador diário em tela cheia.", "web"),
  req("RF-37.8", 37, "O visualizador mostra a mídia com horário local e legenda.", "web"),
  req("RF-37.9", 37, "Em dias com várias Recordas, é possível deslizar entre elas com paginação segmentada.", "native"),
  req("RF-37.10", 37, "O visualizador tem a pílula sonora com controle do preview do Deezer.", "web"),
  req("RF-37.11", 37, "É possível ir ao dia anterior ou próximo com memórias sem fechar o visualizador.", "web"),
  req("RF-37.12", 37, "O visualizador fecha pelo X ou arrastando para baixo, voltando à grade com o dia em foco.", "web"),
  req("RF-37.13", 37, "Períodos sem memórias exibem estado vazio convidando a publicar.", "web"),

  // ── E7 · US 38 — Métricas ────────────────────────────────────────────────────────────────
  req("RF-38.1", 38, "A aba Métricas mostra o Artista Mais Recorrente no período.", "web"),
  req("RF-38.2", 38, "A aba mostra o ranking de gêneros com barras percentuais e contagem.", "web"),
  req("RF-38.3", 38, "A aba mostra a Streak Atual em dias consecutivos, zerando sem publicação no dia anterior ou atual (fuso de São Paulo).", "web"),
  req("RF-38.4", 38, "A Streak Atual tem visual minimalista, sem ícones de fogo ou brilho.", "manual"),
  req("RF-38.5", 38, "É possível alternar entre 30 dias, 90 dias, 1 ano e todo o histórico.", "web"),
  req("RF-38.6", 38, "Sem memórias no período, há um estado vazio informativo.", "web"),

  // ── E7 · US 39 — Retrospectiva ───────────────────────────────────────────────────────────
  req("RF-39.1", 39, "A retrospectiva de qualquer período elegível (mensal ou anual) é acessível pelo Perfil.", "web"),
  req("RF-39.2", 39, "O Story Viewer abre em tela cheia com barras de progresso (~5 s por slide), áudio e gestos de avançar, voltar e pausar.", "web"),
  req("RF-39.3", 39, "O viewer mostra os 6 blocos: total de Recordas, ranking de artistas, ranking de gêneros, amigos mais marcados, engajamento recebido e maior streak.", "web"),
  req("RF-39.4", 39, "O último slide gera um poster exportável para Instagram Stories ou galeria.", "native"),
  req("RF-39.5", 39, "Há estados de carregamento, erro e período indisponível.", "web"),

  // ── E9 · US 40–42 — Denúncias ────────────────────────────────────────────────────────────
  req("RF-40.1", 40, "É possível denunciar uma Recorda pelo card do feed ou pelo menu da tela de detalhes.", "web"),
  req("RF-40.2", 40, "A denúncia aceita justificativa opcional de até 500 caracteres.", "web"),
  req("RF-40.3", 40, "O mesmo usuário não denuncia a mesma Recorda duas vezes (erro amigável).", "web"),
  req("RF-40.4", 40, "A denúncia é registrada com status OPEN.", "api"),
  req("RF-40.5", 40, "A Recorda continua visível após a denúncia.", "web"),
  req("RF-40.6", 40, "O autor não é notificado nem vê quem denunciou.", "web"),
  req("RF-41.1", 41, "É possível denunciar o perfil de outro usuário.", "web"),
  req("RF-41.2", 41, "Não é possível denunciar o próprio perfil.", "web"),
  req("RF-41.3", 41, "A denúncia de perfil aceita justificativa de até 500 caracteres.", "web"),
  req("RF-41.4", 41, "O mesmo usuário não denuncia o mesmo perfil duas vezes (erro amigável).", "web"),
  req("RF-41.5", 41, "A denúncia de perfil é registrada com status OPEN.", "api"),
  req("RF-42.1", 42, "Quando a moderação remove uma Recorda, o autor recebe a notificação CONTENT_REMOVED com o motivo.", "web"),
  req("RF-42.2", 42, "A notificação aparece com ícone de sistema, sem expor o administrador.", "web"),
  req("RF-42.3", 42, "Tocar na notificação a marca como lida, sem navegar para a Recorda removida.", "web"),
  req("RF-42.4", 42, "Usuários suspensos não recebem a notificação.", "api"),

  // ── E10 · US 44 — Denúncias no painel admin ──────────────────────────────────────────────
  req("RF-44.1", 44, "O fluxo administrativo é exclusivo de usuários com role ADMIN.", "web"),
  req("RF-44.2", 44, "As denúncias são listadas agrupadas por alvo, com tipo, identificador, número de denúncias abertas e data da mais recente.", "web"),
  req("RF-44.3", 44, "O detalhe do alvo mostra o conteúdo denunciado e o histórico de denúncias (texto, data e denunciante).", "web"),
  req("RF-44.4", 44, "O administrador pode mudar o status das denúncias para RESOLVED ou DISMISSED.", "web"),
  req("RF-44.5", 44, "Toda mudança de status exige justificativa de até 500 caracteres, registrada na auditoria.", "web"),

  // ── E10 · US 45 — Remoção de Recordas ────────────────────────────────────────────────────
  req("RF-45.1", 45, "O administrador remove logicamente uma Recorda pela tela de moderação.", "web"),
  req("RF-45.2", 45, "A remoção exige justificativa de até 500 caracteres, salva de forma imutável na auditoria.", "web"),
  req("RF-45.3", 45, "Remover a Recorda resolve automaticamente as denúncias pendentes dela.", "web"),
  req("RF-45.4", 45, "A Recorda removida some imediatamente do feed, das buscas e do perfil do autor.", "web"),
  req("RF-45.5", 45, "O autor da Recorda removida é notificado conforme a US 42 (RF-42.1).", "web", {
    source: `${DECIDED}: manter a notificação da US 42; substitui o critério original da US 45, que proibia notificar.`
  }),

  // ── E10 · US 46 — Moderação de usuários ──────────────────────────────────────────────────
  req("RF-46.1", 46, "O administrador busca contas por username ou nome e vê perfil e status (ACTIVE ou SUSPENDED).", "web"),
  req("RF-46.2", 46, "Um administrador não pode suspender outro administrador (HTTP 403 e ação desabilitada na UI).", "web"),
  req("RF-46.3", 46, "A suspensão exige motivo de até 500 caracteres, registrado na auditoria.", "web"),
  req("RF-46.4", 46, "O conteúdo de usuários suspensos (Recordas, comentários e perfil) some para usuários comuns.", "web"),
  req("RF-46.5", 46, "O administrador reativa uma conta suspensa com justificativa, voltando ao status ACTIVE.", "web"),

  // ── E10 · US 47 — Auditoria ──────────────────────────────────────────────────────────────
  req("RF-47.1", 47, "Toda ação de moderação (remoção, suspensão/reativação e mudança de status de denúncia) gera um registro imutável.", "web"),
  req("RF-47.2", 47, "O registro guarda administrador, tipo de ação, alvo, motivo e timestamp UTC.", "web"),
  req("RF-47.3", 47, "O painel tem o histórico cronológico paginado, com filtros por administrador e período.", "web"),
  req("RF-47.4", 47, "A auditoria é append-only: não há endpoints de alteração ou exclusão.", "api"),

  // ── TA — Termo de Abertura, sem User Story ───────────────────────────────────────────────
  { id: "RF-T01", us: null, epic: "TA", verification: "web", source: `Termo: Integrações; ${DECIDED}: o Deezer substitui Spotify/Apple Music por atender melhor ao projeto.`, text: "A busca de músicas, previews, álbuns, artistas e gêneros usa a API do Deezer." },

  // ── NF — Não funcionais ──────────────────────────────────────────────────────────────────
  { id: "RNF-01", us: null, epic: "NF", verification: "native", source: "Termo: objetivos", text: "O aplicativo funciona em iOS e Android." },
  { id: "RNF-02", us: null, epic: "NF", verification: "web", source: "Termo; US 33", text: "A interface está disponível em português, inglês e espanhol, sem textos fixos fora das traduções." },
  { id: "RNF-03", us: null, epic: "NF", verification: "manual", source: "US 2; US 15", text: "Não há coleta de dados comportamentais: só os dados necessários à conta e às preferências declaradas." },
  { id: "RNF-04", us: null, epic: "NF", verification: "api", source: "Relatório de deploy", text: "Toda comunicação do app com a API usa HTTPS." },
  { id: "RNF-05", us: null, epic: "NF", verification: "web", source: "US 1; US 18", text: "A interface não trava esperando a rede: carregamentos mostram indicador e falhas oferecem tentar novamente." },
  { id: "RNF-06", us: null, epic: "NF", verification: "api", source: "US 37; US 38", text: "Datas e streaks são calculados no fuso America/Sao_Paulo." },
  { id: "RNF-07", us: null, epic: "NF", verification: "manual", source: "Termo: fora do escopo", text: "Fora do escopo: monetização, assinaturas, chat em tempo real, comunidades ou grupos, marketplace e streaming próprio." }
] as const satisfies readonly Requirement[];

export type RequirementId = (typeof REQUIREMENTS)[number]["id"];

export const REQUIREMENTS_BY_ID = new Map<string, Requirement>(
  REQUIREMENTS.map((requirement) => [requirement.id, requirement])
);

/** Contradictions and gaps still waiting for a team decision. */
export const OPEN_QUESTIONS = [
  "Duração de vídeo: a US 6 cita 60 s como proposta (RF-06.6), sem valor definido."
] as const;

/**
 * Items of the charter (Termo de Abertura) with no user story, left out of the requirements
 * by team decision. No tests are expected for them.
 */
export const OUT_OF_SCOPE = [
  "Perfil com biografia, total de amigos, conquistas, ranking e histórico de atividade (antigo RF-T02).",
  "Associar a Recorda a um artista ou álbum, além de uma música (antigo RF-T03).",
  "Compartilhamentos e descoberta de músicas nos feeds (antigo RF-T04).",
  "Rankings, tendências, scrobbles e linha do tempo pessoal (antigo RF-T05).",
  "Gamificação com badges de conquistas e ranking entre amigos e global (antigo RF-T06).",
  "Notificações de conquistas (antigo RF-T07).",
  "Onboarding de apresentação do app, além das preferências musicais (antigo RF-T08)."
] as const;

/** Questions the team has answered. Each one is reflected in the requirements above. */
export const DECISIONS = [
  { date: "2026-11-08", decision: "O provedor de música é o Deezer, que atende melhor ao projeto, no lugar de Spotify/Apple Music do Termo.", requirements: ["RF-T01"] },
  { date: "2026-11-08", decision: "O timeout da Splash é 3 s, como na US 1. O código (5 s) precisa ser corrigido.", requirements: ["RF-01.7"] },
  { date: "2026-11-08", decision: "O autor é notificado quando a moderação remove sua Recorda (US 42), apesar do critério original da US 45.", requirements: ["RF-42.1", "RF-45.5"] },
  { date: "2026-11-08", decision: "Data da Memória, Local e marcações de usuários precisam ser implementados na criação e nos detalhes da Recorda.", requirements: ["RF-08.5", "RF-08.6", "RF-08.7", "RF-09.1", "RF-09.6", "RF-17.2"] },
  { date: "2026-11-08", decision: "A streak segue a US 38: só Recordas ativas contam, e excluir a única Recorda de um dia tira esse dia da streak.", requirements: ["RF-35.2", "RF-38.3"] },
  { date: "2026-11-08", decision: "Itens do Termo sem User Story ficam fora dos requisitos (ver \"Fora do escopo\"), e a numeração faltante (US 13, 30, 43 e épico E1) é ignorada.", requirements: [] }
] as const satisfies readonly { date: string; decision: string; requirements: readonly RequirementId[] }[];
