# Requisitos do Recorda

> Gerado por `pnpm requirements:doc` a partir de
> [src/requirements/catalog.ts](../src/requirements/catalog.ts). Não edite à mão: altere o
> catálogo e gere de novo.

Fontes: Termo de Abertura do Projeto (2026/2) e os Épicos e User Stories das issues de
[recorda-frontend](https://github.com/Recorda-ages/recorda-frontend/issues) e
[recorda-backend](https://github.com/Recorda-ages/recorda-backend/issues) (snapshot de 2026-11-08).

## Como ler

- **`RF-<US>.<n>`**: requisito funcional = critério de aceitação *n* da User Story *US*.
- **`RF-T<n>`**: requisito do Termo de Abertura ainda sem User Story.
- **`RNF-<n>`**: requisito não funcional.
- **Verificação**: como esta suíte pode verificar o requisito. *web*: pela interface web;
  *API*: pela API do backend; *nativo*: exige aparelho (câmera, galeria, permissões,
  Instagram, áudio em segundo plano), fora do alcance do Playwright; *manual*: julgamento
  visual ou de design.
- **Status da US**: estado da issue (fechada = *implementada*, o que não significa testada).
- Todo teste declara nome, descrição e o(s) ID(s) que verifica: veja
  [GUIDELINES.md](GUIDELINES.md#2-anatomy-of-a-spec).

## Resumo

226 requisitos, 199 verificáveis por esta suíte (web ou API), 11 cobertos por 7 teste(s). 8 decididos mas ainda não atendidos pelo código (⚠️).

| Épico | Nome | Requisitos | Web | API | Nativo | Manual | Cobertos |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E2 | Autenticação, cadastro e onboarding | 32 | 26 | 4 | 0 | 2 | 9 |
| E3 | Criação e publicação de Recordas | 25 | 16 | 4 | 5 | 0 | 0 |
| E4 | Feed | 26 | 18 | 2 | 6 | 0 | 0 |
| E5 | Interações sociais | 39 | 36 | 3 | 0 | 0 | 0 |
| E6 | Perfil e configurações | 22 | 20 | 2 | 0 | 0 | 2 |
| E7 | Memórias e estatísticas | 24 | 20 | 0 | 2 | 2 | 0 |
| E8 | Compartilhamento de cards | 16 | 9 | 0 | 5 | 2 | 0 |
| E9 | Denúncias | 15 | 12 | 3 | 0 | 0 | 0 |
| E10 | Administração e moderação | 19 | 18 | 1 | 0 | 0 | 0 |
| TA | Termo de Abertura (sem User Story) | 1 | 1 | 0 | 0 | 0 | 0 |
| NF | Requisitos não funcionais | 7 | 2 | 2 | 1 | 2 | 0 |

## Decisões

Perguntas já respondidas pelo time e refletidas nos requisitos.

| Data | Decisão | Requisitos |
| --- | --- | --- |
| 2026-11-08 | O provedor de música é o Deezer, que atende melhor ao projeto, no lugar de Spotify/Apple Music do Termo. | RF-T01 |
| 2026-11-08 | O timeout da Splash é 3 s, como na US 1. O código (5 s) precisa ser corrigido. | RF-01.7 |
| 2026-11-08 | O autor é notificado quando a moderação remove sua Recorda (US 42), apesar do critério original da US 45. | RF-42.1, RF-45.5 |
| 2026-11-08 | Data da Memória, Local e marcações de usuários precisam ser implementados na criação e nos detalhes da Recorda. | RF-08.5, RF-08.6, RF-08.7, RF-09.1, RF-09.6, RF-17.2 |
| 2026-11-08 | A streak segue a US 38: só Recordas ativas contam, e excluir a única Recorda de um dia tira esse dia da streak. | RF-35.2, RF-38.3 |
| 2026-11-08 | Itens do Termo sem User Story ficam fora dos requisitos (ver "Fora do escopo"), e a numeração faltante (US 13, 30, 43 e épico E1) é ignorada. | — |

## Lacunas conhecidas

Requisitos decididos que o código atual ainda não atende. Um teste para eles deve falhar
até a implementação (marque-o com `test.fail()` e um comentário apontando o ID).

- **RF-01.7**: O código usa 5 s (SPLASH_TIMEOUT_MS em recorda-frontend/src/features/splash/screens/SplashScreen.tsx).
- **RF-08.5**: Não implementado: o model recorda não tem Data da Memória, Local nem marcações.
- **RF-08.6**: Não implementado: o model recorda não tem Data da Memória, Local nem marcações.
- **RF-08.7**: Não implementado: o model recorda não tem Data da Memória, Local nem marcações.
- **RF-09.1**: Não implementado: o model recorda não tem Data da Memória, Local nem marcações.
- **RF-09.6**: Não implementado: o model recorda não tem Data da Memória, Local nem marcações.
- **RF-17.2**: Não implementado: o model recorda não tem Data da Memória, Local nem marcações.
- **RF-35.2**: A streak do perfil inclui Recordas excluídas (list_publication_times em recorda-backend/app/repositories/recorda_repository.py), enquanto a de Métricas já as exclui.

## Pontos em aberto

Contradições e lacunas encontradas entre o Termo, as User Stories e o código. Precisam de
decisão do time antes de virarem teste.

- Duração de vídeo: a US 6 cita 60 s como proposta (RF-06.6), sem valor definido.

## Fora do escopo

Itens do Termo de Abertura sem User Story, deixados fora dos requisitos por decisão do time.
Não se esperam testes para eles. Os itens que o próprio Termo exclui estão em RNF-07.

- Perfil com biografia, total de amigos, conquistas, ranking e histórico de atividade (antigo RF-T02).
- Associar a Recorda a um artista ou álbum, além de uma música (antigo RF-T03).
- Compartilhamentos e descoberta de músicas nos feeds (antigo RF-T04).
- Rankings, tendências, scrobbles e linha do tempo pessoal (antigo RF-T05).
- Gamificação com badges de conquistas e ranking entre amigos e global (antigo RF-T06).
- Notificações de conquistas (antigo RF-T07).
- Onboarding de apresentação do app, além das preferências musicais (antigo RF-T08).

## Fluxos de teste

Os requisitos agrupados por jornada do usuário. Cada fluxo tem uma issue em
[Recorda-ages/recorda-test-suite](https://github.com/Recorda-ages/recorda-test-suite/issues) e uma pasta de specs sugerida.

| Fluxo | Issue | Requisitos | Web (Playwright) | Cobertos | Lacunas | Escreve dados |
| --- | --- | --- | --- | --- | --- | --- |
| FL-01 Abertura do app e sessão | [#1](https://github.com/Recorda-ages/recorda-test-suite/issues/1) | 9 | 9 | 4 | 1 | não |
| FL-02 Login | [#2](https://github.com/Recorda-ages/recorda-test-suite/issues/2) | 4 | 4 | 3 | 0 | não |
| FL-03 Cadastro e onboarding | [#3](https://github.com/Recorda-ages/recorda-test-suite/issues/3) | 11 | 11 | 0 | 0 | sim (`@mutates`) |
| FL-04 Recuperação de senha | [#4](https://github.com/Recorda-ages/recorda-test-suite/issues/4) | 4 | 4 | 4 | 0 | sim (`@mutates`) |
| FL-05 Criação e publicação de Recorda | [#5](https://github.com/Recorda-ages/recorda-test-suite/issues/5) | 22 | 17 | 0 | 4 | sim (`@mutates`) |
| FL-06 Card de compartilhamento | [#6](https://github.com/Recorda-ages/recorda-test-suite/issues/6) | 14 | 9 | 0 | 0 | não |
| FL-07 Feed | [#7](https://github.com/Recorda-ages/recorda-test-suite/issues/7) | 20 | 15 | 0 | 0 | não |
| FL-08 Detalhes da Recorda, curtidas e comentários | [#8](https://github.com/Recorda-ages/recorda-test-suite/issues/8) | 17 | 16 | 0 | 1 | sim (`@mutates`) |
| FL-09 Busca, seguir e rede de seguidores | [#9](https://github.com/Recorda-ages/recorda-test-suite/issues/9) | 17 | 17 | 0 | 0 | sim (`@mutates`) |
| FL-10 Notificações | [#10](https://github.com/Recorda-ages/recorda-test-suite/issues/10) | 7 | 7 | 0 | 0 | sim (`@mutates`) |
| FL-11 Perfil pessoal e de terceiros | [#11](https://github.com/Recorda-ages/recorda-test-suite/issues/11) | 7 | 7 | 0 | 0 | sim (`@mutates`) |
| FL-12 Configurações, preferências e conta | [#12](https://github.com/Recorda-ages/recorda-test-suite/issues/12) | 12 | 12 | 0 | 0 | sim (`@mutates`) |
| FL-13 Memórias: calendário, métricas e retrospectiva | [#13](https://github.com/Recorda-ages/recorda-test-suite/issues/13) | 22 | 20 | 0 | 0 | não |
| FL-14 Denúncias | [#14](https://github.com/Recorda-ages/recorda-test-suite/issues/14) | 9 | 9 | 0 | 0 | sim (`@mutates`) |
| FL-15 Moderação administrativa | [#15](https://github.com/Recorda-ages/recorda-test-suite/issues/15) | 21 | 21 | 0 | 0 | sim (`@mutates`) |

Os fluxos contêm só requisitos de jornada do usuário (verificação *web* ou *nativo*).
Ficam fora:

- **Verificação API ou manual** (29): RF-01.1, RF-02.6, RF-02.7, RF-03.5, RF-04.2, RF-04.7, RF-06.4, RF-07.5, RF-09.1, RF-09.3, RF-10.3, RF-11.3, RF-15.3, RF-15.4, RF-20.4, RF-20.6, RF-24.5, RF-35.1, RF-35.2, RF-37.3, RF-38.4, RF-40.4, RF-41.5, RF-42.4, RF-47.4, RNF-03, RNF-04, RNF-06, RNF-07.
- **RNF-01**: Execução em iOS e Android: é uma propriedade do app inteiro, para teste nativo (ex.: Maestro).

## E2 — Autenticação, cadastro e onboarding

### US 1 — Visualização da Splash Screen

[frontend#2](https://github.com/Recorda-ages/recorda-frontend/issues/2) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-01.1 | Exibir a Splash Screen com a identidade visual (fundo escuro, logo) conforme os protótipos do Figma. | manual | — |
| RF-01.2 | A Splash Screen é obrigatoriamente a primeira etapa ao abrir o aplicativo. | web | — |
| RF-01.3 | Sem sessão salva, a Splash encaminha para o Login. | web | [a signed-out user sees the login screen](../tests/auth/sign-in.spec.ts#L8) |
| RF-01.4 | Com sessão válida de conta comum, a Splash encaminha para o Feed. | web | — |
| RF-01.5 | Com sessão válida de administrador, a Splash encaminha para a área administrativa, sem acesso a Feed, Perfil ou Criar Recorda. | web | — |
| RF-01.6 | Sessão inválida ou expirada é apagada e o usuário vai para o Login. | web | — |
| RF-01.7 | Se a verificação de sessão demorar mais que 3 s, o app segue para o Login; uma resposta tardia nunca causa uma segunda navegação.<br>_Fonte: Decisão do time, 2026-11-08: 3 s é o valor correto._<br>⚠️ O código usa 5 s (SPLASH_TIMEOUT_MS em recorda-frontend/src/features/splash/screens/SplashScreen.tsx). | web | — |

### US 2 — Cadastro de Usuário

[frontend#31](https://github.com/Recorda-ages/recorda-frontend/issues/31) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-02.1 | A tela de Cadastro tem exatamente os campos Nome, Username, Email e Senha, sem confirmação de senha nem aceite de termos. | web | — |
| RF-02.2 | Username e email são únicos no sistema. | web | — |
| RF-02.3 | Todos os campos são validados antes do registro, com mensagens de erro específicas por campo. | web | — |
| RF-02.4 | A senha tem no mínimo 8 caracteres. | web | — |
| RF-02.5 | Após o cadastro, o usuário é autenticado automaticamente e encaminhado ao Onboarding, nunca direto ao Feed. | web | — |
| RF-02.6 | Não são coletados dados além dos necessários ao funcionamento da conta. | manual | — |
| RF-02.7 | Contas de administrador não podem ser criadas pelo cadastro. | API | — |

### US 3 — Onboarding e Preferências Musicais

[frontend#53](https://github.com/Recorda-ages/recorda-frontend/issues/53) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-03.1 | Imediatamente após o cadastro, o app conduz o usuário ao Onboarding. | web | — |
| RF-03.2 | O Onboarding tem três passos (artistas, gêneros e música favorita) com dados do Deezer, e o indicador de progresso reflete os três passos. | web | — |
| RF-03.3 | Cada passo exibe um grid de opções selecionáveis (chips). | web | — |
| RF-03.4 | É preciso selecionar no mínimo 3 artistas e 3 gêneros para prosseguir, e exatamente 1 música favorita. | web | — |
| RF-03.5 | Artistas e gêneros formam o Perfil Musical, única fonte da Afinidade Musical. | API | — |
| RF-03.6 | A Música Favorita não participa da Afinidade Musical e aparece em destaque no cabeçalho do Perfil Pessoal. | web | — |
| RF-03.7 | É possível voltar ao passo anterior sem perder as seleções. | web | — |

### US 4 — Autenticação de Usuário

[frontend#112](https://github.com/Recorda-ages/recorda-frontend/issues/112) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-04.1 | A tela de Login tem os campos Usuário e Senha e é a mesma para usuários comuns e administradores. | web | [signing in with valid credentials opens the feed](../tests/auth/sign-in.spec.ts#L24) |
| RF-04.2 | As credenciais são validadas no backend, que retorna também o tipo de conta. | API | — |
| RF-04.3 | Credenciais inválidas exibem uma única mensagem genérica, sem revelar qual campo está incorreto. | web | [invalid credentials show one generic error](../tests/auth/sign-in.spec.ts#L39) |
| RF-04.4 | Administradores são roteados para a área administrativa, sem acesso à navegação do app comum. | web | — |
| RF-04.5 | Usuários comuns são roteados para o Feed. | web | [signing in with valid credentials opens the feed](../tests/auth/sign-in.spec.ts#L24) |
| RF-04.6 | A sessão é persistida no dispositivo: reabrir o app não exige novo login. | web | [returning user browses the feed, opens settings and signs out](../tests/flows/session-lifecycle.spec.ts#L10) |
| RF-04.7 | Não há expiração de sessão por inatividade; a sessão dura até o token expirar. | API | — |

### US 5 — Recuperação de Senha

[frontend#113](https://github.com/Recorda-ages/recorda-frontend/issues/113) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-05.1 | A tela Recuperar Senha tem os campos Email, Nova Senha e Confirmar Senha e o botão Redefinir Senha. | web | [the recovery form validates matching passwords of at least eight characters @mutates](../tests/auth/password-recovery.spec.ts#L10) |
| RF-05.2 | Nova Senha e Confirmar Senha devem ser idênticas e ter no mínimo 8 caracteres. | web | [the recovery form validates matching passwords of at least eight characters @mutates](../tests/auth/password-recovery.spec.ts#L10) |
| RF-05.3 | A senha da conta com o email informado é substituída diretamente, sem email nem token de verificação. | web | [a new password replaces the old password and allows sign in @mutates](../tests/auth/password-recovery.spec.ts#L45) |
| RF-05.4 | Email sem conta exibe o mesmo erro genérico das outras falhas, sem confirmar a existência da conta. | web | [an unknown email and a network failure show the same generic error @mutates](../tests/auth/password-recovery.spec.ts#L76) |

## E3 — Criação e publicação de Recordas

### US 6 — Captura e Seleção de Mídia

[frontend#62](https://github.com/Recorda-ages/recorda-frontend/issues/62) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-06.1 | A tela Criar Recorda é acessível pela barra inferior e tem visor de câmera e botão central de captura. | web | — |
| RF-06.2 | Ao entrar na tela, a câmera abre diretamente (prioridade sobre a galeria). | nativo | — |
| RF-06.3 | É possível capturar mídia em tempo real ou selecioná-la da galeria. | nativo | — |
| RF-06.4 | Cada Recorda tem exatamente uma foto ou um vídeo. | API | — |
| RF-06.5 | Permissões de câmera e galeria são pedidas em runtime, com mensagem e atalho para as configurações quando negadas. | nativo | — |
| RF-06.6 | Vídeos têm duração máxima (proposta: 60 s) e são comprimidos antes do upload. | nativo | — |

### US 7 — Busca e Associação da Música

[frontend#69](https://github.com/Recorda-ages/recorda-frontend/issues/69) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-07.1 | O campo Música abre um buscador do Deezer que retorna faixa, artista, álbum, gênero e capa. | web | — |
| RF-07.2 | A busca funciona por nome de música, artista ou álbum. | web | — |
| RF-07.3 | É possível ouvir o preview de 30 s de um resultado antes de confirmar. | nativo | — |
| RF-07.4 | A publicação é associada a uma música específica. | web | — |
| RF-07.5 | É persistido o identificador da faixa no Deezer, nunca a URL do preview. | API | — |
| RF-07.6 | Indisponibilidade da API de música é tratada com opção de tentar novamente. | web | — |

### US 8 — Detalhes da Recorda

[frontend#76](https://github.com/Recorda-ages/recorda-frontend/issues/76) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-08.1 | Uma única tela mostra o preview da mídia com capa, título e artista da música sobrepostos e um campo de descrição. | web | — |
| RF-08.2 | A descrição é opcional, com limite de 2200 caracteres. | web | — |
| RF-08.3 | A música vem preenchida e não é editável nesta tela. | web | — |
| RF-08.4 | Publicar só fica habilitado com a música associada. | web | — |
| RF-08.5 | A tela de detalhes permite informar a Data da Memória (quando o momento aconteceu).<br>_Fonte: Decisão do time, 2026-11-08: obrigatório implementar._<br>⚠️ Não implementado: o model recorda não tem Data da Memória, Local nem marcações. | web | — |
| RF-08.6 | A tela de detalhes permite informar o Local da memória.<br>_Fonte: Decisão do time, 2026-11-08: obrigatório implementar._<br>⚠️ Não implementado: o model recorda não tem Data da Memória, Local nem marcações. | web | — |
| RF-08.7 | A tela de detalhes permite marcar outros usuários na Recorda.<br>_Fonte: Decisão do time, 2026-11-08: obrigatório implementar; Termo: marcação de amigos._<br>⚠️ Não implementado: o model recorda não tem Data da Memória, Local nem marcações. | web | — |

### US 9 — Publicação da Recorda

[frontend#84](https://github.com/Recorda-ages/recorda-frontend/issues/84) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-09.1 | A Recorda é composta por mídia, música, descrição opcional, Data da Memória, Local e marcações.<br>_Fonte: Decisão do time, 2026-11-08: Data da Memória, Local e marcações voltam ao escopo._<br>⚠️ Não implementado: o model recorda não tem Data da Memória, Local nem marcações. | API | — |
| RF-09.2 | A visibilidade não é escolhida na publicação: deriva da privacidade da conta, sem seletor nem campo por publicação. | web | — |
| RF-09.3 | A Data de Publicação é registrada automaticamente. | API | — |
| RF-09.4 | Após publicar, a Recorda aparece imediatamente no perfil do autor e fica disponível aos feeds conforme a visibilidade da conta. | web | — |
| RF-09.5 | Há indicador de progresso no upload e, em caso de falha, é possível tentar novamente sem perder os dados nem recapturar a mídia. | web | — |
| RF-09.6 | Usuários marcados são notificados da marcação.<br>_Fonte: Decisão do time, 2026-11-08; US 26._<br>⚠️ Não implementado: o model recorda não tem Data da Memória, Local nem marcações. | web | — |

## E4 — Feed

### US 14 — Feed: Aba Seguindo

[frontend#158](https://github.com/Recorda-ages/recorda-frontend/issues/158) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-14.1 | A aba Seguindo é uma das duas abas superiores do Feed (com Geral), acessível pela barra inferior. | web | — |
| RF-14.2 | Os cards mostram avatar e username do autor, mídia, música (título, artista e capa), descrição e as ações Curtir, Comentar e Denunciar. | web | — |
| RF-14.3 | A aba lista apenas Recordas de quem o usuário segue, da mais recente para a mais antiga. | web | — |
| RF-14.4 | Só aparecem Recordas de autores com conta pública ou que aprovaram a solicitação de seguir; não é preciso seguir mutuamente. | web | — |
| RF-14.5 | O estado vazio orienta a seguir perfis ou criar a primeira Recorda. | web | — |

### US 15 — Feed: Aba Geral

[frontend#161](https://github.com/Recorda-ages/recorda-frontend/issues/161) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-15.1 | A aba Geral é a aba padrão ao abrir o Feed. | web | — |
| RF-15.2 | A aba Geral une, por recência, as Recordas de quem o usuário segue e Recordas públicas de perfis não seguidos com Afinidade Musical maior que zero. | web | — |
| RF-15.3 | A Afinidade Musical decide só a elegibilidade dos itens de descoberta, não a ordenação. | API | — |
| RF-15.4 | A Afinidade Musical usa apenas artistas e gêneros do onboarding; nenhum dado comportamental entra no cálculo. | API | — |
| RF-15.5 | Recordas restritas a seguidores só aparecem para seguidores aprovados. | web | — |
| RF-15.6 | Sem itens de descoberta elegíveis, a aba exibe as Recordas de quem o usuário segue. | web | — |

### US 16 — Reprodução Automática

[frontend#165](https://github.com/Recorda-ages/recorda-frontend/issues/165) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-16.1 | Ao entrar em foco no scroll, em qualquer aba, a Recorda toca automaticamente o preview de 30 s. | nativo | — |
| RF-16.2 | Apenas uma Recorda toca por vez; ao sair de foco, a reprodução para. | nativo | — |
| RF-16.3 | O preview reinicia em loop enquanto a Recorda estiver em foco. | nativo | — |
| RF-16.4 | Vídeos são sempre exibidos sem som; só a música emite áudio. | web | — |
| RF-16.5 | Há um controle visível para silenciar/reativar, e a escolha persiste durante a sessão. | web | — |
| RF-16.6 | Ao sair da tela ou minimizar o app, o áudio para. | nativo | — |

### US 17 — Detalhes da Recorda (feed)

[frontend#167](https://github.com/Recorda-ages/recorda-frontend/issues/167) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-17.1 | Tocar num card do feed ou numa miniatura do perfil abre a tela Detalhes da Recorda. | web | — |
| RF-17.2 | A tela mostra mídia, avatar e username do autor, relato completo, música, Data da Memória, Local, marcações e comentários.<br>⚠️ Não implementado: o model recorda não tem Data da Memória, Local nem marcações. | web | — |
| RF-17.3 | A música continua tocando na transição do feed para os detalhes, sem reiniciar. | nativo | — |
| RF-17.4 | A tela oferece curtir, comentar e compartilhar. | web | — |
| RF-17.5 | O menu de três pontos oferece só excluir na própria Recorda e só denunciar na de outra pessoa; não há edição. | web | — |

### US 18 — Carregamento Progressivo

[frontend#171](https://github.com/Recorda-ages/recorda-frontend/issues/171) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-18.1 | O feed carrega em páginas, buscando mais itens perto do fim da lista. | web | — |
| RF-18.2 | Há pull-to-refresh nas duas abas. | nativo | — |
| RF-18.3 | Há indicador de carregamento e tratamento de erro de rede com opção de tentar novamente. | web | — |
| RF-18.4 | A posição de rolagem e o estado de reprodução são preservados ao alternar entre Geral e Seguindo. | web | — |

## E5 — Interações sociais

### US 19 — Busca de Usuários

[frontend#173](https://github.com/Recorda-ages/recorda-frontend/issues/173) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-19.1 | É possível buscar usuários por username. | web | — |
| RF-19.2 | Os resultados mostram avatar, username e o estado da relação (seguindo, solicitado ou nenhuma). | web | — |
| RF-19.3 | Tocar num resultado abre o perfil do usuário. | web | — |
| RF-19.4 | Perfis privados aparecem na busca, mas o conteúdo continua protegido. | web | — |

### US 20 — Sistema de Seguidores

[frontend#176](https://github.com/Recorda-ages/recorda-frontend/issues/176) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-20.1 | O perfil de terceiros tem um botão primário Seguir. | web | — |
| RF-20.2 | Seguir uma conta pública é efetivado imediatamente. | web | — |
| RF-20.3 | Seguir uma conta privada cria uma solicitação (estado Solicitado) e notifica o alvo. | web | — |
| RF-20.4 | A relação é assimétrica: seguir não implica ser seguido. | API | — |
| RF-20.5 | É possível deixar de seguir a qualquer momento, sem confirmação nem notificação ao outro lado. | web | — |
| RF-20.6 | Não é possível seguir a si mesmo nem enviar solicitação duplicada. | API | — |

### US 21 — Solicitações para Seguir

[frontend#179](https://github.com/Recorda-ages/recorda-frontend/issues/179) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-21.1 | As solicitações recebidas são acessíveis pela central de notificações. | web | — |
| RF-21.2 | Ao aceitar, o solicitante passa a ver as Recordas imediatamente e é notificado da aprovação. | web | — |
| RF-21.3 | Ao recusar, a solicitação é descartada sem notificar o solicitante. | web | — |
| RF-21.4 | Quem enviou uma solicitação pendente pode cancelá-la. | web | — |

### US 22 — Gerenciamento de Seguidores

[frontend#181](https://github.com/Recorda-ages/recorda-frontend/issues/181) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-22.1 | O perfil dá acesso às listas de Seguidores e Seguindo, com busca em cada lista. | web | — |
| RF-22.2 | É possível remover um seguidor, sem notificá-lo; em conta privada ele precisa solicitar de novo. | web | — |
| RF-22.3 | Em conta privada, só seguidores aprovados veem as listas. | web | — |

### US 23 — Curtir uma Recorda

[frontend#184](https://github.com/Recorda-ages/recorda-frontend/issues/184) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-23.1 | Os cards do feed e a tela de detalhes têm o botão de curtir. | web | — |
| RF-23.2 | Curtir alterna entre curtido e não curtido, com resposta visual imediata e reconciliação com o servidor. | web | — |
| RF-23.3 | A Recorda exibe a contagem de curtidas. | web | — |
| RF-23.4 | O autor é notificado das curtidas, exceto das próprias. | web | — |

### US 24 — Comentários

[frontend#187](https://github.com/Recorda-ages/recorda-frontend/issues/187) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-24.1 | A tela de detalhes lista os comentários e tem um campo para escrever um novo. | web | — |
| RF-24.2 | Os comentários são uma lista plana por data de criação, sem respostas nem curtidas. | web | — |
| RF-24.3 | Cada comentário mostra avatar, username, texto e data. | web | — |
| RF-24.4 | Comentários têm no máximo 500 caracteres. | web | — |
| RF-24.5 | Só comenta quem tem permissão para ver a Recorda. | API | — |
| RF-24.6 | O autor da Recorda é notificado de novos comentários. | web | — |

### US 25 — Excluir Comentário

[frontend#190](https://github.com/Recorda-ages/recorda-frontend/issues/190) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-25.1 | O autor do comentário pode excluí-lo. | web | — |
| RF-25.2 | O autor da Recorda pode excluir qualquer comentário dela. | web | — |
| RF-25.3 | A exclusão pede confirmação e vale imediatamente para todos. | web | — |

### US 26 — Central de Notificações

[frontend#193](https://github.com/Recorda-ages/recorda-frontend/issues/193) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-26.1 | O cabeçalho do Feed tem um sino que abre as notificações. | web | — |
| RF-26.2 | A lista mostra o histórico recente, do mais novo ao mais antigo, com ícone do autor da ação, descrição e ação opcional. | web | — |
| RF-26.3 | Geram notificação: novo seguidor, solicitação recebida, solicitação aprovada, curtida, comentário e marcação. | web | — |
| RF-26.4 | Solicitações para seguir podem ser aceitas ou recusadas na própria lista. | web | — |
| RF-26.5 | O sino mostra o contador de não lidas, e abrir a lista marca todas como lidas. | web | — |
| RF-26.6 | Tocar numa notificação leva ao conteúdo relacionado. | web | — |

### US 27 — Sugestões por Afinidade

[frontend#196](https://github.com/Recorda-ages/recorda-frontend/issues/196) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-27.1 | A busca exibe perfis sugeridos ordenados por Afinidade Musical. | web | — |
| RF-27.2 | Ficam de fora perfis já seguidos, solicitações pendentes e o próprio usuário. | web | — |
| RF-27.3 | Cada sugestão mostra avatar, username, gêneros/artistas em comum e a ação de seguir. | web | — |

## E6 — Perfil e configurações

### US 28 — Perfil pessoal

[backend#117](https://github.com/Recorda-ages/recorda-backend/issues/117) · em andamento

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-28.1 | O perfil mostra nome, username, avatar, contadores, uma única streak, música favorita e chips de artistas e gêneros. | web | — |
| RF-28.2 | É possível trocar e remover o avatar. | web | — |
| RF-28.3 | O perfil mostra a grade paginada das próprias Recordas. | web | — |
| RF-28.4 | O perfil mantém as abas Recordas, Métricas e Calendário. | web | — |

### US 29 — Perfil de terceiros

[backend#118](https://github.com/Recorda-ages/recorda-backend/issues/118) · em andamento

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-29.1 | Perfil público, ou com follow aprovado, mostra cabeçalho, contadores e conteúdo. | web | — |
| RF-29.2 | Perfil privado sem aprovação mostra nome, username, streak e música, oculta contadores e Recordas e mantém as três abas com aviso de restrição. | web | — |

### US 31 — Editar preferências musicais

[backend#119](https://github.com/Recorda-ages/recorda-backend/issues/119) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-31.1 | A edição abre com as escolhas atuais selecionadas. | web | — |
| RF-31.2 | Salvar exige no mínimo 3 artistas e 3 gêneros e exatamente uma música. | web | — |
| RF-31.3 | Preferências atualizadas refletem no perfil, nas sugestões e no feed. | web | — |

### US 32 — Configurações e privacidade

[backend#120](https://github.com/Recorda-ages/recorda-backend/issues/120) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-32.1 | É possível alternar entre conta pública e privada, com confirmação e efeito imediato. | web | — |
| RF-32.2 | Ao tornar a conta pública, todos os pedidos pendentes são aceitos na mesma transação e cada solicitante é notificado. | web | — |
| RF-32.3 | As Configurações dão acesso a Minha conta, preferências musicais, idioma e logout. | web | — |

### US 33 — Idioma da conta e do aparelho

[backend#121](https://github.com/Recorda-ages/recorda-backend/issues/121) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-33.1 | Português, inglês e espanhol podem ser escolhidos com efeito imediato. | web | — |
| RF-33.2 | Antes do login vale a preferência local; após autenticar prevalece o idioma da conta, que também é gravado no aparelho. | web | — |

### US 34 — Gerenciar conta

[backend#122](https://github.com/Recorda-ages/recorda-backend/issues/122) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-34.1 | É possível editar nome, username e email; o email muda após validar formato e unicidade, sem link de confirmação. | web | — |
| RF-34.2 | A senha é opcional e só muda com Nova senha e Repetir nova senha preenchidas e iguais, sem pedir a senha atual. | web | — |
| RF-34.3 | Excluir a conta pede confirmação (Cancelar/Excluir) e aplica exclusão lógica sem anonimização. | web | — |

### US 35 — Streak de publicações

[backend#123](https://github.com/Recorda-ages/recorda-backend/issues/123) · em andamento

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-35.1 | Só contam para a streak dias com pelo menos uma Recorda publicada, pela data de publicação. | API | — |
| RF-35.2 | Curtidas, comentários e outras ações não contam. Só contam Recordas ativas: excluir a única Recorda de um dia tira esse dia da streak (regra da US 38).<br>_Fonte: Decisão do time, 2026-11-08: seguir a US 38, que substitui o critério original da US 35._<br>⚠️ A streak do perfil inclui Recordas excluídas (list_publication_times em recorda-backend/app/repositories/recorda_repository.py), enquanto a de Métricas já as exclui. | API | — |
| RF-35.3 | O perfil mostra apenas um indicador de streak. | web | — |

### US 36 — Logout

[backend#124](https://github.com/Recorda-ages/recorda-backend/issues/124) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-36.1 | Sair pede confirmação. | web | [returning user browses the feed, opens settings and signs out](../tests/flows/session-lifecycle.spec.ts#L10) |
| RF-36.2 | Ao confirmar, a sessão e os dados em memória são limpos, o app vai para o Login e o idioma local do aparelho é preservado. | web | [returning user browses the feed, opens settings and signs out](../tests/flows/session-lifecycle.spec.ts#L10) |

## E7 — Memórias e estatísticas

### US 37 — Calendário de Memórias

[frontend#278](https://github.com/Recorda-ages/recorda-frontend/issues/278) · em andamento

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-37.1 | A aba Calendário mostra uma grade mensal de 7 colunas (domingo a sábado) calculada no fuso de São Paulo. | web | — |
| RF-37.2 | Dias com publicações mostram a miniatura da primeira Recorda do dia. | web | — |
| RF-37.3 | O número do dia fica legível sobre a miniatura (gradiente e sombra). | manual | — |
| RF-37.4 | Dias com mais de uma Recorda mostram o indicador +N. | web | — |
| RF-37.5 | Dias sem publicações aparecem em estilo escuro, sem miniatura. | web | — |
| RF-37.6 | O cabeçalho permite navegar entre meses, atualizando a grade. | web | — |
| RF-37.7 | Tocar num dia ativo abre o visualizador diário em tela cheia. | web | — |
| RF-37.8 | O visualizador mostra a mídia com horário local e legenda. | web | — |
| RF-37.9 | Em dias com várias Recordas, é possível deslizar entre elas com paginação segmentada. | nativo | — |
| RF-37.10 | O visualizador tem a pílula sonora com controle do preview do Deezer. | web | — |
| RF-37.11 | É possível ir ao dia anterior ou próximo com memórias sem fechar o visualizador. | web | — |
| RF-37.12 | O visualizador fecha pelo X ou arrastando para baixo, voltando à grade com o dia em foco. | web | — |
| RF-37.13 | Períodos sem memórias exibem estado vazio convidando a publicar. | web | — |

### US 38 — Métricas e Estatísticas Pessoais

[frontend#279](https://github.com/Recorda-ages/recorda-frontend/issues/279) · em andamento

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-38.1 | A aba Métricas mostra o Artista Mais Recorrente no período. | web | — |
| RF-38.2 | A aba mostra o ranking de gêneros com barras percentuais e contagem. | web | — |
| RF-38.3 | A aba mostra a Streak Atual em dias consecutivos, zerando sem publicação no dia anterior ou atual (fuso de São Paulo). | web | — |
| RF-38.4 | A Streak Atual tem visual minimalista, sem ícones de fogo ou brilho. | manual | — |
| RF-38.5 | É possível alternar entre 30 dias, 90 dias, 1 ano e todo o histórico. | web | — |
| RF-38.6 | Sem memórias no período, há um estado vazio informativo. | web | — |

### US 39 — Retrospectiva Musical de Período

[frontend#280](https://github.com/Recorda-ages/recorda-frontend/issues/280) · em andamento

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-39.1 | A retrospectiva de qualquer período elegível (mensal ou anual) é acessível pelo Perfil. | web | — |
| RF-39.2 | O Story Viewer abre em tela cheia com barras de progresso (~5 s por slide), áudio e gestos de avançar, voltar e pausar. | web | — |
| RF-39.3 | O viewer mostra os 6 blocos: total de Recordas, ranking de artistas, ranking de gêneros, amigos mais marcados, engajamento recebido e maior streak. | web | — |
| RF-39.4 | O último slide gera um poster exportável para Instagram Stories ou galeria. | nativo | — |
| RF-39.5 | Há estados de carregamento, erro e período indisponível. | web | — |

## E8 — Compartilhamento de cards

### US 10 — Geração Base do Card Visual

[frontend#199](https://github.com/Recorda-ages/recorda-frontend/issues/199) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-10.1 | A partir da tela de detalhes há a interface Compartilhar Recorda. | web | — |
| RF-10.2 | O card é uma imagem na proporção 9:16 (Stories). | web | — |
| RF-10.3 | O card contém a mídia, a identidade visual do app e capa e nome da música. | manual | — |
| RF-10.4 | Para vídeos, o card usa o primeiro quadro: o resultado é sempre uma imagem estática. | web | — |
| RF-10.5 | A geração ocorre no dispositivo, com indicador de progresso. | web | — |

### US 11 — Presets

[frontend#201](https://github.com/Recorda-ages/recorda-frontend/issues/201) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-11.1 | Os presets aparecem como lista horizontal rolável abaixo do card. | web | — |
| RF-11.2 | É possível alternar entre 3 presets pré-definidos. | web | — |
| RF-11.3 | Os presets respeitam a marca (tons de verde e fundo escuro). | manual | — |
| RF-11.4 | O card é atualizado em tempo real conforme o preset selecionado. | web | — |
| RF-11.5 | O card exportado é sempre vertical (9:16). | web | — |

### US 12 — Exportação

[frontend#203](https://github.com/Recorda-ages/recorda-frontend/issues/203) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-12.1 | A interface oferece botões de ação para compartilhamento. | web | — |
| RF-12.2 | O compartilhamento aciona a intent específica do Instagram Stories. | nativo | — |
| RF-12.3 | É possível baixar o card para a galeria do dispositivo. | nativo | — |
| RF-12.4 | Sem Instagram instalado, há tratamento de erro e compartilhamento genérico do sistema. | nativo | — |
| RF-12.5 | O download pede permissão de escrita na galeria, com tratamento para negação. | nativo | — |
| RF-12.6 | Há confirmação visual de conclusão. | nativo | — |

## E9 — Denúncias

### US 40 — Denúncia de Recorda

[frontend#222](https://github.com/Recorda-ages/recorda-frontend/issues/222) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-40.1 | É possível denunciar uma Recorda pelo card do feed ou pelo menu da tela de detalhes. | web | — |
| RF-40.2 | A denúncia aceita justificativa opcional de até 500 caracteres. | web | — |
| RF-40.3 | O mesmo usuário não denuncia a mesma Recorda duas vezes (erro amigável). | web | — |
| RF-40.4 | A denúncia é registrada com status OPEN. | API | — |
| RF-40.5 | A Recorda continua visível após a denúncia. | web | — |
| RF-40.6 | O autor não é notificado nem vê quem denunciou. | web | — |

### US 41 — Denúncia de Perfil de Usuário

[frontend#223](https://github.com/Recorda-ages/recorda-frontend/issues/223) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-41.1 | É possível denunciar o perfil de outro usuário. | web | — |
| RF-41.2 | Não é possível denunciar o próprio perfil. | web | — |
| RF-41.3 | A denúncia de perfil aceita justificativa de até 500 caracteres. | web | — |
| RF-41.4 | O mesmo usuário não denuncia o mesmo perfil duas vezes (erro amigável). | web | — |
| RF-41.5 | A denúncia de perfil é registrada com status OPEN. | API | — |

### US 42 — Notificação ao Autor sobre Remoção de Conteúdo

[frontend#240](https://github.com/Recorda-ages/recorda-frontend/issues/240) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-42.1 | Quando a moderação remove uma Recorda, o autor recebe a notificação CONTENT_REMOVED com o motivo. | web | — |
| RF-42.2 | A notificação aparece com ícone de sistema, sem expor o administrador. | web | — |
| RF-42.3 | Tocar na notificação a marca como lida, sem navegar para a Recorda removida. | web | — |
| RF-42.4 | Usuários suspensos não recebem a notificação. | API | — |

## E10 — Administração e moderação

### US 44 — Visualização e Gestão de Denúncias

[frontend#224](https://github.com/Recorda-ages/recorda-frontend/issues/224) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-44.1 | O fluxo administrativo é exclusivo de usuários com role ADMIN. | web | — |
| RF-44.2 | As denúncias são listadas agrupadas por alvo, com tipo, identificador, número de denúncias abertas e data da mais recente. | web | — |
| RF-44.3 | O detalhe do alvo mostra o conteúdo denunciado e o histórico de denúncias (texto, data e denunciante). | web | — |
| RF-44.4 | O administrador pode mudar o status das denúncias para RESOLVED ou DISMISSED. | web | — |
| RF-44.5 | Toda mudança de status exige justificativa de até 500 caracteres, registrada na auditoria. | web | — |

### US 45 — Moderação e Remoção de Recordas

[frontend#225](https://github.com/Recorda-ages/recorda-frontend/issues/225) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-45.1 | O administrador remove logicamente uma Recorda pela tela de moderação. | web | — |
| RF-45.2 | A remoção exige justificativa de até 500 caracteres, salva de forma imutável na auditoria. | web | — |
| RF-45.3 | Remover a Recorda resolve automaticamente as denúncias pendentes dela. | web | — |
| RF-45.4 | A Recorda removida some imediatamente do feed, das buscas e do perfil do autor. | web | — |
| RF-45.5 | O autor da Recorda removida é notificado conforme a US 42 (RF-42.1).<br>_Fonte: Decisão do time, 2026-11-08: manter a notificação da US 42; substitui o critério original da US 45, que proibia notificar._ | web | — |

### US 46 — Moderação de Usuários (Suspensão e Reativação)

[frontend#226](https://github.com/Recorda-ages/recorda-frontend/issues/226) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-46.1 | O administrador busca contas por username ou nome e vê perfil e status (ACTIVE ou SUSPENDED). | web | — |
| RF-46.2 | Um administrador não pode suspender outro administrador (HTTP 403 e ação desabilitada na UI). | web | — |
| RF-46.3 | A suspensão exige motivo de até 500 caracteres, registrado na auditoria. | web | — |
| RF-46.4 | O conteúdo de usuários suspensos (Recordas, comentários e perfil) some para usuários comuns. | web | — |
| RF-46.5 | O administrador reativa uma conta suspensa com justificativa, voltando ao status ACTIVE. | web | — |

### US 47 — Log de Auditoria

[frontend#227](https://github.com/Recorda-ages/recorda-frontend/issues/227) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-47.1 | Toda ação de moderação (remoção, suspensão/reativação e mudança de status de denúncia) gera um registro imutável. | web | — |
| RF-47.2 | O registro guarda administrador, tipo de ação, alvo, motivo e timestamp UTC. | web | — |
| RF-47.3 | O painel tem o histórico cronológico paginado, com filtros por administrador e período. | web | — |
| RF-47.4 | A auditoria é append-only: não há endpoints de alteração ou exclusão. | API | — |

## TA — Termo de Abertura (sem User Story)

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-T01 | A busca de músicas, previews, álbuns, artistas e gêneros usa a API do Deezer.<br>_Fonte: Termo: Integrações; Decisão do time, 2026-11-08: o Deezer substitui Spotify/Apple Music por atender melhor ao projeto._ | web | — |

## NF — Requisitos não funcionais

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RNF-01 | O aplicativo funciona em iOS e Android.<br>_Fonte: Termo: objetivos_ | nativo | — |
| RNF-02 | A interface está disponível em português, inglês e espanhol, sem textos fixos fora das traduções.<br>_Fonte: Termo; US 33_ | web | — |
| RNF-03 | Não há coleta de dados comportamentais: só os dados necessários à conta e às preferências declaradas.<br>_Fonte: US 2; US 15_ | manual | — |
| RNF-04 | Toda comunicação do app com a API usa HTTPS.<br>_Fonte: Relatório de deploy_ | API | — |
| RNF-05 | A interface não trava esperando a rede: carregamentos mostram indicador e falhas oferecem tentar novamente.<br>_Fonte: US 1; US 18_ | web | — |
| RNF-06 | Datas e streaks são calculados no fuso America/Sao_Paulo.<br>_Fonte: US 37; US 38_ | API | — |
| RNF-07 | Fora do escopo: monetização, assinaturas, chat em tempo real, comunidades ou grupos, marketplace e streaming próprio.<br>_Fonte: Termo: fora do escopo_ | manual | — |

## Testes

| Teste | Descrição | Requisitos |
| --- | --- | --- |
| [the recovery form validates matching passwords of at least eight characters @mutates](../tests/auth/password-recovery.spec.ts#L10) | The recovery screen exposes the required fields and only enables submission for matching passwords of at least eight characters. | RF-05.1, RF-05.2 |
| [a new password replaces the old password and allows sign in @mutates](../tests/auth/password-recovery.spec.ts#L45) | A dedicated account resets its password directly through the form, then signs in with the new password. | RF-05.3 |
| [an unknown email and a network failure show the same generic error @mutates](../tests/auth/password-recovery.spec.ts#L76) | An unknown email and a failed request show the same generic message without revealing account existence. | RF-05.4 |
| [a signed-out user sees the login screen](../tests/auth/sign-in.spec.ts#L8) | Without a saved session the Splash hands over to Login, whose submit button stays disabled until the form is filled. | RF-01.3 |
| [signing in with valid credentials opens the feed](../tests/auth/sign-in.spec.ts#L24) | A regular account signs in with username and password on the shared login screen and lands on the Feed. | RF-04.1, RF-04.5 |
| [invalid credentials show one generic error](../tests/auth/sign-in.spec.ts#L39) | A wrong password and an unknown username both keep the user on Login with the same message, so the error never reveals which field is wrong. | RF-04.3 |
| [returning user browses the feed, opens settings and signs out](../tests/flows/session-lifecycle.spec.ts#L10) | A saved session opens the feed without logging in again; signing out from Settings asks for confirmation, returns to Login and clears the session for the next launch. | RF-04.6, RF-36.1, RF-36.2 |
