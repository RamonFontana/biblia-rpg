export interface TribeSkill {
  name: string;
  description: string;
  level: number;
}

export const TRIBE_SKILLS: Record<string, TribeSkill[]> = {
  "Judá": [
    { name: "Rugido do Leão", description: "Vantagem em testes de intimidação ou inspirar aliados.", level: 1 },
    { name: "Medicina do Deserto", description: "Vantagem em testes de medicina/cura.", level: 1 }
  ],
  "Levi": [
    { name: "Dedicação Exclusiva", description: "Acesso a rituais clericais/sacerdotais.", level: 1 },
    { name: "Oráculo de Deus", description: "Vantagem em testes de intuição/religião.", level: 1 }
  ],
  "Gade": [
    { name: "Sangue de Pedra", description: "+1 de PV máximo a cada nível.", level: 1 },
    { name: "Fúria do Deserto", description: "Dano extra ao usar armas pesadas.", level: 1 }
  ],
  "Benjamim": [
    { name: "Furtividade Natural", description: "Vantagem em furtividade.", level: 1 },
    { name: "Olhos de Lobo", description: "Enxerga melhor em baixa luminosidade.", level: 1 }
  ],
  "Rúben": [
    { name: "Mestre das Feras", description: "Vantagem ao lidar com animais.", level: 1 },
    { name: "Lábia de Mercador", description: "Vantagem em negociação e persuasão.", level: 1 }
  ],
  "Issacar": [
    { name: "Resistência ao Trabalho", description: "Vantagem em testes de Constituição (Cansaço).", level: 1 },
    { name: "Conhecimento de Terreno", description: "Não sofre penalidade em terrenos difíceis.", level: 1 }
  ],
  "Simeão": [
    { name: "Herborismo", description: "Identifica plantas e cria poções naturais.", level: 1 },
    { name: "Vingança", description: "Ganha bônus de ataque contra quem feriu você ou aliados recentes.", level: 1 }
  ],
  "Dã": [
    { name: "Golpe da Víbora", description: "Pode aplicar venenos a armas.", level: 1 },
    { name: "Julgamento Frio", description: "Vantagem para perceber mentiras (Intuição).", level: 1 }
  ],
  "Naftali": [
    { name: "Passos Leves", description: "+1.5m de deslocamento.", level: 1 },
    { name: "Palavras Doces", description: "Vantagem em testes para acalmar ânimos.", level: 1 }
  ],
  "Aser": [
    { name: "Fartura", description: "Gasta menos recursos para se manter e cozinhar.", level: 1 },
    { name: "Resiliência a Venenos", description: "Resistência a dano de veneno.", level: 1 }
  ],
  "Zebulom": [
    { name: "Equilíbrio", description: "Vantagem em testes de Acrobacia e Atletismo no mar/superfícies instáveis.", level: 1 },
    { name: "Comércio Marítimo", description: "Vantagem ao avaliar valor de itens.", level: 1 }
  ],
  "Efraim": [
    { name: "Orgulho Guerreiro", description: "Vantagem contra intimidação.", level: 1 },
    { name: "Mira Precisa", description: "Bônus em ataques à distância.", level: 1 }
  ],
  "Manassés": [
    { name: "Tática Defensiva", description: "+1 na CA ao lutar em formação.", level: 1 },
    { name: "Resistência de Guerrilha", description: "Vantagem em testes de Constituição contra dor/tortura.", level: 1 }
  ]
};

export function getTribeSkills(tribeName?: string, level: number = 1): TribeSkill[] {
  if (!tribeName) return [];
  // Normalize the string (e.g. Judah vs Judá vs juda)
  const normalizedKey = Object.keys(TRIBE_SKILLS).find(
    k => k.toLowerCase().replace(/[áàãâä]/g, 'a').replace(/[úùûü]/g, 'u') === 
         tribeName.toLowerCase().replace(/[áàãâä]/g, 'a').replace(/[úùûü]/g, 'u')
  );
  
  if (!normalizedKey) return [];
  
  return TRIBE_SKILLS[normalizedKey].filter(skill => skill.level <= level);
}
