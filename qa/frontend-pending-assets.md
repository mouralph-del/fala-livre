# Pendências conhecidas de assets — correções finais

Base: `82b8027`. Conferência limitada aos itens solicitados; sem nova auditoria ou expansão de catálogo.

## Resolvido com arquivos existentes

- Personagens: as duas ilustrações da Home podem ser usadas em Aprender e Jogar, nas quatro combinações. São as mesmas imagens completas: menina com materiais de aprendizagem e menino com brinquedos. Não existem versões adicionais específicas de menino estudando/menina jogando na pasta de ilustrações; elas não são necessárias para escolher o personagem com os assets atuais. Menino/menina da Memória não foram reutilizados.
- Sequências antigas: colocar pasta na escova, calçar/colocar sapato, abrir porta, sair de casa, chegar em casa, tirar sapato e limpar/organizar mesa agora usam os respectivos PNGs ARASAAC existentes. IDs, ordem esperada, áudio e créditos preservados.
- As oito rotinas atuais de Meu Dia a Dia já utilizavam os pictogramas próprios, inclusive `colocar-pasta-escova.png` (30086).
- Comer, beber, escrever e passear no conteúdo atual já têm imagens existentes. Almoçar/jantar no modo antigo compartilham a representação de refeição, com frase contextual; não foi criado token nem alterado conceito.

## Assets ainda ausentes para substituir representações antigas

Não foi criado nem baixado qualquer arquivo. As representações antigas permanecem até haver asset apropriado; esta lista registra o que impede a substituição, sem mudar o significado.

| Área existente | Conceito sem asset próprio adequado |
| --- | --- |
| Sequências antigas — calçar sapato | Ajustar/fechar sapato. Amarrar cadarço existe, mas não é equivalente a todo tipo de fechamento. |
| Sequências antigas — preparar-se para dormir | Colocar pijama; tomar banho. Camiseta e vaso sanitário existentes não representam essas ações. |
| Sequências antigas — hora de comer | Sentar à mesa; pegar talheres. Há cena de refeição e sentar na cadeira, mas não a representação específica dessas ações. |
| Sequências antigas — escola/retorno | Chegar à escola; guardar mochila; guardar brinquedos; se arrumar. Ir à escola e pendurar mochila existentes não foram tratados como sinônimos automáticos. |
| Sequências antigas — lavar mãos | Molhar mãos e enxaguar como etapas distintas: atualmente reutilizam a imagem de lavar mãos com tratamentos CSS. |
| Onde pertence? — escola | Livro, papel, estante, pote de materiais, pasta escolar e local/cabide da mochila. Atualmente representados por CSS; não há arquivos oficiais desses conceitos no repositório. |

Os conceitos acima precisam de imagens oficiais correspondentes, com procedência/créditos, para substituir as representações antigas. Não há falta de arquivo que impeça carregar os pictogramas atuais das oito rotinas aprovadas. Nenhum novo asset foi introduzido.

## Verificação curta

- Frases naturais atuais e confirmação por composição esperada já corretas; Comunicar continua exploratório. No modo antigo, corrigida fala da frase esperada para não substituir uma montagem diferente/vazia.
- Quebra-cabeça gato + cachorro: montagem/ajuda/conclusão/desbloqueio conferidos; somente a pista visual foi ocultada após conclusão.
- Preferências: quatro combinações, Home, refresh e restauração testados; restauração mantém progresso e rotação.
- Testes existentes `communication.test.mjs`, `routines.test.mjs`, `communication.browser.mjs`, `responsibleGuidance.browser.mjs` passaram. Conferência de páginas citadas em Chrome headless, 390 px; Configurações em 768 px e Home em 1366 px. Lint/build/diff passaram. Sem leitor de tela ou teste físico de áudio/stylus.
- Redesign de 12.2 preservado; sem backend, push, deploy ou início de nova etapa.
