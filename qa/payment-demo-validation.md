# Contratação Premium — demonstração acadêmica

Fluxo inteiramente local em `#/planos`, com seleção Mensal (R$ 16,90) ou Anual (R$ 149,90), etapa demonstrativa e confirmação explícita. Não há integração financeira, banco, Pix, API, cobrança ou assinatura real.

O QR é gerado localmente como SVG pela biblioteca `qrcode`, com margem de leitura de quatro módulos e correção de erro M. O destino usa `VITE_PUBLIC_APP_URL` quando configurada, preservando o subdiretório da aplicação; sem configuração, só aceita a origem atual HTTPS com hostname público. URLs inválidas, credenciais na URL, IPs e nomes locais/internos não geram QR. O card explica a necessidade de publicar um endereço acessível, mantendo a simulação local disponível. A validação é sintática, não verifica DNS nem disponibilidade. Não são incluídos dados pessoais, parâmetros de aprovação, plano ou valor.

A rota `#/pagamento-demo` apresenta ícone verde, “Pagamento simulado com sucesso!”, aviso de demonstração sem pagamento real e “Voltar ao Fala Livre” para `#/planos`. Abrir ou escanear continua sem conceder acesso, alterar sessão, criar transações ou comunicar confirmação ao aparelho original.

O botão de simulação aguarda 650 ms localmente e chama `activatePremiumDemonstration` no serviço de conta existente. É utilizada a mesma chave `falalivre.demo-session.v1`, com a sessão demo já aberta ou Alex/Noa quando visitante. `planAccess` continua sendo a única regra de acesso; não há chave independente de plano/pagamento. Isso é informado antes da simulação. Falha de armazenamento mantém o fallback em memória já utilizado pelo projeto.

Refresh mantém uma sessão que tenha sido salva; logout remove o acesso. Voltar ou sair da página durante processamento cancela a simulação pendente. Logout durante processamento também a cancela. Dados educativos e preferências não são modificados. Não existe histórico financeiro, renovação, validade de assinatura ou autorização real de servidor.

Validação direcionada:

- `node qa/publicAppUrl.test.mjs`: URL pública/subdiretório, origem HTTPS, URLs inválidas, locais, privadas, IPs e credenciais rejeitadas — PASS.
- `node qa/paymentDemo.browser.mjs` e `node qa/paymentDemo.browser.mjs --public-url`: ausência de QR local e QR público decodificado independentemente por `jsqr`, confirmação/retorno, contexto isolado sem sessão/transações, preços, aprovação local, persistência, logout, cancelamento, atividades Free/Premium, seis jogos, sete larguras Normal/Grande, foco e movimento reduzido — PASS. `example.com` aparece somente como fixture de teste, não como domínio do projeto.
- `qa/plans.browser.mjs`: comparativo, valores, economia anual, seletor, navegação, toque e teclado preservados.
- `qa/accountAccess.test.mjs`: ativação pela mesma sessão, preservação dos nomes existentes e dos registros, logout e credenciais demonstrativas preservadas.
- `qa/pwa.browser.mjs`: executado nos builds de produção sem URL pública e com URL HTTPS de fixture; orientação sem QR local ou destino público correto, simulação offline, acesso e logout, além da regressão PWA existente — PASS. O build final foi regenerado sem a configuração temporária da fixture.

Lint, build e diff check passaram. O aviso de tamanho do bundle já existente permanece. Capturas da confirmação em 390/1440 px foram inspecionadas.

Não foram testados escaneamento com câmera física ou pagamentos reais. O funcionamento local não cria autenticação segura nem sincronização entre aparelhos. Os níveis e o limite diário continuam sujeitos às regras existentes.
