# Data Model: Completar Sistema Base do RPG Bíblico

**Feature**: `004-completar-sistema-base`  
**Date**: 2026-06-15

---

## Entidades

### 1. Bênção / Milagre

Poder sobrenatural bíblico exclusivo do Sacerdote, usado via Barra de Fé.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Nome | Texto | Nome temático bíblico (ex: "Súplica Curativa") |
| Nível Mínimo | Inteiro (1-18) | Nível da vocação necessário para usar |
| Custo de Fé | Inteiro ou Fórmula | Pontos de Fé gastos ao usar (ex: 5, 10) |
| Usos | Texto | Frequência (ex: "3/Descanso Longo", "1/Descanso Curto") |
| Ação | Texto | Tipo de ação gasta (Ação, Ação Bônus, Reação) |
| Efeito | Texto (≤3 linhas) | Descrição mecânica direta |
| Referência Bíblica | Texto (opcional) | Evento inspirador (ex: "Eliseu cura Naamã") |

**Regras de validação**:
- Custo de Fé nunca pode ser 0 (todo milagre tem custo)
- Efeito não pode referenciar magia arcana
- Se Fé do Sacerdote = 0 (Ruptura), todos os milagres falham automaticamente

**Estado**: Milagre não possui transições de estado — é usado e consome Fé.

---

### 2. Stat Block de Inimigo

Perfil mecânico de criatura ou pessoa para o Mestre usar em encontros.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Nome | Texto | Nome da criatura (ex: "Soldado Filisteu") |
| Tamanho | Enum | Miúdo, Pequeno, Médio, Grande, Enorme |
| Tipo | Texto | Humano, Fera, Humanoide (Gigante), etc. |
| Alinhamento | Texto | Ex: "Leal e Mau" |
| CA | Inteiro + Texto | Valor + fonte (ex: "14 (Cota de escamas)") |
| PV | Fórmula | Média + dados (ex: "16 (3d8 + 3)") |
| Deslocamento | Texto | Ex: "9 m" |
| Atributos | 6 × Inteiro | FOR, DES, CON, INT, SAB, CAR com modificadores |
| ND / XP | Texto | Nível de Desafio e XP (ex: "1/2 (100 XP)") |
| Perícias | Lista de Texto | Ex: "Atletismo +4" |
| Sentidos | Texto | Ex: "Percepção passiva 10" |
| Passivas | Lista (máx. 2) | Habilidades constantes ou engatilhadas |
| Ações | Lista | Ataques com bônus, alcance e dano |
| Contexto | Texto (1 linha) | Frase de ambientação para o Mestre |

**Regras de validação**:
- ND deve ser compatível com grupo de 4 personagens do nível indicado
- Armas devem ser da Idade do Bronze/Ferro (sem pólvora, sem magia)
- Máximo 2 habilidades passivas (simplicidade)

---

### 3. Condição de Combate

Estado temporário aplicado a personagens ou inimigos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Nome | Texto | Nome da condição (ex: "Caído") |
| Efeito | Texto (≤2 linhas) | Impacto mecânico direto |
| Como encerrar | Texto (1 linha) | Ação necessária para sair da condição |

**Regras de validação**:
- Efeito deve ser resolvível sem consulta externa
- Sem referência a magias ou itens mágicos

---

### 4. Gancho de Aventura (Guia do Mestre)

Mini-cenário pronto para o Mestre usar como ponto de partida.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Título | Texto | Nome do gancho (ex: "O Ídolo Roubado") |
| Premissa | Texto (2-3 linhas) | Situação, conflito e objetivo |
| ND Sugerido | Texto | Faixa de nível do grupo (ex: "Níveis 1-3") |
| Pilares Envolvidos | Lista | Combate, Exploração, Fé, Diplomacia |

---

## Relacionamentos

```text
Vocação (Sacerdote) ──1:N──► Bênção/Milagre
                              │
                              └── depende de ──► Barra de Fé (0-100)

Bestiário ──1:N──► Stat Block de Inimigo
                    │
                    └── pode receber ──► Template Endemoniado (modificador)

Regras Base ──1:N──► Condição de Combate

Guia do Mestre ──1:N──► Gancho de Aventura
```
