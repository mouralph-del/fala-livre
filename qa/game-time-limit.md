# Limite diário de jogos

Frontend local do MVP: Configurações oferece Sem limite (padrão), 15, 30, 45, 60 minutos e Personalizado. A duração personalizada aceita minutos inteiros de 1 a 1440; entradas inválidas mantêm o último limite válido, com mensagem acessível. Não há agendamento por horário.

## Contagem e disponibilidade

Um único rastreador no App acumula intervalos nas rotas públicas de Jogar quando document.visibilityState é visible. Home, Aprender (incluindo rotinas educativas), progresso, Configurações, Responsáveis, aba oculta e ausência por pagehide não consomem tempo. Re-renderizações não criam contadores adicionais. O consumo continua sendo medido em Sem limite, permitindo considerar o uso anterior ao ativar uma restrição no mesmo dia.

Ao atingir o limite, o jogo é desmontado e substituído pela mensagem “O tempo de jogos de hoje terminou. Você ainda pode usar a área Aprender.” e ação Ir para Aprender. A mesma verificação protege as entradas diretas por hash de todos os jogos. Aprender, progresso, Configurações e Responsáveis continuam disponíveis. Aumento, redução e Sem limite são aplicados imediatamente ao consumo existente; desbloqueios educativos não mudam.

## Persistência e reinício

- falalivre.preferences: gameTimeLimit (unlimited, 15, 30, 45, 60 ou custom) e customGameMinutes, junto das preferências existentes.
- falaLivre_gameTime_v1: somente { day, consumedMs }. Data de calendário local, sem identificação de jogos, tentativas, erros ou desempenho.
- Nenhum acesso de escrita a falaLivre_progress_v1 ou falaLivre_contentRotation_v1 pelo rastreador.

Novo dia local inicia consumo zero, preservando o limite. Funciona também ao reabrir o navegador; intervalos que cruzam meia-noite consideram apenas a parcela pertencente ao novo dia. Restaurar configurações retorna Sem limite e duração personalizada padrão de 20 minutos, preservando o consumo daquele dia e os registros educativos. Ativar novamente um limite considera esse consumo preservado.

## Limitações reais

Configuração local de interface, sem autenticação, backend, controle remoto ou sincronização entre dispositivos. Pode ser alterada nas Configurações ou pelos dados do navegador. Usa o relógio local; alterações do relógio/dados podem modificar a restrição. Não agrega de forma transacional sessões de jogo simultâneas em várias abas. Se localStorage estiver indisponível, o consumo permanece somente na sessão. A verificação periódica tem resolução aproximada de 250 ms, sujeita ao agendamento do navegador. Não é uma barreira de segurança.

## Validação direcionada

- node qa/gameTime.test.mjs: relógio controlado, opções, persistência, rotas, visibilidade, saída, repetição sem duplicação, limite, aumento/redução, Sem limite/restauração, meia-noite, ausência por pagehide e isolamento de progresso/rotação.
- node qa/gameTime.browser.mjs: controles reais, personalizado válido/inválido, acesso direto com consumo esgotado, Aprender, refresh, novo dia, quatro combinações de personagens, Grande e Reduzir movimentos; 15 capturas de Configurações, Jogar, tempo encerrado, Aprender e Responsáveis em 390, 768 e 1440 px.
- node qa/responsibleGuidance.browser.mjs: regressão diretamente relacionada de preferências, quatro combinações e prévias/Home, voz/exemplo, restauração, teclado/foco e orientação. Expectativas atualizadas somente para as novas preferências e a seção de orientação.
- npm run lint; npm run build; git diff --check.

Testes aprovados. Capturas revisadas somente nas telas afetadas; sem auditoria geral. Voz validada com mock de síntese; não foi realizada escuta física.
