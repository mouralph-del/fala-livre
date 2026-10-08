# Limpeza segura do frontend — Etapa 7

Base: `main`, `706832e` (`Add academic Premium payment demonstration`).
As alterações anteriores em `src/homeReference.css` e
`qa/desktopComposition.browser.mjs` foram preservadas, conferidas por SHA-256
e excluídas do commit desta etapa.

## Arquivos removidos

| Arquivo | Função anterior | Bytes |
| --- | --- | ---: |
| `src/assets/memory/memoria-conjunto.png` | Prancha ilustrada dos primeiros pares de memória | 1.868.658 |
| `src/assets/scenes/jogo-encontre-caminho.png` | Composição antiga de uma tela do jogo Caminho | 2.168.652 |
| `src/assets/scenes/jogo-quebra-cabeca.png` | Composição antiga de uma tela de quebra-cabeça | 2.072.366 |
| `src/assets/where-belongs/onde-pertence-conjunto.png` | Prancha antiga com objetos e destinos | 1.471.198 |

Total: quatro PNGs, 7.580.874 bytes (7,23 MiB). Foram visualmente inspecionados.
Nenhum possuía referência nos arquivos versionados de código, dados, CSS,
HTML, configuração, testes ou documentação. Foram conferidos os imports,
consumidores indiretos, construção de URLs e a configuração do PWA.
Também estavam ausentes do grafo de módulos, dos assets emitidos e do precache
do build anterior: sua exclusão reduz o checkout, não o download do PWA.
Os jogos continuam usando suas imagens individuais e componentes interativos.

## Código removido

- CSS de `brand-mark`, `brand-copy`, `brand-name` e `profile-button`: resíduos
  do logo montado com texto e dos antigos botões do header. O header atual
  usa `brand-logo` e `HeaderNavigation`. A referência no teste de layout
  verifica justamente a ausência desses elementos antigos.
- CSS de `entry-character`: personagens genéricos dos títulos já removidos
  da interface. Foram excluídas apenas suas regras e overrides, preservando
  as regras de layout efetivamente utilizadas.
- CSS de `plan-status`: painel antigo sem consumidor no fluxo atual de Planos.
- Três variantes sem chamada do componente local `Icon` em `App.jsx`:
  `points`, `award` e `profile`. Permanecem `activities` e `growth`.

Três harnesses antigos (`coreLearning.browser.mjs`, `routines.browser.mjs`
e `publicQa.browser.mjs`) receberam a sessão demo na preparação isolada,
para verificar atividades Premium usando a regra atual. O teste de acento
passou a selecionar deterministicamente ÁGUA: os auxílios de acento agora
dependem da palavra praticada. A busca de textos técnicos preserva os avisos
legítimos de demonstração/MVP, mantendo a verificação de QA/debug/fixtures.
O teste de rotas públicas também reconhece os cenários atuais
`HomeLandscape`/`LearningLandscape`/`CareLandscape`, sem exigir o SVG legado.

Não foram removidos componentes, serviços, rotas, testes ou dependências.
Não foram alteradas regras, imagens utilizadas, dimensões efetivas ou contratos.

## Arquivos preservados

- PNGs ARASAAC `pendurar-mochila.png` e `pendurar-mochila-cadeira.png`:
  conteúdo idêntico, mas referências e créditos distintos. O build já
  compartilha o asset emitido; unificar nomes não traria ganho de download.
- `crianca-tabuleiro.png`: atribuição existente em `CREDITS.md`; preservado
  mesmo sem inclusão no grafo do build atual.
- `src/data/learningThemes.js`: catálogo temático sem import de produção
  identificado. Mantido por cautela com a organização pedagógica e possível
  reutilização; não faz parte do bundle.
- `public/favicon.svg`: arquivo antigo explicitamente excluído do precache.
  Mantida essa configuração nesta etapa, sem alterar a política do PWA.
  O favicon ativo continua sendo o PNG oficial.
- Jogos legados, fallback `GamePlaceholder`, cenários compartilhados,
  estilos de estados dinâmicos e documentação histórica: referências,
  rotas acessíveis, evidência histórica ou segurança insuficiente para exclusão.
- Dependências de React, QR Code, decodificação do QR em QA, Vite/PWA,
  lint e tipos: utilizadas em runtime, build, testes ou ferramentas.

## Otimização

Build de produção antes/depois com a mesma configuração, dependências e
compressão gzip do Node. As duas alterações anteriores da Home estão
presentes em ambos os builds.

| Saída | Antes (bytes) | Depois (bytes) | Antes gzip | Depois gzip |
| --- | ---: | ---: | ---: | ---: |
| JavaScript principal | 532.940 | 532.475 | 160.728 | 160.553 |
| CSS principal | 218.348 | 216.908 | 35.168 | 34.926 |
| Workbox window | 5.653 | 5.653 | 2.199 | 2.199 |

