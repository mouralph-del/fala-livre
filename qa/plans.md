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
valores de apresentação. Retorna `free` para todos, incluindo a conta demo.
Não há setter Premium, persistência de plano, associação ao progresso,
pagamento, API ou validação de assinatura. O backend futuro deverá substituir
essa fonte pela assinatura validada, sem presumir endpoints/schema aqui.

Nenhuma atividade é bloqueada nesta etapa; Palavras e Frases, Meu Dia a Dia e
Jogos continuam acessíveis. Regras de acesso serão implementadas posteriormente.
