# Planos

Gratuito: Comunicar, Escrever, Meu Progresso do conteúdo disponível e
configurações essenciais/acessibilidade, incluindo vozes do dispositivo.
Comunicar e Escrever são formas fundamentais de expressão, utilizáveis sem
assinatura. Acessibilidade essencial permanece gratuita.

Premium: tudo do Gratuito, Palavras e Frases, Meu Dia a Dia (Rotinas,
Comunicação, Emoções), seis jogos/18 níveis, acompanhamento desses conteúdos
e conteúdo Premium adicional conforme disponibilizado.

Preços de apresentação: R$ 16,90/mês ou R$ 149,90/ano. O anual equivale a
aproximadamente R$ 12,49/mês e economiza R$ 52,90 frente a 12 mensalidades.
O seletor não cria contratação. Escolher Premium apenas anuncia indisponibilidade.

`src/services/planAccess.js` centraliza a consulta `getCurrentPlan()` e os
valores de apresentação. Retorna `free` para visitantes e `premium-demo` para a
sessão demo válida de `accountAccess.js`; logout retorna imediatamente a `free`.
Não há setter Premium, persistência de plano, associação ao progresso,
pagamento, API ou validação de assinatura. O backend futuro deverá substituir
essa fonte pela assinatura validada, sem presumir endpoints/schema aqui.

Regras de acesso atuais: Comunicar, Escrever, Home, Aprender, Meu Progresso,
Configurações essenciais e páginas de conta/informação permanecem gratuitas.
Palavras e Frases, Meu Dia a Dia/subrotas e Jogar/jogos (incluindo rotas legadas)
são Premium. No plano free, cards Premium abrem um diálogo explicativo; URLs diretas mostram
um estado amigável sem montar atividades. O diálogo permite fechar ou Ver planos.

`planAccess` centraliza metadados, classificação de rota e `canAccess`.
`createPlanAccess(planSource)` permite injeção de uma fonte Premium exclusivamente
em fixtures automatizadas; não existe override público, query, controle secreto
ou armazenamento separado de plano. A única exceção local é a sessão demo
existente, identificada como acesso de demonstração, sem contratação ou cobrança.

A proteção é somente UX/frontend e não é autorização segura. O backend futuro
será a fonte de verdade e deverá validar recursos/dados/API Premium. Plano e
progresso permanecem independentes: nenhum histórico existente é apagado.
Acessibilidade essencial permanece gratuita. Progressão N1/N2/N3 e limite diário
não mudam; o rastreador apenas deixa de contar rotas de jogos não autorizadas,
pois nelas nenhum jogo é montado. Com Premium, o limite/progressão existentes
continuam funcionando normalmente, sem liberação automática de níveis.
