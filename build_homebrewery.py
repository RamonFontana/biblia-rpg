import os
import glob

def read_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            # If the file doesn't start with a header, maybe we could add one?
            # Or just return content
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
        output.append(content)
        # Add Homebrewery page break
        output.append("\\page\n")

with open("homebrewery-export.md", "w", encoding="utf-8") as f:
    f.write("\n\n".join(output))

print("Created homebrewery-export.md")
