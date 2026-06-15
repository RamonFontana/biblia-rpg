# Research: Completar Sistema Base do RPG Bíblico

**Feature**: `004-completar-sistema-base`  
**Date**: 2026-06-15

---

## R1. Estado Atual das Vocações — O que Já Existe vs O que Falta

### Análise

Todas as 4 vocações já possuem habilidades definidas para os 5 marcos de progressão (Níveis 2, 6, 10, 14, 18). A pesquisa nos arquivos existentes revela:

| Vocação | Nível 2 | Nível 6 | Nível 10 | Nível 14 | Nível 18 | Status |
|---------|---------|---------|----------|----------|----------|--------|
| Guerreiro | ✅ Postura de Batalha + Surto de Ação | ✅ Ataque Extra + Determinação | ✅ Vigor do Defensor + Bloqueio | ✅ Ataque Extra Superior | ✅ Grito de Guerra | **COMPLETO** |
| Batedor | ✅ Ataque Furtivo 1d6 + Agilidade | ✅ Furtivo 3d6 + Evasão | ✅ Furtivo 5d6 + Mente Escorregadia | ✅ Furtivo 7d6 + Golpe Incapacitante | ✅ Furtivo 9d6 + Lâmina Fantasma | **COMPLETO** |
| Caçador | ✅ Inimigo Favorecido + Estilo | ✅ Ataque Extra + Explorador | ✅ Tiro Multiplicado / Besta | ✅ Fuga Engenhosa | ✅ Sentidos de Predador | **COMPLETO** |
| Sacerdote | ✅ Súplica Curativa + Autoridade | ✅ Purificação + Jejum | ✅ Intervenção Menor + Súplica Aprimorada | ✅ Barreira de Fé + Retribuição | ✅ Intervenção Maior + Servo Consagrado | **COMPLETO** |

### Decision

As vocações estão **100% completas** nos marcos de nível. O FR-001 da spec já está satisfeito pelo conteúdo existente. Ação remanescente: revisar redação para garantir que cada habilidade caiba em ≤3 linhas (FR-002) e validar compatibilidade com tribos (FR-003).

### Rationale

Economiza tempo; evita retrabalho em conteúdo que já existe e funciona.

### Alternatives Considered

- Reescrever todas as vocações do zero → Rejeitado: conteúdo existente é sólido e completo.
- Apenas validar sem ajustar redação → Rejeitado: algumas descrições ultrapassam 3 linhas, o que violaria FR-002.

---

## R2. Lista de Bênçãos/Milagres do Sacerdote — O que Existe vs O que Falta

### Análise

O Sacerdote em `sacerdote.md` já possui habilidades mecânicas que funcionam como "milagres" embutidos na progressão (Súplica Curativa, Purificação, Intervenção Divina). Porém, **não existe uma lista dedicada e organizada de Bênçãos/Milagres** que o jogador possa consultar rapidamente na mesa.

Habilidades existentes que já são "milagres" de fato:
1. **Súplica Curativa** (Nível 2): 1d8 + SAB HP + 1d4 Fé — 3/Descanso Longo
2. **Purificação** (Nível 6): Remove Amedrontado/Atordoado/Envenenado/Possessão — 1/Descanso Curto
3. **Súplica Curativa Aprimorada** (Nível 10): 3d8 + SAB HP + 1d6+2 Fé
4. **Intervenção Divina Menor** (Nível 10): Milagre narrativo via d100
5. **Retribuição Divina** (Nível 14): 2d10 + SAB dano reativo
6. **Barreira de Fé** (Nível 14): Resistência psíquica/espiritual aura
7. **Intervenção Divina Maior** (Nível 18): Milagre narrativo absoluto

### Decision

Criar uma **seção "Bênçãos e Milagres"** no arquivo `sacerdote.md` que consolide as habilidades existentes + adicione 3-5 novas bênçãos menores para dar versatilidade ao Sacerdote de nível baixo (1-6). Total: 10-12 entradas. Formato de tabela para consulta rápida.

Bênçãos novas a criar (baseadas em eventos bíblicos):
1. **Imposição de Mãos** — cura menor fora de combate
2. **Oração de Proteção** — bônus temporário de CA para aliado
3. **Repreensão Divina** — expulsar/assustar endemoniado
4. **Guia Espiritual** — vantagem em teste de Sabedoria para aliado
5. **Consagração** — purificar área contra influência demoníaca

### Rationale

A lista consolida tudo em um lugar, adiciona versatilidade para sessões de níveis 1-6 (onde a maioria dos grupos joga), e facilita consulta rápida pelo jogador leigo.

### Alternatives Considered

- Criar um arquivo separado `docs/milagres.md` → Rejeitado: fragmenta informação; melhor manter junto da vocação.
- Não criar bênçãos novas, apenas reorganizar → Rejeitado: Sacerdote de nível 1-5 tem pouca versatilidade.

---

## R3. Bestiário — Inventário Atual e Lacunas

### Análise

Inimigos existentes nos arquivos do bestiário:

