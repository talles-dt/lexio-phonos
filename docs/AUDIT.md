# Auditoria do Lexio Phonos

Auditoria iniciada em 3 de outubro de 2026, com continuação em 4 de outubro. Base: `12fb321586ea039089ae6143a52fa47cea319f37`, branch `main` de `talles-dt/lexio-phonos`. Prioridade indicada pelo usuário: experiência do aluno.

## Método e limites

Inspeção do código versionado, configurações, dependências, APIs, esquema/seeds, áudio, pontuação, interface, acessibilidade, PWA, testes, documentação e estado do GitHub Actions. As conclusões de segurança vêm de leitura do código: não foi necessário explorar produção, consultar registros de alunos ou executar alterações no banco. O snapshot inicial passou build, TypeScript e 13 testes unitários, apesar de falhas graves no fluxo do navegador. Os cinco runs disponíveis de CI estavam em falha; esse estado não equivale ao diagnóstico de cada job.

O banco remoto, permissões da infraestrutura e qualidade pedagógica em população real não são comprováveis apenas pelo repositório. Limites explícitos impedem confundir esta auditoria de aplicação com pentest autorizado de infraestrutura ou validação científica.

## Achados na base

| ID  | Severidade              | Evidência / impacto                                                                                                                                                             | Tratamento nesta revisão                                                                                                            |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| A01 | Crítica funcional       | `src/utils/audioWorklet.ts`: string executada no navegador contém `private`, tipos TS e `options: any`; `isRecording` nunca ativado. Captura não produz PCM utilizável.         | Processador JavaScript válido, protocolo de parada com confirmação e teste da string real.                                          |
| A02 | Alta                    | `DrillCard.tsx`: início define `isRecording=true`, desabilitando o mesmo botão que deveria parar.                                                                               | Estado único do hook, Stop habilitado e percurso de navegador com microfone simulado.                                               |
| A03 | Alta                    | Manager assume 48 kHz, descarta mensagens pendentes e cauda ao parar; contexto e URLs não são liberados consistentemente.                                                       | Taxa do contexto, flush ordenado, reamostragem Web Audio, cancelamento e cleanup.                                                   |
| A04 | Alta                    | `scoring.ts`: consonantes/desconhecidos recebem 0.5 e `isAcceptable=true`; frames vazios geram NaN; timings ausentes são substituídos pelos próprios alvos.                     | Avaliação não validada retirada do fluxo; indisponível é indisponível, sem nota neutra fabricada.                                   |
| A05 | Alta                    | Pesos de score podem somar 1.2; frações 0–1 exibidas com `%`; contorno sintético determina críticas de entonação sem referência válida.                                         | Sem porcentagem de proficiência. Estimativas exploratórias separadas da qualidade da gravação.                                      |
| A06 | Alta — privacidade      | GET `/api/recordings` sem `userId` lista registros; DELETE confia apenas em `id`; mastery aceita identidade e nível arbitrários.                                                | Rotas legadas retornam 410/no-store, sem acesso ao banco; histórico efetivamente local.                                             |
| A07 | Alta — integridade      | POST de catálogo e análise pública sem autorização/limites robustos.                                                                                                            | Catálogo somente leitura; POST recusado; análise executada localmente, endpoint remoto retirado.                                    |
| A08 | Alta funcional          | Página apenas lê mastery; não conecta `onComplete` nem grava tentativas; identidades de cookie não criam User no banco.                                                         | Diário local integrado ao fim da gravação, sem cookie ou vínculo anônimo compartilhado.                                             |
| A09 | Alta conteúdo           | Seed JS contém campos inexistentes (`f1Target/f2Target` em DrillPhoneme), cinco IDs ausentes/inconsistentes, seed TS divergente. Documentação informa 34/11; JS tem 35/12.      | Catálogo único com 41 fonemas/12 exercícios, `u:` normalizado, referências adicionadas; seed opcional usa campos reais e transação. |
| A10 | Alta pedagógica         | Texto-alvo não aparece; título de par mínimo pode ser confundido com instrução de dizer ambas as palavras; modelo de áudio prometido ausente.                                   | Texto exato destacado, dica e IPA; voz sintética opcional identificada como tal.                                                    |
| A11 | Alta acessibilidade     | Expansão em div clicável sem teclado; erros de microfone só no console; controles não quebram linha no móvel.                                                                   | Botões nativos, erro acionável, estado/timer, layout responsivo.                                                                    |
| A12 | Média                   | Texto zinc pequeno abaixo de 4.5:1; gráficos sem nome acessível/alternativa textual; foco e movimento insuficientes.                                                            | Cor mais clara, foco, texto resumido dos gráficos, reduced motion.                                                                  |
| A13 | Alta funcional          | `public/sw.js` tem uma única linha com `\\n` literais, inteiramente comentada. Offline não funciona.                                                                            | Service worker executável, cache restrito e teste de recarga offline.                                                               |
| A14 | Média — risco latente   | Descomentando o SW original, APIs pessoais seriam cacheadas sem TTL; limpeza apagaria caches de outras apps no mesmo origin.                                                    | Bypass de APIs e métodos não GET; remoção apenas de caches `lexio-phonos-*`.                                                        |
| A15 | Alta manutenção         | CI usa Node 18 incompatível com Next 16; testes de navegador não executam captura; configuração Vitest duplicada e alias incorreto.                                             | Node 22, configuração única, validação de produção e navegador na CI.                                                               |
| A16 | Crítica em dependências | `npm ci` inicial reporta 16 vulnerabilidades: 3 críticas, 10 altas, 3 moderadas. Inclui Next e tooling de teste.                                                                | Atualização de versões e remoção de tooling não usado; contagem final deve ser reportada a partir do audit final.                   |
| A17 | Média documental        | README contradiz PostgreSQL com SQLite, script inexistente, falsa descrição de progresso “no cookie”, GOP e gestos não implementados; links de contribuição apontam outro dono. | Documentação reescrita conforme comportamento implementado e limites explícitos.                                                    |
| A18 | Média acústica          | Detector de pitch busca desde lag 1; pode escolher frequência fora dos limites e retornar null para um tom periódico válido.                                                    | Busca inicia no lag correspondente ao teto de frequência; regressão com tom conhecido.                                              |

