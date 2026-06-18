# Feature Specification: Merge Enemy Creation Forms

**Feature Branch**: `[025-enemy-form-merge]`

**Created**: 2026-06-18

**Status**: Draft

**Input**: User description: "Quando falei para adicionar os atrubitos nos inimigos estava falndo da criação dos inimigos na sessão. Porem, gostei da ideia de adicionar inmigos no meio da sessão, só que precisa mesclar os 2 formulário, dando opção de adcionar atributos e a imagem no formulário que está no print e no forumlário que vc criou, criar um select de preset de inimigo. DE fato o inimigo não precisa de tribo (raça), mas precisa adicionar habilidades e vocação (classe) para ele"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unified Enemy Creation Form Component (Priority: P1)

Como Mestre, eu quero que o formulário de criação de inimigos seja o mesmo e padronizado em todo o sistema (tanto ao criar a sessão quanto dentro da sessão ativa), para que a experiência seja consistente.

**Why this priority**: A padronização evitará duplicação de código e garantirá que o usuário tenha todas as opções disponíveis independente de quando está criando o inimigo.

**Independent Test**: Pode ser testado verificando se o formulário exibido na etapa 2 da criação de sessão é o mesmo utilizado no diálogo de criação de inimigos dentro da sessão ativa.

**Acceptance Scenarios**:

1. **Given** que o mestre está no assistente de criação de sessão (passo de inimigos), **When** ele for adicionar um inimigo, **Then** o formulário deve exibir campos para Nome, Vocação (classe), Habilidades, Seleção de Preset (Bestiário), HP Atual/Máximo, upload de Imagem base64 e atributos base.
2. **Given** que o mestre está na sessão ativa, **When** ele clicar em "Novo Inimigo", **Then** o modal deve exibir os mesmos campos descritos acima.

---

### User Story 2 - Ajuste dos Campos do Inimigo (Priority: P2)

Como Mestre, eu quero que o formulário não peça "Tribo (Raça)", mas sim permita a escolha de "Vocação (Classe)" e a definição de "Habilidades", além de poder importar dados de um preset do bestiário.

**Why this priority**: Ajusta o modelo mental e de domínio, já que os inimigos não seguem estritamente as regras de Tribo dos jogadores, mas possuem habilidades e vocações que afetam o combate.

**Independent Test**: Pode ser testado criando um novo inimigo e verificando que a Tribo não é solicitada e que as Habilidades e a Vocação foram salvas corretamente.

**Acceptance Scenarios**:

1. **Given** que estou preenchendo o formulário de inimigo, **When** eu busco o campo Tribo, **Then** ele não deve existir.
2. **Given** o mesmo formulário, **When** eu selecionar um inimigo base (preset), **Then** os campos do formulário (nome, atributos, PV) devem ser preenchidos automaticamente com os dados do bestiário.

---

### Edge Cases

- What happens when o usuário troca de preset após já ter modificado alguns campos (como HP ou imagem)? O sistema deve sobrescrever apenas os campos que vêm do preset, idealmente avisando ou simplesmente substituindo sem afetar o nome se o mestre digitou, ou o Mestre pode refazer a escolha.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST fornecer um componente único/reutilizável para o formulário de inimigo, que englobe a lógica de estado.
- **FR-002**: O formulário MUST conter um select de "Base (Bestiário)" que carregue dados pré-definidos caso um seja selecionado.
- **FR-003**: O formulário MUST incluir os campos de atributos (FOR, DES, CON, INT, SAB, CAR), HP Máximo e Atual.
- **FR-004**: O formulário MUST incluir o campo de upload de imagem (base64).
- **FR-005**: O formulário MUST excluir o campo "Tribo (Raça)" para Inimigos.
- **FR-006**: O formulário MUST incluir os campos "Vocação (Classe)" e "Habilidades".
- **FR-007**: O sistema MUST integrar esse formulário unificado na página de Criação de Sessão (`SessionStepEnemies.tsx` ou equivalente).
- **FR-008**: O sistema MUST integrar esse formulário unificado no modal da Sessão Ativa (`CreateEnemyDialog.tsx`).

### Key Entities *(include if feature involves data)*

- **Enemy (Character with is_enemy=true)**: Representa o inimigo, contendo `stats` (PV, CA, atributos), `vocation` (classe), `skills` (habilidades) e `avatar_url` (imagem base64). Sem o campo `tribe`.
- **Bestiary Preset**: A entidade base da qual o inimigo puxa suas informações iniciais (caso selecionada).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O código não possui duplicação de formulários para criação de inimigos.
- **SC-002**: O Mestre consegue criar um inimigo completo (com imagem e atributos personalizados) durante a criação da sessão.
- **SC-003**: O Mestre consegue criar um inimigo a partir de um preset do bestiário dentro da sessão ativa.

## Assumptions

- O Bestiário já existe ou os presets de inimigos são providos por alguma lista prévia no banco de dados (provavelmente a tabela `items` de categoria ou `npcs` baseados ou tabela `bestiary`). [I will assume `items` or `characters` with `is_template=true` or similar is used, need to verify implementation of `SessionStepEnemies` to see where presets come from].
- A imagem em `base64` já está funcional, baseada na implementação anterior.
