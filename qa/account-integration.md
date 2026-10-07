# Integração futura das contas

O acesso é exclusivamente frontend, com a conta pública `teste@falalivre.com`,
senha `FalaLivre123`, responsável `Alex` e usuário `Noa`. **Não é autenticação segura**:
as credenciais estão no bundle, a sessão pode ser manipulada e não deve
proteger dados reais. Não há backend, API, tokens ou cadastro funcional.

Conectar o serviço em `src/services/accountAccess.js`, na função
`requestAccountAccess(mode, credentials)`. Modos: `sign-in` e `create`.
Credenciais: `email`, `password` e, na criação, `responsibleName` do responsável
e `userName` de quem utiliza. O cadastro apenas demonstra os campos previstos
e continua indisponível, sem criar contas nem fazer requisições.
Confirmação de senha é validada localmente e não é encaminhada.

O componente `AccountAccess` também aceita `submitAccount` para testar o
contrato. `create` rejeita com `AccountServiceUnavailable`; credenciais
incorretas geram `InvalidAccountCredentials`, sem revelar existência de contas.

A chave local `falalivre.demo-session.v1` contém apenas
`{ "demo": true, "responsibleName": "Alex", "userName": "Noa" }`.
A estrutura demo antiga `{ "demo": true, "name": "Responsável" }` é migrada
nessa mesma chave para os nomes demo atuais. Sessões inválidas são ignoradas.
A Home saúda quem utiliza (`Olá, Noa!`); o menu identifica `Responsável` e `Alex`.
Sem sessão válida, a saudação permanece `Olá!`. Os nomes ficam exclusivamente
na sessão demo, nunca no schema de progresso. A senha nunca é persistida e os
campos de senha são apagados após o envio. Se o armazenamento estiver
indisponível, a sessão funciona somente em memória, sem persistir no reload.
`signOut` remove somente essa chave. Progresso, preferências, rotação e tempo
diário continuam sendo dados deste navegador, sem associação à conta.

Na integração real, remover/substituir a implementação demo desse serviço,
mantendo o contrato de acesso, leitura/assinatura de sessão e saída usado pelas
telas. O backend deverá definir autenticação, sessão segura e tratamento de
erros e será a fonte de verdade dos dados de responsável e usuário;
nenhum endpoint ou schema definitivo de banco é presumido aqui. Não existem
planos, assinaturas, pagamentos ou bloqueios Premium nesta implementação.