## Decisões de implementação

- A aplicação do aluno usa o catálogo versionado. O esquema PostgreSQL é preservado para manutenção, mas o navegador não depende de um banco disponível.
- O histórico registra eventos de prática e autorreflexões. Não registra uma suposta medida de domínio fonético. Dados locais existentes com formato inválido não são sobrescritos silenciosamente.
- Áudio existe temporariamente em memória/URL blob e pode ser baixado em WAV. Não é incluído no backup de metadados nem enviado ao servidor.
- Não há migração automática de dados remotos: o cookie legado não constitui autenticação segura para autorizar sua leitura. O banco não foi apagado ou reescrito.
- Retirar endpoints antigos é mudança incompatível para eventuais clientes externos. Ela precisa acompanhar as notas da versão; o frontend deste repositório deixa de usá-los.

## Validação

Validação local final de 4 de outubro de 2026, com Node 22.22.1, Next 16.3.8 e instalação limpa a partir do lockfile:

- `npm ci`: concluído, incluindo geração do Prisma Client.
- `npm run lint`: passou sem avisos ou erros.
- `npm run typecheck`: passou para aplicação e testes de navegador.
- `npm test`: 19 testes / 6 arquivos passaram.
- `npm run build`: build de produção concluído sem depender de DATABASE_URL.
- `npm run test:e2e`: 12 testes Chromium passaram (34,2 s), usando WAV sintético a 48 kHz como microfone de teste e captura/reamostragem reais do navegador.
- Axe: sem violações nos critérios automatizáveis WCAG 2 A/AA e 2.1 AA avaliados, em desktop, viewport de 320 px e painel de observações expandido. Isso não certifica conformidade integral; screenshots desktop/mobile foram inspecionadas.
- `npm audit`: 0 vulnerabilidades conhecidas reportadas, incluindo dependências de desenvolvimento (revalidado em 2026-10-04 após instalação limpa).
- `prisma validate`: esquema válido, com URL local fictícia apenas para validação; nenhum banco foi acessado por esse comando. O seed foi conferido por tipos gerados e integridade do catálogo, mas não executado contra banco remoto.
- `git diff --check`: sem erros de whitespace.
- Inspeção heurística de 114 blobs do histórico para formatos de tokens, chaves privadas e URLs de credenciais: nenhuma correspondência suspeita nos padrões examinados. Essa inspeção limitada não substitui um scanner exaustivo de segredos.

### Matriz requisito → evidência

