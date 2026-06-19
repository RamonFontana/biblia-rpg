# Quickstart: combat-system

## Pré-requisitos para Testar

1. **Dependências**: Certifique-se de ter as ferramentas instaladas:
   - `npm install` (Para instalar Zustand, Zod, React Hook Form, etc).
   - Componentes do Shadcn UI (já instalados ou devem ser adicionados: `npx shadcn-ui@latest add form input button dialog card badge`).

2. **Banco de Dados (Supabase)**:
   - Aplique as migrations que criam as tabelas `combats` e `combat_participants` (essas serão geradas na fase de implementação).
   - Habilite o **Realtime** no Dashboard do Supabase para as tabelas `combats` e `combat_participants`.

## Fluxo de Teste Manual

Para validar se o sistema foi integrado perfeitamente seguindo as melhores práticas:

1. **Abra duas janelas (ou abas anônimas)**:
   - Janela 1: Logado com conta de **Mestre**.
   - Janela 2: Logado com conta de **Jogador**.

2. **Crie um Combate (Mestre)**:
   - Vá até a sessão atual.
   - Abra o Modal de "Novo Combate" (Desenvolvido com React Hook Form + Zod).
   - Adicione o jogador da Janela 2 e um Inimigo de teste.
   - Preencha a iniciativa e inicie.

3. **Verifique o Realtime**:
   - A Janela 2 (Jogador) deve atualizar instantaneamente para a visão de Combate, mostrando de quem é o turno.

4. **Gerenciamento de Turnos e Checklist**:
   - Se for o turno do Jogador, clique nos Checkboxes de "Movimento" e "Ação" na Janela 2. O estado deve refletir na tela, mas sem bloquear comandos do Mestre.
   - Na Janela 1 (Mestre), avance o turno.
   - Verifique se a Janela 2 é atualizada e perde o destaque visual do turno.
   - Quando a rodada voltar ao jogador, seus checkboxes de Movimento e Ação devem resetar para o estado inicial (vazios).

5. **Modificadores (Mestre)**:
   - Na Janela 1, clique no Jogador e aplique 5 de dano usando o formulário modal validado por Zod.
   - Verifique na Janela 2 se o HP do Jogador reduziu instantaneamente.
