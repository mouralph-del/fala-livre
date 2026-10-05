# Fala Livre — Etapa 12.2

RESULTADO: ETAPA 12.2 APROVADA TECNICAMENTE — NOVA IDENTIDADE VISUAL DO FALA LIVRE APLICADA AO FRONTEND.

## A. Estado inicial do Git

Precheck executado antes das alterações: `main`, HEAD `87a6aec` (`Implement responsible guidance`), árvore limpa. Nenhum Git destrutivo utilizado.

## B. Arquivos criados

- `src/visualIdentity.css`: padrões compartilhados e ajustes visuais por contexto.
- `qa/visualIdentity.browser.mjs`: teste direcionado, reaproveitando o bootstrap CDP existente, com perfil temporário isolado.
- `qa/ETAPA-12.2.md`: este relatório.

## C. Arquivos modificados

- `src/index.css`, `src/App.css`, `src/App.jsx`.
- `src/components/GameProgressFeedback.css`.
- CSS de páginas: `BingoGame`, `Communication`, `DailySituations`, `FindImageGame`, `Games`, `InteractiveSituationsGame`, `Learn`, `MemoryGame`, `MyDay`, `MyDayEmotions`, `MyProgress`, `PathGame`, `Profile`, `PuzzleGame`, `ResponsibleGuidance`, `SequenceGame`, `WhereBelongsGame`, `WordSearchGame`, `WordsAndPhrases`, `Writing`.
- JSX de páginas: `EducationalKeyboard`, `FindImageGame`, `SequenceGame`, `WhereBelongsGame`, `WordsAndPhrases`, `Writing`.

## D. Tokens

Tokens globais para cores, superfícies, texto, borda, foco; radius 8/12/20 px; espaços 4/8/12/16/24/32 px; sombras leves de 5%/8%; alvos 48/56 px; larguras 1180/1000/760 px; escala tipográfica e transição de 150 ms. Peças, grades e cenas mantêm estilos próprios. Removidos apenas seletores antigos de progress-card/progress-icon sem consumidores.

## E. Paleta aplicada

Principal `#315F8C`, secundária `#397568`, destaque `#D8A148`, fundo `#F7F8F4`, card branco, texto `#243342`, auxiliar `#536273`, sucesso `#2E6B4F`, atenção `#8A5B16`, erro `#A53D43`, borda decorativa `#D8E1E6`, azul suave `#EDF3FA`, verde suave `#EEF5F1`, foco `#214E7A`.

Adicionados seleção `#DCE9F5` e borda funcional `#7A8C9E`. A borda decorativa clara não oferece 3:1; controles que precisam de contorno usam a borda funcional. Nenhum HEX aprovado foi substituído. Cores de cenas e ferramentas educativas foram preservadas.

## F. Tipografia

`'Segoe UI', system-ui, Arial, sans-serif`, sem fonte externa/dependência. Home 32–40 px, página 28–36 px, seção 22–24 px, cards conforme contexto, instruções 16 px e créditos 14 px. Line-height global 1.6. Letras educativas mantêm escala própria.

## G. Foco

Outline azul de 3 px, offset 3 px. Links, botões, summaries, campos e peças. Proxies existentes de foco em cards e opções de configuração mantidos: outline interno removido apenas quando substituído pelo contorno do card.

## H. Header

Marca e duas ações existentes preservadas; uma linha no desktop, reorganização no mobile; alvos 48 px. Rota atual com superfície azul e sublinhado discreto, mantendo aria-current.

## I. Home

Cards, ações e hierarquia unificados; personagens maiores que nos cabeçalhos internos, decoração atenuada. Duas colunas quando cabe, uma coluna abaixo de 360 px e com Grande no mobile. Meu Progresso permanece secundário.

## J. Aprender

Quatro cards compactos, mesmos contornos, radius e escala. Grade mobile preservada, adaptável com Grande; foco do card substitui o foco interno da ação.

## K. Comunicar

Frase em painel branco com borda azul superior; seleção e pictogramas com molduras claras. Ações separadas. Nenhuma frase, conjunto ou seleção alterado.

## L. Palavras e Frases

