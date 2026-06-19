import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CombatSetupSchema, type CombatSetupFormValues } from '../../types/combat';
import { useCombatStore } from '../../store/combatStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export interface AvailableEntity {
  id: string;
  name: string;
  type: 'player' | 'npc' | 'enemy';
  hpCurrent: number;
}

interface CombatSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  availableEntities: AvailableEntity[];
}

export function CombatSetupModal({ isOpen, onClose, sessionId, availableEntities }: CombatSetupModalProps) {
  const startCombat = useCombatStore(state => state.startCombat);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CombatSetupFormValues>({
    resolver: zodResolver(CombatSetupSchema),
    defaultValues: {
      participants: availableEntities.map(e => ({
        entityId: e.id,
        entityType: e.type,
        initiative: 0,
        hpCurrent: e.hpCurrent
      }))
    }
  });

  const { fields, remove } = useFieldArray({
    control: form.control,
    name: "participants"
  });

  const onSubmit = async (values: CombatSetupFormValues) => {
    try {
      setIsSubmitting(true);
      await startCombat(sessionId, values.participants);
      onClose();
    } catch (error) {
      console.error('Failed to start combat', error);
      // In a real app we'd trigger a toast here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Setup do Combate</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {fields.map((field, index) => {
              const entity = availableEntities.find(e => e.id === field.entityId);
              return (
                <div key={field.id} className="flex items-center gap-4 border p-4 rounded-md">
                  <div className="flex-1">
                    <p className="font-semibold">{entity?.name || 'Desconhecido'} ({field.entityType})</p>
                  </div>
                  <FormField
                    control={form.control}
                    name={`participants.${index}.initiative`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>Iniciativa</FormLabel>
                        <FormControl>
                          <Input type="number" {...f} onChange={e => f.onChange(e.target.value === '' ? 0 : parseInt(e.target.value, 10))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`participants.${index}.hpCurrent`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>HP Atual</FormLabel>
                        <FormControl>
                          <Input type="number" {...f} onChange={e => f.onChange(e.target.value === '' ? 0 : parseInt(e.target.value, 10))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="destructive" onClick={() => remove(index)}>
                    Remover
                  </Button>
                </div>
              );
            })}

            <Button type="submit" disabled={isSubmitting || fields.length < 2} className="w-full">
              {isSubmitting ? 'Iniciando...' : 'Iniciar Combate'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
