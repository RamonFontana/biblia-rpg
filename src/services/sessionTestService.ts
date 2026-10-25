import { getCurrentFaith, getEffectiveFaith, isFaithTestPassed } from '@/domain/faith';
import {
  getCharacterStats,
  markInspirationUsed,
  updateCharacterStats,
} from '@/data-access/characters';
import { getItemFaithPenalty } from '@/data-access/inventory';
import { saveTestResult } from '@/data-access/sessionTests';
import {
  calculateFaithAfterFailure,
  failureCostsFaith,
  isRegularTestApproved,
  type FaithUse,
} from '@/domain/sessionTests';
import type { TestMode } from '@/domain/testMode';
import { systemRng } from '@/lib/systemRng';

/** Lê os `stats` sem lançar: uma leitura que falha deixa a regra seguir sem eles, como sempre. */
async function readStatsOrNull(characterId: string) {
  try {
    return await getCharacterStats(characterId);
  } catch (error) {
    console.error('Error reading character stats for the test:', error);
    return null;
  }
}

export async function submitTestResult(
  resultId: string,
  resultValue: number,
  difficulty: number,
  characterId?: string,
  testType?: string,
  faithPenalty?: number,
  rollValue?: number,
  faithTest?: { use: FaithUse | null; selfishRequest: boolean },
  rollInfo?: {
    appliedMode: TestMode;
    rollValues: number[] | null;
    /** Presente quando o jogador gastou a Inspiração neste Teste: a sessão e o dia de agora. */
    inspiration?: { sessionId: string; day: number };
  },
): Promise<void> {
  let isApproved = isRegularTestApproved(resultValue, difficulty);

  if (testType === 'Fé' && characterId) {
    // Sem a Fé do personagem não há como julgar o Teste: a falha na leitura interrompe o envio.
    const stats = await getCharacterStats(characterId);
    if (stats) {
      // Mesma regra da tela do jogador: passa se o dado <= Fé Efetiva (Fé Atual mais a penalidade
      // dos Itens Profanos) + Modificador de Fé do Mestre.
      const itemFaithPenalty = await getItemFaithPenalty(characterId);
      isApproved = isFaithTestPassed(
        resultValue,
        difficulty,
        getEffectiveFaith(stats, itemFaithPenalty),
      );
    }
  }

  await saveTestResult(resultId, {
    resultValue,
    rollValue: rollValue ?? null,
    isApproved,
    appliedMode: rollInfo?.appliedMode ?? null,
    rollValues: rollInfo?.rollValues ?? null,
    inspirationUsed: !!rollInfo?.inspiration,
  });

  // A Inspiração só conta depois que o resultado foi enviado. Se marcar o dia falhar, o envio já
  // feito fica: o pior caso é a Inspiração continuar disponível.
  if (rollInfo?.inspiration && characterId) {
    try {
      await markInspirationUsed(
        characterId,
        rollInfo.inspiration.sessionId,
        rollInfo.inspiration.day,
      );
    } catch (error) {
      console.error('Error marking the Inspiration as used:', error);
    }
  }

  // A falha custa 1d6 de Fé conforme o uso do Teste: o Clamor só com Pedido Egoísta.
  const costsFaith = failureCostsFaith(faithTest?.use ?? null, faithTest?.selfishRequest ?? false);
  if (testType === 'Fé' && !isApproved && costsFaith && characterId) {
    // Busca os stats atualizados do personagem
    const stats = await readStatsOrNull(characterId);

    if (stats) {
      const { newFaith: newCurrentFaith } = calculateFaithAfterFailure(
        getCurrentFaith(stats),
        faithPenalty,
        systemRng,
      );

      try {
        await updateCharacterStats(characterId, { ...stats, current_faith: newCurrentFaith });
      } catch (error) {
        console.error('Error saving the Faith lost in the test:', error);
      }
    }
  }
}
