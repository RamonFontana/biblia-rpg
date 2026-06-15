import os
import re

order = [
    "docs/regras-base.md",
    "docs/criacao-de-personagem.md",
    "docs/tribos/README.md",
    "docs/tribos/ruben.md",
    "docs/tribos/simeao.md",
    "docs/tribos/levi.md",
    "docs/tribos/juda.md",
    "docs/tribos/da.md",
    "docs/tribos/naftali.md",
    "docs/tribos/gade.md",
    "docs/tribos/aser.md",
    "docs/tribos/issacar.md",
    "docs/tribos/zebulom.md",
    "docs/tribos/jose.md",
    "docs/tribos/benjamim.md",
    "docs/tribos/efraim.md",
    "docs/tribos/manasses.md",
    "docs/vocacoes/README.md",
    "docs/vocacoes/guerreiro.md",
    "docs/vocacoes/sacerdote.md",
    "docs/vocacoes/batedor.md",
    "docs/vocacoes/cacador.md",
    "docs/fortalezas-tentacoes.md",
    "docs/itens/armas.md",
    "docs/itens/armaduras.md",
    "docs/itens/consumiveis.md",
    "docs/itens/utilizaveis.md",
    "docs/guia-do-mestre.md",
    "docs/guia-rapido-mestre.md",
    "docs/bestiario/README.md",
    "docs/bestiario/inimigos-humanos.md",
    "docs/bestiario/animais-selvagens.md",
    "docs/bestiario/gigantes.md",
    "docs/bestiario/endemoniado-comum.md",
    "docs/bestiario/template-endemoniado.md"
]

MAX_CHARS_PER_COL = 1800
output = []
current_col = 1
chars_in_col = 0

for filepath in order:
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read().strip()
    
    # Remove existing \page and \column just in case
    content = content.replace('\\page', '').replace('\\column', '')
    
    # Split by paragraphs (double newline)
    blocks = re.split(r'\n{2,}', content)
    
    for block in blocks:
        block_len = len(block)
        
        # If adding this block exceeds column size
        if chars_in_col + block_len > MAX_CHARS_PER_COL and chars_in_col > 0:
            if current_col == 1:
                output.append("\\column\n")
                current_col = 2
                chars_in_col = 0
            else:
                output.append("\\page\n")
                current_col = 1
                chars_in_col = 0
                
        output.append(block)
        chars_in_col += block_len + 2 # +2 for the newlines
        
    # After each file, force a page break for better organization? 
    # The user might prefer files to start on new pages, but if they are short like weapons, maybe not.
    # Let's force a page break if the file is significant, e.g. not an item file.
    if "itens/" not in filepath:
        output.append("\\page\n")
        current_col = 1
        chars_in_col = 0

with open("homebrewery-export.md", "w", encoding="utf-8") as f:
    f.write("\n\n".join(output))

print("Created formatted homebrewery-export.md")
