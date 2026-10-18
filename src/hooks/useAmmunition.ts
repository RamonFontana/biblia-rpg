import { addAmmoCharges, consumeAmmo, recoverAmmo } from '@/data-access/inventory';
import { systemRng } from '@/lib/systemRng';

export function useAmmunition() {
  return {
    consume: consumeAmmo,
    recover: (characterItemId: string, spentAmount: number, maxCapacity: number) =>
      recoverAmmo(characterItemId, spentAmount, maxCapacity, systemRng),
    addCharges: addAmmoCharges,
  };
}
