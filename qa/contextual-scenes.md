# Cenários contextualizados — preparação inicial

Nota: este documento registra a preparação anterior. A expansão aprovada para
as páginas de Aprender está descrita em [learning-scenes.md](learning-scenes.md).
As regras antigas de fundo e posicionamento de Escrever foram substituídas pelo
cenário compartilhado; Home continua preservada.

Referência: composição aprovada pelo usuário em 8 de outubro de 2026.
Escopo desta etapa: Home, Comunicar e Escrever. As demais atividades não foram
redesenhadas e dependem de aprovação antes da expansão.

## Assets reutilizados

- `src/assets/illustrations/aprender-personagem.png`: menina escrevendo, com
  caderno, livros e lápis. Cenário lateral de Escrever e escolha padrão Aprender
  na Home; preferências de personagens da Home preservadas.
- `src/assets/illustrations/jogar-personagem.png`: menino com peças e controle.
  Escolha padrão Jogar na Home; preferências preservadas.
- Logo, favicon e paisagem existentes mantidos. Nenhuma imagem criada/editada.

## Assets ausentes

- Comunicar: personagem segurando/apresentando um pictograma. O cenário está
  preparado, mas a composição contextual da referência permanece incompleta.
- Home: poses específicas de leitura e personagens sentados da referência não
  existem como assets independentes; foram utilizados os personagens oficiais
  existentes, sem recriar as poses.
- Expansão futura: personagem apresentando uma palavra/figura e personagem
  demonstrando situações cotidianas. Nenhuma substituição improvisada aplicada.

## Adaptação

Na Home, em 1366 px ou mais, os personagens ocupam as laterais e não interceptam
cliques. Abaixo desse breakpoint, a composição anterior dentro dos cards é
preservada. Em Escrever, a menina é decorativa e aparece apenas no espaço fora
da largura de 1000 px do conteúdo; abaixo de 1366 px fica oculta. O fundo contínuo
e o papel do Caderno permanecem. Em Comunicar, o cenário superior desvanece para
um fundo azul contínuo. Não foram adicionadas animações.
