-- RLS (Onda 3, passo 7): as 27 políticas que valiam para o papel public (e portanto também para
-- anon) passam a valer só para authenticated. Nenhuma expressão muda: o que já exigia login (uid,
-- papel ou função de Mestre) segue igual; para anon, que não tem login, a consulta passa a voltar
-- vazia sem avaliar as funções auxiliares (o que permite tirar o EXECUTE de anon delas).

alter policy "Character items viewable by session participants" on public.character_items to authenticated;
alter policy "GM can update session participant characters" on public.characters to authenticated;
alter policy "Players can update own characters during active session" on public.characters to authenticated;
alter policy "Users can delete their own characters if not in session" on public.characters to authenticated;
alter policy "Users can insert their own characters" on public.characters to authenticated;
alter policy "Users can update their own characters" on public.characters to authenticated;
alter policy "Users can view their own characters" on public.characters to authenticated;
alter policy "GMs can manage combat participants" on public.combat_participants to authenticated;
alter policy "Users can view combat participants" on public.combat_participants to authenticated;
alter policy "GMs can manage combats" on public.combats to authenticated;
alter policy "Users can view combats for their sessions" on public.combats to authenticated;
alter policy "GMs can create sessions" on public.game_sessions to authenticated;
alter policy "GMs can update their sessions" on public.game_sessions to authenticated;
alter policy "Users can view sessions they are part of or created" on public.game_sessions to authenticated;
alter policy "Items are viewable by everyone" on public.items to authenticated;
alter policy "Kit items are viewable by everyone" on public.kit_items to authenticated;
alter policy "GMs can manage session enemies" on public.session_enemies to authenticated;
alter policy "Users can view session enemies" on public.session_enemies to authenticated;
alter policy "GMs can manage session npcs" on public.session_npcs to authenticated;
alter policy "Users can view session npcs" on public.session_npcs to authenticated;
alter policy "GMs can manage session participants" on public.session_participants to authenticated;
alter policy "Users can join sessions they are invited to" on public.session_participants to authenticated;
alter policy "Users can view session participants" on public.session_participants to authenticated;
alter policy "Session participants can view trade items" on public.trade_items to authenticated;
alter policy "Trade participants can manage trade items" on public.trade_items to authenticated;
alter policy "Session participants can view trades" on public.trades to authenticated;
alter policy "Trade participants and GM can update trades" on public.trades to authenticated;
