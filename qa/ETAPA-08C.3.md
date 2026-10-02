# Fala Livre — Etapa 08C.3

Validação realizada em 02/10/2026. Base: `main`, `a2fe6cc`. Working tree inicial limpa.

**A. Arquivos criados:** `src/data/myDayRoutines.js`, `src/utils/routineSequence.js`, os 13 PNGs relacionados abaixo, `qa/routines.test.mjs`, `qa/routines.browser.mjs`, `qa/routines-390.png` e este relatório.

**B. Arquivos alterados:** `src/pages/SequenceGame.jsx`, `src/utils/contentRotationStorage.js`, `src/assets/pictograms/arasaac/CREDITS.md`.

**C. Oito rotinas:** escovar-dentes, lavar-maos, calcar-sapato, preparar-dormir, preparar-sair, hora-comer, ir-escola e voltando-casa. Textos, contextos, ações, IDs dos pictogramas e dependências seguem o catálogo aprovado. Sem níveis, cronômetro, pontuação ou classificação na experiência contínua.

**D. Pictogramas adicionados:**

| Arquivo PNG | ID ARASAAC |
| --- | --- |
| colocar-pasta-escova.png | 30086 |
| calcar-sapato.png | 14534 |
| amarrar-cadarco.png | 17026 |
| vestir-camiseta.png | 2781 |
| colocar-mochila-costas.png | 38265 |
| abrir-porta.png | 24597 |
| sair.png | 2806 |
| sentar-cadeira.png | 2801 |
| limpar-superficie.png | 3351 |
| ir-escola.png | 36473 |
| chegar-casa.png | 16805 |
| pendurar-mochila.png | 37896 |
| tirar-sapato.png | 14536 |

Arquivos obtidos de `https://static.arasaac.org/pictograms/ID/ID_300.png`; IDs e nomes originais consultados em `https://api.arasaac.org/v1/pictograms/es/ID`. Todos os 13 PNGs foram inspecionados visualmente antes da cópia para o projeto. Os oito pictogramas locais reutilizados também foram inspecionados. Não houve geração, composição ou adaptação de imagens; os arquivos compartilhados anteriores permanecem intactos.

**E. Créditos:** tabela específica em `CREDITS.md` com arquivo, ID, nome original, página e PNG oficiais. Sergio Palao, Governo de Aragão, ARASAAC e CC BY-NC-SA 4.0 registrados; nenhuma adaptação. Rodapé de atribuição preservado e visível na rota.

**F. Ordens alternativas:** todas as permutações foram verificadas. Quantidades válidas na ordem do catálogo: 1, 1, 1, 2, 6, 1, 2 e 6. Conferência usa dependências do catálogo, presença de todos os cartões e ausência de duplicações. Nenhuma sequência canônica é exigida.

**G. Embaralhamento:** uma passagem Fisher–Yates limitada, seguida de inversão de uma dependência caso a ordem sorteada seja válida. Exclui todas as respostas válidas, preserva cartões e não usa loops de tentativas nem enumeração em produção. Dois cartões podem reutilizar a única ordem inválida. Verificados 1.000 embaralhamentos por rotina, incluindo valores de aleatoriedade extremos e não finitos; nenhuma duplicação ou `undefined`.

**H. Ajuda e conferência:** ajuda textual identifica uma dependência violada e destaca seus dois cartões sem impor posições, mover cartões ou avançar. Dica contínua permanece até outra ação. Conferir é explícito; erro preserva a tentativa e permite correção. Acerto libera somente Próxima rotina; ajuda numa ordem já válida pede Conferir.

**I. Rotação e persistência:** reutiliza integralmente os motores existentes. Registra `myDayRoutines`, `myDayCommunication` e `myDayEmotions`; somente Rotinas inicializa conteúdo nesta etapa. Refresh e saída/retorno mantêm a rotina atual. Ordem intermediária não persiste. Guarda síncrona impede avanço duplicado; estado transitório reinicia ao trocar de rotina. Sem storage utilizável, mantém fallback em memória durante a sessão.

**J. Ciclos:** dois ciclos completos verificados nas funções e no navegador: oito IDs únicos por ciclo, incremento correto e ausência de repetição imediata entre ciclos. Ajuda, áudio, trocas, Conferir e navegação não avançam a rotação.

**K. Legado:** `#/jogar/sequencias` preserva três níveis e nove atividades originais. Todas as nove foram organizadas, conferidas e avançadas no navegador. `sequenceGameLevels.js`, sua conferência e seu embaralhamento não foram alterados; ajuda por posição permanece no modo legado.

**L. Regressões:** quatro cards de Aprender, três opções de Meu Dia a Dia e seis jogos públicos confirmados no navegador. Sequências e Bingo seguem ocultos. Os quatro módulos contínuos anteriores abriram sem erro; seus estados de storage foram comparados antes/depois do avanço de Rotinas e permaneceram iguais. Comunicação e Emoções de Meu Dia a Dia abrem sem iniciar os novos ciclos. Arquivos dos jogos públicos, Bingo, backend, autenticação, perfil e progresso não foram alterados.

**M. Responsividade e acessibilidade:** oito rotinas em 320, 360, 390, 430, 768, 1024 e 1366px, com elementos padrão e ampliados: sem overflow horizontal, sobreposição entre controles ou texto cortado nos cartões; todas as imagens carregaram. Captura de 390px inspecionada visualmente. Preservados Pointer Events, captura/cancelamento, arrastar/soltar, seleção por clique/toque, teclado, Escape, foco após troca/acerto/avanço, indicadores de foco e `role="status"`.

**N. Testes e limitações:** `node qa/routines.test.mjs` e `node qa/routines.browser.mjs` passaram. QA de navegador usa Chrome headless com CDP, servidor local e dependências já disponíveis, sem instalações. Mouse drag, cancelamento, Enter, Escape, toque emulado, refresh, retorno, duplo clique, dois ciclos e regressões foram executados. Chamada de áudio manual e ausência de chamadas automáticas verificadas por instrumentação de `speechSynthesis.speak`; não houve avaliação auditiva da voz. Não houve teste físico de touch/stylus nem teste com leitor de tela. Os seis jogos públicos e os quatro módulos anteriores receberam verificações de menu/montagem/storage, não repetição integral de seu QA anterior. A API ARASAAC ficou acessível após execução autorizada fora do sandbox. Build também precisou de execução autorizada por `spawn EPERM` dentro do sandbox.

**O. Verificações:** `npm run lint`, `npm run build` e `git diff --check` passaram. Nenhuma dependência instalada. Nenhum erro de execução do navegador durante o QA.

**P. Commit:** mensagem `Implement continuous My Day routines`; hash informado na entrega final. Sem push.

**Q. Working tree:** conferir após o commit e informar na entrega final.

**RESULTADO: PASS.**

**ETAPA 08C.3 CONCLUÍDA — OITO ROTINAS IMPLEMENTADAS COMO APRENDIZAGEM CONTÍNUA, COM PICTOGRAMAS VALIDADOS E LEGADO PRESERVADO.**
