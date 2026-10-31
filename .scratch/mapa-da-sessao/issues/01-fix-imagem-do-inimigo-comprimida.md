# 01: fix: imagem do inimigo comprimida como o retrato

**What to build:** quando o Mestre escolhe a imagem de um inimigo (no assistente de criação da sessão ou ao criar um inimigo durante o jogo), ela é reduzida e gravada em webp como o retrato do personagem, em vez do arquivo cru. A compressão passa a ser um utilitário único, que o recorte do mapa (ticket 07) vai reaproveitar.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Teste de caracterização da compressão atual do retrato do personagem antes de extraí-la (mesmas dimensões máximas e qualidade).
- [x] A compressão vira um utilitário único, com o tamanho máximo e a qualidade como parâmetros; o retrato do personagem continua igual.
- [x] O formulário de inimigo do assistente e o diálogo de criar inimigo gravam a imagem comprimida.
- [x] Imagens já gravadas não mudam.
- [x] Commit `fix:` separado; `npm run check` passa.
