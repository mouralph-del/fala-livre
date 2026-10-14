# Refinamentos finais do MVP — 14/10/2026

Branch inicial: `main`. HEAD inicial: `c080ea32f3a701f7b45357bf646def385a74a422`.
O diretório de trabalho estava limpo. O HEAD final é o commit que contém este relatório; seu hash é informado na entrega.

## Comportamento implementado

- A referência existente de Escrever, Teclado e Caderno passou a ser compacta, com a mesma imagem de 64 × 64 px, `position: sticky` e afastamento superior que considera `safe-area-inset-top`. O cabeçalho atual não é fixo. Os ancestrais da atividade não têm overflow que impeça sticky; o overflow do desenho permanece restrito ao canvas. Margens de rolagem deixam controles acessíveis abaixo da referência.
- A primeira letra aceita marca a palavra como iniciada. A referência deixa de renderizar a resposta; instruções e nomes acessíveis também não repetem a resposta. Apagar e Limpar só modificam as letras. O botão de áudio existente permanece disponível, sem alteração do áudio.
- Ajuda começa com três utilizações por palavra e ciclo do Teclado. Só uma revelação válida reduz o contador. Após a revelação, a palavra permanece visível até o avanço, portanto normalmente são usadas apenas uma das três ajudas. O botão fica desabilitado quando a palavra está visível ou quando não há ajudas. Zero ajudas não impede Conferir ou concluir.
- `falaLivre_writingHints_v1` guarda `started`, `revealed` e `remaining`, identificados por modo, palavra e ciclo. Refresh, navegação e troca de modos não reinicializam a tentativa. Uma palavra de um novo ciclo tem sua própria tentativa. As rotas auxiliares usam o mesmo identificador de ciclo. Sem armazenamento disponível, há continuidade em memória, mas não garantia de persistência após refresh.
- As rotações existentes `writing` e `writingNotebook`, os desenhos durante a alternância e os registros pedagógicos foram preservados. O Caderno continua dependendo da confirmação explícita da prática.
- A seção de conta foi movida para o início do menu existente: Entrar e Criar conta ficam imediatamente visíveis no celular, mesmo quando o restante do menu precisa rolar. Com sessão demonstrativa aparecem nome do responsável e Sair. As rotas, fechamento do menu, Escape, foco e navegação desktop foram preservados.
- A celebração usa o resultado do gravador existente: somente conclusões aceitas que acrescentam evidência disparam o evento. Explorações, erros, montagem, refresh e registros repetidos não celebram. O aviso tem estrela dourada, texto positivo, anúncio acessível e botão Continuar, sem modal, som, flashes ou animações; por isso também respeita Reduzir movimentos.

## Regra das estrelas e compatibilidade

As estrelas são uma consulta aos registros existentes, sem novo contador persistido:

| Área | Uma estrela corresponde a |
| --- | --- |
| Aprender | Uma palavra com `complete` em Palavras e Frases |
| Escrever | Um registro `typing` ou `notebook` por palavra, separadamente |
| Meu Dia a Dia | Uma rotina ou exercício educativo de comunicação com `complete` |
| Jogar | Um nível em `completedLevels` |

A marca combinada `complete` da escrita não gera uma terceira estrela. Explorações livres não geram estrelas. O total é a soma das quatro áreas. Os fatos do catálogo são únicos; atualizar a página ou repetir a mesma conclusão não aumenta o total. As estrelas não são notas e não há ranking.

O esquema `falaLivre_progress_v1` e as rotações não foram alterados: nenhuma migração ou regravação do histórico foi necessária. Evidências anteriores já válidas recebem a mesma representação visual. Registros disponíveis apenas na sessão continuam identificados pela mensagem existente. Dados ilegíveis permanecem preservados pelo armazenamento original.

## Arquivos

