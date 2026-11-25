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

226 requisitos, 199 verificáveis por esta suíte (web ou API), 177 cobertos por 155 teste(s). 20 decididos mas ainda não atendidos pelo código (⚠️).

| Épico | Nome | Requisitos | Web | API | Nativo | Manual | Cobertos |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E2 | Autenticação, cadastro e onboarding | 32 | 26 | 4 | 0 | 2 | 26 |
| E3 | Criação e publicação de Recordas | 25 | 16 | 4 | 5 | 0 | 16 |
| E4 | Feed | 26 | 18 | 2 | 6 | 0 | 18 |
| E5 | Interações sociais | 39 | 36 | 3 | 0 | 0 | 36 |
| E6 | Perfil e configurações | 22 | 20 | 2 | 0 | 0 | 20 |
| E7 | Memórias e estatísticas | 24 | 20 | 0 | 2 | 2 | 20 |
| E8 | Compartilhamento de cards | 16 | 9 | 0 | 5 | 2 | 9 |
| E9 | Denúncias | 15 | 12 | 3 | 0 | 0 | 12 |
| E10 | Administração e moderação | 19 | 18 | 1 | 0 | 0 | 17 |
| TA | Termo de Abertura (sem User Story) | 1 | 1 | 0 | 0 | 0 | 1 |
| NF | Requisitos não funcionais | 7 | 2 | 2 | 1 | 2 | 2 |

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
- **RF-07.1**: GET /music/tracks/search devolve genre_id sempre null, e o app não envia song_genre_name ao publicar.
- **RF-08.5**: Não implementado: o model recorda não tem Data da Memória nem Local (as marcações já existem).
- **RF-08.6**: Não implementado: o model recorda não tem Data da Memória nem Local (as marcações já existem).
- **RF-09.1**: Não implementado: o model recorda não tem Data da Memória nem Local (as marcações já existem).
- **RF-09.4**: Só no build web: publicar falha antes de enviar a mídia, porque uploadRecordaMedia (recorda-frontend/src/features/recorda-publish/api) usa File do expo-file-system, sem suporte no web.
- **RF-10.4**: No web, a captura do card (html2canvas-pro em ShareCardScreen) ignora contentFit="cover" e estica mídias que não são verticais, como o vídeo do seed.
- **RF-11.2**: ShareCardScreen oferece quatro presets (light, mint, teal, dark); a US 11 exige exatamente três.
- **RF-14.2**: O card não mostra a capa da música: RecordaCard (recorda-frontend/src/features/feed/components/RecordaCard.tsx) ignora song_cover_url.
- **RF-17.2**: Não implementado: o model recorda não tem Data da Memória nem Local (as marcações já existem).
- **RF-20.5**: O FollowButton pede confirmação (UnfollowDialog) antes de deixar de seguir; ver OPEN_QUESTIONS.
- **RF-24.3**: A linha do comentário não mostra a data (CommentRow em recorda-frontend/src/features/feed/components/RecordaDetailView.tsx).
- **RF-27.3**: GET /users/suggestions já retorna common_genres/common_artists, mas SuggestedProfiles (recorda-frontend) não os mostra.
- **RF-28.2**: Só no build web: trocar o avatar não envia nada, porque profileService.uploadAvatar (recorda-frontend/src/features/profile/services/profileService.ts) usa File do expo-file-system, sem suporte no web. No app (Expo Go) a troca funciona; remover funciona nas duas plataformas.
- **RF-29.2**: O StreakBadge do frontend oculta o streak quando can_view_content é false; ver OPEN_QUESTIONS.
- **RF-34.1**: A tela Minha conta ainda lê e salva pelo accountService.mock (recorda-frontend/src/features/account/services/accountAdapter.ts), embora o backend já tenha GET e PATCH /users/me/account.
- **RF-34.2**: A tela Minha conta ainda lê e salva pelo accountService.mock (recorda-frontend/src/features/account/services/accountAdapter.ts), embora o backend já tenha GET e PATCH /users/me/account.
- **RF-35.2**: A streak do perfil inclui Recordas excluídas (list_publication_times em recorda-backend/app/repositories/recorda_repository.py), enquanto a de Métricas já as exclui.
- **RF-37.13**: O calendário vazio só diz "Nenhuma memória neste mês", sem convite nem atalho para publicar (MemoryCalendarGrid em recorda-frontend/src/features/memories-calendar).
- **RF-38.2**: O ranking de gêneros mostra só nome e percentual, sem a contagem (TopGenresRankingCard em recorda-frontend/src/features/memories-metrics).

## Pontos em aberto

Contradições e lacunas encontradas entre o Termo, as User Stories e o código. Precisam de
decisão do time antes de virarem teste.

