# Feature Specification: Tela de Login e Autenticação

**Feature Branch**: `007-login-supabase-auth`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "vamos configurar agora a tela de login e toda autenticação com supabase"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Login com Credenciais (Priority: P1)

Como um usuário registrado, quero poder inserir meu email e senha para acessar minha conta no RPG Bíblico.

**Why this priority**: É a funcionalidade base para qualquer usuário interagir com o sistema com seu próprio perfil.

**Independent Test**: Pode ser testado independentemente inserindo credenciais válidas e verificando o acesso à área logada, bem como inserindo credenciais inválidas e recebendo feedback apropriado.

**Acceptance Scenarios**:

1. **Given** um usuário na tela de login, **When** insere email e senha válidos e clica em "Entrar", **Then** é redirecionado para a área principal do sistema.
2. **Given** um usuário na tela de login, **When** insere email ou senha inválidos, **Then** recebe uma mensagem de erro clara e permanece na tela de login.

---

### User Story 2 - Cadastro de Novo Usuário (Priority: P1)

Como um novo visitante, quero poder criar uma conta usando meu email para poder participar das sessões de RPG.

**Why this priority**: Sem a capacidade de criar contas, novos usuários não podem entrar na plataforma.

**Independent Test**: Testável independentemente preenchendo o formulário de cadastro com dados válidos e verificando a criação do usuário no sistema.

**Acceptance Scenarios**:

1. **Given** um visitante na tela de cadastro, **When** insere dados válidos, **Then** a conta é criada e o usuário é logado ou solicitado a confirmar o email.
2. **Given** um visitante, **When** tenta usar um email já registrado, **Then** o sistema informa que a conta já existe.

---

### User Story 3 - Recuperação de Senha (Priority: P2)

Como um usuário que esqueceu a senha, quero poder solicitar um link de recuperação para recuperar o acesso à minha conta.

**Why this priority**: Previne perda de contas e reduz a carga de suporte.

**Independent Test**: Testável simulando o fluxo de "esqueci minha senha" e verificando o envio do email.

**Acceptance Scenarios**:

1. **Given** um usuário que esqueceu a senha, **When** insere seu email na tela de recuperação, **Then** recebe um email com um link seguro.
2. **Given** um usuário com o link de recuperação, **When** acessa o link e define nova senha, **Then** a senha é atualizada com sucesso.

### User Story 4 - Login com Google (Priority: P1)

Como um visitante ou usuário registrado, quero poder fazer login usando minha conta do Google para acessar o sistema de forma rápida e sem precisar criar uma nova senha.

**Why this priority**: Reduz o atrito no cadastro e melhora a taxa de conversão de novos usuários.

**Independent Test**: Testável clicando no botão "Continuar com Google", autenticando-se na plataforma do Google e verificando o redirecionamento com sucesso para a área logada.

**Acceptance Scenarios**:

1. **Given** um usuário na tela de login/cadastro, **When** clica em "Continuar com Google" e autoriza o acesso, **Then** a conta é criada (se não existir) ou acessada, e o usuário é redirecionado para a área principal.
2. **Given** um usuário na tela de login/cadastro, **When** cancela o fluxo de autorização no Google, **Then** retorna à tela de login sem estar autenticado.

### Edge Cases

- O que acontece se o usuário tentar fazer login sem rede? (O sistema deve avisar sobre a falta de conexão).
- Como o sistema lida com múltiplas tentativas de login com senha incorreta? (Deve haver um bloqueio temporário ou validação adicional para evitar força bruta).
- O que acontece se o link de recuperação de senha expirar? (O usuário deve ser instruído a solicitar um novo link).
- O que acontece se o usuário já tiver uma conta criada com email e senha e tentar usar o Google com o mesmo email? (O sistema deve vincular a conta ou autenticar normalmente, conforme configuração do Supabase).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que usuários criem uma conta usando email e senha.
- **FR-002**: O sistema MUST permitir autenticação de usuários previamente registrados via email.
- **FR-003**: O sistema MUST oferecer um fluxo de recuperação de senha via email.
- **FR-004**: O sistema MUST permitir autenticação e cadastro rápido utilizando o login social do Google.
- **FR-005**: O sistema MUST manter a sessão do usuário entre as visitas no mesmo dispositivo.
- **FR-006**: O sistema MUST prover opções claras de logout para encerrar a sessão.

### Key Entities *(include if feature involves data)*

- **Usuário (User)**: Representa um jogador ou mestre no sistema, contendo identificador de autenticação.
- **Sessão (Session)**: Representa o período de tempo em que um usuário está ativamente autenticado no sistema.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Usuários conseguem realizar cadastro e login em menos de 1 minuto em condições normais.
- **SC-002**: Usuários não autenticados que tentam acessar rotas protegidas são redirecionados à tela de login em 100% dos casos.
- **SC-003**: Emails de recuperação de senha são entregues em até 2 minutos para 95% das solicitações válidas.

## Assumptions

- As validações de segurança (tempo de expiração do token, força da senha) seguirão os padrões da ferramenta de autenticação.
- O envio de emails (confirmação, recuperação) utilizará o serviço de email integrado.
- As credenciais de OAuth do Google (Client ID e Secret) serão devidamente configuradas no projeto do Supabase.