| Requisito | Implementação | Evidência observada |
| --- | --- | --- |
| R1 | `audioWorklet.ts`, `useAudioCapture.ts` | Teste da string executável confirma mono, cauda e limite na taxa de 44,1 kHz; navegador grava WAV 16 kHz não silencioso, reproduz, cancela permissão pendente, para em 15 s e encerra tracks. |
| R2 | `DrillCard.tsx`, `ReferencePlayer.tsx`, catálogo | Texto/IPA/dicas renderizados; fallback real de ausência de voz observado. Teste com adaptador de síntese comprova seleção só de inglês local, texto e velocidade. Não houve validação auditiva de voz real do SO neste ambiente headless. |
| R3 | `scoring.ts`, `analysis.worker.ts` | Casos de áudio curto/silencioso/saturado/inválido sem nota; silêncio capturado no navegador não gera entrada no diário. Tom periódico tem estimativa de pitch plausível; isso não prova reconhecimento de fala. |
| R4 | `progress.ts`, página e card | Gravação e reflexão persistem após reload; última seleção é retomada. Fila deriva da reflexão mais recente, coberta por teste unitário. |
| R5 | Catálogo, filtros e navegação na página | Busca, categoria, favorito e reset de estado vazio exercitados no navegador; seleção por teclado funciona. Filtros são combinados pelo mesmo predicado, sem modificar o catálogo. |
| R6 | `dailyGoal`, data local e contadores | Alteração para 5 persiste após recarga; duração é obtida do PCM; contagem usa registros e dia local, não um score. |
| R7 | Validador, merge e controles do diário | Exportar → limpar → importar restaura favoritos; merge idempotente e dados inválidos testados; armazenamento corrompido preservado. Download WAV contém taxa e amostras verificadas. Exclusão exige confirmação e remove o ID selecionado. |
| R8 | SW versionado e preparação do worker | Recarga offline da aplicação e primeira gravação offline com análise em worker passaram. Preparação inclui dependências do worker; registro do SW sozinho não é tratado como sucesso. |
| R9 | HTML nativo, CSS e alternativas de gráficos | Teclado, ausência de overflow a 320 px, nomes acessíveis, status e Axe em telas inicial/expandida verificados. Foco e versão mobile conferidos visualmente. |
| R10 | Rotas públicas somente leitura e rotas retiradas | GET/POST/DELETE de endpoints pessoais devolvem 410/no-store; POST de catálogo devolve 405; gravação não gera POST de dados. Rotas não importam Prisma. Não foram executadas mutações remotas de dados. |
| R11 | Catálogo único, seed, documentação e CI | 41 fonemas / 12 exercícios com referências válidas; geração/validação/types; workflow inclui lint, tipos, unitários, auditoria completa, contratos do lint, build e navegador. |

### Alcance da entrega

Implementação entregue na branch `codex/audit-roadmap-implementation`, para revisão por pull request. Merge, aplicação de seed no banco legado e deploy de produção não fazem parte das ações executadas nesta auditoria. A aprovação de testes locais não comprova o estado de uma versão já publicada.


## Revisão de conteúdo

Foram corrigidas a apresentação de /əʊ/ e da tonicidade de _photograph_, além da instrução incorreta de reduzir indiscriminadamente todas as sílabas não tônicas. O exemplo britânico mantém a vogal final /ɑː/. Fontes consultadas: [photograph — Cambridge](https://dictionary.cambridge.org/pronunciation/english/photograph), [beautiful — Cambridge](https://dictionary.cambridge.org/us/pronunciation/english/beautiful) e [cot — Cambridge](https://dictionary.cambridge.org/pronunciation/english/cot). A aplicação explicita o sotaque nos exemplos revisados e não trata variação legítima de sotaque como erro. Áudio de terceiros não foi baixado, copiado ou distribuído.

## Dependências

Next atualizado para 16.3.8 e Vitest para 5.0.3; tooling DOM não utilizado removido. O override `deepmerge-ts ^8.0.0` corrige [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx) mantendo a API `deepmerge` usada por `@prisma/config`; geração/validação de Prisma são verificadas, sem conexão com banco remoto.

Os 5 alertas altos restantes foram resolvidos em 2026-10-04 removendo a cadeia `fast-glob → micromatch → braces` do plugin de lint. O advisory [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) ainda não possui versão corrigida de `braces`. Um override restrito a `@next/eslint-plugin-next` usa o adaptador local `tooling/next-eslint-glob`, baseado em `tinyglobby 0.2.17`, para a única API consumida pelo plugin: `globSync(string, { onlyDirectories: true })`. O adaptador preserva expansão explícita e formato de caminhos; chamadas incompatíveis falham de forma explícita. Não houve downgrade de Next, exclusão de regras ou exceção no auditor.

Quatro testes de contrato verificam resolução de diretórios e diagnósticos reais das regras Next, React Hooks e TypeScript. A CI agora executa `npm audit --audit-level=high` sobre todas as dependências. O README do adaptador documenta seu escopo e a condição para removê-lo em uma futura atualização oficial.

O catálogo final contém 41 fonemas: além das referências ausentes corrigidas inicialmente, foram acrescentados /əʊ/ e /j/ para representar os exemplos britânicos revisados de _photograph_ e _beautiful_. Sequências de frases foram completadas e todos os limites temporais artificiais passaram a `null`, porque não há áudio de referência alinhado que os sustente. As versões anteriores permanecem no histórico Git.


### Reprodutibilidade do build

Na revalidação de 2026-10-04, duas tentativas da CI falharam no processamento remoto de fontes Google pelo Turbopack, embora builds limpos locais passassem. Syne, Source Serif 4 e JetBrains Mono passaram a ser carregadas por `next/font/local`, com os arquivos WOFF2 versionados, licenças SIL OFL e proveniência em `src/app/fonts/README.md`. As famílias e variáveis CSS foram preservadas; o build não precisa mais consultar o Google Fonts.
