# 07: Mapas do Mestre: envio e recorte em Quadrados

**What to build:** na web, o Mestre envia uma imagem de até 20 MB, vê a imagem por baixo do grid, arrasta e amplia até as linhas baterem com o desenho e escolhe colunas × linhas inteiras. O mapa salvo (webp de até 2048 px no lado maior) é dele e aparece no Painel Mapas e no passo do assistente de qualquer sessão dele. Ele renomeia e apaga os próprios mapas; o app recusa apagar um mapa usado por sessão ativa. No celular, envio e recorte aparecem como "na web".

**Blocked by:** 01, 03, 04

**Status:** ready-for-agent

- [ ] Migration: mapas do Mestre (dono, nome, colunas, linhas, linhas do grid) e a imagem numa tabela própria fora do Realtime (ADR 0010), apagada em cascata; o mapa da sessão passa a poder apontar para um mapa do Mestre (exatamente uma origem); RLS: só o dono escreve, participantes de sessão que usa o mapa leem, estranho não lê; bloqueio de apagar mapa usado por sessão ativa; `gen:types`; `rls.sql` por papel.
- [ ] Editor de recorte reaproveita a transformação de vista do ticket 03 e a compressão do ticket 01; sempre devolve colunas e linhas inteiras (teste de componente).
- [ ] A imagem é lida à parte, por id, com cache imutável; a troca do Mapa atual não carrega a imagem pelo Realtime.
- [ ] "Meus mapas" no seletor do Painel e do assistente; renomear e apagar.
- [ ] Recusa arquivo acima de 20 MB e que não seja imagem, com o motivo.
- [ ] E2E (web): enviar uma imagem pequena, recortar, somar à sessão e mostrar.