- Duração de vídeo: a US 6 cita 60 s como proposta (RF-06.6), sem valor definido.
- Streak em perfil privado sem aprovação (RF-29.2): a US 29 e a decisão D-06 do backend mostram o streak, mas o StreakBadge do frontend o oculta provisoriamente (recorda-frontend docs/issue-260.md).
- Confirmação ao deixar de seguir (RF-20.5): a US 20 diz que não há confirmação, mas o frontend pede "Deixar de seguir?" (UnfollowDialog, escolha da recorda-frontend docs/issue-255.md).

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
| FL-01 Abertura do app e sessão | [#1](https://github.com/Recorda-ages/recorda-test-suite/issues/1) | 9 | 9 | 9 | 1 | não |
| FL-02 Login | [#2](https://github.com/Recorda-ages/recorda-test-suite/issues/2) | 4 | 4 | 4 | 0 | não |
| FL-03 Cadastro e onboarding | [#3](https://github.com/Recorda-ages/recorda-test-suite/issues/3) | 11 | 11 | 11 | 0 | sim (`@mutates`) |
| FL-04 Recuperação de senha | [#4](https://github.com/Recorda-ages/recorda-test-suite/issues/4) | 4 | 4 | 4 | 0 | sim (`@mutates`) |
| FL-05 Criação e publicação de Recorda | [#5](https://github.com/Recorda-ages/recorda-test-suite/issues/5) | 22 | 17 | 17 | 4 | sim (`@mutates`) |
| FL-06 Card de compartilhamento | [#6](https://github.com/Recorda-ages/recorda-test-suite/issues/6) | 14 | 9 | 9 | 2 | não |
| FL-07 Feed | [#7](https://github.com/Recorda-ages/recorda-test-suite/issues/7) | 20 | 15 | 15 | 1 | não |
| FL-08 Detalhes da Recorda, curtidas e comentários | [#8](https://github.com/Recorda-ages/recorda-test-suite/issues/8) | 17 | 16 | 16 | 2 | sim (`@mutates`) |
| FL-09 Busca, seguir e rede de seguidores | [#9](https://github.com/Recorda-ages/recorda-test-suite/issues/9) | 17 | 17 | 17 | 2 | sim (`@mutates`) |
| FL-10 Notificações | [#10](https://github.com/Recorda-ages/recorda-test-suite/issues/10) | 7 | 7 | 7 | 0 | sim (`@mutates`) |
| FL-11 Perfil pessoal e de terceiros | [#11](https://github.com/Recorda-ages/recorda-test-suite/issues/11) | 7 | 7 | 7 | 2 | sim (`@mutates`) |
| FL-12 Configurações, preferências e conta | [#12](https://github.com/Recorda-ages/recorda-test-suite/issues/12) | 12 | 12 | 12 | 2 | sim (`@mutates`) |
| FL-13 Memórias: calendário, métricas e retrospectiva | [#13](https://github.com/Recorda-ages/recorda-test-suite/issues/13) | 22 | 20 | 20 | 2 | não |
| FL-14 Denúncias | [#14](https://github.com/Recorda-ages/recorda-test-suite/issues/14) | 9 | 9 | 9 | 0 | sim (`@mutates`) |
| FL-15 Moderação administrativa | [#15](https://github.com/Recorda-ages/recorda-test-suite/issues/15) | 21 | 21 | 20 | 0 | sim (`@mutates`) |

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
| RF-01.2 | A Splash Screen é obrigatoriamente a primeira etapa ao abrir o aplicativo. | web | [splash is the first screen and hands over to login](../tests/flows/session-startup.spec.ts#L10)<br>[a saved user session opens the feed and survives reopening](../tests/flows/session-startup.spec.ts#L33)<br>[a saved administrator session opens only the administrative area](../tests/flows/session-startup.spec.ts#L60) |
| RF-01.3 | Sem sessão salva, a Splash encaminha para o Login. | web | [a signed-out user sees the login screen](../tests/auth/sign-in.spec.ts#L8)<br>[splash is the first screen and hands over to login](../tests/flows/session-startup.spec.ts#L10) |
| RF-01.4 | Com sessão válida de conta comum, a Splash encaminha para o Feed. | web | [a saved user session opens the feed and survives reopening](../tests/flows/session-startup.spec.ts#L33) |
| RF-01.5 | Com sessão válida de administrador, a Splash encaminha para a área administrativa, sem acesso a Feed, Perfil ou Criar Recorda. | web | [a saved administrator session opens only the administrative area](../tests/flows/session-startup.spec.ts#L60) |
| RF-01.6 | Sessão inválida ou expirada é apagada e o usuário vai para o Login. | web | [an invalid session is cleared before returning to login](../tests/flows/session-startup.spec.ts#L94)<br>[an expired session is cleared before returning to login](../tests/flows/session-startup.spec.ts#L94) |
| RF-01.7 | Se a verificação de sessão demorar mais que 3 s, o app segue para o Login; uma resposta tardia nunca causa uma segunda navegação.<br>_Fonte: Decisão do time, 2026-11-08: 3 s é o valor correto._<br>⚠️ O código usa 5 s (SPLASH_TIMEOUT_MS em recorda-frontend/src/features/splash/screens/SplashScreen.tsx). | web | [a slow session check sends the user to login after three seconds](../tests/flows/session-timeout.spec.ts#L42)<br>[a late valid session response cannot navigate away from login](../tests/flows/session-timeout.spec.ts#L69) |

### US 2 — Cadastro de Usuário

[frontend#31](https://github.com/Recorda-ages/recorda-frontend/issues/31) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-02.1 | A tela de Cadastro tem exatamente os campos Nome, Username, Email e Senha, sem confirmação de senha nem aceite de termos. | web | [the sign-up form asks only for name, username, email and password](../tests/auth/sign-up-onboarding.spec.ts#L114) |
| RF-02.2 | Username e email são únicos no sistema. | web | [a username or email already in use is rejected on its own field](../tests/auth/sign-up-onboarding.spec.ts#L134) |
| RF-02.3 | Todos os campos são validados antes do registro, com mensagens de erro específicas por campo. | web | [each invalid field shows its own error before anything is sent](../tests/auth/sign-up-onboarding.spec.ts#L164) |
| RF-02.4 | A senha tem no mínimo 8 caracteres. | web | [a password shorter than 8 characters is not accepted](../tests/auth/sign-up-onboarding.spec.ts#L196) |
| RF-02.5 | Após o cadastro, o usuário é autenticado automaticamente e encaminhado ao Onboarding, nunca direto ao Feed. | web | [a new account goes through the three onboarding steps before the Feed](../tests/auth/sign-up-onboarding.spec.ts#L53) |
| RF-02.6 | Não são coletados dados além dos necessários ao funcionamento da conta. | manual | — |
| RF-02.7 | Contas de administrador não podem ser criadas pelo cadastro. | API | — |

### US 3 — Onboarding e Preferências Musicais

[frontend#53](https://github.com/Recorda-ages/recorda-frontend/issues/53) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-03.1 | Imediatamente após o cadastro, o app conduz o usuário ao Onboarding. | web | [a new account goes through the three onboarding steps before the Feed](../tests/auth/sign-up-onboarding.spec.ts#L53) |
| RF-03.2 | O Onboarding tem três passos (artistas, gêneros e música favorita) com dados do Deezer, e o indicador de progresso reflete os três passos. | web | [a new account goes through the three onboarding steps before the Feed](../tests/auth/sign-up-onboarding.spec.ts#L53) |
| RF-03.3 | Cada passo exibe um grid de opções selecionáveis (chips). | web | [a new account goes through the three onboarding steps before the Feed](../tests/auth/sign-up-onboarding.spec.ts#L53) |
| RF-03.4 | É preciso selecionar no mínimo 3 artistas e 3 gêneros para prosseguir, e exatamente 1 música favorita. | web | [each onboarding step needs its minimum choices to move on](../tests/auth/sign-up-onboarding.spec.ts#L225) |
| RF-03.5 | Artistas e gêneros formam o Perfil Musical, única fonte da Afinidade Musical. | API | — |
| RF-03.6 | A Música Favorita não participa da Afinidade Musical e aparece em destaque no cabeçalho do Perfil Pessoal. | web | [a new account goes through the three onboarding steps before the Feed](../tests/auth/sign-up-onboarding.spec.ts#L53) |
| RF-03.7 | É possível voltar ao passo anterior sem perder as seleções. | web | [going back to a previous step keeps what was selected](../tests/auth/sign-up-onboarding.spec.ts#L266) |

### US 4 — Autenticação de Usuário

[frontend#112](https://github.com/Recorda-ages/recorda-frontend/issues/112) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-04.1 | A tela de Login tem os campos Usuário e Senha e é a mesma para usuários comuns e administradores. | web | [signing in with valid credentials opens the feed](../tests/auth/sign-in.spec.ts#L24)<br>[an administrator signs in on the same screen and lands on the admin area](../tests/auth/sign-in.spec.ts#L39) |
| RF-04.2 | As credenciais são validadas no backend, que retorna também o tipo de conta. | API | — |
| RF-04.3 | Credenciais inválidas exibem uma única mensagem genérica, sem revelar qual campo está incorreto. | web | [invalid credentials show one generic error](../tests/auth/sign-in.spec.ts#L71) |
| RF-04.4 | Administradores são roteados para a área administrativa, sem acesso à navegação do app comum. | web | [an administrator signs in on the same screen and lands on the admin area](../tests/auth/sign-in.spec.ts#L39) |
| RF-04.5 | Usuários comuns são roteados para o Feed. | web | [signing in with valid credentials opens the feed](../tests/auth/sign-in.spec.ts#L24) |
| RF-04.6 | A sessão é persistida no dispositivo: reabrir o app não exige novo login. | web | [returning user browses the feed, opens settings and signs out](../tests/flows/session-lifecycle.spec.ts#L14)<br>[a saved user session opens the feed and survives reopening](../tests/flows/session-startup.spec.ts#L33) |
| RF-04.7 | Não há expiração de sessão por inatividade; a sessão dura até o token expirar. | API | — |

### US 5 — Recuperação de Senha

[frontend#113](https://github.com/Recorda-ages/recorda-frontend/issues/113) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-05.1 | A tela Recuperar Senha tem os campos Email, Nova Senha e Confirmar Senha e o botão Redefinir Senha. | web | [resetting a password to eight characters replaces the old credentials](../tests/auth/password-recovery.spec.ts#L24) |
| RF-05.2 | Nova Senha e Confirmar Senha devem ser idênticas e ter no mínimo 8 caracteres. | web | [resetting a password to eight characters replaces the old credentials](../tests/auth/password-recovery.spec.ts#L24)<br>[password recovery stays blocked by matching seven-character passwords until corrected](../tests/auth/password-recovery.spec.ts#L77)<br>[password recovery stays blocked by a seven-character new password until corrected](../tests/auth/password-recovery.spec.ts#L77)<br>[password recovery stays blocked by a seven-character confirmation until corrected](../tests/auth/password-recovery.spec.ts#L77)<br>[different passwords block recovery until the confirmation matches](../tests/auth/password-recovery.spec.ts#L115) |
| RF-05.3 | A senha da conta com o email informado é substituída diretamente, sem email nem token de verificação. | web | [resetting a password to eight characters replaces the old credentials](../tests/auth/password-recovery.spec.ts#L24) |
| RF-05.4 | Email sem conta exibe o mesmo erro genérico das outras falhas, sem confirmar a existência da conta. | web | [an unknown recovery email shows the same generic error as a network failure](../tests/auth/password-recovery.spec.ts#L148) |

## E3 — Criação e publicação de Recordas

### US 6 — Captura e Seleção de Mídia

[frontend#62](https://github.com/Recorda-ages/recorda-frontend/issues/62) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-06.1 | A tela Criar Recorda é acessível pela barra inferior e tem visor de câmera e botão central de captura. | web | [Criar Recorda opens the camera from the bottom bar](../tests/recorda-creation/create-recorda.spec.ts#L42) |
| RF-06.2 | Ao entrar na tela, a câmera abre diretamente (prioridade sobre a galeria). | nativo | — |
| RF-06.3 | É possível capturar mídia em tempo real ou selecioná-la da galeria. | nativo | — |
| RF-06.4 | Cada Recorda tem exatamente uma foto ou um vídeo. | API | — |
| RF-06.5 | Permissões de câmera e galeria são pedidas em runtime, com mensagem e atalho para as configurações quando negadas. | nativo | — |
| RF-06.6 | Vídeos têm duração máxima (proposta: 60 s) e são comprimidos antes do upload. | nativo | — |

### US 7 — Busca e Associação da Música

[frontend#69](https://github.com/Recorda-ages/recorda-frontend/issues/69) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-07.1 | O campo Música abre um buscador do Deezer que retorna faixa, artista, álbum, gênero e capa.<br>⚠️ GET /music/tracks/search devolve genre_id sempre null, e o app não envia song_genre_name ao publicar. | web | [the song search finds Deezer tracks by song, artist or album](../tests/recorda-creation/create-recorda.spec.ts#L61)<br>[song search results carry the genre](../tests/recorda-creation/create-recorda.spec.ts#L96) |
| RF-07.2 | A busca funciona por nome de música, artista ou álbum. | web | [the song search finds Deezer tracks by song, artist or album](../tests/recorda-creation/create-recorda.spec.ts#L61) |
| RF-07.3 | É possível ouvir o preview de 30 s de um resultado antes de confirmar. | nativo | — |
| RF-07.4 | A publicação é associada a uma música específica. | web | [the next step needs a song, which then comes filled in and can't be changed there](../tests/recorda-creation/create-recorda.spec.ts#L145) |
| RF-07.5 | É persistido o identificador da faixa no Deezer, nunca a URL do preview. | API | — |
| RF-07.6 | Indisponibilidade da API de música é tratada com opção de tentar novamente. | web | [a failed song search offers to try again](../tests/recorda-creation/create-recorda.spec.ts#L116) |

### US 8 — Detalhes da Recorda

[frontend#76](https://github.com/Recorda-ages/recorda-frontend/issues/76) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-08.1 | Uma única tela mostra o preview da mídia com capa, título e artista da música sobrepostos e um campo de descrição. | web | [the next step needs a song, which then comes filled in and can't be changed there](../tests/recorda-creation/create-recorda.spec.ts#L145) |
| RF-08.2 | A descrição é opcional, com limite de 2200 caracteres. | web | [the description is optional and capped at 2200 characters](../tests/recorda-creation/create-recorda.spec.ts#L189) |
| RF-08.3 | A música vem preenchida e não é editável nesta tela. | web | [the next step needs a song, which then comes filled in and can't be changed there](../tests/recorda-creation/create-recorda.spec.ts#L145) |
| RF-08.4 | Publicar só fica habilitado com a música associada. | web | [the next step needs a song, which then comes filled in and can't be changed there](../tests/recorda-creation/create-recorda.spec.ts#L145) |
| RF-08.5 | A tela de detalhes permite informar a Data da Memória (quando o momento aconteceu).<br>_Fonte: Decisão do time, 2026-11-08: obrigatório implementar._<br>⚠️ Não implementado: o model recorda não tem Data da Memória nem Local (as marcações já existem). | web | [the last step asks for the memory's date](../tests/recorda-creation/create-recorda.spec.ts#L239) |
| RF-08.6 | A tela de detalhes permite informar o Local da memória.<br>_Fonte: Decisão do time, 2026-11-08: obrigatório implementar._<br>⚠️ Não implementado: o model recorda não tem Data da Memória nem Local (as marcações já existem). | web | [the last step asks for the memory's place](../tests/recorda-creation/create-recorda.spec.ts#L239) |
| RF-08.7 | A tela de detalhes permite marcar outros usuários na Recorda.<br>_Fonte: Decisão do time, 2026-11-08: obrigatório implementar; Termo: marcação de amigos._ | web | [followed people can be marked in the Recorda](../tests/recorda-creation/create-recorda.spec.ts#L260) |

### US 9 — Publicação da Recorda

[frontend#84](https://github.com/Recorda-ages/recorda-frontend/issues/84) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-09.1 | A Recorda é composta por mídia, música, descrição opcional, Data da Memória, Local e marcações.<br>_Fonte: Decisão do time, 2026-11-08: Data da Memória, Local e marcações voltam ao escopo._<br>⚠️ Não implementado: o model recorda não tem Data da Memória nem Local (as marcações já existem). | API | — |
| RF-09.2 | A visibilidade não é escolhida na publicação: deriva da privacidade da conta, sem seletor nem campo por publicação. | web | [publishing has no visibility choice](../tests/recorda-creation/create-recorda.spec.ts#L212) |
| RF-09.3 | A Data de Publicação é registrada automaticamente. | API | — |
| RF-09.4 | Após publicar, a Recorda aparece imediatamente no perfil do autor e fica disponível aos feeds conforme a visibilidade da conta.<br>⚠️ Só no build web: publicar falha antes de enviar a mídia, porque uploadRecordaMedia (recorda-frontend/src/features/recorda-publish/api) usa File do expo-file-system, sem suporte no web. | web | [a published Recorda shows the upload progress and appears on the author's profile](../tests/recorda-creation/create-recorda.spec.ts#L327) |
| RF-09.5 | Há indicador de progresso no upload e, em caso de falha, é possível tentar novamente sem perder os dados nem recapturar a mídia. | web | [a failed upload keeps the draft and can be retried](../tests/recorda-creation/create-recorda.spec.ts#L288) |
| RF-09.6 | Usuários marcados são notificados da marcação.<br>_Fonte: Decisão do time, 2026-11-08; US 26._ | web | [follows, requests, likes, comments and mentions notify the account owner](../tests/notifications/notification-center.spec.ts#L147) |

## E4 — Feed

### US 14 — Feed: Aba Seguindo

[frontend#158](https://github.com/Recorda-ages/recorda-frontend/issues/158) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-14.1 | A aba Seguindo é uma das duas abas superiores do Feed (com Geral), acessível pela barra inferior. | web | [the Feed opens on Para Você, with Seguindo as the other top tab](../tests/feed/following-tab.spec.ts#L11) |
| RF-14.2 | Os cards mostram avatar e username do autor, mídia, música (título, artista e capa), descrição e as ações Curtir, Comentar e Denunciar.<br>⚠️ O card não mostra a capa da música: RecordaCard (recorda-frontend/src/features/feed/components/RecordaCard.tsx) ignora song_cover_url. | web | [a card shows the author, the media, the song, the caption and the actions](../tests/feed/following-tab.spec.ts#L45)<br>[a card shows the song's cover](../tests/feed/following-tab.spec.ts#L98) |
| RF-14.3 | A aba lista apenas Recordas de quem o usuário segue, da mais recente para a mais antiga. | web | [Seguindo lists only followed people, newest first, including approved private accounts](../tests/feed/following-tab.spec.ts#L129) |
| RF-14.4 | Só aparecem Recordas de autores com conta pública ou que aprovaram a solicitação de seguir; não é preciso seguir mutuamente. | web | [Seguindo lists only followed people, newest first, including approved private accounts](../tests/feed/following-tab.spec.ts#L129) |
| RF-14.5 | O estado vazio orienta a seguir perfis ou criar a primeira Recorda. | web | [with nobody followed, Seguindo suggests following people](../tests/feed/following-tab.spec.ts#L185) |

### US 15 — Feed: Aba Geral

[frontend#161](https://github.com/Recorda-ages/recorda-frontend/issues/161) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-15.1 | A aba Geral é a aba padrão ao abrir o Feed. | web | [the Feed opens on Para Você, with Seguindo as the other top tab](../tests/feed/following-tab.spec.ts#L11) |
| RF-15.2 | A aba Geral une, por recência, as Recordas de quem o usuário segue e Recordas públicas de perfis não seguidos com Afinidade Musical maior que zero. | web | [Para Você mixes followed people and public accounts with musical affinity, by recency](../tests/feed/general-tab.spec.ts#L62) |
| RF-15.3 | A Afinidade Musical decide só a elegibilidade dos itens de descoberta, não a ordenação. | API | — |
| RF-15.4 | A Afinidade Musical usa apenas artistas e gêneros do onboarding; nenhum dado comportamental entra no cálculo. | API | — |
| RF-15.5 | Recordas restritas a seguidores só aparecem para seguidores aprovados. | web | [a private account's Recordas reach Para Você only once the follow is approved](../tests/feed/general-tab.spec.ts#L100) |
| RF-15.6 | Sem itens de descoberta elegíveis, a aba exibe as Recordas de quem o usuário segue. | web | [with nobody to discover, Para Você shows the followed people's Recordas](../tests/feed/general-tab.spec.ts#L140) |

### US 16 — Reprodução Automática

[frontend#165](https://github.com/Recorda-ages/recorda-frontend/issues/165) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-16.1 | Ao entrar em foco no scroll, em qualquer aba, a Recorda toca automaticamente o preview de 30 s. | nativo | — |
| RF-16.2 | Apenas uma Recorda toca por vez; ao sair de foco, a reprodução para. | nativo | — |
| RF-16.3 | O preview reinicia em loop enquanto a Recorda estiver em foco. | nativo | — |
| RF-16.4 | Vídeos são sempre exibidos sem som; só a música emite áudio. | web | [a video plays without its own sound](../tests/feed/playback.spec.ts#L14) |
| RF-16.5 | Há um controle visível para silenciar/reativar, e a escolha persiste durante a sessão. | web | [the mute toggle is on every card and the choice lasts for the session](../tests/feed/playback.spec.ts#L47) |
| RF-16.6 | Ao sair da tela ou minimizar o app, o áudio para. | nativo | — |

### US 17 — Detalhes da Recorda (feed)

[frontend#167](https://github.com/Recorda-ages/recorda-frontend/issues/167) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-17.1 | Tocar num card do feed ou numa miniatura do perfil abre a tela Detalhes da Recorda. | web | [a feed card and a profile thumbnail both open the Recorda details](../tests/recorda-details/recorda-details.spec.ts#L48) |
| RF-17.2 | A tela mostra mídia, avatar e username do autor, relato completo, música, Data da Memória, Local, marcações e comentários.<br>⚠️ Não implementado: o model recorda não tem Data da Memória nem Local (as marcações já existem). | web | [the details show the whole Recorda, with memory date, place and tagged people](../tests/recorda-details/recorda-details.spec.ts#L76) |
| RF-17.3 | A música continua tocando na transição do feed para os detalhes, sem reiniciar. | nativo | — |
| RF-17.4 | A tela oferece curtir, comentar e compartilhar. | web | [the feed card and the details offer like, comment and share](../tests/recorda-details/recorda-details.spec.ts#L114) |
| RF-17.5 | O menu de três pontos oferece só excluir na própria Recorda e só denunciar na de outra pessoa; não há edição. | web | [the three-dots menu offers only delete on your Recorda and only report on others'](../tests/recorda-details/recorda-details.spec.ts#L152) |

### US 18 — Carregamento Progressivo

[frontend#171](https://github.com/Recorda-ages/recorda-frontend/issues/171) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-18.1 | O feed carrega em páginas, buscando mais itens perto do fim da lista. | web | [the next page loads near the end of the list, and its failure can be retried](../tests/feed/loading.spec.ts#L73) |
| RF-18.2 | Há pull-to-refresh nas duas abas. | nativo | — |
| RF-18.3 | Há indicador de carregamento e tratamento de erro de rede com opção de tentar novamente. | web | [while the first page loads there is an indicator, and a failure offers to try again](../tests/feed/loading.spec.ts#L32)<br>[the next page loads near the end of the list, and its failure can be retried](../tests/feed/loading.spec.ts#L73) |
| RF-18.4 | A posição de rolagem e o estado de reprodução são preservados ao alternar entre Geral e Seguindo. | web | [switching tabs keeps each tab's scroll position](../tests/feed/loading.spec.ts#L129) |

## E5 — Interações sociais

### US 19 — Busca de Usuários

[frontend#173](https://github.com/Recorda-ages/recorda-frontend/issues/173) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-19.1 | É possível buscar usuários por username. | web | [search finds a person by username, shows the relation and opens the profile](../tests/social/search-and-follow.spec.ts#L20) |
| RF-19.2 | Os resultados mostram avatar, username e o estado da relação (seguindo, solicitado ou nenhuma). | web | [search finds a person by username, shows the relation and opens the profile](../tests/social/search-and-follow.spec.ts#L20) |
| RF-19.3 | Tocar num resultado abre o perfil do usuário. | web | [search finds a person by username, shows the relation and opens the profile](../tests/social/search-and-follow.spec.ts#L20) |
| RF-19.4 | Perfis privados aparecem na busca, mas o conteúdo continua protegido. | web | [a private account appears in search but its content stays protected](../tests/social/search-and-follow.spec.ts#L72) |

### US 20 — Sistema de Seguidores

[frontend#176](https://github.com/Recorda-ages/recorda-frontend/issues/176) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-20.1 | O perfil de terceiros tem um botão primário Seguir. | web | [following a public account takes effect at once](../tests/social/search-and-follow.spec.ts#L105) |
| RF-20.2 | Seguir uma conta pública é efetivado imediatamente. | web | [following a public account takes effect at once](../tests/social/search-and-follow.spec.ts#L105) |
| RF-20.3 | Seguir uma conta privada cria uma solicitação (estado Solicitado) e notifica o alvo. | web | [following a private account sends a request and notifies the owner](../tests/social/search-and-follow.spec.ts#L135) |
| RF-20.4 | A relação é assimétrica: seguir não implica ser seguido. | API | — |
| RF-20.5 | É possível deixar de seguir a qualquer momento, sem confirmação nem notificação ao outro lado.<br>⚠️ O FollowButton pede confirmação (UnfollowDialog) antes de deixar de seguir; ver OPEN_QUESTIONS. | web | [unfollowing removes the follow without telling the other person](../tests/social/search-and-follow.spec.ts#L169)<br>[unfollowing needs no confirmation](../tests/social/search-and-follow.spec.ts#L198) |
| RF-20.6 | Não é possível seguir a si mesmo nem enviar solicitação duplicada. | API | — |

### US 21 — Solicitações para Seguir

[frontend#179](https://github.com/Recorda-ages/recorda-frontend/issues/179) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-21.1 | As solicitações recebidas são acessíveis pela central de notificações. | web | [follow requests are accepted or declined from the notification list](../tests/notifications/notification-center.spec.ts#L216) |
| RF-21.2 | Ao aceitar, o solicitante passa a ver as Recordas imediatamente e é notificado da aprovação. | web | [an accepted request shows the Recordas at once and tells the requester](../tests/social/follow-requests.spec.ts#L26) |
| RF-21.3 | Ao recusar, a solicitação é descartada sem notificar o solicitante. | web | [a declined request is dropped without telling the requester](../tests/social/follow-requests.spec.ts#L64) |
| RF-21.4 | Quem enviou uma solicitação pendente pode cancelá-la. | web | [the requester can cancel a pending request](../tests/social/follow-requests.spec.ts#L94) |

### US 22 — Gerenciamento de Seguidores

[frontend#181](https://github.com/Recorda-ages/recorda-frontend/issues/181) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-22.1 | O perfil dá acesso às listas de Seguidores e Seguindo, com busca em cada lista. | web | [the profile opens the followers and following lists, each with a search](../tests/social/followers.spec.ts#L11) |
| RF-22.2 | É possível remover um seguidor, sem notificá-lo; em conta privada ele precisa solicitar de novo. | web | [removing a follower is silent, and on a private account they must ask again](../tests/social/followers.spec.ts#L58) |
| RF-22.3 | Em conta privada, só seguidores aprovados veem as listas. | web | [on a private account only approved followers can see the lists](../tests/social/followers.spec.ts#L99) |

### US 23 — Curtir uma Recorda

[frontend#184](https://github.com/Recorda-ages/recorda-frontend/issues/184) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-23.1 | Os cards do feed e a tela de detalhes têm o botão de curtir. | web | [the feed card and the details offer like, comment and share](../tests/recorda-details/recorda-details.spec.ts#L114) |
| RF-23.2 | Curtir alterna entre curtido e não curtido, com resposta visual imediata e reconciliação com o servidor. | web | [liking toggles at once, shows the count and matches the server](../tests/recorda-details/recorda-details.spec.ts#L210) |
| RF-23.3 | A Recorda exibe a contagem de curtidas. | web | [liking toggles at once, shows the count and matches the server](../tests/recorda-details/recorda-details.spec.ts#L210) |
| RF-23.4 | O autor é notificado das curtidas, exceto das próprias. | web | [the author is notified of other people's likes but not of their own](../tests/recorda-details/recorda-details.spec.ts#L274) |

### US 24 — Comentários

[frontend#187](https://github.com/Recorda-ages/recorda-frontend/issues/187) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-24.1 | A tela de detalhes lista os comentários e tem um campo para escrever um novo. | web | [comments are a flat list in the order they were written](../tests/recorda-details/recorda-details.spec.ts#L317) |
| RF-24.2 | Os comentários são uma lista plana por data de criação, sem respostas nem curtidas. | web | [comments are a flat list in the order they were written](../tests/recorda-details/recorda-details.spec.ts#L317) |
| RF-24.3 | Cada comentário mostra avatar, username, texto e data.<br>⚠️ A linha do comentário não mostra a data (CommentRow em recorda-frontend/src/features/feed/components/RecordaDetailView.tsx). | web | [each comment shows avatar, username, text and date](../tests/recorda-details/recorda-details.spec.ts#L360) |
| RF-24.4 | Comentários têm no máximo 500 caracteres. | web | [a comment can't be longer than 500 characters](../tests/recorda-details/recorda-details.spec.ts#L396) |
| RF-24.5 | Só comenta quem tem permissão para ver a Recorda. | API | — |
| RF-24.6 | O autor da Recorda é notificado de novos comentários. | web | [the author is notified of new comments](../tests/recorda-details/recorda-details.spec.ts#L429) |

### US 25 — Excluir Comentário

[frontend#190](https://github.com/Recorda-ages/recorda-frontend/issues/190) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-25.1 | O autor do comentário pode excluí-lo. | web | [the comment author deletes their comment after confirming](../tests/recorda-details/recorda-details.spec.ts#L457) |
| RF-25.2 | O autor da Recorda pode excluir qualquer comentário dela. | web | [the Recorda author deletes someone else's comment for everyone](../tests/recorda-details/recorda-details.spec.ts#L510) |
| RF-25.3 | A exclusão pede confirmação e vale imediatamente para todos. | web | [the comment author deletes their comment after confirming](../tests/recorda-details/recorda-details.spec.ts#L457)<br>[the Recorda author deletes someone else's comment for everyone](../tests/recorda-details/recorda-details.spec.ts#L510) |

### US 26 — Central de Notificações

[frontend#193](https://github.com/Recorda-ages/recorda-frontend/issues/193) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-26.1 | O cabeçalho do Feed tem um sino que abre as notificações. | web | [the bell shows the unread count and opening the list marks it as read](../tests/notifications/notification-center.spec.ts#L31) |
| RF-26.2 | A lista mostra o histórico recente, do mais novo ao mais antigo, com ícone do autor da ação, descrição e ação opcional. | web | [notifications are listed newest first with who acted, what happened and the action](../tests/notifications/notification-center.spec.ts#L82) |
| RF-26.3 | Geram notificação: novo seguidor, solicitação recebida, solicitação aprovada, curtida, comentário e marcação. | web | [follows, requests, likes, comments and mentions notify the account owner](../tests/notifications/notification-center.spec.ts#L147)<br>[an approved follow request notifies the requester](../tests/notifications/notification-center.spec.ts#L193) |
| RF-26.4 | Solicitações para seguir podem ser aceitas ou recusadas na própria lista. | web | [follow requests are accepted or declined from the notification list](../tests/notifications/notification-center.spec.ts#L216) |
| RF-26.5 | O sino mostra o contador de não lidas, e abrir a lista marca todas como lidas. | web | [the bell shows the unread count and opening the list marks it as read](../tests/notifications/notification-center.spec.ts#L31) |
| RF-26.6 | Tocar numa notificação leva ao conteúdo relacionado. | web | [tapping a notification opens the related Recorda or profile](../tests/notifications/notification-center.spec.ts#L271) |

### US 27 — Sugestões por Afinidade

[frontend#196](https://github.com/Recorda-ages/recorda-frontend/issues/196) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-27.1 | A busca exibe perfis sugeridos ordenados por Afinidade Musical. | web | [suggestions are ordered by musical affinity and skip followed, requested and yourself](../tests/social/suggestions.spec.ts#L57) |
| RF-27.2 | Ficam de fora perfis já seguidos, solicitações pendentes e o próprio usuário. | web | [suggestions are ordered by musical affinity and skip followed, requested and yourself](../tests/social/suggestions.spec.ts#L57) |
| RF-27.3 | Cada sugestão mostra avatar, username, gêneros/artistas em comum e a ação de seguir.<br>⚠️ GET /users/suggestions já retorna common_genres/common_artists, mas SuggestedProfiles (recorda-frontend) não os mostra. | web | [each suggestion shows the person and a follow action](../tests/social/suggestions.spec.ts#L98)<br>[each suggestion shows the genres and artists in common](../tests/social/suggestions.spec.ts#L122) |

## E6 — Perfil e configurações

### US 28 — Perfil pessoal

[backend#117](https://github.com/Recorda-ages/recorda-backend/issues/117) · em andamento

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-28.1 | O perfil mostra nome, username, avatar, contadores, uma única streak, música favorita e chips de artistas e gêneros. | web | [the profile shows identity, avatar, counters, one streak and music](../tests/profile/own-profile.spec.ts#L19) |
| RF-28.2 | É possível trocar e remover o avatar.<br>⚠️ Só no build web: trocar o avatar não envia nada, porque profileService.uploadAvatar (recorda-frontend/src/features/profile/services/profileService.ts) usa File do expo-file-system, sem suporte no web. No app (Expo Go) a troca funciona; remover funciona nas duas plataformas. | web | [removing the avatar brings back the default picture](../tests/profile/own-profile.spec.ts#L189)<br>[choosing a picture from the gallery sets it as the avatar](../tests/profile/own-profile.spec.ts#L223) |
| RF-28.3 | O perfil mostra a grade paginada das próprias Recordas. | web | [the grid loads the next page of Recordas when scrolling to the end](../tests/profile/own-profile.spec.ts#L150) |
| RF-28.4 | O perfil mantém as abas Recordas, Métricas e Calendário. | web | [the Recordas, Métricas and Calendário tabs switch the content below the header](../tests/profile/own-profile.spec.ts#L79) |

### US 29 — Perfil de terceiros

[backend#118](https://github.com/Recorda-ages/recorda-backend/issues/118) · em andamento

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-29.1 | Perfil público, ou com follow aprovado, mostra cabeçalho, contadores e conteúdo. | web | [a public profile shows the header, counters and Recordas](../tests/profile/third-party-profile.spec.ts#L17)<br>[a private profile with an approved follow shows the header, counters and Recordas](../tests/profile/third-party-profile.spec.ts#L17) |
| RF-29.2 | Perfil privado sem aprovação mostra nome, username, streak e música, oculta contadores e Recordas e mantém as três abas com aviso de restrição.<br>⚠️ O StreakBadge do frontend oculta o streak quando can_view_content é false; ver OPEN_QUESTIONS. | web | [a private profile without approval hides counters and Recordas behind a notice](../tests/profile/third-party-profile.spec.ts#L57)<br>[a private profile without approval still shows the streak](../tests/profile/third-party-profile.spec.ts#L111) |

### US 31 — Editar preferências musicais

[backend#119](https://github.com/Recorda-ages/recorda-backend/issues/119) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-31.1 | A edição abre com as escolhas atuais selecionadas. | web | [the editor opens with the current artists, genres and song selected](../tests/settings/music-preferences.spec.ts#L47) |
| RF-31.2 | Salvar exige no mínimo 3 artistas e 3 gêneros e exatamente uma música. | web | [saving needs at least three artists, three genres and exactly one song](../tests/settings/music-preferences.spec.ts#L90) |
| RF-31.3 | Preferências atualizadas refletem no perfil, nas sugestões e no feed. | web | [new preferences show on the profile, in suggestions and in the feed](../tests/settings/music-preferences.spec.ts#L142) |

### US 32 — Configurações e privacidade

[backend#120](https://github.com/Recorda-ages/recorda-backend/issues/120) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-32.1 | É possível alternar entre conta pública e privada, com confirmação e efeito imediato. | web | [switching to a private account asks first and applies at once](../tests/settings/privacy.spec.ts#L7) |
| RF-32.2 | Ao tornar a conta pública, todos os pedidos pendentes são aceitos na mesma transação e cada solicitante é notificado. | web | [going public accepts every pending follow request and notifies each requester](../tests/settings/privacy.spec.ts#L49) |
| RF-32.3 | As Configurações dão acesso a Minha conta, preferências musicais, idioma e logout. | web | [settings lead to my account, music preferences, language and sign-out](../tests/settings/settings-menu.spec.ts#L4) |

### US 33 — Idioma da conta e do aparelho

[backend#121](https://github.com/Recorda-ages/recorda-backend/issues/121) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-33.1 | Português, inglês e espanhol podem ser escolhidos com efeito imediato. | web | [Portuguese, English and Spanish apply immediately and stay after reopening](../tests/settings/language.spec.ts#L55) |
| RF-33.2 | Antes do login vale a preferência local; após autenticar prevalece o idioma da conta, que também é gravado no aparelho. | web | [the device language applies before login and the account language after it](../tests/settings/language.spec.ts#L171) |

### US 34 — Gerenciar conta

[backend#122](https://github.com/Recorda-ages/recorda-backend/issues/122) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-34.1 | É possível editar nome, username e email; o email muda após validar formato e unicidade, sem link de confirmação.<br>⚠️ A tela Minha conta ainda lê e salva pelo accountService.mock (recorda-frontend/src/features/account/services/accountAdapter.ts), embora o backend já tenha GET e PATCH /users/me/account. | web | [an invalid email is refused before saving](../tests/settings/account.spec.ts#L10)<br>[saving name, username and email updates the account](../tests/settings/account.spec.ts#L31)<br>[an email already in use is refused](../tests/settings/account.spec.ts#L63) |
| RF-34.2 | A senha é opcional e só muda com Nova senha e Repetir nova senha preenchidas e iguais, sem pedir a senha atual.<br>⚠️ A tela Minha conta ainda lê e salva pelo accountService.mock (recorda-frontend/src/features/account/services/accountAdapter.ts), embora o backend já tenha GET e PATCH /users/me/account. | web | [a new password needs both fields filled with the same value](../tests/settings/account.spec.ts#L91)<br>[matching passwords replace the old one without asking for the current one](../tests/settings/account.spec.ts#L122) |
| RF-34.3 | Excluir a conta pede confirmação (Cancelar/Excluir) e aplica exclusão lógica sem anonimização. | web | [deleting asks for confirmation and keeps the data without anonymizing it](../tests/settings/account.spec.ts#L151) |

### US 35 — Streak de publicações

[backend#123](https://github.com/Recorda-ages/recorda-backend/issues/123) · em andamento

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-35.1 | Só contam para a streak dias com pelo menos uma Recorda publicada, pela data de publicação. | API | — |
| RF-35.2 | Curtidas, comentários e outras ações não contam. Só contam Recordas ativas: excluir a única Recorda de um dia tira esse dia da streak (regra da US 38).<br>_Fonte: Decisão do time, 2026-11-08: seguir a US 38, que substitui o critério original da US 35._<br>⚠️ A streak do perfil inclui Recordas excluídas (list_publication_times em recorda-backend/app/repositories/recorda_repository.py), enquanto a de Métricas já as exclui. | API | — |
| RF-35.3 | O perfil mostra apenas um indicador de streak. | web | [the profile shows identity, avatar, counters, one streak and music](../tests/profile/own-profile.spec.ts#L19)<br>[publishing today shows a single active streak of one day](../tests/profile/own-profile.spec.ts#L125) |

### US 36 — Logout

[backend#124](https://github.com/Recorda-ages/recorda-backend/issues/124) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-36.1 | Sair pede confirmação. | web | [returning user browses the feed, opens settings and signs out](../tests/flows/session-lifecycle.spec.ts#L14) |
| RF-36.2 | Ao confirmar, a sessão e os dados em memória são limpos, o app vai para o Login e o idioma local do aparelho é preservado. | web | [returning user browses the feed, opens settings and signs out](../tests/flows/session-lifecycle.spec.ts#L14) |

## E7 — Memórias e estatísticas

### US 37 — Calendário de Memórias

[frontend#278](https://github.com/Recorda-ages/recorda-frontend/issues/278) · em andamento

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-37.1 | A aba Calendário mostra uma grade mensal de 7 colunas (domingo a sábado) calculada no fuso de São Paulo. | web | [the month grid runs Sunday to Saturday and marks today's Recordas](../tests/memories/calendar.spec.ts#L59) |
| RF-37.2 | Dias com publicações mostram a miniatura da primeira Recorda do dia. | web | [the month grid runs Sunday to Saturday and marks today's Recordas](../tests/memories/calendar.spec.ts#L59) |
| RF-37.3 | O número do dia fica legível sobre a miniatura (gradiente e sombra). | manual | — |
| RF-37.4 | Dias com mais de uma Recorda mostram o indicador +N. | web | [the month grid runs Sunday to Saturday and marks today's Recordas](../tests/memories/calendar.spec.ts#L59) |
| RF-37.5 | Dias sem publicações aparecem em estilo escuro, sem miniatura. | web | [the month grid runs Sunday to Saturday and marks today's Recordas](../tests/memories/calendar.spec.ts#L59) |
| RF-37.6 | O cabeçalho permite navegar entre meses, atualizando a grade. | web | [the header moves between months](../tests/memories/calendar.spec.ts#L107) |
| RF-37.7 | Tocar num dia ativo abre o visualizador diário em tela cheia. | web | [a day opens full screen with time, caption and the song, and closes back to the grid](../tests/memories/calendar.spec.ts#L137) |
| RF-37.8 | O visualizador mostra a mídia com horário local e legenda. | web | [a day opens full screen with time, caption and the song, and closes back to the grid](../tests/memories/calendar.spec.ts#L137) |
| RF-37.9 | Em dias com várias Recordas, é possível deslizar entre elas com paginação segmentada. | nativo | — |
| RF-37.10 | O visualizador tem a pílula sonora com controle do preview do Deezer. | web | [a day opens full screen with time, caption and the song, and closes back to the grid](../tests/memories/calendar.spec.ts#L137) |
| RF-37.11 | É possível ir ao dia anterior ou próximo com memórias sem fechar o visualizador. | web | [the viewer goes to the previous and next day with memories](../tests/memories/calendar.spec.ts#L229) |
| RF-37.12 | O visualizador fecha pelo X ou arrastando para baixo, voltando à grade com o dia em foco. | web | [a day opens full screen with time, caption and the song, and closes back to the grid](../tests/memories/calendar.spec.ts#L137) |
| RF-37.13 | Períodos sem memórias exibem estado vazio convidando a publicar.<br>⚠️ O calendário vazio só diz "Nenhuma memória neste mês", sem convite nem atalho para publicar (MemoryCalendarGrid em recorda-frontend/src/features/memories-calendar). | web | [a month without Recordas says so](../tests/memories/calendar.spec.ts#L186)<br>[a month without Recordas invites to publish one](../tests/memories/calendar.spec.ts#L206) |

### US 38 — Métricas e Estatísticas Pessoais

[frontend#279](https://github.com/Recorda-ages/recorda-frontend/issues/279) · em andamento

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-38.1 | A aba Métricas mostra o Artista Mais Recorrente no período. | web | [the most recurring artist, the genre ranking and today's streak](../tests/memories/metrics.spec.ts#L13) |
| RF-38.2 | A aba mostra o ranking de gêneros com barras percentuais e contagem.<br>⚠️ O ranking de gêneros mostra só nome e percentual, sem a contagem (TopGenresRankingCard em recorda-frontend/src/features/memories-metrics). | web | [the most recurring artist, the genre ranking and today's streak](../tests/memories/metrics.spec.ts#L13)<br>[the genre ranking shows how many Recordas each genre has](../tests/memories/metrics.spec.ts#L78) |
| RF-38.3 | A aba mostra a Streak Atual em dias consecutivos, zerando sem publicação no dia anterior ou atual (fuso de São Paulo). | web | [the period filter switches between 30 days, 90 days, 1 year and all history](../tests/memories/metrics.spec.ts#L120)<br>[the most recurring artist, the genre ranking and today's streak](../tests/memories/metrics.spec.ts#L13) |
| RF-38.4 | A Streak Atual tem visual minimalista, sem ícones de fogo ou brilho. | manual | — |
| RF-38.5 | É possível alternar entre 30 dias, 90 dias, 1 ano e todo o histórico. | web | [the period filter switches between 30 days, 90 days, 1 year and all history](../tests/memories/metrics.spec.ts#L120) |
| RF-38.6 | Sem memórias no período, há um estado vazio informativo. | web | [without Recordas in the period there is an empty state](../tests/memories/metrics.spec.ts#L99) |

### US 39 — Retrospectiva Musical de Período

[frontend#280](https://github.com/Recorda-ages/recorda-frontend/issues/280) · em andamento

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-39.1 | A retrospectiva de qualquer período elegível (mensal ou anual) é acessível pelo Perfil. | web | [the profile lists the monthly and yearly retrospectives and opens one](../tests/memories/retrospective.spec.ts#L85) |
| RF-39.2 | O Story Viewer abre em tela cheia com barras de progresso (~5 s por slide), áudio e gestos de avançar, voltar e pausar. | web | [slides advance every 5 seconds, can be tapped back and forth and paused by holding](../tests/memories/retrospective.spec.ts#L178) |
| RF-39.3 | O viewer mostra os 6 blocos: total de Recordas, ranking de artistas, ranking de gêneros, amigos mais marcados, engajamento recebido e maior streak. | web | [the story shows total, artists, genres, marked friends, engagement and the best streak](../tests/memories/retrospective.spec.ts#L129) |
| RF-39.4 | O último slide gera um poster exportável para Instagram Stories ou galeria. | nativo | — |
| RF-39.5 | Há estados de carregamento, erro e período indisponível. | web | [loading, error and an unavailable period each have their own state](../tests/memories/retrospective.spec.ts#L230) |

## E8 — Compartilhamento de cards

### US 10 — Geração Base do Card Visual

[frontend#199](https://github.com/Recorda-ages/recorda-frontend/issues/199) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-10.1 | A partir da tela de detalhes há a interface Compartilhar Recorda. | web | [recorda details open the sharing interface](../tests/share/share-card.spec.ts#L8) |
| RF-10.2 | O card é uma imagem na proporção 9:16 (Stories). | web | [photo exports a portrait PNG with the light preset](../tests/share/share-card.spec.ts#L28)<br>[photo exports a portrait PNG with the mint preset](../tests/share/share-card.spec.ts#L28)<br>[photo exports a portrait PNG with the teal preset](../tests/share/share-card.spec.ts#L28)<br>[photo exports a portrait PNG with the dark preset](../tests/share/share-card.spec.ts#L28)<br>[video exports a portrait PNG with the light preset](../tests/share/share-card.spec.ts#L28)<br>[video exports a portrait PNG with the mint preset](../tests/share/share-card.spec.ts#L28)<br>[video exports a portrait PNG with the teal preset](../tests/share/share-card.spec.ts#L28)<br>[video exports a portrait PNG with the dark preset](../tests/share/share-card.spec.ts#L28) |
| RF-10.3 | O card contém a mídia, a identidade visual do app e capa e nome da música. | manual | — |
| RF-10.4 | Para vídeos, o card usa o primeiro quadro: o resultado é sempre uma imagem estática.<br>⚠️ No web, a captura do card (html2canvas-pro em ShareCardScreen) ignora contentFit="cover" e estica mídias que não são verticais, como o vídeo do seed. | web | [video sharing displays the first frame as a static image](../tests/share/share-card.spec.ts#L70)<br>[the exported video card shows the first frame cropped, not stretched](../tests/share/share-card.spec.ts#L149) |
| RF-10.5 | A geração ocorre no dispositivo, com indicador de progresso. | web | [video card generation shows progress and stays on the device](../tests/share/share-card.spec.ts#L269) |

### US 11 — Presets

[frontend#201](https://github.com/Recorda-ages/recorda-frontend/issues/201) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-11.1 | Os presets aparecem como lista horizontal rolável abaixo do card. | web | [presets form a horizontal scrollable list below the card](../tests/share/share-card.spec.ts#L340) |
| RF-11.2 | É possível alternar entre 3 presets pré-definidos.<br>⚠️ ShareCardScreen oferece quatro presets (light, mint, teal, dark); a US 11 exige exatamente três. | web | [exactly three predefined presets are offered](../tests/share/share-card.spec.ts#L368)<br>[selecting a preset immediately changes the visible card](../tests/share/share-card.spec.ts#L385) |
| RF-11.3 | Os presets respeitam a marca (tons de verde e fundo escuro). | manual | — |
| RF-11.4 | O card é atualizado em tempo real conforme o preset selecionado. | web | [selecting a preset immediately changes the visible card](../tests/share/share-card.spec.ts#L385) |
| RF-11.5 | O card exportado é sempre vertical (9:16). | web | [photo exports a portrait PNG with the light preset](../tests/share/share-card.spec.ts#L28)<br>[photo exports a portrait PNG with the mint preset](../tests/share/share-card.spec.ts#L28)<br>[photo exports a portrait PNG with the teal preset](../tests/share/share-card.spec.ts#L28)<br>[photo exports a portrait PNG with the dark preset](../tests/share/share-card.spec.ts#L28)<br>[video exports a portrait PNG with the light preset](../tests/share/share-card.spec.ts#L28)<br>[video exports a portrait PNG with the mint preset](../tests/share/share-card.spec.ts#L28)<br>[video exports a portrait PNG with the teal preset](../tests/share/share-card.spec.ts#L28)<br>[video exports a portrait PNG with the dark preset](../tests/share/share-card.spec.ts#L28) |

### US 12 — Exportação

[frontend#203](https://github.com/Recorda-ages/recorda-frontend/issues/203) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-12.1 | A interface oferece botões de ação para compartilhamento. | web | [sharing offers Instagram Stories and image download actions](../tests/share/share-card.spec.ts#L425) |
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
| RF-40.1 | É possível denunciar uma Recorda pelo card do feed ou pelo menu da tela de detalhes. | web | [a Recorda is reported from its feed card with an optional reason and stays visible](../tests/reports/reports.spec.ts#L32)<br>[a Recorda is reported from the details menu without a reason](../tests/reports/reports.spec.ts#L66) |
| RF-40.2 | A denúncia aceita justificativa opcional de até 500 caracteres. | web | [a Recorda is reported from its feed card with an optional reason and stays visible](../tests/reports/reports.spec.ts#L32)<br>[a Recorda is reported from the details menu without a reason](../tests/reports/reports.spec.ts#L66) |
| RF-40.3 | O mesmo usuário não denuncia a mesma Recorda duas vezes (erro amigável). | web | [reporting the same Recorda twice shows a friendly message](../tests/reports/reports.spec.ts#L92) |
| RF-40.4 | A denúncia é registrada com status OPEN. | API | — |
| RF-40.5 | A Recorda continua visível após a denúncia. | web | [a Recorda is reported from its feed card with an optional reason and stays visible](../tests/reports/reports.spec.ts#L32)<br>[a Recorda is reported from the details menu without a reason](../tests/reports/reports.spec.ts#L66) |
| RF-40.6 | O autor não é notificado nem vê quem denunciou. | web | [the author is not notified of a report and can't see who sent it](../tests/reports/reports.spec.ts#L115) |

### US 41 — Denúncia de Perfil de Usuário

[frontend#223](https://github.com/Recorda-ages/recorda-frontend/issues/223) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-41.1 | É possível denunciar o perfil de outro usuário. | web | [another person's profile is reported with a reason](../tests/reports/reports.spec.ts#L150) |
| RF-41.2 | Não é possível denunciar o próprio perfil. | web | [your own profile can't be reported](../tests/reports/reports.spec.ts#L176) |
| RF-41.3 | A denúncia de perfil aceita justificativa de até 500 caracteres. | web | [another person's profile is reported with a reason](../tests/reports/reports.spec.ts#L150) |
| RF-41.4 | O mesmo usuário não denuncia o mesmo perfil duas vezes (erro amigável). | web | [reporting the same profile twice shows a friendly message](../tests/reports/reports.spec.ts#L194) |
| RF-41.5 | A denúncia de perfil é registrada com status OPEN. | API | — |

### US 42 — Notificação ao Autor sobre Remoção de Conteúdo

[frontend#240](https://github.com/Recorda-ages/recorda-frontend/issues/240) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-42.1 | Quando a moderação remove uma Recorda, o autor recebe a notificação CONTENT_REMOVED com o motivo. | web | [a removed Recorda disappears for everyone and its author is told why](../tests/admin/moderation.spec.ts#L268) |
| RF-42.2 | A notificação aparece com ícone de sistema, sem expor o administrador. | web | [a removed Recorda disappears for everyone and its author is told why](../tests/admin/moderation.spec.ts#L268) |
| RF-42.3 | Tocar na notificação a marca como lida, sem navegar para a Recorda removida. | web | [a removed Recorda disappears for everyone and its author is told why](../tests/admin/moderation.spec.ts#L268) |
| RF-42.4 | Usuários suspensos não recebem a notificação. | API | — |

## E10 — Administração e moderação

### US 44 — Visualização e Gestão de Denúncias

[frontend#224](https://github.com/Recorda-ages/recorda-frontend/issues/224) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-44.1 | O fluxo administrativo é exclusivo de usuários com role ADMIN. | web | [only administrators can open the moderation area](../tests/admin/moderation.spec.ts#L73) |
| RF-44.2 | As denúncias são listadas agrupadas por alvo, com tipo, identificador, número de denúncias abertas e data da mais recente. | web | [open reports are grouped by target with type, open count and latest date](../tests/admin/moderation.spec.ts#L99) |
| RF-44.3 | O detalhe do alvo mostra o conteúdo denunciado e o histórico de denúncias (texto, data e denunciante). | web | [the detail shows the reported Recorda and every report with text, date and reporter](../tests/admin/moderation.spec.ts#L126) |
| RF-44.4 | O administrador pode mudar o status das denúncias para RESOLVED ou DISMISSED. | web | [marking reports as resolved needs a reason and is recorded](../tests/admin/moderation.spec.ts#L151)<br>[marking reports as dismissed needs a reason and is recorded](../tests/admin/moderation.spec.ts#L151) |
| RF-44.5 | Toda mudança de status exige justificativa de até 500 caracteres, registrada na auditoria. | web | [marking reports as resolved needs a reason and is recorded](../tests/admin/moderation.spec.ts#L151)<br>[marking reports as dismissed needs a reason and is recorded](../tests/admin/moderation.spec.ts#L151) |

### US 45 — Moderação e Remoção de Recordas

[frontend#225](https://github.com/Recorda-ages/recorda-frontend/issues/225) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-45.1 | O administrador remove logicamente uma Recorda pela tela de moderação. | web | [removing a Recorda needs a reason, resolves its reports and is audited](../tests/admin/moderation.spec.ts#L212) |
| RF-45.2 | A remoção exige justificativa de até 500 caracteres, salva de forma imutável na auditoria. | web | [removing a Recorda needs a reason, resolves its reports and is audited](../tests/admin/moderation.spec.ts#L212) |
| RF-45.3 | Remover a Recorda resolve automaticamente as denúncias pendentes dela. | web | [removing a Recorda needs a reason, resolves its reports and is audited](../tests/admin/moderation.spec.ts#L212) |
| RF-45.4 | A Recorda removida some imediatamente do feed, das buscas e do perfil do autor. | web | [a removed Recorda disappears for everyone and its author is told why](../tests/admin/moderation.spec.ts#L268) |
| RF-45.5 | O autor da Recorda removida é notificado conforme a US 42 (RF-42.1).<br>_Fonte: Decisão do time, 2026-11-08: manter a notificação da US 42; substitui o critério original da US 45, que proibia notificar._ | web | [a removed Recorda disappears for everyone and its author is told why](../tests/admin/moderation.spec.ts#L268) |

### US 46 — Moderação de Usuários (Suspensão e Reativação)

[frontend#226](https://github.com/Recorda-ages/recorda-frontend/issues/226) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-46.1 | O administrador busca contas por username ou nome e vê perfil e status (ACTIVE ou SUSPENDED). | web | [an administrator finds an account, suspends it with a reason and reactivates it](../tests/admin/moderation.spec.ts#L336) |
| RF-46.2 | Um administrador não pode suspender outro administrador (HTTP 403 e ação desabilitada na UI). | web | — |
| RF-46.3 | A suspensão exige motivo de até 500 caracteres, registrado na auditoria. | web | [an administrator finds an account, suspends it with a reason and reactivates it](../tests/admin/moderation.spec.ts#L336) |
| RF-46.4 | O conteúdo de usuários suspensos (Recordas, comentários e perfil) some para usuários comuns. | web | [an administrator finds an account, suspends it with a reason and reactivates it](../tests/admin/moderation.spec.ts#L336) |
| RF-46.5 | O administrador reativa uma conta suspensa com justificativa, voltando ao status ACTIVE. | web | [an administrator finds an account, suspends it with a reason and reactivates it](../tests/admin/moderation.spec.ts#L336) |

### US 47 — Log de Auditoria

[frontend#227](https://github.com/Recorda-ages/recorda-frontend/issues/227) · implementada

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-47.1 | Toda ação de moderação (remoção, suspensão/reativação e mudança de status de denúncia) gera um registro imutável. | web | [marking reports as resolved needs a reason and is recorded](../tests/admin/moderation.spec.ts#L151)<br>[marking reports as dismissed needs a reason and is recorded](../tests/admin/moderation.spec.ts#L151)<br>[removing a Recorda needs a reason, resolves its reports and is audited](../tests/admin/moderation.spec.ts#L212) |
| RF-47.2 | O registro guarda administrador, tipo de ação, alvo, motivo e timestamp UTC. | web | [marking reports as resolved needs a reason and is recorded](../tests/admin/moderation.spec.ts#L151)<br>[marking reports as dismissed needs a reason and is recorded](../tests/admin/moderation.spec.ts#L151)<br>[removing a Recorda needs a reason, resolves its reports and is audited](../tests/admin/moderation.spec.ts#L212) |
| RF-47.3 | O painel tem o histórico cronológico paginado, com filtros por administrador e período. | web | [the audit log lists actions newest first and filters by period and administrator](../tests/admin/moderation.spec.ts#L393) |
| RF-47.4 | A auditoria é append-only: não há endpoints de alteração ou exclusão. | API | — |

## TA — Termo de Abertura (sem User Story)

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RF-T01 | A busca de músicas, previews, álbuns, artistas e gêneros usa a API do Deezer.<br>_Fonte: Termo: Integrações; Decisão do time, 2026-11-08: o Deezer substitui Spotify/Apple Music por atender melhor ao projeto._ | web | [the song search finds Deezer tracks by song, artist or album](../tests/recorda-creation/create-recorda.spec.ts#L61) |

## NF — Requisitos não funcionais

| ID | Requisito | Verificação | Testes |
| --- | --- | --- | --- |
| RNF-01 | O aplicativo funciona em iOS e Android.<br>_Fonte: Termo: objetivos_ | nativo | — |
| RNF-02 | A interface está disponível em português, inglês e espanhol, sem textos fixos fora das traduções.<br>_Fonte: Termo; US 33_ | web | [feed and settings screens are fully translated to en](../tests/settings/language.spec.ts#L108)<br>[feed and settings screens are fully translated to es](../tests/settings/language.spec.ts#L108) |
| RNF-03 | Não há coleta de dados comportamentais: só os dados necessários à conta e às preferências declaradas.<br>_Fonte: US 2; US 15_ | manual | — |
| RNF-04 | Toda comunicação do app com a API usa HTTPS.<br>_Fonte: Relatório de deploy_ | API | — |
| RNF-05 | A interface não trava esperando a rede: carregamentos mostram indicador e falhas oferecem tentar novamente.<br>_Fonte: US 1; US 18_ | web | [while the first page loads there is an indicator, and a failure offers to try again](../tests/feed/loading.spec.ts#L32)<br>[the next page loads near the end of the list, and its failure can be retried](../tests/feed/loading.spec.ts#L73) |
| RNF-06 | Datas e streaks são calculados no fuso America/Sao_Paulo.<br>_Fonte: US 37; US 38_ | API | — |
| RNF-07 | Fora do escopo: monetização, assinaturas, chat em tempo real, comunidades ou grupos, marketplace e streaming próprio.<br>_Fonte: Termo: fora do escopo_ | manual | — |

## Testes

| Teste | Descrição | Requisitos |
| --- | --- | --- |
| [only administrators can open the moderation area](../tests/admin/moderation.spec.ts#L73) | A regular account opens the app on its Feed with no admin screen, and the admin API refuses it; the administrator's own call is accepted. | RF-44.1 |
| [open reports are grouped by target with type, open count and latest date](../tests/admin/moderation.spec.ts#L99) | Two reports of the same Recorda show as one row that says it is a Recorda, pending, with 2 reports, identifies it by author and song, and shows the latest report's date. | RF-44.2 |
| [the detail shows the reported Recorda and every report with text, date and reporter](../tests/admin/moderation.spec.ts#L126) | Opening a report group shows the reported photo and each report's description, reporter and date. | RF-44.3 |
| [marking reports as resolved needs a reason and is recorded](../tests/admin/moderation.spec.ts#L151) | The status dialog accepts at most 500 characters and can't be confirmed empty. With a reason, the reports change status, the detail history shows the action, and the audit log records administrator, action, target, reason and time. | RF-44.4, RF-44.5, RF-47.1, RF-47.2 |
| [marking reports as dismissed needs a reason and is recorded](../tests/admin/moderation.spec.ts#L151) | The status dialog accepts at most 500 characters and can't be confirmed empty. With a reason, the reports change status, the detail history shows the action, and the audit log records administrator, action, target, reason and time. | RF-44.4, RF-44.5, RF-47.1, RF-47.2 |
| [removing a Recorda needs a reason, resolves its reports and is audited](../tests/admin/moderation.spec.ts#L212) | The removal dialog accepts at most 500 characters and can't be confirmed empty. Removing takes the Recorda down, resolves both open reports and adds a removal entry to the audit log. | RF-45.1, RF-45.2, RF-45.3, RF-47.1, RF-47.2 |
| [a removed Recorda disappears for everyone and its author is told why](../tests/admin/moderation.spec.ts#L268) | After removal, a follower can no longer open the Recorda or see it on the author's profile. The author gets a system notification with the song and the reason, without naming the administrator; tapping it marks it read and opens nothing. | RF-45.4, RF-45.5, RF-42.1, RF-42.2, RF-42.3 |
| [an administrator finds an account, suspends it with a reason and reactivates it](../tests/admin/moderation.spec.ts#L336) | Searching by username shows the account as active. Suspending needs a reason of at most 500 characters and hides its profile and Recordas from other users; reactivating with a reason makes it active and visible again. | RF-46.1, RF-46.3, RF-46.4, RF-46.5 |
| [the audit log lists actions newest first and filters by period and administrator](../tests/admin/moderation.spec.ts#L393) | A suspension and then a reactivation show in the audit log with the reactivation first, and both stay listed when filtering by today, by the last month and by the administrator who did them. | RF-47.3 |
| [resetting a password to eight characters replaces the old credentials](../tests/auth/password-recovery.spec.ts#L24) | A signed-out user opens Recovery from Login, resets a dedicated account with matching eight-character passwords without email verification, and signs in only with the new password. | RF-05.1, RF-05.2, RF-05.3 |
| [password recovery stays blocked by matching seven-character passwords until corrected](../tests/auth/password-recovery.spec.ts#L77) | Recovery rejects matching seven-character passwords. Correcting both fields to the same longer password allows the user to reset the dedicated account and sign in. | RF-05.2 |
| [password recovery stays blocked by a seven-character new password until corrected](../tests/auth/password-recovery.spec.ts#L77) | Recovery rejects a seven-character new password. Correcting both fields to the same longer password allows the user to reset the dedicated account and sign in. | RF-05.2 |
| [password recovery stays blocked by a seven-character confirmation until corrected](../tests/auth/password-recovery.spec.ts#L77) | Recovery rejects a seven-character confirmation. Correcting both fields to the same longer password allows the user to reset the dedicated account and sign in. | RF-05.2 |
| [different passwords block recovery until the confirmation matches](../tests/auth/password-recovery.spec.ts#L115) | Two different passwords of at least eight characters cannot reset an account. Correcting the confirmation allows recovery and a new sign-in. | RF-05.2 |
| [an unknown recovery email shows the same generic error as a network failure](../tests/auth/password-recovery.spec.ts#L148) | An unknown email and a failed reset request for a dedicated account show exactly the same generic message. Retrying with a working connection resets the account and allows sign-in. | RF-05.4 |
| [a signed-out user sees the login screen](../tests/auth/sign-in.spec.ts#L8) | Without a saved session the Splash hands over to Login, whose submit button stays disabled until the form is filled. | RF-01.3 |
| [signing in with valid credentials opens the feed](../tests/auth/sign-in.spec.ts#L24) | A regular account signs in with username and password on the shared login screen and lands on the Feed. | RF-04.1, RF-04.5 |
| [an administrator signs in on the same screen and lands on the admin area](../tests/auth/sign-in.spec.ts#L39) | The admin uses the same login form and lands on Denúncias. No admin tab shows the Feed or the app's bottom bar (Feed, Câmera, Perfil). | RF-04.1, RF-04.4 |
| [invalid credentials show one generic error](../tests/auth/sign-in.spec.ts#L71) | A wrong password and an unknown username both keep the user on Login with the same message, so the error never reveals which field is wrong. | RF-04.3 |
| [a new account goes through the three onboarding steps before the Feed](../tests/auth/sign-up-onboarding.spec.ts#L53) | After signing up, the user is signed in and taken to onboarding instead of the Feed, picks artists, genres and one song across three numbered steps, lands on the Feed, and sees the chosen song highlighted on their profile. | RF-02.5, RF-03.1, RF-03.2, RF-03.3, RF-03.6 |
| [the sign-up form asks only for name, username, email and password](../tests/auth/sign-up-onboarding.spec.ts#L114) | Sign Up shows exactly the Name, Username, Email and Password fields, with no password confirmation and no terms checkbox. | RF-02.1 |
| [a username or email already in use is rejected on its own field](../tests/auth/sign-up-onboarding.spec.ts#L134) | Signing up with the username of a seeded account, or with its email, keeps the user on Sign Up and shows the error under that field only. | RF-02.2 |
| [each invalid field shows its own error before anything is sent](../tests/auth/sign-up-onboarding.spec.ts#L164) | Submitting an empty form shows a specific message under every field, and an invalid email shows the email-format message; the user stays on Sign Up. | RF-02.3 |
| [a password shorter than 8 characters is not accepted](../tests/auth/sign-up-onboarding.spec.ts#L196) | A 7-character password shows the minimum-length message and keeps the user on Sign Up; with 8 characters the message goes away. | RF-02.4 |
| [each onboarding step needs its minimum choices to move on](../tests/auth/sign-up-onboarding.spec.ts#L225) | Next stays disabled until 3 artists and then 3 genres are picked, and Finish stays disabled until a favorite song is picked. | RF-03.4 |
| [going back to a previous step keeps what was selected](../tests/auth/sign-up-onboarding.spec.ts#L266) | Returning from genres to artists, and from music to genres, shows the same number of choices already selected, so nothing has to be picked again. | RF-03.7 |
| [the Feed opens on Para Você, with Seguindo as the other top tab](../tests/feed/following-tab.spec.ts#L11) | Signing in lands on the Feed with its two top tabs, Para Você and Seguindo, and Para Você in front; tapping Seguindo brings that list forward. The bottom bar has the way back to the Feed. | RF-14.1, RF-15.1 |
| [a card shows the author, the media, the song, the caption and the actions](../tests/feed/following-tab.spec.ts#L45) | A card on Seguindo shows the author's avatar and username, the photo, the song title and artist, the caption, and the Curtir and Comentar buttons; its three-dots menu offers Denunciar. | RF-14.2 |
| [a card shows the song's cover](../tests/feed/following-tab.spec.ts#L98) | Next to the song title and artist, the card shows the song's cover art. | RF-14.2 |
| [Seguindo lists only followed people, newest first, including approved private accounts](../tests/feed/following-tab.spec.ts#L129) | The tab shows the Recordas of a followed public account and of a private one that approved the request, newest first, without either following back. A private account with a pending request, a public account not followed and the viewer's own Recorda are left out. | RF-14.3, RF-14.4 |
| [with nobody followed, Seguindo suggests following people](../tests/feed/following-tab.spec.ts#L185) | A new account that follows nobody sees, on Seguindo, the empty state telling it to follow people to see their Recordas. | RF-14.5 |
| [Para Você mixes followed people and public accounts with musical affinity, by recency](../tests/feed/general-tab.spec.ts#L62) | The tab shows, newest first, the Recordas of a followed account (with no affinity) interleaved with those of a public account that shares an artist with the viewer. A public account with nothing in common and a private account with affinity that the viewer doesn't follow are left out. | RF-15.2 |
| [a private account's Recordas reach Para Você only once the follow is approved](../tests/feed/general-tab.spec.ts#L100) | A private account with musical affinity stays out of Para Você while the viewer's request is pending, and its Recorda shows up once the request is approved. | RF-15.5 |
| [with nobody to discover, Para Você shows the followed people's Recordas](../tests/feed/general-tab.spec.ts#L140) | A viewer whose tastes match nobody, following one account, sees that account's Recordas on Para Você instead of an empty tab. | RF-15.6 |
| [while the first page loads there is an indicator, and a failure offers to try again](../tests/feed/loading.spec.ts#L32) | Para Você shows Carregando feed... while its request is pending. When it fails, the tab says the feed couldn't be loaded and offers Tentar novamente, which loads it. | RF-18.3, RNF-05 |
| [the next page loads near the end of the list, and its failure can be retried](../tests/feed/loading.spec.ts#L73) | Seguindo first asks for one page of 20 Recordas. Scrolling to the end asks for the next page; when that fails, the end of the list says so, and Tentar novamente brings in the remaining Recordas down to the oldest. | RF-18.1, RF-18.3, RNF-05 |
| [switching tabs keeps each tab's scroll position](../tests/feed/loading.spec.ts#L129) | After scrolling down Seguindo, going to Para Você and back returns to the same place in the list instead of the top. | RF-18.4 |
| [a video plays without its own sound](../tests/feed/playback.spec.ts#L14) | A video Recorda in focus plays muted, even though the clip has an audio track: only the song is heard. | RF-16.4 |
| [the mute toggle is on every card and the choice lasts for the session](../tests/feed/playback.spec.ts#L47) | Each card with a song has a sound button. Silencing on one card shows Reativar música on the others too, and it is still silenced after opening a Recorda and coming back to the Feed. | RF-16.5 |
| [returning user browses the feed, opens settings and signs out](../tests/flows/session-lifecycle.spec.ts#L14) | A saved session opens the feed without logging in again; signing out from Settings asks for confirmation, returns to Login and clears the session for the next launch while restoring the device language. | RF-04.6, RF-36.1, RF-36.2 |
| [splash is the first screen and hands over to login](../tests/flows/session-startup.spec.ts#L10) | A fresh launch shows Splash before Login, without exposing authenticated screens. | RF-01.2, RF-01.3 |
| [a saved user session opens the feed and survives reopening](../tests/flows/session-startup.spec.ts#L33) | Gabriel reaches Feed through Splash on both launch and reload, without entering credentials. | RF-01.2, RF-01.4, RF-04.6 |
| [a saved administrator session opens only the administrative area](../tests/flows/session-startup.spec.ts#L60) | Admin reaches the moderation area after Splash, with no user navigation, including after reopening. | RF-01.2, RF-01.5 |
| [an invalid session is cleared before returning to login](../tests/flows/session-startup.spec.ts#L94) | An invalid saved token cannot open Feed; authentication storage is cleared and reopening stays signed out. | RF-01.6 |
| [an expired session is cleared before returning to login](../tests/flows/session-startup.spec.ts#L94) | An expired saved token cannot open Feed; authentication storage is cleared and reopening stays signed out. | RF-01.6 |
| [a slow session check sends the user to login after three seconds](../tests/flows/session-timeout.spec.ts#L42) | When session verification exceeds the required three-second deadline, Splash must give way to Login. | RF-01.7 |
| [a late valid session response cannot navigate away from login](../tests/flows/session-timeout.spec.ts#L69) | After the current timeout sends the user to Login, releasing a real successful session response cannot reopen Feed or admin. | RF-01.7 |
| [the viewer goes to the previous and next day with memories](../tests/memories/calendar.spec.ts#L229) | On gabriel's 14 Feb 2026 Recorda, tapping the left side goes to the previous day with memories (7 Feb) without closing the viewer, and the right side comes back. | RF-37.11 |
| [the month grid runs Sunday to Saturday and marks today's Recordas](../tests/memories/calendar.spec.ts#L59) | The calendar opens on the current month in São Paulo, with seven weekday columns from Sunday to Saturday. Today shows the thumbnail of its first Recorda and +2 for the other two; a day without Recordas is a plain dark cell that can't be opened. | RF-37.1, RF-37.2, RF-37.4, RF-37.5 |
| [the header moves between months](../tests/memories/calendar.spec.ts#L107) | The previous-month arrow shows last month's grid, without today's Recordas, and the next-month arrow comes back to them. | RF-37.6 |
| [a day opens full screen with time, caption and the song, and closes back to the grid](../tests/memories/calendar.spec.ts#L137) | Tapping today opens the day viewer on its first Recorda, with one segment per Recorda, the São Paulo time it was published and the caption, and the song pill playing the preview, with a button to pause and resume it. The X closes it, back on the same month's grid. | RF-37.7, RF-37.8, RF-37.10, RF-37.12 |
| [a month without Recordas says so](../tests/memories/calendar.spec.ts#L186) | A new account's calendar has no active day and the header says there are no memories this month. | RF-37.13 |
| [a month without Recordas invites to publish one](../tests/memories/calendar.spec.ts#L206) | The empty calendar offers a way to create a Recorda, as US 37 asks, like the empty Métricas tab does. | RF-37.13 |
| [the period filter switches between 30 days, 90 days, 1 year and all history](../tests/memories/metrics.spec.ts#L120) | gabriel's two seeded Recordas are from February 2026: the last 30 and 90 days are empty, while 1 year and Todo o histórico show both, with no active streak. | RF-38.5, RF-38.3 |
| [the most recurring artist, the genre ranking and today's streak](../tests/memories/metrics.spec.ts#L13) | With three Recordas today, two by one artist in Rock and one by another in Pop, Métricas shows 3 Recordas, the first artist on top with 2 Recordas, Rock at 67% and Pop at 33% with their bars, and a streak of 1 day. | RF-38.1, RF-38.2, RF-38.3 |
| [the genre ranking shows how many Recordas each genre has](../tests/memories/metrics.spec.ts#L78) | Next to each genre's percentage, the ranking shows its Recorda count. | RF-38.2 |
| [without Recordas in the period there is an empty state](../tests/memories/metrics.spec.ts#L99) | A new account's Métricas says there are no Recordas in the period yet, suggests registering a memory and offers Criar Recorda, with no metric cards. | RF-38.6 |
| [the profile lists the monthly and yearly retrospectives and opens one](../tests/memories/retrospective.spec.ts#L85) | With only this month to show, Abrir retrospectiva on the own profile opens its story at once. With more periods it lists them, this month marked as a preview with its Recorda count, and picking it opens its story. | RF-39.1 |
| [the story shows total, artists, genres, marked friends, engagement and the best streak](../tests/memories/retrospective.spec.ts#L129) | Stepping through the month's story: 3 Recordas, the top artist, the genres led by Rock, the marked friend with 1 marking, then 1 like, 1 comment and a best streak of 1 day, ending on the summary. | RF-39.3 |
| [slides advance every 5 seconds, can be tapped back and forth and paused by holding](../tests/memories/retrospective.spec.ts#L178) | The story opens full screen with one progress segment per slide. After 5 seconds it moves to the next slide by itself; tapping the right and left sides moves forward and back; holding pauses it until released. | RF-39.2 |
| [loading, error and an unavailable period each have their own state](../tests/memories/retrospective.spec.ts#L230) | While the month's retrospective loads the sheet shows a spinner; when it fails it says so and Tentar novamente opens it; a period with nothing to show says there are no Recordas in it. | RF-39.5 |
| [the bell shows the unread count and opening the list marks it as read](../tests/notifications/notification-center.spec.ts#L31) | Two new followers show as 2 unread on the Feed bell, which opens the notification center; after opening it the count is gone, also after reopening the app. | RF-26.1, RF-26.5 |
| [notifications are listed newest first with who acted, what happened and the action](../tests/notifications/notification-center.spec.ts#L82) | A follow, then a like, then a follow request appear in reverse order, each with the actor's avatar initial and username and a description; only the request offers Accept and Decline, and the like shows the liked Recorda. | RF-26.2 |
| [follows, requests, likes, comments and mentions notify the account owner](../tests/notifications/notification-center.spec.ts#L147) | Following a public account, liking and commenting on its Recorda, mentioning it in a Recorda and requesting to follow it once private each add a notification for it. | RF-26.3, RF-09.6 |
| [an approved follow request notifies the requester](../tests/notifications/notification-center.spec.ts#L193) | When a private account accepts a follow request, the person who asked gets a notification that the request was approved. | RF-26.3 |
| [follow requests are accepted or declined from the notification list](../tests/notifications/notification-center.spec.ts#L216) | A private account finds its follow requests in the notification center, accepts one (it becomes a new follower) and declines the other (it disappears); only the accepted person ends up following. | RF-21.1, RF-26.4 |
| [tapping a notification opens the related Recorda or profile](../tests/notifications/notification-center.spec.ts#L271) | A like notification opens the liked Recorda, and a new-follower notification opens the follower's profile. | RF-26.6 |
| [the profile shows identity, avatar, counters, one streak and music](../tests/profile/own-profile.spec.ts#L19) | The header shows the account's name, @username, picture, Recordas/followers/following counters, a single streak indicator, the favorite song and the first favorite artist and genre, all matching what the backend has for the account. | RF-28.1, RF-35.3 |
| [the Recordas, Métricas and Calendário tabs switch the content below the header](../tests/profile/own-profile.spec.ts#L79) | The profile keeps three tabs in a fixed order; each shows its own content (the Recordas grid, the metrics cards, the memory calendar) and Recordas comes back. | RF-28.4 |
| [publishing today shows a single active streak of one day](../tests/profile/own-profile.spec.ts#L125) | After a new account publishes its first Recorda, the profile shows one streak indicator, highlighted as active, reading one day. | RF-35.3 |
| [the grid loads the next page of Recordas when scrolling to the end](../tests/profile/own-profile.spec.ts#L150) | With one Recorda more than a page, the grid first shows a full page without the oldest Recorda, and scrolling to the end loads it. | RF-28.3 |
| [removing the avatar brings back the default picture](../tests/profile/own-profile.spec.ts#L189) | An account with a profile picture removes it from the avatar menu after confirming; the default icon replaces it and stays after reopening the app. | RF-28.2 |
| [choosing a picture from the gallery sets it as the avatar](../tests/profile/own-profile.spec.ts#L223) | In the web build, an account without a picture picks an image from the gallery; it replaces the default icon and stays after reopening the app. | RF-28.2 |
| [a public profile shows the header, counters and Recordas](../tests/profile/third-party-profile.spec.ts#L17) | Opened from the search, the profile shows the owner's name, @username, streak and favorite song, the Recordas/followers/following counters and the Recordas grid, with no private-account notice. | RF-29.1 |
| [a private profile with an approved follow shows the header, counters and Recordas](../tests/profile/third-party-profile.spec.ts#L17) | Opened from the search, the profile shows the owner's name, @username, streak and favorite song, the Recordas/followers/following counters and the Recordas grid, with no private-account notice. | RF-29.1 |
| [a private profile without approval hides counters and Recordas behind a notice](../tests/profile/third-party-profile.spec.ts#L57) | A private account whose follow request is pending shows its name, @username and favorite song, but no counters and no Recordas; each of the three tabs shows the private-account notice instead of its content. | RF-29.2 |
| [a private profile without approval still shows the streak](../tests/profile/third-party-profile.spec.ts#L111) | A private account whose follow request is pending shows its name, favorite song and streak indicator, as RF-29.2 and backend decision D-06 say. | RF-29.2 |
| [Criar Recorda opens the camera from the bottom bar](../tests/recorda-creation/create-recorda.spec.ts#L42) | The bottom bar's Criar Recorda opens a screen with the camera viewfinder and the central capture button. | RF-06.1 |
| [the song search finds Deezer tracks by song, artist or album](../tests/recorda-creation/create-recorda.spec.ts#L61) | With the real Deezer behind the backend, searching by a song name, by an artist and by an album each lists matching tracks with title, artist and cover. | RF-07.1, RF-07.2, RF-T01 |
| [song search results carry the genre](../tests/recorda-creation/create-recorda.spec.ts#L96) | Each track the song search returns comes with its Deezer genre. | RF-07.1 |
| [a failed song search offers to try again](../tests/recorda-creation/create-recorda.spec.ts#L116) | When the music service is unavailable, the search says it couldn't find songs and offers Tentar novamente, which shows the results once the service is back. | RF-07.6 |
| [the next step needs a song, which then comes filled in and can't be changed there](../tests/recorda-creation/create-recorda.spec.ts#L145) | Próximo stays disabled until a song is picked. The last step then shows the photo with the song's cover, title and artist over it and a description field, with the song as plain text (no field to edit it) and Publicar enabled. | RF-07.4, RF-08.1, RF-08.3, RF-08.4 |
| [the description is optional and capped at 2200 characters](../tests/recorda-creation/create-recorda.spec.ts#L189) | Publicar is enabled with an empty description, and typing past 2200 characters keeps only the first 2200. | RF-08.2 |
| [publishing has no visibility choice](../tests/recorda-creation/create-recorda.spec.ts#L212) | The last step has no visibility selector: no public/private switch, radio or field; who sees the Recorda follows the account's privacy. | RF-09.2 |
| [the last step asks for the memory's date](../tests/recorda-creation/create-recorda.spec.ts#L239) | The last step has a Data da Memória field for when or where the moment happened. | RF-08.5 |
| [the last step asks for the memory's place](../tests/recorda-creation/create-recorda.spec.ts#L239) | The last step has a Local field for when or where the moment happened. | RF-08.6 |
| [followed people can be marked in the Recorda](../tests/recorda-creation/create-recorda.spec.ts#L260) | Marcar amigos lists the accounts the author follows; checking one marks it, shown as a chip and in the button's count. | RF-08.7 |
| [a failed upload keeps the draft and can be retried](../tests/recorda-creation/create-recorda.spec.ts#L288) | When sending the media fails, the screen says so and Publicar becomes Tentar novamente, with the photo, the song, the description and the marked friend still there, so nothing has to be captured or typed again. | RF-09.5 |
| [a published Recorda shows the upload progress and appears on the author's profile](../tests/recorda-creation/create-recorda.spec.ts#L327) | Publicar shows Enviando mídia... while the photo uploads, then returns to the Feed; the new Recorda is on the author's profile right away and on a follower's Seguindo. | RF-09.4 |
| [a feed card and a profile thumbnail both open the Recorda details](../tests/recorda-details/recorda-details.spec.ts#L48) | Tapping a Recorda card in the feed, or its thumbnail in the author's profile grid, opens the details screen of that Recorda. | RF-17.1 |
| [the details show the whole Recorda, with memory date, place and tagged people](../tests/recorda-details/recorda-details.spec.ts#L76) | The details show media, author, full description, song and comments, plus the Memory Date, Place and tagged users decided for the Recorda. | RF-17.2 |
| [the feed card and the details offer like, comment and share](../tests/recorda-details/recorda-details.spec.ts#L114) | Feed cards and the details screen have a like button; the details also let the user open the comments and share the Recorda. | RF-17.4, RF-23.1 |
| [the three-dots menu offers only delete on your Recorda and only report on others'](../tests/recorda-details/recorda-details.spec.ts#L152) | On someone else's Recorda the menu reports (no delete); on your own it deletes (no report). Neither offers editing. Checked on the feed card and on the details. | RF-17.5 |
| [liking toggles at once, shows the count and matches the server](../tests/recorda-details/recorda-details.spec.ts#L210) | The like count is shown on the card and the details. Liking updates it before the server answers, the server keeps the result, and liking again undoes it. | RF-23.2, RF-23.3 |
| [the author is notified of other people's likes but not of their own](../tests/recorda-details/recorda-details.spec.ts#L274) | A like from someone else shows up in the author's notifications; the author liking their own Recorda does not notify them. | RF-23.4 |
| [comments are a flat list in the order they were written](../tests/recorda-details/recorda-details.spec.ts#L317) | The details list the comments oldest first, with a field to write a new one that lands at the end; comments have no replies nor likes. | RF-24.1, RF-24.2 |
| [each comment shows avatar, username, text and date](../tests/recorda-details/recorda-details.spec.ts#L360) | A comment row shows who wrote it (avatar and username), what they wrote and when. | RF-24.3 |
| [a comment can't be longer than 500 characters](../tests/recorda-details/recorda-details.spec.ts#L396) | The comment field stops at 500 characters, and a 500-character comment is saved whole. | RF-24.4 |
| [the author is notified of new comments](../tests/recorda-details/recorda-details.spec.ts#L429) | A comment written by someone else shows up in the Recorda author's notifications. | RF-24.6 |
| [the comment author deletes their comment after confirming](../tests/recorda-details/recorda-details.spec.ts#L457) | Only your own comments show a delete button on someone else's Recorda; deleting asks for confirmation, cancelling keeps the comment and confirming removes it on the server. | RF-25.1, RF-25.3 |
| [the Recorda author deletes someone else's comment for everyone](../tests/recorda-details/recorda-details.spec.ts#L510) | The author of a Recorda can delete any comment on it; once confirmed, the comment is gone for its writer too. | RF-25.2, RF-25.3 |
| [a Recorda is reported from its feed card with an optional reason and stays visible](../tests/reports/reports.spec.ts#L32) | From the card's three-dots menu, the report dialog takes a reason of up to 500 characters; sending it confirms the report, and the Recorda is still on the feed. | RF-40.1, RF-40.2, RF-40.5 |
| [a Recorda is reported from the details menu without a reason](../tests/reports/reports.spec.ts#L66) | From the details screen's three-dots menu, a report can be sent with no reason; the details stay open afterwards. | RF-40.1, RF-40.2, RF-40.5 |
| [reporting the same Recorda twice shows a friendly message](../tests/reports/reports.spec.ts#L92) | Someone who already reported a Recorda tries again from the feed: the dialog closes and says it was already reported, instead of an error. | RF-40.3 |
| [the author is not notified of a report and can't see who sent it](../tests/reports/reports.spec.ts#L115) | After someone reports a Recorda, its author's notification center has nothing from the reporter and nothing about the report. | RF-40.6 |
| [another person's profile is reported with a reason](../tests/reports/reports.spec.ts#L150) | From someone else's profile, the three-dots menu opens the profile report dialog, which takes a reason of up to 500 characters and confirms the report. | RF-41.1, RF-41.3 |
| [your own profile can't be reported](../tests/reports/reports.spec.ts#L176) | The signed-in person's own profile has no three-dots menu and no report option. | RF-41.2 |
| [reporting the same profile twice shows a friendly message](../tests/reports/reports.spec.ts#L194) | Someone who already reported a profile tries again: the dialog closes and says it was already reported, instead of an error. | RF-41.4 |
| [an invalid email is refused before saving](../tests/settings/account.spec.ts#L10) | Saving an email without a valid format shows the format error and leaves the account's email unchanged. | RF-34.1 |
| [saving name, username and email updates the account](../tests/settings/account.spec.ts#L31) | New name, username and email saved in Minha conta are what the account has on the server, with no confirmation link for the email. | RF-34.1 |
| [an email already in use is refused](../tests/settings/account.spec.ts#L63) | Saving the email of another account shows that it is already in use, keeps what was typed and does not change the account. | RF-34.1 |
| [a new password needs both fields filled with the same value](../tests/settings/account.spec.ts#L91) | Filling only Nova senha, or two different values, shows an error and keeps the old password working. | RF-34.2 |
| [matching passwords replace the old one without asking for the current one](../tests/settings/account.spec.ts#L122) | With Nova senha and Repetir nova senha equal, saving changes the password: the new one signs in and the old one no longer does. The current password is never asked. | RF-34.2 |
| [deleting asks for confirmation and keeps the data without anonymizing it](../tests/settings/account.spec.ts#L151) | Cancel closes the dialog and keeps the account. Excluir signs out to Login; the account can't sign in anymore, and its username and email stay taken, so the record was deleted logically rather than anonymized. | RF-34.3 |
| [Portuguese, English and Spanish apply immediately and stay after reopening](../tests/settings/language.spec.ts#L55) | Picking English and then Spanish changes the open screen and Settings at once, saves the language on the account and keeps it after the app is reopened. | RF-33.1 |
| [feed and settings screens are fully translated to en](../tests/settings/language.spec.ts#L108) | With the account in en, the feed, profile, Settings, language and Minha conta screens show their copy in that language, with no Portuguese text left behind. | RNF-02 |
| [feed and settings screens are fully translated to es](../tests/settings/language.spec.ts#L108) | With the account in es, the feed, profile, Settings, language and Minha conta screens show their copy in that language, with no Portuguese text left behind. | RNF-02 |
| [the device language applies before login and the account language after it](../tests/settings/language.spec.ts#L171) | With English chosen on the device, the login screen is in English. After signing in with an account in Portuguese, the app switches to Portuguese and saves it on the device. | RF-33.2 |
| [the editor opens with the current artists, genres and song selected](../tests/settings/music-preferences.spec.ts#L47) | Each step of the editor starts with the account's current choices: its three artists and three genres lead the list and count as selected (unselecting each one lowers the counter), and its favorite song comes first, ready to save. | RF-31.1 |
| [saving needs at least three artists, three genres and exactly one song](../tests/settings/music-preferences.spec.ts#L90) | With two artists or two genres the step can't move on; with three again it can. The song is a single choice, and saving stores exactly the one picked. | RF-31.2 |
| [new preferences show on the profile, in suggestions and in the feed](../tests/settings/music-preferences.spec.ts#L142) | An account whose tastes match nobody has no suggestions and no discovery posts. After replacing its artists, genres and song with popular ones, the profile shows the new choices, and the search suggestions and the general feed start showing people and posts. | RF-31.3 |
| [switching to a private account asks first and applies at once](../tests/settings/privacy.spec.ts#L7) | A new account starts public. Cancelling the confirmation keeps it public; confirming makes it private on the server right away, and switching back makes it public again. | RF-32.1 |
| [going public accepts every pending follow request and notifies each requester](../tests/settings/privacy.spec.ts#L49) | Two people asked to follow a private account. Making it public accepts both requests at once, says how many were accepted, and each requester gets a FOLLOW_ACCEPTED notification. | RF-32.2 |
| [settings lead to my account, music preferences, language and sign-out](../tests/settings/settings-menu.spec.ts#L4) | From Settings the user opens Minha conta, the music preferences editor and the language screen and comes back from each, and reaches the sign-out confirmation. | RF-32.3 |
| [recorda details open the sharing interface](../tests/share/share-card.spec.ts#L8) | The user opens their seeded photo from Profile and reaches the sharing screen through its details. | RF-10.1 |
| [photo exports a portrait PNG with the light preset](../tests/share/share-card.spec.ts#L28) | A real browser download contains a decoded, nonempty PNG in Stories aspect ratio after selecting a preset. | RF-10.2, RF-11.5 |
| [photo exports a portrait PNG with the mint preset](../tests/share/share-card.spec.ts#L28) | A real browser download contains a decoded, nonempty PNG in Stories aspect ratio after selecting a preset. | RF-10.2, RF-11.5 |
| [photo exports a portrait PNG with the teal preset](../tests/share/share-card.spec.ts#L28) | A real browser download contains a decoded, nonempty PNG in Stories aspect ratio after selecting a preset. | RF-10.2, RF-11.5 |
| [photo exports a portrait PNG with the dark preset](../tests/share/share-card.spec.ts#L28) | A real browser download contains a decoded, nonempty PNG in Stories aspect ratio after selecting a preset. | RF-10.2, RF-11.5 |
| [video exports a portrait PNG with the light preset](../tests/share/share-card.spec.ts#L28) | A real browser download contains a decoded, nonempty PNG in Stories aspect ratio after selecting a preset. | RF-10.2, RF-11.5 |
| [video exports a portrait PNG with the mint preset](../tests/share/share-card.spec.ts#L28) | A real browser download contains a decoded, nonempty PNG in Stories aspect ratio after selecting a preset. | RF-10.2, RF-11.5 |
| [video exports a portrait PNG with the teal preset](../tests/share/share-card.spec.ts#L28) | A real browser download contains a decoded, nonempty PNG in Stories aspect ratio after selecting a preset. | RF-10.2, RF-11.5 |
| [video exports a portrait PNG with the dark preset](../tests/share/share-card.spec.ts#L28) | A real browser download contains a decoded, nonempty PNG in Stories aspect ratio after selecting a preset. | RF-10.2, RF-11.5 |
| [video sharing displays the first frame as a static image](../tests/share/share-card.spec.ts#L70) | The preview is compared with an independently decoded first frame of the real seeded video, and the download is a still PNG, not a video. | RF-10.4 |
| [the exported video card shows the first frame cropped, not stretched](../tests/share/share-card.spec.ts#L149) | The media region of the downloaded PNG matches the seeded video's first frame laid out like the preview (cover), and not a later frame. | RF-10.4 |
| [video card generation shows progress and stays on the device](../tests/share/share-card.spec.ts#L269) | Both thumbnail preparation and final PNG capture show progress. The actual browser export completes without contacting the backend for processing. | RF-10.5 |
| [presets form a horizontal scrollable list below the card](../tests/share/share-card.spec.ts#L340) | The selector is positioned below the preview and remains horizontally scrollable when a narrow viewport creates overflow. | RF-11.1 |
| [exactly three predefined presets are offered](../tests/share/share-card.spec.ts#L368) | The selector must offer exactly three styles, as required by US 11; the current frontend offers four. | RF-11.2 |
| [selecting a preset immediately changes the visible card](../tests/share/share-card.spec.ts#L385) | Changing styles updates both the selected radio and the rendered card without leaving the sharing screen. | RF-11.2, RF-11.4 |
| [sharing offers Instagram Stories and image download actions](../tests/share/share-card.spec.ts#L425) | After opening the card from Recorda details, both export actions are visible and available; native integrations remain outside this suite. | RF-12.1 |
| [an accepted request shows the Recordas at once and tells the requester](../tests/social/follow-requests.spec.ts#L26) | The owner accepts the request in the notification center; the requester then sees Seguindo and the account's Recordas on its profile, and gets a request-approved notification. | RF-21.2 |
| [a declined request is dropped without telling the requester](../tests/social/follow-requests.spec.ts#L64) | The owner declines the request; the requester gets no notification about it and sees Seguir again, still without access to the Recordas. | RF-21.3 |
| [the requester can cancel a pending request](../tests/social/follow-requests.spec.ts#L94) | Tapping Solicitado on the private profile cancels the request: the button goes back to Seguir, and it is still Seguir after reopening the app. | RF-21.4 |
| [the profile opens the followers and following lists, each with a search](../tests/social/followers.spec.ts#L11) | From the profile counters, Seguidores lists who follows the account and Seguindo who it follows; typing in the search narrows each list to the matching username. | RF-22.1 |
| [removing a follower is silent, and on a private account they must ask again](../tests/social/followers.spec.ts#L58) | A private account removes a follower from its Seguidores list after confirming. The removed person gets no notification, sees Seguir on the profile again, and following again only sends a request. | RF-22.2 |
| [on a private account only approved followers can see the lists](../tests/social/followers.spec.ts#L99) | The followers list of a private account is refused to someone who doesn't follow it and given to an approved follower. Other people's profiles have no link to the lists in the app, so this is checked on the API the lists use. | RF-22.3 |
| [search finds a person by username, shows the relation and opens the profile](../tests/social/search-and-follow.spec.ts#L20) | Typing a username lists that person with their avatar, username and the relation: Seguir before following, Seguindo after following a public account, Solicitado after asking to follow a private one. Tapping the result opens the profile. | RF-19.1, RF-19.2, RF-19.3 |
| [a private account appears in search but its content stays protected](../tests/social/search-and-follow.spec.ts#L72) | A private account is found by username like any other, and opening it shows the private-account notice instead of its Recordas. | RF-19.4 |
| [following a public account takes effect at once](../tests/social/search-and-follow.spec.ts#L105) | Another person's profile has a Seguir button; tapping it makes it Seguindo right away, the viewer is in the account's followers, and its Recordas show. | RF-20.1, RF-20.2 |
| [following a private account sends a request and notifies the owner](../tests/social/search-and-follow.spec.ts#L135) | Tapping Seguir on a private account turns the button into Solicitado without following yet, and the owner gets a follow-request notification. | RF-20.3 |
| [unfollowing removes the follow without telling the other person](../tests/social/search-and-follow.spec.ts#L169) | Unfollowing from the profile turns the button back into Seguir, takes the viewer out of the followers, and adds no notification for the other person. | RF-20.5 |
| [unfollowing needs no confirmation](../tests/social/search-and-follow.spec.ts#L198) | Tapping Seguindo unfollows at once, as US 20 says, without a confirmation dialog. | RF-20.5 |
| [suggestions are ordered by musical affinity and skip followed, requested and yourself](../tests/social/suggestions.spec.ts#L57) | Before typing, the search shows suggested profiles: the person sharing more artists comes before the one sharing fewer, while someone already followed, someone with a pending request and the viewer themself are left out. | RF-27.1, RF-27.2 |
| [each suggestion shows the person and a follow action](../tests/social/suggestions.spec.ts#L98) | A suggestion shows the person's username and avatar, and its follow toggle follows them from the search screen. | RF-27.3 |
| [each suggestion shows the genres and artists in common](../tests/social/suggestions.spec.ts#L122) | A suggestion names what the viewer and the suggested person have in common, as US 27 asks. | RF-27.3 |
