# A imagem do mapa enviado fica no banco, numa tabela própria, e não no Storage

O Mestre envia imagens de mapa, que podem passar de 1 MB. O caminho natural seria um bucket do Supabase Storage, mas o projeto não usa o Storage: o gate de RLS (`scripts/check-rls.mjs`) só confere tabelas e funções de `public`, o Postgres descartável do `test:rls-db` não tem as tabelas de Storage (criadas pelo serviço `storage-api`) e a pilha do E2E (`scripts/e2e-stack.sh`) sobe sem esse serviço. Decidimos guardar a imagem como webp em base64 **numa tabela própria, fora do Realtime**, ligada ao mapa do Mestre e apagada junto com ele, como já se faz com o retrato do personagem. Cada aparelho baixa a imagem uma vez por mapa e a guarda em cache; os mapas prontos da Biblioteca ficam em `public/`, servidos pela Vercel, e não passam pelo banco.

## Considered Options

- **Bucket do Supabase Storage:** arquivo binário, cache do navegador e 1 GB à parte no plano gratuito. Pediria estender o `check-rls.mjs` para políticas de `storage.objects`, um esboço das tabelas de Storage no `test:rls-db`, o `storage-api` na pilha do E2E e uma limpeza do arquivo quando o mapa é apagado, porque o Storage não apaga em cascata.
- **Vercel Blob:** mais um serviço, outra credencial e outra regra de acesso fora do RLS.

## Consequences

- O base64 ocupa cerca de 33% a mais que o arquivo, e as imagens dividem os 500 MB do banco do plano gratuito (perto de 400 mapas de 1 MB).
- A tabela da imagem não entra na publicação do Realtime: a troca do Mapa atual manda só o id do mapa, e a imagem é lida à parte.
- Se o espaço apertar, migrar para o Storage é trocar a coluna da imagem por um caminho de arquivo e pagar as quatro adaptações acima.
