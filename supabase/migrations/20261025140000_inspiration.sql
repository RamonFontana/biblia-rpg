-- Inspiração (Onda 5): o Inabalável tem uma por dia da sessão. A ficha guarda o dia (e a sessão) em
-- que a usou, e o dia novo a devolve pela comparação com o dia atual: nada precisa ser zerado. A
-- sessão evita que o "dia 3" de uma sessão valha como o "dia 3" de outra.
--
-- `session_test_results.inspiration_used` registra que o jogador gastou a Inspiração naquele Teste
-- (a Vantagem entra na modalidade aplicada). O dono da ficha já grava a própria ficha e o próprio
-- resultado pelas políticas existentes; as colunas novas não pedem política nova.

alter table public.characters
  add column inspiration_used_day integer,
  add column inspiration_session_id uuid references public.game_sessions (id) on delete set null;

alter table public.session_test_results
  add column inspiration_used boolean not null default false;
