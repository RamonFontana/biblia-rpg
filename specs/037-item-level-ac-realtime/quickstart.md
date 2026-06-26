# Quickstart: Item Level & Real-time AC

Este guia provê os passos para rodar ou verificar as mudanças localmente.

## 1. Migração do Banco de Dados
A feature necessita aplicar a migração de banco de dados para incluir as novas colunas nas tabelas `character_items` e `trade_items`.
Para rodar localmente (via Supabase CLI, se disponível):
```bash
npx supabase migration up
# ou equivalente para o projeto atual
```
Caso contrário, o script SQL contido nos pull requests deve ser executado pelo administrador.

## 2. Geração de Tipos
Como o esquema mudou, os tipos TypeScript precisam ser gerados novamente (se o projeto utilizar gerador automático do Supabase):
```bash
npx supabase gen types typescript --local > src/types/database.types.ts
```
*(Assegure-se de que `level` esteja mapeado na interface `CharacterItem` e `TradeItem`)*

## 3. Rodando o Projeto
Inicie o servidor de desenvolvimento normal:
```bash
npm run dev
```

## 4. Como testar a Feature
1. Abra duas janelas do navegador (uma logada como Mestre e outra como Jogador do Personagem X).
2. Na aba do Jogador, abra a ficha e visualize a aba "Inventário". Verifique se a armadura possui Nível 1.
3. Na aba do Mestre, acesse o mesmo personagem, vá no Inventário e altere o Nível da armadura para 3.
4. Volte para a aba do Jogador. A armadura deve exibir "Nível 3" sem precisar recarregar a tela.
5. Na aba do Jogador, equipe a armadura nível 3.
6. A CA do personagem na tela principal (e na tela do mestre) deve refletir imediatamente a CA Base + Bônus de Destreza + 2 (bônus pelo nível 3).
