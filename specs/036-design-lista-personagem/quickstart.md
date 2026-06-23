# Quickstart: Character List Design

Para visualizar e testar o novo design da listagem de personagens:

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse a rota de personagens (geralmente `/characters` ou via navegação na interface).

3. Verifique os seguintes pontos:
   - A página apresenta o título "Meus Personagens" estilizado com a temática correta (text-stone-200/amber-100).
   - O botão "Novo Personagem" está destacado com uma cor metálica/terrosa (ex: fundo amber-700).
   - Os cards de personagem estão com fundo rústico (`bg-stone-900`) e bordas suaves (`border-amber-700/50`).
   - Ao passar o mouse sobre um card (Hover), ele levanta levemente (`-translate-y-1`) e exibe um brilho subtil nas bordas/sombra.
   - Todos os atributos vitais (PV, CA, Fé) estão claramente visíveis com forte contraste.
