# Vozes e áudio

A Web Speech API usa as vozes fornecidas pelo navegador e sistema operacional.
A seleção e a reprodução estão centralizadas em `src/utils/speech.js`; os
componentes chamam `falar`/`stopSpeaking` e não escolhem uma voz por conta própria.

Automática resolve pt-BR primeiro, depois outra voz em português, depois a voz
padrão do navegador ou outra disponível. `localService`/`default` ajudam na
resolução inicial, sem inferir gênero, idade ou naturalidade. Empates usam a
identidade URI/nome/idioma, independentemente da ordem inicial da lista. A identidade
resolvida fica estável durante a sessão enquanto existir na lista, inclusive
após reordenação, novos candidatos ou mudanças de prioridade em `voiceschanged`.
Se desaparecer, outra voz é resolvida. Uma lista vazia não causa erro; nesse
intervalo a fala usa o fallback do próprio navegador sem voz explicitamente
atribuída. A chegada de vozes nunca inicia ou reinicia áudio automaticamente.

A seleção manual usa as vozes reais de qualquer idioma. Português (Brasil) e
outras vozes em português ficam em destaque; Outros idiomas pode ser expandido
sem alongar desnecessariamente a tela. Nomes e idiomas são os fornecidos pela API,
sem categorias inventadas. Ouvir exemplo fala: “Olá! Vamos aprender juntos.”,
usando a mesma resolução de voz das atividades.

`falalivre.preferences.voice` preserva o formato existente: JSON de `voiceURI`
(ou `name`, quando URI não é informado), `name` e `lang` normalizado. Não há índice
persistido. Preferências antigas contendo apenas `name` continuam compatíveis.
Uma voz salva ausente usa Automática com aviso, sem apagar a preferência; se
retornar, é restaurada. Outras preferências, plano e progresso não mudam.

Parâmetros: idioma preferencial pt-BR, rate 0.9, pitch 1.05 e volume 1. O idioma
da utterance acompanha a voz escolhida. Nova acao manual cancela a anterior;
não há fila adicional e callbacks de falas interrompidas não reportam erros antigos.

## Compatibilidade e limites

Windows, Android, iOS/macOS e navegadores podem oferecer listas diferentes.
Não é possível garantir uma voz específica em todos os dispositivos, nem
naturalidade universal. Vozes remotas oferecidas pelo navegador podem depender
de conectividade. Não há backend, TTS pago, chave externa, gravação ou clonagem.
Não está prevista gravação de voz do responsável ou usuário, biblioteca de
gravações, uso de MediaRecorder para vocabulário, uploads ou clonagem de voz.
A centralização atende exclusivamente à reprodução das vozes do navegador;
não prepara uma arquitetura de gravação personalizada.

A seleção continua gratuita; `planAccess.js` e as regras Free/Premium não foram
alterados. Nos testes, a fixture Premium existente permite conferir somente
os consumidores protegidos, sem criar assinatura ou mudar a fonte pública free.

## Verificação direcionada

- speechVoices.test.mjs: identidade, Automatica estavel, prioridades/fallbacks,
  voz manual de outro idioma, compatibilidade, lista vazia/assincrona, retorno
  da voz salva, parametros, cancelamento e engine indisponivel.
- speechVoices.browser.mjs: Configuracoes, previa, refresh, reorder/voiceschanged,
  mesma referencia em palavras/letras de Escrever, frase de Comunicar, Palavras
  e Frases, Rotinas, Comunicacao educativa, Emocoes e Caminho. Verifica teclado,
  toque, foco, sete larguras em Normal/Grande, preferencias e progresso intactos.
- speechVoices.browser.mjs --real: lista real do Chrome e interface, sem escuta
  fisica. Foram encontradas vozes Microsoft e Google, incluindo pt-BR.
- lint, build e git diff --check.

Os testes automatizados verificam a voz atribuída e o funcionamento, não a
qualidade sonora. Timbre, pronúncia e naturalidade precisam de escuta real no
dispositivo de uso. Não se afirma que a voz “soa natural” com base nos testes.
