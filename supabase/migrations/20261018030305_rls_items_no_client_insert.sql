-- RLS (Onda 3, passo 7): items.
-- Os itens vêm do seed gerado do conteúdo (ADR 0003) e o app não insere mais em items; a política
-- que deixava qualquer usuário logado criar itens sai. Só a migration de seed escreve na tabela.

drop policy "Users can insert items" on public.items;
