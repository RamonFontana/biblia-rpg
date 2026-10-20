# Design: padrão visual do RPG Bíblico

**Referência:** a criação de personagem (`src/features/character-creation/`, moldura em `WizardLayout.tsx`). Toda tela nova ou refatorada segue este padrão; as demais convergem aos poucos (plano em `docs/ROADMAP.md`, Onda 4).

Este documento descreve o padrão **como ele está implementado hoje**, com classes Tailwind fixas (`stone`/`amber`). Desde o passo 2 da Onda 4, os tokens do shadcn (variáveis CSS em `src/index.css`) já têm os valores desta paleta: `bg-background`, `bg-card`, `text-muted-foreground`, `bg-primary` e companhia dão o mesmo resultado que as classes fixas. Cinco blocos já são componentes em `src/components/ui/` (Onda 4, passo 6) e a criação de personagem os usa: `PageShell`, `Panel`, `PageHeader`, `ProgressBar` e `ChipToggle`. Use o componente em vez de copiar a receita; os demais blocos (botões, cartão de escolha, campo, aviso, painel lateral) ainda são receitas para copiar daqui.

## Clima
Tema escuro e único: pedra e bronze. Fundo de pedra quente (`stone`), acento de bronze/ouro (`amber`), títulos em serifa. Sóbrio, sem gradientes e sem cores saturadas fora dos estados (erro, aviso).

## Paleta
| Papel | Classe fixa | Token (`src/index.css`) |
|---|---|---|
| Fundo da página | `bg-stone-900` | `--background` |
| Superfície (cartão, painel) | `bg-stone-800` | `--card` |
| Superfície elevada / botão secundário / fundo de hover | `bg-stone-700`, hover `bg-stone-600` | `--secondary`, `--muted`, `--accent` |
| Borda padrão | `border-stone-700` (divisória interna: `border-stone-800`) | `--border` |
| Borda de controle | `border-stone-600` | `--input` |
| Texto principal | `text-stone-100` | `--foreground` |
| Texto de rótulo | `text-stone-300` | — |
| Texto secundário | `text-stone-400`; terciário/ícone `text-stone-500` | `--muted-foreground` |
| Acento (títulos, foco, seleção) | `text-amber-500`, `border-amber-500` | `--ring` (foco); `--primary` (amber-600) no texto e no destaque |
| Ação primária | `bg-amber-600`, hover `bg-amber-500`, texto `text-stone-900` | `--primary` e `--primary-foreground` (hover é `primary/90`) |
| Seleção (fundo) | `bg-amber-500/10` com `border-amber-500` | `bg-primary/10` com `border-primary` |
| Aviso | `bg-amber-900/50 border-amber-500/50 text-amber-200` | — |
| Erro | `text-red-400`; botão destrutivo `bg-red-900/30 border-red-700/50 text-red-400` | `--destructive` (red-500, serve ao texto e ao botão cheio com texto `stone-900`) |
| Sucesso | `text-green-400`; faixa `bg-green-900/30 border-green-700/50 text-green-400` | — |

Cores fora desta tabela (`slate`, `gray`, `zinc`, `blue`, `indigo`, `purple`, `orange`, `yellow`, `emerald`…) não fazem parte do padrão. Para diferenciar dois estados, use o texto ou um ícone, não uma cor a mais. O `npm run check:palette` barra cor nova fora da paleta. As exceções são as cores semânticas de condição em `src/content/conditions.ts`.

## Tipografia
- **Títulos:** `font-serif` (pilha serifada padrão do Tailwind; não há fonte customizada).
  - Título de página: `text-3xl font-serif text-amber-500`.
  - Título de seção: `text-2xl` / `text-xl font-serif text-stone-100`; destaque em `text-amber-500`, com sublinhado opcional `border-b border-amber-500/30 pb-2`.
  - Título de cartão: `font-serif text-lg text-stone-100`.
- **Subtítulo de bloco:** `text-stone-300 font-semibold` (ou `text-lg font-bold text-stone-300`).
- **Corpo:** `text-stone-100`; descrição `text-sm text-stone-400`.
- **Markdown** (fichas de tribo/vocação): `prose prose-invert prose-stone prose-sm max-w-none`.

