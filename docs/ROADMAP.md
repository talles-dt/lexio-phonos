# Lexio Phonos — roadmap orientado ao aluno

Pedido recebido em 3–4 de outubro de 2026: auditoria completa do repositório, roadmap e implementação, priorizando a experiência do aluno. Este roadmap define a entrega verificável desta revisão; o relatório separa limitações científicas de funcionalidades de produto.

| ID  | Prioridade | Funcionalidade                     | Critério de aceite                                                                                                                                                                       |
| --- | ---------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | P0         | Gravação confiável e privada       | Start → Stop → áudio WAV reproduzível; taxa real do dispositivo; captura mono; cauda preservada; cancelamento, erro de permissão, liberação do microfone e limite de 15 s.               |
| R2  | P1         | Prática guiada                     | Texto exato a dizer, IPA explicado, dica de articulação, sequência ouvir → gravar → refletir. Modelo de voz local do navegador claramente sintético; indisponibilidade explicada.        |
| R3  | P1         | Feedback honesto                   | Silêncio, gravação curta e saturação não contam como prática válida. Observações acústicas sem notas de pronúncia, domínio, CEFR ou julgamento de fonemas sem modelo validado.           |
| R4  | P1         | Diário e retomada                  | Tentativas com data/duração/exercício; atualização imediata; persistência após recarga; retomar exercício; autorreflexão confortável/praticar novamente e fila de revisão.               |
| R5  | P1         | Descoberta de exercícios           | Busca por palavra/IPA, filtros combináveis de categoria e nível, favoritos, lista de revisão, estado vazio e próximo exercício.                                                          |
| R6  | P1         | Rotina pessoal                     | Meta diária configurável de gravações; contagem e minutos de prática; mudança de data local sem avaliar proficiência.                                                                    |
| R7  | P1         | Portabilidade e controle dos dados | Exportar/importar backup JSON validado, mesclar sem duplicatas, baixar WAV atual, apagar entrada/histórico com confirmação, recuperar armazenamento bruto corrompido sem sobrescrevê-lo. |
| R8  | P1         | Resiliência offline                | Catálogo integrado, aplicação sem banco obrigatório, cache do shell e JS/CSS para revisitas; estado de preparação verificável e APIs pessoais fora do cache.                             |
| R9  | P1         | Acessibilidade e uso móvel         | Controles nativos por teclado, foco visível, estados anunciados, alternativa textual para gráficos, contraste legível, redução de movimento e ausência de overflow a 320 px.             |
| R10 | P0         | Privacidade e APIs                 | Endpoints legados de dados pessoais desativados, alterações anônimas de catálogo recusadas; nenhum envio de voz ou dados de aluno; nenhuma alteração do banco legado.                    |
| R11 | P1         | Conteúdo e manutenção              | Uma fonte de catálogo, referências válidas, seed opcional corrigido, documentação fiel, versões corrigidas, lint/types/unit/build/browser integrados à CI.                               |

## O que não pode ser prometido como resultado de código

Avaliação automática validada de pronúncia, alinhamento fonético real e comparação com referências humanas exigem um corpus apropriado, consentimento/licenciamento das gravações e validação pedagógica por falantes de diferentes perfis. Não se substitui essa evidência por alvos sintéticos ou por porcentagens inventadas. A entrega mantém visualizações experimentais e autorreflexão.

Contas, sincronização de dados entre dispositivos e ferramentas de professor não foram priorizadas: o projeto já declarava ausência de contas por decisão de produto. O backup manual atende à portabilidade da prática sem introduzir cadastro ou transmissão de voz.

## Critério de conclusão

Cada R1–R11 precisa ser associado a implementação e evidência no relatório de auditoria/validação. Código compilado ou testes de API isolados não bastam para comprovar o fluxo do aluno. A integração na branch principal e a ativação em produção devem ser identificadas separadamente da entrega em branch/PR.

## Situação da entrega

R1–R11 implementados nesta branch. Consulte a matriz de evidências em [AUDIT.md](AUDIT.md). A implementação foi verificada localmente; a entrega por PR não implica merge nem ativação em produção.
