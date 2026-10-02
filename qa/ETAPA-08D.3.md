# Fala Livre — Etapa 08D.3

Data: 02/10/2026. Branch: `main`. Base inicial: `39a6a8c — Implement continuous My Day routines`; working tree inicialmente limpa.

**A. Arquivos criados:** `src/data/myDayCommunication.js`, `src/data/socialExpressions.js`, `src/utils/myDayCommunication.js`, `src/assets/pictograms/arasaac/por-favor.png`, `src/assets/pictograms/arasaac/agradecimento.png`, `qa/communication.test.mjs`, `qa/communication.browser.mjs`, `qa/communication-390.png` e este relatório.

**B. Arquivos alterados:** `src/App.jsx`, `src/pages/InteractiveSituationsGame.jsx`, `src/pages/Communication.jsx`, `src/pages/Communication.css` e `src/assets/pictograms/arasaac/CREDITS.md`. Não foram alterados catálogos legados, motores de rotação, speech.js, preferências, backend, autenticação ou dependências. O componente de construção é compartilhado; seleção de conteúdo, reducer, validação, fala, ajuda e avanço diferenciam os modos.

**C. Situações:** água (`agua`), comida (`pedir-comida`), brincar (`brincar`), dormir (`dormir`), ajuda (`ajuda`), banheiro (`banheiro`), fome (`fome`), dor (`dor`), recusar comida (`nao-quero-comer`) e recusar brincadeira (`nao-quero-brincar`). Contextos, missões e descrições alternativas seguem o catálogo aprovado. Uma atividade por vez, sem níveis, cronômetro, pontuação ou penalizações.

**D. Catálogo visual:**

| Situação | Asset | ID ARASAAC |
| --- | --- | --- |
| Água | sede.png | 4963 |
| Comida | comer.png | 2349 |
| Brincar | scenes/situacao-brincar.png | Cena existente; sem ID atribuído |
| Dormir | sono.png | 8513 |
| Ajuda | ajuda.png | 12252 |
| Banheiro | banheiro.png | 2430 |
| Fome | fome.png | 7272 |
| Dor | dor.png | 2367 |
| Ambas as recusas | nao.png | 5525 |

Os oito PNGs de contexto já haviam sido validados na 08D.2; foram preservados. A cena de brincadeira mantém descrição de duas crianças com blocos. Não se atribui dificuldade ou recusa a cenas antigas de participação feliz. Imagens carregadas no navegador; captura mobile inspecionada visualmente.

**E. Sociais:** exatamente dois novos PNGs oficiais, baixados de `https://static.arasaac.org/pictograms/8195/8195_300.png` e `https://static.arasaac.org/pictograms/8129/8129_300.png`, visualmente conferidos antes da integração. POR FAVOR = 8195, nome original “por favor”; OBRIGADO e OBRIGADA = 8129, nome original “gracias”, mesmo arquivo. Escolha linguística explícita, sem inferência por perfil, aparência ou voz. Créditos incluem páginas individuais, URLs dos PNGs, Sergio Palao, Governo de Aragão, ARASAAC, CC BY-NC-SA 4.0 e ausência de adaptações.

**F. Comunicar:** grupo complementar nativo `details/summary` “Expressões sociais” presente nos quatro conjuntos. Expandir/recolher por teclado, seleção, fala isolada, remoção e limpeza verificados. Expressões podem ser acrescentadas às mensagens; naturalização mantém os dez registros oficiais intactos. O vocabulário efetivamente consumido combina learningConcepts e socialExpressions; não depende de acrescentar registros somente a communicationOptions. Nenhum quinto conjunto ou mudança na rotação communication.

**G. Complementos:** seis pedidos aceitam base ou base + POR FAVOR. Fome e dor aceitam somente base. Duas recusas aceitam base, base + OBRIGADO ou base + OBRIGADA. Espaço extra explicitamente opcional; bases completas habilitam conferência sem preenchê-lo. Não se adiciona expressão automaticamente ou atividade social ao ciclo.

**H. Conferência:** função pura compara exatamente a tentativa atual com as alternativas do catálogo, respeitando IDs, quantidade, ordem e lacunas. Todos os 20 casos válidos passaram nas funções e na UI. Incompletas, ordem invertida, duplicações, extras, complementos indevidos, social isolado, NÃO + OBRIGADO e token combinado NÃO QUERO foram rejeitados pelos testes. Erro preserva cartões e permite substituir/remover/limpar. Acerto bloqueia edição e libera Próxima situação; sem avanço automático ou flag histórica de acerto.

**I. Áudio:** helper separado recebe somente tokens atuais, mapa de frases reconhecidas e vocabulário. Vazia retorna texto vazio e desabilita Ouvir frase; EU + QUERO fala “Eu quero.”; EU + QUERO + COMER numa missão de água fala “Eu quero comer.”; EU + lacuna + ÁGUA fala “Eu água.”. Frases conhecidas recebem ajustes gramaticais correspondentes mesmo fora da missão. Complementos e expressões isoladas preservam a seleção. Speakers individuais, idioma pt-BR, voz configurada e feedback de indisponibilidade verificados por instrumentação. Fala manual; construção, ajuda, conferência e avanço não iniciam áudio. Cancelamento preservado; fala legada e speech.js intactos.

