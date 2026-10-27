# 01: Habilidade sem TR aplica Condição (tracer bullet)

**What to build:** no combate, o jogador abre o painel de uso de uma Habilidade com efeito, marca os alvos entre os participantes e usa. O app gasta o uso e a Fé, marca o espaço do turno (Reação vale fora do turno) e aplica a Condição na hora, depois da Resistência a Condição e das imunidades de Habilidade passiva, com a duração em rodadas. O histórico do combate passa a mostrar ataques e usos de Habilidade juntos. Cobre Palavra de Autoridade, Golpe Sísmico e Retribuição Divina.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Esquema do conteúdo com efeito estruturado (alvo, TR opcional, Condições com duração, remoção); os ids não mudam; o gate de dados valida
- [x] As três Habilidades ganham o efeito; o texto continua
- [x] Motor: uso permitido ou bloqueado (combate ativo, turno, espaço usado, Reação fora do turno), duração em rodadas, Resistência a Condição e as quatro imunidades
- [x] Migration: tabela de histórico de usos (sem escrita direta) e função `SECURITY DEFINER` de registrar o uso (ADR 0007), com teste por papel em `rls.sql`
- [x] Painel de uso do jogador, resultado à vista e histórico unificado com os ataques
- [x] E2E: o jogador usa Palavra de Autoridade e o alvo fica Paralisado