Etapas e imagem preservadas; Continuar/Conferir destacados com classe visual explícita. Feedback informativo azul, sem transformar tentativas em mensagens de sucesso.

## M. Escrever

Referência, ferramentas, teclado e caderno com superfícies e controles comuns. Conferir e conclusão destacados. Canvas, cores de desenho e eventos de pointer/touch/stylus intactos.

## N. Meu Dia a Dia

Três cards com tratamento comum, mantendo rotas e conteúdo.

## O. Rotinas

Posições, seleção, áudio e ações com contornos consistentes. Conferir/Próxima destacados. Ordenação e pictogramas preservados.

## P. Comunicação

Missão separada por acento verde discreto; montagem em painel próprio. Dez situações, frases e comportamento preservados.

## Q. Emoções

Superfícies brancas e seleção azul com peso equivalente. Nenhuma classificação de sentimentos ou armazenamento de escolhas pessoais introduzido.

## R. Jogar

Seis cards com acento verde comum, estados textuais e controles de nível consistentes. Jogos ocultos continuam ocultos.

## S. Encontre o Caminho

Missão, níveis, áudio e ações integrados à identidade. Geometria dos nós, conexões, cenas e movimento mantidos.

## T. Quebra-cabeça

Painel, ações e feedback unificados. Fragmentos e composição não recebem radius global; montagem preservada. Smoke de seleção, colocação, ajuda, conclusão e desbloqueio N2 passou.

## U. Caça-palavras

Fundo integrado ao produto, intro suave, grade legível com estilo próprio e palavras/áudio preservados. Regras de direção e continuidade intactas.

## V. Memória

Fundo e cabeçalho simplificados; personagens decorativos menores. Informação dos níveis e cartas mantida. Inspeção adicional em 320 px.

## W. Encontre a Imagem

Imagens protagonistas; contornos, ajuda e Próxima consistentes, sem alterar opções.

## X. Onde pertence?

Objeto e destinos distinguíveis; contornos e ações comuns, sem alterar associações ou arraste.

## Y. Meu Progresso

Visual descritivo e calmo, sem gráficos ou scores; details, registros, aviso de transição e escopo deste navegador intactos. Estados técnicos com atenção textual e borda âmbar.

## Z. Configurações

Seções consistentes, personagens indisponíveis preservados; restauração separada com contorno tracejado branco. Não foi criado apagamento de progresso.

## AA. Responsáveis

Coluna de leitura limitada a 760 px, seções e títulos consistentes. Texto, links e créditos preservados.

## AB. Pictogramas

Arquivos ARASAAC, conteúdo e créditos sem alteração. Sem filtro, recoloração, substituição ou geração de imagens.

## AC. Personagens

Todos os assets atuais mantidos; ajustes somente de tamanho/uso decorativo por CSS. Alternativas indisponíveis continuam indisponíveis.

## AD. Responsividade

Chrome headless real: smoke de 21 rotas em 390 px, verificando heading e imagens. Amostra nas larguras 320/360/390/430/768/1024/1366: Home, Aprender, Comunicar, Caça-palavras, Meu Progresso, Configurações, Responsáveis, em Normal/Grande e zoom CSS 100%/125%, inclusive combinados. Sem overflow horizontal nessa matriz. Inspeção de capturas dos hubs, seis atividades, seis jogos e três páginas informativas em 390 px; Home/Memória em 320 px; Home/header em 1366 px.

## AE. Grande

Preferência real testada pela regressão existente, incluindo atualização e persistência; matriz adicional em todos os tamanhos representativos. Cards da Home/Aprender adaptam colunas e controles usam alvos maiores.

## AF. Zoom

Zoom CSS 125% testado na matriz representativa. Não é uma afirmação de teste do zoom nativo de cada navegador nem de 200%.

## AG. Reduzir movimentos

Mecanismo atual preservado; duração computada das novas transições confirmada como 0s tanto com atributo da preferência quanto com media query do sistema emulada.

## AH. Teclado/foco

Tab, Shift+Tab, Enter e foco visível passaram na regressão existente de Configurações/Responsáveis. Space abriu summary na amostra de progresso. Não foi realizado teste com leitor de tela.

## AI. Contraste

