import { getCurrentFaith, getEffectiveFaith, isFaithTestPassed } from '@/domain/faith';
import { getCharacterStats, updateCharacterStats } from '@/data-access/characters';
import { getItemFaithPenalty } from '@/data-access/inventory';
import { saveTestResult } from '@/data-access/sessionTests';
import { calculateFaithAfterFailure, isRegularTestApproved } from '@/domain/sessionTests';
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
): Promise<void> {
  let isApproved = isRegularTestApproved(resultValue, difficulty);

  if (testType === 'Fé' && characterId) {
    const stats = await readStatsOrNull(characterId);
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

  await saveTestResult(resultId, { resultValue, rollValue: rollValue ?? null, isApproved });

  // Regra Bíblica: Falha em teste de Fé causa perda de 1d6 de Fé
  if (testType === 'Fé' && !isApproved && characterId) {
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
