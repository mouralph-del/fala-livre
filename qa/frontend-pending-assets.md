# Assets ARASAAC pendentes — conceitos conhecidos

Base: main, HEAD a510271. Os cinco assets anteriores foram preservados; seis escolhas adicionais foram aprovadas pelo usuário. Escopo restrito aos 17 conceitos já definidos. Sem mudança de progresso, regras, redesign ou backend.

## Resolvidos

PNGs oficiais da variante _300.png, armazenados sem edição em src/assets/pictograms/arasaac/. IDs nos catálogos; nomes oficiais, procedência, URLs individuais e licença no CREDITS.md existente.

| Conceito | Nome oficial (es) / ID | Arquivo local | Aplicação |
| --- | --- | --- | --- |
| Guardar brinquedos | recoger los juguetes — 8680 | guardar-brinquedos.png | Sequências antigas, preparar-dormir-escola |
| Livro | libro — 2450 | livro.png | Onde pertence?, escola, livro-escola |
| Papel | papel; folio — 8349 | papel.png | Onde pertence?, escola, papel |
| Estante | estantería — 2386 | estante.png | Onde pertence?, escola, estante-escola |
| Pasta escolar | carpeta — 3233 | pasta-escolar.png | Onde pertence?, escola, pasta |
| Ajustar/fechar sapato | poner velcro; poner zapatilla/zapato con velcro — 37934 | fechar-velcro.png | Sequências antigas, calcar-sapato, ajustar-sapato |
| Tomar banho | duchar — 2371 | tomar-banho.png | Sequências antigas, preparar-dormir-escola, tomar-banho |
| Sentar à mesa | esperar la comida; sentado en la mesa — 38944 | sentar-mesa.png | Sequências antigas, hora-comer, sentar-mesa |
| Pegar talheres | coger el cuchillo; coger cuchillo y tenedor; tomar el cuchillo — 36628 | pegar-talheres.png | Sequências antigas, hora-comer, pegar-talheres |
| Guardar mochila / pendurar a mochila | colgar; colgar la mochila — 37896 | pendurar-mochila-cadeira.png | Sequências antigas, voltando-casa, guardar-mochila |
| Local da mochila | percha; perchero — 3286 | cabide-mochila.png | Exclusivamente Onde pertence?, escola, cabide-mochila |

Os cinco anteriores permanecem como implementados. No novo conjunto foram usados somente os seis IDs aprovados; não foram usados 38706, 36629, 17302 ou outra variante não aprovada. Local da mochila continua sendo destino/objeto, não ação.

### Ajustes textuais autorizados

- Sequências antigas, rotina Calçar o sapato: etapa de ID ajustar-sapato, AJUSTAR/FECHAR SAPATO → FECHAR O VELCRO. Rótulo e speechText correspondentes.
- Sequências antigas, rotina Voltando para casa: etapa de ID guardar-mochila, GUARDAR MOCHILA → PENDURAR A MOCHILA. Rótulo e speechText correspondentes.
- Mantidos os IDs, posições, demais etapas, ordem esperada e funcionamento do áudio. Nenhuma outra ocorrência de guardar mochila alterada.

Removido apenas o CSS sem consumidores após estas substituições: paper/folder/backpack-hook de Onde pertence?; store-toys/fasten/table/cutlery/store-backpack/bath de Sequências. Os estilos compartilhados ou de outras representações continuam como antes; book/shelf de N2 permanecem usados. Não houve limpeza geral.

## Pendentes por falta de correspondência específica

- Molhar mãos.
- Enxaguar mãos.

Os IDs 8975 e 8977 são oficialmente identificados como lavar mãos. Não foi encontrada distinção oficial suficientemente segura que associe cada ID às duas etapas diferentes. Não foram usados para inventar essa distinção; implementação atual temporariamente preservada.