Valores computados dos tokens e botão primário real em página renderizada; limites 4.5:1 para texto e 3:1 para foco/borda funcional:

| Combinação | Razão |
| --- | ---: |
| Texto / fundo geral | 12.10 |
| Texto / card branco | 12.91 |
| Auxiliar / fundo geral | 5.86 |
| Principal / azul suave (ação secundária) | 5.98 |
| Secundária / branco | 5.36 |
| Sucesso / verde suave | 5.69 |
| Atenção / branco | 5.85 |
| Erro / branco | 6.27 |
| Foco / fundo geral | 8.08 |
| Foco / azul suave | 7.72 |
| Borda funcional / branco | 3.46 |
| Borda funcional / azul suave | 3.10 |
| Texto branco / botão primário real | 6.67 |

Não usado âmbar claro como texto nem como foco. Borda decorativa não substitui contorno funcional. Não se trata de auditoria de cada pixel dos pictogramas/cenas.

## AJ. Regressões funcionais direcionadas

Navegação e rotas; seleção em Comunicar; invocação do áudio com speechSynthesis simulado; seleção/colocação/ajuda/conclusão do quebra-cabeça e desbloqueio; registros; summary; preferências reais, restauração isolada do progresso e rotação, refresh e duas abas pela suíte existente. Testes puros cobrem cadeias N1/N2/N3 dos seis jogos, session-only, isolamento e resumo. Nenhuma nova auditoria completa das etapas anteriores.

## AK. Console

Zero exceções, console errors e warnings nas duas regressões de navegador. Nenhuma imagem quebrada encontrada no smoke das 21 rotas.

## AL. Testes executados

- `node qa/visualIdentity.browser.mjs`: PASS.
- `node qa/responsibleGuidance.browser.mjs`: PASS.
- `node --test qa/gameProgress.test.mjs qa/learningProgress.test.mjs qa/progressSummary.test.mjs`: 29 testes PASS.
- Comparação automática do JSX com HEAD: removendo apenas import CSS e classes action-primary, conteúdo idêntico ao original.

Execuções que exigem subprocessos inicialmente esbarraram em EPERM do sandbox; passaram após execução autorizada. Um seletor de ajuda do teste novo foi ajustado para parar quando o puzzle já estava concluído; não houve correção de lógica do produto.

## AM. Lint/build/diff

`npm run lint`, `npm run build`, `git diff --check`: PASS. Build com 201 módulos. Avisos de normalização LF/CRLF do Git são informativos.

## AN. Mudanças de markup

Somente import de visualIdentity.css em App e classe action-primary em botões existentes: WordsAndPhrases (Continuar/Conferir), EducationalKeyboard (Conferir), Writing (concluir prática), SequenceGame (Conferir/Próxima), FindImageGame e WhereBelongsGame (Próxima). Nenhuma estrutura, texto, handler ou semântica alterada.

## AO. Lógica funcional

Nenhuma lógica funcional alterada. Comparação automática confirmou igualdade do JSX após retirar apenas as adições de styling. Utils, hooks, dados e armazenamento intactos.

## AP. Assets

Nenhuma imagem, logo, favicon, personagem, pictograma ou SVG novo/substituído. Nenhuma fonte externa, biblioteca ou download adicionado.

## AQ. Backend

Ausente: nenhuma API, banco, autenticação, sincronização ou alteração de servidor do produto.

## AR. Limitações

Validação em Chrome headless Windows; sem leitor de tela, dispositivo físico, áudio audível real, stylus físico ou matriz de outros navegadores. Zoom validado por CSS a 125%. Não repetidos todos os níveis de todos os jogos nem a auditoria funcional integral das etapas 09–11. Canvas e eventos intactos no diff, sem novo ensaio físico de desenho.

## AS. Pendências visuais futuras

Nenhuma pendência impeditiva na amostra validada. Eventuais logo/personagens novos dependem de decisão futura; não fazem parte desta etapa. Sem início da Etapa 13.

## AT. Estado final do Git

Entrega em `main`, um único commit local `Apply Fala Livre visual identity`, descendente de `87a6aec`. O SHA final e confirmação da árvore limpa constam na resposta de entrega (este relatório integra o próprio commit). Sem push e sem deploy.
