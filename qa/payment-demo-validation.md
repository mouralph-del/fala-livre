# Contratação Premium — demonstração acadêmica

Fluxo inteiramente local em `#/planos`, com seleção Mensal (R$ 16,90) ou Anual (R$ 149,90), etapa demonstrativa e confirmação explícita. Não há integração financeira, banco, Pix, API, cobrança ou assinatura real.

O QR é gerado localmente como SVG pela biblioteca `qrcode`, com margem de leitura de quatro módulos e correção de erro M. Contém apenas `<origem atual>/#/pagamento-demo`, sem dados pessoais, chaves, parâmetros de aprovação, plano ou valor. A rota é informativa; abrir ou escanear nunca concede acesso. Em outro aparelho, o endereço precisa estar publicado e acessível. Localhost não é um endereço público.

O botão de simulação aguarda 650 ms localmente e chama `activatePremiumDemonstration` no serviço de conta existente. É utilizada a mesma chave `falalivre.demo-session.v1`, com a sessão demo já aberta ou Alex/Noa quando visitante. `planAccess` continua sendo a única regra de acesso; não há chave independente de plano/pagamento. Isso é informado antes da simulação. Falha de armazenamento mantém o fallback em memória já utilizado pelo projeto.

Refresh mantém uma sessão que tenha sido salva; logout remove o acesso. Voltar ou sair da página durante processamento cancela a simulação pendente. Logout durante processamento também a cancela. Dados educativos e preferências não são modificados. Não existe histórico financeiro, renovação, validade de assinatura ou autorização real de servidor.

Validação direcionada:

- `qa/paymentDemo.browser.mjs`: preços, QR decodificado independentemente por `jsqr` (somente QA), rota informativa e parâmetros adulterados sem autorização, aprovação local, persistência, logout, cancelamento, atividades Free/Premium, seis jogos, sete larguras Normal/Grande, foco e movimento reduzido.
- `qa/plans.browser.mjs`: comparativo, valores, economia anual, seletor, navegação, toque e teclado preservados.
- `qa/accountAccess.test.mjs`: ativação pela mesma sessão, preservação dos nomes existentes e dos registros, logout e credenciais demonstrativas preservadas.
- `qa/pwa.browser.mjs`: simulação offline no build de produção já cacheado, QR informativo, acesso e logout, além da regressão PWA existente.

Não foram testados escaneamento com câmera física ou pagamentos reais. O funcionamento local não cria autenticação segura nem sincronização entre aparelhos. Os níveis e o limite diário continuam sujeitos às regras existentes.
