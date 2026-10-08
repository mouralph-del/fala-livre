# Cenários oficiais de Aprender — implementação e diferenças

Referência: colagem aprovada de nove telas, 8 de outubro de 2026.

## Composição implementada

`LearningLandscape` compartilha árvores, nuvens, colinas, caminho, vegetação,
livros e cartões decorativos em SVG nativo. Cada rota escolhe seu contexto:

| Página | Cenário e assets existentes |
| --- | --- |
| Aprender | Paisagem escolar; ajuda/livro ARASAAC e caderno/mochila dos cards existentes. |
| Comunicar | Paisagem verde e cartões decorativos; pictogramas pedagógicos existentes intactos. |
| Palavras e Frases | Paisagem creme e livros; vocabulário original intacto. |
| Escrever | Paisagem azul e livros; papel, teclado e canvas intactos. |
| Meu Dia a Dia | Paisagem com casa; ícones de checklist, comunicação e coração decorativos. |
| Rotinas | Ambiente doméstico com janela e estantes; pictogramas das etapas originais. |
| Comunicação cotidiana | Paisagem verde e cartões; imagens e situações pedagógicas originais. |
| Emoções: menu, conhecer, como estou e o que preciso | Paisagem verde, coração e cartões; vocabulário, variantes e imagens originais. |

Decorações não recebem foco, não são anunciadas e não interceptam cliques.
Objetos laterais ficam fora dos controles e são ocultados abaixo de 1440 px.
O cenário compartilhado não inclui personagens genéricos automaticamente.
O fundo continua ao longo da página, com transição da paisagem para uma base
suave; não há altura fixa da página nem ilustrações sobre os traços do Caderno.
Home, Jogar e o header global não foram alterados.

## Diferenças e assets ausentes

A referência não foi reproduzida de forma idêntica: o cenário usa SVG nativo,
não uma nova imagem raster. As poses de menino apresentando pictogramas,
menina apresentando palavras, personagens demonstrando situações e menina
abraçando um coração não existem como arquivos independentes disponíveis.
Não foram criadas poses, usadas imagens aleatórias ou substituídos personagens
por ARASAAC. A menina decorativa repetida foi removida dos cenários de leitura
e escrita; os arquivos das ilustrações e as preferências da Home foram preservados.
O header preserva sua implementação existente, sem recriar a versão da colagem.

## Validação direcionada

`learningScenes.browser.mjs` cobre as oito rotas e os quatro estados de Emoções
em 320, 390, 430, 768, 1024, 1366, 1440 e 1920 px, Normal/Grande, foco de teclado,
movimento reduzido, ausência de overflow e colisão das ilustrações, acesso demo
e continuidade do fundo durante rolagem. Capturas ficam no diretório temporário
`falalivre-learning-review`, fora do repositório. Os testes existentes de
navegação/Home, Escrever e Free/Premium complementam essa matriz.