Precache: 121 entradas; 40.406,93 → 40.405,07 KiB.
Nenhuma referência quebrada foi introduzida pela exclusão dos PNGs.

O aviso de chunk acima de 500 kB permanece. O grafo de produção concentra
React/ReactDOM, as atividades e jogos importados pelas rotas, os serviços e
o gerador de QR Code. ReactDOM é o maior módulo antes da minificação;
os comprimentos dos módulos não equivalem diretamente aos bytes do chunk
minificado. Não foi elevado o limite do aviso nem adicionada divisão por
rota: a redução comprovada foi priorizada, preservando carregamento e offline.

## Testes

- Todos os 16 arquivos `qa/*.test.mjs`: PASS, incluindo ARASAAC, contas,
  comunicação, rotinas, emoções, voz, planos, progresso e os seis jogos.
- `node qa/desktopComposition.browser.mjs`: PASS; Home/header/Aprender,
  quatro combinações de personagens, oito larguras, Normal/Grande,
  zoom 125%/200%, teclado, menu e persistência. Arquivo executado sem alteração.
- `node qa/learningScenes.browser.mjs`: PASS; atividades e emoções,
  oito larguras, foco, cenário contínuo, decoração não interativa.
- `node qa/writing.browser.mjs`: PASS; 12 palavras, acentos, mouse/toque/caneta,
  ferramentas, paleta, desfazer/limpar, resize, oito larguras Normal/Grande.
- `node qa/gameProgress.browser.mjs`: PASS; seis componentes reais e 18 níveis,
  conclusão, bloqueios, progressão, reinício, persistência, 18 reloads,
  fallback de armazenamento, teclado e redução de movimento.
- `node qa/responsibleGuidance.browser.mjs`: PASS; preferências, quatro
  combinações, refresh/duas abas/restauração, créditos e sete larguras.
- `node qa/accountAccess.browser.mjs`: PASS; validação, login demo, logout,
  refresh, cadastro indisponível, senhas não persistidas e responsividade.
- `node qa/paymentDemo.browser.mjs`: PASS; preços, QR decodificado de forma
  independente, rota informativa, simulação, cancelamento, Free/Premium,
  refresh/logout e isolamento de progresso/preferências.
- `node qa/installation.browser.mjs`: PASS; três dispositivos, evento de
  instalação, cancelamento/aceite, iOS manual, fixture standalone e foco.
- `node qa/gameTime.browser.mjs`: PASS; opções, personalizado/validação,
  seis jogos, contagem/bloqueio, refresh, restauração e reinício diário.
- `node qa/pwa.browser.mjs`: PASS no build de produção; manifest/ícones,
  critérios de instalabilidade do Chrome, rotas Free/demo e seis jogos offline,
  tempo personalizado salvo, instalação manual offline, desenho,
  atualização controlada e preservação de dados, logout e responsividade.
- `node qa/myProgress.browser.mjs --records-only`: PASS; estados de leitura,
  registros parciais/concluídos/sessão, teclado, duas abas e refresh.
- `node qa/coreLearning.browser.mjs`: PASS após atualização da preparação;
  comunicação, 12 fluxos de palavras, registro/fala, acentos, toque/teclado,
  sete larguras Normal/Grande, zoom e movimento reduzido.
- `node qa/routines.browser.mjs --routines-only`: PASS; oito rotinas,
  ordenação, ajuda, seleção mouse/toque/teclado, refresh e sete larguras.
- `node qa/publicQa.browser.mjs`: PASS após atualizar expectativas antigas;
  27 rotas públicas/legadas e 18 níveis em desenvolvimento e produção,
  ausência de controles técnicos, sete larguras Normal/Grande e zoom 125%.
- `npm run lint`, `npm run build` e `git diff --check`: PASS. O único aviso
  material de build é o tamanho do chunk principal, explicado acima.

Foram inspecionadas capturas de Home desktop, Aprender mobile e pagamento
mobile. As capturas adicionais dos harnesses ficam no diretório temporário,
fora do repositório. Os testes não alteram o armazenamento do navegador do
usuário. Antes da atualização, os harnesses antigos falharam por ausência de
sessão demo, expectativa de acentos sempre disponíveis e seletor do cenário
anterior; esses casos foram corrigidos somente nos testes e passaram no rerun.

Limitações: instalação nativa/uma janela instalada real não estão disponíveis
no Chrome headless. Standalone usa fixture; não equivale a teste físico em
Android/iPhone. Voz usa mocks nos testes e não certifica motores dos aparelhos.

## Pendências

- Revisão opcional do catálogo `learningThemes.js` e do favicon legado antes
  de qualquer futura exclusão; ambos foram preservados nesta etapa.
- O aviso de bundle permanece documentado. Uma futura divisão por rota
  exige validação específica do primeiro carregamento e do precache offline.
- Instalação nativa em Android/iOS e aparência física nos dispositivos
  dependem de conferência manual; os testes usam Chrome automatizado.
