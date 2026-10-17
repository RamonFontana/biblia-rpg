# Conteúdo do jogo mora no repositório; o banco é espelho por seed

Itens e kits hoje existem duas vezes: no catálogo em código (`itemsDb.ts`, por slug) e na tabela `items` (por UUID, criada pelo app ao procurar o item pelo nome). Os dois já divergem (nomes diferentes, tipo de armadura só no catálogo, efeitos em `jsonb` livre). O autor sugeriu mover tudo para o banco com seeds. Decidimos que a **fonte é o repositório**: itens, kits, habilidades e Condições ficam em `src/content/`, tipados e validados por zod. A tabela `items` continua existindo, porque `character_items` aponta para ela, mas passa a ser preenchida só por uma migration de seed gerada a partir do conteúdo, com uma coluna `slug` igual ao id do conteúdo. A linha guarda identidade e exibição (slug, nome, descrição, preço, consumível); as regras (tipo de armadura, CA, Resistência a Condição, efeitos) o motor lê do conteúdo pelo slug. Habilidades e Condições não ganham tabela: seus ids já são as chaves gravadas nas fichas.

Assim o gate de dados e os testes do motor continuam valendo, toda mudança de conteúdo é um diff revisável, e a regra mora num lugar só.

## Considered Options

- Banco como fonte, com seeds SQL escritos à mão: o app leria tudo do banco, mas o conteúdo perderia a validação de tipos e os testes do motor dependeriam de fixtures copiadas do banco.
- Banco como fonte e o Mestre editando itens pelo app: útil para itens próprios da campanha, mas é uma feature, não uma refatoração. Se vier, entra como linhas marcadas `is_custom` sobre esta decisão (Onda 5).

## Consequences

- O app deixa de inserir em `items`; o RLS da tabela passa a negar insert pelo cliente.
- A coluna `items.effects` deixa de ser lida. Item Profano (`statPenalty`) vira efeito no conteúdo.
- Mudar o conteúdo exige um deploy e uma migration de seed, não uma edição no dashboard.
