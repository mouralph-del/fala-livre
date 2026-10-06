# Validação final do frontend — Fala Livre

Data: 6 de outubro de 2026. Resultado: **APROVADO COM RESSALVAS**.

O frontend funciona no escopo local aprovado do MVP. Não foi encontrado problema bloqueante reproduzível na execução descrita abaixo. As ressalvas são limitações conhecidas de escopo e de cobertura, não justificam implementar backend ou alterar decisões pedagógicas.

## Fechamento consolidado do estado atual

Precheck deste fechamento: `main`, HEAD `9664428` (`Resolve remaining visual asset issues`), árvore limpa, histórico esperado e ausência de remoto confirmados. Somente este relatório foi alterado no fechamento. As seções históricas abaixo mantêm os resultados iniciais; a evidência atual inclui os trabalhos posteriores.

| Etapa | Commit / base | Resultado |
| --- | --- | --- |
| Validação inicial | `82772de` — Complete final frontend validation | 29 execuções finais aprovadas, detalhadas na seção histórica |
| Preparação do repositório | `456c410` — Prepare repository for GitHub | README atualizado; `.env`/`.env.*` protegidos, exceção para `.env.example`; créditos preservados; verificação de arquivos/histórico sem possível segredo identificado; lint/build/diff check aprovados |
| Acabamento visual aprovado | `c9eb2fa` — Complete approved visual decorations | Fundos, ornamentos, cards e molduras; quatro scripts direcionados aprovados; evidência em `qa/dynamic-layout.md` |
| Apresentação de assets | `9664428` — Resolve remaining visual asset issues | Avisos neutros e correção semântica de Comida; sete scripts direcionados aprovados; evidência em `qa/frontend-pending-assets.md` |
| Regressão funcional histórica | Base `9664428`, sem novo commit | 21 scripts e duas verificações complementares aprovados; nenhum defeito funcional reproduzível; nenhuma alteração |
| Fechamento atual | Base `9664428` → Update final frontend validation | Atualização deste documento, com regressões das áreas alteradas após `82772de` |

### Visual e assets atuais

`c9eb2fa` aplicou curvas pastel, fundos suaves, ornamentos infantis discretos em CSS, personagens integrados e profundidade suave nos cards. Aprender conserva seus quatro cards; Jogar conserva seis jogos/18 níveis; demais páginas foram harmonizadas e as cenas receberam molduras suaves. Não foram reincorporados pontos ou conquistas dos mockups. Logo horizontal `fala-livre-logo.png`, favicon compacto `fala-livre-icon.png`, paleta, tipografia e header atuais permanecem aplicados e não foram alterados neste fechamento.

Decoração com `aria-hidden="true"`, sem controles focáveis e com `pointer-events: none`. Não interfere nas atividades nem recebe clique/toque. Não há parallax ou animação contínua; Reduzir movimentos e a preferência do sistema continuam removendo transições. Mobile reduz curvas e oculta ornamentos/detalhes quando necessário. Tabuleiros não receberam decoração interna.

`9664428` substituiu apenas a apresentação das seis lacunas conhecidas por **Sem imagem**: Molhar mãos, Enxaguar mãos, Colocar pijama, Chegar à escola, Se arrumar e Pote de materiais escolares. Sem `img` inválido, imagem quebrada ou alt enganoso; rótulos pedagógicos permanecem acessíveis. Nenhum asset foi improvisado, pesquisado ou baixado. Catálogos/metadados foram preservados, mas seus assets genéricos não são exibidos para esses IDs pendentes.

Comida, em Onde pertence? / N2, também mostra **Sem imagem**: não utiliza mais uma cena completa de café da manhã como objeto individual. Sua representação específica permanece pendente, mantendo a associação com geladeira. Os onze assets ARASAAC previamente aprovados, IDs e créditos foram preservados.

Refeição, brincadeira e descanso permanecem nos contextos narrativos existentes, separados dos pictogramas funcionais. Proporção, imagens inteiras e `object-fit: contain` preservados, com as molduras novas. Nenhuma cena foi inserida em outro contexto para preencher lacunas.

### Resultado da regressão funcional imediatamente anterior

Nenhum defeito funcional reproduzível após `9664428`. **BRINCAR** está correta na grade N3 do Caça-palavras; PASSEAR não a sobrescreve e o nível pode ser concluído. Diagonal é regra intencional do N3, confirmada expressamente pelo usuário na regressão; permanece bloqueada nos N1/N2. Saltos e zigue-zague são bloqueados. Não se tratou diagonal do N3 como bug nem se alterou a grade.

