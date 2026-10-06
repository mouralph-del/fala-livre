# Layout dinâmico selecionado

Complemento visual da identidade da Etapa 12.2, sem alteração dos tokens, paleta, fonte ou logo. Camada src/dynamicLayout.css com seletores restritos às áreas afetadas; App importa essa camada e contém a camada de ornamentos não interativos.

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

Nome acessível único: “Fala Livre — Comunicar, Aprender e Conectar”. A marca continua não clicável, como antes; navegação e foco dos links permanecem iguais. Pendência de favicon resolvida: index.html usa src/assets/illustrations/fala-livre-icon.png, símbolo compacto aprovado, renomeado sem alterar os bytes. Vite inclui o PNG no build. Sem referência ativa ao favicon antigo; logo horizontal, header e layout permanecem inalterados.

Regressões direcionadas de header/Home e navegação passaram nas oito larguras, Normal/Grande, zoom 125% e Reduzir movimentos. Logo único, proporção, contenção no header, ausência de sobreposição com controles e alvos 48/56 px verificados no navegador. Lint, build e diff check aprovados.

## Camada final de fundos e decorações aprovada

Aplicada sobre `main` / `456c410` (`Prepare repository for GitHub`), preservando README e `.gitignore`. A referência `reference/home-referencia.png` orientou somente o acabamento: suas informações fictícias de pontos e conquistas não foram incorporadas.

- Home: curvas maiores em azul/verde pastel nas bordas, cards com gradientes suaves da paleta existente, sombra leve e áreas orgânicas atrás dos personagens. Ornamentos abstratos de livro, peça, balão e planta em CSS ficam na camada de fundo. A única mensagem positiva já existente foi preservada e recebeu uma superfície verde suave; não representa recompensa ou avaliação.
- Aprender: os mesmos quatro cards, ilustrações e textos, agora com superfícies diferenciadas azul/verde, detalhe orgânico no canto e profundidade suave.
- Jogar: acabamento dos seis cards de seleção, com superfícies suaves e sombra. Nenhuma alteração de geometria, decoração interna ou regra dos tabuleiros e seus 18 níveis.
- Atividades: cabeçalhos de Comunicar, Palavras e Frases, Escrever/Caderno, Meu Dia a Dia, Rotinas, Comunicação e Emoções com suporte suave. Áreas de seleção e pictogramas não foram substituídos por decoração.
- Cenas: moldura arredondada e fundo suave na apresentação já existente de Situações Interativas. `situacao-refeicao.png`, `situacao-brincar.png` e `situacao-descanso.png` mantêm os mesmos vínculos semânticos e `object-fit: contain`; nenhuma cena foi inserida em uma atividade diferente ou usada para substituir pictogramas.
- Configurações, Responsáveis e Meu Progresso: curvas periféricas compartilhadas, cabeçalhos/superfícies coerentes e cards discretos. Progresso continua exclusivamente descritivo.

### Acessibilidade e dispositivos

O contêiner de ornamentos tem `aria-hidden="true"`, não contém elementos focáveis e usa `pointer-events: none`. Os detalhes de cards são pseudo-elementos CSS sem conteúdo textual. Somente a camada decorativa é recortada, mantendo conteúdo e outlines fora desse recorte. Os quatro ornamentos ficam visíveis apenas na Home desktop; em até 700 px ficam ocultos, assim como os detalhes de canto dos cards. As curvas móveis têm opacidade reduzida.

Não há animações decorativas, parallax ou movimento contínuo. Hover/press altera apenas sombra/borda, e a preferência Reduzir movimentos e a preferência do sistema continuam desativando as transições. Logo, favicon, header, fonte e paleta são os mesmos.

### Validação desta camada

- `node qa/dynamicLayout.browser.mjs`: ampliado sem remover assertions anteriores; 15 telas afetadas nas oito larguras 320/360/390/430/768/1024/1366/1440, Normal/Grande e zoom CSS 100/125% (480 combinações). Verifica ornamentos ocultos/noninterativos, overflow, imagens, header, separação entre personagem/texto, alvos 48/56 px, teclado, foco e redução de movimentos. Também verifica as três cenas originais e produz capturas de cada contexto em 390/1440 px.
- `node qa/visualIdentity.browser.mjs`: contraste, foco, tamanho, redução de movimentos por preferência/sistema e smoke funcional — PASS.
- `node qa/communication.browser.mjs`: comunicação atual e legada, cenas/atividades, rotinas, áudio manual, navegação e persistência isolada — PASS. Captura versionada preservada.
- `node qa/corrections.browser.mjs`: escrita, atividades e jogos nas larguras previstas pelo script, Normal/Grande, teclado e redução de movimentos — PASS.
- `npm run lint`, `npm run build` e `git diff --check` — PASS.

Conferência visual direcionada das capturas de Home, Aprender, Jogar, atividades e cenas concluída. Capturas em `%TEMP%/falalivre-dynamic-review`; Chrome em perfil isolado. A ampliação do teste de cenas precisou corrigir o seletor de avanço e preencher as escolhas antes da confirmação; isso foi ajuste do harness, sem defeito ou alteração da lógica do produto.

Não foi repetida a suíte final completa, feita nova auditoria, atualizado `qa/final-frontend-validation.md`, gerada/baixada imagem, alterado backend ou configurado remoto. Conteúdo pedagógico, ARASAAC/créditos, personagens disponíveis, frases, áudio/vozes, rotas, progresso, rotação, limite diário e desbloqueios permanecem preservados.
