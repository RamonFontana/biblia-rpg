const fs = require('fs');
const content = fs.readFileSync('src/data/abilities.ts', 'utf8');
const match = content.match(/export const ABILITIES: AbilityDefinition\[\] = (\[[\s\S]*\]);/);
if (match) {
  const abilitiesStr = match[1].replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":').replace(/'/g, '"');
  // It's not valid JSON. Let's just use regex on the raw string.
  let matches = content.match(/{\s*id:[^}]+}/g);
  let results = matches.filter(m => m.includes('minLevel: 1,') && !m.includes('actionType: "passive"')).map(m => {
    let name = m.match(/name: "(.*)"/)[1];
    let sourceId = m.match(/sourceId: "(.*)"/)[1];
    let actionType = m.match(/actionType: "(.*)"/)[1];
    return `${sourceId}: ${name} (${actionType})`;
  });
  console.log(results.join('\n'));
}
