import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PhysicalRollSchema, type PhysicalRollFormValues } from '../../types/combat';
import { supabase } from '@/lib/supabase';
import { checkWeaponProficiency } from '@/lib/equipmentUtils';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface PhysicalRollFormProps {
  playerId: string;
  character?: any;
}

export function PhysicalRollForm({ playerId: _playerId, character }: PhysicalRollFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [equippedWeapon, setEquippedWeapon] = useState<any | null>(null);
  const [useVersatile, setUseVersatile] = useState(false);

  const form = useForm<PhysicalRollFormValues>({
    resolver: zodResolver(PhysicalRollSchema),
    defaultValues: {
      attackRoll: 0,
      damageRoll: 0,
    }
  });

  useEffect(() => {
    async function fetchEquippedWeapon() {
      if (!character?.equipment?.mainHand) {
        setEquippedWeapon(null);
        return;
      }
      const { data, error } = await supabase
        .from('character_items')
        .select(`
          id,
          items (
            name,
            effects
          )
        `)
        .eq('id', character.equipment.mainHand)
        .single();
        
      if (!error && data) {
        setEquippedWeapon(data.items);
      }
    }
    fetchEquippedWeapon();
  }, [character?.equipment?.mainHand]);

  const hasOffhandEquipped = character?.equipment?.offHand !== null;
  const isVersatile = equippedWeapon?.effects?.properties?.includes("Versátil");
  const canUseVersatile = isVersatile && !hasOffhandEquipped;

  const displayDamageDie = canUseVersatile && useVersatile 
    ? (equippedWeapon?.effects?.versatileDamageDie || "Aumentado") 
    : equippedWeapon?.effects?.damageDie;

  const isProficient = checkWeaponProficiency(equippedWeapon, character?.vocation || '');

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
        <CardTitle className="flex items-center gap-2">
          Rolagem Física
          {equippedWeapon && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isProficient ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {isProficient ? 'Proficiente' : 'Não Proficiente'}
            </span>
          )}
        </CardTitle>
        {equippedWeapon && (
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-sm text-muted-foreground">
              Arma equipada: <span className="font-bold text-amber-500">{equippedWeapon.name}</span>
              {displayDamageDie && ` (${displayDamageDie})`}
            </p>
            {canUseVersatile && (
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="checkbox" 
                  id="versatile-toggle" 
                  checked={useVersatile} 
                  onChange={(e) => setUseVersatile(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-700 bg-stone-900 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="versatile-toggle" className="text-sm font-medium text-stone-300">
                  Ataque com Duas Mãos (Versátil)
                </label>
              </div>
            )}
          </div>
        )}
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

            <Button type="submit" disabled={isSubmitting} className="w-full min-h-[44px]">
              {isSubmitting ? 'Registrando...' : 'Registrar Rolagem'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
