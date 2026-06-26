const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, 'docs');
const tribosDir = path.join(docsDir, 'tribos');
const vocacoesDir = path.join(docsDir, 'vocacoes');

const abilities = [];

function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function parseTable(filePath, sourceType, sourceId) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Find the table that has columns we expect
  const lines = content.split('\n');
  let inTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('| Nome |') || line.startsWith('|Nome|')) {
      inTable = true;
      i++; // skip separator
      continue;
    }
    
    if (inTable) {
      if (!line.startsWith('|')) {
        inTable = false;
        continue;
      }
      
      const columns = line.split('|').map(c => c.trim()).filter((_, index, arr) => index > 0 && index < arr.length - 1);
      
      if (columns.length >= 6) {
        let [nameRaw, levelRaw, actionRaw, diceRaw, usageRaw, effectRaw] = columns;
        
        let pathValue = undefined;
        let level = parseInt(levelRaw, 10);
        if (levelRaw.includes('(A)')) pathValue = 'A';
        if (levelRaw.includes('(B)')) pathValue = 'B';
        
        let actionType = 'passive';
        actionRaw = actionRaw.toLowerCase();
        if (actionRaw.includes('bônus') || actionRaw.includes('bonus')) actionType = 'bonus_action';
        else if (actionRaw.includes('reação') || actionRaw.includes('reacao')) actionType = 'reaction';
        else if (actionRaw.includes('livre')) actionType = 'free_action';
        else if (actionRaw.includes('ação') || actionRaw.includes('acao') || actionRaw.includes('minutos')) actionType = 'action';
        
        let usageType = 'unlimited';
        let maxUses = undefined;
        let faithCost = undefined;
        
        usageRaw = usageRaw.toLowerCase();
        if (usageRaw.includes('curto')) { usageType = 'short_rest'; }
        else if (usageRaw.includes('longo')) { usageType = 'long_rest'; }
        else if (usageRaw.includes('combate')) { usageType = 'combat'; }
        else if (usageRaw.includes('semana')) { usageType = 'week'; }
        else if (usageRaw.includes('campanha')) { usageType = 'campaign'; }
        
        const usesMatch = usageRaw.match(/^(\d+)/);
        if (usesMatch) {
          maxUses = parseInt(usesMatch[1], 10);
        }

        // special case for Sacerdote (Custo: X Fé) inside Usage or Effect
        const effectLower = effectRaw.toLowerCase();
        const faithMatch = effectLower.match(/custo[^\d]*(\d+)[^\d]*f[ée]/) || usageRaw.match(/custo[^\d]*(\d+)[^\d]*f[ée]/);
        if (faithMatch) {
          faithCost = parseInt(faithMatch[1], 10);
          usageType = 'faith_cost';
          // we keep maxUses if it's there (e.g. 1/D. Curto + Faith cost -> we should probably keep usageType as short_rest but add faithCost? The spec says 'faith_cost' if it purely costs faith, but wait, let's just add faithCost field).
          if (usageRaw.includes('curto')) { usageType = 'short_rest'; }
          else if (usageRaw.includes('longo')) { usageType = 'long_rest'; }
          else if (usageRaw.includes('combate')) { usageType = 'combat'; }
          else if (usageRaw.includes('semana')) { usageType = 'week'; }
          else if (usageRaw.includes('campanha')) { usageType = 'campaign'; }
          else { usageType = 'faith_cost'; }
        }

        const id = `${sourceType}-${sourceId}-${level}-${slugify(nameRaw.split(' (')[0]).substring(0, 15)}`;
        
        abilities.push({
          id: id,
          name: nameRaw.replace(/\*/g, ''),
          sourceType,
          sourceId,
          minLevel: level,
          ...(pathValue ? { path: pathValue } : {}),
          actionType,
          usageType,
          ...(maxUses ? { maxUses } : {}),
          ...(faithCost ? { faithCost } : {}),
          effect: effectRaw.replace(/\(Custo: \d+ Fé\) /, '')
        });
      }
    }
  }
}

const triboFiles = fs.readdirSync(tribosDir).filter(f => f.endsWith('.md') && f !== 'README.md');
for (const file of triboFiles) {
  const sourceId = file.replace('.md', '');
  parseTable(path.join(tribosDir, file), 'tribe', sourceId);
}

const vocacaoFiles = fs.readdirSync(vocacoesDir).filter(f => f.endsWith('.md'));
for (const file of vocacaoFiles) {
  const sourceId = file.replace('.md', '');
  parseTable(path.join(vocacoesDir, file), 'vocation', sourceId);
}

const tsContent = `// Auto-generated abilities data from documentation tables

export interface AbilityDefinition {
  id: string;
  name: string;
  sourceType: 'tribe' | 'vocation';
  sourceId: string;
  minLevel: number;
  path?: 'A' | 'B';
  actionType: 'passive' | 'action' | 'bonus_action' | 'reaction' | 'free_action';
  usageType: 'unlimited' | 'short_rest' | 'long_rest' | 'combat' | 'week' | 'campaign' | 'faith_cost';
  maxUses?: number;
  faithCost?: number;
  effect: string;
}

export const ABILITIES: AbilityDefinition[] = ${JSON.stringify(abilities, null, 2).replace(/"([^"]+)":/g, '$1:')};

export function getAbilitiesForCharacter(
  tribe: string,
  vocation: string,
  level: number,
  pathChoices?: { tribe?: 'A' | 'B'; vocation?: 'A' | 'B' }
): AbilityDefinition[] {
  return ABILITIES.filter(ability => {
    // Check level requirement
    if (ability.minLevel > level) return false;

    // Filter by source
    if (ability.sourceType === 'tribe' && ability.sourceId !== tribe) return false;
    if (ability.sourceType === 'vocation' && ability.sourceId !== vocation) return false;

    // Filter by path choice if applicable
    if (ability.path) {
      const chosenPath = ability.sourceType === 'tribe' 
        ? pathChoices?.tribe 
        : pathChoices?.vocation;
      
      // If a path is required but hasn't been chosen yet (e.g. they are level 4 but haven't selected),
      // we might not return it. Or if they chose different path.
      if (chosenPath && chosenPath !== ability.path) {
        return false;
      }
    }

    return true;
  });
}
`;

fs.writeFileSync(path.join(__dirname, 'src/data/abilities.ts'), tsContent);
console.log(`Generated ${abilities.length} abilities in src/data/abilities.ts`);
