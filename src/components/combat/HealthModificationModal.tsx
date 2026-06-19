import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HealthModificationSchema, type HealthModificationFormValues } from '../../types/combat';
import { useCombatStore } from '../../store/combatStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface HealthModificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  participantName: string;
}

export function HealthModificationModal({ isOpen, onClose, participantId, participantName }: HealthModificationModalProps) {
  const applyDamageOrHealing = useCombatStore(state => state.applyDamageOrHealing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<HealthModificationFormValues>({
    resolver: zodResolver(HealthModificationSchema),
    defaultValues: {
      amount: 0,
      type: 'damage',
      participantId
    }
  });

  const onSubmit = async (values: HealthModificationFormValues) => {
    try {
      setIsSubmitting(true);
      await applyDamageOrHealing(values.participantId, values.amount, values.type);
      onClose();
    } catch (error) {
      console.error('Failed to modify health', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modificar Vida - {participantName}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="damage">Dano</SelectItem>
                      <SelectItem value="healing">Cura</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? 0 : parseInt(e.target.value, 10))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Aplicando...' : 'Aplicar'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