| # | Nome | Categoria | ND | Arquivo |
|---|------|-----------|-----|---------|
| 1 | Bandido do Deserto | Humano | 1/8 | inimigos-humanos.md |
| 2 | Soldado Filisteu | Humano | 1/2 | inimigos-humanos.md |
| 3 | General de Guerra | Humano | 3 | inimigos-humanos.md |
| 4 | Víbora do Deserto | Animal | 1/8 | animais-selvagens.md |
| 5 | Leão da Judeia | Animal | 1 | animais-selvagens.md |
| 6 | Urso Pardo Sírio | Animal | 1 | animais-selvagens.md |
| 7 | Guerreiro Anakim (Golias) | Sobrenatural/Gigante | 5 | gigantes.md |

**Total atual: 7 inimigos.** Faltam no mínimo 3 para atingir o requisito de 10 (FR-007).

### Lacunas identificadas por categoria (FR-007 exige mín. 4 humanos, 2 animais, 2 sobrenaturais):

- **Humanos**: 3 existem, falta 1 → Adicionar **Arqueiro/Sentinela** (ND 1/4, combate à distância)
- **Animais**: 3 existem (acima do mínimo) → ✅ OK
- **Sobrenaturais**: 1 existe (Anakim), falta 1 → Adicionar **Endemoniado Comum** (aplicação do template a um humano base, como exemplo pronto de uso)

### Decision

Adicionar 3 inimigos novos para chegar a 10 total:
1. **Sentinela Amalequita** (Humano, ND 1/4) — arqueiro/vigia leve
2. **Sacerdote de Baal** (Humano, ND 2) — inimigo de Fé, herege
3. **Endemoniado Comum** (Sobrenatural, ND 2) — exemplo pronto do template

### Rationale

Cobre a faixa de ND 1/8 a 5, oferece variedade tática (corpo-a-corpo, distância, espiritual) e inclui um exemplo pronto do template de endemoniado.

### Alternatives Considered

- Criar 5+ inimigos novos → Rejeitado: excede o escopo de simplicidade; 10 é suficiente.
- Criar apenas 2 → Rejeitado: não cobriria a lacuna do Sacerdote de Baal (inimigo de Fé), que é essencial para o tema.

---

## R4. Guia Rápido do Mestre — Estrutura e Conteúdo

### Análise

Não existe nenhum guia para o Mestre no projeto. O material atual assume que o Mestre já sabe jogar D&D 5e. Para Mestres iniciantes, falta orientação sobre:
- Quando pedir testes de Fé
- Como usar Fortalezas e Tentações na narrativa
- Quanto dar de recompensa (loot/moedas)
- Ideias de aventura no cenário bíblico

### Decision

Criar `docs/guia-do-mestre.md` com as seguintes seções (≤150 linhas):

1. **A Regra de Ouro** (~10 linhas) — Como arbitrar o sobrenatural e manter o clima
2. **Usando Fé, Fortalezas e Tentações** (~25 linhas) — Gatilhos narrativos, CDs sugeridas, exemplos
3. **Recompensas por Nível de Desafio** (~15 linhas) — Tabela simples de loot (moedas + itens)
4. **5 Ganchos de Aventura Prontos** (~40 linhas) — Mini-cenários de 2-3 linhas cada
5. **Dicas de Combate para Iniciantes** (~15 linhas) — Como montar encontros balanceados

### Rationale

Formato curto e prático; Mestre pode imprimir e ter na mão durante a sessão.

### Alternatives Considered

- Guia extenso de 10+ páginas → Rejeitado: viola diretriz de simplicidade.
- Não criar guia, apenas adicionar notas nos regras-base → Rejeitado: mistura referência de regra com orientação narrativa.

---

## R5. Condições de Combate Faltantes — Análise e Referência

### Análise

Condições existentes em `regras-base.md`:
1. Sangrando ✅
2. Atordoado ✅
3. Amedrontado ✅
4. Envenenado ✅

Condições faltantes mais usadas em combate (referência D&D 5e simplificada):
- **Caído (Prone)**: Usado pelo Leão (Salto e Bote) e ataques de investida
- **Agarrado (Grappled)**: Não existe nas regras, mas é intuitivo em combate
- **Cego (Blinded)**: Necessário para combate em cavernas/noite

### Decision

Adicionar 3 condições ao `regras-base.md` seção 6.4, no mesmo formato das existentes:
- **Caído**: Ataques a até 1,5m têm Vantagem; ataques à distância têm Desvantagem. Levantar custa metade do movimento.
- **Agarrado**: Deslocamento cai para 0. Escapar exige teste de Atletismo ou Acrobacias contra Atletismo do agarrador.
- **Cego**: Falha em testes que exijam visão. Ataques têm Desvantagem. Ataques contra você têm Vantagem.

Adicionar nota de bom senso no final da seção.

### Rationale

Simplificação máxima das condições do D&D 5e para 1-2 linhas cada, cobrindo os cenários mais comuns sem sobrecarregar.

### Alternatives Considered

- Adicionar 6+ condições (Surdo, Paralisado, Contido, etc.) → Rejeitado: excesso para jogo simples.
- Não adicionar nenhuma, referenciar D&D → Rejeitado: viola princípio de autocontido e força consulta externa.
