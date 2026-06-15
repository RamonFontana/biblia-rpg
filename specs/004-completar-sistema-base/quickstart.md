# Quickstart: Completar Sistema Base do RPG Bíblico

**Feature**: `004-completar-sistema-base`  
**Date**: 2026-06-15

---

## Visão Geral

Esta feature fecha as 5 lacunas para o jogo rodar sem consulta externa. Ao final, o projeto terá:

1. ✅ Vocações com redação revisada (≤3 linhas por habilidade)
2. ✅ Lista de 10-12 Bênçãos/Milagres do Sacerdote com custo de Fé
3. ✅ Bestiário com 10 inimigos prontos (7 existentes + 3 novos)
4. ✅ Guia Rápido do Mestre (≤150 linhas)
5. ✅ 7 condições de combate no total (4 existentes + 3 novas)

## Ordem de Execução Recomendada

```text
1. Condições de combate (regras-base.md)     ← dependência base para tudo
2. Vocações — revisão de redação             ← referência para milagres
3. Lista de Bênçãos/Milagres (sacerdote.md)  ← usa condições + vocação
4. Bestiário — 3 novos inimigos              ← usa condições
5. Guia Rápido do Mestre                     ← referencia tudo acima
```

## Arquivos a Modificar

| Arquivo | Ação | Escopo |
|---------|------|--------|
| `docs/regras-base.md` | MODIFY | Adicionar Caído, Agarrado, Cego + nota bom senso (seção 6.4) |
| `docs/vocacoes/guerreiro.md` | REVIEW | Verificar ≤3 linhas por habilidade |
| `docs/vocacoes/batedor.md` | REVIEW | Verificar ≤3 linhas por habilidade |
| `docs/vocacoes/cacador.md` | REVIEW | Verificar ≤3 linhas por habilidade |
| `docs/vocacoes/sacerdote.md` | MODIFY | Adicionar seção de Bênçãos/Milagres |
| `docs/bestiario/inimigos-humanos.md` | MODIFY | Adicionar Sentinela Amalequita + Sacerdote de Baal |
| `docs/bestiario/animais-selvagens.md` | REVIEW | Já tem 3 animais — OK |
| `docs/bestiario/endemoniado-comum.md` | NEW | Exemplo pronto do template |
| `docs/bestiario/README.md` | MODIFY | Atualizar índice |
| `docs/guia-do-mestre.md` | NEW | Guia completo (≤150 linhas) |

## Critérios de Pronto

- [ ] Todas as habilidades de vocação ≤3 linhas
- [ ] 10-12 Bênçãos/Milagres com custo de Fé e efeito claro
- [ ] ≥10 inimigos no bestiário com fichas completas
- [ ] Guia do Mestre ≤150 linhas com 5 ganchos de aventura
- [ ] 7 condições de combate no regras-base.md
- [ ] Constitution check pós-design: ✅