- Seis jogos × três níveis = **18 níveis**: Caminho, Quebra-cabeça, Caça-palavras, Memória, Encontre a Imagem e Onde Pertence? aprovados em interação, ajuda quando aplicável, conclusão, reinício, desbloqueios independentes e persistência. CASA, GATO e GATO + CACHORRO permanecem corretos; pistas não interceptam interação nem cobrem a imagem concluída.
- Comunicar: exploratório, seleção separada de fala, áudio manual, ouvir a composição atual, limpar e feedback correspondente. Palavras e Frases: 12 palavras em Conhecer/Montar/Usar na frase, com conclusão explícita e registro correspondente.
- Escrever: alfabeto, áudio manual por letra, apagar, limpar e limite da atividade aprovados. Canvas por mouse nativo, toque/caneta emulados via CDP, desfazer, limpar e preservação proporcional no resize aprovados. Sem teste físico de caneta, OCR, microfone, reconhecimento de voz ou avaliação automática.
- Meu Dia a Dia: oito Rotinas, dez exercícios de Comunicação e Emoções aprovados, com frases/áudio corretos e lacunas neutras. Escolhas pessoais de sentimentos/necessidades não são salvas como progresso.
- Configurações: quatro combinações de personagens, persistência/Home, voz automática/manual, exemplo, Normal/Grande, Reduzir movimentos, limite diário, Responsáveis e Restaurar aprovados. Qualidade/timbre/disponibilidade de vozes dependem do navegador/dispositivo.
- Limite diário: Sem limite, 15/30/45 minutos, 1 hora e Personalizado; preferência persistida, consumo somente em Jogar visível, esgotamento inclusive em rota direta, Aprender disponível, virada do dia com preferência preservada. Restaurar volta para Sem limite sem apagar consumo registrado. Recurso local, não controle parental seguro.
- Meu Progresso: registros, separação dos domínios, reload, atualização entre abas, fallback e persistência local, incluindo seis jogos/18 níveis. Sem pontos, XP, ranking, medalhas, troféus, streak, porcentagem geral, avaliação clínica ou comparação entre pessoas.
- **25 rotas atuais/legadas** verificadas: as 24 da validação inicial mais `#/aprender/situacoes`. Navegação normal, hash direto, reload, voltar/avançar e rota desconhecida passaram. Nenhuma rota legada foi removida.

Os 21 scripts anteriores foram: lógica — corrections, gameProgress, learningProgress, gameTime, progress, progressStorage, progressSummary, routines, communication, emotions e speechVoices (`.test.mjs`); navegador — corrections, gameProgress, learningProgress, gameTime, myProgress, responsibleGuidance, speechVoices, communication, routines e emotions (`.browser.mjs`). Todos aprovados, sem ignorados. As duas verificações complementares de rotas/canvas e toque/teclado do quebra-cabeça foram temporárias, sem novos arquivos versionados. Ajustes de sintaxe/eventos/assertions do harness não foram defeitos do produto. Logs em `%TEMP%/falalivre-historical-regression`.

### Responsividade e acessibilidade posteriores

A camada de `c9eb2fa` foi verificada em **320/360/390/430/768/1024/1366/1440 px**, Normal/Grande, zoom CSS 125% e Reduzir movimentos: 15 telas, 480 combinações. As apresentações neutras foram verificadas em 320/390/768/1366 px, Normal/Grande e zoom CSS 125%. Sem quebra de imagem, corte do aviso ou overflow nas verificações documentadas. Essas evidências complementam a matriz histórica inicial; não se afirma que suas 768 combinações foram repetidas após os commits visuais.

Teclado, foco visível, nomes acessíveis, contraste, alternativas textuais, Normal/Grande e redução de movimentos permaneceram aprovados. Decoração não participa da tabulação/interação e ausência de asset não cria descrição falsa. Não há certificação WCAG, teste físico mobile ou teste real com leitor de tela. Toque e caneta foram emulados no Chrome.

### Testes específicos deste fechamento

Somente as dez entradas relacionadas às alterações posteriores, sem repetir integralmente os 21 scripts anteriores:

| Comando | Resultado final |
| --- | --- |
| `node qa/arasaacPending.test.mjs` | PASS |
| `node qa/routines.test.mjs` | PASS |
| `node qa/communication.test.mjs` | PASS |
| `node qa/visualIdentity.browser.mjs` | PASS |
| `node qa/dynamicLayout.browser.mjs` | PASS |
| `node qa/arasaacPending.browser.mjs` | PASS |
| `node qa/routines.browser.mjs` | PASS |
| `node qa/communication.browser.mjs` | PASS |
| `node qa/corrections.browser.mjs` | PASS |
| `node qa/responsibleGuidance.browser.mjs` | PASS |

**Neste fechamento:** dez scripts executados/aprovados, zero falhas e zero ignorados. `npm run lint`, `npm run build` e `git diff --check` também passaram. Não existe teste automatizado específico deste relatório entre os scripts QA consultados. Logs em `%TEMP%/falalivre-final-closure`. Perfis isolados; capturas versionadas repostas aos bytes anteriores após os testes. Nenhuma assertion foi removida/enfraquecida nem defeito do produto ocultado.

## Evidência histórica da validação inicial — entrega 82772de

As seções seguintes preservam os resultados iniciais e sua base. Estado atual e correções posteriores estão consolidados acima.

## Base, escopo e alterações da validação inicial

- Precheck: `main`, HEAD inicial `19317ae` (`Apply approved Fala Livre favicon`), árvore limpa; histórico dos cinco commits mais recentes conferido.
- Escopo: frontend existente, rotas públicas e legadas, atividades, jogos, armazenamento local, configurações, áudio, identidade, responsividade e acessibilidade.
- Nenhuma correção funcional foi necessária. Nenhum arquivo de aplicação, asset, regra pedagógica ou teste existente foi alterado.
- Acrescentados este relatório e `qa/finalFrontend.browser.mjs`, para validar a entrada real do Vite, navegação, matriz responsiva, favicon e interações nativas do canvas.
- Capturas geradas pelos testes existentes foram preservadas: seus bytes anteriores foram repostos ao concluir a execução, sem incluir mudanças de screenshots no commit.
- Backend, autenticação, banco, novos assets, redesign, push e deploy ficaram fora da execução.

## Ambiente e método da validação inicial

Windows, Node.js, React 19, Vite 8 e Chrome headless via Chrome DevTools Protocol (CDP). Os testes de navegador usam perfis temporários isolados; não acessam o perfil ou o progresso pessoal do usuário. A maior parte dos testes controla a síntese de fala para verificar chamadas e parâmetros. Uma execução adicional usa as vozes reais disponíveis no Chrome.

Foram executados os 27 scripts QA existentes: 12 de lógica/estado e 15 de navegador. Todos passaram, sem exclusão, alteração ou enfraquecimento de assertions. O novo script complementar e a variante de vozes reais também passaram.

**Contagem final:** 28 arquivos de teste distintos, 29 execuções finais aprovadas, 0 falhas finais, 0 ignorados. Lint, build e diff check são verificações adicionais, fora dessa contagem. Durante a construção do teste complementar houve duas tentativas malsucedidas do próprio harness: espera insuficiente após reload e seletor que procurava “Limpar desenho” em vez do botão existente “Limpar”. Ambas foram corrigidas no novo teste; não eram defeitos do frontend.

### Scripts executados na validação inicial

Cada arquivo foi executado com `node qa/<arquivo>`; a duração abaixo corresponde aos testes de navegador na execução integral.

| Área / arquivo base | `.test.mjs` | `.browser.mjs` |
| --- | --- | --- |
| arasaacPending | PASS | PASS (15 s) |
| communication | PASS | PASS (31 s) |
| corrections | PASS | PASS (48 s) |
| emotions | PASS | PASS (16 s) |
| gameProgress | PASS | PASS (58 s) |
| gameTime | PASS | PASS (13 s) |
| learningProgress | PASS | PASS (25 s) |
| progress | PASS | PASS (2 s) |
| progressStorage | PASS | Não há script com esse nome |
| progressSummary | PASS | Não há script com esse nome |
| routines | PASS | PASS (21 s) |
| speechVoices | PASS | PASS (3 s) |
| dynamicLayout | Não há script com esse nome | PASS (17 s) |
| myProgress | Não há script com esse nome | PASS (18 s) |
| progressAudit | Não há script com esse nome | PASS (29 s) |
| responsibleGuidance | Não há script com esse nome | PASS (8 s) |
| visualIdentity | Não há script com esse nome | PASS (28 s) |

