import os
import re

def read_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            return content
    except Exception as e:
        return f"Error reading {filepath}: {e}"

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

output = []

for filepath in order:
    if os.path.exists(filepath):
        content = read_file(filepath)
        
        # Smart breaks for Homebrewery:
        # Break columns at every H2 (##), except if it's very close to the start of the file.
        # This prevents content flowing off the bottom of the page.
        
        lines = content.split('\n')
        new_lines = []
        for i, line in enumerate(lines):
            # If it's a ## heading and we're past the first 10 lines, insert a \column break
            if line.startswith('## ') and i > 10:
                new_lines.append('')
                new_lines.append('\\column')
                new_lines.append('')
            new_lines.append(line)
            
        content = '\n'.join(new_lines)
        
        output.append(content)
        # Add Homebrewery page break between files
        output.append("\n\\page\n")

with open("homebrewery-export.md", "w", encoding="utf-8") as f:
    f.write("\n\n".join(output))

print("Created homebrewery-export.md")
