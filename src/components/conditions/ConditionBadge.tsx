import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CONDITIONS } from '@/data/conditions';
import { X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface ConditionBadgeProps {
  conditionId: string;
  duration?: number;
  onRemove?: (conditionId: string) => void;
  className?: string;
  readonly?: boolean;
}

export const ConditionBadge: React.FC<ConditionBadgeProps> = ({
  conditionId,
  duration,
  onRemove,
  className = '',
  readonly = false,
}) => {
  const definition = CONDITIONS[conditionId];

  if (!definition) return null;

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(conditionId);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`flex items-center gap-1 ${definition.color} text-white hover:${definition.color} border-none max-w-[140px] sm:max-w-[180px] ${className}`}
          >
            <span className="truncate" title={definition.name}>
              {definition.name}
            </span>
            {duration !== undefined && duration > 0 && (
              <span className="bg-black/20 rounded-full px-1.5 py-0.5 text-xs shrink-0">
                {duration}
              </span>
            )}
            {!readonly && onRemove && (
              <button
                onClick={handleRemove}
                className="ml-1 rounded-full p-0.5 hover:bg-black/20 transition-colors shrink-0"
                title="Remover efeito"
              >
                <X size={12} />
              </button>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs">
            <p className="font-bold">{definition.name}</p>
            <p className="text-sm">{definition.description}</p>
            {duration !== undefined && (
              <p className="text-xs mt-1 opacity-80">
                {duration > 0 ? `Duração: ${duration} turno(s)` : 'Permanente'}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