Execuções adicionais: `node qa/finalFrontend.browser.mjs` — PASS; `node qa/speechVoices.browser.mjs --real` — PASS.

Verificações finais: `npm run lint`, `npm run build` e `git diff --check` — PASS.

Logs individuais e `results.json` desta execução ficam em `%TEMP%/falalivre-final-validation`. As capturas complementares ficam no subdiretório `screenshots`; são evidências locais temporárias, não arquivos distribuídos no repositório. O relatório e os scripts versionados permitem reproduzir a verificação.

## Rotas, identidade e runtime — evidência inicial

O teste complementar abriu e recarregou diretamente as 24 rotas existentes: Home; Aprender; Comunicar; Palavras e Frases; Escrever, Teclado e Caderno; Meu Dia a Dia, Rotinas, Comunicação e Emoções; Jogar; Caminho, Quebra-cabeça, Caça-palavras, Memória, Encontre a Imagem e Onde Pertence; legadas Bingo, Sequências e Situações Interativas; Meu Progresso; Configurações; Responsáveis.

Histórico nativo voltar/avançar e hash inexistente foram testados. A rota desconhecida mostra Home, conforme o comportamento existente. Rotas legadas continuam acessíveis diretamente e não foram reinseridas na navegação pública. Os testes existentes verificam navegação por links e teclado.

`fala-livre-logo.png` permanece como marca completa do header; `fala-livre-icon.png` é o PNG quadrado do favicon. O teste da entrada real decodificou a imagem referenciada no `index.html`, verificou o favicon atual e a referência do logo. Não houve alteração dos arquivos ou deformação observada. Home, header e configurações foram conferidos nas capturas direcionadas.

Na navegação e matriz complementar não houve exceção JavaScript nem mensagem de erro/warning capturada pelo Runtime do Chrome; não houve imagens quebradas ou controles interativos sem nome nos elementos verificados. Isso documenta as sessões executadas, não garante ausência de qualquer erro em todo dispositivo ou condição possível.

## Funcionalidades e regras pedagógicas

| Área | Evidência e resultado |
| --- | --- |
| Comunicar | Conjuntos existentes, seleção, áudio individual, frase completa, limpar e avanço exploratório: PASS. Falas manuais; escolhas pessoais não são registradas como respostas avaliadas. |
| Palavras e Frases | 12 palavras, Conhecer/Montar/Usar na frase e momentos específicos de registro: PASS. Erros e seleção para exploração não geram conclusão indevida. |
| Escrever | Palavras, teclado, letras, áudio, apagar, limpar, confirmação e limites existentes: PASS. Caderno sem OCR ou julgamento automático. |
| Canvas | Traço por eventos nativos de mouse e toque emulado via CDP: PASS. Desfazer e limpar removem os pixels; resize de 1440 para 768 preserva o traço. Desenhar sozinho não registra conclusão. |
| Rotinas | Oito rotinas, ordem, ciclos, ajuda, conclusão, reinício e registro nos momentos previstos: PASS. |
| Comunicação do Meu Dia | Dez situações do catálogo atual, composições, recusas/necessidades fictícias, rotação e registro: PASS. Não se grava uma necessidade pessoal real da criança. |
| Emoções | Exploração, áudio, imagens, navegação e registro exploratório: PASS. Não há inferência de estado emocional ou diagnóstico. |
| Responsáveis | Página informativa e navegação: PASS. Sem login, autenticação simulada ou promessa de proteção parental segura. |

## Jogos e limite diário

| Jogo | Nível 1 | Nível 2 | Nível 3 |
| --- | --- | --- | --- |
| Caminho | PASS | PASS | PASS |
| Quebra-cabeça | PASS | PASS | PASS |
| Caça-palavras | PASS | PASS | PASS |
| Memória | PASS | PASS | PASS |
| Encontre a Imagem | PASS | PASS | PASS |
| Onde Pertence | PASS | PASS | PASS |

Os seis componentes reais foram exercitados nos 18 níveis. A suíte de progresso dos jogos cobre conclusão, reinício, ajuda/erros quando aplicáveis, bloqueio de níveis, N1 → N2 → N3 separado por jogo, gravação após confirmação, navegação e recarga. Também testa execução sem locks, falha de persistência, mudança de geração externa, desmontagem e gravação atrasada sem registrar o ID de uma atividade posterior. Nível liberado apenas em sessão não é apresentado como persistido após recarregar.