## Layout
- **Moldura de página** (`WizardLayout.tsx`): `<PageShell><Panel>…</Panel></PageShell>`.
  - `PageShell`: `min-h-screen bg-stone-900 text-stone-100 p-0 sm:p-4 md:p-8`.
  - `Panel`: `max-w-4xl mx-auto bg-stone-800 p-4 sm:p-6 rounded-none sm:rounded-xl shadow-none sm:shadow-lg border-0 sm:border border-stone-700 min-h-screen sm:min-h-0`.
  - **Mobile primeiro:** no celular o painel ocupa a tela inteira, sem borda nem cantos; a moldura aparece a partir de `sm`.
  - Uma classe passada em `className` vence a da receita (`<Panel className="max-w-6xl">`). Para um bloco menor dentro da página, use `Card`.
- **Cabeçalho de página** (`PageHeader`): `mb-8 border-b border-stone-700 pb-4`; título (`title`), linha `text-stone-400 mt-2` (`subtitle`, por exemplo "Passo X de 9") e, nos filhos, a barra de progresso e os chips.
- **Ritmo vertical:** `space-y-6` entre blocos de um formulário; `space-y-4` dentro de um bloco.
- **Grades de escolha:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`.
- **Rodapé de ações:** `flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-4 border-t border-stone-700`. No celular os botões empilham com largura total (`w-full sm:w-auto`); com "Voltar", usar `flex-col-reverse` para a ação primária ficar no topo.

## Componentes (receitas)
**Botão primário**
`w-full sm:w-auto px-6 py-2 bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold rounded transition-colors flex justify-center items-center disabled:opacity-50`

**Botão secundário (Salvar)**
`w-full sm:w-auto px-6 py-2 bg-stone-700 hover:bg-stone-600 text-amber-500 border border-stone-600 rounded transition-colors`

**Botão fantasma (Voltar)**
`w-full sm:w-auto px-6 py-2 border border-stone-600 hover:bg-stone-700 text-stone-300 rounded transition-colors`

**Cartão de escolha** (tribo, vocação: rádio escondido dentro de `label`)
- Base: `relative p-4 rounded-lg border-2 transition-all flex items-center space-x-4`
- Normal: `border-stone-700 bg-stone-800 cursor-pointer hover:border-amber-500/50 hover:bg-stone-700/50`
- Selecionado: `border-amber-500 bg-amber-500/10`
- Bloqueado: `opacity-50 cursor-not-allowed`
- Conteúdo: ícone `text-3xl` + título `font-serif text-lg text-stone-100` + descrição `text-sm text-stone-400`. Botão de ajuda no canto: `absolute top-2 right-2 text-stone-500 hover:text-amber-500` com `HelpCircle` (lucide) `w-5 h-5`.

**Campo de formulário**
- Rótulo: `block text-stone-300 font-bold mb-2`
- Input/textarea: `w-full bg-stone-900 border border-stone-700 text-stone-100 p-3 rounded focus:border-amber-500 outline-none`
- Erro abaixo do campo: `text-red-400 text-sm mt-1`

**Aviso** (ex.: personagem bloqueado em sessão)
`bg-amber-900/50 border border-amber-500/50 p-4 rounded text-amber-200`, começando com `<strong>Atenção:</strong>`.

**Barra de progresso** (`ProgressBar value max`)
Trilho `w-full bg-stone-700 h-2 rounded-full overflow-hidden`; preenchimento `bg-amber-500 h-full transition-all duration-300`. A largura é `value / max`, presa entre 0 e 100%; o trilho leva `role="progressbar"`.

**Chips de navegação** (`ChipToggle active`, modo edição)
`px-3 py-1 rounded text-sm`; ativo `bg-amber-600 text-stone-900 font-bold`; inativo `bg-stone-700 text-stone-300 hover:bg-stone-600`. É um `button type="button"` com `aria-pressed`.

**Painel lateral de detalhes** (`Sheet` do shadcn)
`SheetContent` com `bg-stone-900 border-l border-stone-700 text-stone-100 overflow-y-auto sm:max-w-md w-full`; título `text-2xl font-serif text-amber-500`; corpo separado por `mt-8 pt-6 border-t border-stone-800`.

## Movimento e estados
- Transições curtas: `transition-colors` em botões e links, `transition-all` em cartões de escolha.
- Desabilitado: `disabled:opacity-50 disabled:cursor-not-allowed`.
- Foco de campo: borda `amber-500`.
