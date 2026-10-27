-- Dados de Vida (Onda 5): o personagem tem tantos Dados de Vida quanto o nível, no dado da Vocação.
-- O total não é gravado (é o nível); a ficha guarda só quantos já foram gastos. O dono grava a
-- própria ficha e o Mestre grava as fichas da sessão pelas políticas existentes, então as colunas
-- novas não pedem política nova.
--
-- `last_short_rest_recharge` guarda a identidade do último Descanso Curto em que o personagem
-- recarregou as Habilidades (ADR 0006), para a recarga acontecer uma vez por descanso.

alter table public.characters
  add column hit_dice_spent integer not null default 0 check (hit_dice_spent >= 0),
  add column last_short_rest_recharge text;
