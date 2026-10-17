import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CONDITIONS } from '@/content/conditions';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export interface ConditionSelectorProps {
  onAddCondition: (conditionId: string, duration: number) => void;
  trigger?: React.ReactNode;
}

export const ConditionSelector: React.FC<ConditionSelectorProps> = ({
  onAddCondition,
  trigger,
}) => {
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);

  const handleAdd = () => {
    if (selectedCondition) {
      onAddCondition(selectedCondition, duration);
      setIsOpen(false);
      // Reset after add
      setSelectedCondition('');
      setDuration(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Plus size={16} /> Adicionar Efeito
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Aplicar Condição/Efeito</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="condition">Condição</Label>
            <Select value={selectedCondition} onValueChange={setSelectedCondition}>
              <SelectTrigger id="condition">
                <SelectValue placeholder="Selecione um efeito" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(CONDITIONS).map((cond) => (
                  <SelectItem key={cond.id} value={cond.id}>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${cond.color}`}></span>
                      {cond.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCondition && (
              <p className="text-xs text-muted-foreground mt-1">
                {CONDITIONS[selectedCondition].description}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="duration">Duração (Turnos)</Label>
            <Input
              id="duration"
              type="number"
              min="0"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              className="col-span-3"
            />
            <p className="text-xs text-muted-foreground">
              0 para duração permanente (até ser curado).
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAdd} disabled={!selectedCondition}>
            Aplicar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
