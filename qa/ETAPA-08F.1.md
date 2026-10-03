# Fala Livre — Etapa 08F.1

Data: 2026-10-03. Resultado: PASS. Correção pontual, regressão e commits exclusivamente locais.

**A. Git inicial.** main, HEAD 59f5ee7081f5afbd716a492fe4507e3f4f29fe4f, árvore limpa. Últimos cinco: 59f5ee7, be1a9df, c40b15c, 1b3f5cc, 39a6a8c. Sem alterações preexistentes sobrescritas.

**B. Causa de 08F-01.** N3: BRINCAR ocupa índices 56,49,42,35,28,21,14. PASSEAR estava em 32..38; seu S sobrescrevia o N de BRINCAR no índice 35. createLevel escreve as palavras em ordem, sem detectar conflitos. O motor compara as letras reais selecionadas, portanto BRISCAR não era reconhecida. Inspecionadas todas as palavras, coordenadas e direções dos três níveis.

**C. Correção da grade.** PASSEAR começa agora em [1,0], horizontal, índices 8..14. Seu R final coincide com o R final de BRINCAR em 14. Mantidas as quatro palavras, grade 8x8, diagonal de BRINCAR e regras existentes. N1 intacto. O novo teste obrigatório de limites revelou também CAMA no N2 terminando na linha 6, fora da grade de seis linhas; o navegador a aceitava porque o vetor JavaScript era estendido além da grade declarada. Ajuste tecnicamente necessário à mesma validação: início [1,2], direção vertical preservada, índices 8,14,20,26; cruza BOLA na letra A. Nenhuma palavra removida, texto alterado ou regra simplificada.

**D. Todas as palavras.** node qa/corrections.test.mjs PASS: CASA, ÁGUA; GATO, BOLA, CAMA; COMER, DORMIR, BRINCAR, PASSEAR. Teste permanente valida limites em linha/coluna, coordenadas, direção permitida, número de células, conflitos em cruzamentos, letras finais da grade, extensão da seleção e reconhecimento pelo motor real. O teste inicialmente falhou em CAMA e passou após o ajuste.

**E. N3 no navegador.** node qa/corrections.browser.mjs PASS. Todos os três níveis resolvidos por seleção das células, conclusão reconhecida, ajuda e reinício exercitados. N3 também resolvido por Enter em cada uma das sete larguras, nos tamanhos normal e grande. Sem erros de execução da aplicação capturados pelo CDP.

**F. Causa de 08F-02.** swapCards alterava a ordem dos cartões sem chamar stopSpeaking. O mecanismo oficial já cancela a síntese e limpa a referência da fala atual.

**G. Correção do cancelamento.** stopSpeaking chamado após validar a origem e antes da troca. Retorno antecipado para atividade concluída, destino inexistente e origem igual ao destino. Selecionar um cartão e recolocá-lo no mesmo lugar não cancelam fala. Nenhuma nova fala automática, mudança de preferência de voz ou alteração de textos/dependências. speech.js não foi modificado.

**H. Áudio.** Teste permanente instrumenta speechSynthesis: ouvir gera uma fala; trocar cartões aumenta o contador de cancelamentos sem gerar outra fala. Seleção e mesma posição preservam o contador. Ajuda, nova tentativa, avanço de rotina, saída da página e reinício legado foram exercitados na regressão. Verificada a chamada de cancelamento nas transições Rotinas → Comunicação → Emoções → Comunicar → Início. Preferência de voz permanece no storage; testes existentes de Comunicação e Emoções verificam pt-BR e voz simulada. Não se alega escuta física.

**I. Rotinas.** node qa/routines.test.mjs PASS: oito atividades, todas as ordens válidas (1,1,1,2,6,1,2,6), 1.000 embaralhamentos inválidos por atividade, ciclos/storage/legado. Cópia temporária de routines.browser.mjs passou ajuda, tentativa, áudio explícito, Escape, arrastar, toque emulado, teclado/foco, atualização, retorno, avanço duplo, dois ciclos e oito atividades nas sete larguras. As nove atividades antigas de Sequências passaram nos três níveis.

