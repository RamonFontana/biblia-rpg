export interface ConditionDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string; // Tailwind color class or hex
}

export const CONDITIONS: Record<string, ConditionDefinition> = {
  sangrando: {
    id: 'sangrando',
    name: 'Sangrando',
    description: 'Sofre dano no final de cada turno e tem desvantagem em testes de Vigor.',
    color: 'bg-red-500',
  },
  envenenado: {
    id: 'envenenado',
    name: 'Envenenado',
    description: 'Desvantagem em jogadas de ataque e testes de atributo.',
    color: 'bg-green-500',
  },
  atordoado: {
    id: 'atordoado',
    name: 'Atordoado',
    description:
      'Incapacitado, não pode se mover e falha automaticamente em testes de Força e Destreza.',
    color: 'bg-yellow-500',
  },
  cego: {
    id: 'cego',
    name: 'Cego',
    description:
      'Falha em testes que dependem da visão. Ataques contra têm vantagem, ataques feitos têm desvantagem.',
    color: 'bg-slate-700',
  },
  caido: {
    id: 'caido',
    name: 'Caído',
    description:
      'Movimento custa o dobro para levantar. Ataques corpo-a-corpo contra têm vantagem.',
    color: 'bg-orange-600',
  },
  agarrado: {
    id: 'agarrado',
    name: 'Agarrado',
    description: 'Deslocamento se torna 0.',
    color: 'bg-stone-500',
  },
  amedrontado: {
    id: 'amedrontado',
    name: 'Amedrontado',
    description: 'Desvantagem em testes e ataques enquanto a fonte do medo estiver visível.',
    color: 'bg-purple-500',
  },
  impedido: {
    id: 'impedido',
    name: 'Impedido',
    description: 'Não se desloca e ataca com desvantagem.',
    color: 'bg-teal-600',
  },
  paralisado: {
    id: 'paralisado',
    name: 'Paralisado',
    description:
      'Não age nem se move, falha automaticamente em TR de Força e Destreza, e ataques contra ele têm vantagem.',
    color: 'bg-pink-600',
  },
  exausto: {
    id: 'exausto',
    name: 'Exausto',
    description:
      'Desvantagem em testes de atributo e deslocamento pela metade. Sai com um Descanso Longo.',
    color: 'bg-neutral-500',
  },
};
