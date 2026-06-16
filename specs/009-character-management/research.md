# Research: Gerenciamento de Personagens

Este documento detalha as decisões técnicas, baseadas no contexto e nos princípios definidos para o RPG Bíblico.

## Navigation & Routing

- **Decision**: Adicionar rota na aplicação para acessar a listagem de personagens (ex: `/characters`) a partir da Home.
- **Rationale**: A aplicação já funciona como um Single Page Application (SPA), usando React Router. Uma navegação direta da Home oferece uma experiência fluida para os usuários encontrarem seus personagens criados.
- **Alternatives considered**: Manter os personagens em um painel misto (dashboard). Descartado por complexidade; uma página dedicada é mais limpa.

## State Management e Integração Supabase

- **Decision**: Os dados da lista e detalhes dos personagens serão obtidos diretamente via API/cliente do Supabase usando queries simples e possivelmente hooks React (ex: `useEffect` + `useState` ou react-query).
- **Rationale**: Permite busca rápida e atualizações em tempo real se necessário. A separação em `api/` segue o padrão de domain-driven design adotado em `character-creation`.
- **Alternatives considered**: Usar Zustand para guardar cache da lista. Pode ser adotado futuramente, mas para um CRUD básico, buscar direto no componente via camada `api/` resolve com menor overhead inicial.

## Security e RLS (Row Level Security)

- **Decision**: A regra "O sistema DEVE bloquear qualquer edição em um personagem caso este já tenha participado de uma sessão" será validada tanto no frontend (escondendo/desabilitando botões de edição) quanto via Supabase RLS.
- **Rationale**: Segurança no banco de dados garante integridade e previne requisições mal-intencionadas ou bugs no cliente de corromper dados pós-sessão. A trava de UI oferece uma boa UX.
- **Alternatives considered**: Travar apenas no UI. Descartado pelo `speckit-clarify` por apresentar falha crítica de segurança.