**J. Demais módulos.** Regressão pós-build: Comunicação, dez situações/vinte construções, dois ciclos; Comunicar, quatro conjuntos; Emoções, seis conceitos/dois ciclos, oito frases pessoais, duas necessidades e variantes; Palavras e Frases, doze palavras com montagem/frase/áudio; Escrever, doze palavras com teclado, caderno, desfazer, limpar e avanço. Inicializados sete estados válidos de rotação: avançar cada módulo de Meu Dia a Dia altera somente o próprio estado; atualização preserva todos; expressão pessoal de Emoções não altera rotações. Seis jogos, todos os 18 níveis concluídos. Legado: doze Situações Interativas, nove Situações do Dia a Dia, Sequências e Bingo (ajuda, linha vencedora, reinício) passaram. Menus preservados: Aprender 4, Meu Dia a Dia 3, Jogar 6. Sem sistema de progresso novo.

**K. Responsividade e acessibilidade.** Nenhum CSS ou layout alterado. Novo teste: Caça-palavras e Rotinas em 320,360,390,430,768,1024,1366 px; preferências reais normal/large e reduceMotion=true, carregadas após refresh; ausência de overflow horizontal. N3 concluído por teclado em cada combinação. Tab/Shift+Tab verificados em Emoções; Enter/Espaço/Escape, foco e alternativas sem arrastar exercitados nas suítes existentes. Rotinas: oito atividades nas sete larguras; Comunicação/Emoções: sete larguras normal/grande. Redução de movimento verificada pelo atributo aplicado e execução funcional, sem medição de todos os tempos de animação. Não equivale a certificação WCAG.

**L. Qualidade.** npm run lint PASS; npm run build PASS (185 módulos); node qa/corrections.test.mjs PASS; node qa/corrections.browser.mjs PASS; node qa/routines.test.mjs PASS; node qa/emotions.test.mjs PASS (inclui communication.test.mjs); cópias temporárias de communication.browser.mjs, emotions.browser.mjs e routines.browser.mjs PASS; regressão temporária completa de Palavras e Frases/Escrever PASS; git diff --check PASS. Build inicialmente impedido por spawn EPERM no sandbox, repetido com autorização e concluído. Nenhuma dependência instalada.

**M. Limitações.** Windows, Node 24.18.0, npm 11.16.0, Chrome 154.0.8037.93 headless, perfis isolados. Navegador automatizado; toque/tamanhos emulados; inspeção estática complementar. Sem teste físico, leitor de tela, outros navegadores ou avaliação sonora real. As cópias temporárias redirecionam capturas para TEMP. Rotinas exclui da cópia somente o bloco obsoleto que esperava Comunicação/Emoções inativos; o novo teste permanente valida os módulos ativos e sua independência. Scripts/capturas anteriores e desta etapa em %TEMP%/falalivre-08f-3Ed7e5; dist regenerado e ignorado. Storage do usuário preservado.

**N. Arquivos alterados.** src/data/wordSearchLevels.js; src/pages/SequenceGame.jsx; qa/corrections.test.mjs; qa/corrections.browser.mjs; este relatório. Motor/storage de rotação, assets, backend e textos pedagógicos preservados.

**O. Commits locais.** f63ad2b — Fix word search N3 and routines speech cancellation. Relatório em commit separado, Document integrated QA corrections; hash informado na entrega e consultável em git log.

**P. Git final.** main; commits locais de correção e documentação. Conferência final de status/diff realizada após o commit do relatório, com árvore limpa, informada na entrega.

**Q. Limites da execução.** Sem push, deploy ou início da Etapa 09. Nenhum comando destrutivo. Aguarda revisão do usuário.

RESULTADO: PASS.

ETAPA 08F.1 CONCLUÍDA — CAÇA-PALAVRAS N3 CORRIGIDO, ÁUDIO DE ROTINAS AJUSTADO E REGRESSÃO VALIDADA.
