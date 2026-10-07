# Integração futura das contas

As rotas `#/entrar` e `#/criar-conta` são apenas frontend. Não autenticam,
não criam contas e não enviam dados. A tela informa essa disponibilidade.

Conectar o serviço em `src/services/accountAccess.js`, na função
`requestAccountAccess(mode, credentials)`. Modos: `sign-in` e `create`.
Credenciais: `email`, `password` e, na criação, `name` do responsável.
Confirmação de senha é validada localmente e não é encaminhada.

O componente `AccountAccess` também aceita `submitAccount` para testar o
contrato. Atualmente o handler rejeita com `AccountServiceUnavailable`;
não existem endpoints, tokens, sessão ou resposta fictícia de API.
O serviço futuro deverá definir o resultado, tratamento de erros e navegação
depois da autenticação. Não persistir senhas; os campos de senha são apagados
após o envio. Preferências, rotação e progresso locais permanecem separados.
