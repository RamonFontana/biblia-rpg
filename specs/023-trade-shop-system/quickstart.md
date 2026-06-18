# Quickstart: Sistema de Negociação e Lojinha

## O que é

Sistema de trocas que permite jogadores e o Mestre negociar itens e Shekels de Prata (SP) durante sessões ativas do RPG Bíblico.

## Fluxos Principais

### 1. Troca entre Jogadores
1. Jogador A clica "Negociar" no card do Jogador B
2. Jogador B recebe notificação e aceita
3. Ambos montam suas ofertas (itens + SP) em tempo real
4. Ambos clicam "Pronto"
5. Transação é executada atomicamente

### 2. Lojinha do Mestre
1. Mestre clica "Lojinha" no card de um jogador
2. Janela abre diretamente para ambos (sem aceite)
3. Mestre oferece itens do catálogo global (estoque infinito)
4. Jogador coloca itens/SP como pagamento (opcional)
5. Ambos clicam "Pronto" → transação executada

### 3. Troca com NPC
1. Jogador clica "Negociar" no NPC visível
2. Mestre recebe notificação e aceita controlar o NPC
3. Negociação segue o fluxo normal

## Regras de Negócio
- Cada personagem só pode ter **1 negociação ativa** por vez
- Indicador "Negociando" aparece no card e bloqueia interações
- Alterar a oferta reseta o "Pronto" de ambos os lados
- Negociações são canceladas ao encerrar sessão ou desconectar
- Preço de referência é informativo (não obrigatório)
- Mestre tem SP e itens infinitos na Lojinha