Referências auxiliares não substituem a identificação individual:
[rotina oficial de lavagem de mãos](https://static.arasaac.org/materials/2798/es/3_Carteles_Higiene_y_Desinfeccion_Manos.pdf);
[material que separa enjuagar las manos](https://static.arasaac.org/materials/2277/es/Sintomas_rutinas_y_prevencion_Coronavirus__Mayusculas.pdf).

## Sem asset adequado identificado

- Colocar pijama: 2522 é pijama-objeto; 2781 vestir mostra camiseta. Não identificado pictograma individual seguro da ação com pijama.
- Chegar à escola: 16807 llegar mostra casa; 36473 ir al colegio indica deslocamento. Não identificado pictograma individual da chegada à escola.
- Se arrumar: variantes de vestir representam ação mais estreita; prepararse de 17000/17004/37794 mostra largada de corrida. Não identificado pictograma da preparação pessoal completa.
- Pote de materiais escolares: 3322/39114 representam recipientes com tampa; 2440 lapicero é lápis. Não identificado recipiente correspondente ao destino escolar da tesoura.

Não se afirma inexistência em todo o catálogo: nenhum asset adequado foi identificado para esses quatro conceitos nas consultas anteriores. Não houve nova pesquisa nem download de imagens genéricas nesta continuação. Atividades preservadas.

## Testes e entrega

Comandos: node qa/arasaacPending.test.mjs; node qa/arasaacPending.browser.mjs; node qa/routines.test.mjs; npm run lint; npm run build; git diff --check.

O teste de catálogo compara com a510271, permitindo somente alterações de representação e os dois rótulos autorizados. Mantém textos restantes, IDs, ordem, demais conceitos e dados educativos iguais à base. O teste de navegador usa perfil isolado; percorre níveis anteriores somente para chegar à escola em N3, verifica os PNGs e as associações, seleção e conclusão das sequências afetadas. Sem acessar progresso do usuário.

Conferência visual dirigida em Chrome headless, 390 px. Sem auditoria geral, leitor de tela, áudio físico ou stylus físico. Resultados finais e SHA do commit na resposta de entrega.

## Tratamento neutro das lacunas — continuação sobre c9eb2fa

As seis lacunas continuam sem substituição aprovada. Na apresentação de Sequências/Rotinas, os IDs de Molhar mãos, Enxaguar mãos (inclusive `enxaguar-maos` de Meu Dia a Dia), Colocar pijama, Chegar à escola e Se arrumar agora mostram **Sem imagem**, em uma superfície neutra. Não são exibidos os assets genéricos, a camiseta ou as composições/desenhos CSS que simulavam essas representações. Em Onde pertence?, Pote de materiais recebe o mesmo tratamento neutro.

O rótulo pedagógico de cada card permanece visível e acessível. O aviso é apoio visual não interativo (`aria-hidden`); não cria alt falso, `img` vazio ou promessa de pictograma. IDs, ordem, textos pedagógicos, fala, dependências, associações, catálogos e progresso permanecem iguais. Os metadados antigos dos catálogos foram preservados, mas não servem de representação visual para os IDs pendentes. Não houve novo download, pesquisa ou criação de asset.

### Uso semântico antigo ainda incorreto

**Comida**, em Onde pertence? / Nível 2, ainda utilizava `cafe-da-manha.png`, que mostra uma pessoa em uma composição de refeição, em vez de um alimento individual. Essa apresentação também passou a mostrar **Sem imagem**. A atividade e o destino geladeira não mudaram. Não foi identificado nem procurado outro asset nesta etapa; a representação específica de alimento individual permanece pendente. O arquivo original e seus créditos não foram alterados.

Os outros exemplos conhecidos já estão corretos: Escova de dentes usa o objeto, não Escovar; Copo usa o objeto e é distinto de Água; o destino Sofá é rotulado Sofá, não Sala. Cenas de refeição/brincadeira/descanso continuam em seus contextos narrativos, separadas dos pictogramas funcionais e com `object-fit: contain`. As molduras do acabamento visual aprovado foram preservadas.

### Regressões direcionadas

- `qa/arasaacPending.test.mjs`: onze IDs/PNGs/créditos aprovados e dados pedagógicos preservados — PASS.
- `qa/arasaacPending.browser.mjs`: mantidas as assertions anteriores; acrescentadas verificações dos avisos neutros, ausência de `img` e contenção de texto em 320/390/768/1366 px, Normal/Grande e zoom CSS 100/125%. Também exercita CASA, GATO e GATO E CACHORRO com pista e conclusão, verificando que a pista não intercepta interação e que seus badges não cobrem o resultado — PASS.
- `qa/routines.test.mjs`, `qa/routines.browser.mjs`, `qa/communication.test.mjs`, `qa/communication.browser.mjs` e `qa/corrections.browser.mjs` — PASS.
- `npm run lint`, `npm run build`, `git diff --check` — PASS.

Capturas direcionadas em `%TEMP%/falalivre-arasaac-review`. Sem repetição da matriz das 15 telas, alteração de `qa/final-frontend-validation.md`, README, `.gitignore`, acabamento global, áudio, backend ou assets aprovados.

Tentativas iniciais exigiram liberar o teste da restrição de subprocessos, executar Rotinas depois de Comunicação (porta compartilhada 4183) e corrigir a ampliação do harness: selecionar a rodada que contém o pote e considerar que a pista já coloca a primeira peça do quebra-cabeça. Não houve enfraquecimento de assertions; nenhuma falha permaneceu nas execuções finais.
