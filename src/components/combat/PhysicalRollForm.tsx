import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PhysicalRollSchema, type PhysicalRollFormValues } from '../../types/combat';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface PhysicalRollFormProps {
  playerId: string;
}

export function PhysicalRollForm({ playerId: _playerId }: PhysicalRollFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PhysicalRollFormValues>({
    resolver: zodResolver(PhysicalRollSchema),
    defaultValues: {
      attackRoll: 0,
      damageRoll: 0,
    }
  });

  const onSubmit = async (values: PhysicalRollFormValues) => {
    try {
      setIsSubmitting(true);
      // Aqui idealmente o dano seria aplicado no alvo correto.
      // Como a especificação simplifica para demonstrar a rolagem enviando para o estado,
      // no futuro isso pode notificar o mestre ou selecionar o alvo no frontend.
      // Por enquanto, não aplicamos dano num id mocado.

      console.log('Fired Roll Event:', values);
      form.reset();

      // Simular delay network
      await new Promise(r => setTimeout(r, 500));

    } catch (error) {
      console.error('Failed to register physical roll', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rolagem Física</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="attackRoll"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ataque (d20 + Mod)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? 0 : parseInt(e.target.value, 10))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="damageRoll"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dano (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Registrando...' : 'Registrar Rolagem'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
