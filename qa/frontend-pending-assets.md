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
