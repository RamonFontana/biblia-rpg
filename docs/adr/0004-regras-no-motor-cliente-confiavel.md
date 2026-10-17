# As regras rodam no motor TypeScript e o banco confia no cliente

Hoje o celular do jogador calcula se um Teste passou (`is_approved`) e grava o resultado, e as políticas do banco permitem que qualquer usuário forje um resultado. A alternativa à prova de trapaça seria calcular a aprovação no banco, numa função SQL, com o cliente mandando só o dado. Decidimos que **as regras rodam no motor TypeScript** (`src/domain/`, uma função por regra, testável com seed fixa) **e o banco confia no cliente** quanto ao resultado. O RLS passa a garantir só quem pode escrever: o dono do personagem ou o Mestre da sessão.

O jogo é presencial entre amigos e os dados são físicos (ADR 0001): a trapaça possível já existe na mesa, e o Mestre vê cada rolagem. Escrever as regras em SQL as duplicaria ou as tiraria do alcance dos testes do motor.

## Considered Options

- Aprovação calculada no banco (função SQL): impede resultado forjado, mas duplica a regra do Teste de Fé (Fé Efetiva, Itens Profanos, Modificador de Fé) em SQL ou move o motor inteiro para o banco.

## Consequences

- Um jogador com conhecimento técnico pode gravar um resultado falso para o próprio personagem; o Mestre continua vendo o dado e o total.
- Colunas sensíveis de `characters` (nível, `is_dead`) seguem editáveis pelo dono; não há trava coluna a coluna.
- Se o app um dia tiver partidas entre desconhecidos, esta decisão deve ser revista.
