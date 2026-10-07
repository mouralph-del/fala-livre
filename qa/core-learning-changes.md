# Comunicar e Palavras e Frases

Comunicar separa os pictogramas da frase final. Somente combinações conhecidas
produzem texto e áudio; seleções incompletas, repetidas, contraditórias ou sem
significado aprovado permanecem editáveis, sem concatenação nem fala de frase.
A seleção `EU + PRECISO + AJUDA + BANHEIRO` comunica ajuda para ir ao banheiro.
Os sentimentos reutilizam assets e frases existentes de Emoções, sem modificar
essa atividade. CALMO/CALMA e CONFUSO/CONFUSA são escolhas explícitas da pessoa,
sem perfil de gênero ou inferência a partir dos personagens.

Palavras e Frases usa Conhecer → Reconhecer → Usar na frase. Reconhecer apresenta
três palavras distintas do vocabulário atual, embaralhadas e com uma resposta
correta. Pares que diferem por uma única letra, como CASA/CAMA, não aparecem
juntos como alternativas. As 12 frases de contexto existentes foram preservadas: todas têm
relação clara com a palavra e texto exibido igual ao áudio.

Para compatibilidade, o identificador de progresso `build` permanece armazenado
e passa a ser apresentado como Reconhecer. Evidências anteriores de Montar
continuam válidas como evidência histórica da fase intermediária; não são
apagadas nem declaradas como uma nova execução. Sem migração ou alteração do
schema, das dependências ou dos registros de conclusão.

O teclado mantém as 26 letras em “Letras do alfabeto”; Á fica em “Letras com
acento”, junto às formas acentuadas necessárias à palavra-alvo. O teclado
físico e a entrada de texto continuam aceitando os acentos existentes.

As duas áreas usam `falar` e a preferência global de voz, sem novo serviço,
armazenamento de áudio ou mudanças nos parâmetros. Timbre e qualidade dependem
das vozes disponíveis no dispositivo e da Web Speech API.

Combinações não catalogadas requerem decisão de conteúdo antes de receberem
uma frase definitiva. Por exemplo, duas ações QUERO juntas, pedidos repetidos,
AJUDA antes de PRECISO ou dois estados simultâneos não são reinterpretados.