Limite diário: Sem limite, 15/30/45 minutos, 1 hora e Personalizado passaram, incluindo validação de intervalo, persistência, consumo de jogo visível/ativo, interrupção fora do jogo/aba oculta, esgotamento, acesso direto bloqueado e Aprender disponível. Virada do dia local e restauração foram testadas. Restaurar preferências mantém o consumo já registrado separado. Esse mecanismo local não constitui controle parental seguro.

## Progresso, preferências e áudio

| Estrutura local | Chave | Resultado |
| --- | --- | --- |
| Preferências | `falalivre.preferences` | Persistência, atualização, recarga e restauração: PASS |
| Progresso | `falaLivre_progress_v1` | Estados vazios, validação, revisão/geração, recarga, abas, desbloqueios e fallback de sessão: PASS |
| Rotação | `falaLivre_contentRotation_v1` | Ciclos independentes e isolamento das demais estruturas: PASS |
| Tempo de jogos | `falaLivre_gameTime_v1` | Preferência versus consumo, dia local e isolamento: PASS |

As suítes cobrem dados ausentes, corrompidos ou incompatíveis e indisponibilidade de armazenamento nos casos previstos pelos respectivos utilitários. Restaurar Configurações não apaga progresso, rotação ou consumo. “Registros deste navegador” permanece explícito. A apresentação não introduz porcentagem geral, pontuação, ranking, avaliação clínica ou comparação entre crianças.

As quatro combinações menino/menina, menina/menino, dois meninos e duas meninas foram verificadas com os assets existentes, prévia e aplicação em Aprender/Jogar, persistência e defaults. A escolha é preferência visual. Normal/Grande, Reduzir movimentos, tempo de jogos e acesso a Responsáveis passaram.

Áudio: prioridade pt-BR, demais vozes portuguesas, fallback, carregamento assíncrono/voiceschanged, escolha manual, voz ausente, exemplo, cancelamento anterior e parâmetros centralizados passaram. Navegar não provoca fala automática. A execução real identificou vozes portuguesas locais e remotas do Chrome, inclusive Microsoft Daniel/Maria e Google português do Brasil. Não houve escuta física em alto-falantes; a verificação confirma disponibilidade e chamadas, não qualidade percebida, idade ou gênero.

## Responsividade e acessibilidade

Larguras: **320, 360, 390, 430, 768, 1024, 1366 e 1440 px**. O complemento verificou todas as 24 rotas em Normal e Grande, a 100% e 125% de zoom CSS: **768 combinações**. Não houve overflow horizontal, imagens quebradas ou falta de nome nos botões/links/selects/inputs examinados. As suítes existentes acrescentam verificações de header, cards, tabuleiros, canvas, progresso e configurações, alvos de toque, tamanhos e estados funcionais. Capturas de Home, Caderno, Memória, Meu Progresso e Configurações em 390/1440 px foram produzidas para conferência visual direcionada.

Navegação por teclado, ativação com Enter, foco visível, labels, agrupamento de opções, nomes acessíveis, alternativas textuais, estados e mensagens passaram nos testes existentes. Os testes da identidade verificam contraste de texto de pelo menos 4,5:1 e de foco/bordas essenciais de pelo menos 3:1 nos pares amostrados. Normal/Grande, preferência e emulação de redução de movimentos foram exercitados. Feedback textual acompanha os estados avaliados; não há dependência exclusiva de cor ou áudio nas tarefas verificadas.

Cobertura: Chrome no Windows, viewport móvel emulado e toque CDP. O zoom foi aplicado por CSS, não por um ajuste físico do navegador. Não foi feita auditoria certificadora WCAG, teste com leitor de tela real ou validação física em Android/iOS, caneta e alto-falante. Portanto a conclusão de acessibilidade se limita às verificações documentadas.

## Evidências para os requisitos acadêmicos