- `src/App.jsx`: integração da celebração.
- `src/components/CompletionCelebration.jsx` e `.css`: aviso acessível e estrela.
- `src/components/HeaderNavigation.jsx`: prioridade da conta no menu.
- `src/components/WritingPractice.jsx`: referência compacta, ocultação e Ajuda.
- `src/pages/EducationalKeyboard.jsx`: início persistente, Ajuda e proteção de conclusão repetida.
- `src/pages/Writing.jsx`: identificador do ciclo do Teclado.
- `src/pages/Writing.css`: sticky compacto e margens de rolagem.
- `src/pages/MyProgress.jsx` e `.css`: total e indicadores por área.
- `src/utils/writingHints.js`: armazenamento separado das ajudas.
- `src/utils/learningProgress.js`: celebração baseada em evidência real.
- `src/utils/progressSummary.js`: cálculo derivado das estrelas.
- `qa/writingHints.test.mjs` e `qa/finalRefinements.browser.mjs`: novos cenários de persistência, ajuda, estrelas, celebração e rolagem.
- `qa/writing.browser.mjs` e `qa/pwa.browser.mjs`: desenho testado em coordenadas visíveis abaixo da referência sticky, mantendo as verificações de pixels.
- `qa/plans.browser.mjs`: espera pelo carregamento do novo documento após reload, mantendo as verificações originais de preço e armazenamento.
- `qa/myProgress.browser.mjs`: expectativas de visitante Free atualizadas para o convite Premium existente, seis links de menu e seleção explícita do link visível no desktop/mobile.
- Este relatório.

## Validação

- `npm run lint`: aprovado.
- `node --test qa/*.test.mjs`: 67 testes aprovados, zero falhas.
- `node qa/finalRefinements.browser.mjs`: aprovado. Palavra inicial/oculta, Apagar, Limpar, refresh, navegação, modos, imagem, Ajuda persistida e repetida, nova palavra, zero ajudas sem impedir conclusão, celebração real sem repetição, Continuar, movimentos reduzidos, estrelas sem aumento após reload, menu e rolagem real.
- Larguras do teste dedicado: 320, 360, 375, 390, 430, 768, 1024 e 1366 px, Normal e Grande. Teclas no início e no fim do teclado permanecem alcançáveis abaixo da referência; sem rolagem horizontal.
- `node qa/writing.browser.mjs`: aprovado. Ciclos das 12 palavras por modo, independência, registros reais, desenho preservado, ferramentas, teclado, toque, foco e responsividade.
- `node qa/learningProgress.browser.mjs`: aprovado. Aprender, escrita, oito rotinas, dez exercícios, emoções, StrictMode, armazenamento temporário e regras de evidência.
- `node qa/gameProgress.browser.mjs`: aprovado. Seis jogos e 18 níveis, pré-requisitos, duplicidades, reload e falhas de persistência.
- `node qa/accountAccess.browser.mjs`: aprovado. Conta demonstrativa, sessão, refresh, sair, validação e preservação do armazenamento educativo.
- `node qa/headerNavigation.browser.mjs`: aprovado. Menu, mouse, toque, Tab, Enter, Escape, foco e responsividade.
- `node qa/myProgress.browser.mjs`: aprovado. Estados de leitura, histórico parcial/completo/temporário, duas abas, refresh, StrictMode, menu, rotas, foco e privacidade.
- `node qa/plans.browser.mjs`: aprovado. Preços, alternância, demonstração e armazenamento preservados.
- `node qa/pwa.browser.mjs`: aprovado. Build offline, service worker, critérios de instalação, rotas, seis jogos, desenho, atualização sem perda de dados e saída da conta.
- `npm run build`: aprovado; PWA gerou 121 entradas de precache. Permanece o aviso de bundle acima de 500 kB; não foi ocultado.
- `git diff --check`: aprovado.

Os primeiros comandos de build/testes foram bloqueados pelo sandbox com `spawn EPERM`; passaram ao executar com permissão. As primeiras verificações de desenho apontavam para uma região que fica atrás da referência durante a rolagem; os testes agora usam uma região visível do canvas e continuam exigindo traços reais. O teste de Planos tinha uma corrida de reload, corrigida esperando `Page.loadEventFired`.
O teste antigo de Meu Progresso pressupunha jogos liberados para visitantes, cinco links no menu e o primeiro link como destino de progresso. Essas expectativas foram atualizadas às regras atuais, verificando explicitamente o convite Premium e o link visível; o teste completo passou sem usar a opção de pular a navegação.

## Limitações e entrega

Validação automatizada em Chrome headless no Windows, com emulação de dimensões e toque. Não houve teste em iPhone/Safari físico, Android/Chrome físico, VoiceOver ou TalkBack. A instalação nativa da PWA não está disponível nesta versão do protocolo headless (`PWA.install` ausente); manifest, service worker, critérios de instalação e uso offline foram verificados. Safe areas foram consideradas em CSS, mas precisam de conferência em aparelho físico.

Entrega local em um commit específico. Sem push e sem deploy. Nenhuma mudança de áudio, regras Free/Premium, pagamento real, backend, conteúdo pedagógico ou reconhecimento automático de desenho.
