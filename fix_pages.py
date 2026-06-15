import re

with open('homebrewery-export.md', 'r', encoding='utf-8') as f:
    text = f.read()

# We split the text by lines.
lines = text.split('\n')

new_lines = []
lines_since_last_page = 0

for line in lines:
    # If the user or my previous script already put \page, reset counter
    if '\\page' in line:
        new_lines.append(line)
        lines_since_last_page = 0
        continue
    
    # If we hit a level 1 or level 2 header and we have accumulated a lot of text, add \page
    if line.startswith('# ') or line.startswith('## '):
        if lines_since_last_page > 60: # 60 lines is a safe limit for a page with 2 columns
            new_lines.append('\\page')
            new_lines.append('')
            lines_since_last_page = 0

    new_lines.append(line)
    lines_since_last_page += 1

with open('homebrewery-export.md', 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print("Fixed pages in homebrewery-export.md")
