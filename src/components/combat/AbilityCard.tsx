import type { AbilityDefinition } from '@/data/abilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AbilityCardProps {
  ability: AbilityDefinition;
  currentUses?: number;
  onUse?: (ability: AbilityDefinition) => void;
  onRestore?: (ability: AbilityDefinition) => void;
  disabled?: boolean;
  disabledReason?: string;
  isGM?: boolean;
}

export function AbilityCard({ ability, currentUses, onUse, onRestore, disabled, disabledReason, isGM }: AbilityCardProps) {
  const getActionTypeColor = (type: string) => {
    switch (type) {
      case 'action': return 'bg-blue-500/10 text-blue-500';
      case 'bonus_action': return 'bg-purple-500/10 text-purple-500';
      case 'reaction': return 'bg-orange-500/10 text-orange-500';
      case 'free_action': return 'bg-green-500/10 text-green-500';
      default: return 'bg-gray-500/10 text-gray-500'; // passive
    }
  };

  const getUsageLabel = () => {
    if (ability.usageType === 'unlimited') return 'Ilimitado';
    if (ability.usageType === 'faith_cost') return `Custo: ${ability.faithCost} Fé`;
    
    let label = '';
    if (ability.maxUses) {
      label += `${currentUses ?? ability.maxUses}/${ability.maxUses} `;
    }

    switch (ability.usageType) {
      case 'short_rest': label += 'D. Curto'; break;
      case 'long_rest': label += 'D. Longo'; break;
      case 'combat': label += 'Combate'; break;
      case 'week': label += 'Semana'; break;
      case 'campaign': label += 'Campanha'; break;
    }
    
    // Add Faith cost if it has both
    if (ability.faithCost) {
      label += ` (Custo: ${ability.faithCost} Fé)`;
    }

    return label;
  };

  const canUse = () => {
    if (disabled) return false;
    if (ability.actionType === 'passive') return false;
    if (ability.usageType !== 'unlimited' && ability.usageType !== 'faith_cost' && currentUses === 0) return false;
    return true;
  };

  return (
    <Card className="bg-[#1C1C24] border-gray-800">
      <CardHeader className="p-3 pb-2 flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-semibold text-gray-100 flex items-center gap-2">
            {ability.name}
            {ability.path && (
              <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-[10px] border-amber-500/30 text-amber-500">
                Caminho {ability.path}
              </span>
            )}
          </CardTitle>
          <div className="flex flex-wrap gap-1 mt-1.5">
            <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-medium border-0 ${getActionTypeColor(ability.actionType)}`}>
              {ability.actionType === 'bonus_action' ? 'Ação Bônus' : 
               ability.actionType === 'reaction' ? 'Reação' : 
               ability.actionType === 'free_action' ? 'Ação Livre' :
               ability.actionType === 'action' ? 'Ação' : 'Passiva'}
            </span>
            {ability.usageType !== 'unlimited' && (
              <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-[10px] border-gray-700 text-gray-400">
                {getUsageLabel()}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {isGM && ability.usageType !== 'unlimited' && onRestore && currentUses !== undefined && currentUses < (ability.maxUses || 0) && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-3 text-xs border-amber-600 text-amber-500 hover:bg-amber-900/30"
              onClick={() => onRestore(ability)}
            >
              Restaurar
            </Button>
          )}
          {ability.actionType !== 'passive' && onUse && (
            <div className="flex items-center gap-2">
              {!canUse() && disabledReason && (
                <span className="text-[10px] text-red-400 font-medium whitespace-nowrap">
                  {disabledReason}
                </span>
              )}
              <Button 
                size="sm" 
                variant={canUse() ? 'default' : 'secondary'}
                className={`h-7 px-3 text-xs ${!canUse() ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!canUse()}
                onClick={() => onUse(ability)}
              >
                Usar
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-xs text-gray-400 leading-relaxed">
          {ability.effect}
        </p>
      </CardContent>
    </Card>
  );
}
