# PWA — validação local

Implementação sobre `main`, HEAD inicial `404e0a0`. Sem publicação ou deploy.

## Arquitetura e arquivos

- `vite.config.js`: `vite-plugin-pwa` 2.0, compatível com o Vite 8 instalado; Workbox `generateSW`, registro em modo `prompt`.
- `src/main.jsx`, `src/components/PwaControls.jsx` e `.css`: registro somente no build de produção, instalação quando o navegador fornece `beforeinstallprompt`, aviso acessível e confirmação de atualização.
- `index.html`: tema azul e Apple Touch Icon. Favicon e logo oficiais preservados.
- `public/pwa/`: quatro PNGs derivados do ícone oficial de 1254×1254. `qa/prepare-pwa-icons.ps1` reproduz o redimensionamento sem alterar o original. Versão maskable centralizada em 68% da área, sem recorte ou distorção, sobre branco.
- `qa/pwa.browser.mjs`: Chrome com perfil temporário, preview de produção, rede desligada e segunda revisão do service worker servida apenas pelo teste.
- `package.json` e lockfile: plugin e `workbox-window`; dependência transitiva `source-map-js` atualizada para a correção disponível. Auditoria de dependências sem vulnerabilidades após o ajuste.

## Manifest

Gerado em `dist/manifest.webmanifest`: nome e nome curto **Fala Livre**, descrição **Comunicar, Aprender e Conectar.**, `pt-BR`, `ltr`, `standalone`, identificador e escopo `/`, início `/#/`, tema `#315F8C`, fundo `#F7F8F4`.

Ícones: 192×192 e 512×512 (`any`), 512×512 (`maskable`) e Apple Touch 180×180. Hospedagem prevista na raiz do domínio, com HTTPS; uma futura publicação em subdiretório exige ajustar base, escopo e caminhos em conjunto.

## Cache e offline

O build precacheia o shell e os JS, CSS, PNGs, SVGs, manifest e créditos locais: aproximadamente **39 MB**. Limite individual de 3 MiB inclui a maior ilustração existente, sem reduzi-la. A primeira instalação precisa de conexão e de concluir o download de todos os recursos; cache pode falhar por falta de espaço ou ser removido pelo sistema.

Somente arquivos estáticos do build são armazenados. Não há cache de runtime, senhas, sessões, progresso, preferências, autenticação, pagamentos ou APIs. O fallback HTML aceita apenas navegações em `/` e `/index.html`; as rotas hash não exigem novas URLs no servidor. Recursos externos não passam por estratégia de cache do aplicativo.

Validação offline no preview, após cache inicial completo:

- Home, Aprender, Comunicar e seus pictogramas.
- Escrever, Teclado e Caderno; desenho com mouse efetivamente produz traços.
- Palavras e Frases, Meu Dia a Dia, Rotinas, Comunicação e Emoções com sessão demo.
- Menu Jogar e as seis rotas: Caminho, Quebra-cabeça, Caça-palavras, Memória, Encontre a Imagem e Onde Pertence.
- Meu Progresso, Configurações e Planos informativos.
- Login demo local, refresh, rotas Premium diretas e logout. Visitante permanece bloqueado nos recursos Premium; logout e refresh restauram o bloqueio.

Esta etapa verificou disponibilidade das atividades e assets offline, sem repetir toda a bateria pedagógica dos 18 níveis. Progressão e limite diário continuam sob seus serviços existentes.

## Atualização

Uma versão nova fica aguardando; o aviso oferece **Atualizar aplicativo** e **Agora não**. A verificação acontece no registro e ao voltar a uma aba visível ou recuperar conexão. Não existe recarga periódica forçada.

Somente a confirmação permite recarregar a aba. Uma atualização confirmada em outra aba não recarrega a atividade em andamento: ela recebe uma opção de atualizar quando conveniente. Finalize a atividade antes de confirmar; traços em memória no Caderno não são convertidos em persistência pelo PWA.

Workbox limpa entradas de versões antigas ao ativar a nova. O teste troca a revisão do HTML, verifica remoção da revisão anterior, ausência de recarga espontânea em duas abas e preservação de todo o localStorage. Nenhuma rotina limpa dados educativos.

Referência de implementação: [documentação oficial de atualização mediante confirmação](https://vite-pwa-org.netlify.app/guide/prompt-for-update.html).

## Persistência e integração futura

Progresso, preferências e sessão demo continuam locais, com os mesmos esquemas. Instalar não cria sincronização entre dispositivos. Dependendo do sistema, o aplicativo instalado e o navegador podem usar armazenamentos separados. Limpar dados do site ou desinstalar pode afetar os registros locais.

A conta Alex/Noa e o Premium demo permanecem permissões de demonstração no frontend, sem autenticação segura, cobrança ou assinatura real. Backend, autenticação real, pagamentos e sincronização deverão ser implementados separadamente; não adicionar rotas privadas ao precache ou fallback, nem estratégias genéricas que guardem respostas autenticadas.

## Instalação e limitações

- **Android:** acessar a versão HTTPS em navegador compatível e usar a opção Instalar aplicativo/Adicionar à tela inicial oferecida pelo navegador. O botão interno só aparece quando o evento de instalação é fornecido.
- **iPhone/iPad:** no Safari, usar Compartilhar → Adicionar à Tela de Início quando disponível. Não depende do evento de instalação utilizado no Chromium.
- **Computador:** usar a opção de instalação da barra de endereço ou menu do navegador compatível, quando disponível.

A oferta depende do navegador; não é garantida automaticamente. O ambiente local passou na verificação de instalabilidade do Chrome e registro do service worker. A API de instalação nativa não está disponível no Chrome headless utilizado. Não foi possível validar uma janela instalada real nem dispositivos Android/iPhone; não declarar compatibilidade universal ou standalone nativo validado.

Voz offline depende das vozes instaladas, do navegador e do sistema operacional. Não foram realizados testes reais de voz offline em dispositivos; vozes remotas podem precisar de conexão. Créditos ARASAAC externos e futuros serviços de backend também precisam de internet; créditos locais continuam incluídos no build.

## Testes

- `npm run build`: manifest e service worker gerados, todos os assets locais incluídos. Aviso não bloqueante do Vite: bundle principal pouco acima de 500 kB; nenhuma refatoração fora do escopo.
- `node qa/pwa.browser.mjs`: produção/preview; manifest, tamanhos de ícones, instalabilidade, cache apenas estático, navegação offline, demonstração e bloqueios, desenho, atualização confirmada e isolamento entre abas.
- Responsividade: 320, 390, 430, 768, 1024, 1366 e 1440 px, Normal/Grande, movimento reduzido e foco de teclado do aviso. Standalone real permanece limitado conforme descrito acima.
- `node qa/accountAccess.test.mjs`, `node qa/plans.test.mjs` e `node qa/gameTime.test.mjs`: passaram; demonstrativo, preços e limite diário preservados.
- `npm run lint` e `git diff --check`: passaram.

As alterações anteriores em `src/homeReference.css` e `qa/desktopComposition.browser.mjs` foram preservadas e não fazem parte do commit PWA.
