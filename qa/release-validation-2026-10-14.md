# Limpeza conservadora e validação de publicação — 14/10/2026

## Base e escopo

Branch: `main`. HEAD inicial: `7abfe064ee3ef0f0c83a719fdfaa1229ac769e58`.
Árvore de trabalho inicialmente limpa. Após `git fetch origin`, `main` estava um commit à frente e zero atrás de `origin/main`, cujo HEAD era `c080ea32f3a701f7b45357bf646def385a74a422`.

Revisados `src` (componentes, páginas, hooks, utilitários, serviços, dados, CSS e assets), `public`, configurações Vite/ESLint/PWA, dependências, scripts e documentação de `qa`. Não houve reset, restore, clean, amend, remoção de histórico ou force push.

## Resultado da limpeza

| Categoria | Resultado |
| --- | --- |
| Arquivos removidos | Nenhum |
| Código de produção eliminado/modificado | Nenhum |
| CSS eliminado/modificado | Nenhum |
| Imagens ou ícones removidos | Nenhum |
| Dependências alteradas | Nenhuma |
| Testes modificados | `qa/communication.browser.mjs`, `qa/emotions.browser.mjs` |
| Documentação adicionada | Este relatório |

O grafo de imports diretos mantém consumidores para os componentes de produção. `learningThemes.js` não entra no bundle, mas permanece como catálogo pedagógico documentado; não houve exclusão apenas por ausência de import. Os assets possuem referências no código, testes ou créditos. O fallback `GamePlaceholder`, jogos legados, imagens ARASAAC, imagens dos jogos, ícones PWA, favicon legado excluído do precache e documentação acadêmica foram preservados. Classes e estados condicionais não foram tratados como CSS órfão. Não foi encontrada exclusão adicional suficientemente segura para justificar mudanças no frontend aprovado.

Listeners de componentes possuem seus mecanismos existentes de limpeza; listeners compartilhados de serviços mantêm seus ciclos próprios de assinatura/disposição. React, QRCode, `jsqr` (decodificação independente em QA), ferramentas Vite/ESLint/PWA e tipos permanecem utilizados ou necessários à cadeia de ferramentas.

### Justificativa das alterações em QA

- Comunicação e Emoções eram testes anteriores às restrições Free/Premium e abriam conteúdo Premium sem sessão. A preparação agora cria a mesma sessão demonstrativa isolada já usada em outros testes, antes do carregamento da aplicação. Não houve alteração de permissões na aplicação, nem remoção de asserts.
- No cenário de armazenamento indisponível de Emoções, o armazenamento educativo e de preferências continua lançando erro; somente a chave da sessão demo é preservada para manter o pré-requisito de acesso. Isso permite testar a continuidade da atividade diante da falha de armazenamento, sem confundi-la com ausência de acesso Premium. Ausência/indisponibilidade de sessão segue coberta pelos testes de contas e planos.
- A screenshot de Emoções é gravada em diretório temporário, preservando `qa/emotions-390.png`, uma evidência acadêmica versionada.

O risco da limpeza fica restrito aos harnesses de QA; o código de produção e seu comportamento não foram alterados.

## Tamanho antes/depois

Mesmo ambiente, dependências e configuração de build; gzip medido com o padrão do Node.

| Artefato | Antes (bytes) | Depois (bytes) | Antes gzip | Depois gzip |
| --- | ---: | ---: | ---: | ---: |
| JS principal `index-sk103UWA.js` | 538.039 | 538.039 | 162.427 | 162.427 |
| CSS principal `index-PuQWsURZ.css` | 219.450 | 219.450 | 35.387 | 35.387 |
| Workbox window | 5.653 | 5.653 | 2.199 | 2.199 |

Permanece o aviso de chunk acima de 500 kB. Não foi ocultado nem motivou mudanças fora do escopo. O build PWA produz 121 entradas de precache, aproximadamente 40.413 kB.

## Validação aprovada antes do push

- `npm run lint`: aprovado.
- `node --test qa/*.test.mjs`: 67 testes, zero falhas, zero ignorados.
- `npm run build`: aprovado, com o aviso de tamanho descrito acima.
- `git diff --check`: aprovado.

17 execuções aprovadas de scripts de navegador:

1. `finalRefinements.browser.mjs`: sticky, ocultação, refresh, navegação, Ajuda, zero ajudas sem bloquear conclusão, estrelas, celebração e menu; 320/360/375/390/430/768/1024/1366 px, Normal/Grande.
2. `writing.browser.mjs`: progressões independentes, 12 palavras por modo, desenho, teclado/toque/foco e persistência.
3. `speechVoices.browser.mjs`: vozes, áudio manual, preferências e ausência de autoplay.
4. `gameTime.browser.mjs`: controles dos responsáveis, limites dos seis jogos e persistência.
5. `installation.browser.mjs`: orientações e eventos de instalação, iOS, teclado e estado standalone simulado.
6. `learningProgress.browser.mjs`: Aprender, Comunicar, Palavras e Frases, escrita, rotinas, comunicação educativa, emoções e StrictMode.
7. `gameProgress.browser.mjs`: seis jogos, todos os 18 níveis, pré-requisitos, duplicidade, falhas de gravação, 18 reloads reais e independência.
8. `myProgress.browser.mjs`: histórico parcial/completo/temporário, duas abas, leitura sem mutação, foco e rotas.
9. `communication.browser.mjs`: ciclos, ajuda, áudio, teclado, toque, frases, situações, rotinas e isolamento.
10. `routines.browser.mjs`: oito rotinas, ordens válidas/inválidas, ajuda e ciclos.
11. `emotions.browser.mjs`: frases, variantes, respostas parciais, foco, áudio e fallback de armazenamento.
12. `accountAccess.browser.mjs`: contas demonstrativas, login/logout, refresh e dados educativos preservados.
13. `headerNavigation.browser.mjs`: menu desktop/mobile, Enter/Escape/Tab e fechamento.
14. `plans.browser.mjs`: preços, alternância, demonstração e armazenamento preservado.
15. `paymentDemo.browser.mjs`: demonstração sem URL pública e sem QR local inacessível.
16. `paymentDemo.browser.mjs --public-url`: QR HTTPS decodificado independentemente por `jsqr`; não concede autorização ou pagamento real.
17. `pwa.browser.mjs`: manifest, ícones, service worker, critérios de instalação, rotas e jogos offline, desenho, atualização e armazenamento preservado.

### Falhas investigadas, sem supressão

A primeira execução simultânea dos jogos não carregou a fixture: uma dependência otimizada de React recebeu HTTP 504 durante a reotimização compartilhada do Vite. O teste terminou por timeout. A execução completa e isolada passou, incluindo seis jogos/18 níveis e reloads. Os testes restantes foram executados sequencialmente.

O teste antigo de Comunicação terminou por timeout ao abrir uma atividade Premium como visitante. Foi corrigido somente seu pré-requisito de sessão, conforme a revisão autorizada de testes obsoletos. O mesmo pré-requisito foi corrigido em Emoções; ambos os testes completos passaram. Nenhuma verificação foi excluída para obter aprovação.

## Publicação e limites

A publicação autorizada é um push normal para o remoto existente `https://github.com/mouralph-del/fala-livre.git`, após nova atualização de referências e confirmação de fast-forward. O commit de limpeza contém somente os dois testes e este relatório. O SHA final e os resultados reais de push/deploy são informados na entrega, sem referência circular ao próprio commit neste documento.

Antes da publicação, `https://fala-livre.vercel.app` respondeu HTTP 200; o GitHub informou deployment Vercel Production concluído para `c080ea3`, no projeto existente `beauty-studio/fala-livre`. O bundle público contém o domínio esperado `https://fala-livre.vercel.app`. O deployment automático do novo HEAD deve ser confirmado após o push, junto à URL pública, QR, manifest, service worker, ícones e rotas principais. Nenhum projeto ou configuração Vercel será criado ou alterado nesta etapa.

Validação local em Chrome headless no Windows, com dimensões e toque emulados. Não houve aparelho físico iPhone/Safari ou Android/Chrome, VoiceOver/TalkBack ou leitura de QR por câmera física. A instalação nativa da PWA não está exposta pelo protocolo headless disponível; critérios, eventos e uso offline foram testados. A variável de produção não foi editada nem inspecionada no painel privado; o domínio compilado e o destino real do QR podem ser conferidos publicamente.
