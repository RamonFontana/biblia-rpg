# Quickstart: Listagem e CRUD de Personagens

Este documento resume a intenção da feature.

## Objetivo
Implementar a página de listagem de personagens e a interface de visualização/edição, travando a edição caso o personagem já tenha participado de uma sessão.

## Arquivos Chaves (Estimativa)
- `src/features/character-management/api/useCharacters.ts`
- `src/features/character-management/pages/CharacterList.tsx`
- `src/features/character-management/pages/CharacterDetails.tsx`
- `src/App.tsx` (Adição das rotas e navegação na Home)

## Supabase
Serão criadas as Policies RLS no Supabase para garantir o acesso restrito e o bloqueio de edição.
