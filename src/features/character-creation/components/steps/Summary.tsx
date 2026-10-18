// @ts-nocheck
import React, { useState } from 'react';
import { useCharacterCreationStore } from '../../store/useCharacterCreationStore';
import { useNavigate } from 'react-router';

import { saveCharacter, updateCharacter } from '@/data-access/characters';

export function Summary() {
  const { draft, prevStep, editingId } = useCharacterCreationStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      if (editingId) {
        const { equipment, coins, ...draftWithoutEquipment } = draft;
        await updateCharacter(editingId, draftWithoutEquipment);
      } else {
        await saveCharacter(draft);
      }
      // Success, redirect to home or character view
      navigate('/characters');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar personagem.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-stone-800 p-6 rounded-xl border-2 border-amber-500/30 text-stone-300">
        <h2 className="text-3xl font-serif text-amber-500 mb-6 text-center border-b border-amber-500/20 pb-4">
          {draft.name}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-amber-400 mb-2">Detalhes Principais</h3>
            <p>
              <strong>Tribo:</strong> {draft.tribe}
            </p>
            <p>
              <strong>Vocação:</strong> {draft.vocation}
            </p>
            <p>
              <strong>Fortaleza:</strong> {draft.fortress}
            </p>
            <p>
              <strong>Tentação:</strong> {draft.temptation}
            </p>
          </div>

          <div>
            <h3 className="font-bold text-amber-400 mb-2">Estatísticas</h3>
            <p>
              <strong>PV:</strong> {draft.stats?.pv}
            </p>
            <p>
              <strong>CA:</strong> {draft.stats?.ca}
            </p>
            <p>
              <strong>Fé:</strong> {draft.stats?.faith}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-stone-700 pt-4">
          <h3 className="font-bold text-amber-400 mb-2">Atributos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <span className="whitespace-nowrap">FOR: {draft.attributes?.for}</span>
            <span className="whitespace-nowrap">DES: {draft.attributes?.des}</span>
            <span className="whitespace-nowrap">CON: {draft.attributes?.con}</span>
            <span className="whitespace-nowrap">INT: {draft.attributes?.int}</span>
            <span className="whitespace-nowrap">SAB: {draft.attributes?.sab}</span>
            <span className="whitespace-nowrap">CAR: {draft.attributes?.car}</span>
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 text-center">{error}</p>}

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 mt-8 pt-4 border-t border-stone-700">
        <button
          type="button"
          onClick={prevStep}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-2 border border-stone-600 hover:bg-stone-700 text-stone-300 rounded transition-colors disabled:opacity-50"
        >
          Voltar e Editar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-2 bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold rounded transition-colors disabled:opacity-50 flex justify-center text-center"
        >
          {saving ? 'Salvando...' : 'Confirmar e Salvar'}
        </button>
      </div>
    </div>
  );
}
