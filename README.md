# Fala Livre

MVP acadêmico com atividades de comunicação, palavras, escrita, rotinas e jogos educativos. Este repositório contém o frontend do projeto Fala Livre.

## Tecnologias

React 19, JavaScript, CSS, Vite 8, ESLint e npm. Preferências, progresso, rotação de atividades e tempo diário de jogos utilizam armazenamento local do navegador. O áudio utiliza a API de síntese de fala do navegador.

## Executando localmente

Use Node.js e npm; a validação documentada foi executada com Node.js 24. O projeto inclui `package-lock.json`.

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite. Para gerar e conferir o build de produção localmente:

```bash
npm run build
npm run preview
```

## Escopo

Para testar o QR Code Premium entre dispositivos, configure `VITE_PUBLIC_APP_URL`
em `.env.local` com o endereço público HTTPS real da aplicação e gere novamente
o build. Pode incluir o subdiretório da publicação. Sem essa variável, usa-se
apenas uma origem atual HTTPS com hostname público; localhost, IPs e nomes
locais não geram QR Code. URLs inválidas configuradas também desativam o QR.
A validação não verifica DNS/disponibilidade: confirme que o endereço abre no
outro dispositivo. O QR abre somente a confirmação demonstrativa e não autoriza
Premium, pagamentos ou mudança de sessão.

O MVP funciona como frontend com dados locais deste navegador. Não há backend integrado, autenticação real, banco de dados ou sincronização remota. O limite diário local de jogos não é controle parental seguro. As vozes disponíveis dependem do navegador e do dispositivo.

## Testes

```bash
npm run lint
node qa/routines.test.mjs
```

Os scripts de lógica e navegador estão em `qa`. Os testes de navegador usam Chrome e perfis temporários isolados; os caminhos e comandos dos scripts atuais pressupõem Windows com Chrome instalado. A validação final registrou 29 execuções aprovadas, sem falhas finais ou testes ignorados. Cobertura, comandos, resultados e limitações estão em [qa/final-frontend-validation.md](qa/final-frontend-validation.md).

## Acessibilidade

O frontend inclui navegação por teclado, foco visível, nomes acessíveis, tamanho Normal/Grande, redução de movimentos e áudio acionado manualmente. As verificações realizadas e seus limites estão no relatório final; não constituem certificação de acessibilidade.

## Créditos

Os pictogramas ARASAAC mantêm os créditos, IDs, procedência e licença existentes em [CREDITS.md](src/assets/pictograms/arasaac/CREDITS.md). A licença dos pictogramas é CC BY-NC-SA 4.0, conforme esse documento; ela não deve ser presumida como licença de todo o repositório.

## Contexto acadêmico

Este é o frontend do MVP acadêmico Fala Livre, classificado como **APROVADO COM RESSALVAS** na validação final. O relatório documenta arquitetura, testes, acessibilidade, histórico Git e limitações reais para apoiar a apresentação acadêmica. O backend é responsabilidade de outro integrante e não foi implementado neste trabalho de frontend.