**J. Ajuda:** primeira solicitação orienta a intenção (pedido/estado/recusa); segunda identifica uma posição que merece revisão, sem dizer ou inserir o token correto. Mensagem já válida orienta conferir sem exigir complemento. Não preenche, move, fala automaticamente, penaliza ou avança. Ajuda original do jogo legado preservada e testada.

**K. Rotação:** usa exclusivamente getModuleRotation/advanceModuleRotation/getCurrentTheme existentes, com myDayCommunication já registrado. Somente Próxima situação avança, após acerto; guarda síncrona contra duplo clique. Refresh e saída/retorno preservam atividade, reiniciando a construção transitória. Comparação de storage confirmou isolamento de communication, wordsAndPhrases, writing, dailySituations, myDayRoutines e myDayEmotions. Storage ausente, corrompido ou lançando exceção passou no fallback existente em memória; sem promessa de persistência entre reloads nesses casos. Nenhuma limpeza ou migração global.

**L. Dois ciclos completos no navegador:**

1. agua → pedir-comida → brincar → dormir → ajuda → banheiro → fome → dor → nao-quero-comer → nao-quero-brincar.
2. ajuda → fome → dor → brincar → dormir → nao-quero-brincar → banheiro → agua → pedir-comida → nao-quero-comer.

Primeiro ciclo preparado explicitamente pelo QA para cobertura determinística; segundo embaralhado pelo motor de produção. Cada ciclo apresentou dez IDs únicos, sem repetição na fronteira. Cada avanço foi também acionado duas vezes no mesmo evento para verificar a guarda. Testes puros adicionais executaram 100 pares de ciclos.

**M. Legado:** três níveis e 12 atividades de Situações Interativas foram construídos, ajudados, conferidos e avançados no Chrome, mantendo missões e respostas originais. Os nove cenários em aprender/situacoes mantiveram escolhas originais, ajuda, acerto e avanço dailySituations; todos executados. Oito rotinas foram organizadas, conferidas e avançadas. interactiveSituations.js, dailySituations.js e todos os assets antigos permanecem intactos; não se substituiu ajuda ou fala legada.

**N. Regressões:** quatro cards de Aprender e seis jogos públicos confirmados; seis rotas de jogos montaram controles. Comunicar exercitado nos quatro conjuntos, com complementos e sem cortesia obrigatória para liberar continuação. Palavras e Frases, Escrever, perfil e Meu Dia a Dia/Emoções abriram; ciclos existentes permaneceram isolados. Menus públicos, Bingo oculto, configurações de acessibilidade e preferências não foram alterados. Jogos e módulos não envolvidos receberam smoke checks e verificação de isolamento, sem repetição integral de todas as suas funcionalidades.

**O. Acessibilidade/responsividade:** clique, mouse drag real via CDP, captura, Escape durante arraste, cancelamento, seleção por Enter, toque emulado, foco visível, substituição, remoção, limpeza e statuses passaram. Confirmação foca Próxima situação. Details expande/recolhe por Enter. Em 320, 360, 390, 430, 768, 1024 e 1366px, com elementos normais/ampliados, a recusa de cinco cartões e seus controles não apresentaram overflow horizontal ou sobreposição; todas as imagens carregaram. Seção social expandida também sem overflow nas sete larguras. As bases de quatro cartões são exercitadas com o quinto espaço vazio opcional. Captura de 390px inspecionada.

**P. Testes e limites:** `node qa/communication.test.mjs`, `node qa/communication.browser.mjs` e `node qa/routines.test.mjs` passaram. Chrome headless, CDP, perfil temporário isolado e servidor local; nenhuma instalação. Teste de voz utiliza utterance/voices/speak instrumentados, conferindo texto, idioma e escolha configurada; não houve avaliação auditiva. Sem toque/caneta físicos ou leitor de tela. Nenhum erro de runtime no QA. O teste de voz exigiu corrigir o próprio harness para realmente recarregar o documento antes da instrumentação; após a correção, passou. Testes antigos não foram modificados. Não se repetiu routines.browser.mjs porque suas expectativas da etapa anterior exigem Comunicação ainda provisória; a regressão atual executa as oito rotinas sem alterar aquele script.

**Q. Qualidade:** `npm run lint`, `npm run build` e `git diff --check` passaram. Build precisou de execução autorizada fora do sandbox devido a spawn EPERM; download e Chrome também executados com autorização de ferramenta. Sem dependências novas.

**R. Commit:** implementação `1b3f5cc73e4c284f9b455b4c4ac3b044376c2e44` — `Implement continuous My Day communication`. Um commit documental posterior registra esse hash neste relatório. Sem push.

**S. Working tree:** após o commit da implementação, somente este relatório estava pendente; nenhum arquivo de implementação ou arquivo alheio alterado. A entrega final inclui a verificação de árvore limpa após o commit documental.

**T. Pendências:** DE NADA permanece fora do catálogo, aguardando validação individual em etapa futura. Nenhuma pendência funcional identificada neste escopo. Próxima etapa não iniciada.

**RESULTADO: PASS.**

**ETAPA 08D.3 CONCLUÍDA — COMUNICAÇÃO CONTÍNUA IMPLEMENTADA COM DEZ SITUAÇÕES, EXPRESSÕES SOCIAIS OPCIONAIS, ÁUDIO FIEL À CONSTRUÇÃO E LEGADO PRESERVADO.**