| Requisito | Evidência real e limite da afirmação |
| --- | --- |
| Arquitetura da solução | SPA React/Vite com navegação por hash em `src/App.jsx`, páginas/componentes, catálogos em `src/data` e utilitários em `src/utils`. Preferências, progresso, rotação, áudio e tempo têm responsabilidades separadas. Conceito futuro: Usuário → Frontend React → camada futura de integração/API → Backend → Banco de dados. Backend é responsabilidade de outro integrante segundo o escopo informado; não foi implementado nem integrado nesta validação. |
| Desenvolvimento colaborativo | O escopo informado separa frontend e backend entre integrantes. Histórico local com um autor (`mouralph-del`): 31 commits antes da entrega inicial, 35 antes deste fechamento. Não há evidência verificável neste checkout de múltiplos autores, PRs ou revisões remotas; não se afirma colaboração em commits sem comprovação. |
| Controle de versões | Branch `main`, evolução incremental: identidade `82b8027`, pendências `a510271`, ARASAAC `cca1c6c`, tempo diário `965cc37`, layout `e084080`, logo `589236a`, vozes `eb1e58b`, favicon `19317ae`, validação inicial `82772de`, preparação `456c410`, acabamento `c9eb2fa` e assets `9664428`. Este fechamento acrescenta somente `Update final frontend validation`. |
| Git e GitHub | Git local verificado por status/log/shortlog. Preparação segura em `456c410`: README real, proteção de ambientes locais e checagem sem possível segredo identificado, mantendo CREDITS. `git remote -v` não retorna remoto; não há comprovação de publicação no GitHub nesta cópia. README agora documenta o projeto, sem inventar remoto. Nenhum push/deploy foi feito. |
| Testes | Validação inicial: 29 execuções finais. Regressão histórica anterior: 21 scripts e duas verificações complementares. Fechamento: dez scripts diretamente relacionados às mudanças posteriores, com resultados separados acima; não se somam execuções repetidas como testes únicos. Lógica, estado, falhas simuladas, abas, componentes reais/interação, lint, build e diff check. |
| Boas práticas de programação | Componentes e utilitários separados, dados/catalogação separados da apresentação, validação de estado local, geração/revisão de progresso, fallback explícito, fala centralizada, persistência independente, QA versionado e lint. Nenhuma refatoração estética foi acrescentada. |
| Acessibilidade no desenvolvimento | Labels e nomes acessíveis, foco/teclado, estados e feedback textual, contraste testado, Normal/Grande, redução de movimentos, áudio manual e alvos de toque. Evidência e limites de cobertura descritos na seção anterior. |

## Limitações conhecidas

1. Frontend sem backend integrado, conta real, autenticação, sincronização remota ou banco. A prontidão aqui se refere à preparação da entrega/deploy do frontend, não à certificação de uma integração ainda inexistente.
2. Dados e preferências são locais deste navegador/origem, sujeitos a limpeza, quota e indisponibilidade. Fallback de sessão não equivale a gravação durável. Não existe identidade separada de crianças usando o mesmo navegador.
3. Limite diário local depende do relógio e armazenamento do dispositivo e pode ser alterado pelo usuário. Não é controle parental seguro; não se promete controle transacional do consumo simultâneo entre abas.
4. Vozes e disponibilidade dependem de navegador/dispositivo; vozes remotas podem exigir rede. Naturalidade, idade, gênero e reprodução física não foram certificados.
5. Seis conceitos ARASAAC continuam sem substituição aprovada: **Molhar mãos, Enxaguar mãos, Colocar pijama, Chegar à escola, Se arrumar e Pote de materiais escolares**. A distinção das etapas das mãos permanece sem correspondência oficial suficientemente segura; os outros quatro não têm asset adequado identificado. Todos usam apresentação neutra **Sem imagem**, sem falha de execução. Comida, em Onde pertence?, também mantém apresentação neutra até haver representação específica de alimento individual, conforme `9664428`. Nenhuma imagem foi improvisada, gerada ou baixada neste fechamento.
6. Não houve teste físico de dispositivos móveis, leitores de tela ou caneta; as verificações são automatizadas no Chrome e acompanhadas de conferência visual direcionada. Canvas não possui OCR nem avaliação automática.

## Conclusão e entrega

**APROVADO COM RESSALVAS:** frontend fechado para publicação/entrega do MVP no escopo local aprovado, com as limitações não bloqueadoras acima. As correções visuais posteriores foram incorporadas à evidência; a regressão histórica não encontrou defeito funcional reproduzível. Nenhuma correção adicional da aplicação foi necessária neste fechamento. Integração com backend, certificação formal de acessibilidade e validação física de dispositivos não são resultados deste trabalho.

Commit local deste fechamento: `Update final frontend validation`, na branch `main`, sobre `9664428`. O hash final é informado pelo `git log -1 --oneline` após o commit, evitando gravar no documento uma referência circular ao próprio commit. README, `.gitignore`, assets, implementação e testes permanecem inalterados nesta etapa. Sem remoto, criação de repositório remoto, push ou deploy.
