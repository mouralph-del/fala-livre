# Layout dinâmico selecionado

Complemento visual da identidade da Etapa 12.2, sem alteração dos tokens, paleta, fonte ou logo. Camada src/dynamicLayout.css com seletores restritos às áreas afetadas; App apenas importa essa camada.

## Telas e composição

- Home: personagens existentes integrados a superfícies curvas discretas dentro dos cards, fundos claros, cantos assimétricos e profundidade leve. Aprender/Jogar predominam; Meu Progresso fica em grupo secundário centralizado.
- Aprender: introdução agrupada em superfície suave; ilustrações existentes com suporte visual arredondado, títulos destacados, cards compactos e alinhamento consistente.
- Jogar: somente cards da seleção; ícone e título agrupados, descrição e ação em linhas próprias, ações alinhadas. Seis jogos e estado de tempo encerrado preservados.
- Configurações/Responsáveis: superfícies, títulos separados por linha discreta, sombras leves e grupos claros. Controles e conteúdo permanecem iguais.
- Comunicar: profundidade discreta na frase montada e gap consistente entre ações. Pictogramas e conteúdos não alterados.

## Responsividade

Home em duas colunas no desktop amplo; abaixo de 1051 px usa cards horizontais em uma coluna. Abaixo de 360 px, personagens acima do texto. Grande prioriza uma coluna. Aprender mantém duas colunas onde há espaço, com uma coluna abaixo de 360 px ou em Grande mobile. Jogar usa três colunas no desktop, duas no tablet e uma abaixo de 701 px; Grande limita a duas colunas no desktop. Header em linha quando há espaço; marca acima da navegação no mobile, duas ações apenas. Na menor largura, ações da navegação empilhadas, sem reduzir fontes/alvos.

## Acessibilidade e preservação

Sem animações novas, sem decoração interativa e sem recorte do conteúdo/foco. Alvos principais 48 px, 56 px em Grande; foco e navegação por teclado preservados. Reduzir movimentos continua removendo transições e rolagem suave. Testado zoom de 125%, com prioridade à legibilidade.

Sem mudanças funcionais: rotas, quatro áreas de Aprender, seis jogos, tabuleiros, níveis, desbloqueios, regras pedagógicas, fala, frases, validações, ARASAAC/créditos, progresso, rotação, limite diário e preferências existentes preservados. Sem imagens geradas/baixadas, troca de logo, alteração de backend ou tratamento dos seis assets pendentes. Sem limpeza geral nem auditoria.

## Validação direcionada

- node qa/dynamicLayout.browser.mjs: Home, Aprender, seleção de Jogar, Comunicar, Configurações e Responsáveis em 320/360/390/430/768/1024/1366/1440 px, Normal/Grande e zoom 125%; overflow, imagens, sobreposição, alvos, teclado, foco e Reduzir movimentos. Capturas em perfil Chrome temporário.
- node qa/gameTime.test.mjs e node qa/gameTime.browser.mjs: limite diário, persistência, acesso direto, disponibilidade de Aprender e isolamento de registros.
- node qa/responsibleGuidance.browser.mjs: personagens, voz/exemplo, preferências, restauração, navegação e orientação.
- node qa/communication.test.mjs: composição, fala e validação educativas.
- node qa/progress.test.mjs e node qa/progressStorage.test.mjs: catálogo, desbloqueios, isolamento e persistência de progresso.
- npm run lint; npm run build; git diff --check.

Testes aprovados e conferência visual direcionada concluída. Sem teste final geral do projeto.

## Logo oficial aprovado

Integrado src/assets/illustrations/fala-livre-logo.png no header compartilhado, substituindo o SVG antigo e os textos visuais adjacentes. PNG original renomeado com verificação SHA-256, sem recorte, conversão ou recompressão. Proporção 2043 × 770 preservada, width responsivo de até 340 px, height auto e object-fit contain. No tablet/mobile usa o mesmo arquivo e a navegação pode ficar abaixo; em largura mínima o logo se ajusta ao espaço disponível. Home tem somente a marca do header, preservando saudação, personagens e ações.

Nome acessível único: “Fala Livre — Comunicar, Aprender e Conectar”. A marca continua não clicável, como antes; navegação e foco dos links permanecem iguais. Favicon preservado: public/favicon.svg ainda representa os balões da marca anterior. Pendência visual explícita para etapa posterior, dependente de asset compacto aprovado; o PNG horizontal não foi recortado nem aplicado como favicon.

Regressões direcionadas de header/Home e navegação passaram nas oito larguras, Normal/Grande, zoom 125% e Reduzir movimentos. Logo único, proporção, contenção no header, ausência de sobreposição com controles e alvos 48/56 px verificados no navegador. Lint, build e diff check aprovados.
