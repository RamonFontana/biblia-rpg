# Phase 1: Data Model & Contracts

**Feature**: Regras de Personagem e Bestiário

Esta seção descreve os "modelos de dados" em formato Markdown que serão seguidos na criação dos novos documentos.

## Modelo: Ficha de Criação de Personagem
Estrutura do documento `criacao-de-personagem.md`:
1. **Introdução**: Propósito do guia.
2. **Passos Numéricos**:
   - 1. Tribo e Vocações (com restrições de Levi).
   - 2. Geração de Atributos (métodos permitidos).
   - 3. Escolha de Fortalezas e Tentações (link para o documento respectivo).
   - 4. Cálculos Iniciais (HP, CA, Fé).
   - 5. Equipamentos (Quantidades de itens e shekels).
3. **Pacotes Iniciais**: Listas sugeridas de equipamentos por Vocação.

## Modelo: Entrada de Bestiário (Stat Block)
Formato padrão que todas as criaturas na pasta `docs/bestiario/` devem seguir:

```markdown
### Nome da Criatura
*Tamanho, Tipo, Tendência*

- **Classe de Armadura (CA)**: X (tipo de armadura)
- **Pontos de Vida (PV)**: X (dados)
- **Deslocamento**: X m

| FOR | DES | CON | INT | SAB | CAR |
|:---:|:---:|:---:|:---:|:---:|:---:|
| X (+Y) | X (+Y) | X (+Y) | X (+Y) | X (+Y) | X (+Y) |

- **Resistências / Imunidades**: [Lista]
- **Perícias**: [Lista]
- **Sentidos**: [Percepção passiva, etc]
- **Nível de Desafio / XP**: X (Y XP)

**Passivas / Habilidades**
- **Nome da Passiva**: Efeito.

**Ações**
- **Ataque XYZ**: *Ataque Corpo a Corpo:* +X para acertar, alcance Y m, um alvo. *Dano*: Z (dados) [tipo de dano].
```

## Modelo: Template Endemoniado
- **Gatilho de Aplicação**: Pode ser aplicado a humanos ou feras.
- **Alterações de Atributos**: Ex: +4 FOR, +4 CON, -4 INT.
- **Resistências ganhas**: Imunidade a dano contundente de armas não consagradas.
- **Novas Ações**: Ações caóticas, perda de controle, ou regeneração corrompida.
- **Fraquezas**: Sofrem Dano Espiritual/Físico ao interagir com o Sistema de Fé ou exorcismos.
