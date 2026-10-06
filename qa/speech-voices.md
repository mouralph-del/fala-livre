# Vozes e áudio

Seleção Automática prioriza pt-BR, depois demais vozes portuguesas, depois a voz padrão do navegador ou outra disponível. Dentro do grupo português preferido, localService=true precede vozes remotas e default=true desempata; ordem do dispositivo resolve empates restantes. Esses metadados não demonstram naturalidade ou timbre. Removidas heurísticas de nomes, fornecedores e gênero. Não há classificação de qualidade confiável na API.

Configurações lista nomes reais, agrupados em Português (Brasil) e Outras vozes em português, sem dezenas de idiomas adicionais. Quando só existem vozes de outros idiomas, Automática usa o fallback disponível e informa ausência de português. Quando nenhuma voz está pronta, Ouvir exemplo fica desabilitado com explicação. getVoices inicialmente vazio e voiceschanged posterior são suportados, sem reprodução automática.

Parâmetros centralizados: idioma preferido pt-BR, rate 0.9, pitch 1.05, volume 1. O idioma da utterance acompanha a voz escolhida no fallback para não pedir português a uma voz de outra região/idioma. Parâmetros anteriores próximos já estavam corretos e foram preservados. Frase do exemplo preservada: “Olá! Eu sou a voz do Fala Livre.” Nova fala cancela a anterior; interrupções não geram erro desnecessário.

Preferência única em falalivre.preferences.voice; identificador existente mantido. Voz salva ausente usa Automática efetivamente, com aviso e seleção visual correspondente. O identificador permanece salvo para não perder a escolha quando a lista estiver carregando; se retornar, pode voltar a ser usado. Escolher Automática ou Restaurar grava null. Sem mudanças em progresso, rotação ou consumo diário.

Áudio manual e global pelo utilitário existente, incluindo palavras, pictogramas, frase completa e letras. Seleção de conteúdo/voz, entrada em tela e atualização da lista não iniciam fala. Sem microfone, reconhecimento de voz, backend, downloads ou serviço externo adicionado.

## Limitações e conferência

Web Speech API não fornece gênero, idade ou qualidade/naturalidade de forma confiável. Mulher/Homem/Criança não foram inventados. Listas e disponibilidade variam entre Windows, Android, iOS/macOS e navegadores. Vozes remotas oferecidas pelo próprio navegador podem depender de conectividade. Nenhuma voz específica é garantida e os parâmetros não tornam automaticamente uma voz mais natural.

Conferência dirigida com lista real do Chrome nesta máquina: Microsoft Daniel e Microsoft Maria (pt-BR locais), Google português do Brasil (pt-BR remoto). Grupos, nomes, botão disponível e apresentação verificados em 390/768/1440 px. Sem escuta física; não se afirma melhora subjetiva do timbre.

## Testes

- node qa/speechVoices.test.mjs: Automática, prioridade/local/default, fallback português e sem português, vazio/voiceschanged, manual/voz ausente, parâmetros, cancelamento e engine indisponível.
- node qa/speechVoices.browser.mjs: carregamento assíncrono, grupos, exemplo, seleção manual, persistência/refresh, voz desaparecida, restauração e ausência de autoplay.
- node qa/speechVoices.browser.mjs --real: lista real e inspeção dirigida de Configurações, sem escuta física.
- node qa/responsibleGuidance.browser.mjs: preferências, voz/exemplo, persistência, personagens, restauração, teclado/foco.
- node qa/communication.test.mjs e node qa/communication.browser.mjs: regressão de áudio e composição educativos.
- npm run lint; npm run build; git diff --check.

Testes aprovados; somente verificações direcionadas.
